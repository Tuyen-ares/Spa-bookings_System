import React, { useState, useMemo, useEffect } from 'react';
import type { User, StaffShift } from '../../types';
import { ChevronLeftIcon, ChevronRightIcon, CheckCircleIcon, XCircleIcon, PendingIcon } from '../../shared/icons';
import DayDetailsModal from '../components/DayDetailsModal';
import * as apiService from '../../client/services/apiService';

interface StaffSchedulePageProps {
    currentUser: User;
}

const formatDate = (date: Date) => date.toISOString().split('T')[0];

const StaffSchedulePage: React.FC<StaffSchedulePageProps> = ({ currentUser }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [myShifts, setMyShifts] = useState<StaffShift[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDayModalOpen, setIsDayModalOpen] = useState(false);
    const [selectedDayInfo, setSelectedDayInfo] = useState<{
        dateString: string;
        dayOfMonth: number;
        shifts: StaffShift[];
    } | null>(null);

    useEffect(() => {
        const fetchMyShifts = async () => {
            setIsLoading(true);
            try {
                const shifts = await apiService.getStaffShifts(currentUser.id);
                setMyShifts(shifts);
            } catch (e) {
                console.error("Failed to fetch shifts", e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchMyShifts();
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
        setSelectedDayInfo({ dateString, dayOfMonth: day, shifts: shiftsOnDay });
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
    
    const getShiftStatusBadge = (status: StaffShift['status']) => {
        switch (status) {
            case 'approved': return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800 flex items-center gap-1"><CheckCircleIcon className="w-3 h-3" /> Duyệt</span>;
            case 'pending': return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 flex items-center gap-1"><PendingIcon className="w-3 h-3" /> Chờ</span>;
            case 'rejected': return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800 flex items-center gap-1"><XCircleIcon className="w-3 h-3" /> Từ chối</span>;
            default: return null;
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Lịch làm việc của tôi</h1>
            <p className="text-gray-600 mb-8">Xem lịch và gửi yêu cầu đổi ca/nghỉ phép. Nhấp vào một ngày để xem chi tiết.</p>

            <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
                <div className="flex justify-between items-center mb-6">
                    <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-gray-100"><ChevronLeftIcon/></button>
                    <h2 className="text-xl font-semibold text-gray-800">{currentMonth.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}</h2>
                    <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-gray-100"><ChevronRightIcon/></button>
                </div>
                
                <div className="grid grid-cols-7 text-center text-sm font-medium text-gray-600 mb-4">
                    <span>Thứ 2</span><span>Thứ 3</span><span>Thứ 4</span><span>Thứ 5</span><span>Thứ 6</span><span>Thứ 7</span><span>CN</span>
                </div>
                <div className="grid grid-cols-7 gap-2">
                    {daysInMonth.map((day, index) => {
                        const date = day ? new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day) : null;
                        const dateString = date ? formatDate(date) : '';
                        const shiftsOnDay = date ? myShifts.filter(shift => shift.date === dateString) : [];
                        const isToday = day && new Date().toDateString() === date?.toDateString();

                        return (
                            <div
                                key={index}
                                className={`h-28 rounded-md border p-2 flex flex-col ${day ? 'bg-gray-50 border-gray-200 cursor-pointer hover:bg-gray-100' : 'bg-gray-100 border-dashed'}`}
                                onClick={day ? () => handleDayClick(day) : undefined}
                            >
                                <span className={`font-semibold ${isToday ? 'text-brand-primary' : 'text-gray-700'}`}>{day}</span>
                                {day && (
                                    <div className="mt-1 text-xs space-y-1 overflow-y-auto flex-grow">
                                        {shiftsOnDay.length > 0 ? (
                                            shiftsOnDay.map(shift => (
                                                <div key={shift.id} className="flex items-center justify-between bg-blue-100 text-blue-800 rounded px-2 py-1">
                                                    <span>{shift.shiftType === 'morning' ? 'Sáng' : shift.shiftType === 'afternoon' ? 'Chiều' : shift.shiftType === 'evening' ? 'Tối' : 'Nghỉ'}</span>
                                                    {getShiftStatusBadge(shift.status)}
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-gray-400 italic">Trống</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {isDayModalOpen && selectedDayInfo && (
                <DayDetailsModal
                    currentUser={currentUser}
                    dayInfo={selectedDayInfo}
                    onClose={handleCloseDayModal}
                    onSaveShiftRequest={handleSaveShiftRequest}
                    onUpdateShiftRequest={handleUpdateShiftRequest}
                    onDeleteShiftRequest={handleDeleteShiftRequest}
                />
            )}
        </div>
    );
};

export default StaffSchedulePage;