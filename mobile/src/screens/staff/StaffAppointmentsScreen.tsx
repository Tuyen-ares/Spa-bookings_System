import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as apiService from '../../services/apiService';
import { Appointment, User } from '../../types';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { EmptyState } from '../../components/EmptyState';
import { formatDate, formatTime, formatCurrency } from '../../utils/formatters';

export const StaffAppointmentsScreen = () => {
  const [user, setUser] = useState<User | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('upcoming');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadAppointments();
    }
  }, [user]);

  useEffect(() => {
    filterAppointments();
  }, [appointments, selectedFilter]);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Failed to load user:', error);
    }
  };

  const loadAppointments = async () => {
    try {
      const data = await apiService.getAppointments();
      
      // Filter appointments for current staff
      const myAppointments = data.filter((a) => a.staffId === user?.id);
      
      // Sort by date
      const sorted = myAppointments.sort(
        (a, b) => new Date(a.appointmentDate || a.date).getTime() - new Date(b.appointmentDate || b.date).getTime()
      );
      
      setAppointments(sorted);
    } catch (error) {
      console.error('Failed to load appointments:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách lịch hẹn');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const filterAppointments = () => {
    const now = new Date();
    let filtered = appointments;

    switch (selectedFilter) {
      case 'upcoming':
        filtered = appointments.filter(
          (a) =>
            new Date(a.appointmentDate || a.date) >= now &&
            (a.status === 'confirmed' || a.status === 'pending' || a.status === 'upcoming')
        );
        break;
      case 'today':
        const today = now.toDateString();
        filtered = appointments.filter(
          (a) => new Date(a.appointmentDate || a.date).toDateString() === today
        );
        break;
      case 'completed':
        filtered = appointments.filter((a) => a.status === 'completed');
        break;
      case 'all':
        filtered = appointments;
        break;
    }

    setFilteredAppointments(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAppointments();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FFA500';
      case 'confirmed':
        return '#3B82F6';
      case 'completed':
        return '#10B981';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#999';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Chờ xác nhận';
      case 'confirmed':
        return 'Đã xác nhận';
      case 'completed':
        return 'Hoàn thành';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const handleCheckIn = (appointmentId: string | number) => {
    Alert.alert('Check-in', 'Xác nhận khách hàng đã đến?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xác nhận',
        onPress: () => {
          // TODO: Call API to update appointment status
          Alert.alert('Thành công', 'Đã check-in khách hàng');
        },
      },
    ]);
  };

  const handleComplete = (appointmentId: string | number) => {
    Alert.alert('Hoàn thành', 'Đánh dấu dịch vụ đã hoàn thành?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Hoàn thành',
        onPress: () => {
          // TODO: Call API to update appointment status
          Alert.alert('Thành công', 'Đã hoàn thành dịch vụ');
        },
      },
    ]);
  };

  const renderAppointment = ({ item }: { item: Appointment }) => (
    <View style={styles.appointmentCard}>
      <View style={styles.cardHeader}>
        <View style={styles.dateContainer}>
          <Ionicons name="calendar" size={16} color="#10B981" />
          <Text style={styles.dateText}>{formatDate(item.appointmentDate || item.date)}</Text>
          <Text style={styles.timeText}>{formatTime(item.appointmentDate || item.date)}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: `${getStatusColor(item.status)}20` },
          ]}
        >
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusLabel(item.status)}
          </Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={16} color="#666" />
          <Text style={styles.infoText}>{item.User?.name || 'Khách hàng'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="cut-outline" size={16} color="#666" />
          <Text style={styles.infoText}>{item.Service?.name || 'Dịch vụ'}</Text>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Giá:</Text>
          <Text style={styles.priceValue}>{formatCurrency(item.totalPrice || item.price || 0)}</Text>
        </View>

        {item.notes && (
          <View style={styles.notesContainer}>
            <Ionicons name="document-text-outline" size={16} color="#666" />
            <Text style={styles.notesText}>{item.notes}</Text>
          </View>
        )}
      </View>

      {item.status === 'confirmed' && (
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.checkInBtn]}
            onPress={() => handleCheckIn(item.id)}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
            <Text style={styles.actionBtnText}>Check-in</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.completeBtn]}
            onPress={() => handleComplete(item.id)}
          >
            <Ionicons name="checkmark-done-outline" size={18} color="#fff" />
            <Text style={styles.actionBtnText}>Hoàn thành</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {[
          { key: 'upcoming', label: 'Sắp tới' },
          { key: 'today', label: 'Hôm nay' },
          { key: 'completed', label: 'Đã xong' },
          { key: 'all', label: 'Tất cả' },
        ].map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterTab,
              selectedFilter === filter.key && styles.filterTabActive,
            ]}
            onPress={() => setSelectedFilter(filter.key)}
          >
            <Text
              style={[
                styles.filterTabText,
                selectedFilter === filter.key && styles.filterTabTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <Text style={styles.statsText}>{filteredAppointments.length} lịch hẹn</Text>
      </View>

      {/* Appointments List */}
      <FlatList
        data={filteredAppointments}
        renderItem={renderAppointment}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <EmptyState
            icon="calendar-outline"
            title="Không có lịch hẹn"
            message="Chưa có lịch hẹn nào"
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
  filterContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: '#10B981',
  },
  filterTabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: '#fff',
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
  appointmentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  timeText: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardContent: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  notesText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  checkInBtn: {
    backgroundColor: '#3B82F6',
  },
  completeBtn: {
    backgroundColor: '#10B981',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
