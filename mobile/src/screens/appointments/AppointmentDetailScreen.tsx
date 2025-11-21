import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getAppointmentById, cancelAppointment } from '../../services/apiService';
import { formatDate, formatCurrency, getStatusLabel, getStatusColor } from '../../utils/formatters';
import type { Appointment } from '../../types';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<any, 'AppointmentDetail'>;

export const AppointmentDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { id } = (route.params as { id: string }) || { id: '' };
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const loadAppointment = async () => {
    try {
      setLoading(true);
      const data = await getAppointmentById(id);
      setAppointment(data);
    } catch (error) {
      console.error('Error loading appointment:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin lịch hẹn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointment();
  }, [id]);

  const handleCancel = () => {
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
              setCancelling(true);
              await cancelAppointment(id);
              Alert.alert('Thành công', 'Đã hủy lịch hẹn', [
                {
                  text: 'OK',
                  onPress: () => navigation.goBack()
                }
              ]);
            } catch (error) {
              console.error('Error cancelling appointment:', error);
              Alert.alert('Lỗi', 'Không thể hủy lịch hẹn');
            } finally {
              setCancelling(false);
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

  if (!appointment) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#ccc" />
        <Text style={styles.errorText}>Không tìm thấy lịch hẹn</Text>
      </View>
    );
  }

  const canCancel = appointment.status === 'pending' || appointment.status === 'upcoming';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(appointment.status) }
          ]}
        >
          <Text style={styles.statusText}>{getStatusLabel(appointment.status)}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thông tin dịch vụ</Text>
        <View style={styles.card}>
          <Text style={styles.serviceName}>
            {appointment.Service?.name || appointment.serviceName}
          </Text>
          {appointment.Service?.description && (
            <Text style={styles.serviceDescription}>{appointment.Service.description}</Text>
          )}
          {appointment.Service?.duration && (
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={16} color="#666" />
              <Text style={styles.durationText}>{appointment.Service.duration} phút</Text>
            </View>
          )}
          {appointment.TreatmentSession?.TreatmentCourse && (
            <View style={styles.treatmentInfo}>
              <View style={styles.treatmentBadge}>
                <Ionicons name="fitness-outline" size={16} color="#8b5cf6" />
                <Text style={styles.treatmentText}>Liệu trình</Text>
              </View>
              <View style={styles.sessionProgress}>
                <Text style={styles.sessionLabel}>Buổi {appointment.TreatmentSession.sessionNumber}/{appointment.TreatmentSession.TreatmentCourse.totalSessions}</Text>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill,
                      { width: `${(appointment.TreatmentSession.TreatmentCourse.completedSessions / appointment.TreatmentSession.TreatmentCourse.totalSessions) * 100}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>
                  Đã hoàn thành {appointment.TreatmentSession.TreatmentCourse.completedSessions}/{appointment.TreatmentSession.TreatmentCourse.totalSessions} buổi
                </Text>
              </View>
            </View>
          )}
          {appointment.notes && (
            <>
              <Text style={styles.notesTitle}>Ghi chú</Text>
              <Text style={styles.notes}>{appointment.notes}</Text>
            </>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lịch hẹn</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color="#8b5cf6" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Ngày</Text>
              <Text style={styles.infoValue}>{formatDate(appointment.date)}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color="#8b5cf6" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Giờ</Text>
              <Text style={styles.infoValue}>{appointment.time}</Text>
            </View>
          </View>
        </View>
      </View>

      {(appointment.Staff || appointment.therapist) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chuyên viên phụ trách</Text>
          <View style={styles.card}>
            <View style={styles.therapistInfo}>
              <View style={styles.therapistAvatar}>
                <Ionicons name="person" size={32} color="#8b5cf6" />
              </View>
              <View style={styles.therapistDetails}>
                <Text style={styles.therapistName}>
                  {appointment.Staff?.name || appointment.therapist}
                </Text>
                {appointment.Staff?.phone && (
                  <Text style={styles.therapistContact}>{appointment.Staff.phone}</Text>
                )}
              </View>
            </View>
          </View>
        </View>
      )}

      {appointment.User && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin khách hàng</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={20} color="#8b5cf6" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Tên khách hàng</Text>
                <Text style={styles.infoValue}>{appointment.User.name}</Text>
              </View>
            </View>
            {appointment.User.phone && (
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={20} color="#8b5cf6" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Số điện thoại</Text>
                  <Text style={styles.infoValue}>{appointment.User.phone}</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thanh toán</Text>
        <View style={styles.card}>
          {appointment.TreatmentSession?.TreatmentCourse ? (
            <>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Giá/buổi</Text>
                <Text style={styles.priceValue}>
                  {formatCurrency(
                    appointment.totalPrice || 
                    appointment.price || 
                    appointment.Service?.price || 
                    0
                  )}
                </Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>
                  Tổng ({appointment.TreatmentSession.TreatmentCourse.totalSessions} buổi)
                </Text>
                <Text style={styles.totalPriceValue}>
                  {formatCurrency(
                    (appointment.totalPrice || appointment.price || appointment.Service?.price || 0) * 
                    appointment.TreatmentSession.TreatmentCourse.totalSessions
                  )}
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Giá dịch vụ</Text>
              <Text style={styles.priceValue}>
                {formatCurrency(
                  appointment.totalPrice || 
                  appointment.price || 
                  appointment.Service?.price || 
                  0
                )}
              </Text>
            </View>
          )}
          {appointment.paymentStatus && (
            <View style={styles.paymentStatus}>
              <Ionicons
                name={appointment.paymentStatus === 'Paid' ? 'checkmark-circle' : 'alert-circle'}
                size={20}
                color={appointment.paymentStatus === 'Paid' ? '#10b981' : '#f59e0b'}
              />
              <Text
                style={[
                  styles.paymentStatusText,
                  {
                    color: appointment.paymentStatus === 'Paid' ? '#10b981' : '#f59e0b'
                  }
                ]}
              >
                {appointment.paymentStatus === 'Paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
              </Text>
            </View>
          )}
        </View>
      </View>

      {appointment.reviewRating && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Đánh giá</Text>
          <View style={styles.card}>
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= appointment.reviewRating! ? 'star' : 'star-outline'}
                  size={24}
                  color="#f59e0b"
                />
              ))}
            </View>
          </View>
        </View>
      )}

      {canCancel && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.cancelButton, cancelling && styles.disabledButton]}
            onPress={handleCancel}
            disabled={cancelling}
          >
            {cancelling ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="close-circle-outline" size={20} color="#fff" />
                <Text style={styles.cancelButtonText}>Hủy lịch hẹn</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa'
  },
  errorText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12
  },
  header: {
    padding: 20,
    alignItems: 'center'
  },
  statusBadge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  section: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    paddingHorizontal: 20,
    marginBottom: 12
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  durationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
    marginBottom: 4,
  },
  notes: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20
  },
  therapistInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  therapistAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  therapistDetails: {
    flex: 1,
  },
  therapistName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  therapistContact: {
    fontSize: 14,
    color: '#666',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 12
  },
  treatmentInfo: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F3E8FF',
    borderRadius: 12,
  },
  treatmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  treatmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  sessionProgress: {
    gap: 8,
  },
  sessionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6d28d9',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E9D5FF',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8b5cf6',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#7c3aed',
  },
  infoContent: {
    flex: 1
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500'
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  priceLabel: {
    fontSize: 14,
    color: '#666'
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8b5cf6'
  },
  totalPriceValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6d28d9'
  },
  paymentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8
  },
  paymentStatusText: {
    fontSize: 14,
    fontWeight: '600'
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 8
  },
  actions: {
    padding: 20,
    paddingBottom: 40
  },
  cancelButton: {
    backgroundColor: '#ef4444',
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  disabledButton: {
    opacity: 0.6
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  }
});
