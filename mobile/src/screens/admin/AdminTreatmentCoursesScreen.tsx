import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import {
  getTreatmentCourses,
  confirmTreatmentCoursePayment
} from '../../services/apiService';
import type { TreatmentCourse } from '../../types';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { EmptyState } from '../../components/EmptyState';
import { formatDate, getStatusColor, getStatusLabel, formatCurrency } from '../../utils/formatters';

type Props = NativeStackScreenProps<any, 'AdminTreatmentCourses'>;

type StatusFilter = 'all' | TreatmentCourse['status'];
type PaymentFilter = 'all' | TreatmentCourse['paymentStatus'];

const STATUS_OPTIONS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'active', label: 'Đang diễn ra' },
  { key: 'pending', label: 'Chờ kích hoạt' },
  { key: 'completed', label: 'Hoàn thành' },
  { key: 'expired', label: 'Hết hạn' },
  { key: 'cancelled', label: 'Đã hủy' }
];

const PAYMENT_OPTIONS: { key: PaymentFilter; label: string }[] = [
  { key: 'all', label: 'Thanh toán (tất cả)' },
  { key: 'Paid', label: 'Đã thanh toán' },
  { key: 'Unpaid', label: 'Chưa thanh toán' }
];

export const AdminTreatmentCoursesScreen: React.FC<Props> = ({ navigation }) => {
  const [courses, setCourses] = useState<TreatmentCourse[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionCourseId, setActionCourseId] = useState<string | null>(null);

  const loadCourses = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getTreatmentCourses();
      const sorted = data.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
      setCourses(sorted);
    } catch (error) {
      console.error('Error loading treatment courses:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách liệu trình');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const statusMatch = statusFilter === 'all' || course.status === statusFilter;
      const paymentMatch = paymentFilter === 'all' || course.paymentStatus === paymentFilter;
      return statusMatch && paymentMatch;
    });
  }, [courses, statusFilter, paymentFilter]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadCourses();
  };

  const handleConfirmPayment = (courseId: string) => {
    Alert.alert(
      'Xác nhận thanh toán',
      'Bạn chắc chắn muốn đánh dấu liệu trình này đã thanh toán?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          style: 'default',
          onPress: async () => {
            try {
              setActionCourseId(courseId);
              await confirmTreatmentCoursePayment(courseId);
              await loadCourses();
            } catch (error) {
              console.error('Error confirming payment:', error);
              Alert.alert('Lỗi', 'Không thể cập nhật trạng thái thanh toán');
            } finally {
              setActionCourseId(null);
            }
          }
        }
      ]
    );
  };

  const renderCourse = ({ item }: { item: TreatmentCourse }) => {
    const progress = item.totalSessions ? Math.round((item.completedSessions / item.totalSessions) * 100) : 0;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => navigation.navigate('AdminTreatmentCourseDetail', { id: item.id })}
      >
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.serviceName}>{item.serviceName}</Text>
            <Text style={styles.clientName}>{item.Client?.name || 'Khách hàng'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}25` }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {getStatusLabel(item.status)}
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={16} color="#6b7280" />
            <Text style={styles.metaValue}>{formatDate(item.startDate)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="hourglass-outline" size={16} color="#6b7280" />
            <Text style={styles.metaValue}>{formatDate(item.expiryDate)}</Text>
          </View>
        </View>

        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>Tiến độ</Text>
          <Text style={styles.progressValue}>
            {item.completedSessions}/{item.totalSessions} buổi ({progress}%)
          </Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>

        <View style={styles.paymentRow}>
          <View style={[styles.paymentBadge, item.paymentStatus === 'Paid' ? styles.paymentPaid : styles.paymentUnpaid]}>
            <Ionicons
              name={item.paymentStatus === 'Paid' ? 'checkmark-circle' : 'alert-circle'}
              size={16}
              color={item.paymentStatus === 'Paid' ? '#047857' : '#b45309'}
            />
            <Text style={item.paymentStatus === 'Paid' ? styles.paymentTextPaid : styles.paymentTextUnpaid}>
              {item.paymentStatus === 'Paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
            </Text>
          </View>
          <Text style={styles.priceText}>{formatCurrency(item.Service?.price || 0)}</Text>
        </View>

        {item.paymentStatus === 'Unpaid' && (
          <TouchableOpacity
            style={[styles.actionButton, actionCourseId === item.id && styles.actionButtonDisabled]}
            onPress={() => handleConfirmPayment(item.id)}
            disabled={actionCourseId === item.id}
          >
            <Ionicons name="receipt-outline" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>
              {actionCourseId === item.id ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.filtersPanel}>
        <ScrollChips
          options={STATUS_OPTIONS}
          selectedKey={statusFilter}
          onSelect={(key: StatusFilter) => setStatusFilter(key)}
        />
        <ScrollChips
          options={PAYMENT_OPTIONS}
          selectedKey={paymentFilter}
          onSelect={(key: PaymentFilter) => setPaymentFilter(key)}
          compact
        />
      </View>

      <FlatList
        data={filteredCourses}
        keyExtractor={(item) => item.id}
        renderItem={renderCourse}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="leaf-outline"
            title="Không có liệu trình"
            message="Chưa có liệu trình nào thỏa điều kiện lọc"
          />
        }
      />
    </View>
  );
};

interface ChipProps<T extends string> {
  options: { key: T; label: string }[];
  selectedKey: T;
  onSelect: (key: T) => void;
  compact?: boolean;
}

const ScrollChips = <T extends string>({ options, selectedKey, onSelect, compact }: ChipProps<T>) => {
  return (
    <View style={[styles.chipsRow, compact && { marginTop: 8 }]}>
      {options.map((option) => (
        <TouchableOpacity
          key={option.key}
          style={[styles.chip, selectedKey === option.key && styles.chipActive]}
          onPress={() => onSelect(option.key)}
        >
          <Text
            style={[styles.chipText, selectedKey === option.key && styles.chipTextActive]}
          >
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6'
  },
  filtersPanel: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff'
  },
  chipActive: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6'
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280'
  },
  chipTextActive: {
    color: '#fff'
  },
  listContent: {
    padding: 16
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827'
  },
  clientName: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600'
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  metaValue: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500'
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  progressLabel: {
    fontSize: 12,
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827'
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    marginTop: 8,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8b5cf6'
  },
  paymentRow: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  paymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12
  },
  paymentPaid: {
    backgroundColor: '#d1fae5'
  },
  paymentUnpaid: {
    backgroundColor: '#fee2e2'
  },
  paymentTextPaid: {
    color: '#047857',
    fontWeight: '600'
  },
  paymentTextUnpaid: {
    color: '#b45309',
    fontWeight: '600'
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8b5cf6'
  },
  actionButton: {
    marginTop: 14,
    backgroundColor: '#8b5cf6',
    paddingVertical: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  actionButtonDisabled: {
    opacity: 0.6
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '700'
  }
});
