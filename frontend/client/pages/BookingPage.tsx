// import React, { useState, useEffect, useMemo } from 'react';
// import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
// import { v4 as uuidv4 } from 'uuid';
// import type { Service, User, Appointment, PaymentMethod, Promotion, TreatmentCourse, Review, StaffShift, ServiceCategory } from '../../types';
// import { StarIcon, VNPayIcon, CheckCircleIcon, ChevronLeftIcon, ChevronRightIcon } from '../../shared/icons';
// import * as apiService from '../services/apiService';

// const formatPrice = (price: number) => {
//     return new Intl.NumberFormat('vi-VN').format(price) + ' đ';
// };

// interface BookingPageProps {
//     currentUser: User | null;
// }

// export const BookingPage: React.FC<BookingPageProps> = ({ currentUser }) => {
//     const location = useLocation();
//     const navigate = useNavigate();
//     const [searchParams] = useSearchParams();
//     const serviceIdFromUrl = searchParams.get('serviceId');

//     // Format date from YYYY-MM-DD to dd-mm-yyyy
//     const formatDateDisplay = (dateString: string): string => {
//         if (!dateString) return '';
//         const [year, month, day] = dateString.split('-');
//         return `${day}-${month}-${year}`;
//     };

//     // Convert dd-mm-yyyy to YYYY-MM-DD
//     const parseDateInput = (dateString: string): string => {
//         if (!dateString) return '';
//         const parts = dateString.split('-');
//         if (parts.length === 3) {
//             const [day, month, year] = parts;
//             if (day && month && year && day.length === 2 && month.length === 2 && year.length === 4) {
//                 // Validate date
//                 const dateObj = new Date(`${year}-${month}-${day}`);
//                 if (dateObj && !isNaN(dateObj.getTime())) {
//                     const checkDay = dateObj.getDate().toString().padStart(2, '0');
//                     const checkMonth = (dateObj.getMonth() + 1).toString().padStart(2, '0');
//                     if (checkDay === day && checkMonth === month) {
//                         return `${year}-${month}-${day}`;
//                     }
//                 }
//             }
//         }
//         return '';
//     };

//     // State
//     const [currentStep, setCurrentStep] = useState(1);
//     const [services, setServices] = useState<Service[]>([]);
//     const [categories, setCategories] = useState<ServiceCategory[]>([]);
//     const [selectedCategory, setSelectedCategory] = useState<number | ''>('');
//     const [selectedServices, setSelectedServices] = useState<Array<{ service: Service; quantity: number }>>([]);
//     const [selectedDate, setSelectedDate] = useState<string>('');
//     const [dateInputValue, setDateInputValue] = useState<string>('');
//     const [selectedTime, setSelectedTime] = useState<string>('');
//     const [promotions, setPromotions] = useState<Promotion[]>([]);
//     const [applicablePromotions, setApplicablePromotions] = useState<Promotion[]>([]);
//     const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
//     const [isBirthday, setIsBirthday] = useState<boolean>(false);
//     const [treatmentCourses, setTreatmentCourses] = useState<TreatmentCourse[]>([]);
//     const [selectedTab, setSelectedTab] = useState<'upcoming' | 'history' | 'courses'>('upcoming');
//     const [userAppointments, setUserAppointments] = useState<Appointment[]>([]);
//     const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
//     const [reviews, setReviews] = useState<Review[]>([]);
//     const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
//     const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('VNPay');
//     const [promoCode, setPromoCode] = useState<string>('');

//     // Generate flexible time slots from 9:00 to 22:00 with 15 minute intervals
//     const generateTimeSlots = () => {
//         const slots: string[] = [];
//         for (let hour = 9; hour <= 22; hour++) {
//             for (let minute = 0; minute < 60; minute += 15) {
//                 // Stop at 22:00
//                 if (hour === 22 && minute > 0) break;
                
//                 const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
//                 slots.push(timeString);
//             }
//         }
//         return slots;
//     };

//     // Get available time slots based on selected date
//     const getAvailableTimeSlots = () => {
//         const allSlots = generateTimeSlots();
        
//         // If no date selected, return all slots
//         if (!selectedDate) {
//             return allSlots;
//         }

//         const today = new Date();
//         const selectedDateObj = new Date(selectedDate);
        
//         // Check if selected date is today
//         const isToday = 
//             selectedDateObj.getFullYear() === today.getFullYear() &&
//             selectedDateObj.getMonth() === today.getMonth() &&
//             selectedDateObj.getDate() === today.getDate();

//         if (!isToday) {
//             // If future date, return all slots
//             return allSlots;
//         }

//         // If today, filter out past times
//         const now = new Date();
//         const currentHour = now.getHours();
//         const currentMinute = now.getMinutes();
//         const currentTimeInMinutes = currentHour * 60 + currentMinute;

//         return allSlots.filter(timeSlot => {
//             const [hour, minute] = timeSlot.split(':').map(Number);
//             const slotTimeInMinutes = hour * 60 + minute;
//             // Only show slots that are at least 15 minutes in the future
//             return slotTimeInMinutes > currentTimeInMinutes;
//         });
//     };

//     // Memoize available time slots to recalculate when selectedDate changes
//     const availableTimeSlots = useMemo(() => {
//         return getAvailableTimeSlots();
//     }, [selectedDate]);

//     // Reset selectedTime if it's no longer available when date changes
//     useEffect(() => {
//         if (selectedTime && selectedDate) {
//             const isTimeAvailable = availableTimeSlots.includes(selectedTime);
//             if (!isTimeAvailable) {
//                 setSelectedTime('');
//             }
//         }
//     }, [selectedDate, availableTimeSlots, selectedTime]);

//     // Sync dateInputValue when selectedDate changes (from date picker)
//     useEffect(() => {
//         if (selectedDate) {
//             setDateInputValue(formatDateDisplay(selectedDate));
//         } else {
//             setDateInputValue('');
//         }
//     }, [selectedDate]);

//     // Load data
//     useEffect(() => {
//         loadInitialData();
//     }, []);


//     const loadInitialData = async () => {
//         try {
//             console.log('Loading initial data...');
//             console.log('API Base URL:', 'http://localhost:3001/api');
            
//             // Try to fetch services first to check connection
//             try {
//                 const testResponse = await fetch('http://localhost:3001/api/services');
//                 console.log('Test fetch response status:', testResponse.status);
//                 if (!testResponse.ok) {
//                     throw new Error(`Backend returned status ${testResponse.status}`);
//                 }
//             } catch (testError: any) {
//                 console.error('Backend connection test failed:', testError);
//                 if (testError.message?.includes('Failed to fetch') || testError.message?.includes('NetworkError')) {
//                     throw new Error('Không thể kết nối đến backend server. Vui lòng đảm bảo backend đang chạy trên http://localhost:3001');
//                 }
//                 throw testError;
//             }
            
//             const [servicesData, categoriesData, usersData, promotionsData, coursesData, reviewsData, appointmentsData] = await Promise.all([
//                 apiService.getServices().catch(err => { console.error('Error fetching services:', err); throw err; }),
//                 apiService.getServiceCategories().catch(err => { console.error('Error fetching categories:', err); return []; }),
//                 apiService.getUsers().catch(err => { console.error('Error fetching users:', err); return []; }),
//                 // Load all promotions first, will filter later based on selected services
//                 apiService.getPromotions().catch(err => { console.error('Error fetching promotions:', err); return []; }),
//                 apiService.getTreatmentCourses().catch(err => { console.error('Error fetching courses:', err); return []; }),
//                 apiService.getReviews().catch(err => { console.error('Error fetching reviews:', err); return []; }),
//                 apiService.getAppointments().catch(err => { console.error('Error fetching appointments:', err); return []; })
//             ]);

//             console.log('Services data received:', servicesData);
//             console.log('Services count:', servicesData?.length || 0);
            
//             // Filter active services (include null/undefined as active)
//             const activeServices = servicesData.filter(s => s.isActive === true || s.isActive === undefined || s.isActive === null);
//             console.log('Active services count:', activeServices.length);
            
//             setServices(activeServices);
//             setCategories(categoriesData || []);
//             // Parse applicableServiceIds if they're strings (from JSON)
//             const parsedPromotions = promotionsData.filter(p => p.isActive).map(p => {
//                 if (p.applicableServiceIds && typeof p.applicableServiceIds === 'string') {
//                     try {
//                         p.applicableServiceIds = JSON.parse(p.applicableServiceIds);
//                     } catch (e) {
//                         console.error('Error parsing applicableServiceIds for promotion', p.code, e);
//                         p.applicableServiceIds = [];
//                     }
//                 }
//                 return p;
//             });
//             setPromotions(parsedPromotions);
//             setTreatmentCourses(coursesData);
//             setReviews(reviewsData);
//             setAllAppointments(appointmentsData);

//             if (currentUser) {
//                 setUserAppointments(appointmentsData.filter(a => a.userId === currentUser.id));
                
//                 // Check if today is user's birthday
//                 if (currentUser.birthday) {
//                     const today = new Date();
//                     const birthday = new Date(currentUser.birthday);
//                     const isTodayBirthday = birthday.getMonth() === today.getMonth() && 
//                                            birthday.getDate() === today.getDate();
//                     setIsBirthday(isTodayBirthday);
//                 }
//             }

//             // Auto-select service from URL if provided
//             if (serviceIdFromUrl && activeServices.length > 0) {
//                 const serviceToSelect = activeServices.find(s => s.id === serviceIdFromUrl);
//                 if (serviceToSelect) {
//                     setSelectedServices([{ service: serviceToSelect, quantity: 1 }]);
//                     // Also set category filter to match the service's category
//                     if (serviceToSelect.categoryId) {
//                         setSelectedCategory(serviceToSelect.categoryId);
//                     }
//                 }
//             }
//         } catch (error: any) {
//             console.error('Error loading data:', error);
//             console.error('Error details:', error.message, error.stack);
            
//             // More specific error messages
//             let errorMessage = 'Không thể tải dữ liệu. Vui lòng thử lại sau.';
//             if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
//                 errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra xem backend có đang chạy không (http://localhost:3001)';
//             } else if (error.message) {
//                 errorMessage = `Lỗi: ${error.message}`;
//             }
            
//             alert(errorMessage);
//         }
//     };

//     // Step 1: Select Service
//     const handleServiceToggle = (service: Service) => {
//         const existingIndex = selectedServices.findIndex(s => s.service.id === service.id);
//         if (existingIndex >= 0) {
//             // Remove if already selected
//             setSelectedServices(selectedServices.filter((_, idx) => idx !== existingIndex));
//         } else {
//             // Add with quantity 1
//             setSelectedServices([...selectedServices, { service, quantity: 1 }]);
//         }
//     };

//     const handleQuantityChange = (serviceId: string, quantity: number) => {
//         if (quantity < 1) return;
//         setSelectedServices(selectedServices.map(item => 
//             item.service.id === serviceId 
//                 ? { ...item, quantity } 
//                 : item
//         ));
//     };

//     const filteredServices = useMemo(() => {
//         console.log('Filtering services. Total:', services.length, 'Selected category:', selectedCategory);
//         const filtered = selectedCategory 
//             ? services.filter(s => s.categoryId === selectedCategory)
//             : services;
//         console.log('Filtered services count:', filtered.length);
//         return filtered;
//     }, [services, selectedCategory]);

//     // Load applicable promotions when services are selected
//     useEffect(() => {
//         const loadApplicablePromotions = async () => {
//             if (!currentUser || selectedServices.length === 0) {
//                 setApplicablePromotions([]);
//                 return;
//             }
            
//             try {
//                 // Get promotions for first selected service (or all if multiple)
//                 const firstService = selectedServices[0].service;
//                 const applicable = await apiService.getApplicablePromotions(currentUser.id, firstService.id);
//                 setApplicablePromotions(applicable);
//             } catch (error) {
//                 console.error('Error loading applicable promotions:', error);
//                 setApplicablePromotions([]);
//             }
//         };
        
//         loadApplicablePromotions();
//     }, [currentUser, selectedServices]);

//     // Step 2: Select Time
//     const isTimeSlotBooked = (time: string) => {
//         if (!selectedDate) return false;
//         return userAppointments.some(apt => 
//             apt.date === selectedDate && 
//             apt.time === time && 
//             apt.status !== 'cancelled'
//         );
//     };

