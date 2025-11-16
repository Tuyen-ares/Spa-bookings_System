import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import type { Service, User, Appointment, PaymentMethod, Promotion, TreatmentCourse, Review, Room, StaffShift } from '../../types';
import { StarIcon, VNPayIcon, CheckCircleIcon, ChevronLeftIcon, ChevronRightIcon } from '../../shared/icons';
import * as apiService from '../services/apiService';

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + ' đ';
};

interface BookingPageProps {
    currentUser: User | null;
}

export const BookingPage: React.FC<BookingPageProps> = ({ currentUser }) => {
    const location = useLocation();
    const navigate = useNavigate();

    // State
    const [currentStep, setCurrentStep] = useState(1);
    const [services, setServices] = useState<Service[]>([]);
    const [selectedServices, setSelectedServices] = useState<Service[]>([]);
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [selectedTime, setSelectedTime] = useState<string>('');
    const [staffList, setStaffList] = useState<User[]>([]);
    const [staffShifts, setStaffShifts] = useState<StaffShift[]>([]);
    const [selectedStaff, setSelectedStaff] = useState<User | null>(null);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
    const [treatmentCourses, setTreatmentCourses] = useState<TreatmentCourse[]>([]);
    const [selectedTab, setSelectedTab] = useState<'upcoming' | 'history' | 'courses'>('upcoming');
    const [userAppointments, setUserAppointments] = useState<Appointment[]>([]);
    const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('VNPay');
    const [promoCode, setPromoCode] = useState<string>('');

    // Generate flexible time slots from 9:00 to 22:00 with 15 minute intervals
    const generateTimeSlots = () => {
        const slots: string[] = [];
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

    const availableTimeSlots = generateTimeSlots();

    // Load data
    useEffect(() => {
        loadInitialData();
    }, []);

    // Reset selected staff when date changes if staff doesn't have shift on new date
    useEffect(() => {
        if (selectedStaff && selectedDate) {
            const hasShiftOnDate = staffShifts.some(shift =>
                shift.staffId === selectedStaff.id &&
                shift.date === selectedDate &&
                shift.status === 'approved' &&
                shift.shiftType !== 'leave'
            );
            
            if (!hasShiftOnDate) {
                setSelectedStaff(null);
            }
        }
    }, [selectedDate, staffShifts, selectedStaff]);

    const loadInitialData = async () => {
        try {
            const [servicesData, usersData, promotionsData, coursesData, reviewsData, appointmentsData, roomsData, shiftsData] = await Promise.all([
                apiService.getServices(),
                apiService.getUsers(),
                apiService.getPromotions(),
                apiService.getTreatmentCourses(),
                apiService.getReviews(),
                apiService.getAppointments(),
                apiService.getRooms(),
                apiService.getAllStaffShifts()
            ]);

            setServices(servicesData);
            setStaffList(usersData.filter(u => u.role === 'Staff'));
            setPromotions(promotionsData.filter(p => p.isActive));
            setTreatmentCourses(coursesData);
            setReviews(reviewsData);
            setAllAppointments(appointmentsData);
            setRooms(roomsData);
            setStaffShifts(shiftsData);

            if (currentUser) {
                setUserAppointments(appointmentsData.filter(a => a.userId === currentUser.id));
            }
        } catch (error) {
            console.error('Error loading data:', error);
        }
    };

    // Step 1: Select Service
    const handleServiceToggle = (service: Service) => {
        const isSelected = selectedServices.some(s => s.id === service.id);
        if (isSelected) {
            setSelectedServices(selectedServices.filter(s => s.id !== service.id));
        } else {
            setSelectedServices([...selectedServices, service]);
        }
    };

    // Step 2: Select Time
    const isTimeSlotBooked = (time: string) => {
        if (!selectedDate) return false;
        return userAppointments.some(apt => 
            apt.date === selectedDate && 
            apt.time === time && 
            apt.status !== 'cancelled'
        );
    };

    // Step 3: Select Staff
    const getStaffRating = (staffId: string) => {
        // Get all appointments for this staff
        const staffAppointmentIds = allAppointments
            .filter(apt => apt.therapistId === staffId)
            .map(apt => apt.id);
        
        // Get reviews for those appointments
        const staffReviews = reviews.filter(r => 
            r.appointmentId && staffAppointmentIds.includes(r.appointmentId) && r.rating
        );
        
        if (staffReviews.length === 0) return 0;
        const totalRating = staffReviews.reduce((sum, r) => sum + r.rating, 0);
        return parseFloat((totalRating / staffReviews.length).toFixed(1));
    };

    const getStaffReviewCount = (staffId: string) => {
        const staffAppointmentIds = allAppointments
            .filter(apt => apt.therapistId === staffId)
            .map(apt => apt.id);
        
        return reviews.filter(r => r.appointmentId && staffAppointmentIds.includes(r.appointmentId)).length;
    };

    const getRoomName = (roomId?: string) => {
        if (!roomId) return 'Chưa phân phòng';
        const room = rooms.find(r => r.id === roomId);
        return room?.name || 'Không xác định';
    };

    // Filter staff who have shifts on the selected date
    const availableStaff = useMemo(() => {
        if (!selectedDate) return staffList;
        
        // Get shifts on the selected date
        const shiftsOnDate = staffShifts.filter(shift => 
            shift.date === selectedDate &&
            shift.status === 'approved' &&
            shift.shiftType !== 'leave'
        );

        // Get staff IDs who have shifts on this date
        const staffIdsWithShifts = new Set(shiftsOnDate.map(shift => shift.staffId));

        // Filter staff list to only include those with shifts
        return staffList.filter(staff => staffIdsWithShifts.has(staff.id));
    }, [selectedDate, staffShifts, staffList]);

    // Step 4: Confirmation
    const calculateTotal = () => {
        const servicesTotal = selectedServices.reduce((sum, s) => sum + s.price, 0);
        const discount = selectedPromotion ? 
            (selectedPromotion.discountType === 'percentage' 
                ? servicesTotal * (selectedPromotion.discountValue / 100)
                : selectedPromotion.discountValue
            ) : 0;
        return Math.max(0, servicesTotal - discount);
    };

    const handleConfirmBooking = async () => {
        if (!currentUser) {
            alert('Vui lòng đăng nhập để đặt lịch');
            navigate('/login');
            return;
        }

        if (!selectedStaff || !selectedDate || !selectedTime) {
            alert('Vui lòng chọn đầy đủ thông tin');
            return;
        }

        setIsPaymentModalOpen(true);
    };

    const handleProcessPayment = async () => {
        try {
            const bookingGroupId = uuidv4();
            
            // Apply promotion code if selected (increment usageCount)
            if (selectedPromotion) {
                try {
                    const result = await apiService.applyPromotion(selectedPromotion.code);
                    console.log('Promotion applied successfully:', result);
                    // Update promotion in local state with new usageCount
                    if (result.promotion) {
                        setPromotions(prev => prev.map(p => 
                            p.id === result.promotion.id ? result.promotion : p
                        ));
                    }
                } catch (error: any) {
                    console.error('Failed to apply promotion:', error);
                    const errorMsg = error.message || 'Lỗi khi áp dụng mã khuyến mãi';
                    console.error('Error message:', errorMsg);
                    
                    // Show error to user and stop booking process if promotion fails
                    alert(`Không thể áp dụng mã khuyến mãi: ${errorMsg}`);
                    setIsPaymentModalOpen(false);
                    return; // Stop the booking process
                }
            }
            
            // Create appointments for each service
            const appointmentsToCreate = selectedServices.map(service => ({
                id: `apt-${uuidv4()}`,
                userId: currentUser!.id,
                serviceId: service.id,
                serviceName: service.name,
                therapistId: selectedStaff!.id,
                therapistName: selectedStaff!.name,
                date: selectedDate,
                time: selectedTime,
                status: 'pending' as const,
                paymentStatus: 'Unpaid' as const,
                notes: '',
                bookingGroupId: bookingGroupId
            }));

            // Create all appointments
            const createdAppointments = await Promise.all(
                appointmentsToCreate.map(apt => apiService.createAppointment(apt))
            );

            // Process payment
            const totalAmount = calculateTotal();
            const result = await apiService.processPayment(
                createdAppointments[0].id,
                paymentMethod,
                totalAmount
            );

            // Emit event to refresh appointments in App.tsx
            window.dispatchEvent(new Event('refresh-appointments'));

            if (paymentMethod === 'VNPay' && result.paymentUrl) {
                window.location.href = result.paymentUrl;
            } else if (paymentMethod === 'Cash') {
                // Reload appointments before showing success message
                try {
                    const updatedAppointments = await apiService.getAppointments();
                    console.log('Refreshed appointments:', updatedAppointments.length);
                    // Trigger App.tsx to update via custom event with data
                    window.dispatchEvent(new CustomEvent('appointments-updated', { 
                        detail: { appointments: updatedAppointments } 
                    }));
                } catch (error) {
                    console.error('Failed to refresh appointments:', error);
                }
                
                alert('Đặt lịch thành công! Vui lòng thanh toán tại quầy.');
                navigate('/appointments');
            }
        } catch (error) {
            console.error('Error processing payment:', error);
            alert('Có lỗi xảy ra khi xử lý thanh toán');
        }
    };

    const renderStepIndicator = () => {
        const steps = [
            { num: 1, label: 'Select Service' },
            { num: 2, label: 'Chọn Thời Gian' },
            { num: 3, label: 'Chọn Nhân Viên' },
            { num: 4, label: 'Xác Nhận' }
        ];

        return (
            <div className="flex justify-center items-center mb-8">
                {steps.map((step, idx) => (
                    <React.Fragment key={step.num}>
                        <div className="flex flex-col items-center">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${
                                currentStep >= step.num ? 'bg-amber-600' : 'bg-gray-300'
                            }`}>
                                {step.num}
                            </div>
                            <div className={`mt-2 text-sm ${
                                currentStep >= step.num ? 'text-amber-600 font-semibold' : 'text-gray-400'
                            }`}>
                                {step.label}
                            </div>
                        </div>
                        {idx < steps.length - 1 && (
                            <div className={`w-16 h-1 mx-2 ${
                                currentStep > step.num ? 'bg-amber-600' : 'bg-gray-300'
                            }`} style={{ marginTop: '-20px' }} />
                        )}
                    </React.Fragment>
                ))}
            </div>
        );
    };

    const renderStep1 = () => (
        <div className="max-w-4xl mx-auto">
            <div className="max-h-[500px] overflow-y-auto border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {services.map(service => {
                        const isSelected = selectedServices.some(s => s.id === service.id);
                        return (
                            <div
                                key={service.id}
                                onClick={() => handleServiceToggle(service)}
                                className={`border rounded-lg p-4 cursor-pointer transition ${
                                    isSelected ? 'border-amber-600 bg-amber-50' : 'border-gray-200 hover:border-amber-400'
                                }`}
                            >
                                <div className="flex gap-4">
                                    <img
                                        src={service.imageUrl || '/placeholder.jpg'}
                                        alt={service.name}
                                        className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-800 truncate">{service.name}</h3>
                                        <p className="text-sm text-gray-600">{service.duration} phút</p>
                                        <p className="text-amber-600 font-semibold mt-1">{formatPrice(service.price)}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            <div className="flex justify-between mt-8">
                <button
                    onClick={() => navigate(-1)}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
                >
                    Trước
                </button>
                <button
                    onClick={() => setCurrentStep(2)}
                    disabled={selectedServices.length === 0}
                    className="px-6 py-3 bg-amber-700 text-white rounded-lg hover:bg-amber-800 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold"
                >
                    Tiếp theo
                </button>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-2">Chọn Ngày</label>
                <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
            </div>

            <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-2">Chọn Giờ</label>
                <select
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                >
                    <option value="">-- Chọn khung giờ --</option>
                    {availableTimeSlots.map(time => {
                        const isBooked = isTimeSlotBooked(time);
                        return (
                            <option 
                                key={time} 
                                value={time}
                                disabled={isBooked}
                                className={isBooked ? 'text-gray-400' : ''}
                            >
                                {time} {isBooked ? '(Đã đặt)' : ''}
                            </option>
                        );
                    })}
                </select>
            </div>

            <div className="flex justify-between mt-8">
                <button
                    onClick={() => setCurrentStep(1)}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
                >
                    Trước
                </button>
                <button
                    onClick={() => setCurrentStep(3)}
                    disabled={!selectedDate || !selectedTime}
                    className="px-6 py-3 bg-amber-700 text-white rounded-lg hover:bg-amber-800 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold"
                >
                    Tiếp theo
                </button>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="max-w-2xl mx-auto">
            <p className="text-center text-gray-600 mb-6 font-medium">Chọn chuyên viên mà bạn muốn</p>
            
            {availableStaff.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">Không có nhân viên nào có ca làm việc vào ngày này</p>
                    <p className="text-gray-400 text-sm mt-2">Vui lòng chọn ngày khác</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableStaff.map(staff => {
                        const isSelected = selectedStaff?.id === staff.id;
                        return (
                            <div
                                key={staff.id}
                                onClick={() => setSelectedStaff(staff)}
                                className={`border rounded-lg p-4 cursor-pointer transition ${
                                    isSelected ? 'border-amber-600 bg-amber-50' : 'border-gray-200 hover:border-amber-400'
                                }`}
                            >
                                <div className="flex gap-4">
                                    <img
                                        src={staff.profilePictureUrl || '/default-avatar.png'}
                                        alt={staff.name}
                                        className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-800">{staff.name}</h3>
                                        <p className="text-sm text-gray-600 truncate">{staff.email || 'Chuyên viên'}</p>
                                        <div className="flex items-center gap-1 mt-1">
                                            <StarIcon className="w-4 h-4 text-yellow-500" />
                                            <span className="text-sm font-semibold">{getStaffRating(staff.id)}</span>
                                            <span className="text-sm text-gray-500">({getStaffReviewCount(staff.id)} đánh giá)</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="flex justify-between mt-8">
                <button
                    onClick={() => setCurrentStep(2)}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
                >
                    Trước
                </button>
                <button
                    onClick={() => setCurrentStep(4)}
                    disabled={!selectedStaff}
                    className="px-6 py-3 bg-amber-700 text-white rounded-lg hover:bg-amber-800 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold"
                >
                    Tiếp theo
                </button>
            </div>
        </div>
    );

    const renderStep4 = () => {
        const servicesTotal = selectedServices.reduce((sum, s) => sum + s.price, 0);
        const discount = selectedPromotion ? 
            (selectedPromotion.discountType === 'percentage' 
                ? servicesTotal * (selectedPromotion.discountValue / 100)
                : selectedPromotion.discountValue
            ) : 0;
        const total = Math.max(0, servicesTotal - discount);

        return (
            <div className="max-w-2xl mx-auto">
                <div className="bg-amber-50 rounded-lg p-6 mb-6">
                    <h3 className="font-semibold text-gray-800 mb-4">Thông tin đặt lịch hẹn</h3>
                    <div className="space-y-2 text-sm">
                        <p><strong>Dịch vụ:</strong> {selectedServices.map(s => s.name).join(', ')}</p>
                        <p><strong>Ngày:</strong> {selectedDate}</p>
                        <p><strong>Giờ:</strong> {selectedTime}</p>
                        <p><strong>Chuyên viên:</strong> {selectedStaff?.name}</p>
                    </div>
                </div>

                <div className="mb-6">
                    <label className="block text-gray-700 font-semibold mb-2">Mã giảm giá (nếu có)</label>
                    <div className="flex items-center gap-2 mb-3">
                        <input
                            type="text"
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value)}
                            placeholder="Nhập mã giảm giá"
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        />
                        <button
                            onClick={() => {
                                if (!promoCode.trim()) {
                                    alert('Vui lòng nhập mã khuyến mãi');
                                    return;
                                }
                                const promo = promotions.find(p => p.code === promoCode.toUpperCase());
                                if (promo) {
                                    // Check if promotion has stock (số lượng còn lại)
                                    if (promo.stock !== null && promo.stock <= 0) {
                                        alert('Mã khuyến mãi đã hết lượt sử dụng');
                                        return;
                                    }
                                    // Check expiry
                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);
                                    const expiryDate = new Date(promo.expiryDate);
                                    expiryDate.setHours(0, 0, 0, 0);
                                    if (today > expiryDate) {
                                        alert('Mã khuyến mãi đã hết hạn');
                                        return;
                                    }
                                    setSelectedPromotion(promo);
                                    alert('Chọn mã thành công! Mã sẽ được áp dụng khi đặt lịch.');
                                } else {
                                    alert('Mã giảm giá không hợp lệ');
                                }
                            }}
                            className="px-6 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 font-semibold"
                        >
                            Áp dụng
                        </button>
                    </div>
                    
                    <p className="text-sm text-gray-500 mb-3">Ấn danh sách ưu đãi</p>
                    <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                        <div className="space-y-2">
                            {promotions.length === 0 ? (
                                <p className="text-center text-gray-400 py-4">Không có mã giảm giá khả dụng</p>
                            ) : (
                                promotions.map(promo => {
                                    const isSelected = selectedPromotion?.id === promo.id;
                                    return (
                                        <div
                                            key={promo.id}
                                            className={`border rounded-lg p-3 flex justify-between items-center ${
                                                isSelected ? 'border-amber-600 bg-amber-50' : 'border-gray-200'
                                            }`}
                                        >
                                            <div className="flex-1 pr-4">
                                                <p className="font-semibold text-sm">{promo.title}</p>
                                                <p className="text-xs text-gray-600 mt-1">{promo.description}</p>
                                            </div>
                                            <button
                                                onClick={() => setSelectedPromotion(isSelected ? null : promo)}
                                                className={`px-4 py-1 rounded text-sm font-semibold whitespace-nowrap ${
                                                    isSelected 
                                                        ? 'bg-amber-600 text-white'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                            >
                                                Chọn
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-gray-300 rounded-lg p-4 mb-6">
                    <div className="flex justify-between text-lg">
                        <span className="font-semibold">Tổng cộng:</span>
                        <span className="font-bold text-amber-600">{formatPrice(total)}</span>
                    </div>
                    {discount > 0 && (
                        <p className="text-sm text-green-600 text-right mt-1">
                            Đã giảm: {formatPrice(discount)}
                        </p>
                    )}
                </div>

                <div className="flex justify-between">
                    <button
                        onClick={() => setCurrentStep(3)}
                        className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
                    >
                        Trước
                    </button>
                    <button
                        onClick={handleConfirmBooking}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                    >
                        Xác nhận đặt lịch
                    </button>
                </div>
            </div>
        );
    };

    const renderPaymentModal = () => {
        if (!isPaymentModalOpen) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg p-6 max-w-md w-full">
                    <h2 className="text-2xl font-bold   text-gray-800 mb-4">Chọn phương thức thanh toán</h2>
                    
                    <div className="space-y-3 mb-6">
                        <button
                            onClick={() => setPaymentMethod('VNPay')}
                            className={`w-full p-4 border rounded-lg flex items-center gap-3 ${
                                paymentMethod === 'VNPay' ? 'border-amber-600 bg-amber-50' : 'border-gray-200'
                            }`}
                        >
                            <VNPayIcon className="w-8 h-8" />
                            <span className="font-semibold">Thanh toán VNPay</span>
                        </button>
                        
                        <button
                            onClick={() => setPaymentMethod('Cash')}
                            className={`w-full p-4 border rounded-lg flex items-center gap-3 ${
                                paymentMethod === 'Cash' ? 'border-amber-600 bg-amber-50' : 'border-gray-200'
                            }`}
                        >
                            <span className="text-2xl">💵</span>
                            <span className="font-semibold">Thanh toán tại quầy</span>
                        </button>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setIsPaymentModalOpen(false)}
                            className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleProcessPayment}
                            className="flex-1 px-4 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                        >
                            Xác nhận
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4">
                <h1 className="text-3xl font-bold text-center text-amber-700 mb-8">Đặt Lịch Hẹn</h1>
                
                {renderStepIndicator()}
                
                <div className="mt-8">
                    {currentStep === 1 && renderStep1()}
                    {currentStep === 2 && renderStep2()}
                    {currentStep === 3 && renderStep3()}
                    {currentStep === 4 && renderStep4()}
                </div>

                {renderPaymentModal()}
            </div>
        </div>
    );
};
