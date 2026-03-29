import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Appointment, TreatmentCourse, User, Service, Review } from '../../types';
import { BellIcon, XCircleIcon, StarIcon } from '../../shared/icons';
import * as apiService from '../services/apiService';

// --- Interface Definitions ---
interface AppointmentsPageProps {
    currentUser: User;
    allServices: Service[];
    allUsers: User[];
    allAppointments: Appointment[];
    allTreatmentCourses: TreatmentCourse[];
}

// --- SUB-COMPONENTS (Được đưa ra ngoài để tránh lỗi Re-mount/Mất focus) ---

const UpcomingAppointmentCard: React.FC<{
    appointment: Appointment & { dateTime: Date },
    onViewDetail: (app: any) => void,
    onCancel: (app: any) => void
}> = ({ appointment, onViewDetail, onCancel }) => {
    const getStatusBadge = () => {
        if (appointment.status === 'pending') {
            return <span className="px-3 py-1 text-xs font-bold rounded-full bg-yellow-100 text-yellow-800 flex-shrink-0">Chờ xác nhận</span>;
        } else if (appointment.status === 'upcoming') {
            return <span className="px-3 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800 flex-shrink-0">Đã xác nhận</span>;
        } else if (appointment.status === 'in-progress') {
            return <span className="px-3 py-1 text-xs font-bold rounded-full bg-purple-100 text-purple-800 flex-shrink-0">Đang tiến hành</span>;
        }
        return null;
    };

    return (
        <div className="bg-white p-5 rounded-lg shadow-soft-lg border border-gray-100">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-semibold text-gray-600 mb-2">
                        {appointment.time}
                    </p>
                    <h4 className="text-xl font-bold font-serif text-brand-text">{appointment.serviceName}</h4>
                </div>
                {getStatusBadge()}
            </div>
            <div className="border-t mt-4 pt-4 flex justify-end items-center gap-3">
                <button onClick={() => onViewDetail(appointment)} className="px-4 py-2 text-sm font-semibold bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">Xem Chi Tiết</button>
                {appointment.status === 'pending' && (
                    <button
                        onClick={() => onCancel(appointment)}
                        className="px-4 py-2 text-sm font-semibold rounded-md bg-red-50 text-red-700 hover:bg-red-100"
                    >
                        Hủy lịch
                    </button>
                )}
            </div>
        </div>
    );
};

