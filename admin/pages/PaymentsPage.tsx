import React, { useState, useMemo, useEffect } from 'react';
import type { Payment, PaymentMethod, PaymentStatus, User } from '../../types';
import { SearchIcon, CurrencyDollarIcon, CheckCircleIcon, ClockIcon, PrinterIcon, ArrowUturnLeftIcon } from '../../shared/icons';
import * as apiService from '../../client/services/apiService'; // Import API service

const PAYMENTS_PER_PAGE = 10;
const PAYMENT_METHODS: PaymentMethod[] = ['Cash', 'Card', 'Momo', 'VNPay', 'ZaloPay'];
const PAYMENT_STATUSES: PaymentStatus[] = ['Completed', 'Pending', 'Refunded'];
const STATUS_CONFIG: Record<PaymentStatus, { text: string; color: string; bgColor: string; }> = {
    Completed: { text: 'Hoàn thành', color: 'text-green-800', bgColor: 'bg-green-100' },
    Pending: { text: 'Chờ xử lý', color: 'text-yellow-800', bgColor: 'bg-yellow-100' },
    Refunded: { text: 'Đã hoàn tiền', color: 'text-red-800', bgColor: 'bg-red-100' },
};
const METHOD_TEXT: Record<PaymentMethod, string> = {
    Cash: 'Tiền mặt', Card: 'Thẻ', Momo: 'Momo', VNPay: 'VNPay', ZaloPay: 'ZaloPay'
};

const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; color: string; isLoading?: boolean }> = ({ title, value, icon, color, isLoading = false }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm flex items-center gap-4">
        <div className={`p-3 rounded-full ${color}`}>{icon}</div>
        <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            {isLoading ? (
                <div className="h-6 bg-gray-200 rounded w-24 animate-pulse mt-1"></div>
            ) : (
                <p className="text-2xl font-bold text-gray-800">{value}</p>
            )}
        </div>
    </div>
);

const Pagination: React.FC<{ currentPage: number; totalPages: number; onPageChange: (page: number) => void; }> = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;
    const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

    return (
        <nav className="mt-6 flex justify-between items-center">
            <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="px-4 py-2 text-sm bg-white border rounded-md disabled:opacity-50">Trước</button>
            <span className="text-sm text-gray-600">Trang {currentPage} / {totalPages}</span>
            <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-4 py-2 text-sm bg-white border rounded-md disabled:opacity-50">Sau</button>
        </nav>
    );
};

interface PaymentsPageProps {
    allUsers: User[]; // FIX: Added allUsers prop
}

