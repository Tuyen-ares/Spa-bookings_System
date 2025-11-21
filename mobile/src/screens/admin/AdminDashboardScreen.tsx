import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as apiService from '../../services/apiService';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { formatCurrency } from '../../utils/formatters';

interface DashboardStats {
  totalRevenue: number;
  totalAppointments: number;
  totalUsers: number;
  totalServices: number;
  todayAppointments: number;
  pendingAppointments: number;
  completedAppointments: number;
  recentAppointments: any[];
}

export const AdminDashboardScreen = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [appointmentsData, usersData, servicesData] = await Promise.all([
        apiService.getAppointments(),
        apiService.getUsers(),
        apiService.getServices(),
      ]);

      const today = new Date().toISOString().split('T')[0];
      const todayAppts = appointmentsData.filter((a: any) => a.date === today);
      const pending = appointmentsData.filter((a: any) => a.status === 'pending');
      const completed = appointmentsData.filter((a: any) => a.status === 'completed');

      const totalRevenue = appointmentsData
        .filter((a: any) => a.status === 'completed')
        .reduce((sum: number, a: any) => sum + (a.totalPrice || a.price || 0), 0);

      setStats({
        totalRevenue,
        totalAppointments: appointmentsData.length,
        totalUsers: usersData.length,
        totalServices: servicesData.length,
        todayAppointments: todayAppts.length,
        pendingAppointments: pending.length,
        completedAppointments: completed.length,
        recentAppointments: appointmentsData.slice(0, 5),
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Tổng Quan</Text>
        <Text style={styles.subtitle}>Dashboard quản trị</Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: '#EF4444' }]}>
          <Ionicons name="cash" size={32} color="#fff" />
          <Text style={styles.statValue}>{formatCurrency(stats?.totalRevenue || 0)}</Text>
          <Text style={styles.statLabel}>Doanh Thu</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: '#8B5CF6' }]}>
          <Ionicons name="calendar" size={32} color="#fff" />
          <Text style={styles.statValue}>{stats?.totalAppointments || 0}</Text>
          <Text style={styles.statLabel}>Lịch Hẹn</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: '#10B981' }]}>
          <Ionicons name="people" size={32} color="#fff" />
          <Text style={styles.statValue}>{stats?.totalUsers || 0}</Text>
          <Text style={styles.statLabel}>Người Dùng</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: '#F59E0B' }]}>
          <Ionicons name="cube" size={32} color="#fff" />
          <Text style={styles.statValue}>{stats?.totalServices || 0}</Text>
          <Text style={styles.statLabel}>Dịch Vụ</Text>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thống Kê Nhanh</Text>
        
        <View style={styles.quickStatsRow}>
          <View style={styles.quickStat}>
            <View style={[styles.quickStatIcon, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="today" size={24} color="#3B82F6" />
            </View>
            <View style={styles.quickStatInfo}>
              <Text style={styles.quickStatValue}>{stats?.todayAppointments || 0}</Text>
              <Text style={styles.quickStatLabel}>Hôm nay</Text>
            </View>
          </View>

          <View style={styles.quickStat}>
            <View style={[styles.quickStatIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="hourglass" size={24} color="#F59E0B" />
            </View>
            <View style={styles.quickStatInfo}>
              <Text style={styles.quickStatValue}>{stats?.pendingAppointments || 0}</Text>
              <Text style={styles.quickStatLabel}>Chờ xử lý</Text>
            </View>
          </View>
        </View>

        <View style={styles.quickStatsRow}>
          <View style={styles.quickStat}>
            <View style={[styles.quickStatIcon, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            </View>
            <View style={styles.quickStatInfo}>
              <Text style={styles.quickStatValue}>{stats?.completedAppointments || 0}</Text>
              <Text style={styles.quickStatLabel}>Hoàn thành</Text>
            </View>
          </View>

          <View style={styles.quickStat}>
            <View style={[styles.quickStatIcon, { backgroundColor: '#FCE7F3' }]}>
              <Ionicons name="trending-up" size={24} color="#EC4899" />
            </View>
            <View style={styles.quickStatInfo}>
              <Text style={styles.quickStatValue}>
                {stats?.totalAppointments 
                  ? ((stats.completedAppointments / stats.totalAppointments) * 100).toFixed(0) 
                  : 0}%
              </Text>
              <Text style={styles.quickStatLabel}>Tỷ lệ</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Recent Appointments */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lịch Hẹn Gần Đây</Text>
        {stats?.recentAppointments.map((appt: any) => (
          <View key={appt.id} style={styles.appointmentCard}>
            <View style={styles.appointmentHeader}>
              <Text style={styles.appointmentService}>{appt.serviceName || 'Dịch vụ'}</Text>
              <View style={[styles.statusBadge, getStatusColor(appt.status)]}>
                <Text style={styles.statusText}>{getStatusLabel(appt.status)}</Text>
              </View>
            </View>
            <View style={styles.appointmentInfo}>
              <Text style={styles.appointmentDetail}>
                <Ionicons name="calendar-outline" size={14} color="#666" /> {appt.date}
              </Text>
              <Text style={styles.appointmentDetail}>
                <Ionicons name="time-outline" size={14} color="#666" /> {appt.time}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return { backgroundColor: '#D1FAE5' };
    case 'pending':
      return { backgroundColor: '#FEF3C7' };
    case 'cancelled':
      return { backgroundColor: '#FEE2E2' };
    default:
      return { backgroundColor: '#E5E7EB' };
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'completed':
      return 'Hoàn thành';
    case 'pending':
      return 'Chờ xử lý';
    case 'cancelled':
      return 'Đã hủy';
    case 'upcoming':
      return 'Sắp tới';
    default:
      return status;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#8B5CF6',
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#E9D5FF',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
  },
  statLabel: {
    fontSize: 12,
    color: '#fff',
    marginTop: 4,
    opacity: 0.9,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  quickStatsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  quickStat: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quickStatIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  quickStatInfo: {
    flex: 1,
  },
  quickStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  quickStatLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  appointmentCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  appointmentService: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  appointmentInfo: {
    flexDirection: 'row',
    gap: 16,
  },
  appointmentDetail: {
    fontSize: 13,
    color: '#666',
  },
});
