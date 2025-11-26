
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { 
    CheckCircleIcon, 
    ArrowRightIcon, 
    HomeIcon, 
    CalendarIcon, 
    BuildingOffice2Icon, 
    CreditCardIcon,
    CurrencyDollarIcon,
    ClockIcon
} from '../../shared/icons';

const PaymentSuccessPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const [countdown, setCountdown] = useState(5);

    // Data extraction priority: Location State -> URL Params
    const transactionId = location.state?.transactionId || searchParams.get('paymentId') || searchParams.get('vnp_TxnRef') || 'Unknown';
    const amount = location.state?.amount || searchParams.get('amount') || searchParams.get('vnp_Amount');
    const rawMethod = location.state?.method || 'Online Payment';
    
    // Determine Method Type
    const isCash = rawMethod === 'Cash';
    const methodDisplay = isCash ? 'Thanh toán tại quầy' : rawMethod;

    // Handle VNPay specific amount format (VNPay returns amount * 100)
    const displayAmount = amount && searchParams.get('vnp_Amount') ? Number(amount) / 100 : Number(amount || 0);

    useEffect(() => {
        // Refresh data
        window.dispatchEvent(new CustomEvent('refresh-appointments'));
        window.dispatchEvent(new Event('refresh-vouchers'));
        
        // Countdown timer
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    navigate('/appointments');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [navigate]);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    // Configuration based on payment method
    const config = isCash ? {
        themeGradient: 'from-blue-500 to-blue-700', // Blue for Booking/Reservation
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        MainIcon: CalendarIcon,
        title: 'Đặt Lịch Thành Công!',
        subTitle: 'Lịch hẹn của bạn đã được xác nhận.',
        amountLabel: 'Số tiền dự kiến',
        amountColor: 'text-gray-800',
        noteBg: 'bg-blue-50',
        noteBorder: 'border-blue-100',
        noteText: 'text-blue-800',
        noteIconColor: 'text-blue-600',
        noteMessage: 'Bạn vui lòng đến đúng giờ. Thanh toán sẽ được thực hiện tại quầy sau khi sử dụng dịch vụ.',
    } : {
        themeGradient: 'from-green-400 to-emerald-600', // Green for Paid
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600',
        MainIcon: CheckCircleIcon,
        title: 'Thanh Toán Thành Công!',
        subTitle: 'Giao dịch đã hoàn tất an toàn.',
        amountLabel: 'Đã thanh toán',
        amountColor: 'text-green-600',
        noteBg: 'bg-yellow-50',
        noteBorder: 'border-yellow-100',
        noteText: 'text-yellow-800',
        noteIconColor: 'text-yellow-600',
        noteMessage: 'Vui lòng đến trước 10 phút để được tư vấn và chuẩn bị tốt nhất.',
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute inset-0 bg-[url('/img/general/noise.png')] opacity-20 pointer-events-none"></div>
            <div className={`absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[100px] animate-pulse opacity-30 ${isCash ? 'bg-blue-400' : 'bg-green-400'}`}></div>
            <div className={`absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[100px] animate-pulse opacity-30 ${isCash ? 'bg-indigo-400' : 'bg-emerald-400'}`} style={{ animationDelay: '1s' }}></div>

            <div className="relative w-full max-w-md bg-white/90 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-slideUpFade z-10 border border-white/60">
                
                {/* Dynamic Header */}
                <div className={`relative h-40 bg-gradient-to-br ${config.themeGradient} flex items-center justify-center overflow-hidden`}>
                    <div className="absolute inset-0 bg-[url('/img/general/noise.png')] opacity-20 mix-blend-overlay"></div>
                    <div className="absolute w-64 h-64 bg-white/10 rounded-full -top-20 -right-20 blur-2xl"></div>
                    
                    <div className="relative z-10 bg-white p-4 rounded-full shadow-lg animate-[bounce_2s_infinite]">
                         <config.MainIcon className={`w-16 h-16 ${isCash ? 'text-blue-500' : 'text-green-500'}`} />
                    </div>
                </div>

                <div className="px-8 pt-8 pb-10 text-center">
                    <h1 className={`text-2xl font-serif font-bold mb-2 ${isCash ? 'text-blue-800' : 'text-green-800'}`}>
                        {config.title}
                    </h1>
                    <p className="text-gray-500 mb-8 text-sm font-medium">
                        {config.subTitle} <br/>Cảm ơn bạn đã chọn Anh Thơ Spa.
                    </p>

                    {/* Receipt Card */}
                    <div className="w-full bg-white rounded-2xl p-6 border border-gray-200 shadow-sm mb-8 relative group">
                         {/* Punch holes effect */}
                         <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-50 rounded-full border border-gray-200 shadow-inner"></div>
                         <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-50 rounded-full border border-gray-200 shadow-inner"></div>
                        
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500 font-medium">Mã tham chiếu</span>
                                <span className="font-mono font-bold text-gray-800 bg-gray-50 px-2 py-1 rounded border border-gray-100">{transactionId}</span>
                            </div>
                            
                            <div className="border-t border-dashed border-gray-200"></div>

                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500 font-medium">Phương thức</span>
                                <div className="flex items-center gap-2 font-semibold text-gray-800">
                                    {isCash ? <BuildingOffice2Icon className="w-4 h-4 text-gray-400"/> : <CreditCardIcon className="w-4 h-4 text-gray-400"/>}
                                    {methodDisplay}
                                </div>
                            </div>

                            {displayAmount > 0 && (
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500 font-medium text-sm">{config.amountLabel}</span>
                                    <span className={`text-xl font-black ${config.amountColor}`}>{formatPrice(displayAmount)}</span>
                                </div>
                            )}
                            
                            {/* Dynamic Note Box */}
                            <div className={`${config.noteBg} p-3 rounded-xl border ${config.noteBorder} text-left flex gap-3 mt-2`}>
                                <div className={`${config.noteIconColor} pt-0.5`}>
                                    <ClockIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className={`${config.noteText} font-bold text-[10px] uppercase tracking-wider mb-0.5`}>Lưu ý</p>
                                    <p className={`text-xs ${config.noteText} leading-relaxed opacity-90`}>
                                        {config.noteMessage}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="w-full space-y-3">
                        <button 
                            onClick={() => navigate('/appointments')}
                            className={`w-full py-4 text-white rounded-2xl font-bold text-base shadow-lg transition-all duration-300 flex items-center justify-center gap-2 group hover:-translate-y-1 ${isCash ? 'bg-blue-600 hover:bg-blue-500 hover:shadow-blue-500/30' : 'bg-green-600 hover:bg-green-500 hover:shadow-green-500/30'}`}
                        >
                            <CalendarIcon className="w-5 h-5" />
                            Xem Lịch Hẹn
                            <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform opacity-70"/>
                        </button>
                        
                        <button 
                            onClick={() => navigate('/')}
                            className="w-full py-3 text-gray-500 font-bold text-sm hover:text-brand-dark hover:bg-gray-50 rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                            <HomeIcon className="w-4 h-4" /> Về trang chủ
                        </button>
                    </div>
                    
                    <div className="mt-8 flex items-center justify-center gap-2 text-xs font-medium text-gray-400">
                         <div className={`w-4 h-4 border-2 border-gray-300 rounded-full animate-spin ${isCash ? 'border-t-blue-500' : 'border-t-green-500'}`}></div>
                         Tự động chuyển hướng sau {countdown}s...
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentSuccessPage;
