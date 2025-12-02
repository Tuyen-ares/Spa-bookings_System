import React, { useState, useMemo, useEffect } from 'react';
import type { Promotion, Service, PromotionTargetAudience, Tier } from '../../types';
// Removed MOCK_SERVICES, PROMOTION_TARGET_AUDIENCES as they are passed as props

interface AddEditPromotionModalProps {
    promotion: Promotion | null;
    onClose: () => void;
    onSave: (promotion: Promotion) => void;
    allServices: Service[]; // Prop from parent
    allTiers: Tier[]; // Prop from parent
    defaultTierLevel?: number | null; // Tier level khi tạo voucher VIP mới
}

const AddEditPromotionModal: React.FC<AddEditPromotionModalProps> = ({ promotion, onClose, onSave, allServices, allTiers, defaultTierLevel }) => {
    // Xác định targetAudience mặc định: nếu có defaultTierLevel thì dùng nó, nếu không thì dùng 'All'
    const getDefaultTargetAudience = (): PromotionTargetAudience => {
        if (defaultTierLevel !== null && defaultTierLevel !== undefined) {
            return `Tier Level ${defaultTierLevel}` as PromotionTargetAudience;
        }
        return 'All';
    };

    const [formData, setFormData] = useState<Partial<Promotion>>(promotion || {
        title: '',
        description: '',
        code: '',
        expiryDate: '',
        discountType: 'percentage',
        discountValue: 0,
        termsAndConditions: '',
        targetAudience: getDefaultTargetAudience(),
        applicableServiceIds: [],
        minOrderValue: 0,
        isPublic: true, // Default to public (sẽ được override nếu là VIP voucher)
        pointsRequired: null,
    });
    
    // State for minSessions (số buổi tối thiểu) - lưu trong termsAndConditions dưới dạng JSON
    const [minSessions, setMinSessions] = useState<number | null>(null);

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
            setHasManuallyDeselectedAll(false); // Reset flag khi load promotion
            
            // Parse minSessions from termsAndConditions (JSON format: {"minSessions": 10})
            let parsedMinSessions: number | null = null;
            let cleanTermsAndConditions = promotion.termsAndConditions || '';
            if (promotion.termsAndConditions) {
                try {
                    // Try to parse as JSON
                    const parsed = JSON.parse(promotion.termsAndConditions);
                    if (parsed && typeof parsed.minSessions === 'number') {
                        parsedMinSessions = parsed.minSessions;
                        // Remove minSessions from JSON, keep other fields if any
                        const { minSessions: _, ...rest } = parsed;
                        if (Object.keys(rest).length > 0) {
                            cleanTermsAndConditions = JSON.stringify(rest);
                        } else {
                            cleanTermsAndConditions = '';
                        }
                    }
                } catch (e) {
                    // Not JSON, keep as is (regular text)
                    cleanTermsAndConditions = promotion.termsAndConditions;
                }
            }
            setMinSessions(parsedMinSessions);
            
            setFormData({
                ...promotion,
                isPublic: normalizedIsPublic, // Ensure it's a boolean
                pointsRequired: promotion.pointsRequired ? Number(promotion.pointsRequired) : null,
                applicableServiceIds: applicableServiceIds,
                termsAndConditions: cleanTermsAndConditions, // Set clean terms (without minSessions JSON)
            });
        } else {
            // Reset form when no promotion (creating new)
            setSelectAllServices(true); // Mặc định chọn "Tất cả"
            setHasManuallyDeselectedAll(false); // Reset flag khi tạo mới
            setMinSessions(null); // Reset minSessions
            
            // Xác định targetAudience: nếu có defaultTierLevel thì dùng nó
            const defaultTargetAudience = getDefaultTargetAudience();
            const isVIPTier = defaultTierLevel !== null && defaultTierLevel !== undefined;
            
            setFormData({
                title: '',
                description: '',
                code: '',
                expiryDate: '',
                discountType: 'percentage',
                discountValue: 0,
                termsAndConditions: '',
                targetAudience: defaultTargetAudience,
                applicableServiceIds: [],
                minOrderValue: 0,
                isPublic: isVIPTier ? false : true, // VIP voucher mặc định là private
                pointsRequired: null,
            });
        }
    }, [promotion, defaultTierLevel]);

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
    const [hasManuallyDeselectedAll, setHasManuallyDeselectedAll] = useState(false);

    useEffect(() => {
        // Chỉ tự động update nếu không phải đang manually select all
        if (isManuallySelectingAll) {
            return;
        }
        
        // Nếu user đã manually bỏ chọn "Tất cả", không tự động set lại
        if (hasManuallyDeselectedAll) {
            return;
        }
        
        // Kiểm tra nếu applicableServiceIds = [] hoặc null => áp dụng cho tất cả
        // Hoặc nếu tất cả dịch vụ đều được chọn => set selectAllServices = true
        const serviceIds = formData.applicableServiceIds || [];
        if (serviceIds.length === 0 || (serviceIds.length === allServices.length && allServices.length > 0)) {
            setSelectAllServices(true);
            setHasManuallyDeselectedAll(false); // Reset flag khi tự động set về true
        } else {
            setSelectAllServices(false);
        }
    }, [formData.applicableServiceIds, allServices, isManuallySelectingAll, hasManuallyDeselectedAll]);

    const handleSelectAllChange = (checked: boolean) => {
        setIsManuallySelectingAll(true);
        setSelectAllServices(checked);
        if (checked) {
            // Chọn tất cả => xóa tất cả các dịch vụ khác (để trống = áp dụng cho tất cả)
            setFormData(prev => ({ ...prev, applicableServiceIds: [] }));
            setHasManuallyDeselectedAll(false); // Reset flag khi chọn lại "Tất cả"
        } else {
            // Bỏ chọn "Tất cả" => set flag để không tự động tích lại
            setHasManuallyDeselectedAll(true);
            // Giữ nguyên applicableServiceIds hiện tại (không clear)
            // User sẽ chọn các dịch vụ cụ thể sau đó
        }
        // Reset flag sau một chút để useEffect có thể hoạt động lại
        setTimeout(() => setIsManuallySelectingAll(false), 100);
    };

    const handleServiceSelectionChange = (serviceId: string, checked: boolean) => {
        setIsManuallySelectingAll(true);
        // Khi chọn/bỏ chọn dịch vụ riêng lẻ, tự động bỏ chọn "Tất cả"
        setSelectAllServices(false);
        setHasManuallyDeselectedAll(true); // Đánh dấu đã manually bỏ chọn "Tất cả"
        
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
        
        // Kiểm tra xem có phải voucher VIP không
        const isVIPTierVoucher = formData.targetAudience && 
            typeof formData.targetAudience === 'string' && 
            formData.targetAudience.startsWith('Tier Level');
        
        // Ensure isPublic is properly set (boolean, not undefined)
        // formData.isPublic should already be a boolean from the checkbox
        // Đối với voucher VIP, luôn set isPublic = false
        let isPublicValue: boolean;
        if (isVIPTierVoucher) {
            // Voucher VIP: luôn là private (isPublic = false)
            isPublicValue = false;
        } else {
            isPublicValue = formData.isPublic !== false && formData.isPublic !== undefined;
        }
        
        // If switching to private, ensure pointsRequired is set (chỉ cho voucher thường, không phải VIP)
        if (!isPublicValue && !isVIPTierVoucher) {
            const pointsValue = formData.pointsRequired ? Number(formData.pointsRequired) : null;
            if (!pointsValue || pointsValue <= 0) {
                alert('Vui lòng nhập số điểm cần thiết để đổi voucher (phải lớn hơn 0) khi chuyển sang voucher riêng tư.');
                return;
            }
        }
        
        // Merge minSessions into termsAndConditions as JSON
        let finalTermsAndConditions = formData.termsAndConditions || '';
        if (minSessions !== null && minSessions > 0) {
            try {
                // Try to parse existing termsAndConditions as JSON
                let termsObj: any = {};
                if (finalTermsAndConditions) {
                    try {
                        termsObj = JSON.parse(finalTermsAndConditions);
                    } catch (e) {
                        // Not JSON, treat as plain text - store in a field
                        if (finalTermsAndConditions.trim()) {
                            termsObj.text = finalTermsAndConditions;
                        }
                    }
                }
                // Add minSessions to JSON
                termsObj.minSessions = minSessions;
                finalTermsAndConditions = JSON.stringify(termsObj);
            } catch (e) {
                // Fallback: just create JSON with minSessions
                finalTermsAndConditions = JSON.stringify({ minSessions });
            }
        } else if (minSessions === null || minSessions === 0) {
            // Remove minSessions from JSON if it exists
            if (finalTermsAndConditions) {
                try {
                    const termsObj = JSON.parse(finalTermsAndConditions);
                    const { minSessions: _, ...rest } = termsObj;
                    if (Object.keys(rest).length > 0) {
                        // If there's a 'text' field, extract it; otherwise stringify the rest
                        if (rest.text) {
                            finalTermsAndConditions = rest.text;
                        } else {
                            finalTermsAndConditions = JSON.stringify(rest);
                        }
                    } else {
                        finalTermsAndConditions = '';
                    }
                } catch (e) {
                    // Not JSON, keep as is
                }
            }
        }
        
        const submitData = {
            ...formData,
            isPublic: isPublicValue, // Explicitly set to boolean
            termsAndConditions: finalTermsAndConditions, // Include minSessions in JSON
            // Đối với voucher VIP, không cần pointsRequired
            // Đối với voucher thường: If isPublic is false and pointsRequired is empty/null, set to null
            // If isPublic is true, pointsRequired should be null
            pointsRequired: isVIPTierVoucher 
                ? null // Voucher VIP không cần pointsRequired
                : (!isPublicValue 
                    ? (formData.pointsRequired && formData.pointsRequired > 0 ? Number(formData.pointsRequired) : null)
                    : null),
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

    // Check if this is a VIP tier voucher
    const isVIPTierVoucher = useMemo(() => {
        return formData.targetAudience && formData.targetAudience.startsWith('Tier Level');
    }, [formData.targetAudience]);

    // Get tier info if this is a VIP tier voucher
    const tierInfo = useMemo(() => {
        if (!isVIPTierVoucher) return null;
        const tierLevel = parseInt(formData.targetAudience.replace('Tier Level ', ''));
        return allTiers.find(t => t.level === tierLevel);
    }, [isVIPTierVoucher, formData.targetAudience, allTiers]);

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
                                {isVIPTierVoucher && tierInfo ? (
                                    // Hiển thị thông tin tier khi đang tạo voucher VIP
                                    <div className="mt-1">
                                        <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-2 rounded-lg" style={{ borderColor: tierInfo.color || '#3B82F6' }}>
                                            <div className="flex items-start gap-3">
                                                <div className="flex-shrink-0">
                                                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: tierInfo.color || '#3B82F6' }}>
                                                        {tierInfo.level}
                                                    </div>
                                                </div>
                                                <div className="flex-grow">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" style={{ color: tierInfo.color || '#3B82F6' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                                        </svg>
                                                        <p className="text-sm font-bold" style={{ color: tierInfo.color || '#3B82F6' }}>
                                                            Voucher VIP - Hạng {tierInfo.level}: {tierInfo.name}
                                                        </p>
                                                    </div>
                                                    <p className="text-xs text-gray-600 mt-1">
                                                        📅 Voucher này sẽ được gửi tự động mỗi tháng cho khách hàng ở hạng <strong>{tierInfo.name}</strong>
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1 italic">
                                                        Hệ thống sẽ tự động gửi voucher này vào ngày đầu tiên của mỗi tháng
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <input type="hidden" name="targetAudience" value={formData.targetAudience} />
                                    </div>
                                ) : (
                                    <select name="targetAudience" value={formData.targetAudience} onChange={handleChange} className="mt-1 w-full p-2 border rounded">
                                        <option value="All">Tất cả đối tượng</option>
                                        <option value="New Clients">Khách hàng mới</option>
                                        <option value="Birthday">Khách hàng sinh nhật</option>
                                    </select>
                                )}
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
                                <label className="block text-sm font-medium text-gray-700">Số buổi tối thiểu</label>
                                <input 
                                    type="number" 
                                    value={minSessions || ''} 
                                    onChange={(e) => {
                                        const value = e.target.value === '' ? null : parseInt(e.target.value, 10);
                                        setMinSessions(value && value > 0 ? value : null);
                                    }}
                                    min="1" 
                                    placeholder="Để trống = không yêu cầu" 
                                    className="mt-1 w-full p-2 border rounded" 
                                />
                                <p className="text-xs text-gray-500 mt-1">Voucher chỉ áp dụng khi đặt dịch vụ với số buổi &gt;= số này</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Số lượng (lượt sử dụng)</label>
                                <input type="number" name="stock" value={formData.stock || ''} onChange={handleChange} min="0" placeholder="Để trống = không giới hạn" className="mt-1 w-full p-2 border rounded" />
                            </div>
                            
                            {/* Ẩn field isPublic khi đang tạo voucher VIP */}
                            {!isVIPTierVoucher && (
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
                            )}
                            
                            {/* Hiển thị thông báo cho voucher VIP */}
                            {isVIPTierVoucher && (
                                <div className="md:col-span-2">
                                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <p className="text-sm text-blue-800">
                                            <strong>ℹ️ Lưu ý:</strong> Voucher VIP sẽ được gửi tự động cho khách hàng ở hạng tương ứng mỗi tháng. 
                                            Không cần thiết lập "Voucher công khai" hay "Voucher riêng tư" cho loại voucher này.
                                        </p>
                                    </div>
                                    <input type="hidden" name="isPublic" value="false" />
                                </div>
                            )}
                            
                            {formData.isPublic === false && !isVIPTierVoucher && (
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