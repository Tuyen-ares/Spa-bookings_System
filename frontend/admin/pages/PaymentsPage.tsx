import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Payment, PaymentMethod, PaymentStatus, User, Appointment } from '../../types';
import { SearchIcon, CurrencyDollarIcon, CheckCircleIcon, ClockIcon, PrinterIcon, ArrowUturnLeftIcon, TrashIcon, PlusIcon, ChevronDownIcon, ChevronUpIcon, EditIcon, CloseIcon, PhoneIcon, ProfileIcon } from '../../shared/icons';
import * as apiService from '../../client/services/apiService'; // Import API service

const PAYMENTS_PER_PAGE = 10;
const PAYMENT_METHODS: PaymentMethod[] = ['Cash', 'VNPay'];
const PAYMENT_STATUSES: PaymentStatus[] = ['Completed', 'Pending', 'Refunded', 'Failed'];
const STATUS_CONFIG: Record<PaymentStatus, { text: string; color: string; bgColor: string; }> = {
    Completed: { text: 'Hoàn thành', color: 'text-green-800', bgColor: 'bg-green-100' },
    Pending: { text: 'Chờ xử lý (Tiền mặt)', color: 'text-yellow-800', bgColor: 'bg-yellow-100' },
    Refunded: { text: 'Đã hoàn tiền', color: 'text-red-800', bgColor: 'bg-red-100' },
    Failed: { text: 'Đã hủy bỏ', color: 'text-gray-800', bgColor: 'bg-gray-100' },
};
const METHOD_TEXT: Record<PaymentMethod, string> = {
    Cash: 'Tiền mặt', Card: 'Thẻ', Momo: 'Momo', VNPay: 'VNPay', ZaloPay: 'ZaloPay'
};

// Invoice type for grouping payments
interface Invoice {
    id: string; // Invoice ID: HD-{number}
    userId: string;
    date: string;
    payments: Payment[];
    appointments: Appointment[];
    services: Array<{
        serviceName: string;
        serviceId: string;
        sessions: number; // Số buổi
        price: number; // Giá 1 buổi
        totalPrice: number; // Tổng giá
        paidSessions: number; // Số buổi đã thanh toán
        unpaidSessions: number; // Số buổi chưa thanh toán
        appointmentIds: string[]; // Danh sách appointment IDs
    }>;
    totalAmount: number;
    paidAmount: number;
    unpaidAmount: number;
    status: 'paid' | 'partial' | 'unpaid';
    isPrinted: boolean; // Đã in hóa đơn = đóng hóa đơn
    isConfirmedPaid: boolean; // Đã xác nhận khách thanh toán còn lại
    groupKey: string; // Stable key for grouping
    createdAt: Date; // Thời gian tạo hóa đơn (lúc đầu)
    printedAt?: Date; // Thời gian in hóa đơn (khi nhấn In)
}

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
    allUsers: User[];
    allAppointments: Appointment[];
}

