import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircleIcon } from '../../shared/icons';

const PaymentSuccessPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const paymentId = searchParams.get('paymentId');

    useEffect(() => {
        // Debug: Log when component mounts
        console.log('PaymentSuccessPage mounted');
        console.log('Payment ID:', paymentId);
        console.log('All search params:', Object.fromEntries(searchParams.entries()));
        
        // Refresh appointments data by triggering a custom event
        // This will notify App.tsx to refresh appointments
        window.dispatchEvent(new CustomEvent('refresh-appointments'));
        
        // Auto redirect to appointments page after 5 seconds
        const timer = setTimeout(() => {
            console.log('Auto redirecting to appointments page...');
            navigate('/appointments');
        }, 5000);

        return () => clearTimeout(timer);
    }, [navigate, paymentId, searchParams]);

    return (
        <div className="container mx-auto px-4 py-16 flex justify-center items-center min-h-[70vh]">
            <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-2xl text-center">
                <CheckCircleIcon className="mx-auto mb-4 w-20 h-20 text-green-500" />
                <h1 className="text-3xl font-bold text-brand-dark mb-4">Đặt lịch thành công!</h1>
                <p className="text-gray-600 mb-6">
                    Cảm ơn bạn đã đặt lịch. Giao dịch của bạn đã được xử lý thành công.
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <p className="text-yellow-800 font-semibold">
                        ⏳ Lịch hẹn của bạn đang chờ admin xác nhận. Vui lòng kiểm tra trang "Lịch hẹn" để theo dõi trạng thái.
                    </p>
                </div>
                {paymentId && (
                    <p className="text-sm text-gray-500 mb-6">
                        Mã giao dịch: <span className="font-mono">{paymentId}</span>
                    </p>
                )}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={() => navigate('/appointments')}
                        className="px-6 py-3 bg-brand-primary text-white font-semibold rounded-lg hover:bg-brand-dark transition-colors"
                    >
                        Xem lịch hẹn
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                    >
                        Về trang chủ
                    </button>
                </div>
                <p className="text-xs text-gray-400 mt-6">
                    Bạn sẽ được chuyển đến trang lịch hẹn sau 5 giây...
                </p>
            </div>
        </div>
    );
};

export default PaymentSuccessPage;

