import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import * as apiService from '../../services/apiService';

interface StaffShift {
  id: string;
  staffId: string;
  date: string;
  shiftType: string;
  startTime: string;
  endTime: string;
  status: string;
}

export const StaffScheduleScreen = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const [markedDates, setMarkedDates] = useState<{
    [key: string]: { marked: boolean; dotColor: string };
  }>({});
  const [scheduleData, setScheduleData] = useState<StaffShift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    loadUserAndSchedule();
  }, []);

  const loadUserAndSchedule = async () => {
    try {
      setIsLoading(true);
      const user = await apiService.getCurrentUser();
      if (!user) return;
      
      setCurrentUser(user);
      const shifts = await apiService.getStaffShifts(user.id);
      setScheduleData(shifts);
      
      // Build marked dates from shifts
      const marks: { [key: string]: { marked: boolean; dotColor: string } } = {};
      shifts.forEach((shift: StaffShift) => {
        marks[shift.date] = {
          marked: true,
          dotColor: getShiftColor(shift.status),
        };
      });
      setMarkedDates(marks);
    } catch (error) {
      console.error('Error loading schedule:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getShiftColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '#10B981';
      case 'pending':
        return '#FFA500';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#999';
    }
  };

  const getShiftLabel = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Đã xác nhận';
      case 'pending':
        return 'Chờ xác nhận';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const calculateStats = () => {
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    
    const thisMonthShifts = scheduleData.filter(shift => {
      const shiftDate = new Date(shift.date);
      return shiftDate.getMonth() === thisMonth && 
             shiftDate.getFullYear() === thisYear &&
             shift.status === 'confirmed';
    });
    
    const totalHours = thisMonthShifts.reduce((sum, shift) => {
      const start = new Date(`2000-01-01 ${shift.startTime}`);
      const end = new Date(`2000-01-01 ${shift.endTime}`);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      return sum + hours;
    }, 0);
    
    const daysOff = scheduleData.filter(shift => 
      shift.status === 'cancelled' || shift.shiftType === 'leave'
    ).length;
    
    return {
      shiftsThisMonth: thisMonthShifts.length,
      totalHours: Math.round(totalHours),
      daysOff
    };
  };

  const stats = calculateStats();

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={{ marginTop: 16, color: '#666' }}>Đang tải lịch làm việc...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Calendar */}
      <View style={styles.calendarContainer}>
        <Calendar
          onDayPress={(day) => setSelectedDate(day.dateString)}
          markedDates={{
            ...markedDates,
            [selectedDate]: {
              selected: true,
              selectedColor: '#10B981',
              marked: markedDates[selectedDate]?.marked,
            },
          }}
          theme={{
            todayTextColor: '#10B981',
            selectedDayBackgroundColor: '#10B981',
            selectedDayTextColor: '#fff',
            arrowColor: '#10B981',
          }}
        />
      </View>

      {/* Schedule List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lịch làm việc của tôi</Text>

        {scheduleData.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Chưa có lịch làm việc</Text>
          </View>
        ) : (
          scheduleData.map((schedule) => (
            <View key={schedule.id} style={styles.scheduleCard}>
              <View style={styles.scheduleHeader}>
                <View>
                  <Text style={styles.scheduleDate}>{schedule.date}</Text>
                  <Text style={styles.scheduleShift}>{schedule.shiftType}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: `${getShiftColor(schedule.status)}20` },
                  ]}
                >
                  <Text
                    style={[styles.statusText, { color: getShiftColor(schedule.status) }]}
                  >
                    {getShiftLabel(schedule.status)}
                  </Text>
                </View>
              </View>

              <View style={styles.scheduleBody}>
                <View style={styles.timeRow}>
                  <Ionicons name="time-outline" size={20} color="#666" />
                  <Text style={styles.timeText}>{schedule.startTime} - {schedule.endTime}</Text>
                </View>
              </View>

              {schedule.status === 'confirmed' && (
                <TouchableOpacity style={styles.requestLeaveBtn}>
                  <Ionicons name="calendar-outline" size={16} color="#EF4444" />
                  <Text style={styles.requestLeaveText}>Xin nghỉ</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thao tác</Text>

        <TouchableOpacity style={styles.actionCard}>
          <View style={styles.actionLeft}>
            <Ionicons name="add-circle" size={32} color="#10B981" />
            <Text style={styles.actionText}>Đăng ký ca làm</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard}>
          <View style={styles.actionLeft}>
            <Ionicons name="calendar" size={32} color="#3B82F6" />
            <Text style={styles.actionText}>Xem lịch tháng</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard}>
          <View style={styles.actionLeft}>
            <Ionicons name="document-text" size={32} color="#FFA500" />
            <Text style={styles.actionText}>Lịch sử đăng ký</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.shiftsThisMonth}</Text>
          <Text style={styles.statLabel}>Ca làm tháng này</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.totalHours}</Text>
          <Text style={styles.statLabel}>Giờ làm</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.daysOff}</Text>
          <Text style={styles.statLabel}>Ngày nghỉ</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
  },
  calendarContainer: {
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  scheduleCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  scheduleDate: {
    fontSize: 14,
    color: '#666',
  },
  scheduleShift: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 4,
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
  scheduleBody: {
    marginBottom: 12,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  requestLeaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  requestLeaveText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
  actionCard: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionText: {
    fontSize: 16,
    color: '#333',
  },
  statsContainer: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    padding: 24,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 8,
  },
});
