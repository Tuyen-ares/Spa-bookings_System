import React, { useState, useMemo, useEffect } from 'react';
import type { Promotion, Service, PromotionTargetAudience, Tier } from '../../types';
// Removed MOCK_SERVICES, PROMOTION_TARGET_AUDIENCES as they are passed as props

interface AddEditPromotionModalProps {
    promotion: Promotion | null;
    onClose: () => void;
    onSave: (promotion: Promotion) => void;
    allServices: Service[]; // Prop from parent
    allTiers: Tier[]; // Prop from parent
}

const AddEditPromotionModal: React.FC<AddEditPromotionModalProps> = ({ promotion, onClose, onSave, allServices, allTiers }) => {
    const [formData, setFormData] = useState<Partial<Promotion>>(promotion || {
        title: '',
        description: '',
        code: '',
        expiryDate: '',
        imageUrl: '',
        discountType: 'percentage',
        discountValue: 0,
        termsAndConditions: '',
        targetAudience: 'All',
        applicableServiceIds: [],
        minOrderValue: 0,
    });
    const [imagePreview, setImagePreview] = useState<string>(promotion?.imageUrl || '');

    const serviceCategories = useMemo(() => {
        const categories = new Set(allServices.map(s => s.category));
        return Array.from(categories);
    }, [allServices]);

    useEffect(() => {
        if (promotion) {
            setFormData({
                ...promotion,
                applicableServiceIds: promotion.applicableServiceIds || [],
            });
            setImagePreview(promotion.imageUrl || '');
        }
    }, [promotion]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'number') {
            setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }

        if (name === 'imageUrl') {
            setImagePreview(value);
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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setImagePreview(result);
                setFormData(prev => ({ ...prev, imageUrl: result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as Promotion);
    };

    const getTierLevelOptions = useMemo(() => {
      return allTiers.map(tier => `Tier Level ${tier.level}` as PromotionTargetAudience);
    }, [allTiers]);

    const audienceOptions = useMemo(() => {
        const promoTargetAudiences: PromotionTargetAudience[] = [
            'All',
            'New Clients',
            'Birthday',
            'VIP',
        ];
        return [...promoTargetAudiences.filter(a => !a.startsWith('Tier Level')), ...getTierLevelOptions];
    }, [getTierLevelOptions]);


    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 max-h-[80vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">{promotion ? 'Chỉnh sửa Khuyến mãi' : 'Thêm Khuyến mãi mới'}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Tiêu đề</label>
                                <input type="text" name="title" value={formData.title || ''} onChange={handleChange} className="mt-1 w-full p-2 border rounded" required />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Mô tả</label>
                                <textarea name="description" value={formData.description || ''} onChange={handleChange} rows={3} className="mt-1 w-full p-2 border rounded" required></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Mã khuyến mãi</label>
                                <input type="text" name="code" value={formData.code || ''} onChange={handleChange} className="mt-1 w-full p-2 border rounded" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Ngày hết hạn</label>
                                <input type="date" name="expiryDate" value={formData.expiryDate?.split('T')[0] || ''} onChange={handleChange} className="mt-1 w-full p-2 border rounded" required />
                            </div>
                            
                            {/* Image Upload Section */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Hình ảnh</label>
                                <div className="mt-1 flex items-center gap-4">
                                    <div className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-md flex items-center justify-center">
                                        {imagePreview ? (
                                            <img src={imagePreview} alt="Xem trước" className="w-full h-full object-cover rounded-md" />
                                        ) : (
                                            <span className="text-xs text-gray-500 text-center">Xem trước</span>
                                        )}
                                    </div>
                                    <div className="flex-grow">
                                        <label htmlFor="imageUrl" className="block text-xs font-medium text-gray-500">Dán liên kết ảnh</label>
                                        <input type="text" name="imageUrl" id="imageUrl" value={formData.imageUrl || ''} onChange={handleChange} className="mt-1 w-full p-2 border rounded text-sm" placeholder="https://picsum.photos/..." />
                                        <div className="relative text-center my-2">
                                            <div className="absolute inset-y-1/2 left-0 w-full h-px bg-gray-200"></div>
                                            <span className="relative text-xs text-gray-400 bg-white px-2">hoặc</span>
                                        </div>
                                        <label htmlFor="file-upload" className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 w-full text-center block">Tải lên từ máy</label>
                                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Loại giảm giá</label>
                                <select name="discountType" value={formData.discountType} onChange={handleChange} className="mt-1 w-full p-2 border rounded">
                                    <option value="percentage">Phần trăm (%)</option>
                                    <option value="fixed">Cố định (VND)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Giá trị giảm giá</label>
                                <input type="number" name="discountValue" value={formData.discountValue} onChange={handleChange} className="mt-1 w-full p-2 border rounded" required />
                            </div>
                            
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Đối tượng áp dụng</label>
                                <select name="targetAudience" value={formData.targetAudience} onChange={handleChange} className="mt-1 w-full p-2 border rounded">
                                    {audienceOptions.map(audience => (
                                        <option key={audience} value={audience}>{audience}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Dịch vụ áp dụng (Chọn nhiều)</label>
                                <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-md border border-gray-200 max-h-40 overflow-y-auto">
                                    {allServices.map(service => (
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

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Giá trị đơn hàng tối thiểu (VND)</label>
                                <input type="number" name="minOrderValue" value={formData.minOrderValue} onChange={handleChange} className="mt-1 w-full p-2 border rounded" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Số lượng (lượt sử dụng)</label>
                                <input type="number" name="stock" value={formData.stock || ''} onChange={handleChange} placeholder="Để trống = không giới hạn" className="mt-1 w-full p-2 border rounded" />
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

export default AddEditPromotionModal;