import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import type { TreatmentCourse, User } from '../../types';
import { StarIcon, ClockIcon } from '../../shared/icons';
import * as apiService from '../services/apiService';

interface TreatmentCourseDetailPageProps {
    currentUser: User | null;
    allTreatmentCourses?: TreatmentCourse[];
}

const TreatmentCourseDetailPage: React.FC<TreatmentCourseDetailPageProps> = ({ currentUser, allTreatmentCourses = [] }) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    
    const [treatmentCourse, setTreatmentCourse] = useState<TreatmentCourse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) {
                setError("Treatment course ID is missing.");
                setIsLoading(false);
                return;
            }
            try {
                setIsLoading(true);
                setError(null);
                
                // First, try to find in allTreatmentCourses
                let course = allTreatmentCourses.find(c => c.id === id);
                
                // If not found, fetch from API
                if (!course) {
                    course = await apiService.getTreatmentCourseById(id);
                }
                
                setTreatmentCourse(course);

            } catch (err: any) {
                console.error("Failed to fetch treatment course detail data:", err);
                setTreatmentCourse(null);
                setError(err.message || "Không thể tải chi tiết liệu trình.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [id, allTreatmentCourses]);

    const formatWeekDays = (weekDays: number[] | null | undefined) => {
        if (!weekDays || weekDays.length === 0) return 'Chưa xác định';
        const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
        return weekDays.map(day => dayNames[day] || `Thứ ${day + 1}`).join(', ');
    };

    const formatSessions = (sessions: any[] | null | undefined) => {
        if (!sessions || sessions.length === 0) return [];
        return sessions;
    };

    const handleBookNow = () => {
        if (!currentUser) {
            navigate('/login');
            return;
        }
        navigate(`/booking?treatmentCourseId=${treatmentCourse?.id}`);
    };

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-12">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
                        <p className="text-gray-600">Đang tải chi tiết liệu trình...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !treatmentCourse) {
        return (
            <div className="container mx-auto px-4 py-12">
                <div className="text-center py-16 bg-white rounded-lg shadow-md">
                    <p className="text-lg text-red-500 mb-4">{error || "Không tìm thấy liệu trình."}</p>
                    <Link to="/treatment-courses" className="text-brand-primary hover:underline">
                        ← Quay lại danh sách liệu trình
                    </Link>
                </div>
            </div>
        );
    }

    const imageUrl = treatmentCourse.imageUrl || `https://picsum.photos/seed/${treatmentCourse.id}/800/400`;
    const sessions = formatSessions(treatmentCourse.sessions);

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="mb-6">
                <Link to="/treatment-courses" className="text-brand-primary hover:underline flex items-center gap-2">
                    ← Quay lại danh sách liệu trình
                </Link>
            </div>

            <div className="bg-white rounded-lg shadow-soft-lg overflow-hidden">
                {/* Hero Image */}
                <div className="relative h-96 overflow-hidden">
                    <img 
                        src={imageUrl} 
                        alt={treatmentCourse.serviceName} 
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 left-4">
                        <span className="bg-green-500 text-white text-sm font-bold px-4 py-2 rounded-full shadow-md">
                            LIỆU TRÌNH
                        </span>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8">
                    <h1 className="text-4xl font-serif font-bold text-brand-text mb-4">
                        {treatmentCourse.serviceName}
                    </h1>

                    {treatmentCourse.description && (
                        <p className="text-lg text-gray-700 mb-8 leading-relaxed">
                            {treatmentCourse.description}
                        </p>
                    )}

                    {/* Course Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-brand-secondary p-4 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <ClockIcon className="w-5 h-5 text-brand-primary" />
                                <h3 className="font-semibold text-brand-text">Tổng số buổi</h3>
                            </div>
                            <p className="text-2xl font-bold text-brand-primary">
                                {treatmentCourse.totalSessions} buổi
                            </p>
                        </div>

                        <div className="bg-brand-secondary p-4 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <ClockIcon className="w-5 h-5 text-brand-primary" />
                                <h3 className="font-semibold text-brand-text">Tần suất</h3>
                            </div>
                            <p className="text-2xl font-bold text-brand-primary">
                                {treatmentCourse.sessionsPerWeek} buổi/tuần
                            </p>
                        </div>

                        <div className="bg-brand-secondary p-4 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <ClockIcon className="w-5 h-5 text-brand-primary" />
                                <h3 className="font-semibold text-brand-text">Thời gian/buổi</h3>
                            </div>
                            <p className="text-2xl font-bold text-brand-primary">
                                {treatmentCourse.sessionDuration} phút
                            </p>
                        </div>

                        <div className="bg-brand-secondary p-4 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <StarIcon className="w-5 h-5 text-brand-primary" />
                                <h3 className="font-semibold text-brand-text">Trạng thái</h3>
                            </div>
                            <p className="text-lg font-semibold text-green-600 capitalize">
                                {treatmentCourse.status === 'active' ? 'Đang hoạt động' : 
                                 treatmentCourse.status === 'completed' ? 'Đã hoàn thành' : 
                                 treatmentCourse.status === 'paused' ? 'Tạm dừng' : treatmentCourse.status}
                            </p>
                        </div>
                    </div>

                    {/* Additional Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        {treatmentCourse.weekDays && treatmentCourse.weekDays.length > 0 && (
                            <div>
                                <h3 className="font-semibold text-brand-text mb-2">Các ngày trong tuần</h3>
                                <p className="text-gray-700">{formatWeekDays(treatmentCourse.weekDays)}</p>
                            </div>
                        )}

                        {treatmentCourse.sessionTime && (
                            <div>
                                <h3 className="font-semibold text-brand-text mb-2">Giờ cố định</h3>
                                <p className="text-gray-700">{treatmentCourse.sessionTime}</p>
                            </div>
                        )}

                        {treatmentCourse.expiryDate && (
                            <div>
                                <h3 className="font-semibold text-brand-text mb-2">Hạn sử dụng</h3>
                                <p className="text-gray-700">
                                    {new Date(treatmentCourse.expiryDate).toLocaleDateString('vi-VN')}
                                </p>
                            </div>
                        )}

                        {treatmentCourse.nextAppointmentDate && (
                            <div>
                                <h3 className="font-semibold text-brand-text mb-2">Lịch hẹn tiếp theo</h3>
                                <p className="text-gray-700">
                                    {new Date(treatmentCourse.nextAppointmentDate).toLocaleDateString('vi-VN')}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Sessions Progress (if any) */}
                    {sessions.length > 0 && (
                        <div className="mb-8">
                            <h3 className="font-semibold text-brand-text mb-4">Tiến trình điều trị</h3>
                            <div className="space-y-3">
                                {sessions.map((session: any, index: number) => (
                                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="font-semibold">Buổi {index + 1}</p>
                                                <p className="text-sm text-gray-600">
                                                    {session.date ? new Date(session.date).toLocaleDateString('vi-VN') : 'Chưa xác định'}
                                                </p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                                session.status === 'completed' 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : session.status === 'in-progress'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-gray-100 text-gray-800'
                                            }`}>
                                                {session.status === 'completed' ? 'Đã hoàn thành' : 
                                                 session.status === 'in-progress' ? 'Đang thực hiện' : 'Chưa thực hiện'}
                                            </span>
                                        </div>
                                        {session.notes && (
                                            <p className="text-sm text-gray-600 mt-2">{session.notes}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 mt-8">
                        {currentUser ? (
                            <button
                                onClick={handleBookNow}
                                className="flex-1 bg-brand-dark text-white font-semibold py-3 px-6 rounded-lg hover:bg-brand-primary transition-colors duration-300 text-center"
                            >
                                Đặt lịch ngay
                            </button>
                        ) : (
                            <Link
                                to="/login"
                                className="flex-1 bg-brand-dark text-white font-semibold py-3 px-6 rounded-lg hover:bg-brand-primary transition-colors duration-300 text-center"
                            >
                                Đăng nhập để đặt lịch
                            </Link>
                        )}
                        <Link
                            to="/treatment-courses"
                            className="flex-1 bg-brand-secondary text-brand-text font-semibold py-3 px-6 rounded-lg hover:bg-brand-primary hover:text-white transition-colors duration-300 text-center"
                        >
                            Xem thêm liệu trình khác
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TreatmentCourseDetailPage;

