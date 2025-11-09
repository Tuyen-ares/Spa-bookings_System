
import React from 'react';
import { useLocation } from 'react-router-dom';

const pageTitleMap: Record<string, string> = {
    users: 'Người dùng',
    services: 'Dịch vụ',
    appointments: 'Lịch hẹn',
    payments: 'Thanh toán',
    invoices: 'Hóa đơn',
    staff: 'Nhân viên',
    promotions: 'Khuyến mãi',
    membership: 'Thành viên',
    reviews: 'Đánh giá',
    branches: 'Chi nhánh',
    notifications: 'Thông báo',
    reports: 'Báo cáo & Thống kê',
    settings: 'Cài đặt',
    security: 'Bảo mật',
};

const PlaceholderPage: React.FC = () => {
    const location = useLocation();
    const pageKey = location.pathname.split('/').pop() || 'trang';
    const pageName = pageTitleMap[pageKey] || pageKey;

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Quản lý {pageName}</h1>
            <div className="bg-white p-12 rounded-lg shadow-md text-center border-t-4 border-brand-primary">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547a2 2 0 00-.547 1.806l.477 2.387a6 6 0 00.517 3.86l.158.318a6 6 0 00.517 3.86l2.387.477a2 2 0 001.806-.547a2 2 0 00.547-1.806l-.477-2.387a6 6 0 00-.517-3.86l-.158-.318a6 6 0 01-.517-3.86l-2.387-.477zM12 18a6 6 0 100-12 6 6 0 000 12z" />
                </svg>
                <h2 className="mt-4 text-xl font-semibold text-gray-700">Tính năng đang được phát triển</h2>
                <p className="mt-2 text-gray-500">
                    Chúng tôi đang làm việc chăm chỉ để mang đến cho bạn trang quản lý {pageName.toLowerCase()}.
                    <br/>
                    Vui lòng quay lại sau!
                </p>
            </div>
        </div>
    );
};

export default PlaceholderPage;