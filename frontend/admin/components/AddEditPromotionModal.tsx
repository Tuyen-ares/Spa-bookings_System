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
        discountType: 'percentage',
        discountValue: 0,
        termsAndConditions: '',
        targetAudience: 'All',
        applicableServiceIds: [],
        minOrderValue: 0,
        isPublic: true, // Default to public
        pointsRequired: null,
    });

    const serviceCategories = useMemo(() => {
        const categories = new Set(allServices.map(s => s.categoryId));
        return Array.from(categories);
    }, [allServices]);

    useEffect(() => {
        if (promotion) {
            // Normalize isPublic: convert 0/1/null/true/false to boolean
            let normalizedIsPublic: boolean;
            // Coerce to string for safe comparisons across boolean/number/string/null
            const isPublicStr = String(promotion.isPublic).toLowerCase();
            normalizedIsPublic = isPublicStr === 'true' || isPublicStr === '1';
            
            const applicableServiceIds = promotion.applicableServiceIds || [];
            // Nếu applicableServiceIds = null hoặc rỗng => áp dụng cho tất cả
            const isSelectAll = !applicableServiceIds || applicableServiceIds.length === 0;
            setSelectAllServices(isSelectAll);
            
            setFormData({
                ...promotion,
                isPublic: normalizedIsPublic, // Ensure it's a boolean
                pointsRequired: promotion.pointsRequired ? Number(promotion.pointsRequired) : null,
                applicableServiceIds: applicableServiceIds,
            });
        } else {
            // Reset form when no promotion (creating new)
            setSelectAllServices(true); // Mặc định chọn "Tất cả"
            setFormData({
                title: '',
                description: '',
                code: '',
                expiryDate: '',
                discountType: 'percentage',
                discountValue: 0,
                termsAndConditions: '',
                targetAudience: 'All',
                applicableServiceIds: [],
                minOrderValue: 0,
                isPublic: true, // Default to public
                pointsRequired: null,
            });
        }
    }, [promotion]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'number') {
            // For pointsRequired, allow null/empty (user can leave it blank)
            if (name === 'pointsRequired') {
                const numValue = value === '' ? null : parseInt(value);
                // Không được âm
                if (numValue !== null && numValue < 0) {
                    return; // Không cập nhật nếu giá trị âm
                }
                setFormData(prev => ({ 
                    ...prev, 
                    [name]: numValue
                }));
            } else if (name === 'stock') {
                // Stock: cho phép null/empty hoặc số >= 0
                const numValue = value === '' ? null : parseInt(value);
                if (numValue !== null && numValue < 0) {
                    return; // Không cập nhật nếu giá trị âm
                }
                setFormData(prev => ({ ...prev, [name]: numValue }));
            } else if (name === 'minOrderValue') {
                // minOrderValue: không được âm
                const numValue = parseFloat(value) || 0;
                if (numValue < 0) {
                    return; // Không cập nhật nếu giá trị âm
                }
                setFormData(prev => ({ ...prev, [name]: numValue }));
            } else {
                const numValue = parseFloat(value) || 0;
                // Không được âm cho các trường số khác
                if (numValue < 0) {
                    return;
                }
                setFormData(prev => ({ ...prev, [name]: numValue }));
            }
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }

    };

    // State để track checkbox "Tất cả"
    const [selectAllServices, setSelectAllServices] = useState(false);
    const [isManuallySelectingAll, setIsManuallySelectingAll] = useState(false);

    useEffect(() => {
        // Chỉ tự động update nếu không phải đang manually select all
        if (isManuallySelectingAll) {
            return;
        }
        
        // Kiểm tra nếu applicableServiceIds = [] hoặc null => áp dụng cho tất cả
        // Hoặc nếu tất cả dịch vụ đều được chọn => set selectAllServices = true
        const serviceIds = formData.applicableServiceIds || [];
        if (serviceIds.length === 0 || (serviceIds.length === allServices.length && allServices.length > 0)) {
            setSelectAllServices(true);
        } else {
            setSelectAllServices(false);
        }
    }, [formData.applicableServiceIds, allServices, isManuallySelectingAll]);

    const handleSelectAllChange = (checked: boolean) => {
        setIsManuallySelectingAll(true);
        setSelectAllServices(checked);
        if (checked) {
            // Chọn tất cả => xóa tất cả các dịch vụ khác (để trống = áp dụng cho tất cả)
            setFormData(prev => ({ ...prev, applicableServiceIds: [] }));
        }
        // Không cần else vì khi bỏ chọn "Tất cả", user sẽ chọn các dịch vụ cụ thể
        // Reset flag sau một chút để useEffect có thể hoạt động lại
        setTimeout(() => setIsManuallySelectingAll(false), 100);
    };

    const handleServiceSelectionChange = (serviceId: string, checked: boolean) => {
        setIsManuallySelectingAll(true);
        // Khi chọn/bỏ chọn dịch vụ riêng lẻ, tự động bỏ chọn "Tất cả"
        setSelectAllServices(false);
        
        setFormData(prev => {
            const currentServiceIds = prev.applicableServiceIds ? [...prev.applicableServiceIds] : [];
            if (checked) {
                // Thêm dịch vụ vào danh sách
                return { ...prev, applicableServiceIds: [...currentServiceIds, serviceId] };
            } else {
                // Xóa dịch vụ khỏi danh sách
                return { ...prev, applicableServiceIds: currentServiceIds.filter(id => id !== serviceId) };
            }
        });
        // Reset flag sau một chút để useEffect có thể hoạt động lại
        setTimeout(() => setIsManuallySelectingAll(false), 100);
    };


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validation: Không được âm
        if (formData.minOrderValue !== undefined && formData.minOrderValue < 0) {
            alert('Giá trị đơn hàng tối thiểu không được âm.');
            return;
        }
        if (formData.stock !== null && formData.stock !== undefined && formData.stock < 0) {
            alert('Số lượng không được âm.');
            return;
        }
        if (formData.pointsRequired !== null && formData.pointsRequired !== undefined && formData.pointsRequired < 0) {
            alert('Số điểm cần thiết không được âm.');
            return;
        }
        
        // Validation: Phải chọn ít nhất 1 dịch vụ hoặc chọn "Tất cả"
        // Nếu selectAllServices = true hoặc applicableServiceIds rỗng => áp dụng cho tất cả (OK)
        // Nếu applicableServiceIds có ít nhất 1 phần tử => OK
        // Không cần validation vì để trống = áp dụng cho tất cả
        
        // Ensure isPublic is properly set (boolean, not undefined)
        // formData.isPublic should already be a boolean from the checkbox
        const isPublicValue = formData.isPublic !== false && formData.isPublic !== undefined;
        
        // If switching to private, ensure pointsRequired is set
        if (!isPublicValue) {
            const pointsValue = formData.pointsRequired ? Number(formData.pointsRequired) : null;
            if (!pointsValue || pointsValue <= 0) {
                alert('Vui lòng nhập số điểm cần thiết để đổi voucher (phải lớn hơn 0) khi chuyển sang voucher riêng tư.');
                return;
            }
        }
        
        const submitData = {
            ...formData,
            isPublic: isPublicValue, // Explicitly set to boolean
            // If isPublic is false and pointsRequired is empty/null, set to null
            // If isPublic is true, pointsRequired should be null
            pointsRequired: !isPublicValue 
                ? (formData.pointsRequired && formData.pointsRequired > 0 ? Number(formData.pointsRequired) : null)
                : null,
            // Nếu selectAllServices = true, set applicableServiceIds = null (áp dụng cho tất cả)
            applicableServiceIds: selectAllServices || !formData.applicableServiceIds || formData.applicableServiceIds.length === 0
                ? null
                : formData.applicableServiceIds
        };
        console.log('Submitting promotion data:', JSON.stringify(submitData, null, 2));
        onSave(submitData as Promotion);
    };

    const getTierLevelOptions = useMemo(() => {
      return allTiers.map(tier => `Tier Level ${tier.level}` as PromotionTargetAudience);
    }, [allTiers]);

    const audienceOptions = useMemo(() => {
        // Only show: All, New Clients, Birthday
        const promoTargetAudiences: PromotionTargetAudience[] = [
            'All',
            'New Clients',
            'Birthday',
        ];
        return promoTargetAudiences;
    }, []);


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
                                    <option value="All">Tất cả đối tượng</option>
                                    <option value="New Clients">Khách hàng mới</option>
                                    <option value="Birthday">Khách hàng sinh nhật</option>
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Dịch vụ áp dụng (Chọn nhiều)</label>
                                <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-md border border-gray-200 max-h-40 overflow-y-auto">
                                    {/* Checkbox "Tất cả" */}
                                    <label className="flex items-center gap-2 text-sm text-gray-800 font-semibold col-span-2 border-b pb-2 mb-1">
                                        <input
                                            type="checkbox"
                                            checked={selectAllServices}
                                            onChange={(e) => handleSelectAllChange(e.target.checked)}
                                            className="rounded text-brand-primary focus:ring-brand-primary"
                                        />
                                        Tất cả dịch vụ
                                    </label>
                                    {allServices.map(service => (
                                        <label key={service.id} className={`flex items-center gap-2 text-sm ${selectAllServices ? 'text-gray-400' : 'text-gray-800'}`}>
                                            <input
                                                type="checkbox"
                                                checked={selectAllServices || formData.applicableServiceIds?.includes(service.id) || false}
                                                onChange={(e) => handleServiceSelectionChange(service.id, e.target.checked)}
                                                disabled={selectAllServices}
                                                className="rounded text-brand-primary focus:ring-brand-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                            />
                                            {service.name} ({service.categoryId})
                                        </label>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Chọn "Tất cả dịch vụ" hoặc chọn các dịch vụ cụ thể. Phải chọn ít nhất 1.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Giá trị đơn hàng tối thiểu (VND)</label>
                                <input type="number" name="minOrderValue" value={formData.minOrderValue} onChange={handleChange} min="0" step="0.01" className="mt-1 w-full p-2 border rounded" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Số lượng (lượt sử dụng)</label>
                                <input type="number" name="stock" value={formData.stock || ''} onChange={handleChange} min="0" placeholder="Để trống = không giới hạn" className="mt-1 w-full p-2 border rounded" />
                            </div>
                            
                            <div className="md:col-span-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="isPublic"
                                        checked={formData.isPublic !== false}
                                        onChange={(e) => {
                                            setFormData(prev => ({ ...prev, isPublic: e.target.checked }));
                                        }}
                                        className="rounded text-brand-primary focus:ring-brand-primary w-4 h-4"
                                    />
                                    <span className="text-sm font-medium text-gray-700">
                                        Công khai (Public)
                                    </span>
                                </label>
                                <p className="text-xs text-gray-500 mt-1 ml-6">
                                    {formData.isPublic !== false 
                                        ? '✓ Voucher sẽ hiển thị công khai trên trang khách hàng' 
                                        : '⚠ Voucher riêng tư - chỉ ai biết mã hoặc được admin gửi mã mới có thể sử dụng'}
                                </p>
                            </div>
                            
                            {formData.isPublic === false && (
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Số điểm cần thiết để đổi voucher
                                    </label>
                                    <input 
                                        type="number" 
                                        name="pointsRequired" 
                                        value={formData.pointsRequired || ''} 
                                        onChange={handleChange} 
                                        min="0"
                                        placeholder="Nhập số điểm (ví dụ: 100)"
                                        className="mt-1 w-full p-2 border rounded" 
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Khách hàng cần có đủ số điểm này để đổi voucher. Để trống nếu không cho phép đổi bằng điểm.
                                    </p>
                                </div>
                            )}
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