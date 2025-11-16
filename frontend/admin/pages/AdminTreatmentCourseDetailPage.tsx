import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as apiService from '../../client/services/apiService';
import type { TreatmentCourse, User, Service } from '../../types';

interface TreatmentSession {
    sessionId: string;
    sessionNumber: number;
    scheduledDate?: string;
    completedDate?: string;
    status: 'pending' | 'scheduled' | 'completed' | 'cancelled';
    therapistName?: string;
    therapistNotes?: string;
    recommendations?: string;
}

const AdminTreatmentCourseDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [course, setCourse] = useState<TreatmentCourse | null>(null);
    const [sessions, setSessions] = useState<TreatmentSession[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showPauseModal, setShowPauseModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [pauseReason, setPauseReason] = useState('');

    const [editForm, setEditForm] = useState({
        treatmentGoals: '',
        initialSkinCondition: '',
        consultantName: '',
        totalSessions: 10,
        sessionsPerWeek: 2
    });

    useEffect(() => {
        if (id) {
            loadCourseDetail();
        }
    }, [id]);

    const loadCourseDetail = async () => {
        setIsLoading(true);
        try {
            const data = await apiService.getTreatmentCourseById(id!);
            setCourse(data);
            
            // Load sessions if available
            if (data.sessions) {
                setSessions(data.sessions as any);
            }

            // Set edit form
            setEditForm({
                treatmentGoals: data.treatmentGoals || '',
                initialSkinCondition: data.initialSkinCondition || '',
                consultantName: data.consultantName || '',
                totalSessions: data.totalSessions,
                sessionsPerWeek: 2 // Default value
            });
        } catch (error) {
            console.error('Error loading course:', error);
            alert('Không thể tải thông tin liệu trình');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePause = async () => {
        if (!pauseReason.trim()) {
            alert('Vui lòng nhập lý do tạm dừng');
            return;
        }

        try {
            await apiService.pauseTreatmentCourse(id!, pauseReason);
            alert('Đã tạm dừng liệu trình');
            setShowPauseModal(false);
            setPauseReason('');
            loadCourseDetail();
        } catch (error) {
            console.error('Error pausing course:', error);
            alert('Không thể tạm dừng liệu trình');
        }
    };

    const handleResume = async () => {
        if (!window.confirm('Bạn có chắc muốn tiếp tục liệu trình? Hạn sử dụng sẽ được gia hạn tự động.')) {
            return;
        }

        try {
            await apiService.resumeTreatmentCourse(id!);
            alert('Đã tiếp tục liệu trình');
            loadCourseDetail();
        } catch (error) {
            console.error('Error resuming course:', error);
            alert('Không thể tiếp tục liệu trình');
        }
    };

    const handleUpdateCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        
        try {
            await apiService.updateTreatmentCourse(id!, editForm);
            alert('Cập nhật thành công!');
            setShowEditModal(false);
            loadCourseDetail();
        } catch (error) {
            console.error('Error updating course:', error);
            alert('Không thể cập nhật liệu trình');
        }
    };

    const handleDeleteCourse = async () => {
        if (!window.confirm('Bạn có chắc muốn xóa liệu trình này? Hành động này không thể hoàn tác.')) {
            return;
        }

        try {
            await apiService.deleteTreatmentCourse(id!);
            alert('Đã xóa liệu trình');
            navigate('/admin/treatment-courses');
        } catch (error) {
            console.error('Error deleting course:', error);
            alert('Không thể xóa liệu trình');
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
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        );
    };

    const getSessionStatusBadge = (status: string) => {
        const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
            pending: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Chưa đặt' },
            scheduled: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Đã đặt lịch' },
            completed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Đã hoàn thành' },
            cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Đã hủy' }
        };

        const config = statusConfig[status] || statusConfig.pending;
        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        );
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-xl text-gray-600">Đang tải...</div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="p-6">
                <div className="text-center text-gray-600">Không tìm thấy liệu trình</div>
            </div>
        );
    }

    const isExpiringSoon = course.daysUntilExpiry && course.daysUntilExpiry <= 7 && course.daysUntilExpiry > 0;
    const isExpired = course.isExpired || course.status === 'expired';

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <button
                    onClick={() => navigate('/admin/treatment-courses')}
                    className="text-brand-primary hover:text-brand-secondary mb-4 flex items-center gap-2"
                >
                    ← Quay lại danh sách
                </button>
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Chi tiết Liệu trình
                        </h1>
                        <div className="flex items-center gap-3">
                            {getStatusBadge(course.status)}
                            <span className="text-gray-600">ID: {course.id}</span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowEditModal(true)}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                            ✏️ Chỉnh sửa
                        </button>
                        {course.status === 'active' && !course.isPaused && (
                            <button
                                onClick={() => setShowPauseModal(true)}
                                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
                            >
                                ⏸️ Tạm dừng
                            </button>
                        )}
                        {course.isPaused && (
                            <button
                                onClick={handleResume}
                                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                            >
                                ▶️ Tiếp tục
                            </button>
                        )}
                        <button
                            onClick={handleDeleteCourse}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                        >
                            🗑️ Xóa
                        </button>
                    </div>
                </div>
            </div>

            {/* Warning Banners */}
            {isExpiringSoon && (
                <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center gap-2 text-orange-800">
                        <span className="text-xl">⚠️</span>
                        <span className="font-medium">
                            Liệu trình sắp hết hạn trong {course.daysUntilExpiry} ngày!
                        </span>
                    </div>
                </div>
            )}
            {isExpired && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-800">
                        <span className="text-xl">❌</span>
                        <span className="font-medium">
                            Liệu trình đã hết hạn!
                        </span>
                    </div>
                </div>
            )}
            {course.isPaused && (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-800">
                        <span className="text-xl">⏸️</span>
                        <div>
                            <div className="font-medium">Liệu trình đang tạm dừng</div>
                            {course.pauseReason && (
                                <div className="text-sm mt-1">Lý do: {course.pauseReason}</div>
                            )}
                            {course.pausedDate && (
                                <div className="text-sm">
                                    Từ ngày: {new Date(course.pausedDate).toLocaleDateString('vi-VN')}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin gói liệu trình</h3>
                    <div className="space-y-2">
                        <div>
                            <div className="text-sm text-gray-600">Tên gói:</div>
                            <div className="font-medium">{course.name || 'N/A'}</div>
                        </div>
                        <div className="pt-2 border-t border-gray-100">
                            <div className="text-sm text-gray-600">Giá gói:</div>
                            <div className="font-medium text-brand-primary text-xl">
                                {course.price ? `${Number(course.price).toLocaleString('vi-VN')} ₫` : '-'}
                            </div>
                        </div>
                        <div className="pt-2 border-t border-gray-100">
                            <div className="text-sm text-gray-600">Tổng số buổi:</div>
                            <div className="font-medium">{course.totalSessions} buổi</div>
                        </div>
                        <div className="pt-2 border-t border-gray-100">
                            <div className="text-sm text-gray-600">Chuyên viên tư vấn:</div>
                            <div className="font-medium">{course.consultantName || '-'}</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Dịch vụ bao gồm</h3>
                    {course.services && course.services.length > 0 ? (
                        <ul className="space-y-3">
                            {course.services.sort((a, b) => (a.order || 0) - (b.order || 0)).map((service) => (
                                <li key={service.serviceId} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
                                    <span className="flex-shrink-0 w-6 h-6 bg-brand-primary text-white rounded-full flex items-center justify-center text-sm font-semibold">
                                        {service.order}
                                    </span>
                                    <div className="flex-1">
                                        <div className="font-medium text-gray-900">{service.serviceName}</div>
                                        <div className="text-sm text-gray-500 mt-1">
                                            {service.price?.toLocaleString('vi-VN')} đ • {service.duration} phút
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-sm text-gray-500">Chưa có dịch vụ</div>
                    )}
                </div>
            </div>

            {/* Pause Modal */}
            {showPauseModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900">Tạm dừng liệu trình</h2>
                        </div>
                        <div className="p-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Lý do tạm dừng <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={pauseReason}
                                onChange={(e) => setPauseReason(e.target.value)}
                                placeholder="Ví dụ: Khách đi công tác, tạm ngưng điều trị..."
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
                            />
                        </div>
                        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                            <button
                                onClick={() => setShowPauseModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handlePause}
                                className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
                            >
                                Xác nhận tạm dừng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900">Chỉnh sửa liệu trình</h2>
                        </div>
                        <form onSubmit={handleUpdateCourse} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tổng số buổi
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={editForm.totalSessions}
                                        onChange={(e) => setEditForm({...editForm, totalSessions: parseInt(e.target.value)})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Số buổi/tuần
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="7"
                                        value={editForm.sessionsPerWeek}
                                        onChange={(e) => setEditForm({...editForm, sessionsPerWeek: parseInt(e.target.value)})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Chuyên viên tư vấn
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.consultantName}
                                        onChange={(e) => setEditForm({...editForm, consultantName: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Mục tiêu điều trị
                                    </label>
                                    <textarea
                                        value={editForm.treatmentGoals}
                                        onChange={(e) => setEditForm({...editForm, treatmentGoals: e.target.value})}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tình trạng da ban đầu
                                    </label>
                                    <textarea
                                        value={editForm.initialSkinCondition}
                                        onChange={(e) => setEditForm({...editForm, initialSkinCondition: e.target.value})}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary"
                                >
                                    Lưu thay đổi
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminTreatmentCourseDetailPage;
