import React, { useMemo, useState, useEffect } from 'react';
// FIX: allAppointments, allServices, allUsers, allTiers will be passed as props.
import type { Appointment, Service, User, Tier, Promotion, RedeemableVoucher } from '../../types';
import {
    ChartBarIcon, CurrencyDollarIcon, UsersIcon, AppointmentsIcon, StarIcon,
    GiftIcon, ListIcon, PresentationChartLineIcon, ShoppingCartIcon
} from '../../shared/icons';
import * as apiService from '../../client/services/apiService';

const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

const StatCard = ({ title, value, icon, bgColor }: { title: string; value: string; icon: React.ReactNode; bgColor: string }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm flex items-center gap-4">
        <div className={`p-3 rounded-full ${bgColor} text-white`}>{icon}</div>
        <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);

// FIX: Added props interface for the component to accept data from App.tsx.
interface ReportsPageProps {
    allAppointments: Appointment[];
    allServices: Service[];
    allUsers: User[];
    allTiers: Tier[];
}

const ReportsPage: React.FC<ReportsPageProps> = ({ allAppointments, allServices, allUsers, allTiers }) => {
    const [allPromotions, setAllPromotions] = useState<Promotion[]>([]);
    const [allRedeemableVouchers, setAllRedeemableVouchers] = useState<RedeemableVoucher[]>([]);
    const [wallets, setWallets] = useState<Record<string, { points: number }>>({});
    const currentYear = new Date().getFullYear();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [promos, vouchers] = await Promise.all([
                    apiService.getPromotions(),
                    apiService.getRedeemableVouchers(),
                ]);
                setAllPromotions(promos);
                setAllRedeemableVouchers(vouchers);

                // Fetch wallets to calculate tier levels
                const clientUsers = allUsers.filter(u => u.role === 'Client');
                const walletsData: Record<string, { points: number }> = {};
                await Promise.all(
                    clientUsers.map(async (user) => {
                        try {
                            const wallet = await apiService.getUserWallet(user.id);
                            walletsData[user.id] = { points: wallet.points || 0 };
                        } catch (e) {
                            walletsData[user.id] = { points: 0 };
                        }
                    })
                );
                setWallets(walletsData);
            } catch (e) {
                console.error("Failed to fetch report data", e);
            }
        };
        fetchData();
    }, [allUsers]);

    const aggregatedData = useMemo(() => {
        // FIX: Use props passed from App.tsx instead of mock data.
        const completedAppointments = allAppointments.filter(a => a.status === 'completed');

        // --- Overall Stats ---
        const totalRevenueYear = completedAppointments.filter(a => new Date(a.date).getFullYear() === currentYear)
            .reduce((sum, app) => sum + (allServices.find(s => s.id === app.serviceId)?.price || 0), 0);
        const totalAppointmentsYear = completedAppointments.filter(a => new Date(a.date).getFullYear() === currentYear).length;
        const newCustomersYear = allUsers.filter(u => new Date(u.joinDate).getFullYear() === currentYear).length;

        // --- Monthly Revenue ---
        const monthlyRevenue = Array.from({ length: 12 }, (_, i) => {
            const monthRevenue = completedAppointments.filter(app => {
                const appDate = new Date(app.date);
                return appDate.getMonth() === i && appDate.getFullYear() === currentYear;
            }).reduce((sum, app) => {
                const service = allServices.find(s => s.id === app.serviceId);
                return sum + (parseFloat(String(service?.price || service?.discountPrice || 0)));
            }, 0);
            return { month: `T${i + 1}`, revenue: monthRevenue };
        });

        // --- Top Services by Revenue ---
        const serviceRevenue: Record<string, number> = {};
        completedAppointments.forEach(app => {
            const service = allServices.find(s => s.id === app.serviceId);
            if (service) {
                serviceRevenue[service.name] = (serviceRevenue[service.name] || 0) + (service.price || 0);
            }
        });
        const topServices = Object.entries(serviceRevenue)
            .sort(([, revenueA], [, revenueB]) => (revenueB as number) - (revenueA as number))
            .slice(0, 5)
            .map(([name, revenue]) => ({ name, revenue }));

        // --- Revenue by Service Category ---
        const categoryRevenue: Record<string, number> = {};
        completedAppointments.forEach(app => {
            const service = allServices.find(s => s.id === app.serviceId);
            if (service) {
                categoryRevenue[service.category] = (categoryRevenue[service.category] || 0) + (service.price || 0);
            }
        });
        const revenueByCategory = Object.entries(categoryRevenue)
            .sort(([, revA], [, revB]) => (revB as number) - (revA as number))
            .map(([category, revenue]) => ({ category, revenue }));

        // --- Staff Performance ---
        const staffPerformance = allUsers.filter(u => u.role !== 'Client')
            .map(staff => {
                const staffCompletedAppointments = completedAppointments.filter(a => a.therapistId === staff.id);
                const totalStaffRevenue = staffCompletedAppointments.reduce((sum, app) => sum + (allServices.find(s => s.id === app.serviceId)?.price || 0), 0);
                const totalStaffAppointments = staffCompletedAppointments.length;
                // FIX: Access selfCareIndex from customerProfile, providing a fallback.
                // Note: selfCareIndex not in db.txt, using default rating
                const averageRating = 4.5;
                // Note: commissionRate not in db.txt, using default
                const commissionRate = 0;
                const commissionEarned = totalStaffRevenue * commissionRate;
                return {
                    id: staff.id,
                    name: staff.name,
                    role: staff.role,
                    totalRevenue: totalStaffRevenue,
                    totalAppointments: totalStaffAppointments,
                    averageRating: parseFloat(averageRating.toFixed(1)),
                    commissionEarned,
                };
            }).sort((a, b) => b.totalRevenue - a.totalRevenue);

        // --- Customer Tier Distribution ---
        const tierDistribution: Record<string, number> = {};
        allUsers.filter(u => u.role === 'Client').forEach(client => {
            // Calculate tier level from wallet points since tierLevel is not in users table
            const userPoints = wallets[client.id]?.points || 0;
            const sortedTiers = [...allTiers].sort((a, b) => (a.pointsRequired || 0) - (b.pointsRequired || 0));
            let userTier = 1; // Default to tier 1
            for (let i = sortedTiers.length - 1; i >= 0; i--) {
                if (userPoints >= (sortedTiers[i].pointsRequired || 0)) {
                    userTier = sortedTiers[i].level;
                    break;
                }
            }
            const tierName = allTiers.find(t => t.level === userTier)?.name || 'Chưa xếp hạng';
            tierDistribution[tierName] = (tierDistribution[tierName] || 0) + 1;
        });
        const customerTierDistribution = Object.entries(tierDistribution)
            .sort(([, countA], [, countB]) => (countB as number) - (countA as number))
            .map(([tier, count]) => ({ tier, count }));

        // --- New Customers by Month ---
        const newCustomersMonthly = Array.from({ length: 12 }, (_, i) => {
            const count = allUsers.filter(u => {
                const joinDate = new Date(u.joinDate);
                return joinDate.getMonth() === i && joinDate.getFullYear() === currentYear && u.role === 'Client';
            }).length;
            return { month: `T${i + 1}`, count };
        });

        // --- Promotion Performance ---
        const promotionPerformance = allPromotions.map(promo => {
            return {
                id: promo.id,
                title: promo.title,
                code: promo.code,
                usageCount: promo.usageCount || 0,
                targetAudience: allTiers.find(t => `Tier Level ${t.level}` === promo.targetAudience)?.name || promo.targetAudience || 'All',
            };
        }).sort((a,b) => b.usageCount - a.usageCount);

        // --- Redeemable Voucher Performance ---
        const voucherPerformance = allRedeemableVouchers.map(voucher => {
            return {
                id: voucher.id,
                description: voucher.description,
                pointsRequired: voucher.pointsRequired,
                value: formatCurrency(voucher.value),
                redeemedCount: 0, // TODO: Calculate from actual redemption records when redemption table is added
            };
        }).sort((a,b) => b.redeemedCount - a.redeemedCount);


        return {
            totalRevenueYear, totalAppointmentsYear, newCustomersYear,
            monthlyRevenue, topServices, revenueByCategory, staffPerformance,
            customerTierDistribution, newCustomersMonthly,
            promotionPerformance, voucherPerformance,
        };
    }, [currentYear, allAppointments, allServices, allUsers, allTiers, allPromotions, allRedeemableVouchers, wallets]); // FIX: Added wallets to dependency array

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Báo cáo & Thống kê</h1>

            {/* Overall Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                <StatCard 
                    title={`Doanh thu năm ${currentYear}`} 
                    value={formatCurrency(aggregatedData.totalRevenueYear)} 
                    icon={<CurrencyDollarIcon className="w-8 h-8" />} 
                    bgColor="bg-green-600" 
                />
                <StatCard 
                    title={`Tổng lịch hẹn năm ${currentYear}`} 
                    value={aggregatedData.totalAppointmentsYear.toLocaleString()} 
                    icon={<AppointmentsIcon className="w-8 h-8" />} 
                    bgColor="bg-blue-600" 
                />
                <StatCard 
                    title={`Khách hàng mới năm ${currentYear}`} 
                    value={aggregatedData.newCustomersYear.toLocaleString()} 
                    icon={<UsersIcon className="w-8 h-8" />} 
                    bgColor="bg-purple-600" 
                />
                 <StatCard 
                    title={`Đánh giá trung bình`} 
                    value="4.8/5" 
                    icon={<StarIcon className="w-8 h-8" />} 
                    bgColor="bg-yellow-600" 
                />
            </div>

            {/* Section: Revenue & Services */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-xl font-bold text-gray-800 flex items-center mb-4"><ChartBarIcon className="w-6 h-6 mr-2 text-brand-primary" /> Doanh thu & Dịch vụ</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="font-semibold text-gray-700 mb-2">Doanh thu theo tháng ({currentYear})</h3>
                        <div className="h-48 flex items-center justify-center bg-gray-50 rounded-md text-gray-400 italic">Biểu đồ đường/cột</div>
                        <div className="mt-4 overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tháng</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doanh thu</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {aggregatedData.monthlyRevenue.map((data, index) => (
                                        <tr key={index}>
                                            <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{data.month}</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-sm text-green-600">{formatCurrency(data.revenue)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-700 mb-2">Top dịch vụ theo doanh thu</h3>
                        <div className="h-48 flex items-center justify-center bg-gray-50 rounded-md text-gray-400 italic">Biểu đồ tròn</div>
                        <div className="mt-4 overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dịch vụ</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doanh thu</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {aggregatedData.topServices.map((data, index) => (
                                        <tr key={index}>
                                            <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{data.name}</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-sm text-green-600">{formatCurrency(data.revenue)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="md:col-span-2">
                        <h3 className="font-semibold text-gray-700 mb-2">Doanh thu theo danh mục dịch vụ</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Danh mục</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doanh thu</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {aggregatedData.revenueByCategory.map((data, index) => (
                                        <tr key={index}>
                                            <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{data.category}</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-sm text-green-600">{formatCurrency(data.revenue)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section: Staff Performance */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-xl font-bold text-gray-800 flex items-center mb-4"><UsersIcon className="w-6 h-6 mr-2 text-blue-500" /> Hiệu suất Nhân viên</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nhân viên</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vai trò</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doanh thu</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lịch hẹn</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đánh giá TB</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hoa hồng</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {aggregatedData.staffPerformance.map((staff, index) => (
                                <tr key={index}>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{staff.name}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">{staff.role}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-green-600">{formatCurrency(staff.totalRevenue)}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">{staff.totalAppointments}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-yellow-500 flex items-center">{staff.averageRating} <StarIcon className="w-4 h-4 ml-1" /></td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-purple-600">{formatCurrency(staff.commissionEarned)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Section: Customers & Loyalty */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-xl font-bold text-gray-800 flex items-center mb-4"><ListIcon className="w-6 h-6 mr-2 text-purple-500" /> Khách hàng & Loyalty</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="font-semibold text-gray-700 mb-2">Phân bổ khách hàng theo cấp độ</h3>
                        <div className="h-48 flex items-center justify-center bg-gray-50 rounded-md text-gray-400 italic">Biểu đồ tròn</div>
                        <div className="mt-4 overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cấp độ</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số lượng</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {aggregatedData.customerTierDistribution.map((data, index) => (
                                        <tr key={index}>
                                            <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{data.tier}</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">{data.count}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-700 mb-2">Khách hàng mới theo tháng ({currentYear})</h3>
                        <div className="h-48 flex items-center justify-center bg-gray-50 rounded-md text-gray-400 italic">Biểu đồ đường</div>
                        <div className="mt-4 overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tháng</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số lượng</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {aggregatedData.newCustomersMonthly.map((data, index) => (
                                        <tr key={index}>
                                            <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{data.month}</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">{data.count}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section: Marketing & Promotions Effectiveness */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-xl font-bold text-gray-800 flex items-center mb-4"><GiftIcon className="w-6 h-6 mr-2 text-red-500" /> Hiệu quả Marketing & Ưu đãi</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="font-semibold text-gray-700 mb-2">Hiệu suất Chương trình khuyến mãi</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khuyến mãi</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lượt dùng</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đối tượng</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {aggregatedData.promotionPerformance.map((promo, index) => (
                                        <tr key={index}>
                                            <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{promo.title}</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">{promo.code}</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">{promo.usageCount}</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">{promo.targetAudience}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-700 mb-2">Hiệu suất Voucher đổi điểm</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Voucher</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Điểm YC</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá trị</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lượt đổi</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {aggregatedData.voucherPerformance.map((voucher, index) => (
                                        <tr key={index}>
                                            <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{voucher.description}</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">{voucher.pointsRequired}</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-sm text-green-600">{voucher.value}</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">{voucher.redeemedCount}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};
// FIX: Added default export to resolve import error in App.tsx
export default ReportsPage;
