
import React, { useMemo } from 'react';
import type { User, Appointment, StaffTier, Service } from '../../types';

// Icons
import { ChartBarIcon, StarIcon, CurrencyDollarIcon, UsersIcon } from '../../shared/icons';


interface StaffPersonalReportsPageProps {
    currentUser: User;
    allServices: Service[];
    allUsers: User[];
    allAppointments: Appointment[];
}

const StaffPersonalReportsPage: React.FC<StaffPersonalReportsPageProps> = ({ currentUser, allServices, allUsers, allAppointments }) => {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const currentYear = new Date().getFullYear();

    const stats = useMemo(() => {
        const staffAppointments = allAppointments.filter(app => app.therapistId === currentUser.id && app.status === 'completed');

        // Monthly breakdown
        const monthlyData: { month: string; sessions: number; revenue: number; commission: number; }[] = Array.from({ length: 12 }, (_, i) => {
            const monthName = `T${i + 1}`;
            const appointmentsInMonth = staffAppointments.filter(app => {
                const appDate = new Date(app.date);
                return appDate.getMonth() === i && appDate.getFullYear() === currentYear;
            });

            const sessions = appointmentsInMonth.length;
            const revenue = appointmentsInMonth.reduce((sum, app) => {
                const service = allServices.find(s => s.id === app.serviceId);
                return sum + (service?.price || 0);
            }, 0);
            // Note: commissionRate not in db.txt
            const commission = 0;

            return { month: monthName, sessions, revenue, commission };
        });

        // Overall stats
        const totalSessions = staffAppointments.length;
        const totalRevenueOverall = staffAppointments.reduce((sum, app) => {
            const service = allServices.find(s => s.id === app.serviceId);
            return sum + (service?.price || 0);
        }, 0);
        // Note: commissionRate not in db.txt
        const totalCommissionOverall = 0;

        const ratedAppointments = staffAppointments.filter(app => typeof app.reviewRating === 'number');
        const totalRating = ratedAppointments.reduce((sum, app) => sum + app.reviewRating!, 0);
        const averageRating = ratedAppointments.length > 0 ? totalRating / ratedAppointments.length : 0;
        const reviewCount = ratedAppointments.length;

        return {
            monthlyData,
            totalSessions,
            totalRevenueOverall,
            totalCommissionOverall,
            averageRating,
            reviewCount,
        };
    }, [currentUser, currentYear, allServices, allAppointments]);

    const myStaffTier: StaffTier | undefined = useMemo(() => {
        const tiers: StaffTier[] = [
            { id: 'Mới', name: 'Mới', minAppointments: 0, minRating: 0, commissionBoost: 0, color: '#A8A29E', badgeImageUrl: 'https://picsum.photos/seed/staff-tier-new/50/50' },
            { id: 'Thành thạo', name: 'Thành thạo', minAppointments: 50, minRating: 4, commissionBoost: 0.05, color: '#EF4444', badgeImageUrl: 'https://picsum.photos/seed/staff-tier-proficient/50/50' },
            { id: 'Chuyên gia', name: 'Chuyên gia', minAppointments: 150, minRating: 4.7, commissionBoost: 0.1, color: '#10B981', badgeImageUrl: 'https://picsum.photos/seed/staff-tier-expert/50/50' },
        ];
        // Note: staffTierId removed from users table in db.txt
        // Default to 'Mới' tier for all staff
        return tiers.find(tier => tier.id === 'Mới') || tiers[0];
    }, []);

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Báo cáo hiệu suất cá nhân</h1>
            <p className="text-gray-600 mb-8">Tổng quan về hiệu suất làm việc, doanh thu và hoa hồng của bạn trong năm {currentYear}.</p>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 uppercase">Tổng số buổi phục vụ</p>
                            <p className="text-3xl font-bold text-gray-800 mt-1">{stats.totalSessions}</p>
                        </div>
                        <div className="text-brand-primary p-3 bg-brand-secondary rounded-full"><UsersIcon className="w-8 h-8" /></div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 uppercase">Doanh thu cá nhân</p>
                            <p className="text-3xl font-bold text-green-600 mt-1">{formatCurrency(stats.totalRevenueOverall)}</p>
                        </div>
                        <div className="text-green-600 p-3 bg-green-100 rounded-full"><CurrencyDollarIcon className="w-8 h-8" /></div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 uppercase">Hoa hồng đã nhận</p>
                            <p className="text-3xl font-bold text-purple-600 mt-1">{formatCurrency(stats.totalCommissionOverall)}</p>
                        </div>
                        <div className="text-purple-600 p-3 bg-purple-100 rounded-full"><CurrencyDollarIcon className="w-8 h-8" /></div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 uppercase">Đánh giá trung bình</p>
                            <p className="text-3xl font-bold text-yellow-500 mt-1 flex items-center">{stats.averageRating.toFixed(1)} <StarIcon className="w-6 h-6 ml-1" /></p>
                        </div>
                        <div className="text-yellow-500 p-3 bg-yellow-100 rounded-full"><StarIcon className="w-8 h-8" /></div>
                    </div>
                </div>
            </div>

            {/* Monthly Performance */}
            <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
                <h3 className="text-lg font-semibold text-gray-700 flex items-center mb-4"><ChartBarIcon className="w-6 h-6 mr-2 text-brand-primary" /> Hiệu suất theo tháng ({currentYear})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-semibold text-gray-700 mb-2">Số buổi phục vụ</h4>
                        <div className="h-48 flex items-center justify-center bg-gray-50 rounded-md text-gray-400 italic">Biểu đồ đang được cập nhật...</div>
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-700 mb-2">Doanh thu cá nhân</h4>
                        <div className="h-48 flex items-center justify-center bg-gray-50 rounded-md text-gray-400 italic">Biểu đồ đang được cập nhật...</div>
                    </div>
                </div>
                <div className="mt-6">
                    <h4 className="font-semibold text-gray-700 mb-2">Hoa hồng nhận được</h4>
                    <div className="h-48 flex items-center justify-center bg-gray-50 rounded-md text-gray-400 italic">Biểu đồ đang được cập nhật...</div>
                </div>
            </div>

            {/* Detailed Monthly Table */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2"><ChartBarIcon className="w-6 h-6 mr-2 text-brand-primary" /> Chi tiết hiệu suất theo tháng</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tháng</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số buổi</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doanh thu</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hoa hồng</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {stats.monthlyData.map((data, index) => (
                                <tr key={index}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{data.month}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{data.sessions}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">{formatCurrency(data.revenue)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600">{formatCurrency(data.commission)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default StaffPersonalReportsPage;
