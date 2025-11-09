import React, { useState, useMemo } from 'react';
import type { User, Payment, PaymentMethod, PaymentStatus, Service, Appointment } from '../../types';

// Icons
import { CurrencyDollarIcon, CalendarIcon, UserGroupIcon, SearchIcon } from '../../shared/icons';


interface StaffTransactionHistoryPageProps {
    currentUser: User;
    allServices: Service[];
    allUsers: User[];
    allAppointments: Appointment[];
    allPayments: Payment[];
}

const PAYMENTS_PER_PAGE = 10;
const PAYMENT_METHODS: PaymentMethod[] = ['Cash', 'Card', 'Momo', 'VNPay', 'ZaloPay'];
const PAYMENT_STATUSES: PaymentStatus[] = ['Completed', 'Pending', 'Refunded', 'Failed'];
const STATUS_CONFIG: Record<PaymentStatus, { text: string; color: string; bgColor: string; }> = {
    Completed: { text: 'Hoàn thành', color: 'text-green-800', bgColor: 'bg-green-100' },
    Pending: { text: 'Chờ xử lý', color: 'text-yellow-800', bgColor: 'bg-yellow-100' },
    Refunded: { text: 'Đã hoàn tiền', color: 'text-red-800', bgColor: 'bg-red-100' },
    Failed: { text: 'Thất bại', color: 'text-red-800', bgColor: 'bg-red-100' },
};
const METHOD_TEXT: Record<PaymentMethod, string> = {
    Cash: 'Tiền mặt', Card: 'Thẻ', Momo: 'Momo', VNPay: 'VNPay', ZaloPay: 'ZaloPay'
};

const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm flex items-center gap-4">
        <div className={`p-3 rounded-full ${color}`}>{icon}</div>
        <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);

const Pagination: React.FC<{ currentPage: number; totalPages: number; onPageChange: (page: number) => void; }> = ({ currentPage, totalPages, onPageChange }) => (
    <div className="mt-6 flex justify-between items-center">
        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="px-4 py-2 text-sm bg-white border rounded-md disabled:opacity-50">Trước</button>
        <span className="text-sm text-gray-600">Trang {currentPage} / {totalPages}</span>
        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-4 py-2 text-sm bg-white border rounded-md disabled:opacity-50">Sau</button>
    </div>
);


