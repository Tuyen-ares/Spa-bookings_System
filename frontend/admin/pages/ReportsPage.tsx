
import React, { useMemo, useState, useRef, useEffect } from 'react';
import type { User, Appointment, Service, Payment } from '../../types';
import { PrinterIcon } from '../../shared/icons';
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

    // Filter appointments based on view mode
    const filteredAppointments = useMemo(() => {
        // Debug: Log all appointments and their statuses
        console.log('ReportsPage - All appointments:', {
            total: localAppointments.length,
            byStatus: localAppointments.reduce((acc, apt) => {
                acc[apt.status] = (acc[apt.status] || 0) + 1;
                return acc;
            }, {} as Record<string, number>),
            byPaymentStatus: localAppointments.reduce((acc, apt) => {
                acc[apt.paymentStatus || 'Unknown'] = (acc[apt.paymentStatus || 'Unknown'] || 0) + 1;
                return acc;
            }, {} as Record<string, number>)
        });

        // Filter: Include completed appointments OR paid appointments (for revenue reporting)
        let filtered = localAppointments.filter(apt => 
            apt.status === 'completed' || apt.paymentStatus === 'Paid'
        );

        console.log('ReportsPage - Filtered appointments (after status filter):', filtered.length);

        if (viewMode === 'day' && selectedDate) {
            const date = parseDDMMYYYYToYYYYMMDD(selectedDate);
            if (date) {
                const targetDate = new Date(date).toISOString().split('T')[0];
                filtered = filtered.filter(apt => apt.date === targetDate);
            }
        } else if (viewMode === 'month' && selectedMonth) {
            const [month, year] = selectedMonth.split('-').map(Number);
            filtered = filtered.filter(apt => {
                const aptDate = new Date(apt.date);
                return aptDate.getMonth() + 1 === month && aptDate.getFullYear() === year;
            });
        } else if (viewMode === 'year' && selectedYear) {
            const year = Number(selectedYear);
            filtered = filtered.filter(apt => {
                const aptDate = new Date(apt.date);
                return aptDate.getFullYear() === year;
            });
        } else if (viewMode === 'range' && startDate && endDate && !dateError) {
            const start = parseDDMMYYYYToYYYYMMDD(startDate);
            const end = parseDDMMYYYYToYYYYMMDD(endDate);
            if (start && end) {
                const startDateObj = new Date(start);
                const endDateObj = new Date(end);
                endDateObj.setHours(23, 59, 59, 999);
                filtered = filtered.filter(apt => {
                    const aptDate = new Date(apt.date);
                    return aptDate >= startDateObj && aptDate <= endDateObj;
                });
            }
        }

        console.log('ReportsPage - Final filtered appointments:', {
            count: filtered.length,
            services: filtered.map(apt => ({ serviceId: apt.serviceId, date: apt.date }))
        });

        return filtered;
    }, [localAppointments, viewMode, selectedDate, selectedMonth, selectedYear, startDate, endDate, dateError]);

    // Calculate service statistics
    const serviceStats = useMemo(() => {
        const stats: Record<string, {
            service: Service;
            serviceId: string;
            price: number;
            quantity: number;
            totalAmount: number;
        }> = {};

        console.log('ReportsPage - Calculating service stats:', {
            filteredAppointmentsCount: filteredAppointments.length,
            servicesCount: localServices.length
        });

        filteredAppointments.forEach(apt => {
            const service = localServices.find(s => s.id === apt.serviceId);
            if (service) {
                if (!stats[apt.serviceId]) {
                    stats[apt.serviceId] = {
                        service,
                        serviceId: service.id,
                        price: service.price,
                        quantity: 0,
                        totalAmount: 0
                    };
                }
                stats[apt.serviceId].quantity++;
                stats[apt.serviceId].totalAmount += Number(service.price);
            } else {
                console.warn('ReportsPage - Service not found for appointment:', {
                    appointmentId: apt.id,
                    serviceId: apt.serviceId
                });
            }
        });

        const result = Object.values(stats).sort((a, b) => b.quantity - a.quantity);
        console.log('ReportsPage - Service stats result:', result);
        return result;
    }, [filteredAppointments, localServices]);

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
        const headers = ['STT', 'Mã Dịch Vụ', 'Tên Dịch Vụ', 'Giá', 'Số Lượng', 'Thành Tiền'];
        const rows = serviceStats.map((stat, index) => [
            index + 1,
            stat.serviceId,
            stat.service.name,
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
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Báo Cáo Thống Kê Dịch Vụ</h1>
                <div className="flex gap-3">
                    <button
                        onClick={handleExportCSV}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Xuất CSV
                    </button>
                    <button
                        onClick={handlePrint}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <PrinterIcon className="w-5 h-5" />
                        In báo cáo
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Chế độ xem</label>
                        <select
                            value={viewMode}
                            onChange={(e) => setViewMode(e.target.value as 'day' | 'month' | 'year' | 'range')}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
                        >
                            <option value="day">Theo ngày</option>
                            <option value="month">Theo tháng</option>
                            <option value="year">Theo năm</option>
                            <option value="range">Khoảng thời gian</option>
                        </select>
                    </div>

                    {viewMode === 'day' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ngày</label>
                            <input
                                type="date"
                                value={convertToDateInputFormat(selectedDate)}
                                onChange={(e) => {
                                    const converted = convertFromDateInputFormat(e.target.value);
                                    if (converted) setSelectedDate(converted);
                                }}
                                max={formatDateDDMMYYYY(new Date())}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
                            />
                        </div>
                    )}

                    {viewMode === 'month' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Chọn tháng</label>
                            <input
                                type="month"
                                value={convertToMonthInputFormat(selectedMonth)}
                                onChange={(e) => {
                                    const converted = convertFromMonthInputFormat(e.target.value);
                                    if (converted) setSelectedMonth(converted);
                                }}
                                max={`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
                            />
                        </div>
                    )}

                    {viewMode === 'year' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Chọn năm</label>
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
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
                            />
                        </div>
                    )}

                    {viewMode === 'range' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Từ ngày</label>
                                <input
                                    type="date"
                                    value={convertToDateInputFormat(startDate)}
                                    onChange={(e) => {
                                        const converted = convertFromDateInputFormat(e.target.value);
                                        if (converted) setStartDate(converted);
                                    }}
                                    max={formatDateDDMMYYYY(new Date())}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Đến ngày</label>
                                <input
                                    type="date"
                                    value={convertToDateInputFormat(endDate)}
                                    onChange={(e) => {
                                        const converted = convertFromDateInputFormat(e.target.value);
                                        if (converted) setEndDate(converted);
                                    }}
                                    min={convertToDateInputFormat(startDate) || undefined}
                                    max={formatDateDDMMYYYY(new Date())}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                />
                            </div>
                        </>
                    )}
                </div>

                {dateError && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600">{dateError}</p>
                    </div>
                )}

                {!dateError && getPeriodLabel() && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                            <strong>Kỳ báo cáo:</strong> {getPeriodLabel()}
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
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-brand-primary text-white">
                                    <th className="text-left py-4 px-6 font-semibold">STT</th>
                                    <th className="text-left py-4 px-6 font-semibold">Mã Dịch Vụ</th>
                                    <th className="text-left py-4 px-6 font-semibold">Tên Dịch Vụ</th>
                                    <th className="text-right py-4 px-6 font-semibold">Giá</th>
                                    <th className="text-right py-4 px-6 font-semibold">Số Lượng</th>
                                    <th className="text-right py-4 px-6 font-semibold">Thành Tiền</th>
                                </tr>
                            </thead>
                            <tbody>
                                {serviceStats.length > 0 ? (
                                    <>
                                        {serviceStats.map((stat, index) => (
                                            <tr key={stat.service.id} className="border-b border-gray-200 hover:bg-gray-50">
                                                <td className="py-4 px-6 text-gray-600">{index + 1}</td>
                                                <td className="py-4 px-6 text-gray-600 font-mono text-sm">{stat.serviceId}</td>
                                                <td className="py-4 px-6 font-medium text-gray-800">{stat.service.name}</td>
                                                <td className="py-4 px-6 text-right text-gray-600">{formatCurrency(stat.price)}</td>
                                                <td className="py-4 px-6 text-right text-gray-600">{stat.quantity}</td>
                                                <td className="py-4 px-6 text-right font-semibold text-green-600">{formatCurrency(stat.totalAmount)}</td>
                                            </tr>
                                        ))}
                                        <tr className="bg-gray-100 font-bold">
                                            <td colSpan={5} className="py-4 px-6 text-right text-gray-800">TỔNG TIỀN</td>
                                            <td className="py-4 px-6 text-right text-brand-primary text-lg">{formatCurrency(totalAmount)}</td>
                                        </tr>
                                    </>
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-gray-500">
                                            Không có dữ liệu cho kỳ báo cáo này
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