//     // Step 4: Confirmation
//     const calculateTotal = () => {
//         const servicesTotal = selectedServices.reduce((sum, { service, quantity }) => sum + (service.price * quantity), 0);
//         const discount = selectedPromotion ? 
//             (selectedPromotion.discountType === 'percentage' 
//                 ? servicesTotal * (selectedPromotion.discountValue / 100)
//                 : selectedPromotion.discountValue
//             ) : 0;
//         return Math.max(0, servicesTotal - discount);
//     };

//     const handleConfirmBooking = async () => {
//         if (!currentUser) {
//             alert('Vui lòng đăng nhập để đặt lịch');
//             navigate('/login');
//             return;
//         }

//         if (!selectedDate || !selectedTime) {
//             alert('Vui lòng chọn đầy đủ thông tin');
//             return;
//         }

//         setIsPaymentModalOpen(true);
//     };

//     const handleProcessPayment = async () => {
//         try {
//             const bookingGroupId = uuidv4();
            
//             // Validate promotion is still applicable
//             if (selectedPromotion) {
//                 const isStillApplicable = applicablePromotions.some(p => p.id === selectedPromotion.id);
//                 if (!isStillApplicable) {
//                     alert('Mã khuyến mãi này không còn khả dụng. Vui lòng chọn mã khác.');
//                     setIsPaymentModalOpen(false);
//                     return;
//                 }
//             }
            
//             // Create ONE appointment per service (backend will handle treatment course if quantity >= 1, all bookings create courses)
//             const appointmentsToCreate = selectedServices.map(({ service, quantity }) => ({
//                 id: `apt-${uuidv4()}`,
//                 userId: currentUser!.id,
//                 serviceId: service.id,
//                 serviceName: service.name,
//                 therapistId: null, // Admin will assign staff when approving
//                 date: selectedDate,
//                 time: selectedTime,
//                 status: 'pending' as const,
//                 paymentStatus: 'Unpaid' as const,
//                 notes: '',
//                 bookingGroupId: bookingGroupId,
//                 promotionId: selectedPromotion?.id || null, // Include promotion ID if selected
//                 quantity: quantity, // Send quantity to backend for treatment course creation
//                 durationWeeks: quantity + 1, // Default duration (admin can adjust later)
//                 frequencyType: 'sessions_per_week' as const, // Default frequency type
//                 frequencyValue: 1 // Default: 1 session per week
//             }));

//             // Record promotion usage after creating appointments (before payment)
//             if (selectedPromotion && appointmentsToCreate.length > 0) {
//                 try {
//                     await apiService.applyPromotion(
//                         selectedPromotion.code,
//                         currentUser!.id,
//                         appointmentsToCreate[0].id,
//                         appointmentsToCreate[0].serviceId
//                     );
//                 } catch (error: any) {
//                     console.error('Failed to record promotion usage:', error);
//                     // Don't block booking, just log error
//                 }
//             }

//             // Create all appointments (one per service)
//             const createdAppointments = await Promise.all(
//                 appointmentsToCreate.map(apt => apiService.createAppointment(apt))
//             );

//             // Process payment
//             const totalAmount = calculateTotal();
//             const result = await apiService.processPayment(
//                 createdAppointments[0].id,
//                 paymentMethod,
//                 totalAmount
//             );

//             // Emit event to refresh appointments in App.tsx
//             window.dispatchEvent(new Event('refresh-appointments'));

//             if (paymentMethod === 'VNPay' && result.paymentUrl) {
//                 window.location.href = result.paymentUrl;
//             } else if (paymentMethod === 'Cash') {
//                 // Reload appointments before showing success message
//                 try {
//                     const updatedAppointments = await apiService.getAppointments();
//                     console.log('Refreshed appointments:', updatedAppointments.length);
//                     // Trigger App.tsx to update via custom event with data
//                     window.dispatchEvent(new CustomEvent('appointments-updated', { 
//                         detail: { appointments: updatedAppointments } 
//                     }));
//                 } catch (error) {
//                     console.error('Failed to refresh appointments:', error);
//                 }
                
//                 alert('Đặt lịch thành công! Vui lòng thanh toán tại quầy.');
//                 navigate('/appointments');
//             }
//         } catch (error) {
//             console.error('Error processing payment:', error);
//             alert('Có lỗi xảy ra khi xử lý thanh toán');
//         }
//     };

//     const renderStepIndicator = () => {
//         const steps = [
//             { num: 1, label: 'Select Service' },
//             { num: 2, label: 'Chọn Thời Gian' },
//             { num: 3, label: 'Xác Nhận' }
//         ];

//         return (
//             <div className="flex justify-center items-center mb-8">
//                 {steps.map((step, idx) => (
//                     <React.Fragment key={step.num}>
//                         <div className="flex flex-col items-center">
//                             <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${
//                                 currentStep >= step.num ? 'bg-amber-600' : 'bg-gray-300'
//                             }`}>
//                                 {step.num}
//                             </div>
//                             <div className={`mt-2 text-sm ${
//                                 currentStep >= step.num ? 'text-amber-600 font-semibold' : 'text-gray-400'
//                             }`}>
//                                 {step.label}
//                             </div>
//                         </div>
//                         {idx < steps.length - 1 && (
//                             <div className={`w-16 h-1 mx-2 ${
//                                 currentStep > step.num ? 'bg-amber-600' : 'bg-gray-300'
//                             }`} style={{ marginTop: '-20px' }} />
//                         )}
//                     </React.Fragment>
//                 ))}
//             </div>
//         );
//     };

//     const renderStep1 = () => {
//         const selectedServiceIds = selectedServices.map(s => s.service.id);
        
//         return (
//             <div className="max-w-4xl mx-auto">
//                 {/* Category Filter */}
//                 <div className="mb-6">
//                     <label className="block text-gray-700 font-semibold mb-2">Chọn danh mục</label>
//                     <select
//                         value={selectedCategory}
//                         onChange={(e) => setSelectedCategory(e.target.value ? parseInt(e.target.value) : '')}
//                         className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
//                     >
//                         <option value="">Tất cả danh mục</option>
//                         {categories.map(category => (
//                             <option key={category.id} value={category.id}>
//                                 {category.name}
//                             </option>
//                         ))}
//                     </select>
//                 </div>

//                 {/* Services List */}
//                 <div className="max-h-[500px] overflow-y-auto border border-gray-200 rounded-lg">
//                     {services.length === 0 ? (
//                         <div className="p-8 text-center text-gray-500">
//                             <p>Đang tải dịch vụ...</p>
//                             <p className="text-xs mt-2">Vui lòng kiểm tra console để xem chi tiết.</p>
//                         </div>
//                     ) : filteredServices.length === 0 ? (
//                         <div className="p-8 text-center text-gray-500">
//                             <p>Không có dịch vụ nào trong danh mục này.</p>
//                             <p className="text-xs mt-2">Tổng số dịch vụ: {services.length}</p>
//                         </div>
//                     ) : (
//                         <div className="divide-y divide-gray-200">
//                             {filteredServices.map(service => {
//                                 const isSelected = selectedServiceIds.includes(service.id);
//                                 const selectedItem = selectedServices.find(s => s.service.id === service.id);
//                                 const quantity = selectedItem?.quantity || 1;
                                
//                                 return (
//                                     <div
//                                         key={service.id}
//                                         className={`p-4 transition ${
//                                             isSelected ? 'bg-amber-50 border-l-4 border-amber-600' : 'hover:bg-gray-50'
//                                         }`}
//                                     >
//                                         <div className="flex items-start gap-4">
//                                             {/* Service Image */}
//                                             {service.imageUrl && (
//                                                 <img 
//                                                     src={service.imageUrl} 
//                                                     alt={service.name}
//                                                     className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
//                                                     onError={(e) => {
//                                                         e.currentTarget.style.display = 'none';
//                                                     }}
//                                                 />
//                                             )}
                                            
//                                             <div className="flex-1">
//                                                 <div className="flex items-center gap-3 mb-2">
//                                                     <input
//                                                         type="checkbox"
//                                                         checked={isSelected}
//                                                         onChange={() => handleServiceToggle(service)}
//                                                         className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500"
//                                                     />
//                                                     <div className="flex-1">
//                                                         <div className="flex items-center gap-2">
//                                                             <h3 className="font-semibold text-gray-800">{service.name}</h3>
//                                                         </div>
//                                                         <p className="text-sm text-gray-600 mt-1">{service.description}</p>
//                                                         <div className="flex items-center gap-4 mt-2">
//                                                             <span className="text-amber-600 font-semibold">{formatPrice(service.price)}</span>
//                                                             <span className="text-sm text-gray-500">{service.duration} phút</span>
//                                                         </div>
//                                                     </div>
//                                                 </div>
                                                
//                                                 {/* Quantity Selector - Show for all services */}
//                                                 <div className="ml-8 mt-3 flex items-center gap-3">
//                                                     <label className="text-sm font-medium text-gray-700">Chọn số lượng:</label>
//                                                     <select
//                                                         value={isSelected ? quantity : 1}
//                                                         onChange={(e) => {
//                                                             const qty = parseInt(e.target.value);
//                                                             if (!isSelected) {
//                                                                 // Auto-select service when quantity is changed
//                                                                 handleServiceToggle(service);
//                                                                 // Set quantity after a brief delay to ensure service is selected
//                                                                 setTimeout(() => handleQuantityChange(service.id, qty), 100);
//                                                             } else {
//                                                                 handleQuantityChange(service.id, qty);
//                                                             }
//                                                         }}
//                                                         onClick={(e) => e.stopPropagation()}
//                                                         className="px-3 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
//                                                     >
//                                                         {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
//                                                             <option key={num} value={num}>{num}</option>
//                                                         ))}
//                                                     </select>
//                                                     {isSelected && (
//                                                         <span className="text-sm text-gray-600">
//                                                             Tổng: {formatPrice(service.price * quantity)}
//                                                         </span>
//                                                     )}
//                                                 </div>
//                                             </div>
//                                         </div>
//                                     </div>
//                                 );
//                             })}
//                         </div>
//                     )}
//                 </div>

//                 {/* Selected Services Summary */}
//                 {selectedServices.length > 0 && (
//                     <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
//                         <h4 className="font-semibold text-gray-800 mb-2">Dịch vụ đã chọn:</h4>
//                         <ul className="space-y-1">
//                             {selectedServices.map(({ service, quantity }) => (
//                                 <li key={service.id} className="text-sm text-gray-700">
//                                     {service.name} x{quantity} = {formatPrice(service.price * quantity)}
//                                 </li>
//                             ))}
//                         </ul>
//                         <div className="mt-2 pt-2 border-t border-amber-200">
//                             <p className="font-semibold text-amber-700">
//                                 Tổng cộng: {formatPrice(
//                                     selectedServices.reduce((sum, { service, quantity }) => sum + (service.price * quantity), 0)
//                                 )}
//                             </p>
//                         </div>
//                     </div>
//                 )}

//                 <div className="flex justify-between mt-8">
//                     <button
//                         onClick={() => navigate(-1)}
//                         className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
//                     >
//                         Trước
//                     </button>
//                     <button
//                         onClick={() => setCurrentStep(2)}
//                         disabled={selectedServices.length === 0}
//                         className="px-6 py-3 bg-amber-700 text-white rounded-lg hover:bg-amber-800 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold"
//                     >
//                         Tiếp theo
//                     </button>
//                 </div>
//             </div>
//         );
//     };

//     const renderStep2 = () => (
//         <div className="max-w-2xl mx-auto">
//             <div className="mb-6">
//                 <label className="block text-gray-700 font-semibold mb-2">Chọn Ngày</label>
//                 <div className="relative">
//                     <input
//                         type="text"
//                         value={dateInputValue}
//                         onChange={(e) => {
//                             let value = e.target.value.replace(/\D/g, ''); // Only digits
//                             // Auto-format: dd-mm-yyyy
//                             let formatted = '';
//                             if (value.length > 0) formatted = value.slice(0, 2);
//                             if (value.length > 2) formatted += '-' + value.slice(2, 4);
//                             if (value.length > 4) formatted += '-' + value.slice(4, 8);
                            
