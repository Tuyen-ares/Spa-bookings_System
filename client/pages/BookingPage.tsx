import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { AVAILABLE_TIMES } from '../../constants';
import type { Service, User, Appointment, PaymentMethod, Promotion } from '../../types';
import { StarIcon, CreditCardIcon, MomoIcon, VNPayIcon, ZaloPayIcon, CheckCircleIcon, PlusIcon, TrashIcon, CurrencyDollarIcon } from '../../shared/icons';
import * as apiService from '../services/apiService';

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

interface BookingPageProps {
    currentUser: User | null;
}

export const BookingPage: React.FC<BookingPageProps> = ({ currentUser }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const initialServiceId = queryParams.get('serviceId');
    const initialPromoCode = queryParams.get('promoCode') || '';

    const [allServices, setAllServices] = useState<Service[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [allPromotions, setAllPromotions] = useState<Promotion[]>([]);

    const [currentStep, setCurrentStep] = useState(1);
    const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(initialServiceId ? [initialServiceId] : []);
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [selectedTime, setSelectedTime] = useState<string>('');
    const [selectedTherapistId, setSelectedTherapistId] = useState<string>('any');

    const [paymentModalState, setPaymentModalState] = useState<{
        isOpen: boolean;
        appointments: Appointment[];
        finalPrice: number;
        status: 'selecting' | 'processing' | 'success' | 'at_counter';
    }>({
        isOpen: false,
        appointments: [],
        finalPrice: 0,
        status: 'selecting',
    });

    const [promoCode, setPromoCode] = useState(initialPromoCode);
    const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount: number } | null>(null);
    const [promoError, setPromoError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [servicesData, usersData, promotionsData] = await Promise.all([
                    apiService.getServices(),
                    apiService.getUsers(),
                    apiService.getPromotions()
                ]);

                setAllServices(servicesData.filter(s => s.isActive));
                setAllUsers(usersData);
                setAllPromotions(promotionsData);
            } catch (error) { console.error("Failed to fetch booking data:", error); }
        };
        fetchData();
    }, []);
    
    // Automatically apply promo code from URL when services and promotions are loaded
    useEffect(() => {
        if (initialPromoCode && selectedServiceIds.length > 0 && allPromotions.length > 0) {
            handleApplyPromo();
        }
    }, [initialPromoCode, selectedServiceIds, allPromotions]);


    const steps = ["Chọn Dịch Vụ", "Chọn Thời Gian", "Xác Nhận"];

    // Memoized calculations for selected services
    const selectedServices = useMemo(() => allServices.filter(s => selectedServiceIds.includes(s.id)), [allServices, selectedServiceIds]);
    const totalDuration = useMemo(() => selectedServices.reduce((total, s) => total + s.duration, 0), [selectedServices]);
    const subtotal = useMemo(() => selectedServices.reduce((total, s) => total + (s.discountPrice || s.price), 0), [selectedServices]);
    const finalPrice = useMemo(() => Math.max(0, subtotal - (appliedPromo?.discount || 0)), [subtotal, appliedPromo]);

    const handleAddService = (serviceId: string) => {
        if (!selectedServiceIds.includes(serviceId)) {
            setSelectedServiceIds(prev => [...prev, serviceId]);
        }
    };
    const handleRemoveService = (serviceId: string) => {
        setSelectedServiceIds(prev => prev.filter(id => id !== serviceId));
    };

    const handleNextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length));
    const handlePrevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));
    
    const handleApplyPromo = () => {
        setPromoError('');
        setAppliedPromo(null);
        if (!promoCode.trim() || selectedServices.length === 0) return;

        const promotion = allPromotions.find(p => p.code.toUpperCase() === promoCode.toUpperCase());

        if (!promotion) { setPromoError('Mã giảm giá không hợp lệ.'); return; }
        if (new Date(promotion.expiryDate) < new Date()) { setPromoError('Mã giảm giá đã hết hạn.'); return; }
        
        const applicableServices = (promotion.applicableServiceIds && promotion.applicableServiceIds.length > 0)
            ? selectedServices.filter(s => promotion.applicableServiceIds!.includes(s.id))
            : selectedServices;
            
        if (applicableServices.length === 0) { setPromoError('Mã không áp dụng cho (các) dịch vụ đã chọn.'); return; }
        
        const applicableSubtotal = applicableServices.reduce((sum, s) => sum + (s.discountPrice || s.price), 0);
        
        if (promotion.minOrderValue && subtotal < promotion.minOrderValue) { setPromoError(`Đơn hàng tối thiểu để áp dụng mã này là ${formatPrice(promotion.minOrderValue)}.`); return; }

        let calculatedDiscount = 0;
        if (promotion.discountType === 'percentage') {
            calculatedDiscount = (applicableSubtotal * promotion.discountValue) / 100;
        } else {
            calculatedDiscount = promotion.discountValue;
        }
        
        calculatedDiscount = Math.min(calculatedDiscount, applicableSubtotal);
        setAppliedPromo({ code: promotion.code, discount: calculatedDiscount });
    };

    const handleBookingSubmit = async () => {
        if (!currentUser || selectedServices.length === 0 || !selectedDate || !selectedTime) {
            alert('Vui lòng điền đầy đủ thông tin.');
            return;
        }

        const bookingGroupId = `booking-${uuidv4()}`;
        const createdAppointments: Appointment[] = [];
        let appointmentStartTime = new Date(`${selectedDate}T${selectedTime}`);

        // Sort services to ensure consistent order, although not strictly necessary
        const sortedSelectedServices = [...selectedServices].sort((a,b) => a.name.localeCompare(b.name));

        try {
            for (const service of sortedSelectedServices) {
                const appointmentTime = appointmentStartTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                
                const newAppointment = {
                    serviceId: service.id, serviceName: service.name, userId: currentUser.id, date: selectedDate, time: appointmentTime,
                    therapistId: selectedTherapistId === 'any' ? undefined : selectedTherapistId,
                    therapist: allUsers.find(t => t.id === selectedTherapistId)?.name,
                    bookingGroupId,
                };
                // In a real app with a backend, we might send the whole group at once.
                // Here we create them one by one.
                const created = await apiService.createAppointment(newAppointment);
                createdAppointments.push(created);
                appointmentStartTime.setMinutes(appointmentStartTime.getMinutes() + service.duration);
            }
            setPaymentModalState({ isOpen: true, appointments: createdAppointments, finalPrice, status: 'selecting' });
        } catch (error) {
            console.error('Error creating appointments:', error);
            alert('Đặt lịch thất bại. Vui lòng thử lại.');
        }
    };
    
    const handleClosePaymentModal = (navigateToList: boolean) => {
        setPaymentModalState({ isOpen: false, appointments: [], finalPrice: 0, status: 'selecting' });
        // Reset state for a new booking
        setCurrentStep(1);
        setSelectedServiceIds([]);
        setSelectedDate('');
        setSelectedTime('');
        setSelectedTherapistId('any');
        setPromoCode('');
        setAppliedPromo(null);
        setPromoError('');
        if (navigateToList) {
            navigate('/appointments');
        }
    };

    const handleProcessOnlinePayment = async (method: PaymentMethod) => {
        if (paymentModalState.appointments.length === 0) return;
        setPaymentModalState(prev => ({ ...prev, status: 'processing' }));
        try {
            // The API service uses the first appointment's ID to find the booking group
            await apiService.processPayment(paymentModalState.appointments[0].id, method, paymentModalState.finalPrice);
            setPaymentModalState(prev => ({ ...prev, status: 'success' }));
        } catch (error) {
            console.error("Payment failed:", error);
            alert("Thanh toán thất bại.");
            setPaymentModalState(prev => ({ ...prev, status: 'selecting' }));
        }
    };
    
    const handlePayAtCounter = async () => {
         if (paymentModalState.appointments.length === 0) return;
        setPaymentModalState(prev => ({ ...prev, status: 'processing' }));
        // Simulate a short delay
        await new Promise(resolve => setTimeout(resolve, 500));
        // No payment record is created, just confirm the booking
        setPaymentModalState(prev => ({ ...prev, status: 'at_counter' }));
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 1: return <StepSelectService services={allServices} selectedIds={selectedServiceIds} onAdd={handleAddService} onRemove={handleRemoveService} />;
            case 2: return <StepSelectTimeAndTherapist selectedDate={selectedDate} setSelectedDate={setSelectedDate} selectedTime={selectedTime} setSelectedTime={setSelectedTime} totalDuration={totalDuration} allUsers={allUsers} selectedTherapistId={selectedTherapistId} onSelectTherapist={setSelectedTherapistId} selectedServices={selectedServices} />;
            case 3: return <StepConfirm promoCode={promoCode} setPromoCode={setPromoCode} appliedPromo={appliedPromo} promoError={promoError} onApplyPromo={handleApplyPromo} />;
            default: return null;
        }
    };
    
    return (
        <div className="container mx-auto px-4 py-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-8 rounded-lg shadow-2xl border-t-4 border-brand-primary">
                    <h1 className="text-3xl font-serif font-bold text-brand-dark text-center mb-8">Đặt Lịch Hẹn</h1>
                    <div className="flex items-center justify-between mb-8">
                        {steps.map((step, index) => (
                            <React.Fragment key={index}>
                                <div className="flex flex-col items-center text-center">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors duration-300 ${index + 1 <= currentStep ? 'bg-brand-primary text-white' : 'bg-gray-200 text-gray-500'}`}>{index + 1}</div>
                                    <span className={`mt-2 text-xs sm:text-sm font-semibold ${index + 1 <= currentStep ? 'text-brand-dark' : 'text-gray-400'}`}>{step}</span>
                                </div>
                                {index < steps.length - 1 && <div className={`flex-1 h-1 mx-2 transition-colors duration-300 ${index + 1 < currentStep ? 'bg-brand-primary' : 'bg-gray-200'}`}></div>}
                            </React.Fragment>
                        ))}
                    </div>

                    <div className="min-h-[300px]">{renderStepContent()}</div>
                    
                    <div className="flex justify-between mt-8 border-t pt-6">
                        <button onClick={handlePrevStep} disabled={currentStep === 1} className="px-6 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 disabled:opacity-50">Quay lại</button>
                        {currentStep < steps.length ? (
                            <button onClick={handleNextStep} disabled={(currentStep === 1 && selectedServiceIds.length === 0) || (currentStep === 2 && (!selectedDate || !selectedTime))} className="px-6 py-2 bg-brand-primary text-white font-semibold rounded-lg hover:bg-brand-dark disabled:opacity-50">Tiếp theo</button>
                        ) : (
                            <button onClick={handleBookingSubmit} className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700">Xác nhận & Đặt lịch</button>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <BookingSummary selectedServices={selectedServices} onRemoveService={handleRemoveService} subtotal={subtotal} appliedPromo={appliedPromo} finalPrice={finalPrice} isActionable={currentStep === 1}/>
                </div>
            </div>

            {paymentModalState.isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-8 rounded-lg shadow-xl max-w-lg w-full transform transition-all animate-fadeIn" onClick={(e) => e.stopPropagation()}>
                        {paymentModalState.status === 'selecting' && (
                             <>
                                <h2 className="text-2xl font-bold text-brand-dark mb-4">Hoàn tất Đặt lịch</h2>
                                <p className="text-gray-600 mb-6">Bạn có muốn thanh toán ngay để được ưu tiên xử lý lịch hẹn không?</p>
                                <div className="bg-gray-50 p-4 rounded-md mb-6 text-sm">
                                    <p><strong>Dịch vụ:</strong> {paymentModalState.appointments.map(a => a.serviceName).join(', ')}</p>
                                    <p className="font-bold text-lg mt-2">Tổng cộng: <span className="text-brand-primary">{formatPrice(paymentModalState.finalPrice)}</span></p>
                                </div>
                                <h3 className="font-semibold text-gray-700 mb-3">Chọn phương thức thanh toán Online:</h3>
                                <div className="space-y-2">
                                    <button onClick={() => handleProcessOnlinePayment('Card')} className="w-full text-left p-4 border rounded-lg hover:bg-gray-100 flex items-center gap-3"><CreditCardIcon className="w-6 h-6 text-blue-600" /> Thẻ Tín dụng / Ghi nợ</button>
                                    <button onClick={() => handleProcessOnlinePayment('Momo')} className="w-full text-left p-4 border rounded-lg hover:bg-gray-100 flex items-center gap-3"><MomoIcon className="w-6 h-6" /> Ví Momo</button>
                                    <button onClick={() => handleProcessOnlinePayment('VNPay')} className="w-full text-left p-4 border rounded-lg hover:bg-gray-100 flex items-center gap-3"><VNPayIcon className="w-6 h-6" /> VNPay</button>
                                    <button onClick={() => handleProcessOnlinePayment('ZaloPay')} className="w-full text-left p-4 border rounded-lg hover:bg-gray-100 flex items-center gap-3"><ZaloPayIcon className="w-6 h-6" /> ZaloPay</button>
                                </div>
                                <div className="relative my-4 text-center">
                                    <div className="absolute inset-y-1/2 left-0 w-full h-px bg-gray-200"></div>
                                    <span className="relative text-sm text-gray-500 bg-white px-2">hoặc</span>
                                </div>
                                <button onClick={handlePayAtCounter} className="w-full p-4 border rounded-lg hover:bg-gray-100 flex items-center gap-3 text-lg font-semibold text-brand-dark"><CurrencyDollarIcon className="w-6 h-6" /> Thanh toán tại quầy</button>
                             </>
                        )}
                        {paymentModalState.status === 'processing' && (<div className="text-center"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-primary mx-auto"></div><h2 className="text-2xl font-bold text-brand-dark mt-4">Đang xử lý...</h2></div>)}
                        {(paymentModalState.status === 'success' || paymentModalState.status === 'at_counter') && (
                            <div className="text-center">
                                <CheckCircleIcon className="mx-auto mb-4 w-16 h-16 text-green-500" />
                                <h2 className="text-2xl font-bold text-brand-dark mb-4">Đặt lịch thành công!</h2>
                                {paymentModalState.status === 'at_counter' && <p className="text-md text-brand-text mb-6">Lịch hẹn của bạn đã được ghi nhận và đang chờ xác nhận. Vui lòng thanh toán tại quầy.</p>}
                                {paymentModalState.status === 'success' && <p className="text-md text-brand-text mb-6">Thanh toán thành công. Lịch hẹn của bạn đã được ưu tiên và đang chờ xác nhận.</p>}
                                <div className="flex flex-col sm:flex-row justify-center gap-4">
                                    <button onClick={() => handleClosePaymentModal(false)} className="w-full sm:w-auto bg-brand-primary text-white font-bold py-3 px-6 rounded-lg hover:bg-brand-dark">Đặt lịch mới</button>
                                    <button onClick={() => handleClosePaymentModal(true)} className="w-full sm:w-auto bg-gray-200 text-gray-800 font-bold py-3 px-6 rounded-lg hover:bg-gray-300">Xem lịch hẹn</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Sub-components & Sections ---

const BookingSummary: React.FC<{ selectedServices: Service[], onRemoveService: (id: string) => void, subtotal: number, appliedPromo: { code: string, discount: number } | null, finalPrice: number, isActionable: boolean }> = ({ selectedServices, onRemoveService, subtotal, appliedPromo, finalPrice, isActionable }) => {
    const totalDuration = useMemo(() => selectedServices.reduce((total, s) => total + s.duration, 0), [selectedServices]);

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg sticky top-28">
            <h3 className="text-xl font-bold text-brand-dark border-b pb-3 mb-4">Tóm tắt Lịch hẹn</h3>
            {selectedServices.length > 0 ? (
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2 mb-4">
                    {selectedServices.map(s => (
                        <div key={s.id} className="flex justify-between items-start text-sm">
                            <div>
                                <p className="font-semibold text-gray-800">{s.name}</p>
                                <p className="text-xs text-gray-500">{s.duration} phút</p>
                            </div>
                            <div className="text-right flex items-center gap-2">
                                <p className="font-semibold text-brand-dark">{formatPrice(s.discountPrice || s.price)}</p>
                                {isActionable && <button onClick={() => onRemoveService(s.id)} className="text-red-500 hover:text-red-700"><TrashIcon className="w-4 h-4"/></button>}
                            </div>
                        </div>
                    ))}
                </div>
            ) : <p className="text-sm text-gray-500 text-center py-8">Vui lòng chọn dịch vụ để bắt đầu.</p>}
            
            <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-gray-600">Tổng thời gian:</span><span className="font-semibold text-gray-800">{totalDuration} phút</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-600">Tạm tính:</span><span className="font-semibold text-gray-800">{formatPrice(subtotal)}</span></div>
                {appliedPromo && <div className="flex justify-between text-sm text-green-600"><span >Giảm giá ({appliedPromo.code}):</span><span className="font-semibold">-{formatPrice(appliedPromo.discount)}</span></div>}
                <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2"><span className="text-brand-dark">Tổng cộng:</span><span className="text-brand-primary">{formatPrice(finalPrice)}</span></div>
            </div>
        </div>
    );
};

const StepSelectService: React.FC<{ services: Service[], selectedIds: string[], onAdd: (id: string) => void, onRemove: (id: string) => void }> = ({ services, selectedIds, onAdd }) => {
    const [search, setSearch] = useState('');
    const filteredServices = services.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm kiếm dịch vụ..." className="w-full p-3 border rounded-lg mb-4" />
            <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
                {filteredServices.map(s => (
                    <div key={s.id} className={`p-4 border rounded-lg flex justify-between items-center transition-colors ${selectedIds.includes(s.id) ? 'bg-green-50 border-green-300' : ''}`}>
                        <div>
                            <h4 className="font-bold text-brand-dark">{s.name}</h4>
                            <p className="text-sm text-gray-500">{s.description}</p>
                            <span className="text-sm font-semibold text-brand-primary">{formatPrice(s.discountPrice || s.price)}</span>
                        </div>
                        <button onClick={() => onAdd(s.id)} disabled={selectedIds.includes(s.id)} className="p-2 bg-brand-secondary text-brand-dark rounded-full hover:bg-brand-primary hover:text-white disabled:bg-gray-200 disabled:cursor-not-allowed">
                            {selectedIds.includes(s.id) ? <CheckCircleIcon className="w-5 h-5 text-green-500"/> : <PlusIcon className="w-5 h-5"/>}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

const StepSelectTimeAndTherapist: React.FC<{ selectedDate: string, setSelectedDate: (d: string) => void, selectedTime: string, setSelectedTime: (t: string) => void, totalDuration: number, allUsers: User[], selectedTherapistId: string, onSelectTherapist: (id: string) => void, selectedServices: Service[] }> = (props) => {
    const { selectedDate, setSelectedDate, selectedTime, setSelectedTime, totalDuration, allUsers, selectedTherapistId, onSelectTherapist, selectedServices } = props;
    const today = new Date().toISOString().split('T')[0];
    
    const getTimeSlotStatus = (time: string) => {
        if (!selectedDate) return 'disabled';
        const now = new Date();
        const slotDateTime = new Date(`${selectedDate}T${time}`);
        if(slotDateTime < now) return 'disabled'; // Disable past slots
        // Simple mock logic: just mark some slots as full for demonstration
        return (parseInt(time.split(':')[0]) % 4 === 0) ? 'full' : 'available';
    };

    const therapists = useMemo(() => {
        // FIX: Correctly filter for 'Staff' role and then check the 'staffRole' within the profile.
        const staff = allUsers.filter(u => u.role === 'Staff' && u.staffProfile && ['Technician', 'Manager'].includes(u.staffProfile.staffRole));
        // The 'any' object is not a full User, but we handle it in filter/render logic.
        return [{ id: 'any', name: 'Bất kỳ chuyên viên nào', profilePictureUrl: '/img/general/any-therapist.jpg' } as any, ...staff];
    }, [allUsers]);

    const filteredTherapists = useMemo(() => {
        if (selectedServices.length === 0) return therapists;
        const requiredCategories = [...new Set(selectedServices.map(s => s.category))];
        
        // FIX: Correctly access 'staffProfile.specialty' on User objects.
        return therapists.filter(t => {
            if (t.id === 'any') return true;
            const user = t as User;
            return user.staffProfile?.specialty && requiredCategories.every(cat => user.staffProfile!.specialty!.includes(cat));
        });
    }, [therapists, selectedServices]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
                <h4 className="font-bold text-brand-dark mb-3">Chọn Ngày & Giờ Bắt Đầu</h4>
                <div className="mb-4">
                    <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} min={today} className="w-full p-2 border rounded-md"/>
                </div>
                {selectedDate && <p className="text-sm text-gray-500 mb-2">Tổng thời gian liệu trình: {totalDuration} phút.</p>}
                <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                    {AVAILABLE_TIMES.map(time => {
                        const status = getTimeSlotStatus(time);
                        return <button key={time} onClick={() => setSelectedTime(time)} disabled={status !== 'available'} className={`p-3 rounded-lg font-semibold transition-colors disabled:opacity-50 ${selectedTime === time ? 'bg-brand-primary text-white' : status === 'available' ? 'bg-green-100 hover:bg-green-200' : 'bg-gray-200'}`}>{time}</button>;
                    })}
                </div>
            </div>
            <div>
                <h4 className="font-bold text-brand-dark mb-3">Chọn Chuyên viên</h4>
                <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
                    {filteredTherapists.map(t => (
                        <div key={t.id} onClick={() => onSelectTherapist(t.id)} className={`p-3 border rounded-lg cursor-pointer flex items-center gap-3 transition-all ${selectedTherapistId === t.id ? 'border-brand-primary ring-2 ring-brand-primary' : 'hover:border-brand-primary/50'}`}>
                            <img src={t.profilePictureUrl} alt={t.name} className="w-12 h-12 rounded-full object-cover" />
                            <div>
                                <h5 className="font-bold text-brand-dark text-sm">{t.name}</h5>
                                {/* FIX: Correctly access 'staffProfile.specialty' for User objects. */}
                                {t.id !== 'any' && <p className="text-xs text-gray-500">{(t as User).staffProfile?.specialty?.join(', ')}</p>}
                            </div>
                        </div>
                    ))}
                    {filteredTherapists.length <= 1 && filteredTherapists.every(t => t.id === 'any') && selectedServices.length > 0 && <p className="text-xs text-orange-600 p-2 bg-orange-50 rounded">Không có KTV nào có thể thực hiện tất cả dịch vụ đã chọn. Hệ thống sẽ tự động phân công.</p>}
                </div>
            </div>
        </div>
    );
};

const StepConfirm: React.FC<{ promoCode: string, setPromoCode: (c: string) => void, appliedPromo: any, promoError: string, onApplyPromo: () => void }> = (props) => {
    const { promoCode, setPromoCode, appliedPromo, promoError, onApplyPromo } = props;
    return (
        <div className="border-t pt-4">
            <h4 className="font-bold text-brand-dark mb-4">Mã giảm giá</h4>
            <div className="flex gap-2">
                <input type="text" value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())} placeholder="Nhập mã giảm giá" className="flex-1 p-2 border rounded-lg" />
                <button onClick={onApplyPromo} className="px-4 py-2 bg-brand-secondary text-brand-dark font-semibold rounded-lg hover:bg-brand-primary hover:text-white">Áp dụng</button>
            </div>
            {promoError && <p className="text-red-500 text-xs mt-1">{promoError}</p>}
            {appliedPromo && <p className="text-green-600 text-sm mt-2">Đã áp dụng mã {appliedPromo.code} thành công!</p>}
            <p className="text-sm text-gray-600 mt-6">Vui lòng kiểm tra lại tất cả thông tin trong bảng Tóm tắt Lịch hẹn trước khi xác nhận.</p>
        </div>
    );
};
