import React, { useState, useEffect, useMemo } from 'react';
import type { Promotion, Tier } from '../../types';
import AddEditPromotionModal from './AddEditPromotionModal';
import { PlusIcon, EditIcon, TrashIcon, TimerIcon } from '../../shared/icons';
import * as apiService from '../../client/services/apiService';

interface TierVouchersManagementProps {
    allPromotions: Promotion[];
    allTiers: Tier[];
    allServices: any[];
    onPromotionChange: () => void;
}

const TierVouchersManagement: React.FC<TierVouchersManagementProps> = ({
    allPromotions,
    allTiers,
    allServices,
    onPromotionChange
}) => {
    const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false);
    const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
    const [selectedTier, setSelectedTier] = useState<number | null>(null);
    const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({ 
        visible: false, 
        message: '', 
        type: 'success' 
    });
    const [isSendingVouchers, setIsSendingVouchers] = useState(false);

    // Filter promotions by tier - show all vouchers (active and inactive)
    // Since we only allow 1 voucher per tier, this should only return 0 or 1 voucher
    const tierVouchers = useMemo(() => {
        if (selectedTier === null) return [];
        
        const targetAudience = `Tier Level ${selectedTier}`;
        return allPromotions.filter(promo => 
            promo.targetAudience === targetAudience
        );
    }, [allPromotions, selectedTier]);

    // Get tier info
    const currentTier = useMemo(() => {
        if (selectedTier === null) return null;
        return allTiers.find(t => t.level === selectedTier);
    }, [allTiers, selectedTier]);

    // Set default tier to 1 if not selected
    useEffect(() => {
        if (selectedTier === null && allTiers.length > 0) {
            const vipTier = allTiers.find(t => t.level >= 1);
            if (vipTier) {
                setSelectedTier(vipTier.level);
            }
        }
    }, [selectedTier, allTiers]);

    const handleAddVoucher = (tierLevel: number) => {
        setSelectedTier(tierLevel);
        setEditingPromotion(null);
        setIsPromotionModalOpen(true);
    };

    const handleEditVoucher = (promo: Promotion) => {
        setEditingPromotion(promo);
        setIsPromotionModalOpen(true);
    };

    const handleSavePromotion = async (promoData: Promotion) => {
        try {
            // Ensure targetAudience is set to the selected tier
            if (selectedTier !== null) {
                promoData.targetAudience = `Tier Level ${selectedTier}` as any;
            }

            // For VIP tier vouchers: Check if creating new voucher when one already exists
            if (!promoData.id && selectedTier !== null) {
                // Creating new voucher - check if there's already a voucher for this tier
                // Count all vouchers (active and inactive) for this tier
                const allTierVouchers = allPromotions.filter(promo => 
                    promo.targetAudience === `Tier Level ${selectedTier}`
                );
                
                if (allTierVouchers.length > 0) {
                    // There's already a voucher for this tier
                    const existingVoucher = allTierVouchers[0];
                    const errorMessage = `Không thể tạo voucher mới cho hạng ${currentTier?.name}!\n\n` +
                        `Đã tồn tại voucher: "${existingVoucher.title}" (${existingVoucher.code})\n\n` +
                        `Mỗi hạng chỉ được phép có 1 voucher duy nhất.\n` +
                        `Vui lòng xóa voucher cũ trước khi tạo voucher mới.`;
                    
                    setToast({ 
                        visible: true, 
                        message: errorMessage, 
                        type: 'error' 
                    });
                    setTimeout(() => setToast({ visible: false, message: '', type: 'success' }), 8000);
                    return; // Stop here, don't create the voucher
                }
                
                // No existing voucher, set isActive to true for new voucher
                promoData.isActive = true;
            }

            let savedPromo: Promotion;
            if (promoData.id) {
                // Updating existing voucher - allow update
                savedPromo = await apiService.updatePromotion(promoData.id, promoData);
            } else {
                // Creating new voucher
                savedPromo = await apiService.createPromotion(promoData);
            }

            setToast({ 
                visible: true, 
                message: `Lưu voucher thành công!`, 
                type: 'success' 
            });
            setIsPromotionModalOpen(false);
            onPromotionChange();
            setTimeout(() => setToast({ visible: false, message: '', type: 'success' }), 4000);
        } catch (err: any) {
            console.error("Error saving promotion:", err);
            
            // Check if error is about existing voucher
            if (err.message && err.message.includes('Đã tồn tại voucher')) {
                setToast({ 
                    visible: true, 
                    message: err.message, 
                    type: 'error' 
                });
            } else {
                setToast({ 
                    visible: true, 
                    message: `Lưu voucher thất bại: ${err.message}`, 
                    type: 'error' 
                });
            }
            setTimeout(() => setToast({ visible: false, message: '', type: 'success' }), 6000);
        }
    };

    const handleDeletePromotion = async (promoId: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa voucher này? Thao tác này không thể hoàn tác.')) {
            try {
                await apiService.deletePromotion(promoId);
                setToast({ 
                    visible: true, 
                    message: `Đã xóa voucher thành công!`, 
                    type: 'success' 
                });
                onPromotionChange();
                setTimeout(() => setToast({ visible: false, message: '', type: 'success' }), 4000);
            } catch (err: any) {
                console.error("Error deleting promotion:", err);
                setToast({ 
                    visible: true, 
                    message: `Xóa voucher thất bại: ${err.message}`, 
                    type: 'error' 
                });
                setTimeout(() => setToast({ visible: false, message: '', type: 'success' }), 4000);
            }
        }
    };

    const handleSendVouchersToTier = async () => {
        if (!selectedTier || tierVouchers.length === 0) {
            setToast({ 
                visible: true, 
                message: 'Không có voucher nào để gửi', 
                type: 'error' 
            });
            setTimeout(() => setToast({ visible: false, message: '', type: 'success' }), 4000);
            return;
        }

        if (!window.confirm(`Bạn có chắc chắn muốn gửi voucher cho tất cả khách hàng hạng ${currentTier?.name}?\n\nVoucher sẽ được gửi cho tất cả khách hàng đang ở hạng ${currentTier?.name} và chưa nhận voucher tháng này.`)) {
            return;
        }

        setIsSendingVouchers(true);
        try {
            console.log(`🚀 [Frontend] Sending vouchers to tier ${selectedTier} (${currentTier?.name})`);
            const result = await apiService.sendMonthlyVouchersToTier(selectedTier);
            console.log(`✅ [Frontend] Result:`, result);
            
            const successCount = result.results?.success || 0;
            const skippedCount = result.results?.skipped || 0;
            const failedCount = result.results?.failed || 0;
            
            let message = `Đã gửi voucher thành công!\n`;
            message += `- Thành công: ${successCount} khách hàng\n`;
            if (skippedCount > 0) {
                message += `- Đã nhận rồi: ${skippedCount} khách hàng\n`;
            }
            if (failedCount > 0) {
                message += `- Thất bại: ${failedCount} khách hàng\n`;
            }
            
            setToast({ 
                visible: true, 
                message: message, 
                type: successCount > 0 ? 'success' : 'error' 
            });
            setTimeout(() => setToast({ visible: false, message: '', type: 'success' }), 6000);
        } catch (err: any) {
            console.error("❌ [Frontend] Error sending vouchers:", err);
            console.error("   Error details:", {
                message: err.message,
                stack: err.stack,
                name: err.name
            });
            setToast({ 
                visible: true, 
                message: `Gửi voucher thất bại: ${err.message || 'Unknown error'}`, 
                type: 'error' 
            });
            setTimeout(() => setToast({ visible: false, message: '', type: 'success' }), 5000);
        } finally {
            setIsSendingVouchers(false);
        }
    };

    const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

    const getRemainingTime = (expiryDate: string) => {
        const now = new Date();
        const expiry = new Date(expiryDate);
        const diff = expiry.getTime() - now.getTime();

        if (diff <= 0) return 'Hết hạn';

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) return `${days} ngày ${hours} giờ`;
        if (hours > 0) return `${hours} giờ ${minutes} phút`;
        return `${minutes} phút`;
    };

    // Get VIP tiers (level >= 1)
    const vipTiers = allTiers.filter(t => t.level >= 1).sort((a, b) => a.level - b.level);

    return (
        <div className="space-y-6">
            {toast.visible && (
                <div className={`fixed top-24 right-6 p-4 rounded-lg shadow-lg z-[100] animate-fadeInDown transition-all ${
                    toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                }`}>
                    <div className="flex items-center gap-3">
                        {toast.type === 'success' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                        <span>{toast.message}</span>
                    </div>
                </div>
            )}

            {isPromotionModalOpen && (
                <AddEditPromotionModal
                    promotion={editingPromotion ? {
                        ...editingPromotion,
                        targetAudience: selectedTier !== null ? `Tier Level ${selectedTier}` as any : editingPromotion.targetAudience
                    } : null}
                    onClose={() => setIsPromotionModalOpen(false)}
                    onSave={handleSavePromotion}
                    allServices={allServices}
                    allTiers={allTiers}
                    defaultTierLevel={selectedTier} // Truyền tier level khi tạo voucher mới
                />
            )}

            {/* Tier Selection */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Chọn hạng khách hàng</h2>
                <div className="flex gap-4 flex-wrap">
                    {vipTiers.map(tier => (
                        <button
                            key={tier.level}
                            onClick={() => setSelectedTier(tier.level)}
                            className={`px-6 py-3 rounded-lg font-medium transition-all ${
                                selectedTier === tier.level
                                    ? 'bg-brand-primary text-white shadow-lg scale-105'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                            style={selectedTier === tier.level ? {
                                backgroundColor: tier.color || '#3B82F6',
                                color: tier.textColor || '#FFFFFF'
                            } : {}}
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-lg font-bold">{tier.level}</span>
                                <span>{tier.name}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Voucher List for Selected Tier */}
            {selectedTier !== null && currentTier && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">
                                Voucher cho khách hạng {currentTier.name}
                            </h2>
                            <p className="text-gray-600 mt-1">
                                Quản lý voucher hàng tháng dành cho khách hàng {currentTier.name}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            {tierVouchers.length > 0 && (
                                <button
                                    onClick={handleSendVouchersToTier}
                                    disabled={isSendingVouchers}
                                    className="flex items-center gap-2 bg-green-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSendingVouchers ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Đang gửi...
                                        </>
                                    ) : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                            </svg>
                                            Gửi voucher cho tất cả khách hạng {currentTier.name}
                                        </>
                                    )}
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    // Check if there's already a voucher for this tier
                                    if (tierVouchers.length > 0) {
                                        const existingVoucher = tierVouchers[0];
                                        const errorMessage = `Không thể tạo voucher mới!\n\n` +
                                            `Đã tồn tại voucher: "${existingVoucher.title}" (${existingVoucher.code})\n\n` +
                                            `Mỗi hạng chỉ được phép có 1 voucher duy nhất.\n` +
                                            `Vui lòng xóa voucher cũ trước khi tạo voucher mới.`;
                                        
                                        setToast({ 
                                            visible: true, 
                                            message: errorMessage, 
                                            type: 'error' 
                                        });
                                        setTimeout(() => setToast({ visible: false, message: '', type: 'success' }), 8000);
                                        return;
                                    }
                                    handleAddVoucher(selectedTier);
                                }}
                                disabled={tierVouchers.length > 0}
                                className={`flex items-center gap-2 font-semibold px-4 py-2 rounded-lg transition-colors ${
                                    tierVouchers.length > 0
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-brand-primary text-white hover:bg-brand-dark'
                                }`}
                            >
                                <PlusIcon className="w-5 h-5" />
                                Thêm voucher
                            </button>
                        </div>
                    </div>

                    {/* Info message about single voucher rule */}
                    {tierVouchers.length > 0 && (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-800">
                                ℹ️ <strong>Lưu ý:</strong> Mỗi hạng chỉ được phép có 1 voucher duy nhất. 
                                Để tạo voucher mới, vui lòng xóa voucher hiện tại trước.
                            </p>
                        </div>
                    )}
                    
                    {tierVouchers.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {tierVouchers.map(promo => {
                                const isExpired = new Date(promo.expiryDate) < new Date();
                                return (
                                    <div
                                        key={promo.id}
                                        className={`bg-white rounded-lg shadow-md border-2 flex flex-col ${
                                            isExpired ? 'opacity-50 grayscale border-gray-300' : 'border-gray-200'
                                        }`}
                                    >
                                        <div className="relative p-4">
                                            <div className="flex gap-2">
                                                <span
                                                    className="px-3 py-1 text-sm font-bold rounded-full text-white"
                                                    style={{ backgroundColor: currentTier.color || '#3B82F6' }}
                                                >
                                                    {promo.discountType === 'percentage'
                                                        ? `Giảm ${promo.discountValue}%`
                                                        : formatPrice(promo.discountValue)}
                                                </span>
                                            </div>
                                            {isExpired && (
                                                <span className="absolute top-2 right-2 px-2 py-1 text-xs font-bold rounded-full bg-red-600 text-white">
                                                    Hết hạn
                                                </span>
                                            )}
                                        </div>
                                        <div className="p-4 flex flex-col flex-grow">
                                            <h3 className="font-bold text-gray-800 text-lg mb-2">{promo.title}</h3>
                                            <p className="text-sm text-gray-500 mb-3 line-clamp-2 flex-grow">
                                                {promo.description}
                                            </p>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-600">Mã:</span>
                                                    <span className="font-mono bg-gray-100 px-2 py-1 rounded font-semibold">
                                                        {promo.code}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-600">Hết hạn:</span>
                                                    <span className="flex items-center gap-1 text-gray-700">
                                                        <TimerIcon className="w-4 h-4" />
                                                        {getRemainingTime(promo.expiryDate)}
                                                    </span>
                                                </div>
                                                {promo.minOrderValue && promo.minOrderValue > 0 && (
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-gray-600">Đơn tối thiểu:</span>
                                                        <span className="font-semibold">
                                                            {formatPrice(promo.minOrderValue)}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="mt-4 pt-4 border-t flex gap-2 justify-end">
                                                <button
                                                    onClick={() => handleEditVoucher(promo)}
                                                    className="p-2 text-gray-500 hover:text-green-600 transition-colors"
                                                    title="Chỉnh sửa"
                                                >
                                                    <EditIcon className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeletePromotion(promo.id)}
                                                    className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                                                    title="Xóa"
                                                >
                                                    <TrashIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-gray-50 rounded-lg">
                            <p className="text-gray-500 text-lg mb-4">
                                Chưa có voucher nào cho hạng {currentTier.name}
                            </p>
                            <button
                                onClick={() => handleAddVoucher(selectedTier)}
                                className="inline-flex items-center gap-2 bg-brand-primary text-white font-semibold px-6 py-3 rounded-lg hover:bg-brand-dark transition-colors"
                            >
                                <PlusIcon className="w-5 h-5" />
                                Tạo voucher
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TierVouchersManagement;