//                             setDateInputValue(formatted);
                            
//                             // Parse to YYYY-MM-DD when complete (8 digits)
//                             if (value.length === 8) {
//                                 const parsed = parseDateInput(formatted);
//                                 if (parsed) {
//                                     const minDate = new Date().toISOString().split('T')[0];
//                                     if (parsed >= minDate) {
//                                         setSelectedDate(parsed);
//                                     } else {
//                                         setSelectedDate('');
//                                     }
//                                 } else {
//                                     setSelectedDate('');
//                                 }
//                             } else {
//                                 setSelectedDate('');
//                             }
//                         }}
//                         placeholder="dd-mm-yyyy (ví dụ: 28-11-2025)"
//                         maxLength={10}
//                         className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
//                     />
//                     <input
//                         type="date"
//                         value={selectedDate}
//                         onChange={(e) => {
//                             setSelectedDate(e.target.value);
//                             if (e.target.value) {
//                                 setDateInputValue(formatDateDisplay(e.target.value));
//                             } else {
//                                 setDateInputValue('');
//                             }
//                         }}
//                         min={new Date().toISOString().split('T')[0]}
//                         className="absolute right-0 top-0 h-full w-12 opacity-0 cursor-pointer"
//                         title="Chọn từ lịch"
//                     />
//                     <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
//                         <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
//                         </svg>
//                     </div>
//                 </div>
//                 <p className="mt-1 text-xs text-gray-500">Nhập ngày theo định dạng: dd-mm-yyyy hoặc click vào icon lịch để chọn</p>
//             </div>

//             <div className="mb-6">
//                 <label className="block text-gray-700 font-semibold mb-2">Chọn Giờ</label>
//                 {availableTimeSlots.length === 0 ? (
//                     <div className="w-full px-4 py-3 border border-red-300 rounded-lg bg-red-50">
//                         <p className="text-red-600 text-sm">
//                             Không còn khung giờ nào khả dụng cho ngày hôm nay. Vui lòng chọn ngày khác.
//                         </p>
//                     </div>
//                 ) : (
//                     <select
//                         value={selectedTime}
//                         onChange={(e) => setSelectedTime(e.target.value)}
//                         className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
//                     >
//                         <option value="">-- Chọn khung giờ --</option>
//                         {availableTimeSlots.map(time => {
//                             const isBooked = isTimeSlotBooked(time);
//                             return (
//                                 <option 
//                                     key={time} 
//                                     value={time}
//                                     disabled={isBooked}
//                                     className={isBooked ? 'text-gray-400' : ''}
//                                 >
//                                     {time} {isBooked ? '(Đã đặt)' : ''}
//                                 </option>
//                             );
//                         })}
//                     </select>
//                 )}
//                 {selectedDate && (() => {
//                     const today = new Date();
//                     const selectedDateObj = new Date(selectedDate);
//                     const isToday = 
//                         selectedDateObj.getFullYear() === today.getFullYear() &&
//                         selectedDateObj.getMonth() === today.getMonth() &&
//                         selectedDateObj.getDate() === today.getDate();
                    
//                     if (isToday) {
//                         const now = new Date();
//                         const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
//                         return (
//                             <p className="text-xs text-gray-500 mt-1">
//                                 Thời gian hiện tại: {currentTime} - Chỉ có thể đặt lịch sau thời gian này
//                             </p>
//                         );
//                     }
//                     return null;
//                 })()}
//             </div>

//             <div className="flex justify-between mt-8">
//                 <button
//                     onClick={() => setCurrentStep(1)}
//                     className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
//                 >
//                     Trước
//                 </button>
//                 <button
//                     onClick={() => setCurrentStep(3)}
//                     disabled={!selectedDate || !selectedTime}
//                     className="px-6 py-3 bg-amber-700 text-white rounded-lg hover:bg-amber-800 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold"
//                 >
//                     Tiếp theo
//                 </button>
//             </div>
//         </div>
//     );

//     const renderStep3 = () => {
//         const servicesTotal = selectedServices.reduce((sum, { service, quantity }) => sum + (service.price * quantity), 0);
//         const discount = selectedPromotion ? 
//             (selectedPromotion.discountType === 'percentage' 
//                 ? servicesTotal * (selectedPromotion.discountValue / 100)
//                 : selectedPromotion.discountValue
//             ) : 0;
//         const total = Math.max(0, servicesTotal - discount);

//         return (
//             <div className="max-w-2xl mx-auto">
//                 <div className="bg-amber-50 rounded-lg p-6 mb-6">
//                     <h3 className="font-semibold text-gray-800 mb-4">Thông tin đặt lịch hẹn</h3>
//                     <div className="space-y-2 text-sm">
//                         <p><strong>Dịch vụ:</strong> {selectedServices.map(({ service, quantity }) => 
//                             `${service.name}${quantity > 1 ? ` x${quantity}` : ''}`
//                         ).join(', ')}</p>
//                         <p><strong>Ngày:</strong> {formatDateDisplay(selectedDate)}</p>
//                         <p><strong>Giờ:</strong> {selectedTime}</p>
//                     </div>
//                 </div>

//                 {/* Birthday Notification */}
//                 {isBirthday && (
//                     <div className="mb-6 p-4 bg-gradient-to-r from-pink-50 to-purple-50 border-2 border-pink-300 rounded-lg">
//                         <div className="flex items-center gap-3">
//                             <div className="text-4xl">🎂</div>
//                             <div className="flex-1">
//                                 <h4 className="font-bold text-lg text-pink-700 mb-1">Chúc mừng sinh nhật!</h4>
//                                 <p className="text-sm text-gray-700 mb-2">
//                                     Hôm nay là sinh nhật của bạn! Bạn có voucher ưu đãi đặc biệt dành cho sinh nhật.
//                                 </p>
//                                 {applicablePromotions.filter(p => p.targetAudience === 'Birthday').length > 0 && (
//                                     <p className="text-xs text-gray-600">
//                                         Voucher sinh nhật sẽ tự động hiển thị khi bạn chọn dịch vụ.
//                                     </p>
//                                 )}
//                             </div>
//                         </div>
//                     </div>
//                 )}

//                 <div className="mb-6">
//                     <label className="block text-gray-700 font-semibold mb-2">Mã giảm giá (nếu có)</label>
//                     <div className="flex items-center gap-2 mb-3">
//                         <select
//                             value={promoCode}
//                             onChange={(e) => {
//                                 const selectedCode = e.target.value;
//                                 setPromoCode(selectedCode);
                                
//                                 if (!selectedCode) {
//                                     setSelectedPromotion(null);
//                                     return;
//                                 }
                                
//                                 // Find promotion by code from applicable promotions first, then from all public promotions
//                                 const promo = applicablePromotions.find(p => 
//                                     p.code && selectedCode && 
//                                     p.code.toUpperCase().trim() === selectedCode.toUpperCase().trim()
//                                 ) || promotions.find(p => 
//                                     p.code && selectedCode && 
//                                     p.code.toUpperCase().trim() === selectedCode.toUpperCase().trim() &&
//                                     p.isPublic === true // Only public promotions
//                                 );
                                
//                                 if (promo) {
//                                     // Check if promotion is active
//                                     if (promo.isActive === false) {
//                                         alert('Mã khuyến mãi này không còn hoạt động');
//                                         setPromoCode('');
//                                         return;
//                                     }
//                                     // Check if promotion has stock (số lượng còn lại)
//                                     if (promo.stock !== null && promo.stock <= 0) {
//                                         alert('Mã khuyến mãi đã hết lượt sử dụng');
//                                         setPromoCode('');
//                                         return;
//                                     }
//                                     // Check expiry
//                                     const today = new Date();
//                                     today.setHours(0, 0, 0, 0);
//                                     const expiryDate = new Date(promo.expiryDate);
//                                     expiryDate.setHours(0, 0, 0, 0);
//                                     if (today > expiryDate) {
//                                         alert('Mã khuyến mãi đã hết hạn');
//                                         setPromoCode('');
//                                         return;
//                                     }
//                                     setSelectedPromotion(promo);
//                                 } else {
//                                     setSelectedPromotion(null);
//                                 }
//                             }}
//                             className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
//                         >
//                             <option value="">-- Chọn mã giảm giá --</option>
//                             {(() => {
//                                 // Get all public promotions that are active and not expired
//                                 const today = new Date();
//                                 today.setHours(0, 0, 0, 0);
                                
//                                 // Get selected service IDs
//                                 const selectedServiceIds = selectedServices.map(({ service }) => service.id);
                                
//                                 // If no services selected, don't show any promotions
//                                 if (selectedServiceIds.length === 0) {
//                                     return null;
//                                 }
                                
//                                 // Filter promotions based on conditions
//                                 const filteredPromotions = promotions.filter(p => {
//                                     // Must be public
//                                     if (p.isPublic !== true) return false;
                                    
//                                     // Must be active
//                                     if (p.isActive === false) return false;
                                    
//                                     // Check expiry
//                                     const expiryDate = new Date(p.expiryDate);
//                                     expiryDate.setHours(0, 0, 0, 0);
//                                     if (today > expiryDate) return false;
                                    
//                                     // Check stock
//                                     if (p.stock !== null && p.stock <= 0) return false;
                                    
//                                     // IMPORTANT: Check if promotion applies to selected services
//                                     // Parse applicableServiceIds if it's a string (from JSON)
//                                     let applicableServiceIdsArray: string[] = [];
//                                     if (p.applicableServiceIds) {
//                                         if (typeof p.applicableServiceIds === 'string') {
//                                             try {
//                                                 applicableServiceIdsArray = JSON.parse(p.applicableServiceIds);
//                                             } catch (e) {
//                                                 console.error('Error parsing applicableServiceIds:', e);
//                                                 applicableServiceIdsArray = [];
//                                             }
//                                         } else if (Array.isArray(p.applicableServiceIds)) {
//                                             applicableServiceIdsArray = p.applicableServiceIds;
//                                         }
//                                     }
                                    
//                                     // If promotion has applicableServiceIds and it's not empty, it must match at least one selected service
//                                     if (applicableServiceIdsArray && applicableServiceIdsArray.length > 0) {
//                                         // Promotion is for specific services - check if any selected service matches
//                                         const matchesService = selectedServiceIds.some(serviceId => 
//                                             applicableServiceIdsArray.includes(serviceId)
//                                         );
//                                         if (!matchesService) {
//                                             // Promotion doesn't apply to any selected service - DON'T SHOW IT
//                                             return false;
//                                         }
//                                     }
//                                     // If applicableServiceIds is empty/null, promotion applies to all services (no filter needed)
                                    
//                                     // Filter by target audience
//                                     if (p.targetAudience === 'Birthday') {
//                                         // Only show if today is user's birthday
//                                         if (!isBirthday) return false;
//                                     } else if (p.targetAudience === 'New Clients') {
//                                         // Only show if user hasn't used this service before
//                                         if (!currentUser) return false;
                                        
//                                         // Check if user has used any of the selected services
//                                         // For new client promotions, check each service individually
//                                         const hasUsedAnySelectedService = selectedServiceIds.some(serviceId => {
//                                             return userAppointments.some(apt => 
//                                                 apt.serviceId === serviceId && 
//                                                 apt.status === 'completed'
//                                             );
//                                         });
                                        
//                                         // If user has used any selected service, don't show new client promotion
//                                         if (hasUsedAnySelectedService) return false;
                                        
//                                         // For new client promotions with specific services, 
//                                         // we already checked applicableServiceIds above
//                                     }
//                                     // For "All" and other target audiences, no additional filtering needed
                                    
//                                     return true;
//                                 });
                                
//                                 // Also include applicable promotions from API (which backend already filtered)
//                                 // But we need to filter them again by selected services
//                                 const filteredApplicablePromotions = applicablePromotions.filter(p => {
//                                     if (p.isPublic !== true) return false;
//                                     if (p.isActive !== false) return false;
//                                     if (p.stock !== null && p.stock <= 0) return false;
                                    
