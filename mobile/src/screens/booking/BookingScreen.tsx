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
import { useFocusEffect } from '@react-navigation/native';
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
  const [userAppointments, setUserAppointments] = useState<any[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successAppointment, setSuccessAppointment] = useState<any>(null);
  const [redeemedVouchers, setRedeemedVouchers] = useState<Array<Promotion & { redeemedCount: number }>>([]);

  useEffect(() => {
    loadData();
  }, []);

  // Reset state when screen comes into focus (e.g., when navigating from another tab)
  useFocusEffect(
    React.useCallback(() => {
      // Reset to step 1 if coming from another tab
      if (currentStep > 1) {
        // Only reset if we're not in the middle of a booking flow
        // This allows users to continue their booking if they navigate back
      }
    }, [currentStep])
  );

  useEffect(() => {
    if (serviceId && services.length > 0) {
      const service = services.find((s) => s.id === serviceId);
      if (service) {
        setSelectedService(service);
        setCurrentStep(2);
      }
    }
  }, [serviceId, services]);

  // Load user appointments when date changes
  useEffect(() => {
    if (currentUser && selectedDate) {
      loadUserAppointments();
    }
  }, [currentUser, selectedDate]);

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
      
      // Load redeemed vouchers if user exists
      if (user) {
        try {
          const redeemed = await apiService.getMyRedeemedVouchers(user.id);
          setRedeemedVouchers(redeemed || []);
          console.log('✅ Loaded redeemed vouchers:', redeemed?.length || 0);
        } catch (error) {
          console.error('Error loading redeemed vouchers:', error);
          setRedeemedVouchers([]);
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      Alert.alert('Lỗi', 'Không thể tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  };

  const resetBookingState = () => {
    setCurrentStep(1);
    setSelectedService(null);
    setSelectedDate(new Date());
    setSelectedTime('09:00');
    setNumberOfSessions(1);
    setNotes('');
    setSelectedPromotion(null);
    setPromoCode('');
    setPaymentMethod('Cash');
    setShowPaymentModal(false);
    setShowSuccessModal(false);
    setSuccessAppointment(null);
    
    // Reload redeemed vouchers when resetting (in case voucher was refunded)
    if (currentUser) {
      apiService.getMyRedeemedVouchers(currentUser.id)
        .then(redeemed => {
          setRedeemedVouchers(redeemed || []);
        })
        .catch(error => {
          console.error('Error reloading redeemed vouchers:', error);
        });
    }
  };

  const handleViewAppointments = () => {
    resetBookingState();
    navigation.navigate('AppointmentsTab');
  };

  const handleGoHome = () => {
    resetBookingState();
    navigation.navigate('HomeTab');
  };

  const loadUserAppointments = async () => {
    if (!currentUser) return;
    
    try {
      setLoadingAppointments(true);
      const appointments = await apiService.getUserAppointments(currentUser.id);
      setUserAppointments(appointments || []);
      
      // Debug: Log appointments for selected date
      if (selectedDate) {
        const dateStr = formatDateLocal(selectedDate);
        const sameDayAppointments = (appointments || []).filter((apt: any) => {
          const aptDate = apt.date || apt.appointmentDate;
          // Normalize appointment date (remove time part if present)
          const normalizedAptDate = aptDate ? aptDate.split('T')[0] : '';
          return normalizedAptDate === dateStr && apt.status !== 'cancelled';
        });
        console.log(`📅 [Mobile] Loaded appointments for ${dateStr}:`, sameDayAppointments.length);
        sameDayAppointments.forEach((apt: any) => {
          const aptDuration = apt.Service?.duration || services.find(s => s.id === apt.serviceId)?.duration || 'N/A';
          console.log(`   - ${apt.time} (Service: ${apt.serviceId}, Duration: ${aptDuration})`);
        });
      }
    } catch (error) {
      console.error('Failed to load appointments:', error);
      setUserAppointments([]);
    } finally {
      setLoadingAppointments(false);
    }
  };

  const generateTimeSlots = () => {
    const slots: string[] = [];
    // Generate time slots from 9:00 to 22:00 with 15 minute intervals (giống website)
    for (let hour = 9; hour <= 22; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        // Stop at 22:00
        if (hour === 22 && minute > 0) break;
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

  // Helper function to format date to YYYY-MM-DD in local timezone (not UTC)
  const formatDateLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Check if a time slot is available (synchronous, uses loaded appointments)
  const isTimeSlotAvailable = (time: string, serviceDuration: number): boolean => {
    if (!selectedService || !currentUser || userAppointments.length === 0) return true;

    // Use local date format, not UTC (toISOString() causes timezone issues)
    const dateStr = formatDateLocal(selectedDate);
      
      // Filter appointments on same date with status not cancelled
      const sameDayAppointments = userAppointments.filter((apt: any) => {
        const aptDate = apt.date || apt.appointmentDate;
      // Normalize appointment date (remove time part if present)
      const normalizedAptDate = aptDate ? aptDate.split('T')[0] : '';
      const matches = normalizedAptDate === dateStr && apt.status !== 'cancelled';
      
      if (matches) {
        console.log(`🔍 [Mobile] Found appointment on ${dateStr}: ${apt.time} (Service: ${apt.serviceId})`);
      }
      
      return matches;
      });

      if (sameDayAppointments.length === 0) return true;

      // Convert time to minutes for comparison
      const [hours, minutes] = time.split(':').map(Number);
      const selectedStartMinutes = hours * 60 + minutes;
      const selectedEndMinutes = selectedStartMinutes + serviceDuration;

    // Check for conflicts with each existing appointment
      for (const apt of sameDayAppointments) {
        const aptTime = apt.time || apt.appointmentDate?.split('T')[1]?.substring(0, 5) || '00:00';
        const [aptHours, aptMinutes] = aptTime.split(':').map(Number);
        const aptStartMinutes = aptHours * 60 + aptMinutes;
      // Try to get duration from Service object, or use default 60
      const aptDuration = apt.Service?.duration || services.find(s => s.id === apt.serviceId)?.duration || 60;
        const aptEndMinutes = aptStartMinutes + aptDuration;

      // Logic đúng theo yêu cầu:
      // 1. Nếu đặt lịch SAU một appointment đã có: Phải sau khi appointment đó kết thúc (newStart >= existingEnd)
      //    - Không cần gap, chỉ cần không overlap
      // 2. Nếu đặt lịch TRƯỚC một appointment đã có: Phải trước khi appointment đó bắt đầu ít nhất bằng duration của dịch vụ mới
      //    - newStart <= existingStart - selectedServiceDuration

      // Kiểm tra overlap (không được overlap)
      if (selectedStartMinutes < aptEndMinutes && selectedEndMinutes > aptStartMinutes) {
        // Có overlap → không hợp lệ
          return false;
        }

      // Nếu appointment mới đứng SAU appointment đã đặt (selectedStart >= aptEnd)
      // → Chỉ cần không overlap, không cần gap
      if (selectedStartMinutes >= aptEndMinutes) {
        // Hợp lệ: đặt sau, không overlap
        continue;
      }

      // Nếu appointment mới đứng TRƯỚC appointment đã đặt (selectedEnd <= aptStart)
      // → Phải đảm bảo có đủ thời gian cho dịch vụ mới trước khi appointment cũ bắt đầu
      // selectedStart + serviceDuration <= aptStart
      // selectedStart <= aptStart - serviceDuration
      if (selectedEndMinutes <= aptStartMinutes) {
        // Kiểm tra: dịch vụ mới phải kết thúc trước khi appointment cũ bắt đầu
        // selectedEnd <= aptStart (đã đúng vì đang ở trong if này)
        // Nhưng cần đảm bảo có đủ thời gian: selectedStart <= aptStart - serviceDuration
        const requiredStartTime = aptStartMinutes - serviceDuration;
        if (selectedStartMinutes > requiredStartTime) {
          // Không đủ thời gian trước appointment cũ
          return false;
        }
        // Hợp lệ: đặt trước, có đủ thời gian
        continue;
      }

      // Nếu đến đây, có nghĩa là có overlap hoặc không hợp lệ
      return false;
    }

    return true;
  };

  // Async check for final validation (used when user selects time)
  const checkTimeSlotAvailability = async (date: Date, time: string, serviceDuration: number): Promise<boolean> => {
    // Use synchronous check with loaded appointments
    return isTimeSlotAvailable(time, serviceDuration);
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

  // Helper: Check if promotion is applicable (similar to web)
  const isPromotionApplicable = (promo: Promotion): boolean => {
    if (!currentUser) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 1. Must be active
    if (promo.isActive === false) return false;
    
    // 2. Not expired
    const expiryDate = new Date(promo.expiryDate);
    expiryDate.setHours(0, 0, 0, 0);
    if (expiryDate < today) return false;
    
    // 3. Check stock availability - CHỈ cho voucher public, KHÔNG cho voucher đổi điểm
    const promoAny = promo as any;
    const isPublicValue: any = promoAny.isPublic;
    const normalizedIsPublic = isPublicValue === true ||
                               isPublicValue === 1 ||
                               (typeof isPublicValue === 'string' && isPublicValue === '1');
    
    if (normalizedIsPublic && promo.stock !== null && promo.stock !== undefined && promo.stock <= 0) {
      return false;
    }
    
    // 4. Calculate current order total
    if (!selectedService) return false;
    const currentOrderTotal = selectedService.price * numberOfSessions;
    
    // 5. Check minimum order value
    if (promo.minOrderValue && currentOrderTotal < promo.minOrderValue) return false;
    
    // 6. Check if promo applies to selected service
    if (promo.applicableServiceIds && promo.applicableServiceIds.length > 0) {
      if (!promo.applicableServiceIds.includes(selectedService.id)) return false;
    }
    
    // 7. Check if user has already used this voucher
    if (promo.targetAudience === 'Birthday') {
      // Birthday vouchers: Check if used this year
      const hasUsedBirthdayVoucher = redeemedVouchers.some(rv => 
        rv.targetAudience === 'Birthday' && rv.redeemedCount > 0
      );
      if (hasUsedBirthdayVoucher) return false;
    }
    
    if (promo.targetAudience === 'New Clients') {
      // New client vouchers: Check if already used
      const hasUsedNewClientVoucher = redeemedVouchers.some(rv => 
        rv.targetAudience === 'New Clients' && rv.redeemedCount > 0
      );
      if (hasUsedNewClientVoucher) return false;
    }
    
    // For other vouchers (Bronze, Silver, Gold, etc.): Check if user has used this specific voucher
    if (promo.targetAudience !== 'Birthday' && promo.targetAudience !== 'New Clients') {
      const hasUsedThisVoucher = redeemedVouchers.some(rv => 
        rv.id === promo.id && rv.redeemedCount > 0
      );
      if (hasUsedThisVoucher) return false;
    }
    
    return true;
  };

  const handleApplyPromotion = async () => {
    if (!promoCode.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập mã khuyến mãi');
      return;
    }

    try {
      // Check in both promotions and redeemedVouchers
      let promo = promotions.find(p => p.code.toLowerCase() === promoCode.toLowerCase());
      
      // If not found in promotions, check in redeemedVouchers
      if (!promo) {
        const redeemedPromo = redeemedVouchers.find((rv: any) => 
          rv.code && rv.code.toLowerCase() === promoCode.toLowerCase()
        );
        if (redeemedPromo) {
          promo = redeemedPromo as Promotion;
        }
      }
      
      if (!promo) {
        Alert.alert('Lỗi', 'Mã khuyến mãi không hợp lệ');
        return;
      }

      // Check if promotion is applicable
      if (!isPromotionApplicable(promo)) {
        Alert.alert('Lỗi', 'Mã khuyến mãi không thể sử dụng. Có thể bạn đã sử dụng mã này hoặc mã không áp dụng cho dịch vụ đã chọn.');
        return;
      }

      setSelectedPromotion(promo);
      setPromoCode(''); // Clear promo code input
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
      // Use local date format, not UTC (toISOString() causes timezone issues)
      const appointmentData = {
        serviceId: selectedService.id,
        userId: currentUser.id,
        date: formatDateLocal(selectedDate),
        time: selectedTime,
        quantity: numberOfSessions,
        notes,
        status: 'pending' as const,
        paymentStatus: 'Unpaid' as const,
        promotionId: selectedPromotion?.id || null, // Include promotion ID if selected
      };

      const appointment = await apiService.createAppointment(appointmentData);
      
      // QUAN TRỌNG: Đợi một chút để đảm bảo backend đã commit update PromotionUsage
      // Sau đó mới refresh để frontend lấy dữ liệu mới nhất
      await new Promise(resolve => setTimeout(resolve, 500)); // Đợi 500ms
      
      // Reload redeemed vouchers ngay lập tức để cập nhật state
      if (currentUser) {
        try {
          const fetchedRedeemed = await apiService.getMyRedeemedVouchers(currentUser.id);
          setRedeemedVouchers(fetchedRedeemed || []);
          console.log('✅ Reloaded redeemed vouchers after booking:', fetchedRedeemed?.length || 0);
        } catch (error) {
          console.error('Error reloading redeemed vouchers:', error);
        }
      }

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
                { 
                  text: 'Xem lịch hẹn', 
                  onPress: () => {
                    resetBookingState();
                    navigation.navigate('AppointmentsTab');
                  }
                },
                { 
                  text: 'Về trang chủ', 
                  style: 'cancel',
                  onPress: () => {
                    resetBookingState();
                    navigation.navigate('HomeTab');
                  }
                }
              ]
            );
          } else {
            throw new Error('Không thể mở link thanh toán');
          }
        }
      } else {
        // Cash payment - Show success modal
        setSuccessAppointment({
          ...appointment,
          serviceName: selectedService.name,
          amount: amount,
          paymentMethod: 'Cash'
        });
        setShowSuccessModal(true);
        
        // Clear selected promotion after successful booking
        setSelectedPromotion(null);
        setPromoCode('');
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
          {timeSlots.map((time) => {
            const isAvailable = selectedService 
              ? isTimeSlotAvailable(time, selectedService.duration)
              : true;
            const isSelected = selectedTime === time;
            const isDisabled = checkingAvailability || !isAvailable;

            return (
            <TouchableOpacity
              key={time}
              style={[
                styles.timeSlot,
                  isSelected && styles.timeSlotSelected,
                  !isAvailable && styles.timeSlotDisabled,
              ]}
              onPress={() => handleTimeSelect(time)}
                disabled={isDisabled}
            >
              <Text
                style={[
                  styles.timeSlotText,
                    isSelected && styles.timeSlotTextSelected,
                    !isAvailable && styles.timeSlotTextDisabled,
                ]}
              >
                {time}
              </Text>
            </TouchableOpacity>
            );
          })}
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
          {(() => {
            // Filter applicable promotions (similar to web logic)
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (!selectedService) return null;
            const currentOrderTotal = selectedService.price * numberOfSessions;
            
            // Filter public promotions
            const filteredPromotions = promotions.filter(p => {
              if (p.isActive === false) return false;
              const expiryDate = new Date(p.expiryDate);
              expiryDate.setHours(0, 0, 0, 0);
              if (expiryDate < today) return false;
              
              const pAny = p as any;
              const isPublicValue: any = pAny.isPublic;
              const normalizedIsPublic = isPublicValue === true ||
                                       isPublicValue === 1 ||
                                       (typeof isPublicValue === 'string' && isPublicValue === '1');
              
              if (normalizedIsPublic && p.stock !== null && p.stock !== undefined && p.stock <= 0) {
                return false;
              }
              
              if (p.minOrderValue && currentOrderTotal < p.minOrderValue) return false;
              
              if (p.applicableServiceIds && p.applicableServiceIds.length > 0) {
                if (!p.applicableServiceIds.includes(selectedService.id)) return false;
              }
              
              return isPromotionApplicable(p);
            });
            
            // Filter redeemed vouchers (voucher đổi điểm)
            const filteredRedeemedVouchers = redeemedVouchers.filter((v: any) => {
              const isPublicValue: any = v.isPublic;
              const isPublicNormalized = isPublicValue === true ||
                                       isPublicValue === 1 ||
                                       (typeof isPublicValue === 'string' && isPublicValue === '1');
              
              // CHỈ lấy voucher đổi điểm (isPublic = false)
              if (isPublicNormalized) return false;
              
              if (!v.redeemedCount || v.redeemedCount <= 0) return false;
              if (v.isActive === false) return false;
              
              const expiryDate = new Date(v.expiryDate);
              expiryDate.setHours(0, 0, 0, 0);
              if (today > expiryDate) return false;
              
              if (v.minOrderValue && currentOrderTotal < v.minOrderValue) return false;
              
              if (v.applicableServiceIds && v.applicableServiceIds.length > 0) {
                if (!v.applicableServiceIds.includes(selectedService.id)) return false;
              }
              
              return true;
            });
            
            // Combine and remove duplicates
            const allAvailablePromotions = [
              ...filteredPromotions,
              ...filteredRedeemedVouchers.filter((rv: any) => 
                !filteredPromotions.some(p => p.id === rv.id || p.code === rv.code)
              )
            ];
            
            if (allAvailablePromotions.length === 0) return null;
            
            return (
              <View style={styles.promoListContainer}>
                <Text style={styles.promoListTitle}>Ưu đãi có sẵn:</Text>
                {allAvailablePromotions.map((promo: any) => {
                  const isSelected = selectedPromotion?.id === promo.id;
                  const isRedeemedVoucher = !(promo.isPublic === true || promo.isPublic === 1 || (typeof promo.isPublic === 'string' && promo.isPublic === '1'));
                  const showRedeemedText = isRedeemedVoucher && promo.redeemedCount && promo.redeemedCount > 0;
                  
                  return (
                    <TouchableOpacity
                      key={promo.id}
                      style={[
                        styles.promoItem,
                        isSelected && styles.promoItemSelected
                      ]}
                      onPress={() => {
                        if (isSelected) {
                          setSelectedPromotion(null);
                        } else {
                          // Check if applicable before selecting
                          if (isPromotionApplicable(promo)) {
                            setSelectedPromotion(promo);
                            setPromoCode(''); // Clear promo code input
                          } else {
                            Alert.alert('Lỗi', 'Mã khuyến mãi không thể sử dụng. Có thể bạn đã sử dụng mã này hoặc mã không áp dụng cho dịch vụ đã chọn.');
                          }
                        }
                      }}
                    >
                      <View style={styles.promoItemContent}>
                        <Text style={styles.promoItemTitle}>
                          {promo.title}
                          {showRedeemedText && promo.redeemedCount > 1 
                            ? ` [Bạn có ${promo.redeemedCount} voucher]`
                            : showRedeemedText ? ' [Voucher đã đổi]' : ''}
                        </Text>
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
            );
          })()}
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

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={handleViewAppointments}
      >
        <View style={styles.successModalOverlay}>
          <View style={styles.successModalContent}>
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
            </View>
            <Text style={styles.successTitle}>Đặt lịch thành công!</Text>
            <Text style={styles.successMessage}>
              Lịch hẹn của bạn đã được xác nhận. Vui lòng thanh toán tại quầy khi đến spa.
            </Text>
            
            {successAppointment && (
              <View style={styles.successDetails}>
                <View style={styles.successDetailRow}>
                  <Text style={styles.successDetailLabel}>Dịch vụ:</Text>
                  <Text style={styles.successDetailValue}>{successAppointment.serviceName}</Text>
                </View>
                <View style={styles.successDetailRow}>
                  <Text style={styles.successDetailLabel}>Ngày:</Text>
                  <Text style={styles.successDetailValue}>
                    {new Date(successAppointment.date).toLocaleDateString('vi-VN', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Text>
                </View>
                <View style={styles.successDetailRow}>
                  <Text style={styles.successDetailLabel}>Giờ:</Text>
                  <Text style={styles.successDetailValue}>{successAppointment.time}</Text>
                </View>
                <View style={styles.successDetailRow}>
                  <Text style={styles.successDetailLabel}>Tổng tiền:</Text>
                  <Text style={styles.successDetailValue}>
                    {formatCurrency(successAppointment.amount)}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.successModalFooter}>
              <TouchableOpacity
                style={styles.successButtonPrimary}
                onPress={handleViewAppointments}
              >
                <Ionicons name="calendar-outline" size={20} color="#fff" />
                <Text style={styles.successButtonPrimaryText}>Xem lịch hẹn</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.successButtonSecondary}
                onPress={handleGoHome}
              >
                <Ionicons name="home-outline" size={20} color="#E91E63" />
                <Text style={styles.successButtonSecondaryText}>Về trang chủ</Text>
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
  timeSlotDisabled: {
    backgroundColor: '#f5f5f5',
    borderColor: '#d0d0d0',
    opacity: 0.6,
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  timeSlotTextSelected: {
    color: '#fff',
  },
  timeSlotTextDisabled: {
    color: '#999',
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
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  successIconContainer: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  successDetails: {
    width: '100%',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  successDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  successDetailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  successDetailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  successModalFooter: {
    width: '100%',
    gap: 12,
  },
  successButtonPrimary: {
    backgroundColor: '#E91E63',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  successButtonPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  successButtonSecondary: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E91E63',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  successButtonSecondaryText: {
    color: '#E91E63',
    fontSize: 16,
    fontWeight: 'bold',
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
