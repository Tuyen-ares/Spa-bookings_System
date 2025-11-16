import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as apiService from '../../client/services/apiService';
import type { TreatmentCourse, User, Service } from '../../types';

interface TreatmentCoursesPageProps {
    allUsers: User[];
    allServices: Service[];
}

const TreatmentCoursesPage: React.FC<TreatmentCoursesPageProps> = ({ allUsers, allServices }) => {
    const navigate = useNavigate();
    const [courses, setCourses] = useState<TreatmentCourse[]>([]);
    const [filteredCourses, setFilteredCourses] = useState<TreatmentCourse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Filters
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [clientFilter, setClientFilter] = useState<string>('');
    const [serviceFilter, setServiceFilter] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // New course form - Package template (not for specific client)
    const [newCourse, setNewCourse] = useState({
        name: '',
        description: '',
        consultantId: ''
    });

    const [selectedServices, setSelectedServices] = useState<{
        serviceId: string; 
        serviceName: string; 
        order: number;
        price: number;
        duration: number;
    }[]>([]);

    // Calculate total price and sessions automatically
    const calculatedPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
    const calculatedSessions = selectedServices.length;

    useEffect(() => {
        loadCourses();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [courses, statusFilter, clientFilter, serviceFilter, searchTerm]);

    const loadCourses = async () => {
        setIsLoading(true);
        try {
            // Chỉ lấy templates (courses không có clientId)
            const data = await apiService.getTreatmentCourses({ templatesOnly: true });
            setCourses(data);
        } catch (error) {
            console.error('Error loading courses:', error);
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
        if (clientFilter) {
            filtered = filtered.filter(c => c.clientId === clientFilter);
        }

        // Service filter
        if (serviceFilter !== 'all') {
            filtered = filtered.filter(c => {
                // Check if course has this service in its services array
                if (c.services && c.services.length > 0) {
                    return c.services.some(s => s.serviceId === serviceFilter);
                }
                // Fallback to old serviceId field
                return (c as any).serviceId === serviceFilter;
            });
        }

        // Search term
        if (searchTerm) {
            filtered = filtered.filter(c => {
                const client = allUsers.find(u => u.id === c.clientId);
                const serviceName = c.services && c.services.length > 0
                    ? c.services.map(s => s.serviceName).join(' ')
                    : (c as any).serviceName || '';
                
                return (
                    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    client?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    c.consultantName?.toLowerCase().includes(searchTerm.toLowerCase())
                );
            });
        }

        setFilteredCourses(filtered);
        setCurrentPage(1);
    };

    const handleCreateCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (selectedServices.length === 0) {
            alert('Vui lòng chọn ít nhất 1 dịch vụ');
            return;
        }

        if (!newCourse.name) {
            alert('Vui lòng nhập tên gói');
            return;
        }

        const payload = {
            name: newCourse.name,
            description: newCourse.description,
            price: calculatedPrice,
            totalSessions: calculatedSessions,
            sessionsPerWeek: 2, // Default value for backend
            consultantId: newCourse.consultantId || undefined,
            services: selectedServices.map(s => ({
                serviceId: s.serviceId,
                serviceName: s.serviceName,
                order: s.order
            }))
        };
        
        console.log('Creating course with payload:', payload);

        try {
            await apiService.createTreatmentCourse(payload);
            alert('Tạo liệu trình thành công!');
            setShowCreateModal(false);
            setNewCourse({
                name: '',
                description: '',
                consultantId: ''
            });
            setSelectedServices([]);
            loadCourses();
        } catch (error) {
            console.error('Error creating course:', error);
            alert('Không thể tạo liệu trình');
        }
    };

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
            draft: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Nháp' },
            active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Đang hoạt động' },
            paused: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Tạm dừng' },
            completed: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Hoàn thành' },
            expired: { bg: 'bg-red-100', text: 'text-red-800', label: 'Hết hạn' },
            cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Đã hủy' }
        };

        const config = statusConfig[status] || statusConfig.draft;
        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        );
    };

    const getProgressBar = (course: TreatmentCourse) => {
        const percentage = course.progressPercentage || 0;
        return (
            <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                    className={`h-2 rounded-full transition-all ${
                        percentage === 100 ? 'bg-green-500' : 
                        percentage >= 50 ? 'bg-blue-500' : 'bg-yellow-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        );
    };

    // Pagination
    const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedCourses = filteredCourses.slice(startIndex, startIndex + itemsPerPage);

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
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Quản lý Liệu trình</h1>
                    <p className="text-gray-600 mt-1">Theo dõi và quản lý tất cả liệu trình điều trị</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary transition"
                >
                    + Tạo liệu trình mới
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="text-sm text-gray-600">Tổng số</div>
                    <div className="text-2xl font-bold text-gray-900">{courses.length}</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="text-sm text-gray-600">Đang hoạt động</div>
                    <div className="text-2xl font-bold text-green-600">
                        {courses.filter(c => c.status === 'active').length}
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="text-sm text-gray-600">Tạm dừng</div>
                    <div className="text-2xl font-bold text-yellow-600">
                        {courses.filter(c => c.status === 'paused').length}
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="text-sm text-gray-600">Hoàn thành</div>
                    <div className="text-2xl font-bold text-blue-600">
                        {courses.filter(c => c.status === 'completed').length}
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="text-sm text-gray-600">Hết hạn</div>
                    <div className="text-2xl font-bold text-red-600">
                        {courses.filter(c => c.status === 'expired').length}
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tìm kiếm</label>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Tên gói, dịch vụ..."
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
                            <option value="draft">Nháp</option>
                            <option value="active">Đang hoạt động</option>
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
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Tên gói</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Dịch vụ</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Tiến độ</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Trạng thái</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Chuyên viên</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Ngày bắt đầu</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Hết hạn</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {paginatedCourses.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                                        Không tìm thấy gói liệu trình nào
                                    </td>
                                </tr>
                            ) : (
                                paginatedCourses.map((course) => {
                                    const servicesDisplay = course.services && course.services.length > 0
                                        ? course.services.map(s => s.serviceName).join(', ')
                                        : (course as any).serviceName || 'N/A';
                                    const isExpiringSoon = course.daysUntilExpiry && course.daysUntilExpiry <= 7 && course.daysUntilExpiry > 0;
                                    const isExpired = course.isExpired || course.status === 'expired';
                                    const consultant = allUsers.find(u => u.id === course.consultantId);

                                    return (
                                        <tr key={course.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-gray-900">{course.name || 'ffa'}</div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {course.price?.toLocaleString('vi-VN')} đ
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-sm text-gray-900">
                                                    {servicesDisplay}
                                                </div>
                                                {course.services && course.services.length > 1 && (
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        {course.services.length} dịch vụ
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 min-w-[80px]">
                                                        {getProgressBar(course)}
                                                    </div>
                                                    <span className="text-sm text-gray-600 whitespace-nowrap">
                                                        {course.completedSessions || 0}/{course.totalSessions}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {course.progressPercentage || 0}%
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {getStatusBadge(course.status)}
                                                {isExpiringSoon && (
                                                    <div className="text-xs text-orange-600 mt-1">
                                                        Còn {course.daysUntilExpiry} ngày
                                                    </div>
                                                )}
                                                {isExpired && (
                                                    <div className="text-xs text-red-600 mt-1">
                                                        Đã hết hạn
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900">
                                                {consultant?.name || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {course.startDate ? new Date(course.startDate).toLocaleDateString('vi-VN') : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {course.expiryDate ? new Date(course.expiryDate).toLocaleDateString('vi-VN') : '-'}
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

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-2xl font-bold text-gray-900">Tạo liệu trình mới</h2>
                        </div>
                        <form onSubmit={handleCreateCourse} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                                {/* Package name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tên gói liệu trình <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="VD: Liệu trình làm sáng da 3 bước"
                                        value={newCourse.name}
                                        onChange={(e) => setNewCourse({...newCourse, name: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                    />
                                </div>
                                
                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Mô tả gói liệu trình
                                    </label>
                                    <textarea
                                        placeholder="Mô tả chi tiết về gói liệu trình..."
                                        value={newCourse.description}
                                        onChange={(e) => setNewCourse({...newCourse, description: e.target.value})}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                    />
                                </div>
                                
                                {/* Service selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Các dịch vụ trong gói <span className="text-red-500">*</span>
                                        <span className="text-xs text-gray-500 ml-2">(1 dịch vụ = 1 buổi)</span>
                                    </label>
                                    <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-300 rounded-md p-3">
                                        {allServices.map((service) => {
                                            const isSelected = selectedServices.some(s => s.serviceId === service.id);
                                            return (
                                                <label key={service.id} className="flex items-center gap-2 hover:bg-gray-50 p-2 rounded cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedServices([
                                                                    ...selectedServices,
                                                                    {
                                                                        serviceId: service.id,
                                                                        serviceName: service.name,
                                                                        order: selectedServices.length + 1,
                                                                        price: service.price,
                                                                        duration: service.duration
                                                                    }
                                                                ]);
                                                            } else {
                                                                setSelectedServices(
                                                                    selectedServices.filter(s => s.serviceId !== service.id)
                                                                        .map((s, idx) => ({ ...s, order: idx + 1 })) // Re-order
                                                                );
                                                            }
                                                        }}
                                                        className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                                                    />
                                                    <div className="flex-1">
                                                        <div className="text-sm font-medium text-gray-900">{service.name}</div>
                                                        <div className="text-xs text-gray-500">
                                                            {service.duration} phút - {Number(service.price).toLocaleString('vi-VN')} ₫
                                                        </div>
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                    {selectedServices.length > 0 && (
                                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                                            <div className="text-sm font-semibold text-blue-900 mb-2">
                                                Đã chọn {selectedServices.length} dịch vụ = {calculatedSessions} buổi
                                            </div>
                                            <ul className="text-sm text-blue-800 space-y-1">
                                                {selectedServices.map((s, idx) => (
                                                    <li key={s.serviceId} className="flex justify-between">
                                                        <span>{idx + 1}. {s.serviceName}</span>
                                                        <span className="font-medium">{Number(s.price).toLocaleString('vi-VN')} ₫</span>
                                                    </li>
                                                ))}
                                            </ul>
                                            <div className="mt-2 pt-2 border-t border-blue-300 text-sm font-bold text-blue-900">
                                                Tổng giá: {calculatedPrice.toLocaleString('vi-VN')} ₫
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Consultant */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Chuyên viên tư vấn
                                    </label>
                                    <select
                                        value={newCourse.consultantId}
                                        onChange={(e) => setNewCourse({...newCourse, consultantId: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                    >
                                        <option value="">-- Không chọn --</option>
                                        {allUsers.filter(u => u.role === 'Staff').map(staff => (
                                            <option key={staff.id} value={staff.id}>
                                                {staff.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary"
                                >
                                    Tạo liệu trình
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TreatmentCoursesPage;
