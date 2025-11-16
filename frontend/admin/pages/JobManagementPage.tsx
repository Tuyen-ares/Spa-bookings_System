import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { User, StaffShift, Appointment, Service, Room } from '../../types';
import * as apiService from '../../client/services/apiService';
import AssignScheduleModal from '../components/AssignScheduleModal';
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon, UsersIcon, CheckCircleIcon, ChartBarIcon, PlusIcon, XCircleIcon, CheckIcon } from '../../shared/icons';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm flex items-center">
        <div className="p-3 rounded-full bg-brand-secondary text-brand-primary">{icon}</div>
        <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);

// Icon for alerts
const AlertIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
);


interface JobManagementPageProps {
    allUsers: User[];
    allServices: Service[];
    allAppointments: Appointment[];
}

const JobManagementPage: React.FC<JobManagementPageProps> = ({ allUsers, allServices, allAppointments }) => {
    const [staffShifts, setStaffShifts] = useState<StaffShift[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [filteredStaffId, setFilteredStaffId] = useState('all');
    const [modalContext, setModalContext] = useState<{ staff: User; date: string; shift?: StaffShift } | null>(null);
    const [showQuickCreate, setShowQuickCreate] = useState(false);
    const [pendingRequests, setPendingRequests] = useState<StaffShift[]>([]);
    const [draggedShift, setDraggedShift] = useState<{ shift: StaffShift; staff: User } | null>(null);
    const dragStartPos = useRef<{ x: number; y: number } | null>(null);
    const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({ visible: false, message: '', type: 'success' });
    const [isCreatingShifts, setIsCreatingShifts] = useState(false);
    const [localUsers, setLocalUsers] = useState<User[]>([]);
    const [selectedStaffIds, setSelectedStaffIds] = useState<Set<string>>(new Set());

    // Fetch users if allUsers is empty or refresh when allUsers changes
    useEffect(() => {
        const fetchUsersIfNeeded = async () => {
            if (!allUsers || allUsers.length === 0) {
                console.log('JobManagementPage: allUsers is empty, fetching from API...');
                try {
                    const fetchedUsers = await apiService.getUsers();
                    console.log('JobManagementPage: Fetched users from API:', fetchedUsers.length);
                    setLocalUsers(fetchedUsers);
                } catch (error) {
                    console.error('JobManagementPage: Failed to fetch users from API:', error);
                    setLocalUsers([]);
                }
            } else {
                console.log('JobManagementPage: Using allUsers from props:', allUsers.length);
                setLocalUsers(allUsers);
            }
        };
        fetchUsersIfNeeded();
    }, [allUsers]);

    // Initial data fetch for shifts and rooms
    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoading(true);
            try {
                const [shifts, roomsData] = await Promise.all([
                    apiService.getAllStaffShifts(),
                    apiService.getRooms()
                ]);
                
                console.log('JobManagementPage: Fetched initial data:', {
                    shiftsCount: shifts.length,
                    roomsCount: roomsData.length
                });
                
                setStaffShifts(shifts);
                setRooms(roomsData);
                
                const pending = shifts.filter(s => 
                    s.status === 'pending' || 
                    s.managerApprovalStatus === 'pending_approval' ||
                    s.isUpForSwap === true
                );
                setPendingRequests(pending);
            } catch (error) {
                console.error("Failed to fetch initial data", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    // Refresh shifts when appointments change (for slot reopening)
    useEffect(() => {
        const fetchShifts = async () => {
            try {
                const shifts = await apiService.getAllStaffShifts();
                setStaffShifts(shifts);
                const pending = shifts.filter(s => 
                    s.status === 'pending' || 
                    s.managerApprovalStatus === 'pending_approval' ||
                    s.isUpForSwap === true
                );
                setPendingRequests(pending);
            } catch (error) {
                console.error("Failed to refresh shifts", error);
            }
        };
        fetchShifts();
    }, [allAppointments]);

    // Filter staff members (ONLY Staff role, NOT Admin) - use localUsers if available
    const staffMembers = useMemo(() => {
        const usersToCheck = localUsers.length > 0 ? localUsers : allUsers;
        
        if (!usersToCheck || usersToCheck.length === 0) {
            console.warn('JobManagementPage: No users available', { 
                localUsers: localUsers.length, 
                allUsers: allUsers?.length || 0 
            });
            return [];
        }
        
        // Filter with case-insensitive role check - ONLY Staff, NOT Admin
        const staff = usersToCheck.filter(u => {
            const role = (u.role || '').toString().toLowerCase();
            return role === 'staff'; // Chỉ lấy Staff, không lấy Admin
        });
        
        console.log('JobManagementPage: Staff members found (Staff only, no Admin):', {
            staffCount: staff.length,
            totalUsers: usersToCheck.length,
            roles: usersToCheck.map(u => ({ name: u.name, role: u.role })),
            staffList: staff.map(s => ({ name: s.name, role: s.role, id: s.id }))
        });
        
        return staff;
    }, [localUsers, allUsers]);

    const filteredStaff = useMemo(() => {
        const filtered = staffMembers.filter(staff => filteredStaffId === 'all' || staff.id === filteredStaffId);
        console.log('JobManagementPage: Filtered staff:', {
            filteredCount: filtered.length,
            filter: filteredStaffId,
            staffIds: filtered.map(s => s.id),
            staffNames: filtered.map(s => s.name)
        });
        return filtered;
    }, [staffMembers, filteredStaffId]);

    // Generate 7 days starting from a selected start date (Monday to Sunday)
    const [startDate, setStartDate] = useState(() => {
        const today = new Date();
        const day = today.getDay();
        // Calculate start of week (Monday = 1, so if today is Sunday (0), go back 6 days, else go back day-1)
        const diff = today.getDate() - (day === 0 ? 6 : day - 1);
        today.setDate(diff);
        return today;
    });
    
    const weekDays = useMemo(() => {
        return Array.from({ length: 7 }, (_, i) => {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            return date;
        });
    }, [startDate]);

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

    // Calculate available slots (staff with shift + available room)
    const calculateAvailableSlots = useMemo(() => {
        const slots: { date: string; staffId: string; roomId: string; time: string }[] = [];
        const activeRooms = rooms.filter(r => r?.isActive);
        
        weekDays.forEach(day => {
            const dateStr = day.toISOString().split('T')[0];
            const shiftsForDay = staffShifts.filter(s => s.date === dateStr && s.shiftType !== 'leave' && s.status === 'approved');
            const appointmentsForDay = allAppointments.filter(a => a.date === dateStr && a.status !== 'cancelled');
            
            shiftsForDay.forEach(shift => {
                // Safe check for shiftHours
                if (!shift.shiftHours || !shift.shiftHours.start || !shift.shiftHours.end) {
                    return; // Skip if shiftHours is missing
                }
                
                const shiftStart = shift.shiftHours.start;
                const shiftEnd = shift.shiftHours.end;
                
                // Find available rooms for this shift
                activeRooms.forEach(room => {
                    const roomAppointments = appointmentsForDay.filter(a => a.roomId === room.id);
                    // Check if room is available at shift time
                    const isRoomAvailable = !roomAppointments.some(apt => {
                        const aptTime = apt.time || '09:00';
                        return aptTime >= shiftStart && aptTime < shiftEnd;
                    });
                    
                    if (isRoomAvailable) {
                        slots.push({
                            date: dateStr,
                            staffId: shift.staffId,
                            roomId: room.id,
                            time: shiftStart
                        });
                    }
                });
            });
        });
        
        return slots;
    }, [weekDays, staffShifts, rooms, allAppointments]);

    // Detect conflicts (overlapping appointments without enough staff/rooms)
    const detectConflicts = useMemo(() => {
        const conflicts: { date: string; time: string; reason: string }[] = [];
        
        weekDays.forEach(day => {
            const dateStr = day.toISOString().split('T')[0];
            const appointmentsForDay = allAppointments.filter(a => a.date === dateStr && a.status !== 'cancelled');
            const shiftsForDay = staffShifts.filter(s => s.date === dateStr && s.shiftType !== 'leave' && s.status === 'approved');
            const activeRooms = rooms.filter(r => r?.isActive);
            
            // Group appointments by time
            const appointmentsByTime = new Map<string, Appointment[]>();
            appointmentsForDay.forEach(apt => {
                const time = apt.time || '09:00';
                if (!appointmentsByTime.has(time)) {
                    appointmentsByTime.set(time, []);
                }
                appointmentsByTime.get(time)!.push(apt);
            });
            
            appointmentsByTime.forEach((apts, time) => {
                // Check if enough staff available
                const availableStaff = shiftsForDay.filter(shift => {
                    // Safe check for shiftHours
                    if (!shift.shiftHours || !shift.shiftHours.start || !shift.shiftHours.end) {
                        return false;
                    }
                    const shiftStart = shift.shiftHours.start;
                    const shiftEnd = shift.shiftHours.end;
                    return time >= shiftStart && time < shiftEnd;
                });
                
                if (apts.length > availableStaff.length) {
                    conflicts.push({
                        date: dateStr,
                        time,
                        reason: `Thiếu nhân viên: ${apts.length} lịch hẹn nhưng chỉ có ${availableStaff.length} nhân viên`
                    });
                }
                
                // Check if enough rooms available
                const usedRooms = new Set(apts.map(a => a.roomId).filter(Boolean));
                if (apts.length > activeRooms.length) {
                    conflicts.push({
                        date: dateStr,
                        time,
                        reason: `Thiếu phòng: ${apts.length} lịch hẹn nhưng chỉ có ${activeRooms.length} phòng`
                    });
                } else if (usedRooms.size >= activeRooms.length && apts.length > usedRooms.size) {
                    conflicts.push({
                        date: dateStr,
                        time,
                        reason: `Thiếu phòng: ${apts.length} lịch hẹn nhưng chỉ có ${activeRooms.length} phòng trống`
                    });
                }
            });
        });
        
        return conflicts;
    }, [weekDays, allAppointments, staffShifts, rooms]);

    const handleCellClick = (staff: User, date: Date, shift?: StaffShift) => {
        // Format date to YYYY-MM-DD in local timezone to avoid date shift
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        setModalContext({ staff, date: dateStr, shift });
    };

    // Handle staff selection for quick create
    const handleToggleStaffSelection = (staffId: string) => {
        setSelectedStaffIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(staffId)) {
                newSet.delete(staffId);
            } else {
                newSet.add(staffId);
            }
            return newSet;
        });
    };

    const handleSelectAllStaff = () => {
        if (selectedStaffIds.size === filteredStaff.length) {
            setSelectedStaffIds(new Set());
        } else {
            setSelectedStaffIds(new Set(filteredStaff.map(s => s.id)));
        }
    };

    // Reset selection when modal opens/closes
    useEffect(() => {
        if (showQuickCreate) {
            // Initialize with all staff selected if filter is 'all', otherwise empty
            if (filteredStaffId === 'all') {
                setSelectedStaffIds(new Set(filteredStaff.map(s => s.id)));
            } else {
                setSelectedStaffIds(new Set());
            }
        }
    }, [showQuickCreate, filteredStaffId, filteredStaff]);

    const handleSaveShift = async (shift: StaffShift) => {
        try {
            if (staffShifts.find(s => s.id === shift.id)) {
                const updatedShift = await apiService.updateStaffShift(shift.id, shift);
                setStaffShifts(prev => prev.map(s => s.id === updatedShift.id ? updatedShift : s));
            } else {
                const newShift = await apiService.createStaffShift(shift);
                setStaffShifts(prev => [...prev, newShift]);
            }
        } catch (error) { 
            console.error("Failed to save shift", error); 
        }
    };
    
    const handleDeleteShift = async (shiftId: string) => {
        try {
            await apiService.deleteStaffShift(shiftId);
            setStaffShifts(prev => prev.filter(s => s.id !== shiftId));
        } catch (error) { 
            console.error("Failed to delete shift", error); 
        }
    };

    // Quick create fixed shifts (morning 8-12h, afternoon 14-18h)
    const handleQuickCreateFixedShifts = async (shiftType: 'morning' | 'afternoon', days: Date[]) => {
        const shiftHours = shiftType === 'morning' 
            ? { start: '08:00', end: '12:00' }
            : { start: '14:00', end: '18:00' };
        
        // Use selected staff IDs if any, otherwise use filtered staff
        let selectedStaff: User[];
        if (selectedStaffIds.size > 0) {
            selectedStaff = staffMembers.filter(s => selectedStaffIds.has(s.id));
        } else {
            selectedStaff = filteredStaffId === 'all' ? filteredStaff : filteredStaff.filter(s => s.id === filteredStaffId);
        }
        
        // Check if there are any staff members
        if (selectedStaff.length === 0) {
            setToast({
                visible: true,
                message: 'Không có nhân viên nào được chọn! Vui lòng chọn ít nhất một nhân viên.',
                type: 'error'
            });
            setTimeout(() => setToast({ visible: false, message: '', type: 'success' }), 5000);
            return;
        }
        
        setIsCreatingShifts(true);
        try {
            const newShifts: StaffShift[] = [];
            let createdCount = 0;
            let skippedCount = 0;
            
            for (const staff of selectedStaff) {
                for (const day of days) {
                    const dateStr = day.toISOString().split('T')[0];
                    // Check if shift already exists
                    const exists = staffShifts.find(s => 
                        s.staffId === staff.id && 
                        s.date === dateStr && 
                        s.shiftType === shiftType
                    );
                    if (!exists) {
                        try {
                            const newShift: StaffShift = {
                                id: `shift-${staff.id}-${dateStr}-${shiftType}-${Date.now()}-${Math.random()}`,
                                staffId: staff.id,
                                date: dateStr,
                                shiftType,
                                status: 'approved',
                                shiftHours,
                            };
                            const created = await apiService.createStaffShift(newShift);
                            newShifts.push(created);
                            createdCount++;
                        } catch (err) {
                            console.error(`Failed to create shift for ${staff.name} on ${dateStr}:`, err);
                            skippedCount++;
                        }
                    } else {
                        skippedCount++;
                    }
                }
            }
            
            // Refresh shifts from server
            const refreshedShifts = await apiService.getAllStaffShifts();
            setStaffShifts(refreshedShifts);
            
            setShowQuickCreate(false);
            
            // Show success message
            const shiftTypeName = shiftType === 'morning' ? 'Ca sáng' : 'Ca chiều';
            if (createdCount > 0) {
                setToast({
                    visible: true,
                    message: `Đã tạo thành công ${createdCount} ca ${shiftTypeName}${skippedCount > 0 ? ` (${skippedCount} ca đã tồn tại)` : ''}`,
                    type: 'success'
                });
            } else {
                setToast({
                    visible: true,
                    message: `Không tạo được ca mới. Tất cả ca ${shiftTypeName} đã tồn tại.`,
                    type: 'error'
                });
            }
            setTimeout(() => setToast({ visible: false, message: '', type: 'success' }), 5000);
        } catch (error) {
            console.error("Failed to create fixed shifts", error);
            setToast({
                visible: true,
                message: `Lỗi khi tạo ca: ${error instanceof Error ? error.message : 'Unknown error'}`,
                type: 'error'
            });
            setTimeout(() => setToast({ visible: false, message: '', type: 'success' }), 5000);
        } finally {
            setIsCreatingShifts(false);
        }
    };

    // Approve/reject leave/swap requests
    const handleApproveRequest = async (shift: StaffShift, approved: boolean) => {
        try {
            const updatedShift = await apiService.updateStaffShift(shift.id, {
                ...shift,
                status: approved ? 'approved' : 'rejected',
                managerApprovalStatus: approved ? 'approved' : 'rejected',
            });
            setStaffShifts(prev => prev.map(s => s.id === updatedShift.id ? updatedShift : s));
            setPendingRequests(prev => prev.filter(s => s.id !== shift.id));
        } catch (error) {
            console.error("Failed to approve/reject request", error);
        }
    };

    // Drag and drop handlers
    const handleDragStart = (e: React.DragEvent, shift: StaffShift, staff: User) => {
        setDraggedShift({ shift, staff });
        dragStartPos.current = { x: e.clientX, y: e.clientY };
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e: React.DragEvent, targetStaff: User, targetDate: Date) => {
        e.preventDefault();
        if (!draggedShift) return;

        const targetDateStr = targetDate.toISOString().split('T')[0];
        
        try {
            // Update shift to new staff/date
            const updatedShift = await apiService.updateStaffShift(draggedShift.shift.id, {
                ...draggedShift.shift,
                staffId: targetStaff.id,
                date: targetDateStr,
            });
            
            setStaffShifts(prev => prev.map(s => s.id === updatedShift.id ? updatedShift : s));
            setDraggedShift(null);
        } catch (error) {
            console.error("Failed to move shift", error);
        }
    };

    const getShiftDisplayConfig = (shift: StaffShift) => {
        const baseColors = {
            morning: 'bg-blue-100 text-blue-800',
            afternoon: 'bg-orange-100 text-orange-800',
            evening: 'bg-indigo-100 text-indigo-800',
            custom: 'bg-purple-100 text-purple-800',
            leave: 'bg-gray-200 text-gray-700',
        };
        
        // Safe check for shiftHours
        const timeDisplay = shift.shiftHours?.start && shift.shiftHours?.end 
            ? `${shift.shiftHours.start} - ${shift.shiftHours.end}`
            : 'Chưa có giờ';
        
        return {
            color: baseColors[shift.shiftType] || 'bg-gray-100',
            time: timeDisplay,
            isLeave: shift.shiftType === 'leave',
        };
    };

    const getBusynessColor = (appointmentCount: number, hasConflict: boolean) => {
        if (hasConflict) return 'bg-red-100 border-2 border-red-500';
        if (appointmentCount >= 5) return 'bg-red-50';
        if (appointmentCount >= 3) return 'bg-yellow-50';
        return 'bg-green-50';
    };

    const getConflictsForCell = (date: string, time?: string) => {
        return detectConflicts.filter(c => {
            if (c.date !== date) return false;
            if (time) return c.time === time;
            return true;
        });
    };

    // Early return with loading state if data not ready
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
                    <p className="text-gray-600">Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {modalContext && (
                <AssignScheduleModal 
                    context={modalContext} 
                    onClose={() => setModalContext(null)} 
                    onSave={handleSaveShift} 
                    onDelete={handleDeleteShift} 
                    allAppointments={allAppointments}
                    allRooms={rooms}
                    existingShifts={staffShifts}
                />
            )}
            
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Quản lý Lịch Làm Việc Nhân Viên</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowQuickCreate(!showQuickCreate)}
                        className="flex items-center gap-2 bg-brand-primary text-white px-4 py-2 rounded-lg hover:bg-brand-primary-dark transition-colors"
                    >
                        <PlusIcon className="w-5 h-5" />
                        <span>Tạo ca làm</span>
                    </button>
                </div>
            </div>

            {/* Quick Create Fixed Shifts Modal */}
            {showQuickCreate && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !isCreatingShifts && setShowQuickCreate(false)}>
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full" onClick={e => e.stopPropagation()}>
                        <div className="p-6">
                            <h2 className="text-2xl font-bold text-gray-800 mb-4">Tạo ca làm</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Tên ca</label>
                                    <input
                                        type="text"
                                        placeholder="VD: Ca sáng, Ca chiều, Ca tối..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-primary focus:border-brand-primary"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Giờ bắt đầu</label>
                                        <input
                                            type="time"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-primary focus:border-brand-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Giờ kết thúc</label>
                                        <input
                                            type="time"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-primary focus:border-brand-primary"
                                        />
                                    </div>
                                </div>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <p className="text-sm text-gray-700">
                                        <strong>Ví dụ:</strong>
                                    </p>
                                    <p className="text-xs text-gray-600 mt-1">• Ca sáng: 08:00 - 12:00</p>
                                    <p className="text-xs text-gray-600">• Ca chiều: 14:00 - 18:00</p>
                                    <p className="text-xs text-gray-600">• Ca tối: 18:00 - 22:00</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 rounded-b-lg">
                            <button
                                onClick={() => setShowQuickCreate(false)}
                                disabled={isCreatingShifts}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Hủy
                            </button>
                            <button
                                disabled={isCreatingShifts}
                                className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isCreatingShifts ? 'Đang tạo...' : 'Tạo ca'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast.visible && (
                <div className={`fixed bottom-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
                    toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                }`}>
                    <div className="flex items-center gap-2">
                        {toast.type === 'success' ? (
                            <CheckCircleIcon className="w-5 h-5" />
                        ) : (
                            <XCircleIcon className="w-5 h-5" />
                        )}
                        <span>{toast.message}</span>
                        <button
                            onClick={() => setToast({ visible: false, message: '', type: 'success' })}
                            className="ml-4 hover:opacity-75"
                        >
                            <XCircleIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Pending Requests Panel */}
            {pendingRequests.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                        <AlertIcon className="w-5 h-5" />
                        Yêu cầu chờ duyệt ({pendingRequests.length})
                    </h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {pendingRequests.map(request => {
                            const staff = staffMembers.find(s => s.id === request.staffId);
                            const timeDisplay = request.shiftHours?.start && request.shiftHours?.end 
                                ? ` ${request.shiftHours.start}-${request.shiftHours.end}`
                                : '';
                            return (
                                <div key={request.id} className="bg-white p-3 rounded-lg flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold">{staff?.name || 'Unknown'}</p>
                                        <p className="text-sm text-gray-600">
                                            {new Date(request.date).toLocaleDateString('vi-VN')} - 
                                            {request.shiftType === 'leave' ? ' Nghỉ phép' : timeDisplay}
                                        </p>
                                        {request.notes && <p className="text-xs text-gray-500">{request.notes}</p>}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleApproveRequest(request, true)}
                                            className="px-3 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200 flex items-center gap-1"
                                            title="Duyệt"
                                        >
                                            <CheckIcon className="w-4 h-4" />
                                            Duyệt
                                        </button>
                                        <button
                                            onClick={() => handleApproveRequest(request, false)}
                                            className="px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200 flex items-center gap-1"
                                            title="Từ chối"
                                        >
                                            <XCircleIcon className="w-4 h-4" />
                                            Từ chối
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Conflict Alerts */}
            {detectConflicts.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-red-800 mb-3 flex items-center gap-2">
                        <AlertIcon className="w-5 h-5" />
                        Cảnh báo chồng lịch ({detectConflicts.length})
                    </h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {detectConflicts.map((conflict, idx) => (
                            <div key={idx} className="bg-white p-3 rounded-lg">
                                <p className="font-semibold text-red-800">
                                    {new Date(conflict.date).toLocaleDateString('vi-VN')} lúc {conflict.time}
                                </p>
                                <p className="text-sm text-red-600">{conflict.reason}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StatCard title="Tổng số ca làm hôm nay" value={dashboardStats.totalShiftsToday} icon={<CalendarIcon className="w-6 h-6"/>} />
                <StatCard title="Số khách đã phục vụ" value={dashboardStats.customersServedToday} icon={<UsersIcon className="w-6 h-6"/>} />
            </div>

            <div className="mb-6 flex flex-col md:flex-row gap-4 bg-white p-4 rounded-lg shadow-sm">
                <select 
                    value={filteredStaffId} 
                    onChange={e => setFilteredStaffId(e.target.value)} 
                    className="p-2 border rounded-md bg-white w-full md:w-auto"
                >
                    <option value="all">Tất cả nhân viên</option>
                    {staffMembers.map(staff => (
                        <option key={staff.id} value={staff.id}>{staff.name}</option>
                    ))}
                </select>
            </div>
            
            <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                <div className="p-4 flex justify-between items-center border-b">
                    <div className="flex items-center gap-3">
                        <label className="text-sm font-medium text-gray-700">Từ ngày:</label>
                        <input
                            type="date"
                            value={startDate.toISOString().split('T')[0]}
                            onChange={(e) => setStartDate(new Date(e.target.value))}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-primary focus:border-brand-primary"
                        />
                    </div>
                    <h2 className="text-lg font-semibold">
                        {weekDays[0].toLocaleDateString('vi-VN')} - {weekDays[6].toLocaleDateString('vi-VN')}
                    </h2>
                    <div className="flex gap-2">
                        <button onClick={() => setStartDate(prev => { const d = new Date(prev); d.setDate(d.getDate() - 7); return d; })} className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-1">
                            <ChevronLeftIcon className="w-4 h-4" /> Tuần trước
                        </button>
                        <button onClick={() => setStartDate(new Date())} className="px-3 py-2 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg">
                            Hôm nay
                        </button>
                        <button onClick={() => setStartDate(prev => { const d = new Date(prev); d.setDate(d.getDate() + 7); return d; })} className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-1">
                            Tuần sau <ChevronRightIcon className="w-4 h-4" />
                        </button>
                    </div>
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
                                        const appointmentsForCell = allAppointments.filter(a => 
                                            a.therapistId === staff.id && 
                                            a.date === dateString && 
                                            a.status !== 'cancelled'
                                        );
                                        const conflicts = getConflictsForCell(dateString);
                                        const hasConflict = conflicts.length > 0;
                                        const cellBgColor = getBusynessColor(appointmentsForCell.length, hasConflict);

                                        return (
                                            <td 
                                                key={dateString} 
                                                className={`p-2 align-top h-32 cursor-pointer transition-colors hover:bg-gray-100 ${cellBgColor}`}
                                                onClick={() => handleCellClick(staff, day)}
                                                onDragOver={handleDragOver}
                                                onDrop={(e) => handleDrop(e, staff, day)}
                                            >
                                                <div className="space-y-1">
                                                    {shiftsForCell.map(shift => {
                                                        const display = getShiftDisplayConfig(shift);
                                                        return (
                                                            <div 
                                                                key={shift.id} 
                                                                className={`p-1.5 rounded text-xs font-semibold ${display.color} cursor-move`}
                                                                onClick={(e) => { e.stopPropagation(); handleCellClick(staff, day, shift); }}
                                                                draggable
                                                                onDragStart={(e) => handleDragStart(e, shift, staff)}
                                                            >
                                                                <p>{display.isLeave ? 'Nghỉ phép' : display.time}</p>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                {appointmentsForCell.length > 0 && (
                                                    <div className="text-xs text-gray-600 mt-2 font-semibold">
                                                        {appointmentsForCell.length} lịch hẹn
                                                    </div>
                                                )}
                                                {hasConflict && (
                                                    <div className="mt-1 flex items-center gap-1 text-xs text-red-600">
                                                        <AlertIcon className="w-4 h-4" />
                                                        <span>Chồng lịch</span>
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