const PaymentsPage: React.FC<PaymentsPageProps> = ({ allUsers, allAppointments }) => {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // View mode: 'transactions' (giao dịch) or 'invoices' (hóa đơn) or 'history' (lịch sử)
    const [viewMode, setViewMode] = useState<'transactions' | 'invoices' | 'history'>('invoices');
    const [expandedInvoices, setExpandedInvoices] = useState<Set<string>>(new Set());
    const [printedInvoices, setPrintedInvoices] = useState<Set<string>>(() => {
        // Load from localStorage on mount
        try {
            const saved = localStorage.getItem('printedInvoices');
            return saved ? new Set(JSON.parse(saved)) : new Set();
        } catch {
            return new Set();
        }
    });

    // Print confirmation modal
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

    // Edit invoice modal
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

    const [filterMethod, setFilterMethod] = useState<PaymentMethod | 'All'>('All');
    const [filterStatus, setFilterStatus] = useState<PaymentStatus | 'All'>('All');
    const [dateFilterPreset, setDateFilterPreset] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
    const [filterDateRange, setFilterDateRange] = useState({ start: '', end: '' });
    const [currentPage, setCurrentPage] = useState(1);

    // Customer filter dropdown
    const [filterCustomer, setFilterCustomer] = useState<string>('all');
    const [customerSearch, setCustomerSearch] = useState('');
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const customerDropdownRef = useRef<HTMLDivElement>(null);

    // Invoice filter - for selected customer
    const [filterInvoice, setFilterInvoice] = useState<string>('all');

    // Search term for transactions
    const [searchTerm, setSearchTerm] = useState<string>('');

    // Save printedInvoices to localStorage whenever it changes
    useEffect(() => {
        try {
            localStorage.setItem('printedInvoices', JSON.stringify(Array.from(printedInvoices)));
        } catch (err) {
            console.error('Failed to save printedInvoices to localStorage:', err);
        }
    }, [printedInvoices]);

    // Close customer dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target as Node)) {
                setShowCustomerDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Helper function to get date range based on preset
    const getDateRangeFromPreset = (preset: 'all' | 'today' | 'week' | 'month' | 'custom') => {
        const today = new Date();
        const formatDate = (date: Date) => date.toISOString().split('T')[0];

        switch (preset) {
            case 'today':
                return { start: formatDate(today), end: formatDate(today) };
            case 'week':
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6); // End of week (Saturday)
                return { start: formatDate(weekStart), end: formatDate(weekEnd) };
            case 'month':
                const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                return { start: formatDate(monthStart), end: formatDate(monthEnd) };
            case 'all':
                return { start: '', end: '' };
            case 'custom':
            default:
                return filterDateRange;
        }
    };

    // Handle date preset change
    const handleDatePresetChange = (preset: 'all' | 'today' | 'week' | 'month' | 'custom') => {
        setDateFilterPreset(preset);
        if (preset !== 'custom') {
            const dateRange = getDateRangeFromPreset(preset);
            setFilterDateRange(dateRange);
        }
    };

    // Validate and handle date range changes
    const handleStartDateChange = (value: string) => {
        if (filterDateRange.end && value > filterDateRange.end) {
            // Nếu ngày bắt đầu lớn hơn ngày kết thúc, tự động set ngày kết thúc = ngày bắt đầu
            setFilterDateRange({ start: value, end: value });
        } else {
            setFilterDateRange(p => ({ ...p, start: value }));
        }
        setDateFilterPreset('custom');
    };

    const handleEndDateChange = (value: string) => {
        if (filterDateRange.start && value < filterDateRange.start) {
            // Nếu ngày kết thúc nhỏ hơn ngày bắt đầu, tự động set ngày bắt đầu = ngày kết thúc
            setFilterDateRange({ start: value, end: value });
        } else {
            setFilterDateRange(p => ({ ...p, end: value }));
        }
        setDateFilterPreset('custom');
    };

    useEffect(() => {
        const fetchPaymentData = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const fetchedPayments = await apiService.getPayments();
                setPayments(fetchedPayments);
            } catch (err: any) {
                console.error("Error fetching payments:", err);
                setError(err.message || "Không thể tải danh sách thanh toán.");
                setPayments([]);
            } finally {
                setIsLoading(false);
            }
        };

        // Fetch immediately on mount
        fetchPaymentData();

        // Only enable auto-polling in transactions view to avoid flickering in invoice view
        // Set up polling every 30 seconds (increased from 10s to reduce flickering)
        const interval = setInterval(() => {
            if (viewMode === 'transactions') {
                fetchPaymentData();
            }
        }, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, [viewMode]); // Re-setup interval when viewMode changes


    const stats = useMemo(() => {
        if (error) return { totalRevenue: 0, successfulTransactions: 0, pendingTransactions: 0, unpaidInvoices: 0 };
        const completedPayments = payments.filter(p => p.status === 'Completed');
        const totalRevenue = completedPayments.reduce((sum, p) => {
            const amount = typeof p.amount === 'string' ? parseFloat(p.amount) : (p.amount || 0);
            return sum + amount;
        }, 0);
        const successfulTransactions = completedPayments.length;
        const pendingTransactions = payments.filter(p => p.status === 'Pending').length;
        // Count unpaid appointments
        const unpaidAppointments = allAppointments.filter(a => a.paymentStatus === 'Unpaid' && a.status !== 'cancelled' && a.status !== 'pending').length;
        return { totalRevenue, successfulTransactions, pendingTransactions, unpaidInvoices: unpaidAppointments };
    }, [payments, error, allAppointments]);

    // Generate invoices by grouping appointments
    const invoices = useMemo((): Invoice[] => {
        // Get printed invoice groupKeys and their print timestamps from localStorage
        const printedInvoiceData: { [key: string]: number } = {};
        try {
            const stored = localStorage.getItem('printedInvoiceData');
            if (stored) {
                Object.assign(printedInvoiceData, JSON.parse(stored));
            }
        } catch (e) {
            console.error('Error loading printedInvoiceData:', e);
        }

        // Sort appointments by date
        const sortedAppointments = [...allAppointments]
            .filter(apt => apt.status !== 'cancelled' && apt.status !== 'pending')
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // STRATEGY: Build map of appointment -> which printed invoice it belongs to
        const appointmentToPrintedInvoice = new Map<string, string>(); // aptId -> printed groupKey

        // First pass: Identify which appointments belong to printed invoices
        const printedInvoiceGroups = new Map<string, Set<string>>(); // groupKey -> Set of aptIds

        // Load printed invoice membership from localStorage
        try {
            const stored = localStorage.getItem('printedInvoiceAppointments');
            if (stored) {
                const data: { [groupKey: string]: string[] } = JSON.parse(stored);
                Object.entries(data).forEach(([groupKey, aptIds]) => {
                    if (printedInvoices.has(groupKey)) {
                        printedInvoiceGroups.set(groupKey, new Set(aptIds));
                        aptIds.forEach(aptId => {
                            appointmentToPrintedInvoice.set(aptId, groupKey);
                        });
                    }
                });
            }
        } catch (e) {
            console.error('Error loading printedInvoiceAppointments:', e);
        }

        // Group appointments into invoices
        const invoiceMap = new Map<string, Invoice>();

        sortedAppointments.forEach(apt => {
            const userId = apt.userId;

            // Check if this appointment belongs to a printed invoice
            const printedGroupKey = appointmentToPrintedInvoice.get(apt.id);

            if (printedGroupKey) {
                // Belongs to printed invoice → Add to that invoice
                if (!invoiceMap.has(printedGroupKey)) {
                    invoiceMap.set(printedGroupKey, {
                        id: printedGroupKey,
                        userId: userId,
                        date: apt.date,
                        payments: [],
                        appointments: [],
                        services: [],
                        totalAmount: 0,
                        paidAmount: 0,
                        unpaidAmount: 0,
                        status: 'unpaid',
                        isPrinted: true,
                        isConfirmedPaid: false,
                        createdAt: new Date(apt.date),
                        groupKey: printedGroupKey
                    });
                }
                invoiceMap.get(printedGroupKey)!.appointments.push(apt);
            } else {
                // Not in printed invoice → Add to user's active (unpaid) invoice
                const activeGroupKey = `${userId}-active`;

                if (!invoiceMap.has(activeGroupKey)) {
                    invoiceMap.set(activeGroupKey, {
                        id: activeGroupKey,
                        userId: userId,
                        date: apt.date,
                        payments: [],
                        appointments: [],
                        services: [],
                        totalAmount: 0,
                        paidAmount: 0,
                        unpaidAmount: 0,
                        status: 'unpaid',
                        isPrinted: false,
                        isConfirmedPaid: false,
                        createdAt: new Date(apt.date),
                        groupKey: activeGroupKey
                    });
                }
                invoiceMap.get(activeGroupKey)!.appointments.push(apt);
            }
        });

        // Group services by serviceName and calculate totals
        invoiceMap.forEach(invoice => {
            const serviceMap = new Map<string, {
                serviceName: string;
                serviceId: string;
                sessions: number;
                price: number;
                totalPrice: number;
                paidSessions: number;
                unpaidSessions: number;
                appointmentIds: string[];
            }>();

            invoice.appointments.forEach(apt => {
                const service = (apt as any).Service;
                const serviceId = apt.serviceId;
                const serviceName = apt.serviceName;
                const price = service?.price || 0;
                const isPaid = apt.paymentStatus === 'Paid';

                if (!serviceMap.has(serviceName)) {
                    serviceMap.set(serviceName, {
                        serviceName,
                        serviceId,
                        sessions: 0,
                        price,
                        totalPrice: 0,
                        paidSessions: 0,
                        unpaidSessions: 0,
                        appointmentIds: []
                    });
                }

                const svc = serviceMap.get(serviceName)!;
                svc.sessions++;
                svc.totalPrice += price;
                svc.appointmentIds.push(apt.id);

                if (isPaid) {
                    svc.paidSessions++;
                    invoice.paidAmount += price;
                } else {
                    svc.unpaidSessions++;
                    invoice.unpaidAmount += price;
                }
                invoice.totalAmount += price;
            });

            invoice.services = Array.from(serviceMap.values());

            // Calculate invoice status
            if (invoice.unpaidAmount === 0 && invoice.totalAmount > 0) {
                invoice.status = 'paid';
            } else if (invoice.paidAmount > 0 && invoice.unpaidAmount > 0) {
                invoice.status = 'partial';
            } else {
                invoice.status = 'unpaid';
            }
        });

        // Add payments to invoices
        payments.forEach(payment => {
            if (payment.appointmentId) {
                const apt = allAppointments.find(a => a.id === payment.appointmentId);
                if (apt) {
                    const groupKey = apt.bookingGroupId || `${apt.userId}-${apt.date}`;
                    const invoice = invoiceMap.get(groupKey);
                    if (invoice && !invoice.payments.find(p => p.id === payment.id)) {
                        invoice.payments.push(payment);
                    }
                }
            }
        });

        // Convert to array, sort, and create display invoice numbers
        const invoicesArray = Array.from(invoiceMap.values())
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Assign HD-{number} for display while keeping stable internal groupKey
        invoicesArray.forEach((inv, idx) => {
            // Store original groupKey for stable updates
            const groupKey = inv.id;
            // Generate display ID
            inv.id = `HD-${String(idx + 1).padStart(4, '0')}`;
            // Keep groupKey for tracking
            inv.groupKey = groupKey;
            // Check if printed and get printedAt from localStorage
            inv.isPrinted = printedInvoices.has(groupKey);
            if (inv.isPrinted) {
                try {
                    const printedDates = JSON.parse(localStorage.getItem('printedDates') || '{}');
                    if (printedDates[groupKey]) {
                        inv.printedAt = new Date(printedDates[groupKey]);
                    }
                } catch (e) {
                    console.error('Error loading printedAt:', e);
                }
            }
            // If fully paid, auto confirm
            inv.isConfirmedPaid = inv.unpaidAmount === 0 || printedInvoices.has(`${groupKey}-confirmed`);
        });

        // Return sorted by newest first for display
        return invoicesArray.reverse();
    }, [allAppointments, payments, printedInvoices]);

    const filteredPayments = useMemo(() => {
        return payments
            .filter(p => {
                const user = allUsers.find(u => u.id === p.userId); // FIX: Use allUsers prop
                const searchLower = searchTerm.toLowerCase();

                // Search by: Transaction ID, Customer Name, Phone Number
                return p.transactionId.toLowerCase().includes(searchLower) ||
                    (user && (
                        user.name.toLowerCase().includes(searchLower) ||
                        (user.phone && user.phone.toLowerCase().includes(searchLower))
                    ));
            })
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
    }, [payments, searchTerm, filterMethod, filterStatus, filterDateRange, allUsers]); // FIX: Use allUsers prop

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterMethod, filterStatus, filterDateRange, viewMode, filterCustomer, filterInvoice]);

    // Get unique customers from invoices
    const uniqueCustomers = useMemo(() => {
        const customerMap = new Map<string, User>();
        invoices.forEach(inv => {
            const user = allUsers.find(u => u.id === inv.userId);
            if (user && !customerMap.has(user.id)) {
                customerMap.set(user.id, user);
            }
        });
        return Array.from(customerMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    }, [invoices, allUsers]);

    // Filter customers for dropdown based on search
    const filteredCustomersForDropdown = useMemo(() => {
        if (!customerSearch.trim()) return uniqueCustomers;
        const searchLower = customerSearch.toLowerCase();
        return uniqueCustomers.filter(customer =>
            customer.name.toLowerCase().includes(searchLower) ||
            (customer.phone && customer.phone.toLowerCase().includes(searchLower))
        );
    }, [uniqueCustomers, customerSearch]);

    // Handle customer selection
    const handleCustomerSelect = (customerId: string) => {
        setFilterCustomer(customerId);
        setFilterInvoice('all'); // Reset invoice filter when changing customer
        if (customerId === 'all') {
            setCustomerSearch('');
        } else {
            const customer = allUsers.find(u => u.id === customerId);
            setCustomerSearch(customer?.name || '');
        }
        setShowCustomerDropdown(false);
    };

    // Get invoices for selected customer
    const customerInvoices = useMemo(() => {
        if (filterCustomer === 'all') return [];
        return invoices.filter(inv => inv.userId === filterCustomer);
    }, [invoices, filterCustomer]);

    // Filter invoices
    const filteredInvoices = useMemo(() => {
        return invoices.filter(inv => {
            const user = allUsers.find(u => u.id === inv.userId);

            // Date filter
            let matchDate = true;
            if (filterDateRange.start || filterDateRange.end) {
                const invDate = new Date(inv.date);
                const startDate = filterDateRange.start ? new Date(filterDateRange.start) : null;
                const endDate = filterDateRange.end ? new Date(filterDateRange.end) : null;
                if (startDate) startDate.setHours(0, 0, 0, 0);
                if (endDate) endDate.setHours(23, 59, 59, 999);
                matchDate = (!startDate || invDate >= startDate) && (!endDate || invDate <= endDate);
            }

            // Tab filter
            let matchTab = true;
            if (viewMode === 'invoices') {
                // Tab "Hóa đơn": Hiển thị hóa đơn chưa in HOẶC đã in nhưng chưa xác nhận thanh toán
                matchTab = !inv.isConfirmedPaid;
            } else if (viewMode === 'history') {
                // Tab "Lịch sử thanh toán": CHỈ hiển thị hóa đơn đã xác nhận thanh toán
                matchTab = inv.isConfirmedPaid;
            }

            // Customer filter
            const matchCustomer = filterCustomer === 'all' || inv.userId === filterCustomer;

            // Invoice filter
            const matchInvoice = filterInvoice === 'all' || inv.id === filterInvoice;

            return matchDate && matchTab && matchCustomer && matchInvoice;
        });
    }, [invoices, filterDateRange, allUsers, viewMode, filterCustomer, filterInvoice]);

    const totalPages = viewMode === 'transactions'
        ? Math.ceil(filteredPayments.length / PAYMENTS_PER_PAGE)
        : Math.ceil(filteredInvoices.length / PAYMENTS_PER_PAGE);
    const paginatedPayments = useMemo(() => {
        const startIndex = (currentPage - 1) * PAYMENTS_PER_PAGE;
        return filteredPayments.slice(startIndex, startIndex + PAYMENTS_PER_PAGE);
    }, [filteredPayments, currentPage]);

    const paginatedInvoices = useMemo(() => {
        const startIndex = (currentPage - 1) * PAYMENTS_PER_PAGE;
        return filteredInvoices.slice(startIndex, startIndex + PAYMENTS_PER_PAGE);
    }, [filteredInvoices, currentPage]);

    const toggleInvoiceExpand = (invoiceId: string) => {
        setExpandedInvoices(prev => {
            const newSet = new Set(prev);
            if (newSet.has(invoiceId)) {
                newSet.delete(invoiceId);
            } else {
                newSet.add(invoiceId);
            }
            return newSet;
        });
    };

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

    const handleConfirmPayment = async (paymentId: string) => {
        if (window.confirm("Xác nhận đã nhận thanh toán tiền mặt?")) {
            try {
                const updatedPayment = await apiService.updatePayment(paymentId, { status: 'Completed' });
                setPayments(prev => prev.map(p => p.id === updatedPayment.id ? updatedPayment : p));
                alert('Đã xác nhận thanh toán thành công!');
            } catch (err: any) {
                console.error("Error confirming payment:", err);
                alert(`Xác nhận thanh toán thất bại: ${err.message || String(err)}`);
            }
        }
    };

    const handleDeletePayment = async (paymentId: string) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa giao dịch này?")) {
            try {
                await apiService.deletePayment(paymentId);
                setPayments(prev => prev.filter(p => p.id !== paymentId));
                alert('Đã xóa giao dịch thành công!');
            } catch (err: any) {
                console.error("Error deleting payment:", err);
                alert(`Xóa giao dịch thất bại: ${err.message || String(err)}`);
            }
        }
    };

    const handlePrintInvoice = (invoice: Invoice) => {
        const user = allUsers.find(u => u.id === invoice.userId);
        const printDate = new Date();

        // Generate unique groupKey for this printed invoice
        const printedGroupKey = `${invoice.userId}-printed-${Date.now()}`;

        // Mark as printed and save print date + appointment membership
        setPrintedInvoices(prev => {
            const newSet = new Set(prev);
            newSet.add(printedGroupKey);

            // If fully paid, auto confirm
            if (invoice.unpaidAmount === 0) {
                newSet.add(`${printedGroupKey}-confirmed`);
            }

            // Save print date to localStorage
            try {
                const printedDates = JSON.parse(localStorage.getItem('printedDates') || '{}');
                printedDates[printedGroupKey] = printDate.toISOString();
                localStorage.setItem('printedDates', JSON.stringify(printedDates));
            } catch (e) {
                console.error('Error saving printedAt:', e);
            }

            // Save appointment membership to this printed invoice
            try {
                const appointmentIds = invoice.appointments.map(apt => apt.id);
                const printedInvoiceAppointments = JSON.parse(localStorage.getItem('printedInvoiceAppointments') || '{}');
                printedInvoiceAppointments[printedGroupKey] = appointmentIds;
                localStorage.setItem('printedInvoiceAppointments', JSON.stringify(printedInvoiceAppointments));
            } catch (e) {
                console.error('Error saving printedInvoiceAppointments:', e);
            }

            return newSet;
        });

        // Tạo cửa sổ in
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Vui lòng cho phép popup để in hóa đơn');
            return;
        }

        // Tạo nội dung HTML cho hóa đơn với nhiều dịch vụ
        const invoiceHTML = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hóa đơn ${invoice.id}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 20px;
            background: #f5f5f5;
        }
        .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .invoice-header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #d4a574;
            padding-bottom: 20px;
        }
        .spa-name {
            font-size: 32px;
            font-weight: bold;
            color: #d4a574;
            margin-bottom: 5px;
        }
        .spa-info {
            font-size: 14px;
            color: #666;
            line-height: 1.6;
        }
        .invoice-title {
            font-size: 24px;
            font-weight: bold;
            text-align: center;
            margin: 20px 0;
            color: #333;
        }
        .invoice-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
        }
        .detail-section {
            background: #f9f9f9;
            padding: 15px;
            border-radius: 5px;
        }
        .detail-label {
            font-weight: 600;
            color: #666;
            font-size: 12px;
            text-transform: uppercase;
            margin-bottom: 5px;
        }
        .detail-value {
            font-size: 16px;
            color: #333;
        }
        .service-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        .service-table th {
            background: #d4a574;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: 600;
        }
        .service-table td {
            padding: 12px;
            border-bottom: 1px solid #eee;
        }
        .service-table tr:last-child td {
            border-bottom: none;
        }
        .status-badge {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
        }
        .status-paid {
            background: #dcfce7;
            color: #166534;
        }
        .status-unpaid {
            background: #fee2e2;
            color: #991b1b;
        }
        .total-section {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #d4a574;
        }
        .total-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            font-size: 16px;
        }
        .total-row.grand-total {
            font-size: 24px;
            font-weight: bold;
            color: #d4a574;
            margin-top: 10px;
        }
        .invoice-footer {
            margin-top: 40px;
            text-align: center;
            font-size: 14px;
            color: #666;
            border-top: 1px solid #eee;
            padding-top: 20px;
        }
        @media print {
            body {
                background: white;
                padding: 0;
            }
            .invoice-container {
                box-shadow: none;
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <div class="invoice-header">
            <div class="spa-name">Anh Thơ Spa</div>
            <div class="spa-info">
                123 Beauty St, Hà Nội, Việt Nam<br>
                Điện thoại: 098-765-4321 | Email: contact@anhthospa.vn<br>
                Website: www.anthospa.vn
            </div>
        </div>

        <div class="invoice-title">HÓA ĐƠN THANH TOÁN</div>

        <div class="invoice-details">
            <div class="detail-section">
                <div class="detail-label">Mã hóa đơn</div>
                <div class="detail-value">${invoice.id}</div>
            </div>
            <div class="detail-section">
                <div class="detail-label">Ngày in</div>
                <div class="detail-value">${printDate.toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        })}</div>
            </div>
            <div class="detail-section">
                <div class="detail-label">Tên khách hàng</div>
                <div class="detail-value">${user ? user.name : 'Khách vãng lai'}</div>
            </div>
            <div class="detail-section">
                <div class="detail-label">Số điện thoại</div>
                <div class="detail-value">${user && user.phone ? user.phone : 'Chưa cập nhật'}</div>
            </div>
        </div>

        <table class="service-table">
            <thead>
                <tr>
                    <th>Dịch vụ</th>
                    <th style="text-align: center;">Số buổi</th>
                    <th style="text-align: right;">Đơn giá</th>
                    <th style="text-align: right;">Thành tiền</th>
                    <th style="text-align: center;">Trạng thái</th>
                </tr>
            </thead>
            <tbody>
                ${invoice.services.map(svc => `
                    <tr>
                        <td>${svc.serviceName}</td>
                        <td style="text-align: center;">${svc.sessions} buổi</td>
                        <td style="text-align: right;">${formatPrice(svc.price)}</td>
                        <td style="text-align: right;">${formatPrice(svc.totalPrice)}</td>
                        <td style="text-align: center;">
                            ${svc.paidSessions > 0 ? `<span class="status-badge status-paid">✓ Đã TT: ${svc.paidSessions}</span>` : ''}
                            ${svc.unpaidSessions > 0 ? `<span class="status-badge status-unpaid">○ Chưa TT: ${svc.unpaidSessions}</span>` : ''}
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <div class="total-section">
            <div class="total-row">
                <span>Tổng cộng:</span>
                <span>${formatPrice(invoice.totalAmount)}</span>
            </div>
            <div class="total-row">
                <span>Đã thanh toán:</span>
                <span style="color: #166534;">${formatPrice(invoice.paidAmount)}</span>
            </div>
            ${invoice.unpaidAmount > 0 ? `
            <div class="total-row">
                <span>Còn lại:</span>
                <span style="color: #991b1b;">${formatPrice(invoice.unpaidAmount)}</span>
            </div>
            ` : ''}
            <div class="total-row grand-total">
                <span>${invoice.unpaidAmount > 0 ? 'CẦN THANH TOÁN:' : 'ĐÃ THANH TOÁN ĐẦY ĐỦ'}</span>
                <span>${formatPrice(invoice.unpaidAmount > 0 ? invoice.unpaidAmount : invoice.totalAmount)}</span>
            </div>
        </div>

        <div class="invoice-footer">
            <p style="margin-bottom: 10px;">Cảm ơn quý khách đã sử dụng dịch vụ của Anh Thơ Spa!</p>
            <p style="font-size: 12px; color: #999;">
                Hóa đơn được in tự động từ hệ thống quản lý Spa<br>
                Thời gian in: ${new Date().toLocaleString('vi-VN')}
            </p>
        </div>
    </div>

    <script>
        // Tự động in khi trang tải xong
        window.onload = function() {
            setTimeout(function() {
                window.print();
            }, 250);
        };
        
        // Đóng cửa sổ sau khi in hoặc hủy
        window.onafterprint = function() {
            window.close();
        };
    </script>
</body>
</html>
        `;

        printWindow.document.write(invoiceHTML);
        printWindow.document.close();
    };

    const handleConfirmPaid = async (invoice: Invoice) => {
        if (window.confirm(`Xác nhận khách hàng đã thanh toán ${formatPrice(invoice.unpaidAmount)} còn lại?\n\nHóa đơn sẽ được chuyển vào lịch sử thanh toán.`)) {
            try {
                // Update payment status for unpaid appointments
                const updatePromises = invoice.appointments
                    .filter(apt => apt.paymentStatus === 'Unpaid')
                    .map(apt => apiService.updateAppointment(apt.id, { paymentStatus: 'Paid' }));

                await Promise.all(updatePromises);

                // Mark as confirmed
                setPrintedInvoices(prev => {
                    const newSet = new Set(prev);
                    newSet.add(`${invoice.groupKey}-confirmed`);
                    return newSet;
                });

                alert('Đã xác nhận thanh toán! Hóa đơn đã chuyển vào lịch sử.');

                // Switch to history tab
                setViewMode('history');
            } catch (err: any) {
                console.error("Error confirming payment:", err);
                alert(`Xác nhận thanh toán thất bại: ${err.message || String(err)}`);
            }
        }
    };

    const handleUpdateServicePayment = async (appointmentId: string, newPaymentStatus: 'Paid' | 'Unpaid') => {
        try {
            await apiService.updateAppointment(appointmentId, { paymentStatus: newPaymentStatus });

            // Refresh appointments data
            const updatedAppointments = allAppointments.map(apt =>
                apt.id === appointmentId ? { ...apt, paymentStatus: newPaymentStatus } : apt
            );

            // Force re-render by updating a dummy state or refetch data
            window.location.reload(); // Simple solution for now
        } catch (err: any) {
            console.error("Error updating payment status:", err);
            alert(`Cập nhật trạng thái thanh toán thất bại: ${err.message || String(err)}`);
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Quản lý Thanh toán</h1>

            {/* Thông báo giao dịch tiền mặt chờ xác nhận */}
            {stats.pendingTransactions > 0 && (
                <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <ClockIcon className="w-5 h-5 text-yellow-400" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-yellow-700">
                                <span className="font-semibold">Có {stats.pendingTransactions} giao dịch tiền mặt chờ xác nhận.</span>
                                {' '}Vui lòng kiểm tra và xác nhận đã nhận tiền để hoàn thành giao dịch.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard title="Tổng doanh thu" value={formatPrice(stats.totalRevenue)} icon={<CurrencyDollarIcon className="w-6 h-6" />} color="bg-green-100 text-green-600" isLoading={isLoading} />
                <StatCard title="Giao dịch thành công" value={stats.successfulTransactions.toString()} icon={<CheckCircleIcon className="w-6 h-6" />} color="bg-blue-100 text-blue-600" isLoading={isLoading} />
                <StatCard title="Chờ xử lý tiền mặt" value={stats.pendingTransactions.toString()} icon={<ClockIcon className="w-6 h-6" />} color="bg-yellow-100 text-yellow-600" isLoading={isLoading} />
                <StatCard title="Chưa thanh toán" value={stats.unpaidInvoices.toString()} icon={<CurrencyDollarIcon className="w-6 h-6" />} color="bg-red-100 text-red-600" isLoading={isLoading} />
            </div>

            {/* View Mode Tabs */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-800">Danh sách</h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setViewMode('invoices')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'invoices' ? 'bg-brand-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                            Hóa đơn ({invoices.filter(i => !i.isConfirmedPaid).length})
                        </button>
                        <button
                            onClick={() => setViewMode('history')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'history' ? 'bg-brand-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                            Lịch sử thanh toán ({invoices.filter(i => i.isConfirmedPaid).length})
                        </button>
                        <button
                            onClick={() => setViewMode('transactions')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'transactions' ? 'bg-brand-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                            Giao dịch ({filteredPayments.length})
                        </button>
                    </div>
                </div>
            </div>

            <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
                <div className="space-y-3">
                    {/* First row: Customer filter and invoice filter */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Customer filter dropdown - for invoice/history tabs */}
                        {(viewMode === 'invoices' || viewMode === 'history') && (
                            <div className="relative" ref={customerDropdownRef}>
                                <div className="relative border border-gray-300 rounded-md bg-white cursor-pointer">
                                    {filterCustomer !== 'all' ? (
                                        <div className="p-2 flex items-center justify-between">
                                            <div className="flex items-center gap-2 flex-1">
                                                <ProfileIcon className="w-4 h-4 text-blue-600" />
                                                <span className="text-sm font-medium">{customerSearch}</span>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleCustomerSelect('all');
                                                }}
                                                className="p-1 hover:bg-gray-100 rounded"
                                            >
                                                <CloseIcon className="w-4 h-4 text-gray-400" />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <input
                                                type="text"
                                                value={customerSearch}
                                                onChange={(e) => {
                                                    setCustomerSearch(e.target.value);
                                                    setShowCustomerDropdown(true);
                                                }}
                                                onFocus={() => setShowCustomerDropdown(true)}
                                                className="w-full p-2 pr-8 border-0 rounded-md focus:ring-0 focus:outline-none bg-transparent"
                                                placeholder="Lọc theo khách hàng..."
                                            />
                                            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                                <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                                            </div>
                                        </>
                                    )}
                                </div>
                                {showCustomerDropdown && filterCustomer === 'all' && (
                                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                        <div
                                            onClick={() => handleCustomerSelect('all')}
                                            className="p-3 hover:bg-gray-100 cursor-pointer border-b font-medium text-gray-700 bg-gray-50"
                                        >
                                            Tất cả khách hàng
                                        </div>
                                        {filteredCustomersForDropdown.length > 0 ? (
                                            filteredCustomersForDropdown.map(customer => (
                                                <div
                                                    key={customer.id}
                                                    onClick={() => handleCustomerSelect(customer.id)}
                                                    className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                                                >
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs">
                                                            <ProfileIcon className="w-3 h-3" />
                                                            <span className="font-medium">{customer.name}</span>
                                                        </div>
                                                        {customer.phone && (
                                                            <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs">
                                                                <PhoneIcon className="w-3 h-3" />
                                                                <span>{customer.phone}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-3 text-sm text-gray-500 text-center">
                                                {customerSearch ? 'Không tìm thấy khách hàng' : 'Nhập tên hoặc số điện thoại để tìm kiếm'}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Invoice filter combobox - only show when a customer is selected */}
                        {(viewMode === 'invoices' || viewMode === 'history') && filterCustomer !== 'all' && (
                            <select
                                value={filterInvoice}
                                onChange={e => setFilterInvoice(e.target.value)}
                                className="p-2 border rounded-md bg-white"
                            >
                                <option value="all">Tất cả hóa đơn ({customerInvoices.length})</option>
                                {customerInvoices.map(inv => (
                                    <option key={inv.id} value={inv.id}>
                                        {inv.id} - {formatPrice(inv.totalAmount)} - {new Date(inv.date).toLocaleDateString('vi-VN')}
                                    </option>
                                ))}
                            </select>
                        )}

                        {/* Date filter combobox */}
                        <select
                            value={dateFilterPreset}
                            onChange={e => handleDatePresetChange(e.target.value as any)}
                            className="p-2 border rounded-md bg-white"
                        >
                            <option value="all">Tất cả thời gian</option>
                            <option value="today">Hôm nay</option>
                            <option value="week">Tuần này</option>
                            <option value="month">Tháng này</option>
                            <option value="custom">Tùy chọn</option>
                        </select>

                        {viewMode === 'transactions' && (
                            <>
                                <select value={filterMethod} onChange={e => setFilterMethod(e.target.value as any)} className="p-2 border rounded-md bg-white">
                                    <option value="All">Tất cả phương thức</option>
                                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{METHOD_TEXT[m]}</option>)}
                                </select>
                                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className="p-2 border rounded-md bg-white">
                                    <option value="All">Tất cả trạng thái</option>
                                    {PAYMENT_STATUSES.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].text}</option>)}
                                </select>
                            </>
                        )}
                    </div>

                    {/* Second row: Custom date range (only show when custom is selected) */}
                    {dateFilterPreset === 'custom' && (
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-600 whitespace-nowrap">Từ ngày:</label>
                            <input
                                type="date"
                                value={filterDateRange.start}
                                onChange={e => handleStartDateChange(e.target.value)}
                                max={filterDateRange.end || undefined}
                                className="flex-1 p-2 border rounded-md text-sm"
                            />
                            <span className="text-gray-500 font-medium">-</span>
                            <label className="text-sm text-gray-600 whitespace-nowrap">Đến ngày:</label>
                            <input
                                type="date"
                                value={filterDateRange.end}
                                onChange={e => handleEndDateChange(e.target.value)}
                                min={filterDateRange.start || undefined}
                                className="flex-1 p-2 border rounded-md text-sm"
                            />
                        </div>
                    )}

                    {/* Show selected date range info for non-custom presets */}
                    {dateFilterPreset !== 'all' && dateFilterPreset !== 'custom' && filterDateRange.start && filterDateRange.end && (
                        <div className="text-sm text-gray-600">
                            Hiển thị: <span className="font-medium">{new Date(filterDateRange.start).toLocaleDateString('vi-VN')}</span> - <span className="font-medium">{new Date(filterDateRange.end).toLocaleDateString('vi-VN')}</span>
                        </div>
                    )}
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
            ) : (viewMode === 'invoices' || viewMode === 'history') ? (
                /* INVOICE VIEW - for both "Hóa đơn" and "Lịch sử thanh toán" tabs */
                paginatedInvoices.length > 0 ? (
                    <>
                        <div className="space-y-4">
                            {paginatedInvoices.map(invoice => {
                                const user = allUsers.find(u => u.id === invoice.userId);
                                const isExpanded = expandedInvoices.has(invoice.id);
                                const statusConfig = {
                                    paid: { text: 'Đã thanh toán', bg: 'bg-green-100', color: 'text-green-800' },
                                    partial: { text: 'Thanh toán một phần', bg: 'bg-yellow-100', color: 'text-yellow-800' },
                                    unpaid: { text: 'Chưa thanh toán', bg: 'bg-red-100', color: 'text-red-800' }
                                };
                                const invStatus = statusConfig[invoice.status];

                                return (
                                    <div key={invoice.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                                        {/* Invoice Header */}
                                        <div
                                            className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                                            onClick={() => toggleInvoiceExpand(invoice.id)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-2">
                                                        {isExpanded ? <ChevronUpIcon className="w-5 h-5 text-gray-500" /> : <ChevronDownIcon className="w-5 h-5 text-gray-500" />}
                                                        <span className="font-mono font-bold text-base text-brand-primary">{invoice.id}</span>
                                                    </div>
                                                    {user && (
                                                        <div className="flex items-center gap-2">
                                                            <img
                                                                src={user.profilePictureUrl?.startsWith('http') ? user.profilePictureUrl : `http://localhost:3001${user.profilePictureUrl}`}
                                                                alt={user.name}
                                                                className="w-8 h-8 rounded-full"
                                                            />
                                                            <div>
                                                                <p className="font-semibold text-gray-800 text-sm">{user.name}</p>
                                                                <p className="text-xs text-gray-500">{user.phone}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    <div className="text-right">
                                                        <p className="text-xs text-gray-500">{invoice.services.length} loại dịch vụ - {invoice.appointments.length} buổi</p>
                                                        <p className="text-sm font-semibold text-brand-primary">{formatPrice(invoice.totalAmount)}</p>
                                                    </div>
                                                    {invoice.unpaidAmount > 0 && (
                                                        <div className="text-right">
                                                            <p className="text-xs text-gray-500">Còn lại</p>
                                                            <p className="text-sm font-semibold text-red-600">{formatPrice(invoice.unpaidAmount)}</p>
                                                        </div>
                                                    )}
                                                    {invoice.isPrinted && (
                                                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                                                            Đã in
                                                        </span>
                                                    )}
                                                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${invStatus.bg} ${invStatus.color}`}>
                                                        {invStatus.text}
                                                    </span>
                                                    <div className="text-right">
                                                        {invoice.isPrinted && invoice.printedAt ? (
                                                            <>
                                                                <p className="text-xs text-gray-500">Ngày in</p>
                                                                <p className="text-sm font-medium text-gray-700">{new Date(invoice.printedAt).toLocaleDateString('vi-VN')}</p>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <p className="text-xs text-gray-500">Ngày tạo</p>
                                                                <p className="text-sm font-medium text-gray-700">{new Date(invoice.createdAt).toLocaleDateString('vi-VN')}</p>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Invoice Details (Expanded) */}
                                        {isExpanded && (
                                            <div className="border-t border-gray-200">
                                                <table className="w-full">
                                                    <thead className="bg-gray-50">
                                                        <tr className="text-left text-xs font-semibold text-gray-600">
                                                            <th className="p-3">Dịch vụ</th>
                                                            <th className="p-3 text-center">Số buổi</th>
                                                            <th className="p-3 text-right">Đơn giá</th>
                                                            <th className="p-3 text-right">Thành tiền</th>
                                                            <th className="p-3 text-center">Đã TT / Chưa TT</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {invoice.services.map(svc => {
                                                            return (
                                                                <tr key={svc.serviceName} className="border-b border-gray-100 hover:bg-gray-50">
                                                                    <td className="p-3">
                                                                        <p className="font-medium text-gray-800">{svc.serviceName}</p>
                                                                    </td>
                                                                    <td className="p-3 text-center font-medium">{svc.sessions} buổi</td>
                                                                    <td className="p-3 text-right">{formatPrice(svc.price)}</td>
                                                                    <td className="p-3 text-right font-semibold text-brand-primary">{formatPrice(svc.totalPrice)}</td>
                                                                    <td className="p-3 text-center">
                                                                        <div className="flex items-center justify-center gap-2">
                                                                            {svc.paidSessions > 0 && (
                                                                                <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                                                                                    ✓ {svc.paidSessions}
                                                                                </span>
                                                                            )}
                                                                            {svc.unpaidSessions > 0 && (
                                                                                <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                                                                                    ○ {svc.unpaidSessions}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>

                                                {/* Invoice Footer */}
                                                <div className="p-4 bg-gray-50 border-t border-gray-200">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (invoice.isPrinted) {
                                                                        alert('Hóa đơn này đã được in. Chỉ có thể chỉnh sửa.');
                                                                        return;
                                                                    }
                                                                    // Show modal instead of window.confirm
                                                                    setSelectedInvoice(invoice);
                                                                    setShowPrintModal(true);
                                                                }}
                                                                className={`px-4 py-2 text-sm rounded-md flex items-center gap-2 font-medium ${invoice.isPrinted
                                                                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                                                    : 'bg-blue-500 text-white hover:bg-blue-600'
                                                                    }`}
                                                                disabled={invoice.isPrinted}
                                                            >
                                                                <PrinterIcon className="w-4 h-4" />
                                                                {invoice.isPrinted ? 'Đã in hóa đơn' : 'In hóa đơn và đóng'}
                                                            </button>
                                                            {invoice.isPrinted && !invoice.isConfirmedPaid && (
                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            if (window.confirm(`In lại hóa đơn ${invoice.id}?\n\nHóa đơn sẽ được in với dữ liệu cập nhật mới nhất.`)) {
                                                                                handlePrintInvoice(invoice);
                                                                            }
                                                                        }}
                                                                        className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 flex items-center gap-1"
                                                                    >
                                                                        <PrinterIcon className="w-4 h-4" />
                                                                        In lại
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            alert('Chức năng chỉnh sửa hóa đơn:\n\n• Thêm/bớt dịch vụ\n• Cập nhật thanh toán\n• Sửa thông tin khách hàng\n\nĐang được phát triển...');
                                                                        }}
                                                                        className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 flex items-center gap-1"
                                                                    >
                                                                        <EditIcon className="w-4 h-4" />
                                                                        Chỉnh sửa
                                                                    </button>
                                                                    {invoice.isPrinted && !invoice.isConfirmedPaid && (
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleConfirmPaid(invoice);
                                                                            }}
                                                                            className="px-3 py-2 text-sm bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center gap-1"
                                                                        >
                                                                            <CheckCircleIcon className="w-4 h-4" />
                                                                            Xác nhận đã thanh toán
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            )}
                                                            {invoice.isPrinted && invoice.isConfirmedPaid && (
                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            if (window.confirm(`In lại hóa đơn ${invoice.id}?\n\nHóa đơn sẽ được in với dữ liệu cập nhật mới nhất.`)) {
                                                                                handlePrintInvoice(invoice);
                                                                            }
                                                                        }}
                                                                        className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 flex items-center gap-1"
                                                                    >
                                                                        <PrinterIcon className="w-4 h-4" />
                                                                        In lại
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setEditingInvoice(invoice);
                                                                            setShowEditModal(true);
                                                                        }}
                                                                        className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 flex items-center gap-1"
                                                                    >
                                                                        <EditIcon className="w-4 h-4" />
                                                                        Chỉnh sửa
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-6 text-sm">
                                                            <div>
                                                                <span className="text-gray-500">Tổng cộng: </span>
                                                                <span className="font-bold">{formatPrice(invoice.totalAmount)}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-500">Đã thanh toán: </span>
                                                                <span className="font-bold text-green-600">{formatPrice(invoice.paidAmount)}</span>
                                                            </div>
                                                            {invoice.unpaidAmount > 0 && (
                                                                <div>
                                                                    <span className="text-gray-500">Còn lại: </span>
                                                                    <span className="font-bold text-red-600">{formatPrice(invoice.unpaidAmount)}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
                    </>
                ) : (
                    <div className="text-center py-10 text-gray-500 bg-white rounded-lg shadow-md">Không tìm thấy hóa đơn nào.</div>
                )
            ) : (
                /* TRANSACTIONS VIEW */
                paginatedPayments.length > 0 ? (
                    <>
                        <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                            <table className="w-full whitespace-nowrap">
                                <thead className="bg-gray-50 border-b"><tr className="text-left text-sm font-semibold text-gray-600"><th className="p-4">Mã Giao dịch</th><th className="p-4">Khách hàng</th><th className="p-4">Dịch vụ</th><th className="p-4">Tổng tiền</th><th className="p-4">Phương thức</th><th className="p-4">Trạng thái</th><th className="p-4">Ngày</th><th className="p-4">Hành động</th></tr></thead>
                                <tbody>
                                    {paginatedPayments.map(payment => {
                                        const user = allUsers.find(u => u.id === payment.userId);
                                        return (
                                            <tr key={payment.id} className="border-b hover:bg-gray-50">
                                                <td className="p-4 font-mono text-xs">{payment.transactionId}</td>
                                                <td className="p-4">
                                                    {user ? (<div className="flex items-center gap-3"><img src={user.profilePictureUrl?.startsWith('http') ? user.profilePictureUrl : `http://localhost:3001${user.profilePictureUrl}`} alt={user.name} className="w-8 h-8 rounded-full" /><div><p className="font-semibold text-gray-800 text-sm">{user.name}</p></div></div>) : "Không rõ"}
                                                </td>
                                                <td className="p-4 text-sm">{payment.serviceName}</td>
                                                <td className="p-4 text-sm font-semibold text-brand-primary">{formatPrice(payment.amount)}</td>
                                                <td className="p-4 text-sm">{METHOD_TEXT[payment.method]}</td>
                                                <td className="p-4"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${STATUS_CONFIG[payment.status].bgColor} ${STATUS_CONFIG[payment.status].color}`}>{STATUS_CONFIG[payment.status].text}</span></td>
                                                <td className="p-4 text-sm">{new Date(payment.date).toLocaleDateString('vi-VN')}</td>
                                                <td className="p-4"><div className="flex items-center gap-1">
                                                    {payment.status === 'Pending' && payment.method === 'Cash' && (
                                                        <button
                                                            onClick={() => handleConfirmPayment(payment.id)}
                                                            className="p-2 bg-green-100 text-green-600 hover:bg-green-200 rounded-md transition-colors"
                                                            title="Xác nhận đã nhận tiền mặt"
                                                        >
                                                            <CheckCircleIcon className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                    {payment.status === 'Completed' && payment.method !== 'Cash' && (
                                                        <button onClick={() => handleRefund(payment.id)} className="p-2 text-gray-500 hover:text-orange-600" title="Hoàn tiền">
                                                            <ArrowUturnLeftIcon className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                    {(payment.method === 'Cash' || payment.status === 'Failed') && (
                                                        <button onClick={() => handleDeletePayment(payment.id)} className="p-2 text-gray-500 hover:text-red-600" title="Xóa giao dịch">
                                                            <TrashIcon className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                    {/* Print button removed - use invoice view for printing */}
                                                </div></td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
                    </>
                ) : (
                    <div className="text-center py-10 text-gray-500 bg-white rounded-lg shadow-md">Không tìm thấy giao dịch nào.</div>
                )
            )}

            {/* Print Confirmation Modal */}
            {showPrintModal && selectedInvoice && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowPrintModal(false)}>
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 animate-fadeIn" onClick={(e) => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="bg-brand-primary text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <PrinterIcon className="w-6 h-6" />
                                <h3 className="text-lg font-semibold">In hóa đơn {selectedInvoice.id}</h3>
                            </div>
                            <button onClick={() => setShowPrintModal(false)} className="text-white hover:text-gray-200">
                                <CloseIcon className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6">
                            <div className="mb-4">
                                <p className="text-gray-700 mb-2">Sau khi in, hóa đơn sẽ được đóng và khách hàng đặt lịch mới sẽ tạo hóa đơn mới.</p>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 mt-1">
                                            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-medium text-blue-800 mb-1">Thông tin hóa đơn</h4>
                                            <ul className="text-sm text-blue-700 space-y-1">
                                                <li>• Khách hàng: {allUsers.find(u => u.id === selectedInvoice.userId)?.name || 'Khách vãng lai'}</li>
                                                <li>• Tổng tiền: <span className="font-semibold">{formatPrice(selectedInvoice.totalAmount)}</span></li>
                                                <li>• Đã thanh toán: <span className="font-semibold text-green-600">{formatPrice(selectedInvoice.paidAmount)}</span></li>
                                                {selectedInvoice.unpaidAmount > 0 && (
                                                    <li>• Còn lại: <span className="font-semibold text-red-600">{formatPrice(selectedInvoice.unpaidAmount)}</span></li>
                                                )}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex items-center justify-end gap-3">
                            <button
                                onClick={() => setShowPrintModal(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={() => {
                                    handlePrintInvoice(selectedInvoice);
                                    setShowPrintModal(false);
                                }}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 flex items-center gap-2"
                            >
                                <PrinterIcon className="w-4 h-4" />
                                In hóa đơn
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Invoice Modal */}
            {showEditModal && editingInvoice && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowEditModal(false)}>
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto animate-fadeIn" onClick={(e) => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg flex items-center justify-between sticky top-0 z-10">
                            <div className="flex items-center gap-3">
                                <EditIcon className="w-6 h-6" />
                                <h3 className="text-lg font-semibold">Chỉnh sửa hóa đơn {editingInvoice.id}</h3>
                            </div>
                            <button onClick={() => setShowEditModal(false)} className="text-white hover:text-gray-200">
                                <CloseIcon className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6">
                            <div className="mb-4">
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h4 className="text-sm font-medium text-blue-800 mb-2">Thông tin hóa đơn</h4>
                                    <div className="text-sm text-blue-700 space-y-1">
                                        <p>• Khách hàng: <span className="font-semibold">{allUsers.find(u => u.id === editingInvoice.userId)?.name || 'Khách vãng lai'}</span></p>
                                        <p>• Tổng tiền: <span className="font-semibold">{formatPrice(editingInvoice.totalAmount)}</span></p>
                                        <p>• Đã thanh toán: <span className="font-semibold text-green-600">{formatPrice(editingInvoice.paidAmount)}</span></p>
                                        {editingInvoice.unpaidAmount > 0 && (
                                            <p>• Còn lại: <span className="font-semibold text-red-600">{formatPrice(editingInvoice.unpaidAmount)}</span></p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Services List */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-medium text-gray-700 mb-3">Danh sách dịch vụ</h4>
                                {editingInvoice.services.map((service, idx) => {
                                    const totalSessions = service.paidSessions + service.unpaidSessions;
                                    return (
                                        <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1">
                                                    <h5 className="font-medium text-gray-800">{service.serviceName}</h5>
                                                    <p className="text-sm text-gray-600 mt-1">Tổng: {totalSessions} buổi • Giá: {formatPrice(service.price)}/buổi</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-semibold text-gray-800">{formatPrice(service.totalPrice)}</p>
                                                </div>
                                            </div>

                                            {/* Payment Status */}
                                            <div className="flex items-center gap-4 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                                    <span className="text-green-700 font-medium">{service.paidSessions} buổi đã thanh toán</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                                    <span className="text-red-700 font-medium">{service.unpaidSessions} buổi chưa thanh toán</span>
                                                </div>
                                            </div>

                                            {/* Appointment Items */}
                                            <div className="mt-3 space-y-2">
                                                {service.appointmentIds.map((aptId) => {
                                                    const appt = allAppointments.find(a => a.id === aptId);
                                                    if (!appt) return null;
                                                    return (
                                                        <div key={appt.id} className="flex items-center justify-between bg-gray-50 rounded p-3">
                                                            <div className="flex-1">
                                                                <p className="text-sm text-gray-700">
                                                                    Ngày: <span className="font-medium">{new Date(appt.date).toLocaleDateString('vi-VN')}</span> • {appt.time}
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <span className={`px-2 py-1 text-xs font-medium rounded ${appt.paymentStatus === 'Paid'
                                                                    ? 'bg-green-100 text-green-700'
                                                                    : 'bg-red-100 text-red-700'
                                                                    }`}>
                                                                    {appt.paymentStatus === 'Paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                                                                </span>
                                                                {appt.paymentStatus === 'Paid' ? (
                                                                    <button
                                                                        onClick={() => handleUpdateServicePayment(appt.id, 'Unpaid')}
                                                                        className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                                                                    >
                                                                        Đánh dấu chưa TT
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => handleUpdateServicePayment(appt.id, 'Paid')}
                                                                        className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                                                                    >
                                                                        Đánh dấu đã TT
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex items-center justify-end gap-3 sticky bottom-0">
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentsPage;
