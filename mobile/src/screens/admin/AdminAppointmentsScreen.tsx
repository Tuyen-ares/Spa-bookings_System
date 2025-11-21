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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import * as apiService from '../../services/apiService';
import { Appointment } from '../../types';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { EmptyState } from '../../components/EmptyState';
import { formatCurrency, formatDate, formatTime } from '../../utils/formatters';

export const AdminAppointmentsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAppointments();
  }, []);

  useEffect(() => {
    filterAppointments();
  }, [appointments, selectedStatus]);

  const loadAppointments = async () => {
    try {
      const data = await apiService.getAppointments();
      // Sort by date descending
      const sorted = data.sort((a, b) => 
        new Date(b.appointmentDate || b.date).getTime() - new Date(a.appointmentDate || a.date).getTime()
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
    if (selectedStatus === 'all') {
      setFilteredAppointments(appointments);
    } else {
      setFilteredAppointments(
        appointments.filter((a) => a.status === selectedStatus)
      );
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAppointments();
  };

  const handleConfirmAppointment = async (appointmentId: string) => {
    try {
      await apiService.updateAppointment(appointmentId, { status: 'upcoming' });
      Alert.alert('Thành công', 'Đã xác nhận lịch hẹn');
      loadAppointments();
    } catch (error) {
      console.error('Failed to confirm appointment:', error);
      Alert.alert('Lỗi', 'Không thể xác nhận lịch hẹn');
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    Alert.alert(
      'Hủy lịch hẹn',
      'Bạn có chắc chắn muốn hủy lịch hẹn này?',
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Hủy lịch',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.updateAppointment(appointmentId, { status: 'cancelled' });
              Alert.alert('Thành công', 'Đã hủy lịch hẹn');
              loadAppointments();
            } catch (error) {
              console.error('Failed to cancel appointment:', error);
              Alert.alert('Lỗi', 'Không thể hủy lịch hẹn');
            }
          }
        }
      ]
    );
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

  const renderAppointment = ({ item }: { item: Appointment }) => (
    <TouchableOpacity 
      style={styles.appointmentCard}
      onPress={() => navigation.navigate('AppointmentDetail', { id: item.id })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.dateContainer}>
          <Ionicons name="calendar" size={16} color="#8B5CF6" />
          <Text style={styles.dateText}>{formatDate(item.appointmentDate || item.date)}</Text>
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
        {/* Customer Info */}
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={16} color="#666" />
          <Text style={styles.infoText}>
            {item.User?.name || 'Khách hàng'}
          </Text>
        </View>

        {/* Service Info */}
        <View style={styles.infoRow}>
          <Ionicons name="cut-outline" size={16} color="#666" />
          <Text style={styles.infoText}>
            {item.Service?.name || 'Dịch vụ'}
          </Text>
        </View>

        {/* Treatment Course Info */}
        {item.TreatmentSession?.TreatmentCourse && (
          <View style={styles.treatmentBadge}>
            <Ionicons name="fitness-outline" size={14} color="#8b5cf6" />
            <Text style={styles.treatmentText}>
              Liệu trình - Buổi {item.TreatmentSession.sessionNumber}/{item.TreatmentSession.TreatmentCourse.totalSessions}
            </Text>
          </View>
        )}

        {/* Time */}
        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={16} color="#666" />
          <Text style={styles.infoText}>{formatTime(item.appointmentDate || item.date)}</Text>
        </View>

        {/* Staff */}
        {item.Staff && (
          <View style={styles.infoRow}>
            <Ionicons name="person-circle-outline" size={16} color="#666" />
            <Text style={styles.infoText}>NV: {item.Staff.name}</Text>
          </View>
        )}

        {/* Price */}
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>
            {item.TreatmentSession?.TreatmentCourse ? 'Giá/buổi:' : 'Giá:'}
          </Text>
          <Text style={styles.priceValue}>
            {formatCurrency(item.totalPrice || item.price || item.Service?.price || 0)}
          </Text>
        </View>
        {item.TreatmentSession?.TreatmentCourse && (
          <View style={styles.priceRow}>
            <Text style={styles.totalLabel}>Tổng:</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(
                (item.totalPrice || item.price || item.Service?.price || 0) * 
                item.TreatmentSession.TreatmentCourse.totalSessions
              )}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.cardActions}>
        {item.status === 'pending' && (
          <>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.confirmBtn]}
              onPress={() => handleConfirmAppointment(item.id)}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>Xác nhận</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.cancelBtn]}
              onPress={() => handleCancelAppointment(item.id)}
            >
              <Ionicons name="close-circle-outline" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>Hủy</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      {/* Status Filter */}
      <View style={styles.filterContainer}>
        {[
          { key: 'all', label: 'Tất cả' },
          { key: 'pending', label: 'Chờ' },
          { key: 'confirmed', label: 'Đã xác nhận' },
          { key: 'completed', label: 'Hoàn thành' },
          { key: 'cancelled', label: 'Đã hủy' },
        ].map((status) => (
          <TouchableOpacity
            key={status.key}
            style={[
              styles.filterChip,
              selectedStatus === status.key && styles.filterChipActive,
            ]}
            onPress={() => setSelectedStatus(status.key)}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedStatus === status.key && styles.filterChipTextActive,
              ]}
            >
              {status.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <Text style={styles.statsText}>
          {filteredAppointments.length} lịch hẹn
        </Text>
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
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  filterChipActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  filterChipTextActive: {
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
    color: '#8B5CF6',
  },
  treatmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  treatmentText: {
    fontSize: 12,
    color: '#8b5cf6',
    fontWeight: '600',
    marginLeft: 4,
  },
  totalLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10b981',
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
  confirmBtn: {
    backgroundColor: '#10B981',
  },
  cancelBtn: {
    backgroundColor: '#EF4444',
  },
  completeBtn: {
    backgroundColor: '#8B5CF6',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
