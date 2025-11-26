
import React, { useMemo, useState, useRef, useEffect } from 'react';
import type { User, Appointment, Service, Payment } from '../../types';
import { PrinterIcon, CurrencyDollarIcon, ChartBarIcon, ClockIcon, CheckCircleIcon } from '../../shared/icons';
import * as apiService from '../../client/services/apiService';
import { formatDateDDMMYYYY, parseDDMMYYYYToYYYYMMDD } from '../../shared/dateUtils';

// Helper: Convert DD-MM-YYYY to YYYY-MM-DD for date input
const convertToDateInputFormat = (dateStr: string): string => {
    if (!dateStr) return '';
    const parsed = parseDDMMYYYYToYYYYMMDD(dateStr);
    return parsed || '';
};

// Helper: Convert YYYY-MM-DD to DD-MM-YYYY from date input
const convertFromDateInputFormat = (dateStr: string): string => {
    if (!dateStr) return '';
    try {
        const date = new Date(dateStr);
        return formatDateDDMMYYYY(date);
    } catch {
        return '';
    }
};

// Helper: Convert MM-YYYY to YYYY-MM for month input
const convertToMonthInputFormat = (monthStr: string): string => {
    if (!monthStr) return '';
    const parts = monthStr.split('-');
    if (parts.length !== 2) return '';
    const [month, year] = parts;
    return `${year}-${month.padStart(2, '0')}`;
};

// Helper: Convert YYYY-MM to MM-YYYY from month input
const convertFromMonthInputFormat = (monthStr: string): string => {
    if (!monthStr) return '';
    const parts = monthStr.split('-');
    if (parts.length !== 2) return '';
    const [year, month] = parts;
    return `${month}-${year}`;
};

interface ReportsPageProps {
    allServices: Service[];
    allAppointments: Appointment[];
    allUsers: User[];
    allPayments: Payment[];
    allReviews: any[];
}

const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