export const StaffTransactionHistoryPage: React.FC<StaffTransactionHistoryPageProps> = ({ currentUser, allServices, allUsers, allAppointments, allPayments }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterClient, setFilterClient] = useState('all');
    const [filterMethod, setFilterMethod] = useState<PaymentMethod | 'All'>('All');
    const [filterStatus, setFilterStatus] = useState<PaymentStatus | 'All'>('All');
    const [filterDateRange, setFilterDateRange] = useState({ start: '', end: '' });
    const [currentPage, setCurrentPage] = useState(1);

    const staffClients = useMemo(() => {
        // Get unique client IDs that this staff has served
        const clientIds = new Set(
            allAppointments
                .filter(app => app.therapistId === currentUser.id && app.status === 'completed')
                .map(app => app.userId)
        );
        return allUsers.filter(user => clientIds.has(user.id));
    }, [currentUser.id, allUsers, allAppointments]);

    const myPayments = useMemo(() => {
        return allPayments.filter(p => p.therapistId === currentUser.id);
    }, [allPayments, currentUser.id]);

    const stats = useMemo(() => {
        // Note: commissionRate not in db.txt, using default 0
        const totalCommission = 0;
        const totalServicesPerformed = myPayments.filter(p => p.status === 'Completed' && p.appointmentId).length;
        // Note: productId removed from Payment - products table removed from db.txt
        const totalProductsSold = 0;
        return { totalCommission, totalServicesPerformed, totalProductsSold };
    }, [myPayments]);

    const filteredPayments = useMemo(() => {
        return myPayments
            .filter(p => {
                const client = allUsers.find(u => u.id === p.userId);
                const service = p.serviceName;
                const searchLower = searchTerm.toLowerCase();
                return p.transactionId.toLowerCase().includes(searchLower) ||
                    (client && client.name.toLowerCase().includes(searchLower)) ||
                    (service && service.toLowerCase().includes(searchLower));
            })
            .filter(p => filterClient === 'all' || p.userId === filterClient)
            .filter(p => filterMethod === 'All' || p.method === filterMethod)
            .filter(p => filterStatus === 'All' || p.status === filterStatus)
            .filter(p => {
                if (!filterDateRange.start && !filterDateRange.end) return true;
                const paymentDate = new Date(p.date);
                const startDate = filterDateRange.start ? new Date(filterDateRange.start) : null;
                const endDate = filterDateRange.end ? new Date(filterDateRange.end) : null;
                if (startDate) startDate.setHours(0, 0, 0, 0);
                if (endDate) endDate.setHours(23, 59, 59, 999);
                return (!startDate || paymentDate >= startDate) && (!endDate || paymentDate <= endDate);
            });
    }, [myPayments, searchTerm, filterClient, filterMethod, filterStatus, filterDateRange, allUsers]);

    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterClient, filterMethod, filterStatus, filterDateRange]);

    const totalPages = Math.ceil(filteredPayments.length / PAYMENTS_PER_PAGE);
    const paginatedPayments = useMemo(() => {
        const startIndex = (currentPage - 1) * PAYMENTS_PER_PAGE;
        return filteredPayments.slice(startIndex, startIndex + PAYMENTS_PER_PAGE);
    }, [filteredPayments, currentPage]);

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Lịch sử giao dịch của tôi</h1>
            <p className="text-gray-600 mb-8">Tổng quan về các giao dịch bạn đã thực hiện và hoa hồng nhận được.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <StatCard title="Tổng hoa hồng" value={formatPrice(stats.totalCommission)} icon={<CurrencyDollarIcon className="w-6 h-6" />} color="bg-purple-100 text-purple-600" />
                <StatCard title="Số dịch vụ đã làm" value={stats.totalServicesPerformed.toString()} icon={<CalendarIcon className="w-6 h-6" />} color="bg-blue-100 text-blue-600" />
                <StatCard title="Số sản phẩm đã bán" value={stats.totalProductsSold.toString()} icon={<UserGroupIcon className="w-6 h-6" />} color="bg-green-100 text-green-600" />
            </div>

            <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="relative">
                        <input type="text" placeholder="Tìm kiếm theo mã GD, khách hàng, DV..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full p-2 pl-10 border rounded-md" />
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                    <select value={filterClient} onChange={e => setFilterClient(e.target.value)} className="p-2 border rounded-md bg-white">
                        <option value="all">Tất cả khách hàng</option>
                        {staffClients.map(client => <option key={client.id} value={client.id}>{client.name}</option>)}
                    </select>
                    <select value={filterMethod} onChange={e => setFilterMethod(e.target.value as any)} className="p-2 border rounded-md bg-white">
                        <option value="All">Tất cả phương thức</option>
                        {PAYMENT_METHODS.map(m => <option key={m} value={m}>{METHOD_TEXT[m]}</option>)}
                    </select>
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className="p-2 border rounded-md bg-white">
                        <option value="All">Tất cả trạng thái</option>
                        {PAYMENT_STATUSES.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].text}</option>)}
                    </select>
                    <div className="flex items-center gap-2 lg:col-span-2">
                        <input type="date" value={filterDateRange.start} onChange={e => setFilterDateRange(p => ({ ...p, start: e.target.value }))} className="w-full p-2 border rounded-md text-sm" />
                        <span className="text-gray-500">-</span>
                        <input type="date" value={filterDateRange.end} onChange={e => setFilterDateRange(p => ({ ...p, end: e.target.value }))} className="w-full p-2 border rounded-md text-sm" />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                <table className="w-full whitespace-nowrap">
                    <thead className="bg-gray-50 border-b">
                        <tr className="text-left text-sm font-semibold text-gray-600">
                            <th className="p-4">Mã GD</th>
                            <th className="p-4">Khách hàng</th>
                            <th className="p-4">Dịch vụ/Sản phẩm</th>
                            <th className="p-4">Tổng tiền</th>
                            <th className="p-4">Hoa hồng</th>
                            <th className="p-4">Phương thức</th>
                            <th className="p-4">Trạng thái</th>
                            <th className="p-4">Ngày</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedPayments.length > 0 ? (
                            paginatedPayments.map(payment => {
                                const client = allUsers.find(u => u.id === payment.userId);
                                // FIX: Property 'commissionRate' does not exist on type 'User'.
                                // Note: commissionRate not in db.txt
                                const commissionAmount = 0;
                                return (
                                    <tr key={payment.id} className="border-b hover:bg-gray-50">
                                        <td className="p-4 font-mono text-xs">{payment.transactionId}</td>
                                        <td className="p-4">
                                            {client ? (<div className="flex items-center gap-3"><img src={client.profilePictureUrl} alt={client.name} className="w-8 h-8 rounded-full" /><div><p className="font-semibold text-gray-800 text-sm">{client.name}</p></div></div>) : "Không rõ"}
                                        </td>
                                        <td className="p-4 text-sm">{payment.serviceName || 'Dịch vụ không rõ'}</td>
                                        <td className="p-4 text-sm font-semibold text-brand-primary">{formatPrice(payment.amount)}</td>
                                        <td className="p-4 text-sm font-semibold text-purple-600">{formatPrice(commissionAmount)}</td>
                                        <td className="p-4 text-sm">{METHOD_TEXT[payment.method]}</td>
                                        <td className="p-4"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${STATUS_CONFIG[payment.status].bgColor} ${STATUS_CONFIG[payment.status].color}`}>{STATUS_CONFIG[payment.status].text}</span></td>
                                        <td className="p-4 text-sm">{new Date(payment.date).toLocaleDateString('vi-VN')}</td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={8} className="text-center py-10 text-gray-500">Không tìm thấy giao dịch nào.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {totalPages > 0 ? (
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            ) : (
                <div className="text-center py-10 text-gray-500">Không có giao dịch nào để hiển thị.</div>
            )}
        </div>
    );
};