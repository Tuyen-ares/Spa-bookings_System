
import React, { useMemo } from 'react';
// FIX: Added UserRole to the type import.
import type { User, Appointment, Service, Review, Promotion, InternalNotification, UserRole } from '../../types';
import {
  CurrencyDollarIcon, UsersIcon, CalendarIcon, StarIcon,
  BellIcon,
  LightBulbIcon, ExclamationTriangleIcon, TrophyIcon, ClockIcon, GiftIcon, XCircleIcon
} from '../../shared/icons';
import EmployeeOfMonth from '../components/EmployeeOfMonth';

// --- HELPER & UTILITY ---
const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
const formatPercentage = (change: number) => `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;

// FIX: Correctly define staff roles based on the User['role'] type.
const STAFF_ROLES: UserRole[] = ['Staff', 'Admin'];

// --- UI COMPONENTS ---
interface StatCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    change?: string;
    changeType?: 'increase' | 'decrease';
    bgColor: string;
}
const StatCard: React.FC<StatCardProps> = ({ title, value, icon, change, changeType, bgColor }) => (
    <div className="bg-white p-6 rounded-lg shadow-md transition-all hover:shadow-lg hover:-translate-y-1">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500 uppercase">{title}</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
            </div>
            <div className={`p-3 rounded-full ${bgColor} text-white`}>{icon}</div>
        </div>
        {change && (
            <p className={`mt-2 text-xs flex items-center ${changeType === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
                {/* FIX: Removed ArrowUpIcon and ArrowDownIcon as they are not exported from shared/icons.tsx. The change indicator relies on text and color. */}
                {change} so với tháng trước
            </p>
        )}
    </div>
);

