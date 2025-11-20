import React, { useState, useMemo, useEffect } from 'react';
import type { User, StaffShift, Appointment } from '../../types';
import { ChevronLeftIcon, ChevronRightIcon, CheckCircleIcon, XCircleIcon, PendingIcon, CalendarIcon, ClockIcon, UserGroupIcon } from '../../shared/icons';
import DayDetailsModal from '../components/DayDetailsModal';
import * as apiService from '../../client/services/apiService';

interface StaffSchedulePageProps {
    currentUser: User;
}

const formatDate = (date: Date) => date.toISOString().split('T')[0];

const StaffSchedulePage: React.FC<StaffSchedulePageProps> = ({ currentUser }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [myShifts, setMyShifts] = useState<StaffShift[]>([]);
    const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDayModalOpen, setIsDayModalOpen] = useState(false);
    const [selectedDayInfo, setSelectedDayInfo] = useState<{
        dateString: string;
        dayOfMonth: number;
        shifts: StaffShift[];
        appointments: Appointment[];
    } | null>(null);
    const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
    const [filterStatus, setFilterStatus] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [allUsers, setAllUsers] = useState<User[]>([]);

    useEffect(() => {
        const fetchMyData = async () => {
            setIsLoading(true);
            try {
                const [shifts, appointments, users] = await Promise.all([
                    apiService.getStaffShifts(currentUser.id),
                    apiService.getUserAppointments(currentUser.id),
                    apiService.getUsers()
                ]);
                setMyShifts(shifts);
                setAllUsers(users);
                // Filter appointments where this staff is the therapist
                setMyAppointments(appointments.filter(apt => apt.therapistId === currentUser.id));
            } catch (e) {
                console.error("Failed to fetch data", e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchMyData();
        
        // Set up polling every 30 seconds to auto-update appointments
        const interval = setInterval(() => {
            fetchMyData();
        }, 30000);
        
        // Listen for refresh events
        const handleRefresh = () => {
            fetchMyData();
        };
        window.addEventListener('refresh-appointments', handleRefresh);
        window.addEventListener('appointments-updated', handleRefresh);
        
        return () => {
            clearInterval(interval);
            window.removeEventListener('refresh-appointments', handleRefresh);
            window.removeEventListener('appointments-updated', handleRefresh);
        };
    }, [currentUser.id]);

    const daysInMonth = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const numDays = new Date(year, month + 1, 0).getDate();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const days = [];
        for (let i = 0; i < (firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1); i++) {
            days.push(null);
        }
        for (let i = 1; i <= numDays; i++) {
            days.push(i);
        }
        return days;
    }, [currentMonth]);

    const handlePrevMonth = () => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    const handleNextMonth = () => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));

    const handleDayClick = (day: number) => {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        const dateString = formatDate(date);
        const shiftsOnDay = myShifts.filter(shift => shift.date === dateString);
        const appointmentsOnDay = myAppointments.filter(apt => apt.date === dateString);
        setSelectedDayInfo({ 
            dateString, 
            dayOfMonth: day, 
            shifts: shiftsOnDay,
            appointments: appointmentsOnDay
        });
        setIsDayModalOpen(true);
    };

    const handleCloseDayModal = () => {
        setIsDayModalOpen(false);
        setSelectedDayInfo(null);
    };
    
    const handleSaveShiftRequest = async (newShift: StaffShift) => {
        try {
            const createdShift = await apiService.createStaffShift(newShift);
            setMyShifts(prev => [...prev, createdShift]);
        } catch (e) { console.error(e); alert("Gửi yêu cầu thất bại."); }
        handleCloseDayModal();
    };

    const handleUpdateShiftRequest = async (updatedShift: StaffShift) => {
        try {
            const savedShift = await apiService.updateStaffShift(updatedShift.id, updatedShift);
            setMyShifts(prev => prev.map(s => (s.id === savedShift.id ? savedShift : s)));
        } catch (e) { console.error(e); alert("Cập nhật thất bại."); }
        handleCloseDayModal();
    };

    const handleDeleteShiftRequest = async (shiftId: string) => {
        try {
            await apiService.deleteStaffShift(shiftId);
            setMyShifts(prev => prev.filter(s => s.id !== shiftId));
        } catch (e) { console.error(e); alert("Xóa thất bại."); }
        handleCloseDayModal();
    };
    
    // Statistics
    const statistics = useMemo(() => {
        const filtered = filterStatus === 'all' ? myShifts : myShifts.filter(s => s.status === filterStatus);
        return {
            totalShifts: filtered.length,
            approvedShifts: filtered.filter(s => s.status === 'approved').length,
            pendingShifts: filtered.filter(s => s.status === 'pending').length,
            rejectedShifts: filtered.filter(s => s.status === 'rejected').length,
            totalAppointments: myAppointments.length,
            upcomingAppointments: myAppointments.filter(a => a.status === 'upcoming').length,
            completedAppointments: myAppointments.filter(a => a.status === 'completed').length,
        };
    }, [myShifts, myAppointments, filterStatus]);

    const filteredShifts = useMemo(() => {
        if (filterStatus === 'all') return myShifts;
        return myShifts.filter(s => s.status === filterStatus);
    }, [myShifts, filterStatus]);
    
    const getShiftStatusBadge = (status: StaffShift['status']) => {
        switch (status) {
            case 'approved': return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800 flex items-center gap-1"><CheckCircleIcon className="w-3 h-3" /> Duyệt</span>;
            case 'pending': return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 flex items-center gap-1"><PendingIcon className="w-3 h-3" /> Chờ</span>;
            case 'rejected': return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800 flex items-center gap-1"><XCircleIcon className="w-3 h-3" /> Từ chối</span>;
            default: return null;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Lịch làm việc của tôi</h1>
                <p className="text-gray-600 mt-2">Xem lịch làm việc, cuộc hẹn và quản lý ca làm việc của bạn</p>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-sm border border-blue-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-blue-600">Tổng ca làm</p>
                            <p className="text-3xl font-bold text-blue-900 mt-2">{statistics.totalShifts}</p>
                        </div>
                        <CalendarIcon className="w-12 h-12 text-blue-400 opacity-80" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-sm border border-green-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-green-600">Ca đã duyệt</p>
                            <p className="text-3xl font-bold text-green-900 mt-2">{statistics.approvedShifts}</p>
                        </div>
                        <CheckCircleIcon className="w-12 h-12 text-green-400 opacity-80" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-xl shadow-sm border border-yellow-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-yellow-600">Chờ duyệt</p>
                            <p className="text-3xl font-bold text-yellow-900 mt-2">{statistics.pendingShifts}</p>
                        </div>
                        <PendingIcon className="w-12 h-12 text-yellow-400 opacity-80" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl shadow-sm border border-purple-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-purple-600">Cuộc hẹn</p>
                            <p className="text-3xl font-bold text-purple-900 mt-2">{statistics.totalAppointments}</p>
                            <p className="text-xs text-purple-600 mt-1">{statistics.upcomingAppointments} sắp tới</p>
                        </div>
                        <UserGroupIcon className="w-12 h-12 text-purple-400 opacity-80" />
                    </div>
                </div>
            </div>

            {/* View Mode Toggle & Filter */}
            <div className="bg-white p-4 rounded-lg shadow-sm flex flex-wrap items-center justify-between gap-4">
                <div className="flex gap-2">
                    <button
                        onClick={() => setViewMode('calendar')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            viewMode === 'calendar'
                                ? 'bg-brand-primary text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        <CalendarIcon className="w-5 h-5 inline mr-2" />
                        Lịch
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            viewMode === 'list'
                                ? 'bg-brand-primary text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        Danh sách
                    </button>
                </div>

                <div className="flex gap-2 flex-wrap">
                    {(['all', 'approved', 'pending', 'rejected'] as const).map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                filterStatus === status
                                    ? 'bg-brand-primary text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            {status === 'all' ? 'Tất cả' : status === 'approved' ? 'Đã duyệt' : status === 'pending' ? 'Chờ duyệt' : 'Từ chối'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Calendar or List View */}
            {viewMode === 'calendar' ? (
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                            <ChevronLeftIcon className="w-6 h-6" />
                        </button>
                        <h2 className="text-2xl font-bold text-gray-800">
                            {currentMonth.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
                        </h2>
                        <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                            <ChevronRightIcon className="w-6 h-6" />
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-7 text-center text-sm font-semibold text-gray-600 mb-4 pb-2 border-b">
                        <span>Thứ 2</span><span>Thứ 3</span><span>Thứ 4</span><span>Thứ 5</span><span>Thứ 6</span><span>Thứ 7</span><span>CN</span>
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                        {daysInMonth.map((day, index) => {
                            const date = day ? new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day) : null;
                            const dateString = date ? formatDate(date) : '';
                            const shiftsOnDay = date ? filteredShifts.filter(shift => shift.date === dateString) : [];
                            const appointmentsOnDay = date ? myAppointments.filter(apt => apt.date === dateString) : [];
                            const isToday = day && new Date().toDateString() === date?.toDateString();

                            return (
                                <div
                                    key={index}
                                    className={`min-h-32 rounded-lg border p-2 flex flex-col transition-all ${
                                        day 
                                            ? 'bg-white border-gray-200 cursor-pointer hover:border-brand-primary hover:shadow-md' 
                                            : 'bg-gray-50 border-gray-100'
                                    } ${isToday ? 'ring-2 ring-brand-primary' : ''}`}
                                    onClick={day ? () => handleDayClick(day) : undefined}
                                >
                                    {day && (
                                        <>
                                            <div className="flex justify-between items-start mb-2">
                                                <span className={`text-sm font-bold ${isToday ? 'text-brand-primary' : 'text-gray-700'}`}>
                                                    {day}
                                                </span>
                                                {(shiftsOnDay.length > 0 || appointmentsOnDay.length > 0) && (
                                                    <span className="w-2 h-2 bg-brand-primary rounded-full"></span>
                                                )}
                                            </div>
                                            <div className="text-xs space-y-1 overflow-y-auto flex-grow">
                                                {/* Shifts */}
                                                {shiftsOnDay.length > 0 && (
                                                    <div className="space-y-1">
                                                        {shiftsOnDay.slice(0, 2).map(shift => (
                                                            <div key={shift.id} className="flex items-center justify-between bg-blue-50 text-blue-700 rounded px-1.5 py-1">
                                                                <span className="text-xs truncate">
                                                                    {shift.shiftType === 'morning' ? '🌅 Sáng' : 
                                                                     shift.shiftType === 'afternoon' ? '☀️ Chiều' : 
                                                                     shift.shiftType === 'evening' ? '🌙 Tối' : 
                                                                     shift.shiftType === 'leave' ? '🏖️ Nghỉ' : '⏰ Custom'}
                                                                </span>
                                                                {shift.status === 'approved' && <CheckCircleIcon className="w-3 h-3 text-green-600" />}
                                                                {shift.status === 'pending' && <PendingIcon className="w-3 h-3 text-yellow-600" />}
                                                                {shift.status === 'rejected' && <XCircleIcon className="w-3 h-3 text-red-600" />}
                                                            </div>
                                                        ))}
                                                        {shiftsOnDay.length > 2 && (
                                                            <p className="text-xs text-gray-500 italic">+{shiftsOnDay.length - 2} ca khác</p>
                                                        )}
                                                    </div>
                                                )}
                                                {/* Appointments */}
                                                {appointmentsOnDay.length > 0 && (
                                                    <div className="space-y-1">
                                                        {appointmentsOnDay.slice(0, 1).map(apt => (
                                                            <div key={apt.id} className="bg-purple-50 text-purple-700 rounded px-1.5 py-1">
                                                                <div className="flex items-center gap-1">
                                                                    <ClockIcon className="w-3 h-3" />
                                                                    <span className="text-xs truncate">{apt.time}</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {appointmentsOnDay.length > 1 && (
                                                            <p className="text-xs text-purple-600 italic">+{appointmentsOnDay.length - 1} cuộc hẹn</p>
                                                        )}
                                                    </div>
                                                )}
                                                {shiftsOnDay.length === 0 && appointmentsOnDay.length === 0 && (
                                                    <p className="text-gray-400 italic text-xs">Trống</p>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                /* List View */
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ca làm việc</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giờ</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ghi chú</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredShifts.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                            Không có ca làm việc nào
                                        </td>
                                    </tr>
                                ) : (
                                    filteredShifts
                                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                        .map(shift => (
                                            <tr key={shift.id} className="hover:bg-gray-50 cursor-pointer transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {new Date(shift.date).toLocaleDateString('vi-VN')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <span className="font-medium text-gray-900">
                                                        {shift.shiftType === 'morning' ? '🌅 Ca Sáng' : 
                                                         shift.shiftType === 'afternoon' ? '☀️ Ca Chiều' : 
                                                         shift.shiftType === 'evening' ? '🌙 Ca Tối' : 
                                                         shift.shiftType === 'leave' ? '🏖️ Nghỉ phép' : '⏰ Tùy chỉnh'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {shift.shiftHours ? `${shift.shiftHours.start} - ${shift.shiftHours.end}` : '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {getShiftStatusBadge(shift.status)}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                                                    {shift.notes || '-'}
                                                </td>
                                            </tr>
                                        ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {isDayModalOpen && selectedDayInfo && (
                <DayDetailsModal
                    currentUser={currentUser}
                    dayInfo={selectedDayInfo}
                    onClose={handleCloseDayModal}
                    onSaveShiftRequest={handleSaveShiftRequest}
                    onUpdateShiftRequest={handleUpdateShiftRequest}
                    onDeleteShiftRequest={handleDeleteShiftRequest}
                    onAppointmentClick={(appointment) => {
                        setSelectedAppointment(appointment);
                        setIsDayModalOpen(false);
                    }}
                    allUsers={allUsers}
                />
            )}

            {/* Appointment Detail Modal */}
            {selectedAppointment && (
                <AppointmentDetailModal
                    appointment={selectedAppointment}
                    allUsers={allUsers}
                    onClose={() => setSelectedAppointment(null)}
                />
            )}
        </div>
    );
};

export default StaffSchedulePage;