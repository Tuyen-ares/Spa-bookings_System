import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Appointment, TreatmentCourse, User, Service } from '../../types';
import { BellIcon, XCircleIcon } from '../../shared/icons';
import * as apiService from '../services/apiService';


interface AppointmentsPageProps {
    currentUser: User;
    allServices: Service[];
    allUsers: User[];
    allAppointments: Appointment[];
    allTreatmentCourses: TreatmentCourse[];
}

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
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Filter & Sort States
    const [upcomingSort, setUpcomingSort] = useState('date-asc');
    const [upcomingFilterService, setUpcomingFilterService] = useState('all');
    const [upcomingFilterTime, setUpcomingFilterTime] = useState('all');
    
    const [historySort, setHistorySort] = useState('date-desc');
    const [historyFilterService, setHistoryFilterService] = useState('all');
    const [historyFilterTime, setHistoryFilterTime] = useState('all');
    const [historyFilterStatus, setHistoryFilterStatus] = useState('all');
    
    // Treatment Courses Filter States
    const [coursesFilterStatus, setCoursesFilterStatus] = useState<'active' | 'completed'>('active');

    // Fetch appointments from API to ensure we have the latest data
    useEffect(() => {
        const fetchAppointments = async () => {
            try {
                setIsLoadingAppointments(true);
                // Fetch user-specific appointments
                const userAppointments = await apiService.getUserAppointments(currentUser.id);
                setLocalAppointments(userAppointments);
            } catch (error) {
                console.error("Failed to fetch appointments:", error);
                // Fallback to allAppointments from props if API call fails
                const fallbackApps = allAppointments.filter(app => app.userId === currentUser.id);
                setLocalAppointments(fallbackApps);
            } finally {
                setIsLoadingAppointments(false);
            }
        };
        
        // Fetch immediately on mount
        fetchAppointments();
        
        // Set up polling every 10 seconds to auto-update appointments
        const interval = setInterval(() => {
            fetchAppointments();
        }, 10000); // 10 seconds
        
        // Also listen for refresh event
        const handleRefresh = () => {
            fetchAppointments();
        };
        window.addEventListener('refresh-appointments', handleRefresh);
        
        return () => {
            clearInterval(interval);
            window.removeEventListener('refresh-appointments', handleRefresh);
        };
    }, [currentUser.id, allAppointments]);

    // Update local treatment courses when prop changes
    useEffect(() => {
        console.log('📊 allTreatmentCourses prop updated:', {
            count: allTreatmentCourses.length,
            courses: allTreatmentCourses.map(c => ({
                id: c.id,
                name: c.serviceName || c.name,
                clientId: c.clientId,
                status: c.status,
                sessionsCount: c.sessions?.length || c.TreatmentSessions?.length || 0
            }))
        });
        setLocalTreatmentCourses(allTreatmentCourses);
    }, [allTreatmentCourses]);

    // Fetch treatment courses from API to ensure we have latest data with sessions
    useEffect(() => {
        const fetchTreatmentCourses = async () => {
            try {
                // Fetch treatment courses for this client
                const clientCourses = await apiService.getTreatmentCourses({ clientId: currentUser.id });
                console.log('📊 Fetched treatment courses for client:', {
                    clientId: currentUser.id,
                    coursesCount: clientCourses.length,
                    courses: clientCourses.map(c => ({
                        id: c.id,
                        name: c.serviceName || c.name,
                        status: c.status,
                        clientId: c.clientId,
                        sessionsCount: c.sessions?.length || c.TreatmentSessions?.length || 0,
                        sessions: c.sessions || c.TreatmentSessions
                    }))
                });
                
                // Update local state with fetched courses
                setLocalTreatmentCourses(clientCourses);
            } catch (error) {
                console.error("Failed to fetch treatment courses:", error);
            }
        };
        
        // Fetch immediately on mount
        fetchTreatmentCourses();
        
        // Set up polling every 30 seconds to auto-update
        const interval = setInterval(() => {
            fetchTreatmentCourses();
        }, 30000); // 30 seconds
        
        // Listen for refresh event
        const handleRefresh = () => {
            fetchTreatmentCourses();
        };
        window.addEventListener('refresh-treatment-courses', handleRefresh);
        
        return () => {
            clearInterval(interval);
            window.removeEventListener('refresh-treatment-courses', handleRefresh);
        };
    }, [currentUser.id]);

    // Also update when allAppointments changes (e.g., after booking)
    useEffect(() => {
        if (allAppointments.length > 0) {
            const userApps = allAppointments.filter(app => app.userId === currentUser.id);
            if (userApps.length > 0) {
                setLocalAppointments(prev => {
                    // Merge and deduplicate appointments
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
        try {
            const cancelledAppointment = await apiService.cancelAppointment(appointmentToCancel.id);
            setLocalAppointments(prev =>
                prev.map(app => (app.id === cancelledAppointment.id ? cancelledAppointment : app))
            );
            setToastMessage('Đã hủy lịch hẹn thành công!');
            setTimeout(() => setToastMessage(null), 3000);
            setAppointmentToCancel(null);
        } catch (error) {
            console.error("Failed to cancel appointment:", error);
            alert("Hủy lịch hẹn thất bại.");
        }
    };

    // --- Memoized Data Processing ---
    const { myUpcomingAppointments, myHistoryAppointments, myTreatmentCourses } = useMemo(() => {
        const now = new Date();
        // Filter appointments for current user
        const myApps = localAppointments.filter(app => app.userId === currentUser.id);

        // Upcoming appointments: include 'pending' (awaiting admin confirmation), 'upcoming' (confirmed), and 'in-progress'
        // Also include appointments that are in the future (even if status is pending)
        const upcoming = myApps
            .map(app => ({...app, dateTime: new Date(`${app.date}T${app.time}`) }))
            .filter(app => {
                // Include if status is pending, upcoming, or in-progress
                const isUpcomingStatus = ['upcoming', 'pending', 'in-progress'].includes(app.status);
                // Also include if date is in the future (for appointments that might have been just created)
                const isFutureDate = app.dateTime >= now;
                return isUpcomingStatus && isFutureDate;
            });

        // History appointments: completed or cancelled, or past appointments regardless of status
        const history = myApps
            .map(app => ({...app, dateTime: new Date(`${app.date}T${app.time}`) }))
            .filter(app => {
                const isCompletedOrCancelled = ['completed', 'cancelled'].includes(app.status);
                const isPastDate = app.dateTime < now;
                // Include if completed/cancelled, or if past date (old appointments)
                return isCompletedOrCancelled || (isPastDate && !['upcoming', 'pending', 'in-progress'].includes(app.status));
            });

        const courses = localTreatmentCourses.filter(course => {
            const matches = course.clientId === currentUser.id;
            if (matches) {
                console.log('✅ Found course for client:', {
                    courseId: course.id,
                    courseName: course.serviceName || course.name,
                    clientId: course.clientId,
                    status: course.status,
                    sessionsCount: course.sessions?.length || 0,
                    hasSessions: !!course.sessions
                });
            }
            return matches;
        });
        
        console.log('📊 Treatment courses filter result:', {
            totalCourses: localTreatmentCourses.length,
            myCourses: courses.length,
            currentUserId: currentUser.id,
            courses: courses.map(c => ({ id: c.id, name: c.serviceName || c.name, status: c.status, clientId: c.clientId, sessionsCount: c.sessions?.length || 0 }))
        });
        
        return { myUpcomingAppointments: upcoming, myHistoryAppointments: history, myTreatmentCourses: courses };
    }, [localAppointments, localTreatmentCourses, currentUser.id]);

    const reminders = useMemo(() => {
        const twentyFourHoursFromNow = new Date(Date.now() + 24 * 60 * 60 * 1000);
        return myUpcomingAppointments.filter(app => app.dateTime <= twentyFourHoursFromNow);
    }, [myUpcomingAppointments]);

    // Helper function to get time range boundaries
    const getTimeRange = () => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        today.setHours(0, 0, 0, 0);
        
        // Start of week (Monday)
        const startOfWeek = new Date(today);
        const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ...
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        startOfWeek.setDate(today.getDate() - daysToMonday);
        startOfWeek.setHours(0, 0, 0, 0);
        
        // End of week (Sunday)
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        
        // Start of month
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        startOfMonth.setHours(0, 0, 0, 0);
        
        // End of month
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);
        
        return { today, startOfWeek, endOfWeek, startOfMonth, endOfMonth };
    };

    const filterByTime = (apps: (Appointment & { dateTime: Date })[], timeFilter: string) => {
        const { today, startOfWeek, endOfWeek, startOfMonth, endOfMonth } = getTimeRange();

        switch (timeFilter) {
            case 'today':
                // Filter appointments that fall within today (00:00:00 to 23:59:59)
                return apps.filter(app => {
                    const appDate = new Date(app.dateTime);
                    appDate.setHours(0, 0, 0, 0);
                    return appDate.getTime() === today.getTime();
                });
            case 'this-week':
                // Filter appointments that fall within this week (Monday to Sunday)
                return apps.filter(app => {
                    const appDateTime = app.dateTime.getTime();
                    return appDateTime >= startOfWeek.getTime() && appDateTime <= endOfWeek.getTime();
                });
            case 'this-month':
                // Filter appointments that fall within this month
                return apps.filter(app => {
                    const appDateTime = app.dateTime.getTime();
                    return appDateTime >= startOfMonth.getTime() && appDateTime <= endOfMonth.getTime();
                });
            case 'all':
            default:
                return apps;
        }
    };
    
    // Filter treatment courses by status (active or completed)
    const filterCoursesByStatus = (courses: TreatmentCourse[], statusFilter: 'active' | 'completed') => {
        if (statusFilter === 'active') {
            // Show active, pending courses (courses that are not completed or expired)
            return courses.filter(course => 
                course.status === 'active' || course.status === 'pending'
            );
        } else {
            // Show completed courses
            return courses.filter(course => course.status === 'completed');
        }
    };
    
    // Legacy function - kept for compatibility but not used
    const filterCoursesByTime = (courses: TreatmentCourse[], timeFilter: string) => {
        if (timeFilter === 'all') return courses;
        
        const { today, startOfWeek, endOfWeek, startOfMonth, endOfMonth } = getTimeRange();
        
        return courses.filter(course => {
            // Check if course has sessions with dates in the time range
            if (course.sessions && Array.isArray(course.sessions) && course.sessions.length > 0) {
                const hasSessionInRange = course.sessions.some(session => {
                    if (!session.date) return false;
                    const sessionDate = new Date(session.date);
                    sessionDate.setHours(0, 0, 0, 0);
                    
                    switch (timeFilter) {
                        case 'today':
                            return sessionDate.getTime() === today.getTime();
                        case 'this-week':
                            return sessionDate.getTime() >= startOfWeek.getTime() && sessionDate.getTime() <= endOfWeek.getTime();
                        case 'this-month':
                            return sessionDate.getTime() >= startOfMonth.getTime() && sessionDate.getTime() <= endOfMonth.getTime();
                        default:
                            return false;
                    }
                });
                if (hasSessionInRange) return true;
            }
            
            // Check nextAppointmentDate if available
            if (course.nextAppointmentDate) {
                const nextDate = new Date(course.nextAppointmentDate);
                nextDate.setHours(0, 0, 0, 0);
                
                switch (timeFilter) {
                    case 'today':
                        return nextDate.getTime() === today.getTime();
                    case 'this-week':
                        return nextDate.getTime() >= startOfWeek.getTime() && nextDate.getTime() <= endOfWeek.getTime();
                    case 'this-month':
                        return nextDate.getTime() >= startOfMonth.getTime() && nextDate.getTime() <= endOfMonth.getTime();
                    default:
                        return false;
                }
            }
            
            return false;
        });
    };

    // Group appointments by date
    const groupAppointmentsByDate = (appointments: (Appointment & { dateTime: Date })[]) => {
        const grouped: Record<string, (Appointment & { dateTime: Date })[]> = {};
        appointments.forEach(app => {
            const dateString = app.dateTime.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
            if (!grouped[dateString]) {
                grouped[dateString] = [];
            }
            grouped[dateString].push(app);
        });
        return grouped;
    };
    
    const displayUpcoming = useMemo(() => {
        let filtered = [...myUpcomingAppointments];
        
        if (upcomingFilterService !== 'all') {
            filtered = filtered.filter(app => app.serviceId === upcomingFilterService);
        }
        
        filtered = filterByTime(filtered, upcomingFilterTime);

        filtered.sort((a, b) => upcomingSort === 'date-asc' ? a.dateTime.getTime() - b.dateTime.getTime() : b.dateTime.getTime() - a.dateTime.getTime());
        
        return filtered;
    }, [myUpcomingAppointments, upcomingSort, upcomingFilterService, upcomingFilterTime]);
    
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

    const uniqueServiceIds = useMemo(() => [...new Set(myUpcomingAppointments.map(a => a.serviceId).concat(myHistoryAppointments.map(a => a.serviceId)))], [myUpcomingAppointments, myHistoryAppointments]);
    const serviceFilterOptions = allServices.filter(s => uniqueServiceIds.includes(s.id));
    
    // Filter treatment courses by status
    const displayCourses = useMemo(() => {
        return filterCoursesByStatus(myTreatmentCourses, coursesFilterStatus);
    }, [myTreatmentCourses, coursesFilterStatus]);

    // --- Render Functions for Cards ---

    const UpcomingAppointmentCard: React.FC<{ appointment: Appointment & { dateTime: Date } }> = ({ appointment }) => {
        // Determine status badge based on appointment status
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
                    <button onClick={() => setViewingAppointment(appointment)} className="px-4 py-2 text-sm font-semibold bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">Xem Chi Tiết</button>
                    {appointment.status !== 'pending' && (
                        <button onClick={() => setAppointmentToCancel(appointment)} className="px-4 py-2 text-sm font-semibold bg-red-50 text-red-700 rounded-md hover:bg-red-100">Hủy lịch</button>
                    )}
                </div>
            </div>
        );
    };

    const HistoryAppointmentCard: React.FC<{ appointment: Appointment & { dateTime: Date } }> = ({ appointment }) => (
        <div className="bg-white p-5 rounded-lg shadow-soft-lg border border-gray-100 flex justify-between items-center">
            <div>
                <p className="text-sm font-semibold text-brand-dark">{appointment.dateTime.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} - {appointment.time}</p>
                <h4 className="text-xl font-bold font-serif text-brand-text mt-1">{appointment.serviceName}</h4>
                <p className="text-xs text-gray-500 mt-1">Kỹ thuật viên: {appointment.therapist || 'Không có'}</p>
            </div>
            <div className="flex flex-col items-end gap-3">
                <span className={`px-3 py-1 text-xs font-bold rounded-full ${appointment.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {appointment.status === 'completed' ? 'Hoàn thành' : 'Đã hủy'}
                </span>
                <div className="flex items-center gap-3">
                    <button onClick={() => setViewingAppointment(appointment)} className="px-4 py-2 text-sm font-semibold bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">Xem Chi Tiết</button>
                    {appointment.status === 'completed' && (
                        <>
                            <button onClick={() => navigate(`/service/${appointment.serviceId}`)} className="text-sm font-semibold text-green-600 hover:underline">Đánh giá</button>
                            <button onClick={() => navigate(`/booking?serviceId=${appointment.serviceId}`)} className="px-4 py-2 text-sm font-semibold bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">Đặt lại</button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
    
    const TreatmentCourseCard: React.FC<{ course: TreatmentCourse }> = ({ course }) => {
        const sessions = course.sessions || [];
        const completedSessions = sessions.filter(s => s.status === 'completed').length;
        const progress = course.totalSessions > 0 ? (completedSessions / course.totalSessions) * 100 : 0;
        const firstService = course.services && course.services.length > 0 ? course.services[0] : null;
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
        
        // Get admin notes from current session or previous session
        const adminNotes = currentSession?.adminNotes || previousSession?.adminNotes;
        const customerStatusNotes = currentSession?.customerStatusNotes || previousSession?.customerStatusNotes;
        
        return (
            <div 
                className={`bg-white p-6 rounded-lg shadow-lg border-2 transition-all hover:shadow-xl ${
                    isCompleted 
                        ? 'border-green-400 bg-green-50' 
                        : 'border-brand-primary hover:border-brand-dark'
                }`}
            >
                <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                        <h4 className="text-xl font-bold font-serif text-brand-text mb-2">{course.serviceName || course.name}</h4>
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
                        
                        {/* Current Session Info */}
                        {!isCompleted && currentSession && (
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-lg font-bold text-purple-800">📌 Buổi hiện tại: Buổi {currentSession.sessionNumber}</span>
                                </div>
                                {currentSession.sessionDate && (
                                    <p className="text-sm text-gray-700 mb-1">
                                        <strong>Ngày:</strong> {new Date(currentSession.sessionDate).toLocaleDateString('vi-VN')}
                                        {currentSession.sessionTime && ` - ${currentSession.sessionTime}`}
                                    </p>
                                )}
                                {currentSession.staffId && (
                                    <p className="text-sm text-gray-700">
                                        <strong>Kỹ thuật viên:</strong> Đã được phân công
                                    </p>
                                )}
                            </div>
                        )}
                        
                        {/* Admin Notes Section - Only show customer status notes to client */}
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
                    <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded-lg">
                        <p className="text-green-800 font-semibold text-center">
                            🎉 Chúc mừng! Bạn đã hoàn thành liệu trình!
                        </p>
                    </div>
                )}
            </div>
        );
    };

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
                            <div className="bg-white p-4 rounded-lg shadow-md grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                <select value={upcomingSort} onChange={e => setUpcomingSort(e.target.value)} className="w-full p-2 border rounded-md bg-white">
                                    <option value="date-asc">Sắp xếp theo: Ngày hẹn (Gần nhất)</option>
                                    <option value="date-desc">Sắp xếp theo: Ngày hẹn (Xa nhất)</option>
                                </select>
                                <select value={upcomingFilterService} onChange={e => setUpcomingFilterService(e.target.value)} className="w-full p-2 border rounded-md bg-white">
                                    <option value="all">Lọc theo dịch vụ</option>
                                    {serviceFilterOptions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                                <div className="flex items-center justify-center gap-2">
                                    {['all', 'today', 'this-week', 'this-month'].map(filter => {
                                        const labels: Record<string, string> = {all: 'Tất cả', today: 'Hôm nay', 'this-week': 'Tuần này', 'this-month': 'Tháng này'};
                                        return <button key={filter} onClick={() => setUpcomingFilterTime(filter)} className={`px-3 py-1.5 text-sm font-semibold rounded-full ${upcomingFilterTime === filter ? 'bg-brand-primary text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>{labels[filter]}</button>
                                    })}
                                </div>
                            </div>
                            
                            {reminders.length > 0 && (
                                <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 p-4 rounded-md flex gap-3">
                                    <BellIcon className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1"/>
                                    <div>
                                        <h4 className="font-bold">Nhắc nhở lịch hẹn!</h4>
                                        <p className="text-sm">Bạn có lịch hẹn sau đây trong vòng 24 giờ tới:</p>
                                        <ul className="list-disc list-inside text-sm mt-1">
                                            {reminders.map(app => <li key={app.id}><strong>{app.serviceName}</strong> lúc {app.time} ngày {app.dateTime.toLocaleDateString('vi-VN')}</li>)}
                                        </ul>
                                    </div>
                                </div>
                            )}

                            {isLoadingAppointments ? (
                                <div className="text-center py-10">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
                                    <p className="text-gray-500">Đang tải lịch hẹn...</p>
                                </div>
                            ) : displayUpcoming.length > 0 ? (
                                Object.entries(groupAppointmentsByDate(displayUpcoming)).map(([dateString, appointments]) => (
                                    <div key={dateString}>
                                        {/* Date header */}
                                        <div 
                                            className="bg-gradient-to-r from-brand-secondary to-amber-50 p-4 rounded-lg flex items-center justify-between mb-3"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl font-bold text-brand-primary">{dateString.split(',')[0].split(' ')[1]}</span>
                                                <div>
                                                    <p className="font-semibold text-gray-800">{dateString}</p>
                                                    <p className="text-sm text-gray-600">{appointments.length} lịch hẹn</p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* All appointments displayed */}
                                        <div className="space-y-3 ml-4 mb-6">
                                            {appointments.map(app => (
                                                <UpcomingAppointmentCard key={app.id} appointment={app} />
                                            ))}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-gray-500 py-10">Không có lịch hẹn sắp tới.</p>
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
                                        const labels: Record<string, string> = {all: 'Tất cả', completed: 'Hoàn thành', cancelled: 'Đã hủy'};
                                        return <button key={filter} onClick={() => setHistoryFilterStatus(filter)} className={`px-3 py-1.5 text-sm font-semibold rounded-full ${historyFilterStatus === filter ? 'bg-brand-primary text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>{labels[filter]}</button>
                                    })}
                                </div>
                                <div className="flex items-center justify-center gap-2">
                                    {['all', 'today', 'this-week', 'this-month'].map(filter => {
                                        const labels: Record<string, string> = {all: 'Tất cả', today: 'Hôm nay', 'this-week': 'Tuần này', 'this-month': 'Tháng này'};
                                        return <button key={filter} onClick={() => setHistoryFilterTime(filter)} className={`px-3 py-1.5 text-sm font-semibold rounded-full ${historyFilterTime === filter ? 'bg-brand-primary text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>{labels[filter]}</button>
                                    })}
                                </div>
                            </div>

                            {displayHistory.length > 0 ? (
                                displayHistory.map(app => <HistoryAppointmentCard key={app.id} appointment={app} />)
                            ) : (
                                <p className="text-center text-gray-500 py-10">Không có lịch sử hẹn nào.</p>
                            )}
                        </div>
                    )}
                    
                    {activeTab === 'courses' && (
                        <div className="space-y-6">
                            {/* Status Tabs */}
                            <div className="bg-white p-4 rounded-lg shadow-md flex items-center justify-center gap-2 border-b-2 border-gray-200">
                                <button 
                                    onClick={() => setCoursesFilterStatus('active')} 
                                    className={`px-6 py-3 text-base font-semibold rounded-lg transition-colors ${
                                        coursesFilterStatus === 'active' 
                                            ? 'bg-brand-primary text-white border-2 border-brand-primary' 
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
                                    }`}
                                >
                                    Liệu trình đang thực hiện
                                </button>
                                <button 
                                    onClick={() => setCoursesFilterStatus('completed')} 
                                    className={`px-6 py-3 text-base font-semibold rounded-lg transition-colors ${
                                        coursesFilterStatus === 'completed' 
                                            ? 'bg-brand-primary text-white border-2 border-brand-primary' 
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
                                    }`}
                                >
                                    Liệu trình đã xong
                                </button>
                            </div>
                            
                            {displayCourses.length > 0 ? (
                                displayCourses.map(course => <TreatmentCourseCard key={course.id} course={course} />)
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
                        <div className="space-y-5 text-sm sm:text-base">
                            <div className="pb-3 border-b">
                                <p className="text-sm text-gray-500">Dịch vụ</p>
                                <p className="text-lg font-bold text-brand-primary">{viewingAppointment.serviceName}</p>
                            </div>
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
                                    <p className="font-semibold text-gray-800">{viewingAppointment.therapist || 'Chưa phân công'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Trạng thái thanh toán</p>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                        viewingAppointment.status === 'cancelled'
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
                        </div>
                        <div className="mt-6 text-right">
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
                        <p className="text-md text-brand-text mb-6">
                            Bạn có chắc chắn muốn hủy lịch hẹn cho dịch vụ <br/>
                            <strong className="text-brand-primary">{appointmentToCancel.serviceName}</strong> <br/>
                            vào lúc {appointmentToCancel.time} ngày {appointmentToCancel.dateTime.toLocaleDateString('vi-VN')}?
                        </p>
                        <div className="flex justify-center gap-4">
                            <button onClick={() => setAppointmentToCancel(null)} className="bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-lg hover:bg-gray-300">
                                Không
                            </button>
                            <button onClick={handleCancelAppointment} className="bg-red-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-red-700">
                                Xác nhận Hủy
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};