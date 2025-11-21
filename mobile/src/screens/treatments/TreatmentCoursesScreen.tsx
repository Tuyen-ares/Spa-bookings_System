import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { getTreatmentCourses, getCurrentUser } from '../../services/apiService';
import type { TreatmentCourse } from '../../types';
import { formatDate, getStatusColor, getStatusLabel } from '../../utils/formatters';

const PAYMENT_COLORS: Record<'Paid' | 'Unpaid', string> = {
  Paid: '#10b981',
  Unpaid: '#f97316'
};

type Props = NativeStackScreenProps<any, 'TreatmentCourses'>;

export const TreatmentCoursesScreen: React.FC<Props> = ({ navigation }) => {
  const [courses, setCourses] = useState<TreatmentCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadCourses = useCallback(async () => {
    try {
      setLoading(true);
      const user = await getCurrentUser();
      const params = user?.role === 'Client' ? { clientId: user.id } : undefined;
      const data = await getTreatmentCourses(params);
      setCourses(data);
    } catch (error) {
      console.error('Error loading treatment courses:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách liệu trình');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCourses();
    setRefreshing(false);
  }, [loadCourses]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadCourses);
    loadCourses();
    return unsubscribe;
  }, [navigation, loadCourses]);

  const renderCourse = ({ item }: { item: TreatmentCourse }) => {
    const progress = item.totalSessions ? (item.completedSessions / item.totalSessions) * 100 : 0;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => navigation.navigate('TreatmentCourseDetail', { id: item.id })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.serviceName}>{item.serviceName}</Text>
            <Text style={styles.courseCode}>Mã liệu trình: {item.id.slice(-6).toUpperCase()}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) }
            ]}
          >
            <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
          </View>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Tiến độ</Text>
            <Text style={styles.progressValue}>
              {item.completedSessions}/{item.totalSessions} buổi
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={16} color="#6b7280" />
            <View>
              <Text style={styles.metaLabel}>Ngày bắt đầu</Text>
              <Text style={styles.metaValue}>{formatDate(item.startDate)}</Text>
            </View>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="hourglass-outline" size={16} color="#6b7280" />
            <View>
              <Text style={styles.metaLabel}>Hạn sử dụng</Text>
              <Text style={styles.metaValue}>{formatDate(item.expiryDate)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.paymentRow}>
          <View style={styles.paymentBadge}>
            <Ionicons
              name={item.paymentStatus === 'Paid' ? 'checkmark-circle' : 'alert-circle'}
              size={18}
              color={PAYMENT_COLORS[item.paymentStatus]}
            />
            <Text
              style={[
                styles.paymentText,
                { color: PAYMENT_COLORS[item.paymentStatus] }
              ]}
            >
              {item.paymentStatus === 'Paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
            </Text>
          </View>
          <View style={styles.navigateRow}>
            <Text style={styles.navigateLabel}>Xem chi tiết</Text>
            <Ionicons name="chevron-forward" size={16} color="#8b5cf6" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Liệu trình của tôi</Text>
        <Text style={styles.headerSubtitle}>
          Theo dõi tiến độ và lịch sử chăm sóc da của bạn
        </Text>
      </View>

      {courses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="leaf-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyTitle}>Chưa có liệu trình nào</Text>
          <Text style={styles.emptySubtitle}>
            Các liệu trình đã mua sẽ xuất hiện tại đây
          </Text>
        </View>
      ) : (
        <FlatList
          data={courses}
          keyExtractor={(item) => item.id}
          renderItem={renderCourse}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  header: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingTop: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff'
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fce7f3',
    marginTop: 6
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa'
  },
  list: {
    padding: 20,
    gap: 16
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16
  },
  cardHeaderLeft: {
    flex: 1,
    paddingRight: 12
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937'
  },
  courseCode: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600'
  },
  progressSection: {
    marginBottom: 16
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  progressLabel: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827'
  },
  progressBar: {
    height: 10,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8b5cf6'
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1
  },
  metaLabel: {
    fontSize: 12,
    color: '#9ca3af'
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827'
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  paymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  paymentText: {
    fontSize: 14,
    fontWeight: '600'
  },
  navigateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  navigateLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8b5cf6'
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    marginTop: 16
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center'
  }
});
