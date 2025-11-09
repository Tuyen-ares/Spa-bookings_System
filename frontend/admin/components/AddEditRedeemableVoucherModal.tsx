

import React, { useState, useMemo, useEffect } from 'react';
import type { RedeemableVoucher, Service, PromotionTargetAudience, Tier } from '../../types';

interface AddEditRedeemableVoucherModalProps {
    voucher: RedeemableVoucher | null;
    onClose: () => void;
    onSave: (voucher: RedeemableVoucher) => void;
    // FIX: Added allServices and allTiers props
    allServices: Service[]; 
    allTiers: Tier[]; 
}

const AddEditRedeemableVoucherModal: React.FC<AddEditRedeemableVoucherModalProps> = ({ voucher, onClose, onSave, allServices, allTiers }) => {
    const [formData, setFormData] = useState<Partial<RedeemableVoucher>>(voucher || {
        description: '',
        pointsRequired: 0,
        value: 0,
        applicableServiceIds: [],
        targetAudience: 'All',
    });

    useEffect(() => {
        if (voucher) {
            setFormData({
                ...voucher,
                applicableServiceIds: voucher.applicableServiceIds || [],
            });
        }
    }, [voucher]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'number') {
            setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleServiceSelectionChange = (serviceId: string, checked: boolean) => {
        setFormData(prev => {
            const currentServiceIds = prev.applicableServiceIds ? [...prev.applicableServiceIds] : [];
            if (checked) {
                return { ...prev, applicableServiceIds: [...currentServiceIds, serviceId] };
            } else {
                return { ...prev, applicableServiceIds: currentServiceIds.filter(id => id !== serviceId) };
            }
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as RedeemableVoucher);
    };

    const getTierLevelOptions = useMemo(() => {
      // FIX: Use allTiers prop instead of MOCK_TIERS
      return allTiers.map(tier => `Tier Level ${tier.level}` as PromotionTargetAudience);
    }, [allTiers]);


    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 max-h-[80vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">{voucher ? 'Chỉnh sửa Voucher đổi điểm' : 'Thêm Voucher đổi điểm mới'}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Mô tả Voucher</label>
                                <input type="text" name="description" value={formData.description || ''} onChange={handleChange} className="mt-1 w-full p-2 border rounded" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Điểm yêu cầu</label>
                                <input type="number" name="pointsRequired" value={formData.pointsRequired || 0} onChange={handleChange} className="mt-1 w-full p-2 border rounded" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Giá trị Voucher (VND)</label>
                                <input type="number" name="value" value={formData.value || 0} onChange={handleChange} className="mt-1 w-full p-2 border rounded" required />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Đối tượng có thể đổi</label>
                                <select name="targetAudience" value={formData.targetAudience} onChange={handleChange} className="mt-1 w-full p-2 border rounded">
                                    <option value="All">Tất cả khách hàng</option>
                                    <option value="VIP">Khách hàng VIP</option>
                                    {getTierLevelOptions.map(tier => (
                                        <option key={tier} value={tier}>{tier}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Dịch vụ áp dụng (Chọn nhiều)</label>
                                <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-md border border-gray-200 max-h-40 overflow-y-auto">
                                    {allServices.map(service => ( // FIX: Use allServices prop instead of MOCK_SERVICES
                                        <label key={service.id} className="flex items-center gap-2 text-sm text-gray-800">
                                            <input
                                                type="checkbox"
                                                checked={formData.applicableServiceIds?.includes(service.id) || false}
                                                onChange={(e) => handleServiceSelectionChange(service.id, e.target.checked)}
                                                className="rounded text-brand-primary focus:ring-brand-primary"
                                            />
                                            {service.name} ({service.category})
                                        </label>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Để trống nếu áp dụng cho tất cả dịch vụ.</p>
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

export default AddEditRedeemableVoucherModal;