const HistoryAppointmentCard: React.FC<{
    appointment: Appointment & { dateTime: Date },
    allUsers: User[],
    onViewDetail: (app: any) => void
}> = ({ appointment, allUsers, onViewDetail }) => {
    const navigate = useNavigate();
    const therapistName = appointment.Therapist?.name || (allUsers.find(u => u.id === appointment.therapistId)?.name) || 'Không có';

    return (
        <div className="bg-white p-5 rounded-lg shadow-soft-lg border border-gray-100 flex justify-between items-center">
            <div>
                <p className="text-sm font-semibold text-brand-dark">{appointment.dateTime.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} - {appointment.time}</p>
                <h4 className="text-xl font-bold font-serif text-brand-text mt-1">{appointment.serviceName}</h4>
                <p className="text-xs text-gray-500 mt-1">Kỹ thuật viên: {therapistName}</p>
            </div>
            <div className="flex flex-col items-end gap-3">
                <span className={`px-3 py-1 text-xs font-bold rounded-full ${appointment.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {appointment.status === 'completed' ? 'Hoàn thành' : 'Đã hủy'}
                </span>
                <div className="flex items-center gap-3">
                    <button onClick={() => onViewDetail(appointment)} className="px-4 py-2 text-sm font-semibold bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">Xem Chi Tiết</button>
                    {appointment.status === 'completed' && (
                        <button onClick={() => navigate(`/booking?serviceId=${appointment.serviceId}`)} className="px-4 py-2 text-sm font-semibold bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">Đặt lại</button>
                    )}
                </div>
            </div>
        </div>
    );
};

const TreatmentCourseCard: React.FC<{
    course: TreatmentCourse,
    currentUser: User,
    allServices: Service[],
    allReviews: Review[],
    onReviewSuccess: () => void,
    setToastMessage: (msg: string) => void
}> = ({ course, currentUser, allServices, allReviews, onReviewSuccess, setToastMessage }) => {
    const navigate = useNavigate();

    // Local state for review form inside the card
    // Move state here to prevent parent re-renders causing focus loss
    const [isReviewing, setIsReviewing] = useState(false);
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const sessions = course.sessions || [];
    const completedSessions = sessions.filter(s => s.status === 'completed').length;
    const progress = course.totalSessions > 0 ? (completedSessions / course.totalSessions) * 100 : 0;
    const isCompleted = completedSessions === course.totalSessions && course.totalSessions > 0;
    const pendingSessions = sessions.filter(s => s.status === 'pending').length;
    const scheduledSessions = sessions.filter(s => s.status === 'scheduled').length;

    // Find current session (next uncompleted session)
    const currentSession = sessions
        .sort((a, b) => a.sessionNumber - b.sessionNumber)
        .find(s => s.status !== 'completed');

    // Find previous completed session to get admin notes
    const previousSession = sessions
        .filter(s => s.status === 'completed')
        .sort((a, b) => b.sessionNumber - a.sessionNumber)[0]; // Get most recent completed session

    // Get notes
    const customerStatusNotes = currentSession?.notes || previousSession?.notes;

    // Determine Service ID logic
    const serviceId = (course as any).serviceId
        ?? (course as any).Service?.id
        ?? (course as any).service?.id
        ?? (Array.isArray((course as any).services) && course.services.length > 0 ? (course.services[0].serviceId ?? (course.services[0] as any).id) : undefined)
        ?? undefined;

    const existingReview = allReviews.find(r => r.serviceId === serviceId);

    const handleSubmitReview = async () => {
        if (rating === 0) {
            alert('Vui lòng chọn số sao đánh giá');
            return;
        }

        setIsSubmitting(true);
        try {
            const service = allServices.find(s => s.id === serviceId);
            await apiService.createReview({
                userId: currentUser.id,
                serviceId: serviceId,
                rating: rating,
                comment: comment.trim() || null,
                serviceName: service?.name,
                userName: currentUser.name,
                userImageUrl: currentUser.profilePictureUrl || '',
            });

            onReviewSuccess(); // Trigger parent refresh
            setIsReviewing(false);
            setToastMessage('Cảm ơn bạn đã đánh giá!');
        } catch (error: any) {
            console.error('Error submitting review:', error);
            alert(error.message || 'Có lỗi xảy ra khi gửi đánh giá');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            className={`bg-white p-6 rounded-lg shadow-lg border-2 transition-all hover:shadow-xl ${isCompleted
                ? 'border-green-400 bg-green-50'
                : 'border-brand-primary hover:border-brand-dark'
                }`}
        >
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                    <h4 className="text-xl font-bold font-serif text-brand-text mb-2">{(course as any).serviceName || course.name}</h4>
                    <div className="flex flex-wrap gap-2 text-sm mb-3">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-semibold">
                            {course.totalSessions} buổi
                        </span>
                        {completedSessions > 0 && (
                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full font-semibold">
                                ✓ {completedSessions} hoàn thành
                            </span>
                        )}
                        {scheduledSessions > 0 && (
                            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full font-semibold">
                                📅 {scheduledSessions} đã đặt lịch
                            </span>
                        )}
                        {pendingSessions > 0 && (
                            <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full font-semibold">
                                ⏳ {pendingSessions} chờ đặt lịch
                            </span>
                        )}
                    </div>

                    {!isCompleted && currentSession && (
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-3">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg font-bold text-purple-800">📌 Buổi hiện tại: Buổi {currentSession.sessionNumber}</span>
                            </div>
                            {((currentSession.date) || (currentSession as any).scheduledDate) && (
                                <p className="text-sm text-gray-700 mb-1">
                                    <strong>Ngày:</strong> {new Date(currentSession.date || (currentSession as any).scheduledDate).toLocaleDateString('vi-VN')}
                                    {(currentSession as any).scheduledTime && ` - ${(currentSession as any).scheduledTime}`}
                                </p>
                            )}
                        </div>
                    )}

                    {customerStatusNotes && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                            <p className="text-sm font-semibold text-yellow-800 mb-2">
                                📝 Ghi chú từ admin {currentSession ? `(Buổi ${currentSession.sessionNumber})` : previousSession ? `(Buổi ${previousSession.sessionNumber})` : ''}
                            </p>
                            <div>
                                <p className="text-xs text-gray-600 mb-1">
                                    <span className="text-gray-600">[Khách hàng]</span> Ghi chú tình trạng:
                                </p>
                                <p className="text-sm text-gray-800 bg-white p-2 rounded border whitespace-pre-wrap">{customerStatusNotes}</p>
                            </div>
                        </div>
                    )}
                </div>
                <div className="text-right ml-4">
                    <div className="text-3xl font-bold text-brand-primary">{Math.round(progress)}%</div>
                    <div className="text-xs text-gray-500">Tiến độ</div>
                </div>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-3 mb-4 overflow-hidden">
                <div
                    className="bg-gradient-to-r from-brand-primary to-amber-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>

            {isCompleted && (
                <>
                    <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded-lg">
                        <p className="text-green-800 font-semibold text-center">
                            🎉 Chúc mừng! Bạn đã hoàn thành liệu trình!
                        </p>
                    </div>

                    {/* Review Section */}
                    {existingReview ? (
                        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm font-semibold text-blue-800 mb-2">✅ Bạn đã đánh giá dịch vụ này</p>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="flex text-yellow-400">
                                    {[...Array(5)].map((_, i) => (
                                        <StarIcon key={i} className={`w-5 h-5 ${i < existingReview.rating ? 'fill-current' : 'text-gray-300'}`} />
                                    ))}
                                </div>
                                <span className="text-sm text-gray-600">{new Date(existingReview.date).toLocaleDateString('vi-VN')}</span>
                            </div>
                            {existingReview.comment && (
                                <p className="text-sm text-gray-700 italic">"{existingReview.comment}"</p>
                            )}
                            <button
                                onClick={() => navigate(`/service/${serviceId}`)}
                                className="mt-2 text-sm text-blue-600 hover:underline"
                            >
                                Xem đánh giá của bạn →
                            </button>
                        </div>
                    ) : isReviewing ? (
                        <div className="mt-4 p-4 bg-white border border-gray-300 rounded-lg">
                            <h5 className="text-lg font-semibold text-gray-800 mb-3">Đánh giá và phản hồi chất lượng dịch vụ</h5>

                            {/* Star Rating */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Đánh giá sao *</label>
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setRating(star);
                                            }}
                                            onMouseEnter={() => setHoverRating(star)}
                                            onMouseLeave={() => setHoverRating(0)}
                                            className="focus:outline-none"
                                        >
                                            <StarIcon
                                                className={`w-8 h-8 transition-colors ${star <= (hoverRating || rating)
                                                    ? 'text-yellow-400 fill-current'
                                                    : 'text-gray-300'
                                                    }`}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Comment */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Nhận xét (tùy chọn)</label>
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none"
                                    placeholder="Chia sẻ trải nghiệm của bạn về dịch vụ này..."
                                />
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleSubmitReview();
                                    }}
                                    disabled={isSubmitting || rating === 0}
                                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setIsReviewing(false);
                                        setRating(0);
                                        setComment('');
                                    }}
                                    disabled={isSubmitting}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-100"
                                >
                                    Hủy
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-4">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setIsReviewing(true);
                                }}
                                className="w-full px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-semibold"
                            >
                                ⭐ Đánh giá và phản hồi chất lượng dịch vụ
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

// --- MAIN COMPONENT ---

export const AppointmentsPage: React.FC<AppointmentsPageProps> = ({
    currentUser,
    allServices,
    allUsers,
    allAppointments,
    allTreatmentCourses,
}) => {
    const navigate = useNavigate();
    const [localAppointments, setLocalAppointments] = useState<Appointment[]>([]);
    const [localTreatmentCourses, setLocalTreatmentCourses] = useState<TreatmentCourse[]>(allTreatmentCourses);
    const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);
    const [activeTab, setActiveTab] = useState<'upcoming' | 'history' | 'courses'>('upcoming');
    const [viewingAppointment, setViewingAppointment] = useState<(Appointment & { dateTime: Date }) | null>(null);
    const [appointmentToCancel, setAppointmentToCancel] = useState<(Appointment & { dateTime: Date }) | null>(null);
    const [isCancellingAll, setIsCancellingAll] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Filter & Sort States
    const [upcomingSort, setUpcomingSort] = useState('date-asc');
    const [upcomingFilterService, setUpcomingFilterService] = useState('all');
    const [upcomingFilterTime, setUpcomingFilterTime] = useState<'all' | 'today' | 'this-week' | 'this-month'>('all');
    const [upcomingFilterType, setUpcomingFilterType] = useState<'all' | 'day' | 'week' | 'month'>('all');
    const [upcomingSelectedDate, setUpcomingSelectedDate] = useState<string>('');
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [dateRangeStart, setDateRangeStart] = useState<string>('');
    const [dateRangeEnd, setDateRangeEnd] = useState<string>('');

    // Calculate start of current week (Monday)
    const getStartOfWeek = (date: Date): Date => {
        const startOfWeek = new Date(date);
        const dayOfWeek = startOfWeek.getDay(); // 0 = Sunday, 1 = Monday, ...
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to Monday = 0
        startOfWeek.setDate(date.getDate() - daysToMonday);
        startOfWeek.setHours(0, 0, 0, 0);
        return startOfWeek;
    };

    const [historySort, setHistorySort] = useState('date-desc');
    const [historyFilterService, setHistoryFilterService] = useState('all');
    const [historyFilterTime, setHistoryFilterTime] = useState('all');
    const [historyFilterStatus, setHistoryFilterStatus] = useState('all');

    // Pagination states for history
    const [historyCurrentPage, setHistoryCurrentPage] = useState(1);
    const [historyItemsPerPage, setHistoryItemsPerPage] = useState(10);

    // Treatment Courses Filter States
    const [coursesFilterStatus, setCoursesFilterStatus] = useState<'active' | 'completed'>('active');

    // Review states - REMOVED COMPLEX PARENT STATES
    const [allReviews, setAllReviews] = useState<Review[]>([]);

    // Fetch appointments from API
    const fetchAppointments = useCallback(async () => {
        try {
            // Fetch user-specific appointments
            const userAppointments = await apiService.getUserAppointments(currentUser.id);
            setLocalAppointments(userAppointments);
            setIsLoadingAppointments(false);
        } catch (error) {
            console.error("Failed to fetch appointments:", error);
            const fallbackApps = allAppointments.filter(app => app.userId === currentUser.id);
            setLocalAppointments(fallbackApps);
            setIsLoadingAppointments(false);
        }
    }, [currentUser.id, allAppointments]);

    useEffect(() => {
        fetchAppointments();
        const interval = setInterval(() => {
            fetchAppointments();
        }, 10000);

        const handleRefresh = () => fetchAppointments();
        window.addEventListener('refresh-appointments', handleRefresh);

        return () => {
            clearInterval(interval);
            window.removeEventListener('refresh-appointments', handleRefresh);
        };
    }, [fetchAppointments]);

    // Fetch reviews helper
    const fetchReviews = useCallback(async () => {
        try {
            const reviews = await apiService.getReviews({ userId: currentUser.id });
            setAllReviews(reviews);
        } catch (error) {
            console.error('Error fetching reviews:', error);
        }
    }, [currentUser.id]);

    useEffect(() => {
        if (currentUser?.id) {
            fetchReviews();
        }
    }, [currentUser.id, fetchReviews]);

    // Update local treatment courses when prop changes
    useEffect(() => {
        setLocalTreatmentCourses(allTreatmentCourses);
    }, [allTreatmentCourses]);

    // Fetch treatment courses from API
    useEffect(() => {
        const fetchTreatmentCourses = async () => {
            try {
                const clientCourses = await apiService.getTreatmentCourses({ clientId: currentUser.id });
                setLocalTreatmentCourses(clientCourses);
            } catch (error) {
                console.error("Failed to fetch treatment courses:", error);
            }
        };

        fetchTreatmentCourses();
        const interval = setInterval(() => {
            fetchTreatmentCourses();
        }, 30000); // 30 seconds

        const handleRefresh = () => {
            fetchTreatmentCourses();
        };
        window.addEventListener('refresh-treatment-courses', handleRefresh);

        return () => {
            clearInterval(interval);
            window.removeEventListener('refresh-treatment-courses', handleRefresh);
        };
    }, [currentUser.id]);

    // Also update when allAppointments changes
    useEffect(() => {
        if (allAppointments.length > 0) {
            const userApps = allAppointments.filter(app => app.userId === currentUser.id);
            if (userApps.length > 0) {
                setLocalAppointments(prev => {
                    const merged = [...prev, ...userApps];
                    const unique = merged.filter((app, index, self) =>
                        index === self.findIndex(a => a.id === app.id)
                    );
                    return unique;
                });
            }
        }
    }, [allAppointments, currentUser.id]);

    const handleCancelAppointment = async () => {
        if (!appointmentToCancel) return;

        setIsCancellingAll(true);
        try {
            const response = await apiService.cancelAllAppointmentsByBooking(
                appointmentToCancel.id,
                'Khách hàng yêu cầu hủy toàn bộ dịch vụ'
            );

            const cancelledIdSet = new Set(response?.cancelledIds || []);

            setLocalAppointments(prev =>
                prev.map(app => {
                    const sameGroup = appointmentToCancel.bookingGroupId
                        && app.bookingGroupId === appointmentToCancel.bookingGroupId
                        && app.serviceId === appointmentToCancel.serviceId
                        && app.userId === appointmentToCancel.userId;

                    const shouldCancel = cancelledIdSet.has(app.id)
                        || (sameGroup && !['cancelled', 'completed'].includes(app.status));

                    if (shouldCancel) {
                        return {
                            ...app,
                            status: 'cancelled',
                            rejectionReason: 'Khách hàng yêu cầu hủy toàn bộ dịch vụ'
                        };
                    }

                    return app;
                })
            );

            setToastMessage(response?.message || 'Đã hủy các lịch hẹn còn lại của dịch vụ.');
            setTimeout(() => setToastMessage(null), 3000);
        } catch (error) {
            console.error("Failed to cancel appointments:", error);
            alert("Hủy lịch hẹn thất bại.");
        } finally {
            setIsCancellingAll(false);
            setAppointmentToCancel(null);
        }
    };

    // --- Memoized Data Processing ---
    const { myUpcomingAppointments, myHistoryAppointments, myTreatmentCourses } = useMemo(() => {
        const now = new Date();
        const myApps = localAppointments.filter(app => app.userId === currentUser.id);

        const upcoming = myApps
            .map(app => {
                const originalDate = typeof app.date === 'string' ? app.date.split('T')[0] : app.date;
                const [hours, minutes] = app.time.split(':').map(Number);
                const [year, month, day] = originalDate.split('-').map(Number);
                const dateTime = new Date(year, month - 1, day, hours, minutes, 0, 0);
                return { ...app, date: originalDate, dateTime };
            })
            .filter(app => {
                // Treat 'scheduled' and 'completed' as upcoming so khách hàng vẫn thấy lịch đã duyệt/đã hoàn thành (dù ngày ở tương lai)
                const isUpcomingStatus = ['upcoming', 'pending', 'in-progress', 'scheduled', 'completed'].includes(app.status);
                const isFutureDate = app.dateTime >= now;
                return isUpcomingStatus && isFutureDate;
            });

        const history = myApps
            .map(app => ({ ...app, dateTime: new Date(`${app.date}T${app.time}`) }))
            .filter(app => {
                const isCompletedOrCancelled = ['completed', 'cancelled'].includes(app.status);
                const isPastDate = app.dateTime < now;
                return isCompletedOrCancelled || (isPastDate && !['upcoming', 'pending', 'in-progress'].includes(app.status));
            });

        const courses = localTreatmentCourses.filter(course => course.clientId === currentUser.id);

        return { myUpcomingAppointments: upcoming, myHistoryAppointments: history, myTreatmentCourses: courses };
    }, [localAppointments, localTreatmentCourses, currentUser.id]);

    const reminders = useMemo(() => {
        const now = new Date();
        const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        return myUpcomingAppointments.filter(app => {
            const [hours, minutes] = app.time.split(':').map(Number);
            let dateStr: string | Date = app.date;

            const isDateObject = typeof dateStr === 'object' && dateStr !== null && Object.prototype.toString.call(dateStr) === '[object Date]';
            if (isDateObject) {
                const dateObj = dateStr as unknown as Date;
                const year = dateObj.getFullYear();
                const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                const day = String(dateObj.getDate()).padStart(2, '0');
                dateStr = `${year}-${month}-${day}`;
            } else if (typeof dateStr === 'string') {
                dateStr = dateStr.split('T')[0];
            }

            const [year, month, day] = dateStr.split('-').map(Number);
            const appointmentDate = new Date(year, month - 1, day, hours, minutes, 0, 0);

            return appointmentDate >= now && appointmentDate <= twentyFourHoursFromNow;
        });
    }, [myUpcomingAppointments]);

    const getTimeRange = () => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        today.setHours(0, 0, 0, 0);

        const startOfWeek = new Date(today);
        const dayOfWeek = today.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        startOfWeek.setDate(today.getDate() - daysToMonday);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        startOfMonth.setHours(0, 0, 0, 0);

        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);

        return { today, startOfWeek, endOfWeek, startOfMonth, endOfMonth };
    };

    const filterByTime = (apps: (Appointment & { dateTime: Date })[], timeFilter: string, filterType?: string, selectedDate?: string): (Appointment & { dateTime: Date })[] => {
        // Xử lý filter type mới (day, week, month)
        if (filterType && filterType !== 'all') {
            if (filterType === 'day' && selectedDate) {
                // Lọc theo ngày cụ thể
                const filterDate = new Date(selectedDate);
                filterDate.setHours(0, 0, 0, 0);
                const filterTime = filterDate.getTime();

                return apps.filter(app => {
                    const appDate = new Date(app.dateTime);
                    appDate.setHours(0, 0, 0, 0);
                    return appDate.getTime() === filterTime;
                });
            } else if (filterType === 'week' && selectedDate) {
                // Lọc theo tuần chứa ngày được chọn
                const selected = new Date(selectedDate);
                const weekStart = getStartOfWeek(selected);
                weekStart.setHours(0, 0, 0, 0);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                weekEnd.setHours(23, 59, 59, 999);

                return apps.filter(app => {
                    const appDateTime = app.dateTime.getTime();
                    return appDateTime >= weekStart.getTime() && appDateTime <= weekEnd.getTime();
                });
            } else if (filterType === 'month' && selectedDate) {
                // Lọc theo tháng chứa ngày được chọn
                const selected = new Date(selectedDate);
                const monthStart = new Date(selected.getFullYear(), selected.getMonth(), 1);
                monthStart.setHours(0, 0, 0, 0);
                const monthEnd = new Date(selected.getFullYear(), selected.getMonth() + 1, 0);
                monthEnd.setHours(23, 59, 59, 999);

                return apps.filter(app => {
                    const appDateTime = app.dateTime.getTime();
                    return appDateTime >= monthStart.getTime() && appDateTime <= monthEnd.getTime();
                });
            }
            // Nếu filterType không match hoặc không có selectedDate, fallback về logic cũ
        }

        // Giữ lại logic cũ cho dateRange (backward compatibility)
        if (dateRangeStart || dateRangeEnd) {
            return apps.filter(app => {
                const appDate = new Date(app.dateTime);
                appDate.setHours(0, 0, 0, 0);
                const appTime = appDate.getTime();

                if (dateRangeStart && dateRangeEnd) {
                    const startDate = new Date(dateRangeStart);
                    startDate.setHours(0, 0, 0, 0);
                    const startTime = startDate.getTime();

                    const endDate = new Date(dateRangeEnd);
                    endDate.setHours(23, 59, 59, 999);
                    const endTime = endDate.getTime();

                    return appTime >= startTime && appTime <= endTime;
                } else if (dateRangeStart) {
                    const startDate = new Date(dateRangeStart);
                    startDate.setHours(0, 0, 0, 0);
                    const startTime = startDate.getTime();
                    return appTime >= startTime;
                } else if (dateRangeEnd) {
                    const endDate = new Date(dateRangeEnd);
                    endDate.setHours(23, 59, 59, 999);
                    const endTime = endDate.getTime();
                    return appTime <= endTime;
                }
                return true;
            });
        }

        const { today, startOfWeek, endOfWeek, startOfMonth, endOfMonth } = getTimeRange();

        switch (timeFilter) {
            case 'today':
                return apps.filter(app => {
                    const appDate = new Date(app.dateTime);
                    appDate.setHours(0, 0, 0, 0);
                    return appDate.getTime() === today.getTime();
                });
            case 'this-week':
                return apps.filter(app => {
                    const appDateTime = app.dateTime.getTime();
                    return appDateTime >= startOfWeek.getTime() && appDateTime <= endOfWeek.getTime();
                });
            case 'this-month':
                return apps.filter(app => {
                    const appDateTime = app.dateTime.getTime();
                    return appDateTime >= startOfMonth.getTime() && appDateTime <= endOfMonth.getTime();
                });
            case 'all':
            default:
                return apps;
        }
    };

    const filterCoursesByStatus = (courses: TreatmentCourse[], statusFilter: 'active' | 'completed') => {
        if (statusFilter === 'active') {
            // CHỈ hiển thị courses có ít nhất một appointment đã được admin chấp nhận
            // (status là 'confirmed', 'scheduled', 'upcoming', 'in-progress')
            // KHÔNG hiển thị courses chỉ có appointments với status 'pending' hoặc tất cả đều 'cancelled'
            // KHÔNG hiển thị courses bị admin hủy (status = 'cancelled')
            return courses.filter(course => {
                // Kiểm tra course status - loại bỏ cancelled
                if (course.status === 'cancelled' || (course.status !== 'active' && course.status !== 'pending')) {
                    return false;
                }

                // Tìm appointments liên quan đến course này qua bookingGroupId
                const courseBookingGroupId = `group-${course.id}`;
                const relatedAppointments = localAppointments.filter(app =>
                    app.bookingGroupId === courseBookingGroupId
                );

                // Nếu không có appointment nào, không hiển thị (chưa được chấp nhận)
                if (relatedAppointments.length === 0) {
                    return false;
                }

                // Kiểm tra xem có ít nhất một appointment đã được admin chấp nhận không
                // Status được chấp nhận (admin đã chấp nhận): 'scheduled', 'upcoming', 'in-progress'
                // Status chưa được chấp nhận: 'pending' (chờ xác nhận), 'cancelled' (đã hủy)
                const hasAcceptedAppointment = relatedAppointments.some(app =>
                    app.status === 'scheduled' ||
                    app.status === 'upcoming' ||
                    app.status === 'in-progress'
                );

                // CHỈ hiển thị nếu có ít nhất một appointment đã được chấp nhận
                return hasAcceptedAppointment;
            });
        } else {
            // Tab "Liệu trình đã xong" - giữ nguyên logic cũ
            return courses.filter(course => {
                const totalSessions = course.totalSessions ?? (Array.isArray(course.sessions) ? course.sessions.length : (Array.isArray((course as any).TreatmentSessions) ? (course as any).TreatmentSessions.length : 0));
                let completedSessions = course.completedSessions ?? 0;

                if (completedSessions === 0) {
                    const sessionsArr = course.sessions ?? (course as any).TreatmentSessions;
                    if (Array.isArray(sessionsArr) && sessionsArr.length > 0) {
                        completedSessions = sessionsArr.filter((s: any) => s.status === 'completed').length;
                    }
                }

                let progressPct = 0;
                if (totalSessions && totalSessions > 0) {
                    progressPct = Math.round((completedSessions / totalSessions) * 100);
                } else if (typeof (course as any).progressPercentage === 'number') {
                    progressPct = (course as any).progressPercentage;
                }

                return progressPct >= 100 && totalSessions > 0 && completedSessions > 0;
            });
        }
    };

    // Tự động cập nhật currentMonth khi chọn filter date
    useEffect(() => {
        if (upcomingSelectedDate && (upcomingFilterType === 'day' || upcomingFilterType === 'week' || upcomingFilterType === 'month')) {
            const selectedDate = new Date(upcomingSelectedDate);
            setCurrentMonth(selectedDate);
        }
    }, [upcomingSelectedDate, upcomingFilterType]);

    const displayUpcoming = useMemo(() => {
        let filtered = [...myUpcomingAppointments];
        if (upcomingFilterService !== 'all') {
            filtered = filtered.filter(app => app.serviceId === upcomingFilterService);
        }
        // Ưu tiên filter type mới, nếu không có thì dùng filter time cũ
        if (upcomingFilterType !== 'all') {
            filtered = filterByTime(filtered, upcomingFilterTime, upcomingFilterType, upcomingSelectedDate);
        } else {
            filtered = filterByTime(filtered, upcomingFilterTime);
        }
        filtered.sort((a, b) => upcomingSort === 'date-asc' ? a.dateTime.getTime() - b.dateTime.getTime() : b.dateTime.getTime() - a.dateTime.getTime());
        return filtered;
    }, [myUpcomingAppointments, upcomingSort, upcomingFilterService, upcomingFilterTime, upcomingFilterType, upcomingSelectedDate, dateRangeStart, dateRangeEnd]);

    const displayHistory = useMemo(() => {
        let filtered = [...myHistoryAppointments];
        if (historyFilterService !== 'all') {
            filtered = filtered.filter(app => app.serviceId === historyFilterService);
        }
        if (historyFilterStatus !== 'all') {
            filtered = filtered.filter(app => app.status === historyFilterStatus);
        }
        filtered = filterByTime(filtered, historyFilterTime);
        filtered.sort((a, b) => historySort === 'date-desc' ? b.dateTime.getTime() - a.dateTime.getTime() : a.dateTime.getTime() - b.dateTime.getTime());
        return filtered;
    }, [myHistoryAppointments, historySort, historyFilterService, historyFilterTime, historyFilterStatus]);

    // Pagination for history
    const historyTotalPages = Math.ceil(displayHistory.length / historyItemsPerPage);
    const historyPaginatedData = useMemo(() => {
        const startIndex = (historyCurrentPage - 1) * historyItemsPerPage;
        const endIndex = startIndex + historyItemsPerPage;
        return displayHistory.slice(startIndex, endIndex);
    }, [displayHistory, historyCurrentPage, historyItemsPerPage]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setHistoryCurrentPage(1);
    }, [historySort, historyFilterService, historyFilterTime, historyFilterStatus]);

    const uniqueServiceIds = useMemo(() => [...new Set(myUpcomingAppointments.map(a => a.serviceId).concat(myHistoryAppointments.map(a => a.serviceId)))], [myUpcomingAppointments, myHistoryAppointments]);
    const serviceFilterOptions = allServices.filter(s => uniqueServiceIds.includes(s.id));

    const displayCourses = useMemo(() => {
        return filterCoursesByStatus(myTreatmentCourses, coursesFilterStatus);
    }, [myTreatmentCourses, coursesFilterStatus]);

    // Calendar Helper Logic
    const getCalendarDays = (targetMonth: Date) => {
        const year = targetMonth.getFullYear();
        const month = targetMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        const adjustedStartingDay = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;

        const days: (Date | null)[] = [];
        for (let i = 0; i < adjustedStartingDay; i++) days.push(null);
        for (let day = 1; day <= daysInMonth; day++) days.push(new Date(year, month, day));
        return days;
    };

    const groupAppsByDate = (apps: (Appointment & { dateTime: Date })[]) => {
        const map = new Map<string, (Appointment & { dateTime: Date })[]>();
        apps.forEach(app => {
            let dateKey = app.date;
            if (typeof dateKey === 'string') {
                dateKey = dateKey.split('T')[0];
            } else {
                const isDateObject = typeof dateKey === 'object' && dateKey !== null && Object.prototype.toString.call(dateKey) === '[object Date]';
                if (isDateObject) {
                    const dateObj = dateKey as unknown as Date;
                    const y = dateObj.getFullYear();
                    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
                    const d = String(dateObj.getDate()).padStart(2, '0');
                    dateKey = `${y}-${m}-${d}`;
                } else {
                    dateKey = String(dateKey).split('T')[0];
                }
            }
            if (!map.has(dateKey)) map.set(dateKey, []);
            map.get(dateKey)!.push(app);
        });
        return map;
    };

    const cancelGroupStats = useMemo(() => {
        if (!appointmentToCancel) return null;

        const sameGroupApps = localAppointments.filter(app =>
            app.bookingGroupId === appointmentToCancel.bookingGroupId
            && app.serviceId === appointmentToCancel.serviceId
            && app.userId === appointmentToCancel.userId
        );

        const completedCount = sameGroupApps.filter(app => app.status === 'completed').length;
        const cancellableCount = sameGroupApps.filter(app => !['cancelled', 'completed'].includes(app.status)).length;

        return {
            totalCount: sameGroupApps.length,
            completedCount,
            cancellableCount
        };
    }, [appointmentToCancel, localAppointments]);

    return (
        <div className="bg-brand-secondary min-h-screen">
            {toastMessage && (
                <div className="fixed top-28 right-6 bg-green-500 text-white p-4 rounded-lg shadow-lg z-[100] animate-fadeInDown">
                    {toastMessage}
                </div>
            )}
            <div className="container mx-auto px-4 py-12">
                <h1 className="text-3xl sm:text-4xl font-serif font-bold text-brand-text text-center mb-10">Lịch Hẹn & Liệu Trình</h1>

                <div className="mb-8 flex justify-center border-b border-gray-300">
                    <button onClick={() => setActiveTab('upcoming')} className={`px-6 py-3 font-semibold text-lg transition-colors ${activeTab === 'upcoming' ? 'border-b-2 border-brand-primary text-brand-dark' : 'text-gray-500 hover:text-brand-dark'}`}>Lịch Hẹn Sắp Tới</button>
                    <button onClick={() => setActiveTab('history')} className={`px-6 py-3 font-semibold text-lg transition-colors ${activeTab === 'history' ? 'border-b-2 border-brand-primary text-brand-dark' : 'text-gray-500 hover:text-brand-dark'}`}>Lịch Sử Hẹn</button>
                    <button onClick={() => setActiveTab('courses')} className={`px-6 py-3 font-semibold text-lg transition-colors ${activeTab === 'courses' ? 'border-b-2 border-brand-primary text-brand-dark' : 'text-gray-500 hover:text-brand-dark'}`}>Liệu Trình Của Tôi</button>
                </div>

                <div className="max-w-5xl mx-auto">
                    {activeTab === 'upcoming' && (
                        <div className="space-y-6">
                            <div className="bg-white p-4 rounded-lg shadow-md">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-medium text-gray-700">Lọc theo thời gian</label>
                                        <div className="flex gap-2 items-center">
                                            <select
                                                value={upcomingFilterType}
                                                onChange={(e) => {
                                                    const newType = e.target.value as 'all' | 'day' | 'week' | 'month';
                                                    setUpcomingFilterType(newType);
                                                    setUpcomingFilterTime('all');
                                                    setDateRangeStart('');
                                                    setDateRangeEnd('');
                                                    if (newType === 'all') {
                                                        setUpcomingSelectedDate('');
                                                    } else {
                                                        // Tự động set ngày mặc định là hôm nay nếu chưa có ngày được chọn
                                                        if (!upcomingSelectedDate) {
                                                            const today = new Date();
                                                            const todayStr = today.toISOString().split('T')[0];
                                                            setUpcomingSelectedDate(todayStr);
                                                            setCurrentMonth(today);
                                                        } else {
                                                            // Nếu đã có ngày được chọn, tự động cập nhật calendar
                                                            const selectedDate = new Date(upcomingSelectedDate);
                                                            setCurrentMonth(selectedDate);
                                                        }
                                                    }
                                                }}
                                                className="flex-1 p-2 border rounded-md bg-white"
                                            >
                                                <option value="all">Tất cả</option>
                                                <option value="day">Ngày</option>
                                                <option value="week">Tuần</option>
                                                <option value="month">Tháng</option>
                                            </select>
                                            {(upcomingFilterType === 'day' || upcomingFilterType === 'week' || upcomingFilterType === 'month') && (
                                                <input
                                                    type="date"
                                                    value={upcomingSelectedDate || new Date().toISOString().split('T')[0]}
                                                    className="flex-1 p-2 border rounded-md bg-white"
                                                    onChange={(e) => {
                                                        const selectedDate = e.target.value;
                                                        setUpcomingSelectedDate(selectedDate);
                                                        // Tự động cập nhật currentMonth để calendar hiển thị đúng tháng
                                                        if (selectedDate) {
                                                            const date = new Date(selectedDate);
                                                            setCurrentMonth(date);
                                                        }
                                                    }}
                                                />
                                            )}
                                        </div>
                                    </div>
                                    <select value={upcomingFilterService} onChange={e => setUpcomingFilterService(e.target.value)} className="w-full p-2 border rounded-md bg-white">
                                        <option value="all">Lọc theo dịch vụ</option>
                                        {serviceFilterOptions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            {reminders.length > 0 && (
                                <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 p-4 rounded-md flex gap-3">
                                    <BellIcon className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
                                    <div>
                                        <h4 className="font-bold">Nhắc nhở lịch hẹn!</h4>
                                        <p className="text-sm">Bạn có lịch hẹn sau đây trong vòng 24 giờ tới:</p>
                                        <ul className="list-disc list-inside text-sm mt-1">
                                            {reminders.map(app => {
                                                let dateStr = typeof app.date === 'string' ? app.date.split('T')[0] : '';
                                                if (typeof app.date !== 'string') {
                                                    const d = app.date as unknown as Date;
                                                    dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                                                }
                                                const dateParts = dateStr.split('-');
                                                const displayDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : dateStr;
                                                return (
                                                    <li key={app.id}>
                                                        <strong>{app.serviceName}</strong> lúc {app.time} ngày {displayDate}
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                </div>
                            )}

                            {isLoadingAppointments ? (
                                <div className="text-center py-10">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
                                    <p className="text-gray-500">Đang tải lịch hẹn...</p>
                                </div>
                            ) : (
                                (() => {
                                    const appointmentsByDate = groupAppsByDate(displayUpcoming);

                                    // Hiển thị view theo filter type
                                    // Nếu chọn filter type nhưng chưa có ngày, dùng ngày hôm nay làm mặc định
                                    let displayDate = upcomingSelectedDate;
                                    if ((upcomingFilterType === 'day' || upcomingFilterType === 'week' || upcomingFilterType === 'month') && !displayDate) {
                                        const today = new Date();
                                        displayDate = today.toISOString().split('T')[0];
                                    }

                                    if (upcomingFilterType === 'day' && displayDate) {
                                        // View dạng ngày - hiển thị list appointments của 1 ngày
                                        const selectedDate = new Date(displayDate);
                                        const dateKey = displayDate.split('T')[0];
                                        const dayAppointments = appointmentsByDate.get(dateKey) || [];

                                        return (
                                            <div className="bg-white p-6 rounded-lg shadow-md">
                                                <div className="flex items-center justify-between mb-6">
                                                    <h2 className="text-xl font-bold text-gray-800">
                                                        {selectedDate.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                                    </h2>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => {
                                                                const prevDay = new Date(selectedDate);
                                                                prevDay.setDate(prevDay.getDate() - 1);
                                                                setUpcomingSelectedDate(prevDay.toISOString().split('T')[0]);
                                                                setCurrentMonth(prevDay);
                                                            }}
                                                            className="px-4 py-2 text-sm font-semibold bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                                                        >
                                                            ‹ Ngày trước
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                const nextDay = new Date(selectedDate);
                                                                nextDay.setDate(nextDay.getDate() + 1);
                                                                setUpcomingSelectedDate(nextDay.toISOString().split('T')[0]);
                                                                setCurrentMonth(nextDay);
                                                            }}
                                                            className="px-4 py-2 text-sm font-semibold bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                                                        >
                                                            Ngày sau ›
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
                                                    {dayAppointments.length > 0 ? (
                                                        dayAppointments.map(app => (
                                                            <UpcomingAppointmentCard
                                                                key={app.id}
                                                                appointment={app}
                                                                onViewDetail={setViewingAppointment}
                                                                onCancel={setAppointmentToCancel}
                                                            />
                                                        ))
                                                    ) : (
                                                        <div className="text-center py-10 text-gray-500">
                                                            Không có lịch hẹn nào trong ngày này
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    } else if (upcomingFilterType === 'week' && displayDate) {
                                        // View dạng tuần - hiển thị 7 ngày của tuần
                                        const selectedDate = new Date(displayDate);
                                        const weekStart = getStartOfWeek(selectedDate);
                                        const weekDays: Date[] = [];
                                        for (let i = 0; i < 7; i++) {
                                            const day = new Date(weekStart);
                                            day.setDate(weekStart.getDate() + i);
                                            weekDays.push(day);
                                        }

                                        return (
                                            <div className="bg-white p-6 rounded-lg shadow-md">
                                                <div className="flex items-center justify-between mb-6">
                                                    <h2 className="text-xl font-bold text-gray-800">
                                                        Tuần từ {weekDays[0].toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' })} đến {weekDays[6].toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric', year: 'numeric' })}
                                                    </h2>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => {
                                                                const prevWeek = new Date(weekStart);
                                                                prevWeek.setDate(prevWeek.getDate() - 7);
                                                                setUpcomingSelectedDate(prevWeek.toISOString().split('T')[0]);
                                                                setCurrentMonth(prevWeek);
                                                            }}
                                                            className="px-4 py-2 text-sm font-semibold bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                                                        >
                                                            ‹ Tuần trước
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                const nextWeek = new Date(weekStart);
                                                                nextWeek.setDate(nextWeek.getDate() + 7);
                                                                setUpcomingSelectedDate(nextWeek.toISOString().split('T')[0]);
                                                                setCurrentMonth(nextWeek);
                                                            }}
                                                            className="px-4 py-2 text-sm font-semibold bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                                                        >
                                                            Tuần sau ›
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-7 gap-2">
                                                    {['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'].map(day => (
                                                        <div key={day} className="p-2 text-center font-semibold text-gray-700 bg-gray-50 rounded">
                                                            {day}
                                                        </div>
                                                    ))}

                                                    {weekDays.map((date) => {
                                                        const year = date.getFullYear();
                                                        const month = String(date.getMonth() + 1).padStart(2, '0');
                                                        const day = String(date.getDate()).padStart(2, '0');
                                                        const dateKey = `${year}-${month}-${day}`;
                                                        const dayAppointments = appointmentsByDate.get(dateKey) || [];
                                                        const isToday = date.toDateString() === new Date().toDateString();

                                                        return (
                                                            <div
                                                                key={dateKey}
                                                                className={`p-2 min-h-[150px] border rounded ${isToday ? 'border-brand-primary bg-brand-secondary' : 'border-gray-200 bg-white'
                                                                    } hover:bg-gray-50 transition-colors`}
                                                            >
                                                                <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-brand-primary' : 'text-gray-800'
                                                                    }`}>
                                                                    {date.getDate()}
                                                                </div>
                                                                <div className="space-y-1">
                                                                    {dayAppointments.map(app => {
                                                                        const statusColor = app.status === 'pending' ? 'bg-yellow-100 text-yellow-800'
                                                                            : (app.status === 'upcoming' || app.status === 'scheduled') ? 'bg-blue-100 text-blue-800'
                                                                                : app.status === 'in-progress' ? 'bg-purple-100 text-purple-800'
                                                                                    : app.status === 'completed' ? 'bg-green-100 text-green-800'
                                                                                        : app.status === 'cancelled' ? 'bg-red-100 text-red-800'
                                                                                            : 'bg-gray-100 text-gray-800';
                                                                        return (
                                                                            <div
                                                                                key={app.id}
                                                                                onClick={() => setViewingAppointment(app)}
                                                                                className={`text-xs p-1.5 rounded cursor-pointer transition-shadow hover:shadow-md ${statusColor}`}
                                                                                title={`${app.time} - ${app.serviceName}`}
                                                                            >
                                                                                <div className="font-semibold truncate">{app.time}</div>
                                                                                <div className="truncate font-medium">{app.serviceName}</div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    } else if (upcomingFilterType === 'month' && displayDate) {
                                        // View dạng tháng - hiển thị toàn bộ tháng
                                        const targetMonth = new Date(displayDate);
                                        const days = getCalendarDays(targetMonth);

                                        return (
                                            <div className="bg-white p-6 rounded-lg shadow-md">
                                                <div className="flex items-center justify-between mb-6">
                                                    <button
                                                        onClick={() => {
                                                            const prevMonth = new Date(targetMonth);
                                                            prevMonth.setMonth(prevMonth.getMonth() - 1);
                                                            setUpcomingSelectedDate(prevMonth.toISOString().split('T')[0]);
                                                            setCurrentMonth(prevMonth);
                                                        }}
                                                        className="px-4 py-2 text-sm font-semibold bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                                                    >
                                                        ‹ Tháng trước
                                                    </button>
                                                    <h2 className="text-xl font-bold text-gray-800">
                                                        tháng {targetMonth.getMonth() + 1} năm {targetMonth.getFullYear()}
                                                    </h2>
                                                    <button
                                                        onClick={() => {
                                                            const nextMonth = new Date(targetMonth);
                                                            nextMonth.setMonth(nextMonth.getMonth() + 1);
                                                            setUpcomingSelectedDate(nextMonth.toISOString().split('T')[0]);
                                                            setCurrentMonth(nextMonth);
                                                        }}
                                                        className="px-4 py-2 text-sm font-semibold bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                                                    >
                                                        Tháng sau ›
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-7 gap-2">
                                                    {['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'].map(day => (
                                                        <div key={day} className="p-2 text-center font-semibold text-gray-700 bg-gray-50 rounded">
                                                            {day}
                                                        </div>
                                                    ))}

                                                    {days.map((date, index) => {
                                                        if (!date) return <div key={`empty-${index}`} className="p-2 min-h-[100px] border border-gray-200 rounded bg-gray-50"></div>;

                                                        const year = date.getFullYear();
                                                        const month = String(date.getMonth() + 1).padStart(2, '0');
                                                        const day = String(date.getDate()).padStart(2, '0');
                                                        const dateKey = `${year}-${month}-${day}`;
                                                        const dayAppointments = appointmentsByDate.get(dateKey) || [];
                                                        const isToday = date.toDateString() === new Date().toDateString();

                                                        return (
                                                            <div
                                                                key={dateKey}
                                                                className={`p-2 min-h-[100px] border rounded ${isToday ? 'border-brand-primary bg-brand-secondary' : 'border-gray-200 bg-white'
                                                                    } hover:bg-gray-50 transition-colors`}
                                                            >
                                                                <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-brand-primary' : 'text-gray-800'
                                                                    }`}>
                                                                    {date.getDate()}
                                                                </div>
                                                                <div className="space-y-1">
                                                                    {dayAppointments.map(app => {
                                                                        const statusColor = app.status === 'pending' ? 'bg-yellow-100 text-yellow-800'
                                                                            : (app.status === 'upcoming' || app.status === 'scheduled') ? 'bg-blue-100 text-blue-800'
                                                                                : app.status === 'in-progress' ? 'bg-purple-100 text-purple-800'
                                                                                    : app.status === 'completed' ? 'bg-green-100 text-green-800'
                                                                                        : app.status === 'cancelled' ? 'bg-red-100 text-red-800'
                                                                                            : 'bg-gray-100 text-gray-800';
                                                                        return (
                                                                            <div
                                                                                key={app.id}
                                                                                onClick={() => setViewingAppointment(app)}
                                                                                className={`text-xs p-1.5 rounded cursor-pointer transition-shadow hover:shadow-md ${statusColor}`}
                                                                                title={`${app.time} - ${app.serviceName}`}
                                                                            >
                                                                                <div className="font-semibold truncate">{app.time}</div>
                                                                                <div className="truncate font-medium">{app.serviceName}</div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    } else {
                                        // View mặc định - hiển thị tháng hiện tại (filter "Tất cả" hoặc chưa chọn filter)
                                        const targetMonth = currentMonth;
                                        const days = getCalendarDays(targetMonth);

                                        return (
                                            <div className="bg-white p-6 rounded-lg shadow-md">
                                                <div className="flex items-center justify-between mb-6">
                                                    <button
                                                        onClick={() => {
                                                            const prevMonth = new Date(targetMonth);
                                                            prevMonth.setMonth(prevMonth.getMonth() - 1);
                                                            setCurrentMonth(prevMonth);
                                                        }}
                                                        className="px-4 py-2 text-sm font-semibold bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                                                    >
                                                        ‹ Tháng trước
                                                    </button>
                                                    <h2 className="text-xl font-bold text-gray-800">
                                                        tháng {targetMonth.getMonth() + 1} năm {targetMonth.getFullYear()}
                                                    </h2>
                                                    <button
                                                        onClick={() => {
                                                            const nextMonth = new Date(targetMonth);
                                                            nextMonth.setMonth(nextMonth.getMonth() + 1);
                                                            setCurrentMonth(nextMonth);
                                                        }}
                                                        className="px-4 py-2 text-sm font-semibold bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                                                    >
                                                        Tháng sau ›
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-7 gap-2">
                                                    {['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'].map(day => (
                                                        <div key={day} className="p-2 text-center font-semibold text-gray-700 bg-gray-50 rounded">
                                                            {day}
                                                        </div>
                                                    ))}

                                                    {days.map((date, index) => {
                                                        if (!date) return <div key={`empty-${index}`} className="p-2 min-h-[100px] border border-gray-200 rounded bg-gray-50"></div>;

                                                        const year = date.getFullYear();
                                                        const month = String(date.getMonth() + 1).padStart(2, '0');
                                                        const day = String(date.getDate()).padStart(2, '0');
                                                        const dateKey = `${year}-${month}-${day}`;
                                                        const dayAppointments = appointmentsByDate.get(dateKey) || [];
                                                        const isToday = date.toDateString() === new Date().toDateString();

                                                        return (
                                                            <div
                                                                key={dateKey}
                                                                className={`p-2 min-h-[100px] border rounded ${isToday ? 'border-brand-primary bg-brand-secondary' : 'border-gray-200 bg-white'
                                                                    } hover:bg-gray-50 transition-colors`}
                                                            >
                                                                <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-brand-primary' : 'text-gray-800'
                                                                    }`}>
                                                                    {date.getDate()}
                                                                </div>
                                                                <div className="space-y-1">
                                                                    {dayAppointments.map(app => {
                                                                        const statusColor = app.status === 'pending' ? 'bg-yellow-100 text-yellow-800'
                                                                            : (app.status === 'upcoming' || app.status === 'scheduled') ? 'bg-blue-100 text-blue-800'
                                                                                : app.status === 'in-progress' ? 'bg-purple-100 text-purple-800'
                                                                                    : app.status === 'completed' ? 'bg-green-100 text-green-800'
                                                                                        : app.status === 'cancelled' ? 'bg-red-100 text-red-800'
                                                                                            : 'bg-gray-100 text-gray-800';
                                                                        return (
                                                                            <div
                                                                                key={app.id}
                                                                                onClick={() => setViewingAppointment(app)}
                                                                                className={`text-xs p-1.5 rounded cursor-pointer transition-shadow hover:shadow-md ${statusColor}`}
                                                                                title={`${app.time} - ${app.serviceName}`}
                                                                            >
                                                                                <div className="font-semibold truncate">{app.time}</div>
                                                                                <div className="truncate font-medium">{app.serviceName}</div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    }
                                })()
                            )}
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="space-y-6">
                            <div className="bg-white p-4 rounded-lg shadow-md grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                                <select value={historySort} onChange={e => setHistorySort(e.target.value)} className="w-full p-2 border rounded-md bg-white">
                                    <option value="date-desc">Sắp xếp theo: Ngày hẹn (Mới nhất)</option>
                                    <option value="date-asc">Sắp xếp theo: Ngày hẹn (Cũ nhất)</option>
                                </select>
                                <select value={historyFilterService} onChange={e => setHistoryFilterService(e.target.value)} className="w-full p-2 border rounded-md bg-white">
                                    <option value="all">Tất cả dịch vụ</option>
                                    {serviceFilterOptions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                                <div className="flex items-center justify-center gap-2">
                                    {['all', 'completed', 'cancelled'].map(filter => {
                                        const labels: Record<string, string> = { all: 'Tất cả', completed: 'Hoàn thành', cancelled: 'Đã hủy' };
                                        return <button key={filter} onClick={() => setHistoryFilterStatus(filter)} className={`px-3 py-1.5 text-sm font-semibold rounded-full ${historyFilterStatus === filter ? 'bg-brand-primary text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>{labels[filter]}</button>
                                    })}
                                </div>
                                <div className="flex items-center justify-center gap-2">
                                    {['all', 'today', 'this-week', 'this-month'].map(filter => {
                                        const labels: Record<string, string> = { all: 'Tất cả', today: 'Hôm nay', 'this-week': 'Tuần này', 'this-month': 'Tháng này' };
                                        return <button key={filter} onClick={() => setHistoryFilterTime(filter)} className={`px-3 py-1.5 text-sm font-semibold rounded-full ${historyFilterTime === filter ? 'bg-brand-primary text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>{labels[filter]}</button>
                                    })}
                                </div>
                            </div>

                            {/* Items per page selector */}
                            {displayHistory.length > 0 && (
                                <div className="bg-white p-3 rounded-lg shadow-md flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm text-gray-600">Hiển thị:</span>
                                        <select
                                            value={historyItemsPerPage}
                                            onChange={(e) => {
                                                setHistoryItemsPerPage(Number(e.target.value));
                                                setHistoryCurrentPage(1);
                                            }}
                                            className="px-3 py-1.5 border rounded-md bg-white text-sm"
                                        >
                                            <option value="5">5</option>
                                            <option value="10">10</option>
                                            <option value="20">20</option>
                                            <option value="50">50</option>
                                        </select>
                                        <span className="text-sm text-gray-600">
                                            / Tổng: {displayHistory.length} lịch hẹn
                                        </span>
                                    </div>
                                </div>
                            )}

                            {historyPaginatedData.length > 0 ? (
                                <>
                                    {historyPaginatedData.map(app => (
                                        <HistoryAppointmentCard
                                            key={app.id}
                                            appointment={app}
                                            allUsers={allUsers}
                                            onViewDetail={setViewingAppointment}
                                        />
                                    ))}

                                    {/* Pagination Controls */}
                                    {historyTotalPages > 1 && (
                                        <div className="bg-white p-4 rounded-lg shadow-md flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => setHistoryCurrentPage(prev => Math.max(1, prev - 1))}
                                                disabled={historyCurrentPage === 1}
                                                className={`px-4 py-2 text-sm font-semibold rounded-md ${historyCurrentPage === 1
                                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                    }`}
                                            >
                                                ‹ Trước
                                            </button>

                                            <div className="flex items-center gap-1">
                                                {Array.from({ length: historyTotalPages }, (_, i) => i + 1)
                                                    .filter(page => {
                                                        // Show first page, last page, current page, and pages around current
                                                        if (page === 1 || page === historyTotalPages) return true;
                                                        if (Math.abs(page - historyCurrentPage) <= 1) return true;
                                                        return false;
                                                    })
                                                    .map((page, index, array) => {
                                                        // Add ellipsis if there's a gap
                                                        const showEllipsisBefore = index > 0 && array[index - 1] !== page - 1;
                                                        return (
                                                            <React.Fragment key={page}>
                                                                {showEllipsisBefore && (
                                                                    <span className="px-2 text-gray-400">...</span>
                                                                )}
                                                                <button
                                                                    onClick={() => setHistoryCurrentPage(page)}
                                                                    className={`px-3 py-2 text-sm font-semibold rounded-md ${historyCurrentPage === page
                                                                        ? 'bg-brand-primary text-white'
                                                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                                        }`}
                                                                >
                                                                    {page}
                                                                </button>
                                                            </React.Fragment>
                                                        );
                                                    })}
                                            </div>

                                            <button
                                                onClick={() => setHistoryCurrentPage(prev => Math.min(historyTotalPages, prev + 1))}
                                                disabled={historyCurrentPage === historyTotalPages}
                                                className={`px-4 py-2 text-sm font-semibold rounded-md ${historyCurrentPage === historyTotalPages
                                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                    }`}
                                            >
                                                Sau ›
                                            </button>

                                            <span className="text-sm text-gray-600 ml-4">
                                                Trang {historyCurrentPage} / {historyTotalPages}
                                            </span>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <p className="text-center text-gray-500 py-10 bg-white rounded-lg shadow-md">Không có lịch sử hẹn nào.</p>
                            )}
                        </div>
                    )}

                    {activeTab === 'courses' && (
                        <div className="space-y-6">
                            <div className="bg-white p-4 rounded-lg shadow-md flex items-center justify-center gap-2 border-b-2 border-gray-200">
                                <button
                                    onClick={() => setCoursesFilterStatus('active')}
                                    className={`px-6 py-3 text-base font-semibold rounded-lg transition-colors ${coursesFilterStatus === 'active'
                                        ? 'bg-brand-primary text-white border-2 border-brand-primary'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
                                        }`}
                                >
                                    Liệu trình đang thực hiện
                                </button>
                                <button
                                    onClick={() => setCoursesFilterStatus('completed')}
                                    className={`px-6 py-3 text-base font-semibold rounded-lg transition-colors ${coursesFilterStatus === 'completed'
                                        ? 'bg-brand-primary text-white border-2 border-brand-primary'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
                                        }`}
                                >
                                    Liệu trình đã xong
                                </button>
                            </div>

                            {displayCourses.length > 0 ? (
                                displayCourses.map(course => (
                                    <TreatmentCourseCard
                                        key={course.id}
                                        course={course}
                                        currentUser={currentUser}
                                        allServices={allServices}
                                        allReviews={allReviews}
                                        onReviewSuccess={fetchReviews}
                                        setToastMessage={setToastMessage}
                                    />
                                ))
                            ) : (
                                <div className="text-center py-10 bg-white rounded-lg shadow-md">
                                    <p className="text-lg text-gray-500">
                                        {coursesFilterStatus === 'active'
                                            ? 'Bạn chưa có liệu trình đang thực hiện nào.'
                                            : 'Bạn chưa có liệu trình đã hoàn thành nào.'}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {viewingAppointment && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={() => setViewingAppointment(null)}>
                    <div className="bg-white p-8 rounded-lg shadow-xl max-w-lg w-full transform transition-all animate-fadeIn" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-2xl font-serif font-bold text-brand-dark">Chi Tiết Lịch Hẹn</h2>
                            <button onClick={() => setViewingAppointment(null)} className="text-gray-400 hover:text-gray-800 text-3xl font-light leading-none">&times;</button>
                        </div>

                        <div className="mb-4">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full border ${viewingAppointment.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                                : viewingAppointment.status === 'scheduled' || viewingAppointment.status === 'upcoming'
                                    ? 'bg-green-100 text-green-800 border-green-300'
                                    : viewingAppointment.status === 'in-progress'
                                        ? 'bg-blue-100 text-blue-800 border-blue-300'
                                        : viewingAppointment.status === 'completed'
                                            ? 'bg-green-100 text-green-800 border-green-300'
                                            : 'bg-red-100 text-red-800 border-red-300'
                                }`}>
                                {viewingAppointment.status === 'pending' && '⏳ Chờ xác nhận'}
                                {(viewingAppointment.status === 'scheduled' || viewingAppointment.status === 'upcoming') && '✓ Đã xác nhận'}
                                {viewingAppointment.status === 'in-progress' && '🔄 Đang thực hiện'}
                                {viewingAppointment.status === 'completed' && '✓ Hoàn thành'}
                                {viewingAppointment.status === 'cancelled' && '✗ Đã hủy'}
                            </span>
                        </div>

                        <div className="space-y-5 text-sm sm:text-base">
                            <div className="pb-3 border-b">
                                <p className="text-sm text-gray-500">Dịch vụ</p>
                                <p className="text-lg font-bold text-brand-primary">{viewingAppointment.serviceName}</p>
                            </div>
                            {(viewingAppointment as any).TreatmentSession && (
                                <div className="pb-3 border-b">
                                    <p className="text-sm text-gray-500">Buổi trong liệu trình</p>
                                    <p className="font-semibold text-gray-800">
                                        Buổi {(viewingAppointment as any).TreatmentSession.sessionNumber}
                                        {(viewingAppointment as any).TreatmentSession.TreatmentCourse?.totalSessions ?
                                            ` / ${(viewingAppointment as any).TreatmentSession.TreatmentCourse.totalSessions}` : ''}
                                    </p>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4 pb-3 border-b">
                                <div>
                                    <p className="text-sm text-gray-500">Ngày hẹn</p>
                                    <p className="font-semibold text-gray-800">{viewingAppointment.dateTime.toLocaleDateString('vi-VN')}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Giờ hẹn</p>
                                    <p className="font-semibold text-gray-800">{viewingAppointment.time}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Thời lượng</p>
                                    <p className="font-semibold text-gray-800">{allServices.find(s => s.id === viewingAppointment.serviceId)?.duration} phút</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Kỹ thuật viên</p>
                                    <p className="font-semibold text-gray-800">{viewingAppointment.Therapist?.name || (allUsers.find(u => u.id === viewingAppointment.therapistId)?.name) || 'Chưa phân công'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Trạng thái thanh toán</p>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${viewingAppointment.status === 'cancelled'
                                        ? 'bg-gray-100 text-gray-600'
                                        : viewingAppointment.status === 'completed'
                                            ? 'bg-green-100 text-green-800'
                                            : viewingAppointment.paymentStatus === 'Paid'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {viewingAppointment.status === 'cancelled'
                                            ? 'Chưa thanh toán'
                                            : viewingAppointment.status === 'completed'
                                                ? 'Đã thanh toán'
                                                : viewingAppointment.paymentStatus === 'Paid'
                                                    ? 'Đã thanh toán'
                                                    : 'Chưa thanh toán'}
                                    </span>
                                </div>
                            </div>
                            {viewingAppointment.notesForTherapist && (
                                <div>
                                    <p className="text-sm text-gray-500">Ghi chú của bạn</p>
                                    <p className="font-semibold text-gray-800 italic bg-gray-50 p-2 rounded-md">"{viewingAppointment.notesForTherapist}"</p>
                                </div>
                            )}

                            {/* Ghi chú buổi trước (nếu là buổi liệu trình) */}
                            {(viewingAppointment as any).TreatmentSession?.previousSessionNotes?.customerStatusNotes && (
                                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                                    <p className="text-sm font-semibold text-blue-700 mb-2">📋 Ghi chú buổi trước:</p>
                                    <div>
                                        <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">Dành cho bạn</span>
                                        <p className="text-sm text-gray-800 mt-1">{(viewingAppointment as any).TreatmentSession.previousSessionNotes.customerStatusNotes}</p>
                                    </div>
                                </div>
                            )}

                            {(viewingAppointment as any).TreatmentSession?.customerStatusNotes && (
                                <div className="bg-green-50 border border-green-200 rounded-md p-3">
                                    <p className="text-sm font-semibold text-green-700 mb-2">📌 Ghi chú từ admin</p>
                                    <p className="text-sm text-gray-800">{(viewingAppointment as any).TreatmentSession.customerStatusNotes}</p>
                                </div>
                            )}
                        </div>
                        <div className="mt-6 flex justify-between items-center">
                            <div>
                                {viewingAppointment.status === 'pending' ? (
                                    <button
                                        onClick={() => {
                                            setAppointmentToCancel(viewingAppointment);
                                            setViewingAppointment(null);
                                        }}
                                        className="bg-red-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-red-700 transition-colors duration-300"
                                    >
                                        Hủy lịch
                                    </button>
                                ) : (
                                    <p className="text-sm text-gray-500 italic"></p>
                                )}
                            </div>
                            <button onClick={() => setViewingAppointment(null)} className="bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-lg hover:bg-gray-300 transition-colors duration-300">Đóng</button>
                        </div>
                    </div>
                </div>
            )}

            {appointmentToCancel && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={() => setAppointmentToCancel(null)}>
                    <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full text-center transform transition-all animate-fadeIn" onClick={(e) => e.stopPropagation()}>
                        <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                            <XCircleIcon className="w-10 h-10 text-red-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-brand-dark mb-4">Xác nhận Hủy Lịch hẹn</h2>
                        <p className="text-md text-brand-text mb-4">
                            Bạn có chắc chắn muốn hủy lịch hẹn cho dịch vụ <br />
                            <strong className="text-brand-primary">{appointmentToCancel.serviceName}</strong> <br />
                            vào lúc {appointmentToCancel.time} ngày {appointmentToCancel.dateTime.toLocaleDateString('vi-VN')}?
                        </p>

                        {cancelGroupStats && (
                            <div className="bg-red-50 border border-red-200 rounded-md p-4 text-sm text-left mb-6">
                                <p className="font-semibold text-red-700 mb-2">Lưu ý: Dịch vụ này thuộc chuỗi đặt nhiều buổi.</p>
                                <ul className="list-disc list-inside text-red-800 space-y-1">
                                    <li>Số buổi trong chuỗi: {cancelGroupStats.totalCount}</li>
                                    <li>Buổi sẽ bị hủy: {cancelGroupStats.cancellableCount} (chưa hoàn thành)</li>
                                    <li>Buổi đã hoàn thành: {cancelGroupStats.completedCount} (giữ nguyên, không hủy)</li>
                                </ul>
                                <p className="mt-2 text-red-700">Khi xác nhận, tất cả các buổi chưa hoàn thành của dịch vụ này sẽ bị hủy.</p>
                            </div>
                        )}
                        <div className="flex justify-center gap-4">
                            <button onClick={() => setAppointmentToCancel(null)} className="bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-lg hover:bg-gray-300">
                                Không
                            </button>
                            <button
                                onClick={handleCancelAppointment}
                                disabled={isCancellingAll}
                                className={`bg-red-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-red-700 ${isCancellingAll ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {isCancellingAll ? 'Đang hủy...' : 'Xác nhận hủy toàn bộ'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};