const ReportsPage: React.FC<ReportsPageProps> = ({
    allServices,
    allAppointments,
    allUsers,
    allPayments,
    allReviews
}) => {
    const [viewMode, setViewMode] = useState<'day' | 'month' | 'year' | 'range'>('month');
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [selectedMonth, setSelectedMonth] = useState<string>('');
    const [selectedYear, setSelectedYear] = useState<string>('');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [dateError, setDateError] = useState<string>('');
    const printRef = useRef<HTMLDivElement>(null);
    
    // Local states để fetch dữ liệu nếu props rỗng
    const [localServices, setLocalServices] = useState<Service[]>(allServices || []);
    const [localAppointments, setLocalAppointments] = useState<Appointment[]>(allAppointments || []);
    const [localPayments, setLocalPayments] = useState<Payment[]>(allPayments || []);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch dữ liệu nếu props rỗng
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                
                if (!allServices || allServices.length === 0) {
                    console.log('ReportsPage - Fetching services from API...');
                    const services = await apiService.getServices();
                    console.log('ReportsPage - Fetched services:', services.length);
                    setLocalServices(services);
                } else {
                    console.log('ReportsPage - Using services from props:', allServices.length);
                    setLocalServices(allServices);
                }

                if (!allAppointments || allAppointments.length === 0) {
                    console.log('ReportsPage - Fetching appointments from API...');
                    const appointments = await apiService.getAppointments();
                    console.log('ReportsPage - Fetched appointments:', appointments.length);
                    setLocalAppointments(appointments);
                } else {
                    console.log('ReportsPage - Using appointments from props:', allAppointments.length);
                    setLocalAppointments(allAppointments);
                }

                if (!allPayments || allPayments.length === 0) {
                    console.log('ReportsPage - Fetching payments from API...');
                    const payments = await apiService.getPayments();
                    console.log('ReportsPage - Fetched payments:', payments.length);
                    setLocalPayments(payments);
                } else {
                    console.log('ReportsPage - Using payments from props:', allPayments.length);
                    setLocalPayments(allPayments);
                }
            } catch (error) {
                console.error('Error fetching data for ReportsPage:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [allServices, allAppointments, allPayments]);

    // Khởi tạo ngày hiện tại
    useEffect(() => {
        const today = new Date();
        setSelectedDate(formatDateDDMMYYYY(today));
        setSelectedMonth(`${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`);
        setSelectedYear(String(today.getFullYear()));
        
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        setStartDate(formatDateDDMMYYYY(firstDayOfMonth));
        setEndDate(formatDateDDMMYYYY(today));
    }, []);

    // Validation date range
    useEffect(() => {
        if (viewMode !== 'range' || !startDate || !endDate) {
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

        startDateObj.setHours(0, 0, 0, 0);
        endDateObj.setHours(0, 0, 0, 0);

        if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
            setDateError('Ngày không hợp lệ');
            return;
        }

        if (startDateObj > today) {
            setDateError('Ngày bắt đầu không được lớn hơn ngày hiện tại');
            return;
        }

        if (endDateObj > today) {
            setDateError('Ngày kết thúc không được lớn hơn ngày hiện tại');
            return;
        }

        if (startDateObj > endDateObj) {
            setDateError('Ngày bắt đầu không được lớn hơn ngày kết thúc');
            return;
        }

        setDateError('');
    }, [startDate, endDate, viewMode]);

    // Filter payments based on view mode - Tính báo cáo từ thanh toán hoàn thành
    const filteredPayments = useMemo(() => {
        console.log('ReportsPage - All payments:', {
            total: localPayments.length,
            byStatus: localPayments.reduce((acc, payment) => {
                acc[payment.status] = (acc[payment.status] || 0) + 1;
                return acc;
            }, {} as Record<string, number>)
        });

        // Chỉ lấy payments đã hoàn thành (Completed)
        let filtered = localPayments.filter(payment => payment.status === 'Completed');

        console.log('ReportsPage - Filtered payments (Completed only):', filtered.length);

        if (viewMode === 'day' && selectedDate) {
            const date = parseDDMMYYYYToYYYYMMDD(selectedDate);
            if (date) {
                const targetDate = new Date(date).toISOString().split('T')[0];
                filtered = filtered.filter(payment => {
                    const paymentDate = new Date(payment.date).toISOString().split('T')[0];
                    return paymentDate === targetDate;
                });
            }
        } else if (viewMode === 'month' && selectedMonth) {
            const [month, year] = selectedMonth.split('-').map(Number);
            filtered = filtered.filter(payment => {
                const paymentDate = new Date(payment.date);
                return paymentDate.getMonth() + 1 === month && paymentDate.getFullYear() === year;
            });
        } else if (viewMode === 'year' && selectedYear) {
            const year = Number(selectedYear);
            filtered = filtered.filter(payment => {
                const paymentDate = new Date(payment.date);
                return paymentDate.getFullYear() === year;
            });
        } else if (viewMode === 'range' && startDate && endDate && !dateError) {
            const start = parseDDMMYYYYToYYYYMMDD(startDate);
            const end = parseDDMMYYYYToYYYYMMDD(endDate);
            if (start && end) {
                const startDateObj = new Date(start);
                const endDateObj = new Date(end);
                endDateObj.setHours(23, 59, 59, 999);
                filtered = filtered.filter(payment => {
                    const paymentDate = new Date(payment.date);
                    return paymentDate >= startDateObj && paymentDate <= endDateObj;
                });
            }
        }

        console.log('ReportsPage - Final filtered payments:', {
            count: filtered.length,
            totalAmount: filtered.reduce((sum, p) => sum + p.amount, 0)
        });

        return filtered;
    }, [localPayments, viewMode, selectedDate, selectedMonth, selectedYear, startDate, endDate, dateError]);

    // Calculate service statistics từ payments
    const serviceStats = useMemo(() => {
        const stats: Record<string, {
            service: Service | null;
            serviceId: string;
            serviceName: string;
            price: number;
            quantity: number;
            totalAmount: number;
        }> = {};

        console.log('ReportsPage - Calculating service stats from payments:', {
            filteredPaymentsCount: filteredPayments.length,
            servicesCount: localServices.length
        });

        filteredPayments.forEach(payment => {
            // Lấy thông tin appointment để biết serviceId và quantity
            const appointment = payment.appointmentId 
                ? localAppointments.find(apt => apt.id === payment.appointmentId)
                : null;
            
            const serviceId = appointment?.serviceId || 'unknown';
            const service = localServices.find(s => s.id === serviceId);
            const serviceName = payment.serviceName || service?.name || 'Dịch vụ không xác định';
            const quantity = appointment?.quantity || 1;
            
            if (!stats[serviceId]) {
                stats[serviceId] = {
                    service: service || null,
                    serviceId: serviceId,
                    serviceName: serviceName,
                    price: service?.price || 0,
                    quantity: 0,
                    totalAmount: 0
                };
            }
            
            stats[serviceId].quantity += quantity;
            stats[serviceId].totalAmount += Number(payment.amount);
        });

        const result = Object.values(stats).sort((a, b) => b.totalAmount - a.totalAmount);
        console.log('ReportsPage - Service stats result:', result);
        return result;
    }, [filteredPayments, localServices, localAppointments]);

    // Calculate totals
    const totalAmount = useMemo(() => {
        return serviceStats.reduce((sum, stat) => sum + stat.totalAmount, 0);
    }, [serviceStats]);

    const totalQuantity = useMemo(() => {
        return serviceStats.reduce((sum, stat) => sum + stat.quantity, 0);
    }, [serviceStats]);

    // Get period label
    const getPeriodLabel = () => {
        switch (viewMode) {
            case 'day':
                return selectedDate || 'Chưa chọn ngày';
            case 'month':
                return selectedMonth ? `Tháng ${selectedMonth}` : 'Chưa chọn tháng';
            case 'year':
                return selectedYear ? `Năm ${selectedYear}` : 'Chưa chọn năm';
            case 'range':
                return startDate && endDate ? `${startDate} - ${endDate}` : 'Chưa chọn khoảng thời gian';
            default:
                return '';
        }
    };

    // Export to CSV
    const handleExportCSV = () => {
        if (serviceStats.length === 0) {
            alert('Không có dữ liệu để xuất CSV');
            return;
        }

        // Create CSV content
        const headers = ['STT', 'Mã Dịch Vụ', 'Tên Dịch Vụ', 'Giá Gốc', 'Số Buổi', 'Doanh Thu'];
        const rows = serviceStats.map((stat, index) => [
            index + 1,
            stat.serviceId,
            stat.serviceName,
            stat.price.toLocaleString('vi-VN'),
            stat.quantity,
            stat.totalAmount.toLocaleString('vi-VN')
        ]);

        // Add total row
        rows.push(['', '', 'TỔNG TIỀN', '', totalQuantity, totalAmount.toLocaleString('vi-VN')]);

        // Convert to CSV format
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        // Add BOM for UTF-8 to support Vietnamese characters in Excel
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        // Generate filename with date range
        const periodLabel = getPeriodLabel().replace(/[^a-zA-Z0-9]/g, '_');
        const filename = `Bao_Cao_Thong_Ke_Dich_Vu_${periodLabel}_${new Date().toISOString().split('T')[0]}.csv`;
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Print report
    const handlePrint = () => {
        if (printRef.current) {
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(`
                    <html>
                        <head>
                            <title>Báo Cáo Thống Kê Dịch Vụ - Anh Thơ Spa</title>
                            <style>
                                body { font-family: Arial, sans-serif; padding: 20px; }
                                h1 { color: #8B4513; text-align: center; }
                                h2 { color: #666; text-align: center; margin-bottom: 20px; }
                                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                                th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                                th { background-color: #8B4513; color: white; font-weight: bold; }
                                tr:nth-child(even) { background-color: #f9f9f9; }
                                .total-row { background-color: #f0f0f0; font-weight: bold; }
                                .text-right { text-align: right; }
                                .header { text-align: center; margin-bottom: 30px; }
                                @media print {
                                    body { padding: 10px; }
                                }
                            </style>
                        </head>
                        <body>
                            ${printRef.current.innerHTML}
                        </body>
                    </html>
                `);
                printWindow.document.close();
                printWindow.print();
            }
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
                    <p className="text-gray-600">Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header với gradient */}
            <div className="bg-gradient-to-r from-brand-primary via-purple-600 to-pink-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                            📊 Báo Cáo Thống Kê Dịch Vụ
                        </h1>
                        <p className="text-white/90 text-sm">Phân tích doanh thu và hiệu suất dịch vụ</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleExportCSV}
                            className="px-5 py-2.5 bg-white text-green-600 rounded-lg font-semibold hover:bg-green-50 transition-all flex items-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Xuất CSV
                        </button>
                        <button
                            onClick={handlePrint}
                            className="px-5 py-2.5 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-all flex items-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                        >
                            <PrinterIcon className="w-5 h-5" />
                            In báo cáo
                        </button>
                    </div>
                </div>
            </div>

            {/* Stat Cards với gradient */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-all">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm font-medium mb-1">Tổng Doanh Thu</p>
                            <p className="text-3xl font-bold">{formatCurrency(totalAmount)}</p>
                        </div>
                        <div className="bg-white/20 p-4 rounded-full">
                            <CurrencyDollarIcon className="w-8 h-8" />
                        </div>
                    </div>
                </div>
                
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-all">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm font-medium mb-1">Tổng Số Buổi</p>
                            <p className="text-3xl font-bold">{totalQuantity}</p>
                        </div>
                        <div className="bg-white/20 p-4 rounded-full">
                            <CheckCircleIcon className="w-8 h-8" />
                        </div>
                    </div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-all">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-100 text-sm font-medium mb-1">Số Dịch Vụ</p>
                            <p className="text-3xl font-bold">{serviceStats.length}</p>
                        </div>
                        <div className="bg-white/20 p-4 rounded-full">
                            <ChartBarIcon className="w-8 h-8" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters với gradient border */}
            <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-gradient-to-r from-brand-primary to-purple-600">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <ClockIcon className="w-5 h-5 text-brand-primary" />
                    Chọn Kỳ Báo Cáo
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Chế độ xem</label>
                        <select
                            value={viewMode}
                            onChange={(e) => setViewMode(e.target.value as 'day' | 'month' | 'year' | 'range')}
                            className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all"
                        >
                            <option value="day">📅 Theo ngày</option>
                            <option value="month">📆 Theo tháng</option>
                            <option value="year">🗓️ Theo năm</option>
                            <option value="range">📊 Khoảng thời gian</option>
                        </select>
                    </div>

                    {viewMode === 'day' && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Chọn ngày</label>
                            <input
                                type="date"
                                value={convertToDateInputFormat(selectedDate)}
                                onChange={(e) => {
                                    const converted = convertFromDateInputFormat(e.target.value);
                                    if (converted) setSelectedDate(converted);
                                }}
                                max={formatDateDDMMYYYY(new Date())}
                                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all"
                            />
                        </div>
                    )}

                    {viewMode === 'month' && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Chọn tháng</label>
                            <input
                                type="month"
                                value={convertToMonthInputFormat(selectedMonth)}
                                onChange={(e) => {
                                    const converted = convertFromMonthInputFormat(e.target.value);
                                    if (converted) setSelectedMonth(converted);
                                }}
                                max={`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`}
                                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all"
                            />
                        </div>
                    )}

                    {viewMode === 'year' && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Chọn năm</label>
                            <input
                                type="number"
                                value={selectedYear}
                                onChange={(e) => {
                                    const year = e.target.value;
                                    if (year && !isNaN(Number(year)) && year.length === 4) {
                                        setSelectedYear(year);
                                    } else if (year === '') {
                                        setSelectedYear('');
                                    }
                                }}
                                min="2000"
                                max={new Date().getFullYear()}
                                placeholder="YYYY"
                                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all"
                            />
                        </div>
                    )}

                    {viewMode === 'range' && (
                        <>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Từ ngày</label>
                                <input
                                    type="date"
                                    value={convertToDateInputFormat(startDate)}
                                    onChange={(e) => {
                                        const converted = convertFromDateInputFormat(e.target.value);
                                        if (converted) setStartDate(converted);
                                    }}
                                    max={formatDateDDMMYYYY(new Date())}
                                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Đến ngày</label>
                                <input
                                    type="date"
                                    value={convertToDateInputFormat(endDate)}
                                    onChange={(e) => {
                                        const converted = convertFromDateInputFormat(e.target.value);
                                        if (converted) setEndDate(converted);
                                    }}
                                    min={convertToDateInputFormat(startDate) || undefined}
                                    max={formatDateDDMMYYYY(new Date())}
                                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all"
                                />
                            </div>
                        </>
                    )}
                </div>

                {dateError && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-500 rounded-lg shadow-sm">
                        <p className="text-sm text-red-700 font-medium">⚠️ {dateError}</p>
                    </div>
                )}

                {!dateError && getPeriodLabel() && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-lg shadow-sm">
                        <p className="text-sm text-blue-800 font-medium">
                            <strong>📅 Kỳ báo cáo:</strong> {getPeriodLabel()}
                        </p>
                    </div>
                )}
            </div>

            {/* Print-friendly content */}
            <div ref={printRef} className="print-content">
                <div className="header text-center mb-6 print:block hidden">
                    <h1 className="text-3xl font-bold text-brand-primary mb-2">ANH THƠ SPA</h1>
                    <h2 className="text-2xl font-semibold text-gray-700">BÁO CÁO THỐNG KÊ DỊCH VỤ</h2>
                    <p className="text-gray-600 mt-2">Kỳ báo cáo: {getPeriodLabel()}</p>
                    <p className="text-gray-500">Ngày xuất: {new Date().toLocaleDateString('vi-VN')}</p>
                </div>

                {/* Statistics Table */}
                <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gradient-to-r from-brand-primary via-purple-600 to-pink-600 text-white">
                                    <th className="text-left py-4 px-6 font-bold text-sm uppercase tracking-wider">STT</th>
                                    <th className="text-left py-4 px-6 font-bold text-sm uppercase tracking-wider">Mã Dịch Vụ</th>
                                    <th className="text-left py-4 px-6 font-bold text-sm uppercase tracking-wider">Tên Dịch Vụ</th>
                                    <th className="text-right py-4 px-6 font-bold text-sm uppercase tracking-wider">Giá Gốc</th>
                                    <th className="text-right py-4 px-6 font-bold text-sm uppercase tracking-wider">Số Buổi</th>
                                    <th className="text-right py-4 px-6 font-bold text-sm uppercase tracking-wider">Doanh Thu</th>
                                </tr>
                            </thead>
                            <tbody>
                                {serviceStats.length > 0 ? (
                                    <>
                                        {serviceStats.map((stat, index) => (
                                            <tr key={stat.serviceId + index} className="border-b border-gray-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200">
                                                <td className="py-4 px-6 text-gray-700 font-semibold">{index + 1}</td>
                                                <td className="py-4 px-6 text-gray-600 font-mono text-sm bg-gray-50 rounded">{stat.serviceId}</td>
                                                <td className="py-4 px-6 font-semibold text-gray-800">{stat.serviceName}</td>
                                                <td className="py-4 px-6 text-right text-gray-600 font-medium">{formatCurrency(stat.price)}</td>
                                                <td className="py-4 px-6 text-right">
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-700">
                                                        {stat.quantity}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-right font-bold text-green-600 text-lg">{formatCurrency(stat.totalAmount)}</td>
                                            </tr>
                                        ))}
                                        <tr className="bg-gradient-to-r from-gray-100 to-gray-50 font-bold border-t-2 border-brand-primary">
                                            <td colSpan={5} className="py-5 px-6 text-right text-gray-800 text-lg uppercase tracking-wide">💰 TỔNG DOANH THU</td>
                                            <td className="py-5 px-6 text-right text-brand-primary text-2xl font-extrabold">{formatCurrency(totalAmount)}</td>
                                        </tr>
                                    </>
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="py-16 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <ChartBarIcon className="w-16 h-16 text-gray-300" />
                                                <p className="text-gray-500 text-lg font-medium">Không có dữ liệu cho kỳ báo cáo này</p>
                                                <p className="text-gray-400 text-sm">Vui lòng chọn kỳ báo cáo khác</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportsPage;
