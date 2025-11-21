import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import {
  getTreatmentCourseById
} from '../../services/apiService';
import type { TreatmentCourse, TreatmentSession } from '../../types';
import { formatDate, getStatusColor, getStatusLabel } from '../../utils/formatters';

type Props = NativeStackScreenProps<any, 'TreatmentCourseDetail'>;

export const TreatmentCourseDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { id } = (route.params as { id: string }) || { id: '' };
  const [course, setCourse] = useState<TreatmentCourse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadCourse = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getTreatmentCourseById(id);
      setCourse(data);
    } catch (error) {
      console.error('Error loading treatment course:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin liệu trình', [
        { text: 'Quay lại', onPress: () => navigation.goBack() }
      ]);
    } finally {
      setLoading(false);
    }
  }, [id, navigation]);

  useEffect(() => {
    loadCourse();
  }, [loadCourse]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCourse();
    setRefreshing(false);
  }, [loadCourse]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  if (!course) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={52} color="#d1d5db" />
        <Text style={styles.emptyText}>Không tìm thấy liệu trình</Text>
      </View>
    );
  }

  const progress = course.totalSessions
    ? Math.round((course.completedSessions / course.totalSessions) * 100)
    : 0;
  const sortedSessions: TreatmentSession[] = [...(course.sessions || [])].sort(
    (a, b) => a.sessionNumber - b.sessionNumber
  );
  const nextSession = sortedSessions.find((session) => session.status === 'scheduled');

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.heroSection}>
        <View style={styles.heroHeader}>
          <View>
            <Text style={styles.heroLabel}>Liệu trình</Text>
            <Text style={styles.heroTitle}>{course.serviceName}</Text>
          </View>
          <View
            style={[styles.heroStatus, { backgroundColor: getStatusColor(course.status) }]}
          >
            <Text style={styles.heroStatusText}>{getStatusLabel(course.status)}</Text>
          </View>
        </View>

        <View style={styles.heroMetaRow}>
          <View style={styles.heroMetaItem}>
            <Text style={styles.heroMetaLabel}>Tổng buổi</Text>
            <Text style={styles.heroMetaValue}>{course.totalSessions}</Text>
          </View>
          <View style={styles.heroMetaItem}>
            <Text style={styles.heroMetaLabel}>Đã hoàn thành</Text>
            <Text style={styles.heroMetaValue}>{course.completedSessions}</Text>
          </View>
          <View style={styles.heroMetaItem}>
            <Text style={styles.heroMetaLabel}>Tiến độ</Text>
            <Text style={styles.heroMetaValue}>{progress}%</Text>
          </View>
        </View>

        <View style={styles.timelineBar}>
          <View style={[styles.timelineFill, { width: `${progress}%` }]} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thông tin chung</Text>
        <View style={styles.card}>
          <View style={styles.rowItem}>
            <Ionicons name="calendar-outline" size={18} color="#6b7280" />
            <View>
              <Text style={styles.rowLabel}>Ngày bắt đầu</Text>
              <Text style={styles.rowValue}>{formatDate(course.startDate)}</Text>
            </View>
          </View>
          <View style={styles.rowItem}>
            <Ionicons name="hourglass-outline" size={18} color="#6b7280" />
            <View>
              <Text style={styles.rowLabel}>Ngày hết hạn</Text>
              <Text style={styles.rowValue}>{formatDate(course.expiryDate)}</Text>
            </View>
          </View>
          {course.frequencyType && course.frequencyValue && (
            <View style={styles.rowItem}>
              <Ionicons name="repeat-outline" size={18} color="#6b7280" />
              <View>
                <Text style={styles.rowLabel}>Tần suất</Text>
                <Text style={styles.rowValue}>
                  {course.frequencyType === 'sessions_per_week'
                    ? `${course.frequencyValue} buổi/tuần`
                    : `${course.frequencyValue} tuần/buổi`}
                </Text>
              </View>
            </View>
          )}
          <View style={styles.rowItem}>
            <Ionicons name="cash-outline" size={18} color="#6b7280" />
            <View>
              <Text style={styles.rowLabel}>Thanh toán</Text>
              <Text
                style={[
                  styles.rowValue,
                  { color: course.paymentStatus === 'Paid' ? '#10b981' : '#f97316' }
                ]}
              >
                {course.paymentStatus === 'Paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
              </Text>
            </View>
          </View>
          {course.notes && (
            <View style={styles.rowItem}>
              <Ionicons name="document-text-outline" size={18} color="#6b7280" />
              <View>
                <Text style={styles.rowLabel}>Ghi chú</Text>
                <Text style={styles.rowValue}>{course.notes}</Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {(course.Therapist || course.therapistId) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chuyên viên phụ trách</Text>
          <View style={styles.card}>
            <View style={styles.therapistRow}>
              <View style={styles.therapistAvatar}>
                <Ionicons name="person" size={28} color="#8b5cf6" />
              </View>
              <View>
                <Text style={styles.therapistName}>
                  {course.Therapist?.name || 'Đang phân công'}
                </Text>
                {course.Therapist?.phone && (
                  <Text style={styles.therapistContact}>{course.Therapist.phone}</Text>
                )}
              </View>
            </View>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Lịch sử buổi chăm sóc</Text>
          {nextSession && (
            <View style={styles.nextSessionBadge}>
              <Ionicons name="alarm-outline" size={16} color="#f97316" />
              <Text style={styles.nextSessionText}>
                Buổi tiếp theo: {formatDate(nextSession.sessionDate)} {nextSession.sessionTime}
              </Text>
            </View>
          )}
        </View>

        {sortedSessions.length === 0 ? (
          <View style={styles.emptySessions}>
            <Ionicons name="time-outline" size={32} color="#d1d5db" />
            <Text style={styles.emptySessionText}>Chưa có lịch sử buổi chăm sóc</Text>
          </View>
        ) : (
          sortedSessions.map((session) => (
            <View key={session.id} style={styles.sessionCard}>
              <View style={styles.sessionHeader}>
                <View style={styles.sessionBadge}>
                  <Text style={styles.sessionBadgeText}>Buổi {session.sessionNumber}</Text>
                </View>
                <View
                  style={[
                    styles.sessionStatus,
                    { backgroundColor: getStatusColor(session.status) }
                  ]}
                >
                  <Text style={styles.sessionStatusText}>
                    {getStatusLabel(session.status)}
                  </Text>
                </View>
              </View>

              <View style={styles.sessionRow}>
                <Ionicons name="calendar-outline" size={16} color="#6b7280" />
                <Text style={styles.sessionValue}>{formatDate(session.sessionDate)}</Text>
              </View>
              <View style={styles.sessionRow}>
                <Ionicons name="time-outline" size={16} color="#6b7280" />
                <Text style={styles.sessionValue}>{session.sessionTime}</Text>
              </View>
              {session.Staff?.name && (
                <View style={styles.sessionRow}>
                  <Ionicons name="person-outline" size={16} color="#6b7280" />
                  <Text style={styles.sessionValue}>{session.Staff.name}</Text>
                </View>
              )}
              {session.customerStatusNotes && (
                <View style={styles.notesBox}>
                  <Text style={styles.notesLabel}>Cảm nhận</Text>
                  <Text style={styles.notesValue}>{session.customerStatusNotes}</Text>
                </View>
              )}
              {session.adminNotes && (
                <View style={styles.notesBox}>
                  <Text style={styles.notesLabel}>Ghi chú chuyên môn</Text>
                  <Text style={styles.notesValue}>{session.adminNotes}</Text>
                </View>
              )}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  heroSection: {
    backgroundColor: '#8b5cf6',
    padding: 24,
    paddingTop: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  heroLabel: {
    color: '#fce7f3',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.6
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginTop: 6,
    maxWidth: '80%'
  },
  heroStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10
  },
  heroStatusText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12
  },
  heroMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18
  },
  heroMetaItem: {
    flex: 1,
    alignItems: 'center'
  },
  heroMetaLabel: {
    color: '#ddd6fe',
    fontSize: 12,
    marginBottom: 4
  },
  heroMetaValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700'
  },
  timelineBar: {
    height: 10,
    backgroundColor: '#a78bfa',
    borderRadius: 6,
    marginTop: 20,
    overflow: 'hidden'
  },
  timelineFill: {
    height: '100%',
    backgroundColor: '#fef3c7'
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12
  },
  sectionHeader: {
    flexDirection: 'column'
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    gap: 12
  },
  rowItem: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start'
  },
  rowLabel: {
    fontSize: 12,
    color: '#9ca3af'
  },
  rowValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500'
  },
  therapistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16
  },
  therapistAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center'
  },
  therapistName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827'
  },
  therapistContact: {
    fontSize: 14,
    color: '#6b7280'
  },
  nextSessionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff7ed',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12
  },
  nextSessionText: {
    fontSize: 13,
    color: '#c2410c',
    fontWeight: '600'
  },
  emptySessions: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2
  },
  emptySessionText: {
    fontSize: 14,
    color: '#6b7280'
  },
  sessionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  sessionBadge: {
    backgroundColor: '#ede9fe',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10
  },
  sessionBadgeText: {
    color: '#6d28d9',
    fontWeight: '600',
    fontSize: 13
  },
  sessionStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  sessionStatusText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6
  },
  sessionValue: {
    fontSize: 14,
    color: '#374151'
  },
  notesBox: {
    marginTop: 10,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 12
  },
  notesLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4
  },
  notesValue: {
    fontSize: 13,
    color: '#111827'
  },
  emptyText: {
    marginTop: 12,
    fontSize: 15,
    color: '#9ca3af'
  }
});
