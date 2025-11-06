import React, { useState, useEffect } from 'react';
import type { Tier } from '../../types';

interface AddEditTierModalProps {
    tier: Tier;
    onClose: () => void;
    onSave: (tier: Tier) => void;
}

const AddEditTierModal: React.FC<AddEditTierModalProps> = ({ tier, onClose, onSave }) => {
    const [formData, setFormData] = useState<Tier>(tier);

    useEffect(() => {
        setFormData(tier);
    }, [tier]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'number') {
            setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 max-h-[80vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Chỉnh sửa Hạng Thành viên: {tier.name}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Cấp độ</label>
                                <input type="number" name="level" value={formData.level} onChange={handleChange} className="mt-1 w-full p-2 border rounded bg-gray-100" readOnly />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Tên hạng</label>
                                <input type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 w-full p-2 border rounded" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Điểm yêu cầu</label>
                                <input type="number" name="pointsRequired" value={formData.pointsRequired} onChange={handleChange} className="mt-1 w-full p-2 border rounded" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Chi tiêu tối thiểu (VND)</label>
                                <input type="number" name="minSpendingRequired" value={formData.minSpendingRequired} onChange={handleChange} className="mt-1 w-full p-2 border rounded" required />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Màu sắc (Hex)</label>
                                <input type="color" name="color" value={formData.color} onChange={handleChange} className="mt-1 w-full h-10 border rounded cursor-pointer" title="Chọn màu cho cấp độ" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Màu chữ (Tailwind Class)</label>
                                <input type="text" name="textColor" value={formData.textColor} onChange={handleChange} className="mt-1 w-full p-2 border rounded" placeholder="e.g., text-yellow-500" />
                                <p className="text-xs text-gray-500 mt-1">Sử dụng class màu của Tailwind CSS (ví dụ: `text-yellow-500`).</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-6 py-4 flex justify-end gap-4 rounded-b-lg">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Hủy</button>
                        <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-dark">Lưu</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddEditTierModal;