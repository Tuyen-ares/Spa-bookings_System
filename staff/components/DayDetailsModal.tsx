import React, { useState, useMemo, useEffect } from 'react';
import type { User, StaffShift } from '../../types';
import { PlusIcon, EditIcon, TrashIcon, XCircleIcon, CheckCircleIcon, PendingIcon } from '../../shared/icons';

interface DayDetailsModalProps {
    currentUser: User;
    dayInfo: {
        dateString: string;
        dayOfMonth: number;
        shifts: StaffShift[];
    };
    onClose: () => void;
    onSaveShiftRequest: (shift: StaffShift) => void;
    onUpdateShiftRequest: (shift: StaffShift) => void;
    onDeleteShiftRequest: (shiftId: string) => void;
}

const DayDetailsModal: React.FC<DayDetailsModalProps> = ({
    currentUser,
    dayInfo,
    onClose,
    onSaveShiftRequest,
    onUpdateShiftRequest,
    onDeleteShiftRequest,
}) => {
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [editingShift, setEditingShift] = useState<StaffShift | null>(null);
    const [shiftFormData, setShiftFormData] = useState<Partial<StaffShift>>({});
    const [formError, setFormError] = useState('');

    const todayString = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today.toISOString().split('T')[0];
    }, []);
    
    const isPastDate = useMemo(() => dayInfo.dateString < todayString, [dayInfo.dateString, todayString]);

    useEffect(() => {
        if (editingShift) {
            setShiftFormData(editingShift);
            setIsFormVisible(true);
        } else if (!dayInfo.shifts.length && !isPastDate) {
            setShiftFormData({
                staffId: currentUser.id,
                date: dayInfo.dateString,
                status: 'pending',
                id: `shift-${currentUser.id}-${dayInfo.dateString}-${Date.now()}`
            });
            setIsFormVisible(true);
        } else {
            setIsFormVisible(false);
            setShiftFormData({});
        }
        setFormError('');
    }, [editingShift, dayInfo.shifts.length, dayInfo.dateString, currentUser.id, isPastDate]);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setShiftFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        if (isPastDate) {
            setFormError('Không thể gửi yêu cầu cho ngày đã qua.');
            return;
        }
        if (!shiftFormData.shiftType) {
            setFormError('Vui lòng chọn loại ca.');
            return;
        }
        const existingShiftOfSameType = dayInfo.shifts.find(s => s.shiftType === shiftFormData.shiftType && s.id !== shiftFormData.id);
        if (existingShiftOfSameType) {
            setFormError(`Đã có yêu cầu ca "${getShiftTypeDisplay(shiftFormData.shiftType)}" vào ngày này.`);
            return;
        }
        if (editingShift) {
            onUpdateShiftRequest(shiftFormData as StaffShift);
        } else {
            onSaveShiftRequest(shiftFormData as StaffShift);
        }
    };
    
    const handleEditClick = (shift: StaffShift) => {
        if (isPastDate || shift.status !== 'pending') return;
        setEditingShift(shift);
    };

    const handleCancelEdit = () => {
        setEditingShift(null);
        setIsFormVisible(false);
        setShiftFormData({});
        setFormError('');
    };
    
    const getShiftTypeDisplay = (type?: StaffShift['shiftType']) => {
        switch (type) {
            case 'morning': return 'Sáng (9h-13h)';
            case 'afternoon': return 'Chiều (13h-17h)';
            case 'evening': return 'Tối (17h-21h)';
            case 'leave': return 'Nghỉ phép';
            default: return 'Không xác định';
        }
    };

    const getShiftStatusBadge = (status: StaffShift['status']) => {
        switch (status) {
            case 'approved': return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800 flex items-center gap-1"><CheckCircleIcon className="w-3 h-3" /> Duyệt</span>;
            case 'pending': return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 flex items-center gap-1"><PendingIcon className="w-3 h-3" /> Chờ</span>;
            case 'rejected': return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800 flex items-center gap-1"><XCircleIcon className="w-3 h-3" /> Từ chối</span>;
            default: return null;
        }
    };

    const handleConfirmDelete = (shift: StaffShift) => {
        if (isPastDate || shift.status !== 'pending') return;
        if (window.confirm('Bạn có chắc chắn muốn xóa yêu cầu ca làm này?')) {
            onDeleteShiftRequest(shift.id);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-gray-800">
                            {editingShift ? 'Chỉnh sửa yêu cầu' : isFormVisible ? 'Đăng ký ca' : `Lịch ngày ${dayInfo.dayOfMonth}`}
                        </h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-800 text-3xl font-light">&times;</button>
                    </div>
                    <p className="text-gray-600 mb-4">Ngày: <strong className="text-brand-dark">{new Date(dayInfo.dateString).toLocaleDateString('vi-VN')}</strong></p>
                    
                    {!isFormVisible && dayInfo.shifts.length > 0 && (
                        <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                            {dayInfo.shifts.map(shift => (
                                <div key={shift.id} className="p-3 rounded-md border flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-gray-800">{getShiftTypeDisplay(shift.shiftType)}</p>
                                        {shift.notes && <p className="text-xs text-gray-500 italic">Ghi chú: {shift.notes}</p>}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {getShiftStatusBadge(shift.status)}
                                        {shift.status === 'pending' && !isPastDate && (
                                            <>
                                                <button onClick={() => handleEditClick(shift)} className="p-1.5 rounded-full hover:bg-gray-100"><EditIcon className="w-4 h-4" /></button>
                                                <button onClick={() => handleConfirmDelete(shift)} className="p-1.5 rounded-full text-red-600 hover:bg-red-100"><TrashIcon className="w-4 h-4" /></button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {isFormVisible && !isPastDate && (
                        <form onSubmit={handleFormSubmit} className="space-y-4 pt-4 border-t">
                            {formError && <div className="bg-red-100 text-red-700 p-3 rounded-md text-sm">{formError}</div>}
                            <div>
                                <label htmlFor="shiftType" className="block text-sm font-medium text-gray-700">Loại ca</label>
                                <select id="shiftType" name="shiftType" value={shiftFormData.shiftType || ''} onChange={handleFormChange} className="mt-1 w-full p-2 border rounded" required>
                                    <option value="">Chọn loại ca</option>
                                    <option value="morning">Sáng (9h-13h)</option>
                                    <option value="afternoon">Chiều (13h-17h)</option>
                                    <option value="evening">Tối (17h-21h)</option>
                                    <option value="leave">Nghỉ phép</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Ghi chú (tùy chọn)</label>
                                <textarea id="notes" name="notes" value={shiftFormData.notes || ''} onChange={handleFormChange} className="mt-1 w-full p-2 border rounded" rows={2} />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                {(dayInfo.shifts.length > 0 || editingShift) && <button type="button" onClick={handleCancelEdit} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Hủy</button>}
                                <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-dark">{editingShift ? 'Lưu' : 'Gửi yêu cầu'}</button>
                            </div>
                        </form>
                    )}

                    {!isFormVisible && !isPastDate && (
                        <button
                            onClick={() => { setIsFormVisible(true); setEditingShift(null); setShiftFormData({ staffId: currentUser.id, date: dayInfo.dateString, status: 'pending', id: `shift-${currentUser.id}-${dayInfo.dateString}-${Date.now()}` }); }}
                            className="w-full mt-4 bg-brand-secondary text-brand-dark font-semibold py-2 rounded-md hover:bg-brand-primary hover:text-white flex items-center justify-center gap-2"
                        >
                            <PlusIcon className="w-5 h-5"/> Đăng ký ca / Xin nghỉ
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DayDetailsModal;