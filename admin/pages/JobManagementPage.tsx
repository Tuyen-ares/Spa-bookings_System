import React, { useState, useMemo, useEffect } from 'react';
import type { User, StaffShift, Appointment, Service, StaffRole } from '../../types';
import * as apiService from '../../client/services/apiService';
import AssignScheduleModal from '../components/AssignScheduleModal';
import { AVAILABLE_SPECIALTIES } from '../../constants';
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon, UsersIcon, CheckCircleIcon, ChartBarIcon } from '../../shared/icons';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm flex items-center">
        <div className="p-3 rounded-full bg-brand-secondary text-brand-primary">{icon}</div>
        <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);

interface JobManagementPageProps {
    allUsers: User[];
    allServices: Service[];
    allAppointments: Appointment[];
}

const JobManagementPage: React.FC<JobManagementPageProps> = ({ allUsers, allServices, allAppointments }) => {
    const [staffShifts, setStaffShifts] = useState<StaffShift[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [filteredStaffId, setFilteredStaffId] = useState('all');
    const [filteredSpecialty, setFilteredSpecialty] = useState('all');
    const [modalContext, setModalContext] = useState<{ staff: User; date: string; shift?: StaffShift } | null>(null);

    useEffect(() => {
        const fetchShifts = async () => {
            setIsLoading(true);
            try {
                const shifts = await apiService.getAllStaffShifts();
                setStaffShifts(shifts);
            } catch (error) {
                console.error("Failed to fetch staff shifts", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchShifts();
    }, []);
    
    const staffMembers = useMemo(() => allUsers.filter(u => u.role === 'Staff' && u.staffProfile?.staffRole === 'Technician'), [allUsers]);

    const filteredStaff = useMemo(() => {
        return staffMembers
            .filter(staff => filteredStaffId === 'all' || staff.id === filteredStaffId)
            .filter(staff => filteredSpecialty === 'all' || staff.staffProfile?.specialty?.includes(filteredSpecialty));
    }, [staffMembers, filteredStaffId, filteredSpecialty]);

    const weekDays = useMemo(() => {
        const startOfWeek = new Date(currentDate);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        startOfWeek.setDate(diff);
        return Array.from({ length: 7 }, (_, i) => new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() + i));
    }, [currentDate]);

    const dashboardStats = useMemo(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        const totalShiftsToday = staffShifts.filter(s => s.date === todayStr && s.shiftType !== 'leave').length;
        const customersServedToday = allAppointments.filter(a => a.date === todayStr && a.status === 'completed').length;
        const totalAppointmentsToday = allAppointments.filter(a => a.date === todayStr && a.status !== 'cancelled').length;
        const performance = totalAppointmentsToday > 0 ? (customersServedToday / totalAppointmentsToday) * 100 : 0;
        
        let busyness = "Thong thả";
        if (totalAppointmentsToday > 10) busyness = "Bận rộn";
        else if (totalAppointmentsToday > 5) busyness = "Bình thường";

        return {
            totalShiftsToday,
            customersServedToday,
            performance: `${performance.toFixed(0)}%`,
            busyness,
        };
    }, [staffShifts, allAppointments]);

    const handlePrevWeek = () => setCurrentDate(prev => new Date(prev.setDate(prev.getDate() - 7)));
    const handleNextWeek = () => setCurrentDate(prev => new Date(prev.setDate(prev.getDate() + 7)));

    const handleCellClick = (staff: User, date: Date, shift?: StaffShift) => {
        setModalContext({ staff, date: date.toISOString().split('T')[0], shift });
    };

    const handleSaveShift = async (shift: StaffShift) => {
        try {
            if (staffShifts.find(s => s.id === shift.id)) {
                const updatedShift = await apiService.updateStaffShift(shift.id, shift);
                setStaffShifts(prev => prev.map(s => s.id === updatedShift.id ? updatedShift : s));
            } else {
                const newShift = await apiService.createStaffShift(shift);
                setStaffShifts(prev => [...prev, newShift]);
            }
        } catch (error) { console.error("Failed to save shift", error); }
    };
    
    const handleDeleteShift = async (shiftId: string) => {
        try {
            await apiService.deleteStaffShift(shiftId);
            setStaffShifts(prev => prev.filter(s => s.id !== shiftId));
        } catch (error) { console.error("Failed to delete shift", error); }
    };

    const getShiftDisplayConfig = (shift: StaffShift) => {
        const baseColors = {
            morning: 'bg-blue-100 text-blue-800',
            afternoon: 'bg-orange-100 text-orange-800',
            evening: 'bg-indigo-100 text-indigo-800',
            custom: 'bg-purple-100 text-purple-800',
            leave: 'bg-gray-200 text-gray-700',
        };
        return {
            color: baseColors[shift.shiftType] || 'bg-gray-100',
            time: `${shift.shiftHours.start} - ${shift.shiftHours.end}`,
            isLeave: shift.shiftType === 'leave',
        };
    };

    const getBusynessColor = (appointmentCount: number) => {
        if (appointmentCount >= 5) return 'bg-red-50'; // Full
        if (appointmentCount >= 3) return 'bg-yellow-50'; // Busy
        return 'bg-green-50'; // Available
    };

    return (
        <div>
            {modalContext && <AssignScheduleModal context={modalContext} onClose={() => setModalContext(null)} onSave={handleSaveShift} onDelete={handleDeleteShift} allAppointments={allAppointments} />}
            
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Quản lý Lịch Làm Việc Nhân Viên</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard title="Tổng số ca làm hôm nay" value={dashboardStats.totalShiftsToday} icon={<CalendarIcon className="w-6 h-6"/>} />
                <StatCard title="Số khách đã phục vụ" value={dashboardStats.customersServedToday} icon={<UsersIcon className="w-6 h-6"/>} />
                <StatCard title="Hiệu suất" value={dashboardStats.performance} icon={<CheckCircleIcon className="w-6 h-6"/>} />
                <StatCard title="Mức độ bận rộn" value={dashboardStats.busyness} icon={<ChartBarIcon className="w-6 h-6"/>} />
            </div>

            <div className="mb-6 flex flex-col md:flex-row gap-4 bg-white p-4 rounded-lg shadow-sm">
                <select value={filteredStaffId} onChange={e => setFilteredStaffId(e.target.value)} className="p-2 border rounded-md bg-white w-full md:w-auto">
                    <option value="all">Tất cả nhân viên</option>
                    {staffMembers.map(staff => <option key={staff.id} value={staff.id}>{staff.name}</option>)}
                </select>
                <select value={filteredSpecialty} onChange={e => setFilteredSpecialty(e.target.value)} className="p-2 border rounded-md bg-white w-full md:w-auto">
                    <option value="all">Tất cả chuyên môn</option>
                    {AVAILABLE_SPECIALTIES.map(spec => <option key={spec} value={spec}>{spec}</option>)}
                </select>
            </div>
            
            <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                <div className="p-4 flex justify-between items-center border-b">
                    <button onClick={handlePrevWeek} className="p-2 rounded-full hover:bg-gray-100"><ChevronLeftIcon /></button>
                    <h2 className="text-lg font-semibold">{weekDays[0].toLocaleDateString('vi-VN')} - {weekDays[6].toLocaleDateString('vi-VN')}</h2>
                    <button onClick={handleNextWeek} className="p-2 rounded-full hover:bg-gray-100"><ChevronRightIcon /></button>
                </div>
                <table className="w-full">
                    <thead>
                        <tr>
                            <th className="p-3 text-left font-semibold text-gray-600 w-48">Nhân viên</th>
                            {weekDays.map(day => (
                                <th key={day.toISOString()} className="p-3 text-center font-semibold text-gray-600 min-w-[150px]">
                                    {day.toLocaleDateString('vi-VN', { weekday: 'short' })}
                                    <br/>
                                    <span className="text-xs font-normal">{day.getDate()}/{day.getMonth() + 1}</span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {isLoading ? (
                            <tr><td colSpan={8} className="text-center p-8">Đang tải lịch...</td></tr>
                        ) : filteredStaff.length === 0 ? (
                            <tr><td colSpan={8} className="text-center p-8">Không có nhân viên nào phù hợp.</td></tr>
                        ) : (
                            filteredStaff.map(staff => (
                                <tr key={staff.id}>
                                    <td className="p-3 font-semibold text-gray-800 align-top">
                                        <div className="flex items-center gap-2">
                                            <img src={staff.profilePictureUrl} alt={staff.name} className="w-8 h-8 rounded-full" />
                                            <span>{staff.name}</span>
                                        </div>
                                    </td>
                                    {weekDays.map(day => {
                                        const dateString = day.toISOString().split('T')[0];
                                        const shiftsForCell = staffShifts.filter(s => s.staffId === staff.id && s.date === dateString);
                                        const appointmentsForCell = allAppointments.filter(a => a.therapistId === staff.id && a.date === dateString && a.status !== 'cancelled');
                                        const cellBgColor = getBusynessColor(appointmentsForCell.length);

                                        return (
                                            <td key={dateString} className={`p-2 align-top h-32 cursor-pointer transition-colors hover:bg-gray-100 ${cellBgColor}`} onClick={() => handleCellClick(staff, day)}>
                                                <div className="space-y-1">
                                                    {shiftsForCell.map(shift => {
                                                        const display = getShiftDisplayConfig(shift);
                                                        return (
                                                            <div key={shift.id} className={`p-1.5 rounded text-xs font-semibold ${display.color}`} onClick={(e) => { e.stopPropagation(); handleCellClick(staff, day, shift); }}>
                                                                <p>{display.isLeave ? 'Nghỉ phép' : display.time}</p>
                                                                {shift.room && <p className="font-normal">{shift.room}</p>}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                {appointmentsForCell.length > 0 && (
                                                    <div className="text-xs text-gray-600 mt-2 font-semibold">
                                                        {appointmentsForCell.length} lịch hẹn
                                                    </div>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default JobManagementPage;