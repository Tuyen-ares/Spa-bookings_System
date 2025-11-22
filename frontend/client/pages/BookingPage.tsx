import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import type { Service, User, Appointment, PaymentMethod, Promotion, TreatmentCourse, Review, StaffShift, ServiceCategory } from '../../types';
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
    const [searchParams] = useSearchParams();
    const serviceIdFromUrl = searchParams.get('serviceId');

    // Format date from YYYY-MM-DD to dd-mm-yyyy
    const formatDateDisplay = (dateString: string): string => {
        if (!dateString) return '';
        const [year, month, day] = dateString.split('-');
        return `${day}-${month}-${year}`;
    };

    // Convert dd-mm-yyyy to YYYY-MM-DD
    const parseDateInput = (dateString: string): string => {
        if (!dateString) return '';
        const parts = dateString.split('-');
        if (parts.length === 3) {
            const [day, month, year] = parts;
            if (day && month && year && day.length === 2 && month.length === 2 && year.length === 4) {
                // Validate date
                const dateObj = new Date(`${year}-${month}-${day}`);
                if (dateObj && !isNaN(dateObj.getTime())) {
                    const checkDay = dateObj.getDate().toString().padStart(2, '0');
                    const checkMonth = (dateObj.getMonth() + 1).toString().padStart(2, '0');
                    if (checkDay === day && checkMonth === month) {
                        return `${year}-${month}-${day}`;
                    }
                }
            }
        }
        return '';
    };

    // State
    const [currentStep, setCurrentStep] = useState(1);
    const [services, setServices] = useState<Service[]>([]);
    const [categories, setCategories] = useState<ServiceCategory[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<number | ''>('');
    const [selectedServices, setSelectedServices] = useState<Array<{ service: Service; quantity: number }>>([]);
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [dateInputValue, setDateInputValue] = useState<string>('');
    const [selectedTime, setSelectedTime] = useState<string>('');
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [applicablePromotions, setApplicablePromotions] = useState<Promotion[]>([]);
    const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
    const [isBirthday, setIsBirthday] = useState<boolean>(false);
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

    // Get available time slots based on selected date
    const getAvailableTimeSlots = () => {
        const allSlots = generateTimeSlots();
        
        // If no date selected, return all slots
        if (!selectedDate) {
            return allSlots;
        }

        const today = new Date();
        const selectedDateObj = new Date(selectedDate);
        
        // Check if selected date is today
        const isToday = 
            selectedDateObj.getFullYear() === today.getFullYear() &&
            selectedDateObj.getMonth() === today.getMonth() &&
            selectedDateObj.getDate() === today.getDate();

        if (!isToday) {
            // If future date, return all slots
            return allSlots;
        }

        // If today, filter out past times
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTimeInMinutes = currentHour * 60 + currentMinute;

        return allSlots.filter(timeSlot => {
            const [hour, minute] = timeSlot.split(':').map(Number);
            const slotTimeInMinutes = hour * 60 + minute;
            // Only show slots that are at least 15 minutes in the future
            return slotTimeInMinutes > currentTimeInMinutes;
        });
    };

    // Memoize available time slots to recalculate when selectedDate changes
    const availableTimeSlots = useMemo(() => {
        return getAvailableTimeSlots();
    }, [selectedDate]);

    // Reset selectedTime if it's no longer available when date changes
    useEffect(() => {
        if (selectedTime && selectedDate) {
            const isTimeAvailable = availableTimeSlots.includes(selectedTime);
            if (!isTimeAvailable) {
                setSelectedTime('');
            }
        }
    }, [selectedDate, availableTimeSlots, selectedTime]);

    // Sync dateInputValue when selectedDate changes (from date picker)
    useEffect(() => {
        if (selectedDate) {
            setDateInputValue(formatDateDisplay(selectedDate));
        } else {
            setDateInputValue('');
        }
    }, [selectedDate]);

    // Load data
    useEffect(() => {
        loadInitialData();
    }, []);


    const loadInitialData = async () => {
        try {
            console.log('Loading initial data...');
            console.log('API Base URL:', 'http://localhost:3001/api');
            
            // Try to fetch services first to check connection
            try {
                const testResponse = await fetch('http://localhost:3001/api/services');
                console.log('Test fetch response status:', testResponse.status);
                if (!testResponse.ok) {
                    throw new Error(`Backend returned status ${testResponse.status}`);
                }
            } catch (testError: any) {
                console.error('Backend connection test failed:', testError);
                if (testError.message?.includes('Failed to fetch') || testError.message?.includes('NetworkError')) {
                    throw new Error('Không thể kết nối đến backend server. Vui lòng đảm bảo backend đang chạy trên http://localhost:3001');
                }
                throw testError;
            }
            
            const [servicesData, categoriesData, usersData, promotionsData, coursesData, reviewsData, appointmentsData, shiftsData] = await Promise.all([
                apiService.getServices().catch(err => { console.error('Error fetching services:', err); throw err; }),
                apiService.getServiceCategories().catch(err => { console.error('Error fetching categories:', err); return []; }),
                apiService.getUsers().catch(err => { console.error('Error fetching users:', err); return []; }),
                // Load all promotions first, will filter later based on selected services
                apiService.getPromotions().catch(err => { console.error('Error fetching promotions:', err); return []; }),
                apiService.getTreatmentCourses().catch(err => { console.error('Error fetching courses:', err); return []; }),
                apiService.getReviews().catch(err => { console.error('Error fetching reviews:', err); return []; }),
                apiService.getAppointments().catch(err => { console.error('Error fetching appointments:', err); return []; })
            ]);

            console.log('Services data received:', servicesData);
            console.log('Services count:', servicesData?.length || 0);
            
            // Filter active services (include null/undefined as active)
            const activeServices = servicesData.filter(s => s.isActive === true || s.isActive === undefined || s.isActive === null);
            console.log('Active services count:', activeServices.length);
            
            setServices(activeServices);
            setCategories(categoriesData || []);
            // Parse applicableServiceIds if they're strings (from JSON)
            const parsedPromotions = promotionsData.filter(p => p.isActive).map(p => {
                if (p.applicableServiceIds && typeof p.applicableServiceIds === 'string') {
                    try {
                        p.applicableServiceIds = JSON.parse(p.applicableServiceIds);
                    } catch (e) {
                        console.error('Error parsing applicableServiceIds for promotion', p.code, e);
                        p.applicableServiceIds = [];
                    }
                }
                return p;
            });
            setPromotions(parsedPromotions);
            setTreatmentCourses(coursesData);
            setReviews(reviewsData);
            setAllAppointments(appointmentsData);

            if (currentUser) {
                setUserAppointments(appointmentsData.filter(a => a.userId === currentUser.id));
                
                // Check if today is user's birthday
                if (currentUser.birthday) {
                    const today = new Date();
                    const birthday = new Date(currentUser.birthday);
                    const isTodayBirthday = birthday.getMonth() === today.getMonth() && 
                                           birthday.getDate() === today.getDate();
                    setIsBirthday(isTodayBirthday);
                }
            }

            // Auto-select service from URL if provided
            if (serviceIdFromUrl && activeServices.length > 0) {
                const serviceToSelect = activeServices.find(s => s.id === serviceIdFromUrl);
                if (serviceToSelect) {
                    setSelectedServices([{ service: serviceToSelect, quantity: 1 }]);
                    // Also set category filter to match the service's category
                    if (serviceToSelect.categoryId) {
                        setSelectedCategory(serviceToSelect.categoryId);
                    }
                }
            }
        } catch (error: any) {
            console.error('Error loading data:', error);
            console.error('Error details:', error.message, error.stack);
            
            // More specific error messages
            let errorMessage = 'Không thể tải dữ liệu. Vui lòng thử lại sau.';
            if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
                errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra xem backend có đang chạy không (http://localhost:3001)';
            } else if (error.message) {
                errorMessage = `Lỗi: ${error.message}`;
            }
            
            alert(errorMessage);
        }
    };

    // Step 1: Select Service
    const handleServiceToggle = (service: Service) => {
        const existingIndex = selectedServices.findIndex(s => s.service.id === service.id);
        if (existingIndex >= 0) {
            // Remove if already selected
            setSelectedServices(selectedServices.filter((_, idx) => idx !== existingIndex));
        } else {
            // Add with quantity 1
            setSelectedServices([...selectedServices, { service, quantity: 1 }]);
        }
    };

    const handleQuantityChange = (serviceId: string, quantity: number) => {
        if (quantity < 1) return;
        setSelectedServices(selectedServices.map(item => 
            item.service.id === serviceId 
                ? { ...item, quantity } 
                : item
        ));
    };

    const filteredServices = useMemo(() => {
        console.log('Filtering services. Total:', services.length, 'Selected category:', selectedCategory);
        const filtered = selectedCategory 
            ? services.filter(s => s.categoryId === selectedCategory)
            : services;
        console.log('Filtered services count:', filtered.length);
        return filtered;
    }, [services, selectedCategory]);

    // Load applicable promotions when services are selected
    useEffect(() => {
        const loadApplicablePromotions = async () => {
            if (!currentUser || selectedServices.length === 0) {
                setApplicablePromotions([]);
                return;
            }
            
            try {
                // Get promotions for first selected service (or all if multiple)
                const firstService = selectedServices[0].service;
                const applicable = await apiService.getApplicablePromotions(currentUser.id, firstService.id);
                setApplicablePromotions(applicable);
            } catch (error) {
                console.error('Error loading applicable promotions:', error);
                setApplicablePromotions([]);
            }
        };
        
        loadApplicablePromotions();
    }, [currentUser, selectedServices]);

    // Step 2: Select Time
    const isTimeSlotBooked = (time: string) => {
        if (!selectedDate) return false;
        return userAppointments.some(apt => 
            apt.date === selectedDate && 
            apt.time === time && 
            apt.status !== 'cancelled'
        );
    };

    // Step 4: Confirmation
    const calculateTotal = () => {
        const servicesTotal = selectedServices.reduce((sum, { service, quantity }) => sum + (service.price * quantity), 0);
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

        if (!selectedDate || !selectedTime) {
            alert('Vui lòng chọn đầy đủ thông tin');
            return;
        }

        setIsPaymentModalOpen(true);
    };

    const handleProcessPayment = async () => {
        try {
            const bookingGroupId = uuidv4();
            
            // Validate promotion is still applicable
            if (selectedPromotion) {
                const isStillApplicable = applicablePromotions.some(p => p.id === selectedPromotion.id);
                if (!isStillApplicable) {
                    alert('Mã khuyến mãi này không còn khả dụng. Vui lòng chọn mã khác.');
                    setIsPaymentModalOpen(false);
                    return;
                }
            }
            
            // Create ONE appointment per service (backend will handle treatment course if quantity >= 1, all bookings create courses)
            const appointmentsToCreate = selectedServices.map(({ service, quantity }) => ({
                id: `apt-${uuidv4()}`,
                userId: currentUser!.id,
                serviceId: service.id,
                serviceName: service.name,
                therapistId: null, // Admin will assign staff when approving
                date: selectedDate,
                time: selectedTime,
                status: 'pending' as const,
                paymentStatus: 'Unpaid' as const,
                notes: '',
                bookingGroupId: bookingGroupId,
                promotionId: selectedPromotion?.id || null, // Include promotion ID if selected
                quantity: quantity, // Send quantity to backend for treatment course creation
                durationWeeks: quantity + 1, // Default duration (admin can adjust later)
                frequencyType: 'sessions_per_week' as const, // Default frequency type
                frequencyValue: 1 // Default: 1 session per week
            }));

            // Record promotion usage after creating appointments (before payment)
            if (selectedPromotion && appointmentsToCreate.length > 0) {
                try {
                    await apiService.applyPromotion(
                        selectedPromotion.code,
                        currentUser!.id,
                        appointmentsToCreate[0].id,
                        appointmentsToCreate[0].serviceId
                    );
                } catch (error: any) {
                    console.error('Failed to record promotion usage:', error);
                    // Don't block booking, just log error
                }
            }

            // Create all appointments (one per service)
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
            { num: 3, label: 'Xác Nhận' }
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

    const renderStep1 = () => {
        const selectedServiceIds = selectedServices.map(s => s.service.id);
        
        return (
            <div className="max-w-4xl mx-auto">
                {/* Category Filter */}
                <div className="mb-6">
                    <label className="block text-gray-700 font-semibold mb-2">Chọn danh mục</label>
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value ? parseInt(e.target.value) : '')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                    >
                        <option value="">Tất cả danh mục</option>
                        {categories.map(category => (
                            <option key={category.id} value={category.id}>
                                {category.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Services List */}
                <div className="max-h-[500px] overflow-y-auto border border-gray-200 rounded-lg">
                    {services.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <p>Đang tải dịch vụ...</p>
                            <p className="text-xs mt-2">Vui lòng kiểm tra console để xem chi tiết.</p>
                        </div>
                    ) : filteredServices.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <p>Không có dịch vụ nào trong danh mục này.</p>
                            <p className="text-xs mt-2">Tổng số dịch vụ: {services.length}</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {filteredServices.map(service => {
                                const isSelected = selectedServiceIds.includes(service.id);
                                const selectedItem = selectedServices.find(s => s.service.id === service.id);
                                const quantity = selectedItem?.quantity || 1;
                                
                                return (
                                    <div
                                        key={service.id}
                                        className={`p-4 transition ${
                                            isSelected ? 'bg-amber-50 border-l-4 border-amber-600' : 'hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => handleServiceToggle(service)}
                                                        className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500"
                                                    />
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="font-semibold text-gray-800">{service.name}</h3>
                                                        </div>
                                                        <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                                                        <div className="flex items-center gap-4 mt-2">
                                                            <span className="text-amber-600 font-semibold">{formatPrice(service.price)}</span>
                                                            <span className="text-sm text-gray-500">{service.duration} phút</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* Quantity Selector - Show for all services */}
                                                <div className="ml-8 mt-3 flex items-center gap-3">
                                                    <label className="text-sm font-medium text-gray-700">Chọn số lượng:</label>
                                                    <select
                                                        value={isSelected ? quantity : 1}
                                                        onChange={(e) => {
                                                            const qty = parseInt(e.target.value);
                                                            if (!isSelected) {
                                                                // Auto-select service when quantity is changed
                                                                handleServiceToggle(service);
                                                                // Set quantity after a brief delay to ensure service is selected
                                                                setTimeout(() => handleQuantityChange(service.id, qty), 100);
                                                            } else {
                                                                handleQuantityChange(service.id, qty);
                                                            }
                                                        }}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="px-3 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                                                    >
                                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                                                            <option key={num} value={num}>{num}</option>
                                                        ))}
                                                    </select>
                                                    {isSelected && (
                                                        <span className="text-sm text-gray-600">
                                                            Tổng: {formatPrice(service.price * quantity)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Selected Services Summary */}
                {selectedServices.length > 0 && (
                    <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                        <h4 className="font-semibold text-gray-800 mb-2">Dịch vụ đã chọn:</h4>
                        <ul className="space-y-1">
                            {selectedServices.map(({ service, quantity }) => (
                                <li key={service.id} className="text-sm text-gray-700">
                                    {service.name} x{quantity} = {formatPrice(service.price * quantity)}
                                </li>
                            ))}
                        </ul>
                        <div className="mt-2 pt-2 border-t border-amber-200">
                            <p className="font-semibold text-amber-700">
                                Tổng cộng: {formatPrice(
                                    selectedServices.reduce((sum, { service, quantity }) => sum + (service.price * quantity), 0)
                                )}
                            </p>
                        </div>
                    </div>
                )}

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
    };

    const renderStep2 = () => (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-2">Chọn Ngày</label>
                <div className="relative">
                    <input
                        type="text"
                        value={dateInputValue}
                        onChange={(e) => {
                            let value = e.target.value.replace(/\D/g, ''); // Only digits
                            // Auto-format: dd-mm-yyyy
                            let formatted = '';
                            if (value.length > 0) formatted = value.slice(0, 2);
                            if (value.length > 2) formatted += '-' + value.slice(2, 4);
                            if (value.length > 4) formatted += '-' + value.slice(4, 8);
                            
                            setDateInputValue(formatted);
                            
                            // Parse to YYYY-MM-DD when complete (8 digits)
                            if (value.length === 8) {
                                const parsed = parseDateInput(formatted);
                                if (parsed) {
                                    const minDate = new Date().toISOString().split('T')[0];
                                    if (parsed >= minDate) {
                                        setSelectedDate(parsed);
                                    } else {
                                        setSelectedDate('');
                                    }
                                } else {
                                    setSelectedDate('');
                                }
                            } else {
                                setSelectedDate('');
                            }
                        }}
                        placeholder="dd-mm-yyyy (ví dụ: 28-11-2025)"
                        maxLength={10}
                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => {
                            setSelectedDate(e.target.value);
                            if (e.target.value) {
                                setDateInputValue(formatDateDisplay(e.target.value));
                            } else {
                                setDateInputValue('');
                            }
                        }}
                        min={new Date().toISOString().split('T')[0]}
                        className="absolute right-0 top-0 h-full w-12 opacity-0 cursor-pointer"
                        title="Chọn từ lịch"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">Nhập ngày theo định dạng: dd-mm-yyyy hoặc click vào icon lịch để chọn</p>
            </div>

            <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-2">Chọn Giờ</label>
                {availableTimeSlots.length === 0 ? (
                    <div className="w-full px-4 py-3 border border-red-300 rounded-lg bg-red-50">
                        <p className="text-red-600 text-sm">
                            Không còn khung giờ nào khả dụng cho ngày hôm nay. Vui lòng chọn ngày khác.
                        </p>
                    </div>
                ) : (
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
                )}
                {selectedDate && (() => {
                    const today = new Date();
                    const selectedDateObj = new Date(selectedDate);
                    const isToday = 
                        selectedDateObj.getFullYear() === today.getFullYear() &&
                        selectedDateObj.getMonth() === today.getMonth() &&
                        selectedDateObj.getDate() === today.getDate();
                    
                    if (isToday) {
                        const now = new Date();
                        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
                        return (
                            <p className="text-xs text-gray-500 mt-1">
                                Thời gian hiện tại: {currentTime} - Chỉ có thể đặt lịch sau thời gian này
                            </p>
                        );
                    }
                    return null;
                })()}
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

    const renderStep3 = () => {
        const servicesTotal = selectedServices.reduce((sum, { service, quantity }) => sum + (service.price * quantity), 0);
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
                        <p><strong>Dịch vụ:</strong> {selectedServices.map(({ service, quantity }) => 
                            `${service.name}${quantity > 1 ? ` x${quantity}` : ''}`
                        ).join(', ')}</p>
                        <p><strong>Ngày:</strong> {formatDateDisplay(selectedDate)}</p>
                        <p><strong>Giờ:</strong> {selectedTime}</p>
                    </div>
                </div>

                {/* Birthday Notification */}
                {isBirthday && (
                    <div className="mb-6 p-4 bg-gradient-to-r from-pink-50 to-purple-50 border-2 border-pink-300 rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className="text-4xl">🎂</div>
                            <div className="flex-1">
                                <h4 className="font-bold text-lg text-pink-700 mb-1">Chúc mừng sinh nhật!</h4>
                                <p className="text-sm text-gray-700 mb-2">
                                    Hôm nay là sinh nhật của bạn! Bạn có voucher ưu đãi đặc biệt dành cho sinh nhật.
                                </p>
                                {applicablePromotions.filter(p => p.targetAudience === 'Birthday').length > 0 && (
                                    <p className="text-xs text-gray-600">
                                        Voucher sinh nhật sẽ tự động hiển thị khi bạn chọn dịch vụ.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className="mb-6">
                    <label className="block text-gray-700 font-semibold mb-2">Mã giảm giá (nếu có)</label>
                    <div className="flex items-center gap-2 mb-3">
                        <select
                            value={promoCode}
                            onChange={(e) => {
                                const selectedCode = e.target.value;
                                setPromoCode(selectedCode);
                                
                                if (!selectedCode) {
                                    setSelectedPromotion(null);
                                    return;
                                }
                                
                                // Find promotion by code from applicable promotions first, then from all public promotions
                                const promo = applicablePromotions.find(p => 
                                    p.code && selectedCode && 
                                    p.code.toUpperCase().trim() === selectedCode.toUpperCase().trim()
                                ) || promotions.find(p => 
                                    p.code && selectedCode && 
                                    p.code.toUpperCase().trim() === selectedCode.toUpperCase().trim() &&
                                    p.isPublic === true // Only public promotions
                                );
                                
                                if (promo) {
                                    // Check if promotion is active
                                    if (promo.isActive === false) {
                                        alert('Mã khuyến mãi này không còn hoạt động');
                                        setPromoCode('');
                                        return;
                                    }
                                    // Check if promotion has stock (số lượng còn lại)
                                    if (promo.stock !== null && promo.stock <= 0) {
                                        alert('Mã khuyến mãi đã hết lượt sử dụng');
                                        setPromoCode('');
                                        return;
                                    }
                                    // Check expiry
                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);
                                    const expiryDate = new Date(promo.expiryDate);
                                    expiryDate.setHours(0, 0, 0, 0);
                                    if (today > expiryDate) {
                                        alert('Mã khuyến mãi đã hết hạn');
                                        setPromoCode('');
                                        return;
                                    }
                                    setSelectedPromotion(promo);
                                } else {
                                    setSelectedPromotion(null);
                                }
                            }}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                        >
                            <option value="">-- Chọn mã giảm giá --</option>
                            {(() => {
                                // Get all public promotions that are active and not expired
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                
                                // Get selected service IDs
                                const selectedServiceIds = selectedServices.map(({ service }) => service.id);
                                
                                // If no services selected, don't show any promotions
                                if (selectedServiceIds.length === 0) {
                                    return null;
                                }
                                
                                // Filter promotions based on conditions
                                const filteredPromotions = promotions.filter(p => {
                                    // Must be public
                                    if (p.isPublic !== true) return false;
                                    
                                    // Must be active
                                    if (p.isActive === false) return false;
                                    
                                    // Check expiry
                                    const expiryDate = new Date(p.expiryDate);
                                    expiryDate.setHours(0, 0, 0, 0);
                                    if (today > expiryDate) return false;
                                    
                                    // Check stock
                                    if (p.stock !== null && p.stock <= 0) return false;
                                    
                                    // IMPORTANT: Check if promotion applies to selected services
                                    // Parse applicableServiceIds if it's a string (from JSON)
                                    let applicableServiceIdsArray: string[] = [];
                                    if (p.applicableServiceIds) {
                                        if (typeof p.applicableServiceIds === 'string') {
                                            try {
                                                applicableServiceIdsArray = JSON.parse(p.applicableServiceIds);
                                            } catch (e) {
                                                console.error('Error parsing applicableServiceIds:', e);
                                                applicableServiceIdsArray = [];
                                            }
                                        } else if (Array.isArray(p.applicableServiceIds)) {
                                            applicableServiceIdsArray = p.applicableServiceIds;
                                        }
                                    }
                                    
                                    // If promotion has applicableServiceIds and it's not empty, it must match at least one selected service
                                    if (applicableServiceIdsArray && applicableServiceIdsArray.length > 0) {
                                        // Promotion is for specific services - check if any selected service matches
                                        const matchesService = selectedServiceIds.some(serviceId => 
                                            applicableServiceIdsArray.includes(serviceId)
                                        );
                                        if (!matchesService) {
                                            // Promotion doesn't apply to any selected service - DON'T SHOW IT
                                            return false;
                                        }
                                    }
                                    // If applicableServiceIds is empty/null, promotion applies to all services (no filter needed)
                                    
                                    // Filter by target audience
                                    if (p.targetAudience === 'Birthday') {
                                        // Only show if today is user's birthday
                                        if (!isBirthday) return false;
                                    } else if (p.targetAudience === 'New Clients') {
                                        // Only show if user hasn't used this service before
                                        if (!currentUser) return false;
                                        
                                        // Check if user has used any of the selected services
                                        // For new client promotions, check each service individually
                                        const hasUsedAnySelectedService = selectedServiceIds.some(serviceId => {
                                            return userAppointments.some(apt => 
                                                apt.serviceId === serviceId && 
                                                apt.status === 'completed'
                                            );
                                        });
                                        
                                        // If user has used any selected service, don't show new client promotion
                                        if (hasUsedAnySelectedService) return false;
                                        
                                        // For new client promotions with specific services, 
                                        // we already checked applicableServiceIds above
                                    }
                                    // For "All" and other target audiences, no additional filtering needed
                                    
                                    return true;
                                });
                                
                                // Also include applicable promotions from API (which backend already filtered)
                                // But we need to filter them again by selected services
                                const filteredApplicablePromotions = applicablePromotions.filter(p => {
                                    if (p.isPublic !== true) return false;
                                    if (p.isActive !== false) return false;
                                    if (p.stock !== null && p.stock <= 0) return false;
                                    
                                    // Parse applicableServiceIds if it's a string (from JSON)
                                    let applicableServiceIdsArray: string[] = [];
                                    if (p.applicableServiceIds) {
                                        if (typeof p.applicableServiceIds === 'string') {
                                            try {
                                                applicableServiceIdsArray = JSON.parse(p.applicableServiceIds);
                                            } catch (e) {
                                                console.error('Error parsing applicableServiceIds:', e);
                                                applicableServiceIdsArray = [];
                                            }
                                        } else if (Array.isArray(p.applicableServiceIds)) {
                                            applicableServiceIdsArray = p.applicableServiceIds;
                                        }
                                    }
                                    
                                    // Check if promotion applies to selected services
                                    if (applicableServiceIdsArray && applicableServiceIdsArray.length > 0) {
                                        const matchesService = selectedServiceIds.some(serviceId => 
                                            applicableServiceIdsArray.includes(serviceId)
                                        );
                                        if (!matchesService) return false;
                                    }
                                    
                                    return true;
                                });
                                
                                // Combine both lists
                                const allAvailablePromotions = [
                                    ...filteredApplicablePromotions,
                                    ...filteredPromotions
                                ];
                                
                                // Remove duplicates by code
                                const uniquePromotions = Array.from(
                                    new Map(allAvailablePromotions.map(p => [p.code, p])).values()
                                );
                                
                                return uniquePromotions.map(promo => (
                                    <option key={promo.id} value={promo.code}>
                                        {promo.code} - {promo.title} 
                                        {promo.discountType === 'percentage' 
                                            ? ` (Giảm ${promo.discountValue}%)` 
                                            : ` (Giảm ${formatPrice(promo.discountValue)})`}
                                    </option>
                                ));
                            })()}
                        </select>
                    </div>
                    
                    {selectedPromotion && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm text-green-800">
                                <span className="font-semibold">Mã đã áp dụng: </span>
                                {selectedPromotion.title} ({selectedPromotion.code})
                            </p>
                            <button
                                onClick={() => {
                                    setSelectedPromotion(null);
                                    setPromoCode('');
                                }}
                                className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
                            >
                                Hủy áp dụng
                            </button>
                        </div>
                    )}
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
                        onClick={() => setCurrentStep(2)}
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
                </div>

                {renderPaymentModal()}
            </div>
        </div>
    );
};
