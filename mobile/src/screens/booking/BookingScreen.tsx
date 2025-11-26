import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  Modal,
  Linking,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import * as apiService from '../../services/apiService';
import { Service, User, Promotion } from '../../types';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { formatCurrency } from '../../utils/formatters';

type Props = NativeStackScreenProps<any, 'Booking'>;

type PaymentMethod = 'VNPay' | 'Cash';

export const BookingScreen: React.FC<Props> = ({ route, navigation }) => {
  const { serviceId } = (route.params as { serviceId?: string }) || {};
  
  const [currentStep, setCurrentStep] = useState(1);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [numberOfSessions, setNumberOfSessions] = useState(1);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [promoCode, setPromoCode] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (serviceId && services.length > 0) {
      const service = services.find((s) => s.id === serviceId);
      if (service) {
        setSelectedService(service);
        setCurrentStep(2);
      }
    }
  }, [serviceId, services]);

  const loadData = async () => {
    try {
      const [servicesData, user, promotionsData] = await Promise.all([
        apiService.getServices(),
        apiService.getCurrentUser(),
        apiService.getPromotions(),
      ]);
      setServices(servicesData.filter((s: Service) => s.isActive !== false));
      setCurrentUser(user);
      setPromotions(promotionsData.filter((p: Promotion) => p.isActive));
    } catch (error) {
      console.error('Failed to load data:', error);
      Alert.alert('Lỗi', 'Không thể tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  };

  const generateTimeSlots = () => {
    const slots: string[] = [];
    for (let hour = 9; hour <= 21; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 21 && minute > 0) break;
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
    }
  };

  const checkTimeSlotAvailability = async (date: Date, time: string, serviceDuration: number): Promise<boolean> => {
    if (!currentUser) return true;
    
    try {
      // Get user's appointments on selected date
      const userAppointments = await apiService.getUserAppointments(currentUser.id);
      const dateStr = date.toISOString().split('T')[0];
      
      // Filter appointments on same date with status not cancelled
      const sameDayAppointments = userAppointments.filter((apt: any) => {
        const aptDate = apt.date || apt.appointmentDate;
        return aptDate === dateStr && apt.status !== 'cancelled';
      });

      if (sameDayAppointments.length === 0) return true;

      // Convert time to minutes for comparison
      const [hours, minutes] = time.split(':').map(Number);
      const selectedStartMinutes = hours * 60 + minutes;
      const selectedEndMinutes = selectedStartMinutes + serviceDuration;

      // Check for conflicts
      for (const apt of sameDayAppointments) {
        const aptTime = apt.time || apt.appointmentDate?.split('T')[1]?.substring(0, 5) || '00:00';
        const [aptHours, aptMinutes] = aptTime.split(':').map(Number);
        const aptStartMinutes = aptHours * 60 + aptMinutes;
        const aptDuration = apt.Service?.duration || 60;
        const aptEndMinutes = aptStartMinutes + aptDuration;

        // Check if time ranges overlap
        const hasOverlap = (
          (selectedStartMinutes >= aptStartMinutes && selectedStartMinutes < aptEndMinutes) ||
          (selectedEndMinutes > aptStartMinutes && selectedEndMinutes <= aptEndMinutes) ||
          (selectedStartMinutes <= aptStartMinutes && selectedEndMinutes >= aptEndMinutes)
        );

        if (hasOverlap) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error checking availability:', error);
      return true; // Allow booking if check fails
    }
  };

  const handleTimeSelect = async (time: string) => {
    if (!selectedService) {
      setSelectedTime(time);
      return;
    }

    setCheckingAvailability(true);
    const isAvailable = await checkTimeSlotAvailability(selectedDate, time, selectedService.duration);
    setCheckingAvailability(false);

    if (!isAvailable) {
      Alert.alert(
        'Không thể đặt lịch',
        `Bạn đã có lịch hẹn vào khung giờ này (${time}). Vui lòng chọn giờ khác.`,
        [{ text: 'OK' }]
      );
      return;
    }

    setSelectedTime(time);
  };

  const handleApplyPromotion = async () => {
    if (!promoCode.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập mã khuyến mãi');
      return;
    }

    try {
      const promo = promotions.find(p => p.code.toLowerCase() === promoCode.toLowerCase());
      if (!promo) {
        Alert.alert('Lỗi', 'Mã khuyến mãi không hợp lệ');
        return;
      }

      // Check expiry date
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expiryDate = new Date(promo.expiryDate);
      expiryDate.setHours(0, 0, 0, 0);
      if (today > expiryDate) {
        Alert.alert('Lỗi', 'Mã khuyến mãi đã hết hạn');
        return;
      }

      setSelectedPromotion(promo);
      Alert.alert('Thành công', 'Chọn mã thành công! Mã sẽ được áp dụng khi đặt lịch.');
    } catch (error) {
      console.error('Error applying promotion:', error);
      Alert.alert('Lỗi', 'Không thể áp dụng mã khuyến mãi');
    }
  };

  const handleBooking = () => {
    if (!selectedService || !currentUser) {
      Alert.alert('Lỗi', 'Vui lòng chọn đầy đủ thông tin');
      return;
    }
    setShowPaymentModal(true);
  };

  const handleProcessPayment = async () => {
    if (!selectedService || !currentUser) return;

    try {
      setIsLoading(true);
      setShowPaymentModal(false);

      // Apply promotion code if selected
      if (selectedPromotion) {
        try {
          const result = await apiService.applyPromotion(selectedPromotion.code);
          console.log('Promotion applied successfully:', result);
          // Update promotion in local state
          if (result.promotion) {
            setPromotions(prev => prev.map(p => 
              p.id === result.promotion.id ? result.promotion : p
            ));
          }
        } catch (error: any) {
          console.error('Failed to apply promotion:', error);
          Alert.alert('Lỗi', `Không thể áp dụng mã khuyến mãi: ${error.message || 'Lỗi không xác định'}`);
          setIsLoading(false);
          return;
        }
      }

      // Final check for time slot availability
      const isAvailable = await checkTimeSlotAvailability(selectedDate, selectedTime, selectedService.duration);
      if (!isAvailable) {
        Alert.alert(
          'Không thể đặt lịch',
          'Khung giờ này đã có lịch hẹn khác. Vui lòng chọn giờ khác.',
          [{ text: 'OK' }]
        );
        setIsLoading(false);
        return;
      }

      // Create appointment with quantity for treatment course
      const appointmentData = {
        serviceId: selectedService.id,
        userId: currentUser.id,
        date: selectedDate.toISOString().split('T')[0],
        time: selectedTime,
        quantity: numberOfSessions,
        notes,
        status: 'pending' as const,
        paymentStatus: 'Unpaid' as const,
      };

      const appointment = await apiService.createAppointment(appointmentData);

      // Calculate discounted amount
      const serviceTotal = selectedService.price * numberOfSessions;
      const discount = selectedPromotion
        ? selectedPromotion.discountType === 'percentage'
          ? serviceTotal * (selectedPromotion.discountValue / 100)
          : selectedPromotion.discountValue
        : 0;
      const amount = Math.max(0, serviceTotal - discount); // Final amount with discount applied

      if (paymentMethod === 'VNPay') {
        // Process VNPay payment with promotion code
        const result = await apiService.processPayment(
          appointment.id, 
          'VNPay', 
          amount,
          selectedPromotion?.code // Pass promotion code to backend
        );
        
        if (result.paymentUrl) {
          // Open VNPay payment page in browser
          const supported = await Linking.canOpenURL(result.paymentUrl);
          if (supported) {
            await Linking.openURL(result.paymentUrl);
            Alert.alert(
              'Thanh toán VNPay',
              'Vui lòng hoàn tất thanh toán trên trình duyệt. Sau khi thanh toán, bạn có thể quay lại ứng dụng để kiểm tra lịch hẹn.',
              [
                { text: 'OK', onPress: () => navigation.navigate('AppointmentsTab') }
              ]
            );
          } else {
            throw new Error('Không thể mở link thanh toán');
          }
        }
      } else {
        // Cash payment
        Alert.alert(
          'Đặt lịch thành công!',
          'Vui lòng thanh toán tại quầy khi đến spa.',
          [{ text: 'OK', onPress: () => navigation.navigate('AppointmentsTab') }]
        );
      }
    } catch (error) {
      console.error('Failed to process payment:', error);
      Alert.alert('Lỗi', 'Đặt lịch thất bại. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Step 1: Select Service
  const renderStepOne = () => (
    <ScrollView style={styles.stepContent}>
      <Text style={styles.stepTitle}>Chọn Dịch Vụ</Text>
      {services.map((service) => (
        <TouchableOpacity
          key={service.id}
          style={[
            styles.serviceCard,
            selectedService?.id === service.id && styles.serviceCardSelected,
          ]}
          onPress={() => setSelectedService(service)}
        >
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName}>{service.name}</Text>
            <Text style={styles.serviceDuration}>
              <Ionicons name="time-outline" size={14} color="#666" />
              {' '}{service.duration} phút
            </Text>
          </View>
          <Text style={styles.servicePrice}>{formatCurrency(service.price)}</Text>
          {selectedService?.id === service.id && (
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" style={styles.checkIcon} />
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  // Step 2: Select Date & Time
  const renderStepTwo = () => (
    <ScrollView style={styles.stepContent}>
      <Text style={styles.stepTitle}>Chọn Ngày & Giờ</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Ngày đặt lịch</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Ionicons name="calendar-outline" size={20} color="#E91E63" />
          <Text style={styles.dateButtonText}>
            {selectedDate.toLocaleDateString('vi-VN', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Giờ đặt lịch</Text>
        {checkingAvailability && (
          <Text style={styles.checkingText}>Đang kiểm tra lịch trống...</Text>
        )}
        <View style={styles.timeSlots}>
          {timeSlots.map((time) => (
            <TouchableOpacity
              key={time}
              style={[
                styles.timeSlot,
                selectedTime === time && styles.timeSlotSelected,
              ]}
              onPress={() => handleTimeSelect(time)}
              disabled={checkingAvailability}
            >
              <Text
                style={[
                  styles.timeSlotText,
                  selectedTime === time && styles.timeSlotTextSelected,
                ]}
              >
                {time}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Số lượng buổi</Text>
        <Text style={styles.helperText}>Đặt nhiều buổi để tạo liệu trình điều trị</Text>
        <View style={styles.quantitySelector}>
          <TouchableOpacity 
            style={styles.quantityButton}
            onPress={() => setNumberOfSessions(Math.max(1, numberOfSessions - 1))}
          >
            <Ionicons name="remove" size={20} color="#E91E63" />
          </TouchableOpacity>
          <View style={styles.quantityDisplay}>
            <Text style={styles.quantityText}>{numberOfSessions}</Text>
            <Text style={styles.quantityLabel}>buổi</Text>
          </View>
          <TouchableOpacity 
            style={styles.quantityButton}
            onPress={() => setNumberOfSessions(Math.min(20, numberOfSessions + 1))}
          >
            <Ionicons name="add" size={20} color="#E91E63" />
          </TouchableOpacity>
        </View>
        {numberOfSessions > 1 && (
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={18} color="#E91E63" />
            <Text style={styles.infoText}>
              Sẽ tạo liệu trình {numberOfSessions} buổi. Các buổi tiếp theo sẽ được lên lịch sau.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );

  // Step 3: Notes & Summary
  const renderStepThree = () => {
    // Calculate discount
    const serviceTotal = (selectedService?.price || 0) * numberOfSessions;
    const discount = selectedPromotion
      ? selectedPromotion.discountType === 'percentage'
        ? serviceTotal * (selectedPromotion.discountValue / 100)
        : selectedPromotion.discountValue
      : 0;
    const total = serviceTotal - discount;

    return (
      <ScrollView style={styles.stepContent}>
        <Text style={styles.stepTitle}>Thông Tin Bổ Sung</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Ghi chú (tùy chọn)</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Thêm ghi chú cho cuộc hẹn..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Promotion Section */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Mã khuyến mãi</Text>
          <View style={styles.promoInputContainer}>
            <TextInput
              style={styles.promoInput}
              placeholder="Nhập mã khuyến mãi"
              value={promoCode}
              onChangeText={setPromoCode}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={styles.applyButton}
              onPress={handleApplyPromotion}
            >
              <Text style={styles.applyButtonText}>Áp dụng</Text>
            </TouchableOpacity>
          </View>
          {selectedPromotion && (
            <View style={styles.selectedPromoBox}>
              <View style={styles.selectedPromoHeader}>
                <Text style={styles.selectedPromoTitle}>{selectedPromotion.title}</Text>
                <TouchableOpacity onPress={() => setSelectedPromotion(null)}>
                  <Ionicons name="close-circle" size={20} color="#E91E63" />
                </TouchableOpacity>
              </View>
              <Text style={styles.selectedPromoDesc}>{selectedPromotion.description}</Text>
            </View>
          )}
          
          {/* Available Promotions List */}
          {promotions.length > 0 && (
            <View style={styles.promoListContainer}>
              <Text style={styles.promoListTitle}>Ưu đãi có sẵn:</Text>
              {promotions.map((promo) => {
                const isSelected = selectedPromotion?.id === promo.id;
                return (
                  <TouchableOpacity
                    key={promo.id}
                    style={[
                      styles.promoItem,
                      isSelected && styles.promoItemSelected
                    ]}
                    onPress={() => setSelectedPromotion(isSelected ? null : promo)}
                  >
                    <View style={styles.promoItemContent}>
                      <Text style={styles.promoItemTitle}>{promo.title}</Text>
                      <Text style={styles.promoItemCode}>Code: {promo.code}</Text>
                      <Text style={styles.promoItemDesc}>{promo.description}</Text>
                    </View>
                    <Ionicons 
                      name={isSelected ? "checkmark-circle" : "chevron-forward"} 
                      size={24} 
                      color={isSelected ? "#4CAF50" : "#999"} 
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Tóm Tắt Đặt Lịch</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Dịch vụ:</Text>
            <Text style={styles.summaryValue}>{selectedService?.name}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Số buổi:</Text>
            <Text style={styles.summaryValue}>{numberOfSessions} buổi</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Ngày bắt đầu:</Text>
            <Text style={styles.summaryValue}>
              {selectedDate.toLocaleDateString('vi-VN')}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Giờ:</Text>
            <Text style={styles.summaryValue}>{selectedTime}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Thời gian/buổi:</Text>
            <Text style={styles.summaryValue}>{selectedService?.duration} phút</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Giá/buổi:</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(selectedService?.price || 0)}
            </Text>
          </View>
          {discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Giảm giá:</Text>
              <Text style={[styles.summaryValue, styles.discountText]}>
                -{formatCurrency(discount)}
              </Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Tổng tiền:</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(total)}
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return renderStepOne();
      case 2:
        return renderStepTwo();
      case 3:
        return renderStepThree();
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        {[1, 2, 3].map((step) => (
          <View key={step} style={styles.progressStep}>
            <View
              style={[
                styles.progressCircle,
                currentStep >= step && styles.progressCircleActive,
              ]}
            >
              <Text
                style={[
                  styles.progressNumber,
                  currentStep >= step && styles.progressNumberActive,
                ]}
              >
                {step}
              </Text>
            </View>
            {step < 3 && (
              <View
                style={[
                  styles.progressLine,
                  currentStep > step && styles.progressLineActive,
                ]}
              />
            )}
          </View>
        ))}
      </View>

      {renderStep()}

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chọn phương thức thanh toán</Text>
            
            <TouchableOpacity
              style={[
                styles.paymentOption,
                paymentMethod === 'VNPay' && styles.paymentOptionSelected
              ]}
              onPress={() => setPaymentMethod('VNPay')}
            >
              <View style={styles.paymentOptionLeft}>
                <Ionicons name="card-outline" size={28} color="#0066CC" />
                <View style={styles.paymentOptionText}>
                  <Text style={styles.paymentOptionTitle}>VNPay</Text>
                  <Text style={styles.paymentOptionDesc}>Thanh toán qua cổng VNPay</Text>
                </View>
              </View>
              {paymentMethod === 'VNPay' && (
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.paymentOption,
                paymentMethod === 'Cash' && styles.paymentOptionSelected
              ]}
              onPress={() => setPaymentMethod('Cash')}
            >
              <View style={styles.paymentOptionLeft}>
                <Ionicons name="cash-outline" size={28} color="#10B981" />
                <View style={styles.paymentOptionText}>
                  <Text style={styles.paymentOptionTitle}>Tiền mặt</Text>
                  <Text style={styles.paymentOptionDesc}>Thanh toán tại quầy</Text>
                </View>
              </View>
              {paymentMethod === 'Cash' && (
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              )}
            </TouchableOpacity>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowPaymentModal(false)}
              >
                <Text style={styles.modalCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleProcessPayment}
              >
                <Text style={styles.modalConfirmText}>Xác nhận</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Navigation Buttons */}
      <View style={styles.footer}>
        {currentStep > 1 && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setCurrentStep(currentStep - 1)}
          >
            <Ionicons name="arrow-back" size={20} color="#E91E63" />
            <Text style={styles.backButtonText}>Quay lại</Text>
          </TouchableOpacity>
        )}
        
        {currentStep < 3 ? (
          <TouchableOpacity
            style={[styles.nextButton, currentStep === 1 && !selectedService && styles.buttonDisabled]}
            onPress={() => setCurrentStep(currentStep + 1)}
            disabled={currentStep === 1 && !selectedService}
          >
            <Text style={styles.nextButtonText}>Tiếp tục</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.nextButton} onPress={handleBooking}>
            <Text style={styles.nextButtonText}>Xác Nhận Đặt Lịch</Text>
            <Ionicons name="checkmark" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressCircleActive: {
    backgroundColor: '#E91E63',
  },
  progressNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#999',
  },
  progressNumberActive: {
    color: '#fff',
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 8,
  },
  progressLineActive: {
    backgroundColor: '#E91E63',
  },
  stepContent: {
    flex: 1,
    padding: 16,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  serviceCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceCardSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#F1F8E9',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  serviceDuration: {
    fontSize: 14,
    color: '#666',
  },
  servicePrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E91E63',
    marginRight: 8,
  },
  checkIcon: {
    marginLeft: 8,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dateButtonText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  timeSlots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlot: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  timeSlotSelected: {
    backgroundColor: '#E91E63',
    borderColor: '#E91E63',
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  timeSlotTextSelected: {
    color: '#fff',
  },
  checkingText: {
    fontSize: 12,
    color: '#E91E63',
    marginTop: 4,
    fontStyle: 'italic',
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginTop: 12,
  },
  quantityButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E91E63',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityDisplay: {
    alignItems: 'center',
    minWidth: 80,
  },
  quantityText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#E91E63',
  },
  quantityLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FFF0F5',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#C2185B',
    lineHeight: 18,
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  textArea: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 12,
    fontSize: 14,
    color: '#333',
    minHeight: 100,
  },
  summary: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginTop: 8,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E91E63',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  backButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E91E63',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E91E63',
    marginLeft: 8,
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#E91E63',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  paymentOptionSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#F1F8E9',
  },
  paymentOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentOptionText: {
    gap: 4,
  },
  paymentOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  paymentOptionDesc: {
    fontSize: 12,
    color: '#666',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E91E63',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E91E63',
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#E91E63',
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  // Promotion styles
  promoInputContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  promoInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 12,
    fontSize: 14,
    color: '#333',
  },
  applyButton: {
    backgroundColor: '#E91E63',
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  selectedPromoBox: {
    backgroundColor: '#F1F8E9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  selectedPromoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  selectedPromoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  selectedPromoDesc: {
    fontSize: 12,
    color: '#558B2F',
  },
  promoListContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  promoListTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  promoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  promoItemSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#F1F8E9',
  },
  promoItemContent: {
    flex: 1,
  },
  promoItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  promoItemCode: {
    fontSize: 12,
    color: '#E91E63',
    marginBottom: 2,
  },
  promoItemDesc: {
    fontSize: 11,
    color: '#666',
  },
  discountText: {
    color: '#4CAF50',
  },
});
