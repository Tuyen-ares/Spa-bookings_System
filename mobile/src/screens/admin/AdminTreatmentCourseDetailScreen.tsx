import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
  TextInput
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import {
  getTreatmentCourseById,
  confirmTreatmentCoursePayment,
  completeTreatmentSession,
  updateTreatmentSession,
  updateTreatmentCourse,
  getUsers
} from '../../services/apiService';
import type { TreatmentCourse, TreatmentSession, User } from '../../types';
import { formatDate, getStatusColor, getStatusLabel } from '../../utils/formatters';

interface RouteParams {
  id: string;
}

type Props = NativeStackScreenProps<any, 'AdminTreatmentCourseDetail'>;

export const AdminTreatmentCourseDetailScreen: React.FC<Props> = ({ route }) => {
  const { id } = (route.params as RouteParams) || { id: '' };
  const [course, setCourse] = useState<TreatmentCourse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [completingSession, setCompletingSession] = useState<number | null>(null);
  const [staffList, setStaffList] = useState<User[]>([]);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<TreatmentSession | null>(null);
  const [assigningStaff, setAssigningStaff] = useState(false);
  const [completeForm, setCompleteForm] = useState({
    customerStatusNotes: '',
    adminNotes: ''
  });

  const loadCourse = useCallback(async () => {
    try {
      setLoading(true);
      const [data, users] = await Promise.all([
        getTreatmentCourseById(id),
        getUsers()
      ]);
      setCourse(data);
      setStaffList(users.filter(u => u.role === 'Staff'));
    } catch (error) {
      console.error('Error loading treatment course:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin liệu trình');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    loadCourse();
  }, [loadCourse]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCourse();
  };

  const sortedSessions: TreatmentSession[] = useMemo(() => {
    return [...(course?.sessions || [])].sort((a, b) => a.sessionNumber - b.sessionNumber);
  }, [course]);

  const nextSession = useMemo(() => {
    return sortedSessions.find((session) => session.status === 'scheduled');
  }, [sortedSessions]);

  const handleConfirmPayment = () => {
    if (!course) return;
    
    // Check if first session's appointment is confirmed
    const firstSession = sortedSessions[0];
    if (firstSession && firstSession.Appointment) {
      const appointmentStatus = firstSession.Appointment.status;
      if (appointmentStatus === 'pending') {
        Alert.alert(
          'Chưa thể xác nhận thanh toán',
          'Vui lòng xác nhận lịch hẹn trước khi xác nhận thanh toán liệu trình.',
          [{ text: 'OK' }]
        );
        return;
      }
    }
    
    Alert.alert('Xác nhận thanh toán', 'Đánh dấu liệu trình này đã thanh toán?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xác nhận',
        onPress: async () => {
          try {
            setSubmittingPayment(true);
            await confirmTreatmentCoursePayment(course.id);
            await loadCourse();
            Alert.alert('Thành công', 'Đã xác nhận thanh toán liệu trình');
          } catch (error) {
            console.error('Error confirming payment:', error);
            Alert.alert('Lỗi', 'Không thể cập nhật trạng thái thanh toán');
          } finally {
            setSubmittingPayment(false);
          }
        }
      }
    ]);
  };

  const handleCompleteSession = (session: TreatmentSession) => {
    setSelectedSession(session);
    setCompleteForm({
      customerStatusNotes: session.customerStatusNotes || '',
      adminNotes: session.adminNotes || ''
    });
    setShowCompleteModal(true);
  };

  const handleConfirmComplete = async () => {
    if (!selectedSession) return;
    
    try {
      setCompletingSession(selectedSession.sessionNumber);
      await completeTreatmentSession(course!.id, {
        sessionNumber: selectedSession.sessionNumber,
        customerStatusNotes: completeForm.customerStatusNotes,
        adminNotes: completeForm.adminNotes
      });
      await loadCourse();
      setShowCompleteModal(false);
      setSelectedSession(null);
      setCompleteForm({ customerStatusNotes: '', adminNotes: '' });
      Alert.alert('Thành công', `Đã hoàn thành buổi ${selectedSession.sessionNumber}`);
    } catch (error) {
      console.error('Error completing session:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái buổi chăm sóc');
    } finally {
      setCompletingSession(null);
    }
  };

  const handleAssignStaff = (session: TreatmentSession) => {
    // Check if appointment is confirmed first
    if (session.Appointment && session.Appointment.status === 'pending') {
      Alert.alert(
        'Chưa thể phân công',
        'Vui lòng xác nhận lịch hẹn trước khi phân công nhân viên.',
        [{ text: 'OK' }]
      );
      return;
    }
    setSelectedSession(session);
    setShowStaffModal(true);
  };

  const handleSelectStaff = async (staffId: string) => {
    if (!selectedSession) return;
    
    try {
      setAssigningStaff(true);
      await updateTreatmentSession(selectedSession.id, { staffId });
      await loadCourse();
      setShowStaffModal(false);
      setSelectedSession(null);
      Alert.alert('Thành công', 'Đã phân công nhân viên cho buổi điều trị');
    } catch (error) {
      console.error('Error assigning staff:', error);
      Alert.alert('Lỗi', 'Không thể phân công nhân viên');
    } finally {
      setAssigningStaff(false);
    }
  };

  const handleCompleteCourse = () => {
    if (!course) return;

    // Check if all sessions are completed
    const allCompleted = sortedSessions.every(s => s.status === 'completed');
    if (!allCompleted) {
      Alert.alert(
        'Chưa thể hoàn thành',
        'Vui lòng hoàn thành tất cả các buổi điều trị trước khi hoàn thành liệu trình.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Hoàn thành liệu trình',
      'Xác nhận đánh dấu liệu trình này đã hoàn thành?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: async () => {
            try {
              setSubmittingPayment(true);
              await updateTreatmentCourse(course.id, { status: 'completed' });
              await loadCourse();
              Alert.alert('Thành công', 'Đã hoàn thành liệu trình');
            } catch (error) {
              console.error('Error completing course:', error);
              Alert.alert('Lỗi', 'Không thể hoàn thành liệu trình');
            } finally {
              setSubmittingPayment(false);
            }
          }
        }
      ]
    );
  };

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
        <Ionicons name="alert-circle-outline" size={56} color="#d1d5db" />
        <Text style={styles.emptyText}>Không tìm thấy liệu trình</Text>
      </View>
    );
  }

  const progress = course.totalSessions
    ? Math.round((course.completedSessions / course.totalSessions) * 100)
    : 0;

  const allSessionsCompleted = sortedSessions.every(s => s.status === 'completed');
  
  const servicePrice = (course as any).Service?.price ? Number((course as any).Service.price) : 0;
  const totalPrice = servicePrice * course.totalSessions;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      <View style={styles.heroSection}>
        <View style={styles.heroHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroLabel}>Liệu trình</Text>
            <Text style={styles.heroTitle}>{course.serviceName}</Text>
            <Text style={styles.heroClient}>{course.Client?.name}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(course.status) }]}>
            <Text style={styles.statusText}>{getStatusLabel(course.status)}</Text>
          </View>
        </View>

        <View style={styles.heroStats}>
          <StatBlock label="Tổng buổi" value={course.totalSessions} />
          <StatBlock label="Hoàn thành" value={course.completedSessions} />
          <StatBlock label="Tiến độ" value={`${progress}%`} />
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>

        {servicePrice > 0 && (
          <View style={styles.priceSection}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Giá dịch vụ:</Text>
              <Text style={styles.priceValue}>{servicePrice.toLocaleString('vi-VN')} ₫</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.totalLabel}>Tổng tiền ({course.totalSessions} buổi):</Text>
              <Text style={styles.totalValue}>{totalPrice.toLocaleString('vi-VN')} ₫</Text>
            </View>
          </View>
        )}

        <View style={styles.metaRow}>
          <MetaItem icon="calendar-outline" label="Ngày bắt đầu" value={formatDate(course.startDate)} />
          <MetaItem icon="hourglass-outline" label="Ngày hết hạn" value={formatDate(course.expiryDate)} />
        </View>

        <View style={styles.metaRow}>
          <MetaItem icon="pricetag-outline" label="Thanh toán" value={course.paymentStatus === 'Paid' ? 'Đã thanh toán' : 'Chưa thanh toán'} valueColor={course.paymentStatus === 'Paid' ? '#d1fae5' : '#fee2e2'} textColor={course.paymentStatus === 'Paid' ? '#065f46' : '#92400e'} />
          {course.frequencyType && course.frequencyValue && (
            <MetaItem
              icon="repeat-outline"
              label="Tần suất"
              value={
                course.frequencyType === 'sessions_per_week'
                  ? `${course.frequencyValue} buổi/tuần`
                  : `${course.frequencyValue} tuần/buổi`
              }
            />
          )}
        </View>

        {course.paymentStatus === 'Unpaid' && (
          <TouchableOpacity
            style={[styles.primaryButton, submittingPayment && styles.disabledButton]}
            onPress={handleConfirmPayment}
            disabled={submittingPayment}
          >
            <Ionicons name="receipt-outline" size={18} color="#fff" />
            <Text style={styles.primaryButtonText}>
              {submittingPayment ? 'Đang xác nhận...' : 'Đánh dấu đã thanh toán'}
            </Text>
          </TouchableOpacity>
        )}

        {course.status === 'active' && course.paymentStatus === 'Paid' && allSessionsCompleted && (
          <TouchableOpacity
            style={[styles.completeButton, submittingPayment && styles.disabledButton]}
            onPress={handleCompleteCourse}
            disabled={submittingPayment}
          >
            <Ionicons name="checkmark-done-circle-outline" size={18} color="#fff" />
            <Text style={styles.primaryButtonText}>
              Hoàn thành liệu trình
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Các buổi chăm sóc</Text>
          {nextSession && (
            <View style={styles.nextBadge}>
              <Ionicons name="alarm-outline" size={16} color="#f97316" />
              <Text style={styles.nextBadgeText}>
                Buổi tiếp theo: {formatDate(nextSession.sessionDate)} {nextSession.sessionTime}
              </Text>
            </View>
          )}
        </View>

        {sortedSessions.map((session) => (
          <View key={session.id} style={styles.sessionCard}>
            <View style={styles.sessionHeader}>
              <View style={styles.sessionBadge}>
                <Text style={styles.sessionBadgeText}>Buổi {session.sessionNumber}</Text>
              </View>
              <View style={[styles.sessionStatus, { backgroundColor: getStatusColor(session.status) }]}>
                <Text style={styles.sessionStatusText}>{getStatusLabel(session.status)}</Text>
              </View>
            </View>

            <SessionRow icon="calendar-outline" value={formatDate(session.sessionDate)} />
            <SessionRow icon="time-outline" value={session.sessionTime} />
            {session.Staff?.name && (
              <SessionRow 
                icon="person-outline" 
                value={`Chuyên viên: ${session.Staff.name}`} 
              />
            )}
            {session.Appointment && (
              <SessionRow icon="calendar-number-outline" value="Có lịch hẹn" />
            )}

            {session.customerStatusNotes && (
              <NotesBox label="Ghi chú khách hàng" value={session.customerStatusNotes} />
            )}
            {session.adminNotes && (
              <NotesBox label="Ghi chú nội bộ" value={session.adminNotes} isAdmin />
            )}

            {session.status === 'scheduled' && (
              <View style={styles.sessionActions}>
                <TouchableOpacity
                  style={[styles.assignButton, assigningStaff && styles.disabledButton]}
                  onPress={() => handleAssignStaff(session)}
                  disabled={assigningStaff}
                >
                  <Ionicons name="person-add-outline" size={16} color="#fff" />
                  <Text style={styles.assignButtonText}>
                    {session.Staff?.name ? 'Sửa NV' : 'Phân công'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.secondaryButton, completingSession === session.sessionNumber && styles.disabledButton]}
                  onPress={() => handleCompleteSession(session)}
                  disabled={completingSession === session.sessionNumber}
                >
                  <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                  <Text style={styles.secondaryButtonText}>
                    {completingSession === session.sessionNumber ? 'Đang cập nhật...' : 'Hoàn thành'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}

        {sortedSessions.length === 0 && (
          <View style={styles.emptySessions}>
            <Ionicons name="leaf-outline" size={36} color="#d1d5db" />
            <Text style={styles.emptySessionsText}>Chưa có buổi chăm sóc nào</Text>
          </View>
        )}
      </View>

      {/* Complete Session Modal */}
      <Modal
        visible={showCompleteModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCompleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Hoàn thành buổi {selectedSession?.sessionNumber}
              </Text>
              <TouchableOpacity onPress={() => setShowCompleteModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Ghi chú tình trạng khách hàng
                </Text>
                <Text style={styles.inputHint}>
                  (Khách hàng sẽ thấy ghi chú này)
                </Text>
                <View style={styles.textAreaContainer}>
                  <Ionicons name="person-outline" size={20} color="#8b5cf6" style={styles.textAreaIcon} />
                  <TextInput
                    style={styles.textArea}
                    value={completeForm.customerStatusNotes}
                    onChangeText={(text) => setCompleteForm({ ...completeForm, customerStatusNotes: text })}
                    placeholder="Ví dụ: Khách ổn, da sáng hơn, không có kích ứng..."
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Ghi chú nội bộ
                </Text>
                <Text style={styles.inputHint}>
                  (Chỉ admin và nhân viên thấy)
                </Text>
                <View style={styles.textAreaContainer}>
                  <Ionicons name="document-text-outline" size={20} color="#3b82f6" style={styles.textAreaIcon} />
                  <TextInput
                    style={styles.textArea}
                    value={completeForm.adminNotes}
                    onChangeText={(text) => setCompleteForm({ ...completeForm, adminNotes: text })}
                    placeholder="Ghi chú nội bộ cho admin và staff..."
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowCompleteModal(false);
                  setCompleteForm({ customerStatusNotes: '', adminNotes: '' });
                }}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, completingSession ? styles.disabledButton : null]}
                onPress={handleConfirmComplete}
                disabled={!!completingSession}
              >
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.confirmButtonText}>
                  {completingSession ? 'Đang xử lý...' : 'Xác nhận'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Staff Assignment Modal */}
      <Modal
        visible={showStaffModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStaffModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn Nhân Viên</Text>
              <TouchableOpacity onPress={() => setShowStaffModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={staffList}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.staffItem}
                  onPress={() => handleSelectStaff(item.id)}
                  disabled={assigningStaff}
                >
                  <View style={styles.staffInfo}>
                    <Ionicons name="person-circle-outline" size={32} color="#8b5cf6" />
                    <View style={styles.staffDetails}>
                      <Text style={styles.staffName}>{item.name}</Text>
                      <Text style={styles.staffEmail}>{item.email}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const StatBlock = ({ label, value }: { label: string; value: string | number }) => (
  <View style={styles.statBlock}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

const MetaItem = ({
  icon,
  label,
  value,
  valueColor,
  textColor
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  valueColor?: string;
  textColor?: string;
}) => (
  <View style={styles.metaItem}>
    <Ionicons name={icon} size={18} color="#d1d5db" />
    <View>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text
        style={[
          styles.metaValue,
          valueColor && { backgroundColor: valueColor, paddingHorizontal: 8, borderRadius: 6 },
          textColor && { color: textColor }
        ]}
      >
        {value}
      </Text>
    </View>
  </View>
);

const SessionRow = ({ icon, value }: { icon: keyof typeof Ionicons.glyphMap; value: string }) => (
  <View style={styles.sessionRow}>
    <Ionicons name={icon} size={16} color="#6b7280" />
    <Text style={styles.sessionValue}>{value}</Text>
  </View>
);

const NotesBox = ({ label, value, isAdmin }: { label: string; value: string; isAdmin?: boolean }) => (
  <View style={[styles.notesBox, isAdmin && styles.notesBoxAdmin]}>
    <Text style={[styles.notesLabel, isAdmin && styles.notesLabelAdmin]}>{label}</Text>
    <Text style={[styles.notesValue, isAdmin && styles.notesValueAdmin]}>{value}</Text>
  </View>
);

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
  heroSection: {
    backgroundColor: '#8b5cf6',
    padding: 24,
    paddingTop: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24
  },
  heroHeader: {
    flexDirection: 'row',
    gap: 12
  },
  heroLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#f5f3ff'
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginTop: 6
  },
  heroClient: {
    color: '#ede9fe',
    marginTop: 4
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    alignSelf: 'flex-start'
  },
  statusText: {
    color: '#fff',
    fontWeight: '600'
  },
  heroStats: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16
  },
  statBlock: {
    flex: 1,
    backgroundColor: '#a78bfa',
    borderRadius: 12,
    padding: 12
  },
  statLabel: {
    color: '#f5f3ff',
    fontSize: 12
  },
  statValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700'
  },
  progressBar: {
    height: 10,
    backgroundColor: '#a78bfa',
    borderRadius: 6,
    marginTop: 18,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fef3c7'
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    gap: 12
  },
  metaItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  metaLabel: {
    color: '#e0e7ff',
    fontSize: 12
  },
  metaValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  primaryButton: {
    marginTop: 18,
    backgroundColor: '#f59e0b',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12
  },
  completeButton: {
    marginTop: 12,
    backgroundColor: '#10b981',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700'
  },
  disabledButton: {
    opacity: 0.6
  },
  section: {
    padding: 20
  },
  sectionHeader: {
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827'
  },
  nextBadge: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff7ed',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10
  },
  nextBadgeText: {
    color: '#c2410c',
    fontWeight: '600'
  },
  sessionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
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
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  sessionBadgeText: {
    color: '#6d28d9',
    fontWeight: '600'
  },
  sessionStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  sessionStatusText: {
    color: '#fff',
    fontWeight: '600'
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6
  },
  sessionValue: {
    color: '#374151',
    fontSize: 14
  },
  notesBox: {
    marginTop: 10,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#8b5cf6'
  },
  notesBoxAdmin: {
    backgroundColor: '#eff6ff',
    borderLeftColor: '#3b82f6'
  },
  notesLabel: {
    color: '#6b7280',
    fontSize: 12,
    marginBottom: 4,
    fontWeight: '600'
  },
  notesLabelAdmin: {
    color: '#3b82f6'
  },
  notesValue: {
    color: '#111827',
    fontSize: 13
  },
  notesValueAdmin: {
    color: '#1e40af'
  },
  priceSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginTop: 16
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  priceLabel: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9
  },
  priceValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  totalLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700'
  },
  totalValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700'
  },
  sessionActions: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 8
  },
  assignButton: {
    flex: 1,
    backgroundColor: '#8b5cf6',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10
  },
  assignButtonText: {
    color: '#fff',
    fontWeight: '700'
  },
  secondaryButton: {
    flex: 1,
    marginTop: 0,
    backgroundColor: '#10b981',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10
  },
  secondaryButtonText: {
    color: '#fff',
    fontWeight: '700'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 20
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333'
  },
  staffItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5'
  },
  staffInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  staffDetails: {
    gap: 4
  },
  staffName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333'
  },
  staffEmail: {
    fontSize: 14,
    color: '#666'
  },
  emptyText: {
    marginTop: 10,
    color: '#9ca3af'
  },
  emptySessions: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center'
  },
  emptySessionsText: {
    color: '#6b7280',
    marginTop: 8
  },
  modalBody: {
    padding: 20,
    maxHeight: 400
  },
  inputGroup: {
    marginBottom: 20
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4
  },
  inputHint: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8
  },
  textAreaContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12
  },
  textAreaIcon: {
    marginRight: 8,
    marginTop: 2
  },
  textArea: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    minHeight: 80,
    textAlignVertical: 'top'
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0'
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center'
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600'
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700'
  }
});