// --- MAIN COMPONENT ---
interface OverviewPageProps {
    allServices: Service[];
    allAppointments: Appointment[];
    allUsers: User[];
    allReviews: Review[];
    allPromotions: Promotion[];
    allInternalNotifications: InternalNotification[];
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ allServices, allAppointments, allUsers, allReviews, allPromotions, allInternalNotifications }) => {
    
    const now = useMemo(() => new Date(), []);
    const todayStr = now.toISOString().split('T')[0];
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // --- AGGREGATED DATA & STATS ---
    const stats = useMemo(() => {
        const clients = allUsers.filter(u => u.role === 'Client');
        const staff = allUsers.filter(u => STAFF_ROLES.includes(u.role));
        
        const completedAppointments = allAppointments.filter(a => a.status === 'completed');
        
        const totalRevenue = completedAppointments.reduce((sum, app) => {
            const service = allServices.find(s => s.id === app.serviceId);
            return sum + (service?.price || 0);
        }, 0);
        
        const revenueToday = completedAppointments
            .filter(a => a.date === todayStr)
            .reduce((sum, app) => {
                const service = allServices.find(s => s.id === app.serviceId);
                return sum + (service?.price || 0);
            }, 0);

        return {
            totalCustomers: clients.length,
            totalAppointments: allAppointments.length,
            totalRevenue: formatCurrency(totalRevenue),
            totalServices: allServices.length,
            totalStaff: staff.length,
            revenueToday: formatCurrency(revenueToday),
        };
    }, [allUsers, allAppointments, allServices, todayStr]);

    const topServices = useMemo(() => {
        const serviceCounts = allAppointments.reduce((acc: Record<string, number>, app) => {
            acc[app.serviceId] = (acc[app.serviceId] || 0) + 1;
            return acc;
        }, {});

        return Object.entries(serviceCounts)
            .sort(([, a], [, b]) => (b as number) - (a as number))
            .slice(0, 5)
            .map(([serviceId, count]) => {
                const service = allServices.find(s => s.id === serviceId);
                return { name: service?.name || 'Dịch vụ không xác định', count };
            });
    }, [allAppointments, allServices]);
    
    const retentionRate = useMemo(() => {
        const customerAppointments = new Map<string, number>();
        allAppointments.forEach(app => {
            customerAppointments.set(app.userId, (customerAppointments.get(app.userId) || 0) + 1);
        });
        
        if (customerAppointments.size === 0) return 0;
        
        const returningCustomers = Array.from(customerAppointments.values()).filter(count => count > 1).length;
        
        return (returningCustomers / customerAppointments.size) * 100;

    }, [allAppointments]);

    const bookingHeatmapData: { slots: string[]; data: Record<string, number> } = useMemo(() => {
        const timeSlots = ['09:00', '11:00', '13:00', '15:00', '17:00', '19:00'];
        const data: Record<string, number> = {};
        
        allAppointments.forEach(app => {
            const appHour = parseInt(app.time.split(':')[0]);
            const slot = timeSlots.find(ts => {
                const slotHour = parseInt(ts.split(':')[0]);
                return appHour >= slotHour && appHour < slotHour + 2;
            });
            if (slot) {
                 data[slot] = (data[slot] || 0) + 1;
            }
        });
        return { slots: timeSlots, data };
    }, [allAppointments]);
    
    const alerts = useMemo(() => {
        const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const expiringPromos = allPromotions.filter(p => {
            const expiry = new Date(p.expiryDate);
            return expiry > now && expiry <= sevenDaysFromNow;
        });

        const unconfirmedAppointments = allAppointments.filter(a => a.status === 'pending');
        
        const staffOnLeave = allInternalNotifications.filter(n => n.type === 'shift_change' && !n.isRead && n.message.toLowerCase().includes('nghỉ'));

        return { expiringPromos, unconfirmedAppointments, staffOnLeave };
    }, [allPromotions, allAppointments, allInternalNotifications, now]);


    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-800 animate-fadeInDown">Dashboard Tổng Quan (AI-Driven)</h1>
            
            {/* Main Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                <div className="opacity-0 animate-fadeInUp" style={{animationDelay: '100ms'}}>
                    <StatCard title="Tổng Doanh thu" value={stats.totalRevenue} icon={<CurrencyDollarIcon className="w-8 h-8"/>} bgColor="bg-green-500" />
                </div>
                 <div className="opacity-0 animate-fadeInUp" style={{animationDelay: '200ms'}}>
                    <StatCard title="Tổng Lịch hẹn" value={stats.totalAppointments.toLocaleString()} icon={<CalendarIcon className="w-8 h-8"/>} bgColor="bg-blue-500" />
                </div>
                <div className="opacity-0 animate-fadeInUp" style={{animationDelay: '300ms'}}>
                    <StatCard title="Tổng Khách hàng" value={stats.totalCustomers.toLocaleString()} icon={<UsersIcon className="w-8 h-8"/>} bgColor="bg-purple-500" />
                </div>
                <div className="opacity-0 animate-fadeInUp" style={{animationDelay: '400ms'}}>
                    <StatCard title="Tổng Dịch vụ" value={stats.totalServices.toLocaleString()} icon={<StarIcon className="w-8 h-8"/>} bgColor="bg-indigo-500" />
                </div>
                <div className="opacity-0 animate-fadeInUp" style={{animationDelay: '500ms'}}>
                    <StatCard title="Tổng Nhân viên" value={stats.totalStaff.toLocaleString()} icon={<TrophyIcon className="w-8 h-8"/>} bgColor="bg-pink-500" />
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Main content: Charts & Lists */}
                <div className="xl:col-span-2 space-y-6">
                    {/* Revenue Section */}
                    <div className="bg-white p-6 rounded-lg shadow-md opacity-0 animate-fadeInUp" style={{animationDelay: '600ms'}}>
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Doanh thu Hôm nay / Tháng / Năm</h2>
                        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-md text-gray-400 italic">
                           Placeholder cho Biểu đồ Cột & Đường
                        </div>
                    </div>
                    {/* Top Services & Retention */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-lg shadow-md opacity-0 animate-fadeInUp" style={{animationDelay: '700ms'}}>
                            <h2 className="text-xl font-bold text-gray-800 mb-4">Top 5 Dịch vụ được đặt nhiều nhất</h2>
                            <ul className="space-y-3">
                                {topServices.map((service, index) => (
                                    <li key={index} className="flex justify-between items-center text-sm">
                                        <span className="font-medium text-gray-700">{index + 1}. {service.name}</span>
                                        <span className="font-bold text-brand-primary">{service.count.toLocaleString()} lượt</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-md opacity-0 animate-fadeInUp" style={{animationDelay: '800ms'}}>
                             <h2 className="text-xl font-bold text-gray-800 mb-4">Tỷ lệ khách quay lại</h2>
                             <div className="text-center">
                                 <p className="text-5xl font-bold text-green-600">{retentionRate.toFixed(1)}%</p>
                                 <p className="text-sm text-gray-500 mt-2">Dựa trên khách hàng có nhiều hơn 1 lịch hẹn.</p>
                             </div>
                             <h2 className="text-xl font-bold text-gray-800 mt-6 mb-4">Lịch hẹn</h2>
                             <div className="bg-white p-6 rounded-lg shadow-md">
                                 <p className="text-gray-500 italic">Danh sách lịch hẹn sẽ hiển thị ở đây (placeholder).</p>
                             </div>
                         </div>
                    </div>
                </div>

                <div className="xl:col-span-1 space-y-6">
                    {/* Right column: alerts / employee of month / quick actions */}
                    <div className="bg-white p-6 rounded-lg shadow-md opacity-0 animate-fadeInUp" style={{animationDelay: '900ms'}}>
                        <h3 className="text-lg font-bold mb-2">Thông báo & Cảnh báo</h3>
                        <p className="text-sm text-gray-500">Các thông báo sắp hết hạn và các lịch chưa xác nhận sẽ ở đây.</p>
                    </div>
                    <EmployeeOfMonth />
                </div>
            </div>
        </div>
    );
};
