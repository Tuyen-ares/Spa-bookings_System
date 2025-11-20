import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import * as apiService from '../../client/services/apiService';
import type { TreatmentCourse, User, Service, Appointment } from '../../types';

interface TreatmentCoursesPageProps {
    allUsers: User[];
    allServices: Service[];
}

const TreatmentCoursesPage: React.FC<TreatmentCoursesPageProps> = ({ allUsers, allServices }) => {
    const navigate = useNavigate();
    const [courses, setCourses] = useState<TreatmentCourse[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [filteredCourses, setFilteredCourses] = useState<TreatmentCourse[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filters
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [clientFilter, setClientFilter] = useState<string>('all');
    const [serviceFilter, setServiceFilter] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [courses, statusFilter, clientFilter, serviceFilter, searchTerm]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            // Load treatment courses, appointments, and treatment sessions
            const [coursesData, appointmentsData] = await Promise.all([
                apiService.getTreatmentCourses(),
                apiService.getAppointments()
            ]);

            // Filter courses based on course status, not appointment status
            // A course should be shown if:
            // 1. It has status 'active' (not completed, expired, or cancelled)
            // 2. OR it has completedSessions < totalSessions (still has sessions to complete)
            // This ensures courses remain visible even when some appointments are completed
            const activeCourses = coursesData.filter(course => {
                // Show active courses
                if (course.status === 'active') {
                    return true;
                }
                // Show courses that are not fully completed (completedSessions < totalSessions)
                if (course.completedSessions < course.totalSessions) {
                    return true;
                }
                // Also show completed courses (for viewing history)
                if (course.status === 'completed') {
                    return true;
                }
                return false;
            });

            setCourses(activeCourses);
            setAppointments(appointmentsData);
        } catch (error) {
            console.error('Error loading data:', error);
            alert('Không thể tải danh sách liệu trình');
        } finally {
            setIsLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...courses];

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(c => c.status === statusFilter);
        }

        // Client filter
        if (clientFilter !== 'all') {
            filtered = filtered.filter(c => c.clientId === clientFilter);
        }

        // Service filter
        if (serviceFilter !== 'all') {
            filtered = filtered.filter(c => c.serviceId === serviceFilter);
        }

        // Search term
        if (searchTerm) {
            filtered = filtered.filter(c => {
                const client = allUsers.find(u => u.id === c.clientId);
                const service = allServices.find(s => s.id === c.serviceId);
                
                return (
                    c.serviceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    client?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    service?.name?.toLowerCase().includes(searchTerm.toLowerCase())
                );
            });
        }

        setFilteredCourses(filtered);
        setCurrentPage(1);
    };

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
            active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Đang hoạt động' },
            paused: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Tạm dừng' },
            completed: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Hoàn thành' },
            expired: { bg: 'bg-red-100', text: 'text-red-800', label: 'Hết hạn' },
            cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Đã hủy' }
        };

        const config = statusConfig[status] || statusConfig.active;
        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        );
    };

    const getProgressPercentage = (course: TreatmentCourse) => {
        if (!course.totalSessions) return 0;
        const completed = course.completedSessions || 0;
        return Math.round((completed / course.totalSessions) * 100);
    };

    const getDaysUntilExpiry = (expiryDate: string) => {
        const today = new Date();
        const expiry = new Date(expiryDate);
        const diffTime = expiry.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const getNextSessionReminder = (course: TreatmentCourse) => {
        // Find next scheduled session
        const courseAppointments = appointments.filter(
            apt => apt.serviceId === course.serviceId && apt.userId === course.clientId
        );
        
        if (courseAppointments.length === 0) return null;
        
        // Sort by date and find next upcoming appointment
        const upcomingAppointments = courseAppointments
            .filter(apt => apt.status === 'upcoming' || apt.status === 'scheduled')
            .sort((a, b) => {
                const dateA = new Date(`${a.date} ${a.time}`);
                const dateB = new Date(`${b.date} ${b.time}`);
                return dateA.getTime() - dateB.getTime();
            });

        if (upcomingAppointments.length === 0) return null;

        const nextAppointment = upcomingAppointments[0];
        const appointmentDate = new Date(`${nextAppointment.date} ${nextAppointment.time}`);
        const today = new Date();
        const diffTime = appointmentDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return {
            date: nextAppointment.date,
            time: nextAppointment.time,
            daysUntil: diffDays
        };
    };

    // Pagination
    const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedCourses = filteredCourses.slice(startIndex, startIndex + itemsPerPage);

    // Stats
    const stats = useMemo(() => {
        return {
            total: courses.length,
            active: courses.filter(c => c.status === 'active').length,
            completed: courses.filter(c => c.status === 'completed').length,
            expired: courses.filter(c => c.status === 'expired' || (c.expiryDate && new Date(c.expiryDate) < new Date())).length,
            expiringSoon: courses.filter(c => {
                if (!c.expiryDate) return false;
                const days = getDaysUntilExpiry(c.expiryDate);
                return days > 0 && days <= 7;
            }).length
        };
    }, [courses]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-xl text-gray-600">Đang tải...</div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Quản lý Liệu trình</h1>
                <p className="text-gray-600 mt-1">Theo dõi và quản lý liệu trình điều trị từ các đặt lịch đã được duyệt</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="text-sm text-gray-600">Tổng số</div>
                    <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="text-sm text-gray-600">Đang hoạt động</div>
                    <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="text-sm text-gray-600">Hoàn thành</div>
                    <div className="text-2xl font-bold text-blue-600">{stats.completed}</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="text-sm text-gray-600">Hết hạn</div>
                    <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="text-sm text-gray-600">Sắp hết hạn</div>
                    <div className="text-2xl font-bold text-orange-600">{stats.expiringSoon}</div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tìm kiếm</label>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Tên khách, dịch vụ..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
                        >
                            <option value="all">Tất cả</option>
                            <option value="active">Đang hoạt động</option>
                            <option value="completed">Hoàn thành</option>
                            <option value="expired">Hết hạn</option>
                            <option value="cancelled">Đã hủy</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Khách hàng</label>
                        <select
                            value={clientFilter}
                            onChange={(e) => setClientFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
                        >
                            <option value="all">Tất cả</option>
                            {allUsers.filter(u => u.role === 'Client').map(user => (
                                <option key={user.id} value={user.id}>
                                    {user.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Dịch vụ</label>
                        <select
                            value={serviceFilter}
                            onChange={(e) => setServiceFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
                        >
                            <option value="all">Tất cả</option>
                            {allServices.map(service => (
                                <option key={service.id} value={service.id}>
                                    {service.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Khách hàng</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Dịch vụ</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Số buổi</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Tiến độ</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Trạng thái</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Hạn sử dụng</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Nhắc nhở</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {paginatedCourses.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                                        Không tìm thấy liệu trình nào
                                    </td>
                                </tr>
                            ) : (
                                paginatedCourses.map((course) => {
                                    // Try to get client from course.Client (from backend association) first, then fallback to allUsers
                                    const client = (course as any).Client || allUsers.find(u => u.id === course.clientId);
                                    const service = allServices.find(s => s.id === course.serviceId);
                                    const progress = getProgressPercentage(course);
                                    const daysUntilExpiry = course.expiryDate ? getDaysUntilExpiry(course.expiryDate) : null;
                                    const nextReminder = getNextSessionReminder(course);

                                    return (
                                        <tr key={course.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-gray-900">{client?.name || 'N/A'}</div>
                                                {client?.phone && (
                                                    <div className="text-xs text-gray-500 flex items-center gap-1">
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                        </svg>
                                                        {client.phone}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-sm text-gray-900">{course.serviceName || service?.name || 'N/A'}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {course.completedSessions || 0}/{course.totalSessions}
                                                </div>
                                                <div className="text-xs text-gray-500">Tổng: {course.totalSessions} buổi</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 min-w-[80px]">
                                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                                            <div
                                                                className={`h-2 rounded-full transition-all ${
                                                                    progress === 100 ? 'bg-green-500' : 
                                                                    progress >= 50 ? 'bg-blue-500' : 'bg-yellow-500'
                                                                }`}
                                                                style={{ width: `${progress}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                    <span className="text-sm text-gray-600 whitespace-nowrap">
                                                        {progress}%
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {getStatusBadge(course.status)}
                                                {daysUntilExpiry !== null && daysUntilExpiry > 0 && daysUntilExpiry <= 7 && (
                                                    <div className="text-xs text-orange-600 mt-1">
                                                        Còn {daysUntilExpiry} ngày
                                                    </div>
                                                )}
                                                {daysUntilExpiry !== null && daysUntilExpiry <= 0 && (
                                                    <div className="text-xs text-red-600 mt-1">
                                                        Đã hết hạn
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {course.expiryDate ? new Date(course.expiryDate).toLocaleDateString('vi-VN') : '-'}
                                            </td>
                                            <td className="px-4 py-3">
                                                {nextReminder ? (
                                                    <div className="text-sm">
                                                        <div className="text-gray-900">
                                                            {new Date(nextReminder.date).toLocaleDateString('vi-VN')} {nextReminder.time}
                                                        </div>
                                                        {nextReminder.daysUntil > 0 && (
                                                            <div className={`text-xs ${nextReminder.daysUntil <= 2 ? 'text-red-600 font-semibold' : 'text-orange-600'}`}>
                                                                {nextReminder.daysUntil === 0 ? 'Hôm nay' : 
                                                                 nextReminder.daysUntil === 1 ? 'Ngày mai' : 
                                                                 `Còn ${nextReminder.daysUntil} ngày`}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => navigate(`/admin/treatment-courses/${course.id}`)}
                                                    className="text-brand-primary hover:text-brand-secondary text-sm font-medium"
                                                >
                                                    Xem chi tiết →
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            Hiển thị {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredCourses.length)} trong tổng số {filteredCourses.length}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                                Trước
                            </button>
                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i + 1}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`px-3 py-1 border rounded-md ${
                                        currentPage === i + 1
                                            ? 'bg-brand-primary text-white border-brand-primary'
                                            : 'border-gray-300 hover:bg-gray-50'
                                    }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                                Sau
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TreatmentCoursesPage;
