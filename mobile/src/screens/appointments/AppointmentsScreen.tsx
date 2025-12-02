import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  Platform,
  ScrollView
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserAppointments, getCurrentUser } from '../../services/apiService';
import { formatDate, formatCurrency, getStatusLabel, getStatusColor } from '../../utils/formatters';
import type { Appointment } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

type Props = NativeStackScreenProps<any, 'AppointmentsList'>;

type FilterType = 'all' | 'today' | 'thisWeek' | 'thisMonth' | 'custom';

export const AppointmentsScreen: React.FC<Props> = ({ navigation }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const user = await getCurrentUser();
      if (!user) {
        Alert.alert('Lỗi', 'Vui lòng đăng nhập lại');
        return;
      }
      const data = await getUserAppointments(user.id);
      setAppointments(data);
    } catch (error) {
      console.error('Error loading appointments:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách lịch hẹn');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAppointments();
    setRefreshing(false);
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadAppointments();
    });

    loadAppointments();
    return unsubscribe;
  }, [navigation]);

  // Filter appointments based on filter type
  const filteredAppointments = useMemo(() => {
    if (filterType === 'all') {
      return appointments;
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return appointments.filter((app) => {
      try {
        // Handle both string and Date object for app.date
        let appDate: Date;
        if (!app.date) {
          return false; // Skip appointments without date
        }
        
        if (typeof app.date === 'string') {
          // If date is string like "2025-12-02" or "2025-12-02T00:00:00.000Z"
          const dateStr = app.date.split('T')[0]; // Get YYYY-MM-DD part
          const [year, month, day] = dateStr.split('-').map(Number);
          if (isNaN(year) || isNaN(month) || isNaN(day)) {
            return false; // Skip invalid dates
          }
          appDate = new Date(year, month - 1, day);
        } else {
          appDate = new Date(app.date);
        }
        
        if (isNaN(appDate.getTime())) {
          return false; // Skip invalid dates
        }
        
        appDate.setHours(0, 0, 0, 0);

        switch (filterType) {
          case 'today':
            return appDate.getTime() === now.getTime();

          case 'thisWeek': {
            const startOfWeek = new Date(now);
            const dayOfWeek = startOfWeek.getDay();
            const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            startOfWeek.setDate(now.getDate() - daysToMonday);
            startOfWeek.setHours(0, 0, 0, 0);

            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            endOfWeek.setHours(23, 59, 59, 999);

            return appDate >= startOfWeek && appDate <= endOfWeek;
          }

          case 'thisMonth': {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
            return appDate >= startOfMonth && appDate <= endOfMonth;
          }

          case 'custom': {
            const customDate = new Date(selectedDate);
            customDate.setHours(0, 0, 0, 0);
            return appDate.getTime() === customDate.getTime();
          }

          default:
            return true;
        }
      } catch (error) {
        console.error('Error filtering appointment:', error, app);
        return false; // Skip appointments that cause errors
      }
    });
  }, [appointments, filterType, selectedDate]);

  // Pagination
  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
  const paginatedAppointments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAppointments.slice(startIndex, endIndex);
  }, [filteredAppointments, currentPage, itemsPerPage]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, selectedDate]);

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (date) {
      setSelectedDate(date);
      setFilterType('custom');
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  const renderAppointmentCard = ({ item }: { item: Appointment }) => {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('AppointmentDetail', { id: item.id })}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.serviceName}>{item.serviceName}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) }
            ]}
          >
            <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.infoText}>{formatDate(item.date)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.infoText}>{item.time}</Text>
          </View>

          {item.therapist && (
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={16} color="#666" />
              <Text style={styles.infoText}>{item.therapist}</Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Ionicons name="pricetag-outline" size={16} color="#666" />
            <Text style={styles.priceText}>
              {formatCurrency(item.price || item.Service?.price || 0)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lịch hẹn của tôi</Text>
      </View>

      {/* Filter Section */}
      <View style={styles.filterContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          <TouchableOpacity
            style={[styles.filterButton, filterType === 'all' && styles.filterButtonActive]}
            onPress={() => setFilterType('all')}
          >
            <Text style={[styles.filterButtonText, filterType === 'all' && styles.filterButtonTextActive]}>
              Tất cả
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, filterType === 'today' && styles.filterButtonActive]}
            onPress={() => setFilterType('today')}
          >
            <Text style={[styles.filterButtonText, filterType === 'today' && styles.filterButtonTextActive]}>
              Hôm nay
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, filterType === 'thisWeek' && styles.filterButtonActive]}
            onPress={() => setFilterType('thisWeek')}
          >
            <Text style={[styles.filterButtonText, filterType === 'thisWeek' && styles.filterButtonTextActive]}>
              Tuần này
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, filterType === 'thisMonth' && styles.filterButtonActive]}
            onPress={() => setFilterType('thisMonth')}
          >
            <Text style={[styles.filterButtonText, filterType === 'thisMonth' && styles.filterButtonTextActive]}>
              Tháng này
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, filterType === 'custom' && styles.filterButtonActive]}
            onPress={() => {
              if (Platform.OS === 'ios') {
                setShowDatePicker(true);
              } else {
                setShowDatePicker(true);
              }
            }}
          >
            <Ionicons name="calendar-outline" size={16} color={filterType === 'custom' ? '#fff' : '#666'} />
            <Text style={[styles.filterButtonText, filterType === 'custom' && styles.filterButtonTextActive]}>
              Chọn ngày
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Date Picker Modal */}
      {Platform.OS === 'ios' && showDatePicker && (
        <Modal
          transparent={true}
          animationType="slide"
          visible={showDatePicker}
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.datePickerModal}>
            <View style={styles.datePickerContainer}>
              <View style={styles.datePickerHeader}>
                <Text style={styles.datePickerTitle}>Chọn ngày</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
              />
              <TouchableOpacity
                style={styles.datePickerConfirm}
                onPress={() => {
                  setFilterType('custom');
                  setShowDatePicker(false);
                }}
              >
                <Text style={styles.datePickerConfirmText}>Xác nhận</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Android Date Picker */}
      {Platform.OS === 'android' && showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      {/* Results Count */}
      {filteredAppointments.length > 0 && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsText}>
            Hiển thị {paginatedAppointments.length} / {filteredAppointments.length} lịch hẹn
          </Text>
        </View>
      )}

      {filteredAppointments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>
            {filterType === 'all' ? 'Không có lịch hẹn nào' : 'Không có lịch hẹn trong khoảng thời gian này'}
          </Text>
        </View>
      ) : (
        <>
          <FlatList
            data={paginatedAppointments}
            renderItem={renderAppointmentCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            scrollEventThrottle={16}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <View style={styles.paginationContainer}>
              <TouchableOpacity
                style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
                onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <Ionicons name="chevron-back" size={20} color={currentPage === 1 ? '#ccc' : '#8b5cf6'} />
                <Text style={[styles.paginationButtonText, currentPage === 1 && styles.paginationButtonTextDisabled]}>
                  Trước
                </Text>
              </TouchableOpacity>

              <Text style={styles.paginationText}>
                Trang {currentPage} / {totalPages}
              </Text>

              <TouchableOpacity
                style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
                onPress={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                <Text style={[styles.paginationButtonText, currentPage === totalPages && styles.paginationButtonTextDisabled]}>
                  Sau
                </Text>
                <Ionicons name="chevron-forward" size={20} color={currentPage === totalPages ? '#ccc' : '#8b5cf6'} />
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 20
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff'
  },
  list: {
    padding: 16,
    gap: 12
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600'
  },
  cardBody: {
    padding: 16,
    gap: 8
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  infoText: {
    fontSize: 14,
    color: '#666'
  },
  priceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8b5cf6'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
    marginBottom: 24
  },
  bookButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
    gap: 6
  },
  filterButtonActive: {
    backgroundColor: '#8b5cf6'
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500'
  },
  filterButtonTextActive: {
    color: '#fff',
    fontWeight: '600'
  },
  resultsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa'
  },
  resultsText: {
    fontSize: 12,
    color: '#666'
  },
  datePickerModal: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  datePickerContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333'
  },
  datePickerConfirm: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16
  },
  datePickerConfirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0'
  },
  paginationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4
  },
  paginationButtonDisabled: {
    opacity: 0.5
  },
  paginationButtonText: {
    fontSize: 14,
    color: '#8b5cf6',
    fontWeight: '600'
  },
  paginationButtonTextDisabled: {
    color: '#ccc'
  },
  paginationText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500'
  }
});
