
import React, { useMemo } from 'react';
import type { User, Appointment, StaffTier, Service } from '../../types';
import { TrophyIcon, StarIcon, CurrencyDollarIcon, ChartBarIcon, UsersIcon } from '../../shared/icons';
// Icons

interface StaffRewardsPageProps {
    currentUser: User;
    allServices: Service[];
    allUsers: User[];
    allAppointments: Appointment[];
}

const StaffRewardsPage: React.FC<StaffRewardsPageProps> = ({ currentUser, allServices, allUsers, allAppointments }) => {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const myPerformance = useMemo(() => {
        const staffAppointments = allAppointments.filter(app => app.therapistId === currentUser.id && app.status === 'completed');
        
        const sessionsThisMonth = staffAppointments.filter(app => {
            const appDate = new Date(app.date);
            const now = new Date();
            return appDate.getMonth() === now.getMonth() && appDate.getFullYear() === now.getFullYear();
        }).length;

        const totalRevenue = staffAppointments.reduce((sum, app) => {
            const service = allServices.find(s => s.id === app.serviceId);
            return sum + (service?.price || 0);
        }, 0);

        // Note: commissionRate not in db.txt
        const commission = 0;

        const ratedAppointments = staffAppointments.filter(app => typeof app.reviewRating === 'number');
        const totalRating = ratedAppointments.reduce((sum, app) => sum + app.reviewRating!, 0);
        const averageRating = ratedAppointments.length > 0 ? totalRating / ratedAppointments.length : 0;
        
        return { sessionsThisMonth, totalRevenue, commission, averageRating };
    }, [currentUser, allServices, allAppointments]);

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

    const leaderboard = useMemo(() => {
        const technicians = allUsers.filter(user => user.role === 'Staff');
        const technicianPerformance = technicians.map(tech => {
            const staffAppointments = allAppointments.filter(app => app.therapistId === tech.id && app.status === 'completed');
            const sessionsThisMonth = staffAppointments.filter(app => {
                const appDate = new Date(app.date);
                const now = new Date();
                return appDate.getMonth() === now.getMonth() && appDate.getFullYear() === now.getFullYear();
            }).length;

            const ratedAppointments = staffAppointments.filter(app => typeof app.reviewRating === 'number');
            const totalRating = ratedAppointments.reduce((sum, app) => sum + app.reviewRating!, 0);
            const averageRating = ratedAppointments.length > 0 ? totalRating / ratedAppointments.length : 0;

            const totalRevenue = staffAppointments.reduce((sum, app) => {
                const service = allServices.find(s => s.id === app.serviceId);
                return sum + (service?.price || 0);
            }, 0);
            // Note: commissionRate not in db.txt
            const commission = 0;

            return {
                id: tech.id,
                name: tech.name,
                profilePictureUrl: tech.profilePictureUrl,
                sessionsThisMonth,
                averageRating,
                commission,
            };
        });

        // Sort by a combined metric (e.g., sessions + rating + commission)
        return technicianPerformance.sort((a, b) => {
            const scoreA = a.sessionsThisMonth * 100 + a.averageRating * 5000 + a.commission / 10000;
            const scoreB = b.sessionsThisMonth * 100 + b.averageRating * 5000 + b.commission / 10000;
            // FIX: Property 'score' does not exist on type '{ id: string; name: string; profilePictureUrl: string; sessionsThisMonth: number; averageRating: number; commission: number; }'.
            return scoreB - scoreA;
        });
    }, [allUsers, allServices, allAppointments]);

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Hiệu suất & Phần thưởng cá nhân</h1>
            <p className="text-gray-600 mb-8">Theo dõi thành tích của bạn và cạnh tranh với đồng nghiệp.</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Current Tier */}
                <div className="bg-white p-6 rounded-lg shadow-sm text-center">
                    <TrophyIcon className="w-12 h-12 text-brand-primary mx-auto mb-3" />
                    <p className="text-sm font-medium text-gray-500">Cấp bậc của bạn</p>
                    <p className="text-3xl font-bold text-gray-800 mt-1" style={{color: myStaffTier?.color}}>{myStaffTier?.name || 'Mới'}</p>
                    {myStaffTier?.badgeImageUrl && (
                        <img src={myStaffTier.badgeImageUrl} alt={myStaffTier.name} className="w-16 h-16 mx-auto mt-3" />
                    )}
                </div>

                {/* Performance Metrics */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2"><ChartBarIcon className="w-5 h-5 text-blue-500"/> Thống kê tháng này</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="font-medium text-gray-500">Số buổi phục vụ</p>
                            <p className="font-bold text-gray-800 text-xl">{myPerformance.sessionsThisMonth}</p>
                        </div>
                        <div>
                            <p className="font-medium text-gray-500">Đánh giá trung bình</p>
                            <p className="font-bold text-yellow-500 text-xl flex items-center">{myPerformance.averageRating.toFixed(1)} <StarIcon className="w-4 h-4 ml-1" /></p>
                        </div>
                        <div>
                            <p className="font-medium text-gray-500">Tổng doanh thu</p>
                            <p className="font-bold text-green-600 text-xl">{formatCurrency(myPerformance.totalRevenue)}</p>
                        </div>
                        <div>
                            <p className="font-medium text-gray-500">Hoa hồng cá nhân</p>
                            <p className="font-bold text-purple-600 text-xl">{formatCurrency(myPerformance.commission)}</p>
                        </div>
                    </div>
                </div>

                {/* Leaderboard */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2"><TrophyIcon className="w-5 h-5 text-yellow-500"/> Bảng xếp hạng nhân viên</h3>
                    <ul className="space-y-3">
                        {leaderboard.slice(0, 5).map((staff, index) => (
                            <li key={staff.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="font-bold text-lg text-gray-700">{index + 1}.</span>
                                    <img src={staff.profilePictureUrl} alt={staff.name} className="w-8 h-8 rounded-full object-cover" />
                                    <span className="font-medium text-gray-800">{staff.name}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <span className="text-yellow-500 flex items-center gap-1">{staff.averageRating.toFixed(1)} <StarIcon className="w-4 h-4" /></span>
                                    <span>({staff.sessionsThisMonth} buổi)</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default StaffRewardsPage;
