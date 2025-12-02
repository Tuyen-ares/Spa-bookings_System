import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  ScrollView
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

type FilterType = 'all' | 'active' | 'cancelled' | 'completed';

export const TreatmentCoursesScreen: React.FC<Props> = ({ navigation }) => {
  const [courses, setCourses] = useState<TreatmentCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  // Filter courses by status
  const filteredCourses = useMemo(() => {
    if (filterType === 'all') {
      return courses;
    }

    return courses.filter((course) => {
      switch (filterType) {
        case 'active':
          return course.status === 'active' || course.status === 'pending';
        case 'cancelled':
          return course.status === 'cancelled';
        case 'completed':
          return course.status === 'completed';
        default:
          return true;
      }
    });
  }, [courses, filterType]);

  // Pagination
  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
  const paginatedCourses = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredCourses.slice(startIndex, endIndex);
  }, [filteredCourses, currentPage, itemsPerPage]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType]);

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
            style={[styles.filterButton, filterType === 'active' && styles.filterButtonActive]}
            onPress={() => setFilterType('active')}
          >
            <Text style={[styles.filterButtonText, filterType === 'active' && styles.filterButtonTextActive]}>
              Đang diễn ra
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, filterType === 'completed' && styles.filterButtonActive]}
            onPress={() => setFilterType('completed')}
          >
            <Text style={[styles.filterButtonText, filterType === 'completed' && styles.filterButtonTextActive]}>
              Hoàn thành
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, filterType === 'cancelled' && styles.filterButtonActive]}
            onPress={() => setFilterType('cancelled')}
          >
            <Text style={[styles.filterButtonText, filterType === 'cancelled' && styles.filterButtonTextActive]}>
              Đã hủy
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Results Count */}
      {filteredCourses.length > 0 && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsText}>
            Hiển thị {paginatedCourses.length} / {filteredCourses.length} liệu trình
          </Text>
        </View>
      )}

      {filteredCourses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="leaf-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyTitle}>
            {filterType === 'all' ? 'Chưa có liệu trình nào' : 'Không có liệu trình trong danh mục này'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {filterType === 'all' 
              ? 'Các liệu trình đã mua sẽ xuất hiện tại đây'
              : 'Thử chọn bộ lọc khác để xem thêm'}
          </Text>
        </View>
      ) : (
        <>
          <FlatList
            data={paginatedCourses}
            keyExtractor={(item) => item.id}
            renderItem={renderCourse}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
            showsVerticalScrollIndicator={false}
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8
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