//                                     // Parse applicableServiceIds if it's a string (from JSON)
//                                     let applicableServiceIdsArray: string[] = [];
//                                     if (p.applicableServiceIds) {
//                                         if (typeof p.applicableServiceIds === 'string') {
//                                             try {
//                                                 applicableServiceIdsArray = JSON.parse(p.applicableServiceIds);
//                                             } catch (e) {
//                                                 console.error('Error parsing applicableServiceIds:', e);
//                                                 applicableServiceIdsArray = [];
//                                             }
//                                         } else if (Array.isArray(p.applicableServiceIds)) {
//                                             applicableServiceIdsArray = p.applicableServiceIds;
//                                         }
//                                     }
                                    
//                                     // Check if promotion applies to selected services
//                                     if (applicableServiceIdsArray && applicableServiceIdsArray.length > 0) {
//                                         const matchesService = selectedServiceIds.some(serviceId => 
//                                             applicableServiceIdsArray.includes(serviceId)
//                                         );
//                                         if (!matchesService) return false;
//                                     }
                                    
//                                     return true;
//                                 });
                                
//                                 // Combine both lists
//                                 const allAvailablePromotions = [
//                                     ...filteredApplicablePromotions,
//                                     ...filteredPromotions
//                                 ];
                                
//                                 // Remove duplicates by code
//                                 const uniquePromotions = Array.from(
//                                     new Map(allAvailablePromotions.map(p => [p.code, p])).values()
//                                 );
                                
//                                 return uniquePromotions.map(promo => (
//                                     <option key={promo.id} value={promo.code}>
//                                         {promo.code} - {promo.title} 
//                                         {promo.discountType === 'percentage' 
//                                             ? ` (Giảm ${promo.discountValue}%)` 
//                                             : ` (Giảm ${formatPrice(promo.discountValue)})`}
//                                     </option>
//                                 ));
//                             })()}
//                         </select>
//                     </div>
                    
//                     {selectedPromotion && (
//                         <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
//                             <p className="text-sm text-green-800">
//                                 <span className="font-semibold">Mã đã áp dụng: </span>
//                                 {selectedPromotion.title} ({selectedPromotion.code})
//                             </p>
//                             <button
//                                 onClick={() => {
//                                     setSelectedPromotion(null);
//                                     setPromoCode('');
//                                 }}
//                                 className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
//                             >
//                                 Hủy áp dụng
//                             </button>
//                         </div>
//                     )}
//                 </div>

//                 <div className="bg-white border border-gray-300 rounded-lg p-4 mb-6">
//                     <div className="flex justify-between text-lg">
//                         <span className="font-semibold">Tổng cộng:</span>
//                         <span className="font-bold text-amber-600">{formatPrice(total)}</span>
//                     </div>
//                     {discount > 0 && (
//                         <p className="text-sm text-green-600 text-right mt-1">
//                             Đã giảm: {formatPrice(discount)}
//                         </p>
//                     )}
//                 </div>

//                 <div className="flex justify-between">
//                     <button
//                         onClick={() => setCurrentStep(2)}
//                         className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
//                     >
//                         Trước
//                     </button>
//                     <button
//                         onClick={handleConfirmBooking}
//                         className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
//                     >
//                         Xác nhận đặt lịch
//                     </button>
//                 </div>
//             </div>
//         );
//     };

//     const renderPaymentModal = () => {
//         if (!isPaymentModalOpen) return null;

//         return (
//             <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//                 <div className="bg-white rounded-lg p-6 max-w-md w-full">
//                     <h2 className="text-2xl font-bold   text-gray-800 mb-4">Chọn phương thức thanh toán</h2>
                    
//                     <div className="space-y-3 mb-6">
//                         <button
//                             onClick={() => setPaymentMethod('VNPay')}
//                             className={`w-full p-4 border rounded-lg flex items-center gap-3 ${
//                                 paymentMethod === 'VNPay' ? 'border-amber-600 bg-amber-50' : 'border-gray-200'
//                             }`}
//                         >
//                             <VNPayIcon className="w-8 h-8" />
//                             <span className="font-semibold">Thanh toán VNPay</span>
//                         </button>
                        
//                         <button
//                             onClick={() => setPaymentMethod('Cash')}
//                             className={`w-full p-4 border rounded-lg flex items-center gap-3 ${
//                                 paymentMethod === 'Cash' ? 'border-amber-600 bg-amber-50' : 'border-gray-200'
//                             }`}
//                         >
//                             <span className="text-2xl">💵</span>
//                             <span className="font-semibold">Thanh toán tại quầy</span>
//                         </button>
//                     </div>

//                     <div className="flex gap-3">
//                         <button
//                             onClick={() => setIsPaymentModalOpen(false)}
//                             className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
//                         >
//                             Hủy
//                         </button>
//                         <button
//                             onClick={handleProcessPayment}
//                             className="flex-1 px-4 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
//                         >
//                             Xác nhận
//                         </button>
//                     </div>
//                 </div>
//             </div>
//         );
//     };

//     return (
//         <div className="min-h-screen bg-gray-50 py-8">
//             <div className="container mx-auto px-4">
//                 <h1 className="text-3xl font-bold text-center text-amber-700 mb-8">Đặt Lịch Hẹn</h1>
                
//                 {renderStepIndicator()}
                
//                 <div className="mt-8">
//                     {currentStep === 1 && renderStep1()}
//                     {currentStep === 2 && renderStep2()}
//                     {currentStep === 3 && renderStep3()}
//                 </div>

