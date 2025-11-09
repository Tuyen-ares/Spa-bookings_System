import React, { useState, useMemo, useEffect } from 'react';
import type { User, StaffShift, Appointment } from '../../types';

const SHIFT_TIMES = {
    morning: { start: '09:00', end: '13:00' },
    afternoon: { start: '13:00', end: '17:00' },
    evening: { start: '17:00', end: '21:00' },
};

interface AssignScheduleModalProps {
    context: {
        staff: User;
        date: string;
        shift?: StaffShift;
    };
    onClose: () => void;
    onSave: (shift: StaffShift) => void;
    onDelete: (shiftId: string) => void;
    allAppointments: Appointment[];
}

const AssignScheduleModal: React.FC<AssignScheduleModalProps> = ({ context, onClose, onSave, onDelete, allAppointments }) => {
    const { staff, date, shift } = context;

    const [shiftType, setShiftType] = useState<StaffShift['shiftType']>(shift?.shiftType || 'morning');
    const [shiftHours, setShiftHours] = useState(shift?.shiftHours || SHIFT_TIMES.morning);
    const [notes, setNotes] = useState(shift?.notes || '');
    const [error, setError] = useState('');

    useEffect(() => {
        if (shiftType !== 'custom' && shiftType !== 'leave') {
            setShiftHours(SHIFT_TIMES[shiftType as keyof typeof SHIFT_TIMES]);
        }
    }, [shiftType]);

    const conflictingAppointments = useMemo(() => {
        if (shiftType === 'leave') {
            return allAppointments.filter(a => a.therapistId === staff.id && a.date === date && a.status !== 'cancelled');
        }
        return [];
    }, [allAppointments, staff.id, date, shiftType]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (conflictingAppointments.length > 0) {
            setError(`Không thể gán ca nghỉ. Nhân viên đã có ${conflictingAppointments.length} lịch hẹn vào ngày này.`);
            return;
        }

        const finalShift: StaffShift = {
            id: shift?.id || `shift-${staff.id}-${date}-${Date.now()}`,
            staffId: staff.id,
            date: date,
            shiftType: shiftType,
            status: 'approved', // Admin directly approves
            shiftHours: shiftHours,
            notes: notes,
        };

        onSave(finalShift);
        onClose();
    };

    const handleDelete = () => {
        if (shift?.id) {
            onDelete(shift.id);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">{shift ? 'Chỉnh sửa ca làm' : 'Thêm ca làm mới'}</h2>
                        <p className="text-gray-600 mb-4">
                            Cho: <strong className="text-brand-dark">{staff.name}</strong> vào ngày <strong className="text-brand-dark">{new Date(date).toLocaleDateString('vi-VN')}</strong>
                        </p>

                        {error && <div className="bg-red-100 text-red-700 p-3 rounded-md text-sm mb-4" role="alert">{error}</div>}

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="shiftType" className="block text-sm font-medium text-gray-700">Loại ca</label>
                                <select id="shiftType" name="shiftType" value={shiftType} onChange={e => setShiftType(e.target.value as StaffShift['shiftType'])} className="mt-1 w-full p-2 border rounded" required>
                                    <option value="morning">Sáng (9h-13h)</option>
                                    <option value="afternoon">Chiều (13h-17h)</option>
                                    <option value="evening">Tối (17h-21h)</option>
                                    <option value="custom">Tùy chỉnh</option>
                                    <option value="leave">Nghỉ phép</option>
                                </select>
                            </div>

                            {shiftType !== 'leave' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">Giờ bắt đầu</label>
                                        <input type="time" id="startTime" value={shiftHours.start} onChange={e => setShiftHours(p => ({ ...p, start: e.target.value }))} className="mt-1 w-full p-2 border rounded" readOnly={shiftType !== 'custom'} required />
                                    </div>
                                    <div>
                                        <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">Giờ kết thúc</label>
                                        <input type="time" id="endTime" value={shiftHours.end} onChange={e => setShiftHours(p => ({ ...p, end: e.target.value }))} className="mt-1 w-full p-2 border rounded" readOnly={shiftType !== 'custom'} required />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Ghi chú (tùy chọn)</label>
                                <textarea id="notes" name="notes" value={notes} onChange={e => setNotes(e.target.value)} className="mt-1 w-full p-2 border rounded" rows={2} />
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-6 py-4 flex justify-between items-center rounded-b-lg">
                        <div>
                            {shift && (
                                <button type="button" onClick={handleDelete} className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm font-semibold">Xóa ca</button>
                            )}
                        </div>
                        <div className="flex gap-4">
                            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Hủy</button>
                            <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-dark">Lưu</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AssignScheduleModal;
