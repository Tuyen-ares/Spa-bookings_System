
import React, { useMemo, useState } from 'react';
import type { User, Appointment, StaffTier, InternalNotification, Service, Sale } from '../../types';
import { CalendarIcon, ClockIcon, StarIcon, BellIcon, ChartBarIcon, TrophyIcon } from '../../shared/icons';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const KpiProgress: React.FC<{ label: string; value: number; goal: number; format: (val: number) => string; }> = ({ label, value, goal, format }) => {
    const percentage = goal > 0 ? Math.min((value / goal) * 100, 100) : 0;
    return (
        <div>
            <div className="flex justify-between items-baseline mb-1">
                <span className="text-sm font-medium text-gray-600">{label}</span>
                <span className="text-xs font-semibold text-gray-500">{format(value)} / {format(goal)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-brand-primary h-2.5 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
            </div>
        </div>
    );
};

const TimekeepingCard: React.FC = () => {
    const [status, setStatus] = useState<'out' | 'in' | 'late'>('out');
    const [checkInTime, setCheckInTime] = useState<string | null>(null);
    const [lateMinutes, setLateMinutes] = useState<number | null>(null);

    const handleCheckIn = () => {
        const now = new Date();

        // Use minutes-since-midnight to compute lateness precisely
        const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
        const LATE_THRESHOLD_MINUTES = 9 * 60 + 5; // 09:05 => 9*60 + 5 = 545
        const isLate = minutesSinceMidnight > LATE_THRESHOLD_MINUTES;

        setStatus(isLate ? 'late' : 'in');
        setCheckInTime(now.toLocaleTimeString('vi-VN'));

        if (isLate) {
            const minutesLate = minutesSinceMidnight - LATE_THRESHOLD_MINUTES;
            setLateMinutes(minutesLate);
            alert(`Đã check-in trễ lúc ${now.toLocaleTimeString('vi-VN')} (trễ ${minutesLate} phút)`);
        } else {
            setLateMinutes(null);
            alert(`Đã check-in lúc ${now.toLocaleTimeString('vi-VN')}`);
        }
    };

    const handleCheckOut = () => {
        setStatus('out');
        setCheckInTime(null);
        setLateMinutes(null);
        alert('Đã check-out thành công!');
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2"><ClockIcon className="w-5 h-5 text-brand-primary" /> Chấm công hôm nay</h3>
            <div className="text-center">
                {status === 'out' && (
                    <>
                        <p className="text-gray-500 mb-4">Bạn chưa check-in. Vui lòng check-in khi bắt đầu ca làm.</p>
                        <button onClick={handleCheckIn} className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition-colors">
                            Check-in
                        </button>
                    </>
                )}
                {status === 'in' && (
                    <>
                        <p className="text-green-600 font-semibold mb-4">Đang trong ca. Check-in lúc: {checkInTime}</p>
                        <button onClick={handleCheckOut} className="w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition-colors">
                            Check-out
                        </button>
                    </>
                )}
                {status === 'late' && (
                    <>
                        <p className="text-red-600 font-semibold mb-4">Bạn đã check-in trễ lúc: {checkInTime}{lateMinutes ? ` (trễ ${lateMinutes} phút)` : ''}</p>
                        <button onClick={handleCheckOut} className="w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition-colors">
                            Check-out
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}


interface StaffDashboardPageProps {
    currentUser: User;
    allServices: Service[];
    allUsers: User[];
    allAppointments: Appointment[];
    allInternalNotifications: InternalNotification[];
    allSales: Sale[];
}

const StaffDashboardPage: React.FC<StaffDashboardPageProps> = ({ currentUser, allServices, allUsers, allAppointments, allInternalNotifications, allSales }) => {
    const today = new Date().toISOString().split('T')[0];

    const todayAppointments = useMemo(() => {
        return allAppointments.filter(
            app => app.therapistId === currentUser.id && app.date === today && app.status !== 'cancelled'
        ).sort((a, b) => a.time.localeCompare(b.time));
    }, [currentUser.id, today, allAppointments]);

    const stats = useMemo(() => {
        const staffAppointments = allAppointments.filter(app => app.therapistId === currentUser.id && app.status === 'completed');

        const sessionsThisWeek = staffAppointments.filter(app => {
            const appDate = new Date(app.date);
            const now = new Date();
            const firstDayOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1))); // Monday
            firstDayOfWeek.setHours(0, 0, 0, 0);
            const lastDayOfWeek = new Date(firstDayOfWeek);
            lastDayOfWeek.setDate(lastDayOfWeek.getDate() + 6);
            lastDayOfWeek.setHours(23, 59, 59, 999);
            return appDate >= firstDayOfWeek && appDate <= lastDayOfWeek;
        }).length;

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
        const reviewCount = ratedAppointments.length;

        return { sessionsThisWeek, sessionsThisMonth, totalRevenue, commission, averageRating, reviewCount };
    }, [currentUser.id, allAppointments, allServices]);

    const kpiStats = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const myCompletedAppointmentsThisMonth = allAppointments.filter(app => {
            const appDate = new Date(app.date);
            return app.therapistId === currentUser.id &&
                app.status === 'completed' &&
                appDate.getMonth() === currentMonth &&
                appDate.getFullYear() === currentYear;
        });

        const currentMonthRevenue = myCompletedAppointmentsThisMonth.reduce((sum, app) => {
            const service = allServices.find(s => s.id === app.serviceId);
            return sum + (service?.price || 0);
        }, 0);

        const currentMonthSessions = myCompletedAppointmentsThisMonth.length;

        const mySalesThisMonth = allSales.filter(sale => {
            const saleDate = new Date(sale.date);
            return sale.staffId === currentUser.id &&
                sale.status === 'completed' &&
                saleDate.getMonth() === currentMonth &&
                saleDate.getFullYear() === currentYear;
        });

        const currentMonthSales = mySalesThisMonth.reduce((sum, sale) => sum + sale.totalAmount, 0);

        return { currentMonthRevenue, currentMonthSessions, currentMonthSales };
    }, [currentUser.id, allAppointments, allServices, allSales]);

    const newNotifications = useMemo(() => {
        return allInternalNotifications.filter(
            notif => (notif.recipientId === currentUser.id || notif.recipientType === 'all') && !notif.isRead
        ).slice(0, 3); // Show top 3 unread
    }, [currentUser.id, allInternalNotifications]);

    const staffTier: StaffTier | undefined = useMemo(() => {
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
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Chào mừng, {currentUser.name}!</h1>
            {/* Note: staffRole removed from users table in db.txt */}
            <p className="text-gray-600 mb-8">Bạn đang ở vai trò <span className="font-semibold text-brand-primary">Nhân viên</span>.</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Personal Info Card */}
                <div className="bg-white p-6 rounded-lg shadow-sm flex items-center gap-4">
                    <img src={currentUser.profilePictureUrl} alt={currentUser.name} className="w-16 h-16 rounded-full object-cover border-2 border-brand-primary/50" />
                    <div>
                        <p className="text-lg font-bold text-gray-800">{currentUser.name}</p>
                        <p className="text-sm text-gray-500">{currentUser.email}</p>
                        {staffTier && (
                            <p className="text-sm mt-1 font-semibold" style={{ color: staffTier.color }}>{staffTier.name}</p>
                        )}
                    </div>
                </div>

                {/* Timekeeping Card */}
                <TimekeepingCard />

                {/* Notifications */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2"><BellIcon className="w-5 h-5 text-red-500" /> Thông báo mới</h3>
                    {newNotifications.length > 0 ? (
                        <ul className="space-y-3">
                            {newNotifications.map(notif => (
                                <li key={notif.id} className="text-sm text-gray-700 border-l-4 border-red-400 pl-3">
                                    <p className="font-medium">{notif.message}</p>
                                    <p className="text-xs text-gray-500">{new Date(notif.date).toLocaleDateString('vi-VN')}</p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-500 italic">Không có thông báo mới.</p>
                    )}
                </div>
            </div>

            {/* Note: kpiGoals removed from users table in db.txt */}
            {/* KPI Goals section removed as kpiGoals field is not available in database */}

            <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2"><CalendarIcon className="w-5 h-5 text-blue-500" /> Lịch hẹn hôm nay ({new Date().toLocaleDateString('vi-VN')})</h3>
                {todayAppointments.length > 0 ? (
                    <div className="space-y-4">
                        {todayAppointments.map(app => {
                            const client = allUsers.find(u => u.id === app.userId);
                            const service = allServices.find(s => s.id === app.serviceId);
                            return (
                                <div key={app.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-md border-l-4 border-blue-300">
                                    <div>
                                        <p className="font-bold text-gray-800">{app.time} - {service?.name}</p>
                                        <p className="text-sm text-gray-600">Khách hàng: {client?.name}</p>
                                    </div>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${app.status === 'upcoming' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {app.status === 'upcoming' ? 'Đã xác nhận' : 'Chờ khách'}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-gray-500 italic">Không có lịch hẹn nào cho hôm nay.</p>
                )}
            </div>
        </div>
    );
};

export default StaffDashboardPage;
