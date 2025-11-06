import React, { useState, useEffect } from 'react';
import type { StaffTask, User } from '../../types';

interface AddEditTaskModalProps {
    task: StaffTask | null;
    staffMembers: User[];
    onClose: () => void;
    onSave: (taskData: Partial<StaffTask>) => void;
}

const AddEditTaskModal: React.FC<AddEditTaskModalProps> = ({ task, staffMembers, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<StaffTask>>({
        title: '',
        description: '',
        assignedToId: '',
        dueDate: new Date().toISOString().split('T')[0],
        priority: 'medium',
    });
    const [error, setError] = useState('');

    useEffect(() => {
        if (task) {
            setFormData({
                ...task,
                dueDate: task.dueDate.split('T')[0] // Format for date input
            });
        }
    }, [task]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.assignedToId || !formData.dueDate) {
            setError('Vui lòng điền đầy đủ các trường bắt buộc.');
            return;
        }
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">{task ? 'Chỉnh sửa Công việc' : 'Giao việc Mới'}</h2>
                        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Tiêu đề</label>
                                <input type="text" name="title" value={formData.title || ''} onChange={handleChange} className="mt-1 w-full p-2 border rounded" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Mô tả (tùy chọn)</label>
                                <textarea name="description" value={formData.description || ''} onChange={handleChange} rows={3} className="mt-1 w-full p-2 border rounded"></textarea>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Giao cho</label>
                                    <select name="assignedToId" value={formData.assignedToId || ''} onChange={handleChange} className="mt-1 w-full p-2 border rounded bg-white" required>
                                        <option value="">-- Chọn nhân viên --</option>
                                        {staffMembers.map(staff => (
                                            <option key={staff.id} value={staff.id}>{staff.name} ({staff.role})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Ngày hết hạn</label>
                                    <input type="date" name="dueDate" value={formData.dueDate || ''} onChange={handleChange} min={new Date().toISOString().split('T')[0]} className="mt-1 w-full p-2 border rounded" required />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Độ ưu tiên</label>
                                <select name="priority" value={formData.priority || 'medium'} onChange={handleChange} className="mt-1 w-full p-2 border rounded bg-white">
                                    <option value="low">Thấp</option>
                                    <option value="medium">Trung bình</option>
                                    <option value="high">Cao</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-6 py-4 flex justify-end gap-4 rounded-b-lg">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Hủy</button>
                        <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-dark">Lưu công việc</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddEditTaskModal;