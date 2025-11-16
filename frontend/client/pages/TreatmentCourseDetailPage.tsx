import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { TreatmentCourse, User, Service, StaffShift } from '../../types';
import * as apiService from '../services/apiService';

interface TreatmentCourseDetailPageProps {
    currentUser: User;
    allServices: Service[];
}

export const TreatmentCourseDetailPage: React.FC<TreatmentCourseDetailPageProps> = ({ currentUser, allServices }) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [course, setCourse] = useState<TreatmentCourse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [schedulingSessionId, setSchedulingSessionId] = useState<string | null>(null);
    const [staffList, setStaffList] = useState<User[]>([]);
    const [staffShifts, setStaffShifts] = useState<StaffShift[]>([]);
    const [scheduleForm, setScheduleForm] = useState({
        date: '',
        time: '',
        serviceId: '',
        staffId: '',
        notes: ''
    });

    // Set ngày mặc định khi mở form đặt lịch
    useEffect(() => {
        if (schedulingSessionId && !scheduleForm.date) {
            const today = new Date();
            const formattedDate = today.toISOString().split('T')[0];
            setScheduleForm(prev => ({ ...prev, date: formattedDate }));
        }
    }, [schedulingSessionId]);

    // Load staff và shifts
    useEffect(() => {
        const loadStaffData = async () => {
            try {
                const [usersData, shiftsData] = await Promise.all([
                    apiService.getUsers(),
                    apiService.getAllStaffShifts()
                ]);
                setStaffList(usersData.filter(u => u.role === 'Staff'));
                setStaffShifts(shiftsData);
            } catch (err) {
                console.error('Failed to load staff data:', err);
            }
        };
        loadStaffData();
    }, []);

    useEffect(() => {
        const fetchCourse = async () => {
            if (!id) return;
            try {
                setIsLoading(true);
                const courseData = await apiService.getTreatmentCourseById(id);
                
                // Verify this course belongs to current user
                if (courseData.clientId !== currentUser.id) {
                    setError('Bạn không có quyền xem liệu trình này');
                    return;
                }
                
                setCourse(courseData);
            } catch (err: any) {
                console.error('Failed to fetch treatment course:', err);
                setError(err.message || 'Không thể tải thông tin liệu trình');
            } finally {
                setIsLoading(false);
            }
        };

        fetchCourse();
    }, [id, currentUser.id]);

    const handleScheduleSession = async (sessionId: string) => {
        if (!course || !scheduleForm.date || !scheduleForm.time || !scheduleForm.serviceId) {
            alert('Vui lòng điền đầy đủ thông tin đặt lịch');
            return;
        }

        try {
            await apiService.scheduleSessionInCourse(course.id, sessionId, {
                appointmentDate: scheduleForm.date,
                appointmentTime: scheduleForm.time,
                serviceId: scheduleForm.serviceId,
                staffId: scheduleForm.staffId || undefined,
                notes: scheduleForm.notes
            });

            alert('Đặt lịch thành công!');
            
            // Refresh course data
            const updatedCourse = await apiService.getTreatmentCourseById(course.id);
            setCourse(updatedCourse);
            
            // Reset form
            setSchedulingSessionId(null);
            setScheduleForm({ date: '', time: '', serviceId: '', staffId: '', notes: '' });
        } catch (error: any) {
            console.error('Failed to schedule session:', error);
            alert(error.message || 'Không thể đặt lịch. Vui lòng thử lại.');
        }
    };

    const handlePayment = async () => {
        if (!course) return;
        
        try {
            // Navigate to payment page with course info
            navigate(`/payment?courseId=${course.id}&amount=${course.price}`);
        } catch (error) {
            console.error('Payment initiation failed:', error);
            alert('Không thể khởi tạo thanh toán');
        }
    };

    if (isLoading) {
        return (
            <div className="bg-brand-secondary min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
            </div>
        );
    }

    if (error || !course) {
        return (
            <div className="bg-brand-secondary min-h-screen">
                <div className="container mx-auto px-4 py-12">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                        <p className="text-red-600 font-semibold">{error || 'Không tìm thấy liệu trình'}</p>
                        <button 
                            onClick={() => navigate('/appointments')} 
                            className="mt-4 px-6 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-dark"
                        >
                            Quay lại
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const completedSessions = course.sessions?.filter(s => s.status === 'completed').length || 0;
    const totalSessions = course.totalSessions || 0;
    const progressPercentage = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;
    const isAllCompleted = completedSessions === totalSessions && totalSessions > 0;

    return (
        <div className="bg-brand-secondary min-h-screen">
            <div className="container mx-auto px-4 py-12">
                {/* Header */}
                <div className="mb-8">
                    <button 
                        onClick={() => navigate('/appointments')} 
                        className="text-brand-dark hover:text-brand-primary mb-4 flex items-center gap-2"
                    >
                        ← Quay lại
                    </button>
                    <h1 className="text-3xl sm:text-4xl font-serif font-bold text-brand-text">{course.name}</h1>
                    <p className="text-gray-600 mt-2">Chuyên viên tư vấn: {course.consultantName || 'Chưa phân công'}</p>
                </div>

                {/* Progress Section */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-brand-dark">Tiến độ hoàn thành</h2>
                        <span className="text-3xl font-bold text-brand-primary">{progressPercentage}%</span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-4 mb-3">
                        <div 
                            className="bg-gradient-to-r from-brand-primary to-amber-500 h-4 rounded-full transition-all duration-500" 
                            style={{ width: `${progressPercentage}%` }}
                        ></div>
                    </div>
                    
                    <div className="flex justify-between text-sm text-gray-600">
                        <span>Đã hoàn thành: <strong className="text-brand-dark">{completedSessions}/{totalSessions}</strong> buổi</span>
                        <span>Còn lại: <strong className="text-brand-dark">{totalSessions - completedSessions}</strong> buổi</span>
                    </div>

                    {isAllCompleted && (
                        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-green-800 font-semibold mb-3">
                                🎉 Chúc mừng! Bạn đã hoàn thành toàn bộ liệu trình!
                            </p>
                            <button
                                onClick={handlePayment}
                                className="w-full px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                            >
                                💳 Thanh toán ngay
                            </button>
                        </div>
                    )}
                </div>

                {/* Sessions List */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-2xl font-bold text-brand-dark mb-6">Chi tiết các buổi</h2>
                    
                    <div className="space-y-4">
                        {course.sessions && course.sessions.length > 0 ? (
                            course.sessions.map((session, index) => {
                                const isCompleted = session.status === 'completed';
                                const isScheduled = session.status === 'scheduled';
                                const isPending = session.status === 'pending';
                                const sessionDate = session.completedDate || session.scheduledDate;
                                const isScheduling = schedulingSessionId === session.id;
                                
                                return (
                                    <div 
                                        key={session.id || index}
                                        className={`border rounded-lg p-5 transition-all ${
                                            isCompleted 
                                                ? 'bg-green-50 border-green-300' 
                                                : isScheduled
                                                ? 'bg-blue-50 border-blue-300'
                                                : 'bg-gray-50 border-gray-200'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                                                        isCompleted 
                                                            ? 'bg-green-500 text-white' 
                                                            : isScheduled
                                                            ? 'bg-blue-500 text-white'
                                                            : 'bg-gray-300 text-gray-600'
                                                    }`}>
                                                        {index + 1}
                                                    </span>
                                                    <h3 className="text-lg font-bold text-brand-text">
                                                        Buổi {index + 1}: {session.serviceName || 'Chưa đặt lịch'}
                                                    </h3>
                                                </div>
                                                
                                                {isCompleted && session.treatmentNotes && (
                                                    <div className="ml-11 mt-3 p-3 bg-white rounded-md border border-green-200">
                                                        <p className="text-sm font-semibold text-brand-dark mb-1">Ghi chú trị liệu:</p>
                                                        <p className="text-sm text-gray-700">{session.treatmentNotes}</p>
                                                    </div>
                                                )}
                                                
                                                {isCompleted && session.nextSessionAdvice && (
                                                    <div className="ml-11 mt-2 p-3 bg-blue-50 rounded-md border border-blue-200">
                                                        <p className="text-sm font-semibold text-blue-800 mb-1">💡 Tư vấn cho buổi tiếp theo:</p>
                                                        <p className="text-sm text-blue-700">{session.nextSessionAdvice}</p>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="ml-4">
                                                {isCompleted ? (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                                                        ✓ Hoàn thành
                                                    </span>
                                                ) : isScheduled ? (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                                        📅 Đã đặt lịch
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800">
                                                        ⏳ Chờ đặt lịch
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Schedule Button/Form for Pending Sessions */}
                                        {isPending && (
                                            <div className="ml-11 mt-4">
                                                {!isScheduling ? (
                                                    <button
                                                        onClick={() => setSchedulingSessionId(session.id)}
                                                        className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-dark transition-colors"
                                                    >
                                                        📅 Đặt lịch buổi này
                                                    </button>
                                                ) : (
                                                    <div className="bg-white border border-gray-300 rounded-lg p-4">
                                                        <h4 className="font-semibold text-brand-dark mb-3">Đặt lịch buổi {index + 1}</h4>
                                                        
                                                        <div className="space-y-3">
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                    📅 Ngày đặt lịch *
                                                                </label>
                                                                <input
                                                                    type="date"
                                                                    value={scheduleForm.date}
                                                                    onChange={(e) => setScheduleForm({...scheduleForm, date: e.target.value})}
                                                                    min={new Date().toISOString().split('T')[0]}
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                                                    required
                                                                />
                                                                <p className="text-xs text-gray-500 mt-1">Bạn có thể chọn bất kỳ ngày nào từ hôm nay trở đi</p>
                                                            </div>
                                                            
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                    Giờ hẹn *
                                                                </label>
                                                                <select
                                                                    value={scheduleForm.time}
                                                                    onChange={(e) => setScheduleForm({...scheduleForm, time: e.target.value})}
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                                                >
                                                                    <option value="">Chọn giờ</option>
                                                                    {['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'].map(time => (
                                                                        <option key={time} value={time}>{time}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                            
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                    Dịch vụ *
                                                                </label>
                                                                <select
                                                                    value={scheduleForm.serviceId}
                                                                    onChange={(e) => setScheduleForm({...scheduleForm, serviceId: e.target.value})}
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                                                >
                                                                    <option value="">Chọn dịch vụ</option>
                                                                    {course.services?.filter(svc => {
                                                                        // Lọc bỏ các dịch vụ đã được hoàn thành trong liệu trình
                                                                        const completedServiceIds = course.sessions
                                                                            ?.filter(s => s.status === 'completed')
                                                                            .map(s => s.serviceId) || [];
                                                                        return !completedServiceIds.includes(svc.serviceId);
                                                                    }).map(svc => (
                                                                        <option key={svc.serviceId} value={svc.serviceId}>
                                                                            {svc.serviceName}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                                <p className="text-xs text-gray-500 mt-1">
                                                                    Chỉ hiển thị dịch vụ chưa hoàn thành
                                                                </p>
                                                            </div>
                                                            
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                    👨‍⚕️ Chọn nhân viên (tùy chọn)
                                                                </label>
                                                                <select
                                                                    value={scheduleForm.staffId}
                                                                    onChange={(e) => setScheduleForm({...scheduleForm, staffId: e.target.value})}
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                                                >
                                                                    <option value="">Chọn nhân viên (nếu muốn)</option>
                                                                    {staffList
                                                                        .filter(staff => {
                                                                            // Chỉ hiển thị nhân viên có ca làm việc trong ngày đã chọn
                                                                            if (!scheduleForm.date) return true;
                                                                            return staffShifts.some(shift =>
                                                                                shift.staffId === staff.id &&
                                                                                shift.date === scheduleForm.date &&
                                                                                shift.status === 'approved' &&
                                                                                shift.shiftType !== 'leave'
                                                                            );
                                                                        })
                                                                        .map(staff => (
                                                                            <option key={staff.id} value={staff.id}>
                                                                                {staff.name}
                                                                            </option>
                                                                        ))
                                                                    }
                                                                </select>
                                                                <p className="text-xs text-gray-500 mt-1">
                                                                    Chọn ngày trước để xem nhân viên có lịch
                                                                </p>
                                                            </div>
                                                            
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                    Ghi chú
                                                                </label>
                                                                <textarea
                                                                    value={scheduleForm.notes}
                                                                    onChange={(e) => setScheduleForm({...scheduleForm, notes: e.target.value})}
                                                                    rows={2}
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                                                    placeholder="Ghi chú thêm (nếu có)..."
                                                                />
                                                            </div>
                                                            
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => handleScheduleSession(session.id)}
                                                                    className="flex-1 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-dark transition-colors"
                                                                >
                                                                    Xác nhận đặt lịch
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setSchedulingSessionId(null);
                                                                        setScheduleForm({ date: '', time: '', serviceId: '', staffId: '', notes: '' });
                                                                    }}
                                                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                                                >
                                                                    Hủy
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-center text-gray-500 py-8">Chưa có thông tin buổi điều trị</p>
                        )}
                    </div>
                </div>

                {/* Treatment History (if available) */}
                {course.treatmentHistory && course.treatmentHistory.length > 0 && (
                    <div className="bg-white rounded-lg shadow-md p-6 mt-6">
                        <h2 className="text-2xl font-bold text-brand-dark mb-6">Lịch sử trị liệu</h2>
                        <div className="space-y-4">
                            {course.treatmentHistory.map((record: any, index: number) => (
                                <div key={index} className="border-l-4 border-brand-primary pl-4 py-2">
                                    <p className="font-semibold text-brand-dark">
                                        Buổi {record.sessionNumber} - {new Date(record.date).toLocaleDateString('vi-VN')}
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1">{record.notes}</p>
                                    {record.skinCondition && (
                                        <p className="text-sm text-gray-600 mt-1">
                                            <span className="font-semibold">Tình trạng da:</span> {record.skinCondition}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TreatmentCourseDetailPage;
