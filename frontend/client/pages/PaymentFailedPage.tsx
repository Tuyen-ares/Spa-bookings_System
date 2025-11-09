import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ExclamationTriangleIcon } from '../../shared/icons';

const PaymentFailedPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const message = searchParams.get('message') || 'Thanh toán thất bại';
    const paymentId = searchParams.get('paymentId');

    return (
        <div className="container mx-auto px-4 py-16 flex justify-center items-center min-h-[70vh]">
            <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-2xl text-center">
                <ExclamationTriangleIcon className="mx-auto mb-4 w-20 h-20 text-red-500" />
                <h1 className="text-3xl font-bold text-red-600 mb-4">Thanh toán thất bại</h1>
                <p className="text-gray-600 mb-6">
                    {message}
                </p>
                {paymentId && (
                    <p className="text-sm text-gray-500 mb-6">
                        Mã giao dịch: <span className="font-mono">{paymentId}</span>
                    </p>
                )}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={() => navigate('/booking')}
                        className="px-6 py-3 bg-brand-primary text-white font-semibold rounded-lg hover:bg-brand-dark transition-colors"
                    >
                        Thử lại
                    </button>
                    <button
                        onClick={() => navigate('/appointments')}
                        className="px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                    >
                        Xem lịch hẹn
                    </button>
                </div>
                <p className="text-sm text-gray-500 mt-6">
                    Nếu bạn đã thanh toán nhưng gặp lỗi, vui lòng liên hệ với chúng tôi để được hỗ trợ.
                </p>
            </div>
        </div>
    );
};

export default PaymentFailedPage;

