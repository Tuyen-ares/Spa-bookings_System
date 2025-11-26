
import React, { useMemo, useState, useEffect } from 'react';
// FIX: Added UserRole and Payment to the type import.
import type { User, Appointment, Service, Review, Promotion, InternalNotification, Payment, UserRole } from '../../types';
import {
    CurrencyDollarIcon, UsersIcon, CalendarIcon, StarIcon,
    BellIcon,
    LightBulbIcon, ExclamationTriangleIcon, TrophyIcon, ClockIcon, GiftIcon, XCircleIcon
} from '../../shared/icons';
import EmployeeOfMonth from '../components/EmployeeOfMonth';
import * as apiService from '../../client/services/apiService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { formatDateDDMMYYYY, parseDDMMYYYYToYYYYMMDD } from '../../shared/dateUtils';

// --- HELPER & UTILITY ---
const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
const formatPercentage = (change: number) => `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;

// FIX: Correctly define staff roles based on the User['role'] type.
const STAFF_ROLES: UserRole[] = ['Staff', 'Admin'];

// --- UI COMPONENTS ---
interface StatCardProps {
    title: string;
    value: string;
    icon?: React.ReactNode; // Make icon optional
    change?: string;
    changeType?: 'increase' | 'decrease';
    bgColor?: string; // Make bgColor optional since we're removing icon
}

// Helper function to calculate font size based on value length
const getFontSize = (value: string): string => {
    // Remove currency symbols and spaces for length calculation
    const cleanValue = value.replace(/[₫,\s]/g, '');
    const length = cleanValue.length;
    
    if (length <= 8) return 'text-3xl'; // Default size for numbers like 14.000.000
    if (length <= 10) return 'text-2xl'; // For numbers like 1.000.000.000
    if (length <= 12) return 'text-xl';  // For numbers like 1.000.000.000.000
    if (length <= 14) return 'text-lg';  // For very long numbers
    return 'text-base'; // Fallback for extremely long numbers
};

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, change, changeType, bgColor }) => {
    const fontSize = getFontSize(value);
    
    return (
        <div className="group relative overflow-hidden bg-gradient-to-br from-white to-gray-50 p-6 rounded-xl shadow-md transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border border-gray-100">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-brand-primary/5 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</p>
                    {icon && <div className="text-brand-primary opacity-20 group-hover:opacity-40 transition-opacity">{icon}</div>}
                </div>
                <p className={`${fontSize} font-extrabold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mt-2 break-words overflow-hidden`} style={{ wordBreak: 'break-word' }}>
                    {value}
                </p>
                {change && (
                    <div className={`mt-3 inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                        changeType === 'increase' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                    }`}>
                        <span className="mr-1">{changeType === 'increase' ? '↑' : '↓'}</span>
                        {change}
                    </div>
                )}
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-brand-primary via-purple-500 to-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
        </div>
    );
};

// --- MAIN COMPONENT ---
interface OverviewPageProps {
    allServices: Service[];
    allAppointments: Appointment[];
    allUsers: User[];
    allReviews: Review[];
    allPromotions: Promotion[];
    allInternalNotifications: InternalNotification[];
    allPayments: Payment[];
}

// Custom Date Input Component với format DD-MM-YYYY (text input với date picker)
interface CustomDateInputProps {
    label: string;
    value: string; // DD-MM-YYYY format
    onChange: (value: string) => void;
    min?: string; // DD-MM-YYYY format
    max?: string; // DD-MM-YYYY format
    error?: string;
    placeholder?: string;
}

const CustomDateInput: React.FC<CustomDateInputProps> = ({ label, value, onChange, min, max, error, placeholder = "DD-MM-YYYY" }) => {
    const [displayValue, setDisplayValue] = useState(value);
    const dateInputRef = React.useRef<HTMLInputElement>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        setDisplayValue(value);
        // Sync date input với giá trị hiện tại
        if (dateInputRef.current && value) {
            const yyyyMMdd = parseDDMMYYYYToYYYYMMDD(value);
            if (yyyyMMdd) {
                dateInputRef.current.value = yyyyMMdd;
            }
        }
    }, [value]);

    const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const yyyyMMdd = e.target.value;
        if (yyyyMMdd) {
            const formatted = formatDateDDMMYYYY(new Date(yyyyMMdd));
            setDisplayValue(formatted);
            onChange(formatted);
        }
    };

    const handleContainerClick = () => {
        // Khi click vào container (input hoặc icon), mở date picker
        if (dateInputRef.current) {
            // Sync giá trị hiện tại
            if (displayValue) {
                const yyyyMMdd = parseDDMMYYYYToYYYYMMDD(displayValue);
                if (yyyyMMdd) {
                    dateInputRef.current.value = yyyyMMdd;
                }
            }

            // Mở date picker
            setTimeout(() => {
                if (dateInputRef.current) {
                    try {
                        // Try to use showPicker if available (modern browsers)
                        if (dateInputRef.current.showPicker) {
                            dateInputRef.current.showPicker();
                        } else {
                            // Fallback: click vào input
                            dateInputRef.current.click();
                        }
                    } catch (error) {
                        // Fallback: click vào input
                        dateInputRef.current.click();
                    }
                }
            }, 10);
        }
    };

    return (
        <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <div
                ref={containerRef}
                className="relative cursor-pointer"
                onClick={handleContainerClick}
            >
                {/* Date input để mở date picker - overlay lên trên để có thể click */}
                <input
                    ref={dateInputRef}
                    type="date"
                    onChange={handlePickerChange}
                    min={min ? parseDDMMYYYYToYYYYMMDD(min) : undefined}
                    max={max ? parseDDMMYYYYToYYYYMMDD(max) : undefined}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                {/* Display input hiển thị DD-MM-YYYY */}
                <div className={`w-full p-2 pr-10 border rounded-md bg-white ${error ? 'border-red-500' : 'border-gray-300'} pointer-events-none flex items-center`}>
                    <span className={displayValue ? 'text-gray-800' : 'text-gray-400'}>
                        {displayValue || placeholder}
                    </span>
                    {/* Calendar icon */}
                    <svg
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
            </div>
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
};

export const OverviewPage: React.FC<OverviewPageProps> = ({ allServices, allAppointments, allUsers, allReviews, allPromotions, allInternalNotifications, allPayments }) => {
    // Local states để fetch dữ liệu nếu props rỗng
    const [localServices, setLocalServices] = useState<Service[]>(allServices || []);
    const [localAppointments, setLocalAppointments] = useState<Appointment[]>(allAppointments || []);
    const [localUsers, setLocalUsers] = useState<User[]>(allUsers || []);
    const [localPayments, setLocalPayments] = useState<Payment[]>(allPayments || []);

    // State cho date range selection (DD-MM-YYYY format)
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [dateError, setDateError] = useState<string>('');
    
    // State cho revenue period selection
    const [revenuePeriod, setRevenuePeriod] = useState<'total' | 'day' | 'week' | 'month'>('total');

    // Fetch dữ liệu nếu props rỗng
    useEffect(() => {
        const fetchData = async () => {
            try {
                if (!allServices || allServices.length === 0) {
                    const services = await apiService.getServices();
                    setLocalServices(services);
                } else {
                    setLocalServices(allServices);
                }

                if (!allAppointments || allAppointments.length === 0) {
                    const appointments = await apiService.getAppointments();
                    setLocalAppointments(appointments);
                } else {
                    setLocalAppointments(allAppointments);
                }

                if (!allUsers || allUsers.length === 0) {
                    const users = await apiService.getUsers();
                    setLocalUsers(users);
                } else {
                    setLocalUsers(allUsers);
                }

                if (!allPayments || allPayments.length === 0) {
                    const payments = await apiService.getPayments();
                    setLocalPayments(payments);
                } else {
                    setLocalPayments(allPayments);
                }
            } catch (error) {
                console.error('Error fetching data for OverviewPage:', error);
            }
        };
        fetchData();
    }, [allServices, allAppointments, allUsers, allPayments]);

    const now = useMemo(() => new Date(), []);
    const todayStr = now.toISOString().split('T')[0];
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Khởi tạo date range: 30 ngày trước đến hôm nay
    useEffect(() => {
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        setStartDate(formatDateDDMMYYYY(thirtyDaysAgo));
        setEndDate(formatDateDDMMYYYY(today));
    }, []);

    // Validation date range
    useEffect(() => {
        if (!startDate || !endDate) {
            setDateError('');
            return;
        }

        const start = parseDDMMYYYYToYYYYMMDD(startDate);
        const end = parseDDMMYYYYToYYYYMMDD(endDate);

        if (!start || !end) {
            setDateError('Định dạng ngày không hợp lệ');
            return;
        }

        const startDateObj = new Date(start);
        const endDateObj = new Date(end);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Reset time để so sánh ngày
        startDateObj.setHours(0, 0, 0, 0);
        endDateObj.setHours(0, 0, 0, 0);

        if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
            setDateError('Ngày không hợp lệ');
            return;
        }

        // Kiểm tra: ngày bắt đầu không được lớn hơn ngày hiện tại
        if (startDateObj > today) {
            setDateError('Ngày bắt đầu không được lớn hơn ngày hiện tại');
            return;
        }

        // Kiểm tra: ngày kết thúc không được lớn hơn ngày hiện tại
        if (endDateObj > today) {
            setDateError('Ngày kết thúc không được lớn hơn ngày hiện tại');
            return;
        }

        // Kiểm tra: ngày bắt đầu không được lớn hơn ngày kết thúc (tức là ngày B không được nhỏ hơn ngày A)
        if (startDateObj > endDateObj) {
            setDateError('Ngày bắt đầu không được lớn hơn ngày kết thúc');
            return;
        }

        setDateError('');
    }, [startDate, endDate]);

    // Tính toán doanh thu theo từng ngày trong khoảng thời gian
    const revenueChartData = useMemo(() => {
        if (!startDate || !endDate || dateError) return [];

        const start = parseDDMMYYYYToYYYYMMDD(startDate);
        const end = parseDDMMYYYYToYYYYMMDD(endDate);
        if (!start || !end) return [];

        const safePayments = Array.isArray(localPayments) && localPayments.length > 0 ? localPayments : (Array.isArray(allPayments) ? allPayments : []);

        const startDateObj = new Date(start);
        const endDateObj = new Date(end);
        const chartData: { date: string; revenue: number }[] = [];

        // Tạo mảng các ngày trong khoảng thời gian
        const currentDate = new Date(startDateObj);
        while (currentDate <= endDateObj) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const dayRevenue = safePayments
                .filter(p => {
                    if (!p || p.status !== 'Completed') return false;
                    const paymentDate = new Date(p.date);
                    const paymentDateStr = paymentDate.toISOString().split('T')[0];
                    return paymentDateStr === dateStr;
                })
                .reduce((sum, payment) => {
                    const amount = typeof payment.amount === 'number' ? payment.amount : parseFloat(String(payment.amount || 0));
                    return sum + (isNaN(amount) ? 0 : amount);
                }, 0);

            chartData.push({
                date: formatDateDDMMYYYY(currentDate),
                revenue: dayRevenue
            });

            currentDate.setDate(currentDate.getDate() + 1);
        }

        return chartData;
    }, [startDate, endDate, dateError, localPayments, allPayments]);

    // --- AGGREGATED DATA & STATS ---
    const stats = useMemo(() => {
        // Sử dụng local state nếu props rỗng, ngược lại dùng props
        const safeUsers = Array.isArray(localUsers) && localUsers.length > 0 ? localUsers : (Array.isArray(allUsers) ? allUsers : []);
        const safeAppointments = Array.isArray(localAppointments) && localAppointments.length > 0 ? localAppointments : (Array.isArray(allAppointments) ? allAppointments : []);
        const safeServices = Array.isArray(localServices) && localServices.length > 0 ? localServices : (Array.isArray(allServices) ? allServices : []);
        const safePayments = Array.isArray(localPayments) && localPayments.length > 0 ? localPayments : (Array.isArray(allPayments) ? allPayments : []);

        // Tính Tổng Khách hàng (role = 'Client')
        const clients = safeUsers.filter(u => u && u.role === 'Client');
        const totalCustomers = clients.length;

        // Tính Tổng Nhân viên (role = 'Staff' hoặc 'Admin')
        const staff = safeUsers.filter(u => u && STAFF_ROLES.includes(u.role));
        const totalStaff = staff.length;

        // Tính Tổng Dịch vụ
        const totalServices = safeServices.length;

        // Tính Tổng Lịch hẹn
        const totalAppointments = safeAppointments.length;

        // Tính Tổng Doanh thu từ payments với status = 'Completed'
        const totalRevenue = safePayments
            .filter(p => p && p.status === 'Completed')
            .reduce((sum, payment) => {
                const amount = typeof payment.amount === 'number' ? payment.amount : parseFloat(String(payment.amount || 0));
                return sum + (isNaN(amount) ? 0 : amount);
            }, 0);

        // Tính doanh thu theo period
        let displayRevenue = totalRevenue;
        
        if (revenuePeriod === 'day') {
            // Doanh thu hôm nay
            displayRevenue = safePayments
                .filter(p => {
                    if (!p || p.status !== 'Completed') return false;
                    const paymentDate = new Date(p.date);
                    const paymentDateStr = paymentDate.toISOString().split('T')[0];
                    return paymentDateStr === todayStr;
                })
                .reduce((sum, payment) => {
                    const amount = typeof payment.amount === 'number' ? payment.amount : parseFloat(String(payment.amount || 0));
                    return sum + (isNaN(amount) ? 0 : amount);
                }, 0);
        } else if (revenuePeriod === 'week') {
            // Doanh thu tuần này (từ thứ 2 đến chủ nhật)
            const today = new Date();
            const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ...
            const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Số ngày từ thứ 2
            const monday = new Date(today);
            monday.setDate(today.getDate() - diff);
            monday.setHours(0, 0, 0, 0);
            
            displayRevenue = safePayments
                .filter(p => {
                    if (!p || p.status !== 'Completed') return false;
                    const paymentDate = new Date(p.date);
                    return paymentDate >= monday && paymentDate <= today;
                })
                .reduce((sum, payment) => {
                    const amount = typeof payment.amount === 'number' ? payment.amount : parseFloat(String(payment.amount || 0));
                    return sum + (isNaN(amount) ? 0 : amount);
                }, 0);
        } else if (revenuePeriod === 'month') {
            // Doanh thu tháng này
            displayRevenue = safePayments
                .filter(p => {
                    if (!p || p.status !== 'Completed') return false;
                    const paymentDate = new Date(p.date);
                    return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
                })
                .reduce((sum, payment) => {
                    const amount = typeof payment.amount === 'number' ? payment.amount : parseFloat(String(payment.amount || 0));
                    return sum + (isNaN(amount) ? 0 : amount);
                }, 0);
        }

        return {
            totalCustomers,
            totalAppointments,
            totalRevenue: formatCurrency(displayRevenue),
            totalServices,
            totalStaff,
        };
    }, [localUsers, localAppointments, localServices, localPayments, allUsers, allAppointments, allServices, allPayments, todayStr, revenuePeriod, currentMonth, currentYear]);

    const topServices = useMemo(() => {
        const safeAppointments = Array.isArray(localAppointments) && localAppointments.length > 0 ? localAppointments : (Array.isArray(allAppointments) ? allAppointments : []);
        const safeServices = Array.isArray(localServices) && localServices.length > 0 ? localServices : (Array.isArray(allServices) ? allServices : []);

        const serviceCounts = safeAppointments.reduce((acc: Record<string, number>, app) => {
            if (app && app.serviceId) {
                acc[app.serviceId] = (acc[app.serviceId] || 0) + 1;
            }
            return acc;
        }, {});

        return Object.entries(serviceCounts)
            .sort(([, a], [, b]) => (b as number) - (a as number))
            .slice(0, 5)
            .map(([serviceId, count]) => {
                const service = safeServices.find(s => s && s.id === serviceId);
                return { name: service?.name || 'Dịch vụ không xác định', count };
            });
    }, [localAppointments, localServices, allAppointments, allServices]);

    const bookingHeatmapData: { slots: string[]; data: Record<string, number> } = useMemo(() => {
        const safeAppointments = Array.isArray(localAppointments) && localAppointments.length > 0 ? localAppointments : (Array.isArray(allAppointments) ? allAppointments : []);
        // Updated to 2 shifts: Morning (9-16h) and Afternoon (16-22h)
        const timeSlots = ['09:00', '11:00', '13:00', '15:00', '16:00', '18:00', '20:00', '21:00'];
        const data: Record<string, number> = {};

        safeAppointments.forEach(app => {
            if (app && app.time) {
                const appHour = parseInt(app.time.split(':')[0]);
                const slot = timeSlots.find(ts => {
                    const slotHour = parseInt(ts.split(':')[0]);
                    return appHour >= slotHour && appHour < slotHour + 2;
                });
                if (slot) {
                    data[slot] = (data[slot] || 0) + 1;
                }
            }
        });
        return { slots: timeSlots, data };
    }, [localAppointments, allAppointments]);

    const alerts = useMemo(() => {
        const safeAppointments = Array.isArray(localAppointments) && localAppointments.length > 0 ? localAppointments : (Array.isArray(allAppointments) ? allAppointments : []);
        const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const expiringPromos = (Array.isArray(allPromotions) ? allPromotions : []).filter(p => {
            if (!p || !p.expiryDate) return false;
            const expiry = new Date(p.expiryDate);
            return expiry > now && expiry <= sevenDaysFromNow;
        });

        const unconfirmedAppointments = safeAppointments.filter(a => a && a.status === 'pending');

        const staffOnLeave = (Array.isArray(allInternalNotifications) ? allInternalNotifications : []).filter(n => n && n.type === 'shift_change' && !n.isRead && n.message && n.message.toLowerCase().includes('nghỉ'));

        return { expiringPromos, unconfirmedAppointments, staffOnLeave };
    }, [localAppointments, allAppointments, allPromotions, allInternalNotifications, now]);


    return (
        <div className="space-y-8 pb-8">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-brand-primary via-purple-600 to-pink-500 -mx-6 -mt-6 px-6 pt-6 pb-8 mb-8 rounded-b-3xl shadow-lg">
                <h1 className="text-4xl font-extrabold text-white animate-fadeInDown drop-shadow-lg">
                    📊 Dashboard Tổng Quan
                </h1>
                <p className="text-white/90 mt-2 text-sm">Quản lý và theo dõi hiệu quả kinh doanh</p>
            </div>

            {/* Revenue Period Selector */}
            <div className="bg-gradient-to-r from-white to-gray-50 p-5 rounded-xl shadow-md border border-gray-200 flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-primary to-purple-500 flex items-center justify-center">
                        <CalendarIcon className="w-6 h-6 text-white" />
                    </div>
                    <label className="text-sm font-bold text-gray-700">Hiển thị doanh thu:</label>
                </div>
                <select 
                    value={revenuePeriod} 
                    onChange={(e) => setRevenuePeriod(e.target.value as 'total' | 'day' | 'week' | 'month')}
                    className="px-5 py-2.5 border-2 border-brand-primary/20 rounded-xl bg-white focus:ring-2 focus:ring-brand-primary focus:border-brand-primary font-semibold text-gray-800 shadow-sm hover:shadow-md transition-all cursor-pointer"
                >
                    <option value="total">Tổng (Tất cả thời gian)</option>
                    <option value="day">Hôm nay</option>
                    <option value="week">Tuần này</option>
                    <option value="month">Tháng này</option>
                </select>
                <div className="ml-auto px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                    <p className="text-xs font-semibold text-gray-700">
                        {revenuePeriod === 'total' && '📊 Hiển thị tổng doanh thu từ tất cả thời gian'}
                        {revenuePeriod === 'day' && `📅 Hiển thị doanh thu ngày ${formatDateDDMMYYYY(now)}`}
                        {revenuePeriod === 'week' && (() => {
                            const today = new Date();
                            const dayOfWeek = today.getDay();
                            const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                            const monday = new Date(today);
                            monday.setDate(today.getDate() - diff);
                            return `📆 Hiển thị doanh thu tuần (${formatDateDDMMYYYY(monday)} - ${formatDateDDMMYYYY(today)})`;
                        })()}
                        {revenuePeriod === 'month' && `🗓️ Hiển thị doanh thu tháng ${currentMonth + 1}/${currentYear}`}
                    </p>
                </div>
            </div>

            {/* Main Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                <div className="opacity-0 animate-fadeInUp" style={{ animationDelay: '100ms' }}>
                    <StatCard 
                        title={
                            revenuePeriod === 'total' ? 'TỔNG DOANH THU' :
                            revenuePeriod === 'day' ? 'DOANH THU HÔM NAY' :
                            revenuePeriod === 'week' ? 'DOANH THU TUẦN NÀY' :
                            'DOANH THU THÁNG NÀY'
                        } 
                        value={stats.totalRevenue || '0 ₫'} 
                    />
                </div>
                <div className="opacity-0 animate-fadeInUp" style={{ animationDelay: '200ms' }}>
                    <StatCard title="TỔNG LỊCH HẸN" value={String(stats.totalAppointments || 0)} />
                </div>
                <div className="opacity-0 animate-fadeInUp" style={{ animationDelay: '300ms' }}>
                    <StatCard title="TỔNG KHÁCH HÀNG" value={String(stats.totalCustomers || 0)} />
                </div>
                <div className="opacity-0 animate-fadeInUp" style={{ animationDelay: '400ms' }}>
                    <StatCard title="TỔNG DỊCH VỤ" value={String(stats.totalServices || 0)} />
                </div>
                <div className="opacity-0 animate-fadeInUp" style={{ animationDelay: '500ms' }}>
                    <StatCard title="TỔNG NHÂN VIÊN" value={String(stats.totalStaff || 0)} />
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Main content: Charts & Lists */}
                <div className="xl:col-span-2 space-y-6">
                    {/* Revenue Section */}
                    <div className="bg-gradient-to-br from-white via-gray-50 to-white p-6 rounded-2xl shadow-xl border border-gray-200 opacity-0 animate-fadeInUp" style={{ animationDelay: '600ms' }}>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg">
                                <CurrencyDollarIcon className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-extrabold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Doanh thu theo khoảng thời gian</h2>
                        </div>

                        {/* Date Range Selection */}
                        <div className="mb-4">
                            <div className="flex gap-4 items-end">
                                <CustomDateInput
                                    label="Từ ngày"
                                    value={startDate}
                                    onChange={(value) => setStartDate(value)}
                                    max={endDate || formatDateDDMMYYYY(new Date())}
                                    error={dateError}
                                />
                                <CustomDateInput
                                    label="Đến ngày"
                                    value={endDate}
                                    onChange={(value) => setEndDate(value)}
                                    min={startDate}
                                    max={formatDateDDMMYYYY(new Date())}
                                    error={dateError}
                                />
                            </div>
                            {dateError && (
                                <p className="text-red-500 text-sm mt-2">{dateError}</p>
                            )}
                        </div>

                        {/* Revenue Chart */}
                        <div className="h-80 bg-white rounded-xl p-4 border border-gray-100">
                            {revenueChartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={revenueChartData}>
                                        <defs>
                                            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#10b981" stopOpacity={0.9}/>
                                                <stop offset="100%" stopColor="#059669" stopOpacity={0.6}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                        <XAxis
                                            dataKey="date"
                                            angle={-45}
                                            textAnchor="end"
                                            height={80}
                                            tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 500 }}
                                        />
                                        <YAxis
                                            tickFormatter={(value) => String(value.toLocaleString())}
                                            tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 500 }}
                                        />
                                        <Tooltip
                                            formatter={(value: number) => formatCurrency(value)}
                                            labelFormatter={(label) => `Ngày: ${label}`}
                                            contentStyle={{ 
                                                backgroundColor: 'white',
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '8px',
                                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                            }}
                                        />
                                        <Legend 
                                            wrapperStyle={{ fontWeight: 600, fontSize: '13px' }}
                                        />
                                        <Bar
                                            dataKey="revenue"
                                            fill="url(#revenueGradient)"
                                            name="Doanh thu (VNĐ)"
                                            radius={[8, 8, 0, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl text-gray-400">
                                    <CurrencyDollarIcon className="w-16 h-16 mb-3 opacity-30" />
                                    <p className="italic font-medium">{dateError ? 'Vui lòng chọn khoảng thời gian hợp lệ' : 'Chưa có dữ liệu doanh thu trong khoảng thời gian này'}</p>
                                </div>
                            )}
                        </div>

                        {/* Total Revenue Summary */}
                        {revenueChartData.length > 0 && !dateError && (
                            <div className="mt-6 p-5 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 rounded-xl border-2 border-green-200 shadow-md">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg">
                                            <span className="text-2xl">💰</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-600">Tổng doanh thu</p>
                                            <p className="text-3xl font-extrabold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                                {formatCurrency(revenueChartData.reduce((sum, item) => sum + item.revenue, 0))}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500">Thời gian</p>
                                        <p className="text-sm font-bold text-gray-700">{startDate} - {endDate}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Top Services & Retention */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gradient-to-br from-white via-blue-50/30 to-white p-6 rounded-2xl shadow-xl border border-gray-200 opacity-0 animate-fadeInUp" style={{ animationDelay: '700ms' }}>
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center shadow-lg">
                                    <TrophyIcon className="w-6 h-6 text-white" />
                                </div>
                                <h2 className="text-xl font-extrabold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Top 5 Dịch vụ phổ biến nhất</h2>
                            </div>
                            <ul className="space-y-3">
                                {topServices.map((service, index) => (
                                    <li key={index} className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                                index === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white' :
                                                index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white' :
                                                index === 2 ? 'bg-gradient-to-br from-orange-400 to-red-500 text-white' :
                                                'bg-gradient-to-br from-blue-400 to-indigo-500 text-white'
                                            }`}>
                                                {index + 1}
                                            </div>
                                            <span className="font-semibold text-gray-700">{service.name}</span>
                                        </div>
                                        <span className="font-bold text-brand-primary bg-brand-primary/10 px-3 py-1 rounded-full text-sm">{service.count.toLocaleString()} lượt</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