//                 {renderPaymentModal()}
//             </div>
//         </div>
//     );
// };

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import type { Service, User, Appointment, PaymentMethod, Promotion, TreatmentCourse, Review, StaffShift, ServiceCategory } from '../../types';
import { StarIcon, VNPayIcon, CheckCircleIcon, ChevronLeftIcon, ChevronRightIcon, CalendarIcon, ClockIcon, ShoppingCartIcon, CurrencyDollarIcon, PlusIcon, MinusIcon, SparklesIcon, GiftIcon, ExclamationTriangleIcon } from '../../shared/icons';
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
    
    const dateInputRef = useRef<HTMLInputElement>(null);

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
    const [redeemedVouchers, setRedeemedVouchers] = useState<Array<Promotion & { redeemedCount: number }>>([]);

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
        
        // Listen for refresh events (e.g., after payment success)
        const handleRefresh = () => {
            console.log('🔄 [BookingPage] Refreshing data after payment/voucher usage...');
            loadInitialData();
        };
        
        window.addEventListener('refresh-vouchers', handleRefresh);
        window.addEventListener('refresh-appointments', handleRefresh);
        
        return () => {
            window.removeEventListener('refresh-vouchers', handleRefresh);
            window.removeEventListener('refresh-appointments', handleRefresh);
        };
    }, []);


    const loadInitialData = async () => {
        try {
            const [servicesData, categoriesData, usersData, promotionsData, coursesData, reviewsData, appointmentsData] = await Promise.all([
                apiService.getServices(),
                apiService.getServiceCategories(),
                apiService.getUsers(),
                apiService.getPromotions(),
                apiService.getTreatmentCourses(),
                apiService.getReviews(),
                apiService.getAppointments()
            ]);

            const activeServices = servicesData.filter(s => s.isActive === true || s.isActive === undefined || s.isActive === null);
            
            setServices(activeServices);
            setCategories(categoriesData || []);
            const parsedPromotions = promotionsData.filter(p => p.isActive !== false).map(p => {
                if (p.applicableServiceIds && typeof p.applicableServiceIds === 'string') {
                    try {
                        p.applicableServiceIds = JSON.parse(p.applicableServiceIds);
                    } catch (e) {
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
                if (currentUser.birthday) {
                    const today = new Date();
                    const birthday = new Date(currentUser.birthday);
                    const isTodayBirthday = birthday.getMonth() === today.getMonth() && 
                                           birthday.getDate() === today.getDate();
                    setIsBirthday(isTodayBirthday);
                }
                // Fetch redeemed vouchers for usage validation
                try {
                    const fetchedRedeemed = await apiService.getMyRedeemedVouchers(currentUser.id);
                    setRedeemedVouchers(fetchedRedeemed || []);
                } catch (error) {
                    console.error('Error fetching redeemed vouchers:', error);
                    setRedeemedVouchers([]);
                }
            }

            if (serviceIdFromUrl && activeServices.length > 0) {
                const serviceToSelect = activeServices.find(s => s.id === serviceIdFromUrl);
                if (serviceToSelect) {
                    setSelectedServices([{ service: serviceToSelect, quantity: 1 }]);
                    if (serviceToSelect.categoryId) {
                        setSelectedCategory(serviceToSelect.categoryId);
                    }
                }
            }
        } catch (error: any) {
            console.error('Error loading data:', error);
            alert('Không thể tải dữ liệu. Vui lòng thử lại sau.');
        }
    };

    // Step 1: Select Service (Single selection with toggle)
    const handleServiceToggle = (service: Service) => {
        const existingIndex = selectedServices.findIndex(s => s.service.id === service.id);
        if (existingIndex >= 0) {
            // Remove if already selected (toggle off)
            setSelectedServices([]);
        } else {
            // Replace with new selection (only one service allowed)
            setSelectedServices([{ service, quantity: 1 }]);
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
        const filtered = selectedCategory 
            ? services.filter(s => s.categoryId === selectedCategory)
            : services;
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
                const firstService = selectedServices[0].service;
                const applicable = await apiService.getApplicablePromotions(currentUser.id, firstService.id);
                setApplicablePromotions(applicable);
                
                // Also reload redeemed vouchers to ensure they are up-to-date
                try {
                    const fetchedRedeemed = await apiService.getMyRedeemedVouchers(currentUser.id);
                    setRedeemedVouchers(fetchedRedeemed || []);
                } catch (error) {
                    console.error('Error fetching redeemed vouchers:', error);
                }
            } catch (error) {
                setApplicablePromotions([]);
            }
        };
        loadApplicablePromotions();
    }, [currentUser, selectedServices]);

    // Validate and reset voucher if it's no longer applicable
    useEffect(() => {
        if (!selectedPromotion) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Calculate current order total
        const currentOrderTotal = selectedServices.reduce((sum, { service, quantity }) => sum + ((service.discountPrice || service.price) * quantity), 0);
        
        let isStillValid = true;
        let invalidReason = '';

        // Check if promotion is active
        if (selectedPromotion.isActive === false) {
            isStillValid = false;
            invalidReason = 'Mã khuyến mãi này không còn hoạt động';
        }
        
        // Check expiry
        else if (new Date(selectedPromotion.expiryDate) < today) {
            isStillValid = false;
            invalidReason = 'Mã khuyến mãi đã hết hạn';
        }
        
        // Check stock - CHỈ kiểm tra cho voucher public, KHÔNG kiểm tra cho voucher đổi điểm
        else if (selectedPromotion.isPublic !== false && selectedPromotion.stock !== null && selectedPromotion.stock !== undefined && selectedPromotion.stock <= 0) {
            // Voucher public: kiểm tra stock
            isStillValid = false;
            invalidReason = 'Mã khuyến mãi đã hết lượt sử dụng';
        } else if (selectedPromotion.isPublic === false) {
            // Voucher đổi điểm: kiểm tra redeemedCount thay vì stock
            const redeemedVoucher = redeemedVouchers.find((v: any) => 
                v.code && selectedPromotion.code && 
                v.code.toUpperCase().trim() === selectedPromotion.code.toUpperCase().trim()
            );
            if (!redeemedVoucher || !redeemedVoucher.redeemedCount || redeemedVoucher.redeemedCount <= 0) {
                isStillValid = false;
                invalidReason = 'Bạn không còn voucher này để sử dụng';
            }
        }
        
        // Check minimum order value
        else if (selectedPromotion.minOrderValue && currentOrderTotal < selectedPromotion.minOrderValue) {
            isStillValid = false;
            invalidReason = `Đơn hàng chưa đủ giá trị tối thiểu ${formatPrice(selectedPromotion.minOrderValue)}`;
        }
        
        // Check service applicability
        else if (selectedPromotion.applicableServiceIds && selectedPromotion.applicableServiceIds.length > 0) {
            const selectedServiceIds = selectedServices.map(s => s.service.id);
            const hasMatch = selectedPromotion.applicableServiceIds.some(promoServiceId => 
                selectedServiceIds.includes(promoServiceId)
            );
            if (!hasMatch) {
                isStillValid = false;
                invalidReason = 'Mã khuyến mãi không áp dụng cho dịch vụ đã chọn';
            }
        }

        // Reset voucher if no longer valid (silently, backend will validate when booking)
        if (!isStillValid) {
            setSelectedPromotion(null);
            setPromoCode('');
            // Removed alert - backend will validate and show error if voucher is invalid when booking
        }
    }, [selectedServices, selectedPromotion, redeemedVouchers]);

    // Helper: Check if promotion is applicable to current booking
    const isPromotionApplicable = (promo: Promotion): boolean => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // 1. Must be active
        if (promo.isActive === false) return false;
        
        // 2. Not expired
        const expiryDate = new Date(promo.expiryDate);
        expiryDate.setHours(0, 0, 0, 0);
        if (expiryDate < today) return false;
        
        // 3. Check stock availability - CHỈ cho voucher public, KHÔNG cho voucher đổi điểm
        if (promo.isPublic !== false && promo.stock !== null && promo.stock !== undefined && promo.stock <= 0) return false;
        
        // 4. Calculate current order total
        const currentOrderTotal = selectedServices.reduce(
            (sum, { service, quantity }) => sum + ((service.discountPrice || service.price) * quantity), 
            0
        );
        
        // 5. Check minimum order value
        if (promo.minOrderValue && currentOrderTotal < promo.minOrderValue) return false;
        
        // 6. Check if promo applies to selected services
        if (promo.applicableServiceIds && promo.applicableServiceIds.length > 0) {
            const selectedServiceIds = selectedServices.map(s => s.service.id);
            const hasMatch = promo.applicableServiceIds.some(promoServiceId => 
                selectedServiceIds.includes(promoServiceId)
            );
            if (!hasMatch) return false;
        }
        // If applicableServiceIds is empty/null, voucher applies to all services
        
        // ✅ 7. Check if user has already used this voucher
        if (promo.targetAudience === 'Birthday') {
            // Birthday vouchers: Check if used this year
            const hasUsedBirthdayVoucher = redeemedVouchers.some(rv => 
                rv.targetAudience === 'Birthday' && rv.redeemedCount > 0
            );
            if (hasUsedBirthdayVoucher) return false;
            
            // Also check if today is actually the birthday
            if (!isBirthday) return false;
        }

        if (promo.targetAudience === 'New Clients') {
            // New client vouchers: Check if already used
            const hasUsedNewClientVoucher = redeemedVouchers.some(rv => 
                rv.targetAudience === 'New Clients' && rv.redeemedCount > 0
            );
            if (hasUsedNewClientVoucher) return false;
            
            // Also check if user has any successful bookings
            const hasAnySuccessfulBooking = userAppointments.some(app => 
                app.status !== 'cancelled' && 
                (app.paymentStatus === 'Paid' || 
                 (app.status === 'completed' || app.status === 'upcoming' || app.status === 'scheduled'))
            );
            if (hasAnySuccessfulBooking) return false;
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

    // Helper: Convert time string (HH:mm) to minutes from midnight
    const timeToMinutes = (time: string): number => {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    };

    // Helper: Check if time is a round hour (e.g., 12:00, 13:00, not 12:30, 12:45)
    const isRoundHour = (time: string): boolean => {
        const [, minutes] = time.split(':').map(Number);
        return minutes === 0;
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

    // Check if a time slot is blocked by an existing appointment's duration
    // Logic: Kiểm tra overlap giữa appointment mới (với dịch vụ đang chọn) và appointments đã đặt
    // Time slot bị chặn nếu có bất kỳ overlap nào (cả đi lùi và đi tiến)
    const isTimeSlotBlocked = (time: string): boolean => {
        if (!selectedDate || selectedServices.length === 0) return false;
        
        // Lấy duration của dịch vụ đang được chọn (lấy dịch vụ đầu tiên nếu có nhiều)
        const selectedService = selectedServices[0].service;
        if (!selectedService || !selectedService.duration) return false;

        const newStartTimeInMinutes = timeToMinutes(time);
        const newEndTimeInMinutes = newStartTimeInMinutes + selectedService.duration;

        // Lấy tất cả appointments của user trong ngày đó (cùng ngày, status != cancelled)
        const appointmentsOnSelectedDate = userAppointments.filter(apt => 
            apt.date === selectedDate && 
            apt.status !== 'cancelled'
        );

        // Kiểm tra overlap với từng appointment đã đặt
        return appointmentsOnSelectedDate.some(apt => {
            // Tìm service từ appointments để lấy duration
            const service = services.find(s => s.id === apt.serviceId);
            if (!service || !service.duration) return false;

            const existingStartTimeInMinutes = timeToMinutes(apt.time);
            const existingEndTimeInMinutes = existingStartTimeInMinutes + service.duration;

            // Kiểm tra overlap: Hai khoảng thời gian overlap nếu:
            // newStart < existingEnd && newEnd > existingStart
            const hasOverlap = newStartTimeInMinutes < existingEndTimeInMinutes && 
                               newEndTimeInMinutes > existingStartTimeInMinutes;

            return hasOverlap;
        });
    };

    // Check if a time slot meets the minimum 1-hour gap requirement from existing appointments
    // Logic: Nếu khách đã đặt lịch ở 13:00, chỉ được đặt lịch mới cách ít nhất 1 giờ (tròn giờ)
    // Ví dụ: Đã đặt 13:00 (60 phút = 13:00-14:00) → có thể đặt 12:00 (12:00-13:00, cách 0 phút = không hợp lệ? Không, đây là tiếp giáp)
    // Thực ra: Nếu đã đặt 13:00-14:00, có thể đặt 12:00-13:00 (tiếp giáp) hoặc 14:00-15:00 (tiếp giáp)
    // Nhưng theo yêu cầu: "chỉ được đặt cách lịch hiện tại 1 tiếng" → nghĩa là phải cách nhau ít nhất 1 giờ
    // Ví dụ: Đã đặt 13:00 → có thể đặt 12:00 (12:00-13:00 kết thúc, 13:00-14:00 bắt đầu = cách nhau 0 phút) → KHÔNG hợp lệ
    // Đã đặt 13:00 → có thể đặt 11:00 (11:00-12:00 kết thúc, 13:00-14:00 bắt đầu = cách nhau 60 phút = 1 giờ) → HỢP LỆ
    // Đã đặt 13:00 → có thể đặt 14:00 (13:00-14:00 kết thúc, 14:00-15:00 bắt đầu = cách nhau 0 phút) → KHÔNG hợp lệ
    // Đã đặt 13:00 → có thể đặt 15:00 (13:00-14:00 kết thúc, 15:00-16:00 bắt đầu = cách nhau 60 phút = 1 giờ) → HỢP LỆ
    const isTimeSlotValidForMinimumGap = (time: string): boolean => {
        if (!selectedDate || selectedServices.length === 0) return true;
        
        // PHẢI là giờ tròn (00 phút) - chỉ cho phép XX:00, không cho XX:30, XX:45
        if (!isRoundHour(time)) return false;

        // Lấy duration của dịch vụ đang được chọn
        const selectedService = selectedServices[0].service;
        if (!selectedService || !selectedService.duration) return true;

        const newStartTimeInMinutes = timeToMinutes(time);
        const newEndTimeInMinutes = newStartTimeInMinutes + selectedService.duration;

        // Lấy tất cả appointments của user trong ngày đó (cùng ngày, status != cancelled)
        const appointmentsOnSelectedDate = userAppointments.filter(apt => 
            apt.date === selectedDate && 
            apt.status !== 'cancelled'
        );

        if (appointmentsOnSelectedDate.length === 0) return true;

        // Kiểm tra với từng appointment đã đặt
        return appointmentsOnSelectedDate.every(apt => {
            // Tìm service từ appointments để lấy duration
            const service = services.find(s => s.id === apt.serviceId);
            if (!service || !service.duration) return true;

            const existingStartTimeInMinutes = timeToMinutes(apt.time);
            const existingEndTimeInMinutes = existingStartTimeInMinutes + service.duration;

            // Tính khoảng cách giữa 2 appointments (theo phút)
            // Khoảng cách = khoảng trống giữa chúng (không tính overlap)
            let gapInMinutes = 0;
            
            // Nếu appointment mới đứng trước appointment đã đặt (newEnd <= existingStart)
            // Khoảng cách = existingStart - newEnd (khoảng trống giữa newEnd và existingStart)
            if (newEndTimeInMinutes <= existingStartTimeInMinutes) {
                gapInMinutes = existingStartTimeInMinutes - newEndTimeInMinutes;
            }
            // Nếu appointment mới đứng sau appointment đã đặt (newStart >= existingEnd)
            // Khoảng cách = newStart - existingEnd (khoảng trống giữa existingEnd và newStart)
            else if (newStartTimeInMinutes >= existingEndTimeInMinutes) {
                gapInMinutes = newStartTimeInMinutes - existingEndTimeInMinutes;
            }
            else {
                // Có overlap (đã được kiểm tra bởi isTimeSlotBlocked)
                return false;
            }

            // PHẢI cách nhau ít nhất 1 giờ (60 phút)
            // Nếu gapInMinutes = 0, nghĩa là tiếp giáp nhau → không hợp lệ
            // Nếu gapInMinutes > 0 và < 60, nghĩa là có khoảng trống nhưng chưa đủ 1 giờ → không hợp lệ
            // Chỉ hợp lệ nếu gapInMinutes >= 60
            return gapInMinutes >= 60;
        });
    };

    // Step 4: Confirmation
    const calculateTotal = () => {
        const servicesTotal = selectedServices.reduce((sum, { service, quantity }) => sum + ((service.discountPrice || service.price) * quantity), 0);
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

            if (selectedPromotion) {
                // Normalize isPublic to boolean
                const normalizedIsPublic = selectedPromotion.isPublic === true || selectedPromotion.isPublic === 1 || selectedPromotion.isPublic === '1';
                const isRedeemedVoucher = !normalizedIsPublic;
                
                console.log('🔍 [PRE-BOOKING VALIDATION] Checking voucher:', {
                    code: selectedPromotion.code,
                    id: selectedPromotion.id,
                    isPublic: selectedPromotion.isPublic,
                    normalizedIsPublic: normalizedIsPublic,
                    isRedeemedVoucher: isRedeemedVoucher,
                    redeemedVouchersLength: redeemedVouchers.length
                });
                
                // Đối với voucher đổi điểm (isPublic = false), kiểm tra trong redeemedVouchers
                if (isRedeemedVoucher) {
                    const redeemedVoucher = redeemedVouchers.find((v: any) => 
                        v.code && selectedPromotion.code && 
                        v.code.toUpperCase().trim() === selectedPromotion.code.toUpperCase().trim()
                    );
                    
                    console.log('🔍 [PRE-BOOKING VALIDATION] Redeemed voucher check:', {
                        found: !!redeemedVoucher,
                        redeemedCount: redeemedVoucher?.redeemedCount,
                        isValid: redeemedVoucher && redeemedVoucher.redeemedCount && redeemedVoucher.redeemedCount > 0
                    });
                    
                    if (!redeemedVoucher || !redeemedVoucher.redeemedCount || redeemedVoucher.redeemedCount <= 0) {
                        console.error('❌ [PRE-BOOKING VALIDATION] Redeemed voucher not found or count is 0');
                        alert('Mã khuyến mãi này không còn khả dụng. Vui lòng chọn mã khác.');
                        setIsPaymentModalOpen(false);
                        return;
                    }
                } else {
                    // Đối với voucher public, kiểm tra trong applicablePromotions hoặc promotions
                    const isStillApplicable = applicablePromotions.some(p => p.id === selectedPromotion.id);
                    const isGeneralPromo = promotions.find(p => p.id === selectedPromotion.id && p.isActive !== false);
                    
                    console.log('🔍 [PRE-BOOKING VALIDATION] Public voucher check:', {
                        isStillApplicable: isStillApplicable,
                        isGeneralPromo: !!isGeneralPromo,
                        isValid: isStillApplicable || !!isGeneralPromo
                    });
                    
                    if (!isStillApplicable && !isGeneralPromo) {
                        console.error('❌ [PRE-BOOKING VALIDATION] Public voucher not found in applicable lists');
                        alert('Mã khuyến mãi này không còn khả dụng. Vui lòng chọn mã khác.');
                        setIsPaymentModalOpen(false);
                        return;
                    }
                }
            }

            const appointmentsToCreate = selectedServices.map(({ service, quantity }) => ({
                id: `apt-${uuidv4()}`,
                userId: currentUser!.id,
                serviceId: service.id,
                serviceName: service.name,
                therapistId: null,
                date: selectedDate,
                time: selectedTime,
                status: 'pending' as const,
                paymentStatus: 'Unpaid' as const,
                notes: '',
                bookingGroupId: bookingGroupId,
                promotionId: selectedPromotion?.id || null,
                quantity: quantity,
                durationWeeks: quantity + 1,
                frequencyType: 'sessions_per_week' as const,
                frequencyValue: 1
            }));

            // Create appointments (promotion will be validated by backend)
            const createdAppointments = await Promise.all(
                appointmentsToCreate.map(apt => apiService.createAppointment(apt))
            );

            const totalAmount = calculateTotal();
            console.log('💰 Payment amount calculation:', {
                servicesTotal: selectedServices.reduce((sum, { service, quantity }) => sum + ((service.discountPrice || service.price) * quantity), 0),
                discount: selectedPromotion ? (selectedPromotion.discountType === 'percentage' 
                    ? selectedServices.reduce((sum, { service, quantity }) => sum + ((service.discountPrice || service.price) * quantity), 0) * (selectedPromotion.discountValue / 100)
                    : selectedPromotion.discountValue) : 0,
                finalAmount: totalAmount,
                hasPromotion: !!selectedPromotion,
                promotionCode: selectedPromotion?.code
            });
            
            const result = await apiService.processPayment(
                createdAppointments[0].id,
                paymentMethod,
                totalAmount
            );

            // QUAN TRỌNG: Đợi một chút để đảm bảo backend đã commit update PromotionUsage
            // Sau đó mới refresh để frontend lấy dữ liệu mới nhất
            await new Promise(resolve => setTimeout(resolve, 500)); // Đợi 500ms
            
            // Reload redeemed vouchers ngay lập tức để cập nhật dropdown và state
            if (currentUser) {
                try {
                    const fetchedRedeemed = await apiService.getMyRedeemedVouchers(currentUser.id);
                    setRedeemedVouchers(fetchedRedeemed || []);
                    console.log('✅ Reloaded redeemed vouchers after booking:', fetchedRedeemed?.length || 0);
                    console.log('📊 Redeemed vouchers details:', fetchedRedeemed?.map((v: any) => ({
                        code: v.code,
                        redeemedCount: v.redeemedCount
                    })));
                } catch (error) {
                    console.error('Error reloading redeemed vouchers:', error);
                }
            }
            
            // Refresh appointments AND vouchers in app (các trang khác sẽ nhận được event này)
            window.dispatchEvent(new Event('refresh-appointments'));
            window.dispatchEvent(new Event('refresh-vouchers'));

            // Close modal
            setIsPaymentModalOpen(false);

            // If payment processor returned a redirect URL (VNPay), follow it.
            if (paymentMethod === 'VNPay' && result.paymentUrl) {
                // For VNPay we redirect the browser to the paymentUrl (VNPay will return to our success route)
                window.location.href = result.paymentUrl;
                return;
            }

            // If the API explicitly indicates success, navigate to our success page
            if (result && (result.success === true || result.transactionId || result.paymentId)) {
                // Ensure app refreshes appointments/vouchers before showing success
                try {
                    const updatedAppointments = await apiService.getAppointments();
                    window.dispatchEvent(new CustomEvent('appointments-updated', { detail: { appointments: updatedAppointments } }));
                } catch (err) {
                    console.warn('Failed to refresh appointments after payment', err);
                }

                navigate('/payment/success', {
                    state: {
                        transactionId: result.transactionId || result.paymentId || createdAppointments[0].id,
                        amount: totalAmount,
                        method: paymentMethod
                    }
                });
                return;
            }

            // Fallback: if the result explicitly failed
            navigate('/payment/failed', { state: { message: 'Thanh toán không thành công', paymentId: result?.paymentId } });

        } catch (err: any) {
            console.error('Payment processing error:', err);
            setIsPaymentModalOpen(false);
            const message = err?.message || 'Có lỗi xảy ra khi xử lý thanh toán';
            navigate('/payment/failed', { state: { message } });
        }
    };

    const renderStepIndicator = () => {
        const steps = [
            { num: 1, label: 'Chọn Dịch Vụ', icon: <ShoppingCartIcon className="w-5 h-5"/> },
            { num: 2, label: 'Chọn Thời Gian', icon: <CalendarIcon className="w-5 h-5"/> },
            { num: 3, label: 'Xác Nhận', icon: <CheckCircleIcon className="w-5 h-5"/> }
        ];

        return (
            <div className="flex justify-center items-center mb-12">
                {steps.map((step, idx) => (
                    <React.Fragment key={step.num}>
                        <div className={`flex flex-col items-center relative z-10 transition-all duration-500 ${currentStep === step.num ? 'scale-110' : 'scale-100'}`}>
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg border-4 transition-colors duration-500 ${
                                currentStep >= step.num 
                                ? 'bg-gradient-to-br from-brand-primary to-rose-500 border-rose-100 text-white' 
                                : 'bg-white border-gray-200 text-gray-300'
                            }`}>
                                {step.icon}
                            </div>
                            <span className={`mt-3 text-xs font-bold uppercase tracking-widest transition-colors duration-500 ${
                                currentStep >= step.num ? 'text-brand-primary' : 'text-gray-300'
                            }`}>
                                {step.label}
                            </span>
                        </div>
                        {idx < steps.length - 1 && (
                            <div className="flex-1 max-w-[80px] w-16 h-1 bg-gray-200 mx-2 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full bg-brand-primary transition-all duration-700 ease-out ${
                                        currentStep > step.num ? 'w-full' : 'w-0'
                                    }`} 
                                />
                            </div>
                        )}
                    </React.Fragment>
                ))}
            </div>
        );
    };

    const renderStep1 = () => {
        const selectedServiceIds = selectedServices.map(s => s.service.id);
        
        return (
            <div className="max-w-5xl mx-auto animate-fadeInUp">
                {/* Category Filter - Modern Pills */}
                <div className="flex gap-3 mb-8 overflow-x-auto pb-4 scrollbar-hide">
                    <button
                        onClick={() => setSelectedCategory('')}
                        className={`flex-shrink-0 px-6 py-3 rounded-full text-sm font-bold transition-all duration-300 whitespace-nowrap ${
                            selectedCategory === '' 
                            ? 'bg-brand-dark text-white shadow-lg shadow-brand-dark/20 scale-105' 
                            : 'bg-white text-gray-500 border border-gray-200 hover:border-brand-primary hover:text-brand-primary'
                        }`}
                    >
                        Tất cả dịch vụ
                    </button>
                    {categories.map(category => (
                        <button
                            key={category.id}
                            onClick={() => setSelectedCategory(category.id)}
                            className={`flex-shrink-0 px-6 py-3 rounded-full text-sm font-bold transition-all duration-300 whitespace-nowrap ${
                                selectedCategory === category.id 
                                ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/30 scale-105' 
                                : 'bg-white text-gray-500 border border-gray-200 hover:border-brand-primary hover:text-brand-primary'
                            }`}
                        >
                            {category.name}
                        </button>
                    ))}
                </div>

                {/* Services Grid */}
                {services.length === 0 ? (
                    <div className="p-12 text-center bg-white rounded-3xl border-2 border-dashed border-gray-200">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 animate-spin">
                            <SparklesIcon className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="text-gray-500">Đang tải dịch vụ...</p>
                    </div>
                ) : filteredServices.length === 0 ? (
                    <div className="p-12 text-center bg-white rounded-3xl border-2 border-dashed border-gray-200">
                        <p className="text-xl font-bold text-gray-800 mb-2">Chưa có dịch vụ</p>
                        <p className="text-gray-500">Vui lòng chọn danh mục khác.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredServices.map(service => {
                            const isSelected = selectedServiceIds.includes(service.id);
                            const selectedItem = selectedServices.find(s => s.service.id === service.id);
                            const quantity = selectedItem?.quantity || 1;
                            
                            return (
                                <div
                                    key={service.id}
                                    onClick={() => handleServiceToggle(service)}
                                    className={`group relative p-5 rounded-3xl border-2 transition-all duration-300 cursor-pointer overflow-hidden ${
                                        isSelected 
                                        ? 'bg-white border-brand-primary shadow-xl ring-4 ring-brand-primary/10 scale-[1.02]' 
                                        : 'bg-white border-transparent shadow-sm hover:shadow-lg hover:border-brand-secondary hover:-translate-y-1'
                                    }`}
                                >
                                    <div className="flex items-center gap-5">
                                        <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 relative">
                                            <img 
                                                src={service.imageUrl || 'https://via.placeholder.com/150'} 
                                                alt={service.name}
                                                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                                            />
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <h3 className={`font-serif font-bold text-lg truncate pr-2 ${isSelected ? 'text-brand-primary' : 'text-gray-800'}`}>
                                                    {service.name}
                                                </h3>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{service.description}</p>
                                            
                                            <div className="flex items-center gap-4 mt-3">
                                                <span className="text-lg font-bold text-brand-dark">{formatPrice(service.discountPrice || service.price)}</span>
                                                <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                                                    <ClockIcon className="w-3 h-3"/> {service.duration} phút
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Số buổi - Separated Section */}
                                    {isSelected && (
                                        <div className="mt-4 pt-4 border-t border-gray-200" onClick={e => e.stopPropagation()}>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-semibold text-gray-700">Số buổi:</span>
                                                <div className="flex items-center bg-gray-100 rounded-full p-1 shadow-inner">
                                                    <button 
                                                        onClick={() => handleQuantityChange(service.id, quantity - 1)}
                                                        disabled={quantity <= 1}
                                                        className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-gray-600 hover:text-red-500 disabled:opacity-50 transition-colors"
                                                    >
                                                        <MinusIcon className="w-4 h-4" />
                                                    </button>
                                                    <span className="w-12 text-center font-bold text-gray-800 text-base">{quantity}</span>
                                                    <button 
                                                        onClick={() => handleQuantityChange(service.id, quantity + 1)}
                                                        className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center shadow-sm hover:bg-brand-dark transition-colors"
                                                    >
                                                        <PlusIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="mt-2 text-right">
                                                <span className="text-xs text-gray-500">Thành tiền: </span>
                                                <span className="text-sm font-bold text-brand-primary">{formatPrice((service.discountPrice || service.price) * quantity)}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Footer Action */}
                <div className="sticky bottom-4 mt-8 z-30">
                    <div className="bg-white/80 backdrop-blur-xl border border-white/50 p-4 rounded-3xl shadow-2xl flex items-center justify-between max-w-2xl mx-auto">
                        <div className="pl-4">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tổng dự kiến</p>
                            <p className="text-2xl font-black text-brand-primary">
                                {formatPrice(selectedServices.reduce((sum, { service, quantity }) => sum + ((service.discountPrice || service.price) * quantity), 0))}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => navigate(-1)}
                                className="px-6 py-3 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={() => setCurrentStep(2)}
                                disabled={selectedServices.length === 0}
                                className="px-8 py-3 bg-brand-dark text-white rounded-2xl font-bold shadow-lg shadow-brand-dark/30 hover:shadow-xl hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
                            >
                                Chọn Ngày Giờ <ChevronRightIcon className="w-4 h-4"/>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderStep2 = () => (
        <div className="max-w-4xl mx-auto animate-fadeInUp">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Card: Date Selection */}
                <div className="bg-white p-8 rounded-[2rem] shadow-soft-xl border border-gray-100 h-fit relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-brand-secondary to-transparent rounded-bl-[50%] -z-10 transition-transform group-hover:scale-110"></div>
                    
                    <h3 className="text-xl font-serif font-bold text-brand-dark mb-6 flex items-center gap-3">
                        <div className="p-2 bg-brand-secondary/50 rounded-xl text-brand-primary">
                            <CalendarIcon className="w-6 h-6" /> 
                        </div>
                        Chọn Ngày
                    </h3>

                    <div 
                        className="relative w-full cursor-pointer transition-transform hover:scale-[1.01]"
                        onClick={() => {
                            const dateInput = dateInputRef.current;
                            if (dateInput) {
                                const anyInput = dateInput as any;
                                if (typeof anyInput.showPicker === 'function') {
                                    anyInput.showPicker();
                                } else {
                                    dateInput.focus();
                                    dateInput.click();
                                }
                            }
                        }}
                    >
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                            <CalendarIcon className="w-5 h-5 text-brand-primary" />
                        </div>
                        
                        {/* Visual Display */}
                        <div className="w-full pl-12 pr-12 py-5 bg-gray-50 border-2 border-transparent group-hover:bg-gray-100 rounded-2xl font-bold text-lg text-gray-800 shadow-inner flex items-center h-[72px]">
                             {selectedDate ? formatDateDisplay(selectedDate) : <span className="text-gray-300">dd-mm-yyyy</span>}
                        </div>

                        {/* Actual Hidden Date Input */}
                        <input
                            ref={dateInputRef}
                            type="date"
                            value={selectedDate}
                            onChange={(e) => {
                                setSelectedDate(e.target.value);
                                if (e.target.value) setDateInputValue(formatDateDisplay(e.target.value));
                            }}
                            min={new Date().toISOString().split('T')[0]}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                        />
                        
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none bg-white p-1.5 rounded-full shadow-sm text-brand-primary z-10">
                            <ChevronRightIcon className="w-4 h-4" />
                        </div>
                    </div>
                    
                    {selectedDate ? (
                        <div className="mt-6 p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-3 animate-fadeIn">
                            <CheckCircleIcon className="w-5 h-5 text-green-600" />
                            <p className="text-sm font-bold text-green-800">
                                Đã chọn: {formatDateDisplay(selectedDate)}
                            </p>
                        </div>
                    ) : (
                        <p className="mt-4 text-xs text-gray-400 text-center">
                            Vui lòng chọn ngày để tiếp tục
                        </p>
                    )}
                </div>

                {/* Right Card: Time Selection */}
                <div className={`bg-white p-8 rounded-[2rem] shadow-soft-xl border border-gray-100 h-full flex flex-col relative transition-all duration-500 ${!selectedDate ? 'opacity-80' : 'opacity-100'}`}>
                     <h3 className="text-xl font-serif font-bold text-brand-dark mb-6 flex items-center gap-3">
                        <div className={`p-2 rounded-xl transition-colors ${selectedDate ? 'bg-brand-secondary/50 text-brand-primary' : 'bg-gray-100 text-gray-400'}`}>
                            <ClockIcon className="w-6 h-6" /> 
                        </div>
                        Chọn Giờ
                    </h3>

                    {!selectedDate ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-brand-secondary/30 rounded-2xl bg-brand-secondary/5">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                                <CalendarIcon className="w-8 h-8 text-brand-primary/40" />
                            </div>
                            <p className="text-brand-primary font-bold text-lg mb-1">Vui lòng chọn ngày</p>
                            <p className="text-sm text-gray-500">để xem khoảng trống</p>
                        </div>
                    ) : availableTimeSlots.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                            <ExclamationTriangleIcon className="w-10 h-10 text-gray-300 mb-2" />
                            <p className="text-gray-500 font-medium">Không còn giờ trống cho ngày này.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-3 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar animate-fadeIn">
                            {availableTimeSlots.map((time, idx) => {
                                const isBooked = isTimeSlotBooked(time);
                                const isBlocked = isTimeSlotBlocked(time);
                                const isValidGap = isTimeSlotValidForMinimumGap(time);
                                const isDisabled = isBooked || isBlocked || !isValidGap;
                                const isSelected = selectedTime === time;
                                
                                // Determine tooltip/reason for disabled state
                                let disabledReason = '';
                                if (isBooked) {
                                    disabledReason = 'Đã được đặt';
                                } else if (isBlocked) {
                                    disabledReason = 'Trùng với lịch đã đặt';
                                } else if (!isValidGap) {
                                    disabledReason = 'Phải cách lịch đã đặt ít nhất 1 giờ (chỉ giờ tròn)';
                                }
                                
                                return (
                                    <button
                                        key={time}
                                        onClick={() => !isDisabled && setSelectedTime(time)}
                                        disabled={isDisabled}
                                        title={isDisabled ? disabledReason : ''}
                                        style={{ animationDelay: `${idx * 50}ms` }}
                                        className={`
                                            py-3 rounded-xl text-sm font-bold transition-all duration-300 relative overflow-hidden animate-fadeInUp
                                            ${isDisabled 
                                                ? 'bg-gray-50 text-gray-300 cursor-not-allowed border border-gray-100' 
                                                : isSelected
                                                    ? 'bg-gradient-to-br from-brand-primary to-rose-500 text-white shadow-lg shadow-brand-primary/40 scale-105 z-10 border-transparent'
                                                    : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-primary hover:text-brand-primary hover:shadow-md'
                                            }
                                        `}
                                    >
                                        {time}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                     {/* Scroll indicator if needed, simpler UI for now */}
                     {selectedDate && availableTimeSlots.length > 0 && (
                         <div className="mt-4 text-center">
                            <div className="w-8 h-1 bg-gray-200 rounded-full mx-auto"></div>
                         </div>
                     )}
                </div>
            </div>

            <div className="flex justify-between mt-12 items-center">
                <button
                    onClick={() => setCurrentStep(1)}
                    className="px-8 py-4 bg-white border-2 border-gray-200 text-gray-600 rounded-2xl hover:bg-gray-50 font-bold transition-colors shadow-sm"
                >
                    Quay lại
                </button>
                <button
                    onClick={() => setCurrentStep(3)}
                    disabled={!selectedDate || !selectedTime}
                    className="group px-10 py-4 bg-brand-dark text-white rounded-2xl hover:bg-brand-primary disabled:bg-gray-300 disabled:cursor-not-allowed font-bold shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center gap-3"
                >
                    Tiếp theo 
                    <span className="bg-white/20 rounded-full p-1 group-hover:translate-x-1 transition-transform">
                        <ChevronRightIcon className="w-4 h-4"/>
                    </span>
                </button>
            </div>
        </div>
    );

    const renderStep3 = () => {
        const servicesTotal = selectedServices.reduce((sum, { service, quantity }) => sum + ((service.discountPrice || service.price) * quantity), 0);
        const discount = selectedPromotion ? 
            (selectedPromotion.discountType === 'percentage' 
                ? servicesTotal * (selectedPromotion.discountValue / 100)
                : selectedPromotion.discountValue
            ) : 0;
        const total = Math.max(0, servicesTotal - discount);

        console.log('📋 Step 3 - Calculation:', {
            servicesTotal,
            selectedPromotion: selectedPromotion ? {
                code: selectedPromotion.code,
                title: selectedPromotion.title,
                discountType: selectedPromotion.discountType,
                discountValue: selectedPromotion.discountValue
            } : null,
            discount,
            total
        });

        return (
            <div className="max-w-2xl mx-auto animate-fadeInUp">
                
                {/* Ticket Card */}
                <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100 relative">
                    {/* Top Decorative Pattern */}
                    <div className="h-3 bg-gradient-to-r from-brand-primary via-rose-400 to-brand-accent"></div>
                    
                    <div className="p-8 pb-0">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-serif font-bold text-brand-dark">Phiếu Đặt Hẹn</h2>
                            <p className="text-gray-400 text-sm mt-1 font-medium uppercase tracking-widest">Anh Thơ Spa</p>
                        </div>

                        {/* Date & Time Highlight */}
                        <div className="flex justify-center gap-6 mb-8">
                            <div className="bg-gray-50 px-6 py-3 rounded-2xl text-center border border-gray-100">
                                <p className="text-xs text-gray-400 font-bold uppercase">Ngày</p>
                                <p className="text-xl font-black text-brand-dark">{formatDateDisplay(selectedDate)}</p>
                            </div>
                            <div className="bg-gray-50 px-6 py-3 rounded-2xl text-center border border-gray-100">
                                <p className="text-xs text-gray-400 font-bold uppercase">Giờ</p>
                                <p className="text-xl font-black text-brand-primary">{selectedTime}</p>
                            </div>
                        </div>

                        {/* Services List */}
                        <div className="space-y-4 mb-8">
                            {selectedServices.map(({ service, quantity }) => (
                                <div key={service.id} className="flex justify-between items-center pb-4 border-b border-dashed border-gray-200 last:border-0">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-gray-100 p-2 rounded-xl text-gray-500 font-bold text-xs">x{quantity}</div>
                                        <div>
                                            <p className="font-bold text-gray-800">{service.name}</p>
                                            <p className="text-xs text-gray-500">{service.duration} phút</p>
                                        </div>
                                    </div>
                                    <p className="font-bold text-gray-700">{formatPrice((service.discountPrice || service.price) * quantity)}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Ticket Cutout Effect */}
                    <div className="relative h-8 bg-white w-full flex items-center justify-between">
                        <div className="w-4 h-8 bg-gray-50 rounded-r-full"></div>
                        <div className="flex-1 border-b-2 border-dashed border-gray-200 mx-4"></div>
                        <div className="w-4 h-8 bg-gray-50 rounded-l-full"></div>
                    </div>

                    {/* Bottom Section */}
                    <div className="p-8 pt-4 bg-gray-50/50">
                        
                        {/* Promo Code - COMBOBOX style */}
                        <div className="mb-6">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Ưu đãi</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                                    <GiftIcon className="w-5 h-5 text-brand-primary" />
                                </div>
                                <select
                                    value={promoCode}
                                    onChange={async (e) => {
                                        const code = e.target.value;
                                        setPromoCode(code);
                                        
                                        if (!code) {
                                            // User selected "-- Chọn mã ưu đãi --" (empty option)
                                            setSelectedPromotion(null);
                                            return;
                                        }
                                        
                                        // Tìm trong cả promotions, applicablePromotions và redeemedVouchers
                                        const promo = redeemedVouchers.find((v: any) => 
                                            v.code && code && 
                                            v.code.toUpperCase().trim() === code.toUpperCase().trim() &&
                                            v.redeemedCount > 0
                                        ) || applicablePromotions.find(p => 
                                            p.code && code && 
                                            p.code.toUpperCase().trim() === code.toUpperCase().trim()
                                        ) || promotions.find(p => 
                                            p.code && code && 
                                            p.code.toUpperCase().trim() === code.toUpperCase().trim() &&
                                            (p.isPublic === true || p.isPublic === 1 || p.isPublic === '1')
                                        );
                                        console.log('🎫 Voucher selected:', { code, found: !!promo, promo });
                                        
                                        if (promo) {
                                            // Check if redeemed voucher still has available count
                                            const redeemedVoucher = redeemedVouchers.find((v: any) => 
                                                v.code && code && 
                                                v.code.toUpperCase().trim() === code.toUpperCase().trim()
                                            );
                                            if (redeemedVoucher && (!redeemedVoucher.redeemedCount || redeemedVoucher.redeemedCount <= 0)) {
                                                alert('Bạn đã sử dụng hết voucher này');
                                                setPromoCode('');
                                                return;
                                            }
                                            
                                            // Validate voucher with backend immediately
                                            // QUAN TRỌNG: Chỉ validate, KHÔNG trừ voucher. Voucher sẽ chỉ được trừ khi đặt lịch thành công
                                            try {
                                                const selectedServiceId = selectedServices.length > 0 ? selectedServices[0].service.id : undefined;
                                                console.log('🔍 [VOUCHER SELECTION] Validating voucher (NOT deducting yet):', {
                                                    code,
                                                    userId: currentUser?.id,
                                                    serviceId: selectedServiceId
                                                });
                                                await apiService.applyPromotion(code, currentUser?.id, undefined, selectedServiceId);
                                                // Validation successful, apply the promotion
                                                console.log('✅ [VOUCHER SELECTION] Validation passed - voucher selected but NOT deducted yet');
                                                setSelectedPromotion(promo);
                                                // KHÔNG reload redeemedVouchers ở đây - voucher chỉ được trừ khi đặt lịch thành công
                                            } catch (error: any) {
                                                // Validation failed, show error and reset
                                                console.error('❌ Voucher validation failed:', error);
                                                setSelectedPromotion(null);
                                                setPromoCode('');
                                                alert(error.message || 'Voucher không khả dụng');
                                            }
                                        } else {
                                            // Voucher not found or not active - reset selection
                                            setSelectedPromotion(null);
                                            setPromoCode('');
                                            alert('Mã voucher không hợp lệ hoặc không khả dụng');
                                        }
                                    }}
                                    className="appearance-none w-full pl-10 pr-10 py-3.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary font-medium text-gray-700 shadow-sm hover:border-brand-primary/50 transition-all cursor-pointer"
                                >
                                    <option value="">-- Chọn mã ưu đãi --</option>
                                    {/* HIỂN THỊ CẢ VOUCHER PUBLIC VÀ VOUCHER ĐỔI ĐIỂM - CHỈ HIỂN THỊ VOUCHER PHÙ HỢP VỚI ĐIỀU KIỆN */}
                                    {(() => {
                                        const today = new Date();
                                        today.setHours(0, 0, 0, 0);
                                        const selectedServiceIds = selectedServices.map(s => s.service.id);
                                        
                                        // Tính tổng giá trị đơn hàng hiện tại
                                        const currentOrderTotal = selectedServices.reduce(
                                            (sum, { service, quantity }) => sum + ((service.discountPrice || service.price) * quantity), 
                                            0
                                        );
                                        
                                        // Filter public promotions - SỬ DỤNG ĐẦY ĐỦ ĐIỀU KIỆN
                                        // Hàm isPromotionApplicable đã kiểm tra: isActive, expiryDate, stock, minOrderValue, applicableServiceIds, targetAudience
                                        const filteredPromotions = promotions.filter(p => {
                                            const isPublic = p.isPublic === true || p.isPublic === 1 || p.isPublic === '1';
                                            if (!isPublic) return false;
                                            
                                            // Sử dụng hàm isPromotionApplicable để kiểm tra đầy đủ điều kiện (bao gồm minOrderValue)
                                            return isPromotionApplicable(p);
                                        });
                                        
                                        // Filter applicable promotions - SỬ DỤNG ĐẦY ĐỦ ĐIỀU KIỆN
                                        // Hàm isPromotionApplicable đã kiểm tra: isActive, expiryDate, stock, minOrderValue, applicableServiceIds, targetAudience
                                        const filteredApplicablePromotions = applicablePromotions.filter(p => {
                                            const isPublic = p.isPublic === true || p.isPublic === 1 || p.isPublic === '1';
                                            if (!isPublic) return false;
                                            
                                            // Sử dụng hàm isPromotionApplicable để kiểm tra đầy đủ điều kiện (bao gồm minOrderValue)
                                            return isPromotionApplicable(p);
                                        });
                                        
                                        // Filter redeemed vouchers (voucher đổi điểm) - SỬ DỤNG ĐẦY ĐỦ ĐIỀU KIỆN
                                        // QUAN TRỌNG: CHỈ lấy voucher đổi điểm (isPublic = false), KHÔNG lấy voucher public
                                        const filteredRedeemedVouchers = redeemedVouchers.filter((v: any) => {
                                            // CHỈ lấy voucher đổi điểm (isPublic = false)
                                            const isPublicNormalized = v.isPublic === true || v.isPublic === 1 || v.isPublic === '1';
                                            if (isPublicNormalized) {
                                                // Loại bỏ voucher public (voucher public không bao giờ xuất hiện trong dropdown này)
                                                return false;
                                            }
                                            
                                            // Kiểm tra redeemedCount
                                            if (!v.redeemedCount || v.redeemedCount <= 0) return false;
                                            
                                            // Kiểm tra các điều kiện cơ bản
                                            if (v.isActive === false) return false;
                                            
                                            // Kiểm tra hết hạn
                                            const expiryDate = new Date(v.expiryDate);
                                            expiryDate.setHours(0, 0, 0, 0);
                                            if (today > expiryDate) return false;
                                            
                                            // Kiểm tra minOrderValue - QUAN TRỌNG
                                            if (v.minOrderValue && currentOrderTotal < v.minOrderValue) {
                                                return false; // Không hiển thị nếu đơn hàng chưa đủ giá trị tối thiểu
                                            }
                                            
                                            // Kiểm tra applicableServiceIds
                                            if (v.applicableServiceIds && v.applicableServiceIds.length > 0) {
                                                let applicableServiceIdsArray: string[] = [];
                                                if (typeof v.applicableServiceIds === 'string') {
                                                    try {
                                                        applicableServiceIdsArray = JSON.parse(v.applicableServiceIds);
                                                    } catch (e) {
                                                        applicableServiceIdsArray = [];
                                                    }
                                                } else if (Array.isArray(v.applicableServiceIds)) {
                                                    applicableServiceIdsArray = v.applicableServiceIds;
                                                }
                                                
                                                if (applicableServiceIdsArray.length > 0) {
                                                    const matchesService = selectedServiceIds.some(serviceId => 
                                                        applicableServiceIdsArray.includes(serviceId)
                                                    );
                                                    if (!matchesService) return false;
                                                }
                                            }
                                            
                                            return true;
                                        });
                                        
                                        // Combine all lists
                                        const allAvailablePromotions = [
                                            ...filteredApplicablePromotions,
                                            ...filteredPromotions.filter(p => {
                                                return !filteredApplicablePromotions.some(ap => ap.id === p.id || ap.code === p.code);
                                            }),
                                            ...filteredRedeemedVouchers
                                        ];
                                        
                                        // Remove duplicates by code
                                        const uniquePromotionsMap = new Map<string, Promotion>();
                                        filteredApplicablePromotions.forEach(p => {
                                            if (p.code) uniquePromotionsMap.set(p.code, p);
                                        });
                                        [...filteredPromotions, ...filteredRedeemedVouchers].forEach(p => {
                                            if (p.code && !uniquePromotionsMap.has(p.code)) {
                                                uniquePromotionsMap.set(p.code, p);
                                            }
                                        });
                                        const uniquePromotions = Array.from(uniquePromotionsMap.values());

                                        if (uniquePromotions.length === 0) {
                                            return (
                                                <option value="" disabled>Không có mã ưu đãi khả dụng</option>
                                            );
                                        }

                                        return uniquePromotions.map((promo: any) => {
                                            // CHỈ hiển thị "[Voucher đã đổi]" cho voucher đổi điểm (isPublic = false)
                                            const isPublicNormalized = promo.isPublic === true || promo.isPublic === 1 || promo.isPublic === '1';
                                            const isRedeemedVoucher = !isPublicNormalized;
                                            
                                            // Chỉ hiển thị text "[Voucher đã đổi]" cho voucher đổi điểm có redeemedCount
                                            const showRedeemedText = isRedeemedVoucher && promo.redeemedCount && promo.redeemedCount > 0;
                                            
                                            return (
                                                <option key={promo.id} value={promo.code}>
                                                    {promo.code} - {promo.title} 
                                                    {promo.discountType === 'percentage' 
                                                        ? ` (Giảm ${promo.discountValue}%)` 
                                                        : ` (Giảm ${formatPrice(promo.discountValue)})`}
                                                    {promo.minOrderValue ? ` (Đơn tối thiểu: ${formatPrice(promo.minOrderValue)})` : ''}
                                                    {showRedeemedText && promo.redeemedCount > 1 ? ` [Bạn có ${promo.redeemedCount} voucher]` : showRedeemedText ? ' [Voucher đã đổi]' : ''}
                                                </option>
                                            );
                                        });
                                    })()}
                                </select>
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <ChevronRightIcon className="w-5 h-5 text-gray-400 rotate-90" />
                                </div>
                            </div>
                            
                            {selectedPromotion && (
                                <div className="mt-3 flex items-center justify-between bg-green-50 border border-green-100 px-4 py-2 rounded-lg animate-fadeIn">
                                    <div className="flex items-center gap-2 text-green-700">
                                        <CheckCircleIcon className="w-4 h-4" />
                                        <span className="text-xs font-bold">Đã áp dụng: {selectedPromotion.title}</span>
                                    </div>
                                    <button 
                                        onClick={() => {setSelectedPromotion(null); setPromoCode('');}} 
                                        className="text-red-500 hover:text-red-700 text-lg leading-none px-2"
                                        title="Hủy áp dụng"
                                    >
                                        &times;
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Totals */}
                        <div className="space-y-2 mb-6">
                            <div className="flex justify-between text-sm text-gray-500">
                                <span>Tạm tính</span>
                                <span>{formatPrice(servicesTotal)}</span>
                            </div>
                            {discount > 0 && (
                                <div className="flex justify-between text-sm text-green-600 font-medium">
                                    <span>Giảm giá</span>
                                    <span>-{formatPrice(discount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                                <span className="text-lg font-bold text-gray-800">Tổng thanh toán</span>
                                <span className="text-3xl font-black text-brand-primary">{formatPrice(total)}</span>
                            </div>
                        </div>

                        <button
                            onClick={handleConfirmBooking}
                            className="w-full py-4 bg-gradient-to-r from-brand-dark to-brand-primary text-white rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                        >
                            Xác Nhận & Thanh Toán
                        </button>
                        <button onClick={() => setCurrentStep(2)} className="w-full mt-3 text-gray-500 hover:text-brand-primary font-semibold text-sm">
                            Quay lại bước trước
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderPaymentModal = () => {
        if (!isPaymentModalOpen) return null;

        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl transform transition-all scale-100">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CurrencyDollarIcon className="w-8 h-8 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-serif font-bold text-gray-800">Phương Thức Thanh Toán</h2>
                        <p className="text-gray-500 mt-2 text-sm">Vui lòng chọn cách thức bạn muốn thanh toán</p>
                    </div>
                    
                    <div className="space-y-4 mb-8">
                        <button
                            onClick={() => setPaymentMethod('VNPay')}
                            className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all duration-300 ${
                                paymentMethod === 'VNPay' 
                                ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' 
                                : 'border-gray-100 hover:border-blue-200 hover:bg-gray-50'
                            }`}
                        >
                            <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center p-1">
                                <VNPayIcon className="w-full h-full" />
                            </div>
                            <div className="text-left">
                                <span className="block font-bold text-gray-800">Ví VNPay</span>
                                <span className="block text-xs text-gray-500">Quét mã QR tiện lợi</span>
                            </div>
                            {paymentMethod === 'VNPay' && <CheckCircleIcon className="w-6 h-6 text-blue-500 ml-auto" />}
                        </button>
                        
                        <button
                            onClick={() => setPaymentMethod('Cash')}
                            className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all duration-300 ${
                                paymentMethod === 'Cash' 
                                ? 'border-green-500 bg-green-50 ring-1 ring-green-500' 
                                : 'border-gray-100 hover:border-green-200 hover:bg-gray-50'
                            }`}
                        >
                            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
                                💵
                            </div>
                            <div className="text-left">
                                <span className="block font-bold text-gray-800">Thanh toán tại quầy</span>
                                <span className="block text-xs text-gray-500">Tiền mặt hoặc thẻ sau khi làm</span>
                            </div>
                            {paymentMethod === 'Cash' && <CheckCircleIcon className="w-6 h-6 text-green-500 ml-auto" />}
                        </button>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => setIsPaymentModalOpen(false)}
                            className="flex-1 py-3.5 rounded-xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-colors"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleProcessPayment}
                            className="flex-1 py-3.5 rounded-xl bg-brand-primary text-white font-bold hover:bg-brand-dark shadow-lg transition-all hover:-translate-y-0.5"
                        >
                            Hoàn Tất
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 font-sans">
            <div className="container mx-auto px-4 lg:px-8 max-w-6xl">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-serif font-bold text-brand-dark mb-3">Đặt Lịch Hẹn</h1>
                    <p className="text-gray-500 font-medium">Chỉ vài bước đơn giản để tận hưởng dịch vụ đẳng cấp.</p>
                </div>
                
                {renderStepIndicator()}
                
                <div className="mt-12 transition-all duration-500 ease-in-out">
                    {currentStep === 1 && renderStep1()}
                    {currentStep === 2 && renderStep2()}
                    {currentStep === 3 && renderStep3()}
                </div>

                {renderPaymentModal()}
            </div>
        </div>
    );
};export default BookingPage;