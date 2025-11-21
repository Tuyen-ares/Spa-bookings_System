import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as apiService from '../../services/apiService';
import { User } from '../../types';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { EmptyState } from '../../components/EmptyState';

interface ClientWithHistory extends User {
  totalAppointments?: number;
  lastVisit?: string;
  totalSpent?: number;
}

export const StaffClientsScreen = () => {
  const [staffUser, setStaffUser] = useState<User | null>(null);
  const [clients, setClients] = useState<ClientWithHistory[]>([]);
  const [filteredClients, setFilteredClients] = useState<ClientWithHistory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (staffUser) {
      loadClients();
    }
  }, [staffUser]);

  useEffect(() => {
    filterClients();
  }, [clients, searchQuery]);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setStaffUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Failed to load user:', error);
    }
  };

  const loadClients = async () => {
    try {
      // Get all appointments for this staff
      const appointments = await apiService.getAppointments();
      const myAppointments = appointments.filter((a) => a.staffId === staffUser?.id);

      // Get unique clients
      const clientsMap = new Map<number, ClientWithHistory>();

      myAppointments.forEach((appointment) => {
        if (appointment.User) {
          const clientId = Number(appointment.User.id) || appointment.User.id as any;
          const existingClient = clientsMap.get(clientId as number);

          if (existingClient) {
            existingClient.totalAppointments = (existingClient.totalAppointments || 0) + 1;
            existingClient.totalSpent =
              (existingClient.totalSpent || 0) + (appointment.totalPrice || appointment.price || 0);

            // Update last visit if more recent
            if (
              !existingClient.lastVisit ||
              new Date(appointment.appointmentDate || appointment.date) >
                new Date(existingClient.lastVisit)
            ) {
              existingClient.lastVisit = appointment.appointmentDate || appointment.date;
            }
          } else {
            clientsMap.set(clientId as number, {
              ...appointment.User,
              totalAppointments: 1,
              lastVisit: appointment.appointmentDate || appointment.date,
              totalSpent: appointment.totalPrice || appointment.price || 0,
            });
          }
        }
      });

      const clientsList = Array.from(clientsMap.values());
      clientsList.sort((a, b) => (b.totalAppointments || 0) - (a.totalAppointments || 0));

      setClients(clientsList);
    } catch (error) {
      console.error('Failed to load clients:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách khách hàng');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const filterClients = () => {
    if (searchQuery) {
      setFilteredClients(
        clients.filter(
          (c) =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.email.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    } else {
      setFilteredClients(clients);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadClients();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const renderClient = ({ item }: { item: ClientWithHistory }) => (
    <TouchableOpacity style={styles.clientCard}>
      <View style={styles.clientAvatar}>
        <Ionicons name="person" size={32} color="#10B981" />
      </View>

      <View style={styles.clientInfo}>
        <Text style={styles.clientName}>{item.name}</Text>
        <Text style={styles.clientEmail}>{item.email}</Text>
        {item.phone && (
          <Text style={styles.clientPhone}>
            <Ionicons name="call-outline" size={12} color="#666" /> {item.phone}
          </Text>
        )}

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="calendar-outline" size={14} color="#10B981" />
            <Text style={styles.statText}>{item.totalAppointments || 0} lần</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="cash-outline" size={14} color="#10B981" />
            <Text style={styles.statText}>
              {formatCurrency(item.totalSpent || 0)}
            </Text>
          </View>
        </View>

        {item.lastVisit && (
          <Text style={styles.lastVisit}>
            Lần cuối: {formatDate(item.lastVisit)}
          </Text>
        )}
      </View>

      <TouchableOpacity style={styles.detailBtn}>
        <Ionicons name="chevron-forward" size={20} color="#999" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBar}>
        <View style={styles.searchInput}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchText}
            placeholder="Tìm kiếm khách hàng..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <Text style={styles.statsText}>{filteredClients.length} khách hàng</Text>
      </View>

      {/* Clients List */}
      <FlatList
        data={filteredClients}
        renderItem={renderClient}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title="Chưa có khách hàng"
            message="Bạn chưa phục vụ khách hàng nào"
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchBar: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  searchText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  stats: {
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statsText: {
    fontSize: 14,
    color: '#666',
  },
  listContent: {
    padding: 16,
  },
  clientCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  clientAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  clientEmail: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  clientPhone: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 4,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#666',
  },
  lastVisit: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  detailBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
