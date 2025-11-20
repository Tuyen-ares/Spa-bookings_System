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
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [showAssignStaffModal, setShowAssignStaffModal] = useState(false);
    const [selectedSession, setSelectedSession] = useState<any>(null);
    const [completeForm, setCompleteForm] = useState({
        customerStatusNotes: '',
        adminNotes: ''
    });
    const [selectedStaffId, setSelectedStaffId] = useState<string>('');
    const [allStaff, setAllStaff] = useState<User[]>([]);

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

    useEffect(() => {
        // Load staff list for assignment
        const loadStaff = async () => {
            try {
                const users = await apiService.getUsers();
                const staff = users.filter(u => u.role === 'Staff' && u.status === 'Active');
                setAllStaff(staff);
            } catch (error) {
                console.error('Error loading staff:', error);
            }
        };
        loadStaff();
    }, []);

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

    const handleConfirmPayment = async () => {
        if (!id) return;
        try {
            await apiService.confirmTreatmentCoursePayment(id);
            alert('Đã xác nhận thanh toán thành công!');
            loadCourseDetail(); // Reload to refresh data
        } catch (error) {
            console.error('Error confirming payment:', error);
            alert('Không thể xác nhận thanh toán');
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

    const handleCompleteSession = async () => {
        if (!selectedSession) return;

        try {
            const response = await fetch(`http://localhost:3001/api/treatment-courses/${id}/complete-session`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    sessionNumber: selectedSession.sessionNumber,
                    customerStatusNotes: completeForm.customerStatusNotes,
                    adminNotes: completeForm.adminNotes
                })
            });

            if (!response.ok) {
                throw new Error('Không thể hoàn thành buổi điều trị');
            }

            alert('Đã xác nhận hoàn thành buổi điều trị!');
            setShowCompleteModal(false);
            setSelectedSession(null);
            setCompleteForm({ customerStatusNotes: '', adminNotes: '' });
            loadCourseDetail(); // Reload to refresh data
        } catch (error) {
            console.error('Error completing session:', error);
            alert('Không thể hoàn thành buổi điều trị');
        }
    };

    const handleAssignStaff = async () => {
        if (!selectedSession || !selectedStaffId) {
            alert('Vui lòng chọn nhân viên');
            return;
        }

        try {
            const response = await fetch(`http://localhost:3001/api/treatment-sessions/${selectedSession.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    staffId: selectedStaffId
                })
            });

            if (!response.ok) {
                throw new Error('Không thể phân công nhân viên');
            }

            alert('Đã phân công nhân viên thành công!');
            setShowAssignStaffModal(false);
            setSelectedSession(null);
            setSelectedStaffId('');
            loadCourseDetail(); // Reload to refresh data
        } catch (error) {
            console.error('Error assigning staff:', error);
            alert('Không thể phân công nhân viên');
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
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin liệu trình</h3>
                    <div className="space-y-3">
                        <div>
                            <div className="text-sm text-gray-600">Dịch vụ:</div>
                            <div className="font-medium text-gray-900">{(course as any).serviceName || (course as any).Service?.name || 'N/A'}</div>
                        </div>
                        <div className="pt-2 border-t border-gray-100">
                            <div className="text-sm text-gray-600">Giá dịch vụ:</div>
                            <div className="font-medium text-brand-primary text-xl">
                                {(course as any).Service?.price ? `${Number((course as any).Service.price).toLocaleString('vi-VN')} ₫` : '-'}
                            </div>
                        </div>
                        <div className="pt-2 border-t border-gray-100">
                            <div className="text-sm text-gray-600">Tổng số buổi:</div>
                            <div className="font-medium">{course.totalSessions} buổi</div>
                        </div>
                        <div className="pt-2 border-t border-gray-100">
                            <div className="text-sm text-gray-600">Tổng tiền:</div>
                            <div className="font-medium text-brand-primary text-xl">
                                {(() => {
                                    const servicePrice = (course as any).Service?.price ? Number((course as any).Service.price) : 0;
                                    const totalPrice = servicePrice * course.totalSessions;
                                    return totalPrice > 0 ? `${totalPrice.toLocaleString('vi-VN')} ₫` : '-';
                                })()}
                            </div>
                        </div>
                        <div className="pt-2 border-t border-gray-100">
                            <div className="text-sm text-gray-600">Số buổi đã hoàn thành:</div>
                            <div className="font-medium">{(course as any).completedSessions || 0} / {course.totalSessions}</div>
                        </div>
                        <div className="pt-2 border-t border-gray-100">
                            <div className="text-sm text-gray-600">Trạng thái thanh toán:</div>
                            <div className="flex items-center gap-2">
                                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                                    (course as any).paymentStatus === 'Paid' 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                    {(course as any).paymentStatus === 'Paid' ? '✓ Đã thanh toán' : 'Chưa thanh toán'}
                                </span>
                                {(course as any).paymentStatus !== 'Paid' && (
                                    <button
                                        onClick={() => {
                                            if (window.confirm('Bạn có chắc chắn muốn xác nhận đã thanh toán cho liệu trình này?')) {
                                                handleConfirmPayment();
                                            }
                                        }}
                                        className="px-3 py-1 text-xs font-semibold bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                                    >
                                        Xác nhận thanh toán
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="pt-2 border-t border-gray-100">
                            <div className="text-sm text-gray-600">Ngày bắt đầu:</div>
                            <div className="font-medium">{(course as any).startDate ? new Date((course as any).startDate).toLocaleDateString('vi-VN') : '-'}</div>
                        </div>
                        <div className="pt-2 border-t border-gray-100">
                            <div className="text-sm text-gray-600">Hạn sử dụng:</div>
                            <div className="font-medium">{(course as any).expiryDate ? new Date((course as any).expiryDate).toLocaleDateString('vi-VN') : '-'}</div>
                        </div>
                        <div className="pt-2 border-t border-gray-100">
                            <div className="text-sm text-gray-600">Thời gian (tuần):</div>
                            <div className="font-medium">{(course as any).durationWeeks ? `${(course as any).durationWeeks} tuần` : '-'}</div>
                        </div>
                        {(course as any).frequencyType && (course as any).frequencyValue && (
                            <div className="pt-2 border-t border-gray-100">
                                <div className="text-sm text-gray-600">Tần suất:</div>
                                <div className="font-medium">
                                    {(course as any).frequencyType === 'sessions_per_week' 
                                        ? `${(course as any).frequencyValue} lần/tuần`
                                        : `${(course as any).frequencyValue} tuần/lần`}
                                </div>
                            </div>
                        )}
                        <div className="pt-2 border-t border-gray-100">
                            <div className="text-sm text-gray-600">Chuyên viên phụ trách:</div>
                            <div className="font-medium">{(course as any).Therapist?.name || '-'}</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin khách hàng</h3>
                    <div className="space-y-3">
                        <div>
                            <div className="text-sm text-gray-600">Tên khách hàng:</div>
                            <div className="font-medium text-gray-900">{(course as any).Client?.name || 'N/A'}</div>
                        </div>
                        {(course as any).Client?.phone && (
                            <div className="pt-2 border-t border-gray-100">
                                <div className="text-sm text-gray-600">Số điện thoại:</div>
                                <div className="font-medium flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    {(course as any).Client.phone}
                                </div>
                            </div>
                        )}
                        {(course as any).Client?.email && (
                            <div className="pt-2 border-t border-gray-100">
                                <div className="text-sm text-gray-600">Email:</div>
                                <div className="font-medium">{(course as any).Client.email}</div>
                            </div>
                        )}
                        {(course as any).Service && (
                            <div className="pt-2 border-t border-gray-100">
                                <div className="text-sm text-gray-600">Thời gian dịch vụ:</div>
                                <div className="font-medium">{(course as any).Service.duration} phút</div>
                            </div>
                        )}
                        {(course as any).notes && (
                            <div className="pt-2 border-t border-gray-100">
                                <div className="text-sm text-gray-600">Ghi chú:</div>
                                <div className="font-medium text-gray-700">{(course as any).notes}</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Treatment Sessions List */}
            {(course as any).TreatmentSessions && (course as any).TreatmentSessions.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Danh sách các buổi điều trị ({((course as any).TreatmentSessions || []).length} buổi)
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                        Danh sách tất cả các buổi điều trị trong liệu trình này. Mỗi buổi có thể được đặt lịch, hoàn thành, hoặc hủy.
                    </p>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50">
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">STT</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Ngày</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Giờ</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Nhân viên</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Lịch hẹn</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Trạng thái</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Ghi chú</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[...((course as any).TreatmentSessions || [])]
                                    .sort((a: any, b: any) => (a.sessionNumber || 0) - (b.sessionNumber || 0))
                                    .map((session: any) => (
                                    <tr key={session.id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 px-4 text-sm font-medium">{session.sessionNumber}</td>
                                        <td className="py-3 px-4 text-sm">
                                            {session.sessionDate ? new Date(session.sessionDate).toLocaleDateString('vi-VN') : '-'}
                                        </td>
                                        <td className="py-3 px-4 text-sm">{session.sessionTime || '-'}</td>
                                        <td className="py-3 px-4 text-sm">
                                            {session.Staff?.name || 
                                             (session.Appointment?.Therapist?.name) ||
                                             (session.staffId ? 'Chưa phân công' : '-')}
                                        </td>
                                        <td className="py-3 px-4 text-sm">
                                            {session.Appointment ? (
                                                <span className="text-blue-600">
                                                    Có lịch hẹn
                                                    {session.Appointment.Therapist && (
                                                        <span className="text-xs text-gray-500 block mt-1">
                                                            ({session.Appointment.Therapist.name})
                                                        </span>
                                                    )}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">Chưa có</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-sm">
                                            {getSessionStatusBadge(session.status)}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-600 max-w-xs">
                                            <div className="space-y-1">
                                                {session.customerStatusNotes && (
                                                    <div className="truncate" title={session.customerStatusNotes}>
                                                        <span className="text-xs text-gray-500">[Khách hàng]</span> {session.customerStatusNotes}
                                                    </div>
                                                )}
                                                {session.adminNotes && (
                                                    <div className="truncate text-blue-600" title={session.adminNotes}>
                                                        <span className="text-xs text-blue-500">[Nội bộ]</span> {session.adminNotes}
                                                    </div>
                                                )}
                                                {!session.customerStatusNotes && !session.adminNotes && (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-sm">
                                            <div className="flex gap-2">
                                                {session.status !== 'completed' && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedSession(session);
                                                            setCompleteForm({
                                                                customerStatusNotes: session.customerStatusNotes || '',
                                                                adminNotes: session.adminNotes || ''
                                                            });
                                                            setShowCompleteModal(true);
                                                        }}
                                                        className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                                                    >
                                                        Hoàn thành
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        setSelectedSession(session);
                                                        setSelectedStaffId(session.staffId || session.Appointment?.therapistId || '');
                                                        setShowAssignStaffModal(true);
                                                    }}
                                                    className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                                                    title={session.Staff?.name || session.Appointment?.Therapist?.name ? "Sửa nhân viên" : "Phân công nhân viên"}
                                                >
                                                    {session.Staff?.name || session.Appointment?.Therapist?.name ? "Sửa" : "Phân công"}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Complete Session Modal */}
            {showCompleteModal && selectedSession && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900">
                                Xác nhận hoàn thành buổi {selectedSession.sessionNumber}
                            </h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Ghi chú tình trạng khách hàng (Khách hàng sẽ thấy ghi chú này)
                                </label>
                                <textarea
                                    value={completeForm.customerStatusNotes}
                                    onChange={(e) => setCompleteForm({...completeForm, customerStatusNotes: e.target.value})}
                                    placeholder="Ví dụ: Khách ổn, da sáng hơn, không có kích ứng..."
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Ghi chú nội bộ (Chỉ admin và staff thấy)
                                </label>
                                <textarea
                                    value={completeForm.adminNotes}
                                    onChange={(e) => setCompleteForm({...completeForm, adminNotes: e.target.value})}
                                    placeholder="Ghi chú nội bộ cho admin và staff (khách hàng không thấy)..."
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    Ghi chú này chỉ được xem bởi Admin và Staff, khách hàng không thể thấy.
                                </p>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowCompleteModal(false);
                                    setSelectedSession(null);
                                    setCompleteForm({ customerStatusNotes: '', adminNotes: '' });
                                }}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleCompleteSession}
                                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                            >
                                Xác nhận hoàn thành
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Assign Staff Modal */}
            {showAssignStaffModal && selectedSession && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900">
                                {selectedSession.Staff?.name || selectedSession.Appointment?.Therapist?.name 
                                    ? `Sửa nhân viên cho buổi ${selectedSession.sessionNumber}`
                                    : `Phân công nhân viên cho buổi ${selectedSession.sessionNumber}`}
                            </h2>
                            {(selectedSession.Staff?.name || selectedSession.Appointment?.Therapist?.name) && (
                                <p className="text-sm text-gray-600 mt-1">
                                    Nhân viên hiện tại: <span className="font-medium">{selectedSession.Staff?.name || selectedSession.Appointment?.Therapist?.name}</span>
                                </p>
                            )}
                        </div>
                        <div className="p-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Chọn nhân viên
                            </label>
                            <select
                                value={selectedStaffId}
                                onChange={(e) => setSelectedStaffId(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
                            >
                                <option value="">-- Chọn nhân viên --</option>
                                {allStaff.map(staff => (
                                    <option key={staff.id} value={staff.id}>
                                        {staff.name} {staff.phone ? `(${staff.phone})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowAssignStaffModal(false);
                                    setSelectedSession(null);
                                    setSelectedStaffId('');
                                }}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleAssignStaff}
                                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                            >
                                Phân công
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