const PaymentsPage: React.FC<PaymentsPageProps> = ({ allUsers }) => {
    const [payments, setPayments] = useState<Payment[]>([]);
    // FIX: Removed local users state as it's now passed as a prop.
    // const [users, setUsers] = useState<User[]>([]); 
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterMethod, setFilterMethod] = useState<PaymentMethod | 'All'>('All');
    const [filterStatus, setFilterStatus] = useState<PaymentStatus | 'All'>('All');
    const [filterDateRange, setFilterDateRange] = useState({ start: '', end: '' });
    const [currentPage, setCurrentPage] = useState(1);
    
    useEffect(() => {
        const fetchPaymentData = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const fetchedPayments = await apiService.getPayments();
                setPayments(fetchedPayments);
                // FIX: allUsers is now a prop, no need to fetch here.
                // const fetchedUsers = await apiService.getUsers();
                // setUsers(fetchedUsers);
            } catch (err: any) {
                console.error("Error fetching payments:", err);
                setError(err.message || "Không thể tải danh sách thanh toán.");
                setPayments([]);
                // FIX: Reset local states that were derived from props if error occurs.
                // setUsers([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPaymentData();
    }, [allUsers]); // Depend on allUsers prop to trigger re-fetch if it changes


    const stats = useMemo(() => {
        if (isLoading || error) return { totalRevenue: 0, successfulTransactions: 0, pendingTransactions: 0 };
        const totalRevenue = payments.filter(p => p.status === 'Completed').reduce((sum, p) => sum + p.amount, 0);
        const successfulTransactions = payments.filter(p => p.status === 'Completed').length;
        const pendingTransactions = payments.filter(p => p.status === 'Pending').length;
        return { totalRevenue, successfulTransactions, pendingTransactions };
    }, [payments, isLoading, error]);

    const filteredPayments = useMemo(() => {
        return payments
            .filter(p => {
                const user = allUsers.find(u => u.id === p.userId); // FIX: Use allUsers prop
                const searchLower = searchTerm.toLowerCase();
                return p.transactionId.toLowerCase().includes(searchLower) || (user && user.name.toLowerCase().includes(searchLower));
            })
            .filter(p => filterMethod === 'All' || p.method === filterMethod)
            .filter(p => filterStatus === 'All' || p.status === filterStatus)
            .filter(p => {
                if (!filterDateRange.start && !filterDateRange.end) return true;
                const paymentDate = new Date(p.date);
                const startDate = filterDateRange.start ? new Date(filterDateRange.start) : null;
                const endDate = filterDateRange.end ? new Date(filterDateRange.end) : null;
                if(startDate) startDate.setHours(0,0,0,0);
                if(endDate) endDate.setHours(23,59,59,999);
                return (!startDate || paymentDate >= startDate) && (!endDate || paymentDate <= endDate);
            });
    }, [payments, searchTerm, filterMethod, filterStatus, filterDateRange, allUsers]); // FIX: Use allUsers prop

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterMethod, filterStatus, filterDateRange]);

    const totalPages = Math.ceil(filteredPayments.length / PAYMENTS_PER_PAGE);
    const paginatedPayments = useMemo(() => {
        const startIndex = (currentPage - 1) * PAYMENTS_PER_PAGE;
        return filteredPayments.slice(startIndex, startIndex + PAYMENTS_PER_PAGE);
    }, [filteredPayments, currentPage]);

    const handleRefund = async (paymentId: string) => {
        if (window.confirm("Bạn có chắc chắn muốn hoàn tiền cho giao dịch này?")) {
            try {
                const updatedPayment = await apiService.updatePayment(paymentId, { status: 'Refunded' });
                setPayments(prev => prev.map(p => p.id === updatedPayment.id ? updatedPayment : p));
            } catch (err: any) {
                console.error("Error refunding payment:", err);
                alert(`Hoàn tiền thất bại: ${err.message || String(err)}`);
            }
        }
    };
    
    const handlePrint = (paymentId: string) => {
        alert(`Đang chuẩn bị in hóa đơn cho giao dịch #${paymentId.slice(0, 8)}... (Mock chức năng in)`);
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Quản lý Thanh toán</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <StatCard title="Tổng doanh thu" value={formatPrice(stats.totalRevenue)} icon={<CurrencyDollarIcon className="w-6 h-6" />} color="bg-green-100 text-green-600" isLoading={isLoading} />
                <StatCard title="Giao dịch thành công" value={stats.successfulTransactions.toString()} icon={<CheckCircleIcon className="w-6 h-6" />} color="bg-blue-100 text-blue-600" isLoading={isLoading} />
                <StatCard title="Chờ xử lý" value={stats.pendingTransactions.toString()} icon={<ClockIcon className="w-6 h-6" />} color="bg-yellow-100 text-yellow-600" isLoading={isLoading} />
            </div>

            <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="relative"><input type="text" placeholder="Tìm kiếm..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full p-2 pl-10 border rounded-md" /><SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /></div>
                    <select value={filterMethod} onChange={e => setFilterMethod(e.target.value as any)} className="p-2 border rounded-md bg-white">
                        <option value="All">Tất cả phương thức</option>
                        {PAYMENT_METHODS.map(m => <option key={m} value={m}>{METHOD_TEXT[m]}</option>)}
                    </select>
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className="p-2 border rounded-md bg-white">
                        <option value="All">Tất cả trạng thái</option>
                        {PAYMENT_STATUSES.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].text}</option>)}
                    </select>
                    <div className="flex items-center gap-2">
                        <input type="date" value={filterDateRange.start} onChange={e => setFilterDateRange(p => ({...p, start: e.target.value}))} className="w-full p-2 border rounded-md text-sm"/>
                        <span className="text-gray-500">-</span>
                        <input type="date" value={filterDateRange.end} onChange={e => setFilterDateRange(p => ({...p, end: e.target.value}))} className="w-full p-2 border rounded-md text-sm"/>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="text-center py-10 bg-white rounded-lg shadow-md">
                    <p className="text-lg text-gray-500">Đang tải giao dịch...</p>
                </div>
            ) : error ? (
                <div className="text-center py-10 bg-white rounded-lg shadow-md">
                    <p className="text-lg text-red-500">Lỗi: {error}</p>
                </div>
            ) : paginatedPayments.length > 0 ? (
                <>
                    <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                        <table className="w-full whitespace-nowrap">
                            <thead className="bg-gray-50 border-b"><tr className="text-left text-sm font-semibold text-gray-600"><th className="p-4">Mã Giao dịch</th><th className="p-4">Khách hàng</th><th className="p-4">Dịch vụ</th><th className="p-4">Tổng tiền</th><th className="p-4">Phương thức</th><th className="p-4">Trạng thái</th><th className="p-4">Ngày</th><th className="p-4">Hành động</th></tr></thead>
                            <tbody>
                                {paginatedPayments.map(payment => {
                                    const user = allUsers.find(u => u.id === payment.userId); // FIX: Use allUsers prop
                                    return (
                                    <tr key={payment.id} className="border-b hover:bg-gray-50">
                                        <td className="p-4 font-mono text-xs">{payment.transactionId}</td>
                                        <td className="p-4">
                                            {user ? (<div className="flex items-center gap-3"><img src={user.profilePictureUrl} alt={user.name} className="w-8 h-8 rounded-full" /><div><p className="font-semibold text-gray-800 text-sm">{user.name}</p></div></div>) : "Không rõ"}
                                        </td>
                                        <td className="p-4 text-sm">{payment.serviceName}</td>
                                        <td className="p-4 text-sm font-semibold text-brand-primary">{formatPrice(payment.amount)}</td>
                                        <td className="p-4 text-sm">{METHOD_TEXT[payment.method]}</td>
                                        <td className="p-4"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${STATUS_CONFIG[payment.status].bgColor} ${STATUS_CONFIG[payment.status].color}`}>{STATUS_CONFIG[payment.status].text}</span></td>
                                        <td className="p-4 text-sm">{new Date(payment.date).toLocaleDateString('vi-VN')}</td>
                                        <td className="p-4"><div className="flex items-center gap-1">
                                            {payment.status === 'Completed' && <button onClick={() => handleRefund(payment.id)} className="p-2 text-gray-500 hover:text-orange-600" title="Hoàn tiền"><ArrowUturnLeftIcon className="w-5 h-5" /></button>}
                                            <button onClick={() => handlePrint(payment.id)} className="p-2 text-gray-500 hover:text-blue-600" title="In hóa đơn"><PrinterIcon className="w-5 h-5" /></button>
                                        </div></td>
                                    </tr>
                                )})}
                            </tbody>
                        </table>
                    </div>
                    {totalPages > 0 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
                </>
            ) : (
                <div className="text-center py-10 text-gray-500">Không tìm thấy giao dịch nào.</div>
            )}
        </div>
    );
};

export default PaymentsPage;
