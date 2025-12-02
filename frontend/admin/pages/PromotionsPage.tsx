import React, { useState, useMemo, useEffect } from 'react';
import type { Promotion, Service, Appointment, User, PromotionTargetAudience, Tier, Review, ServiceCategory } from '../../types';
import AddEditPromotionModal from '../components/AddEditPromotionModal';
import TierVouchersManagement from '../components/TierVouchersManagement';
import { PlusIcon, EditIcon, TrashIcon, GridIcon, ListIcon, TimerIcon } from '../../shared/icons';
import * as apiService from '../../client/services/apiService'; // Import API service
// FIX: Remove mock data imports that are no longer available.
import { PROMOTION_TARGET_AUDIENCES } from '../../constants';

const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
const PROMOTIONS_PER_PAGE = 6;

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;
    const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

    return (
        <nav className="mt-8 flex justify-center items-center gap-1" aria-label="Pagination">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 rounded-l-lg hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
            >
                Trước
            </button>
            {pageNumbers.map(number => (
                <button
                    key={number}
                    onClick={() => onPageChange(number)}
                    className={`px-3 py-2 leading-tight border ${
                        currentPage === number
                            ? 'bg-brand-primary text-white border-brand-primary z-10'
                            : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-100'
                    }`}
                >
                    {number}
                </button>
            ))}
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 rounded-r-lg hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
            >
                Sau
            </button>
        </nav>
    );
};

interface AdminPromotionsPageProps {
    allServices: Service[];
    allTiers: Tier[];
    allUsers: User[];
    // FIX: Added allAppointments and allReviews props
    allAppointments: Appointment[]; 
    allReviews: Review[]; 
}

export const AdminPromotionsPage: React.FC<AdminPromotionsPageProps> = ({ allServices, allTiers, allUsers, allAppointments, allReviews }) => {
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [wallets, setWallets] = useState<Record<string, { points: number }>>({});
    const [categories, setCategories] = useState<ServiceCategory[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Promotion Management States
    const [activeTab, setActiveTab] = useState<'vouchers' | 'redeemable' | 'tier'>('vouchers'); // Tab state: vouchers (public), redeemable (private), or tier (VIP tier vouchers)
    const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false);
    const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
    const [promoSearchTerm, setPromoSearchTerm] = useState('');
    const [promoFilterAudience, setPromoFilterAudience] = useState<PromotionTargetAudience | 'All'>('All');
    const [promoFilterCategory, setPromoFilterCategory] = useState('All');
    const [promoCurrentPage, setPromoCurrentPage] = useState(1);
    const [promoViewMode, setPromoViewMode] = useState<'grid' | 'table'>('grid');

    const [toast, setToast] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' });

    useEffect(() => {
        const fetchPromoData = async () => {
            try {
                setIsLoading(true);
                setError(null);
                // Fetch categories for category name lookup
                const fetchedCategories = await apiService.getServiceCategories();
                setCategories(fetchedCategories);
                // Fetch all promotions (including private) for admin
                const fetchedPromotions = await apiService.getPromotions({ all: true });
                console.log('=== FETCHED FROM API ===');
                console.log('Total fetched:', fetchedPromotions.length);
                
                // Check raw data from API - HƯỚNG ĐI MỚI: Dùng pointsRequired
                const redeemableVouchers = fetchedPromotions.filter(p => {
                    const pointsValue = p.pointsRequired;
                    const isRedeemable = pointsValue !== null && pointsValue !== undefined && !isNaN(Number(pointsValue)) && Number(pointsValue) > 0;
                    return isRedeemable;
                });
                console.log('Redeemable vouchers (pointsRequired > 0) from API:', redeemableVouchers.length);
                if (redeemableVouchers.length > 0) {
                    console.log('Details:', redeemableVouchers.map(p => ({ 
                        id: p.id, 
                        title: p.title, 
                        pointsRequired: p.pointsRequired,
                        pointsRequiredType: typeof p.pointsRequired
                    })));
                } else {
                    console.log('⚠️ No redeemable vouchers (pointsRequired > 0) found in API response!');
                    console.log('[DEBUG] All promotions from API:', fetchedPromotions.map(p => ({
                        id: p.id,
                        title: p.title.substring(0, 30),
                        pointsRequired: p.pointsRequired,
                        pointsRequiredType: typeof p.pointsRequired
                    })));
                }
                
                setPromotions(fetchedPromotions);

                // Fetch wallets to calculate tier levels
                const clientUsers = allUsers.filter(u => u.role === 'Client');
                const walletsData: Record<string, { points: number }> = {};
                await Promise.all(
                    clientUsers.map(async (user) => {
                        try {
                            const wallet = await apiService.getUserWallet(user.id);
                            walletsData[user.id] = { points: wallet.points || 0 };
                        } catch (e) {
                            walletsData[user.id] = { points: 0 };
                        }
                    })
                );
                setWallets(walletsData);

            } catch (err: any) {
                console.error("Error fetching promotions data:", err);
                setError(err.message || "Không thể tải dữ liệu ưu đãi.");
                setPromotions([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPromoData();
    }, [allServices, allTiers, allUsers, allAppointments, allReviews]); // Depend on global props to trigger re-fetch if they change

    // Debug: Log when promotions state changes
    useEffect(() => {
        console.log('[STATE CHANGE] Promotions state updated:', promotions.length);
        if (promotions.length > 0) {
            const redeemableCount = promotions.filter(p => {
                const pointsValue = p.pointsRequired;
                const isRedeemable = pointsValue !== null && pointsValue !== undefined && !isNaN(Number(pointsValue)) && Number(pointsValue) > 0;
                return isRedeemable;
            }).length;
            console.log('[STATE CHANGE] Redeemable vouchers (pointsRequired > 0) in state:', redeemableCount);
        }
    }, [promotions]);

    // --- Promotions Tab Logic ---
    const allServiceCategories = useMemo(() => {
        const categoryNames = new Set(allServices.map(s => {
            // Lookup category name from categoryId
            if (s.categoryId) {
                const category = categories.find(c => c.id === s.categoryId);
                return category?.name || '';
            }
            return '';
        }).filter(Boolean));
        return ['All', ...Array.from(categoryNames).sort()];
    }, [allServices, categories]);

    const filteredPromotions = useMemo(() => {
        console.log('[FILTER] Starting filter with promotions:', promotions.length);
        console.log('[FILTER] Active tab:', activeTab);
        
        // Normalize isPublic for all promotions first
        const normalizedPromotions = promotions.map(promo => {
            // Normalize isPublic: convert 0/1/'0'/'1'/true/false to boolean
            let normalizedIsPublic: boolean;
            const rawIsPublic = promo.isPublic as any; // API may return number/string from DB
            
            // Check if it's already a boolean
            if (typeof rawIsPublic === 'boolean') {
                normalizedIsPublic = rawIsPublic;
            } else if (rawIsPublic === true || rawIsPublic === 1 || rawIsPublic === '1' || String(rawIsPublic).toLowerCase() === 'true') {
                normalizedIsPublic = true;
            } else {
                normalizedIsPublic = false;
            }
            
            // Also normalize pointsRequired
            let normalizedPointsRequired: number | null = null;
            if (promo.pointsRequired !== undefined && promo.pointsRequired !== null) {
                const numPoints = Number(promo.pointsRequired);
                normalizedPointsRequired = !isNaN(numPoints) ? numPoints : null;
            }
            
            return {
                ...promo,
                isPublic: normalizedIsPublic,
                pointsRequired: normalizedPointsRequired
            };
        });
        
        console.log('=== FILTERING PROMOTIONS ===');
        console.log('Active tab:', activeTab);
        console.log('Total promotions:', normalizedPromotions.length);
        console.log('Normalized promotions:', normalizedPromotions.map(p => ({
            id: p.id,
            title: p.title.substring(0, 30),
            isPublic: p.isPublic,
            isPublicType: typeof p.isPublic,
            pointsRequired: p.pointsRequired,
            pointsRequiredType: typeof p.pointsRequired
        })));
        
        const filtered = normalizedPromotions
            // Filter by tab: vouchers (public) or redeemable (private)
            // HƯỚNG ĐI MỚI: Sử dụng pointsRequired để phân biệt
            // - pointsRequired > 0 → Voucher đổi thưởng (tab "Voucher đổi thưởng")
            // - pointsRequired = 0 hoặc NULL → Voucher thông thường (tab "Voucher")
            // QUAN TRỌNG: Loại trừ voucher VIP (targetAudience = "Tier Level X") khỏi tab "vouchers" và "redeemable"
            .filter(promo => {
                // Kiểm tra xem có phải voucher VIP không
                const isVIPTierVoucher = promo.targetAudience && 
                    typeof promo.targetAudience === 'string' && 
                    promo.targetAudience.startsWith('Tier Level');
                
                // Voucher VIP chỉ hiển thị trong tab "tier", không hiển thị ở tab khác
                if (isVIPTierVoucher && activeTab !== 'tier') {
                    return false;
                }
                
                // Nếu đang ở tab "tier", chỉ hiển thị voucher VIP
                if (activeTab === 'tier') {
                    return isVIPTierVoucher;
                }
                
                if (activeTab === 'vouchers') {
                    // Tab "Voucher": chỉ hiển thị voucher public (isPublic = true) và KHÔNG phải voucher VIP
                    const isPublicValue = promo.isPublic as any; // API may return number/string from DB
                    const isPublic = isPublicValue === true || isPublicValue === 1 || isPublicValue === '1' || String(isPublicValue).toLowerCase() === 'true';
                    return isPublic && !isVIPTierVoucher;
                } else {
                    // Tab "Voucher đổi thưởng": hiển thị voucher đổi điểm (pointsRequired > 0) và KHÔNG phải voucher VIP
                    const pointsValue = promo.pointsRequired;
                    const isRedeemable = pointsValue !== null && pointsValue !== undefined && !isNaN(Number(pointsValue)) && Number(pointsValue) > 0;
                    
                    // Always log when checking for redeemable tab
                    console.log(`[REDEEMABLE TAB] Checking: ${promo.id} "${promo.title.substring(0, 30)}" | pointsRequired: ${promo.pointsRequired} (${typeof promo.pointsRequired}) | isRedeemable: ${isRedeemable} | isVIPTierVoucher: ${isVIPTierVoucher} | Result: ${isRedeemable && !isVIPTierVoucher}`);
                    
                    return isRedeemable && !isVIPTierVoucher;
                }
            })
            // Apply search filter
            .filter(promo => {
                const matchesSearch = promo.title.toLowerCase().includes(promoSearchTerm.toLowerCase()) || 
                                    promo.code.toLowerCase().includes(promoSearchTerm.toLowerCase());
                if (!matchesSearch && activeTab === 'redeemable') {
                    console.log(`[SEARCH FILTER] Excluding: ${promo.id} "${promo.title.substring(0, 30)}" - doesn't match search: "${promoSearchTerm}"`);
                }
                return matchesSearch;
            })
            // Apply audience filter
            .filter(promo => {
                const matchesAudience = promoFilterAudience === 'All' || promo.targetAudience === promoFilterAudience;
                if (!matchesAudience && activeTab === 'redeemable') {
                    console.log(`[AUDIENCE FILTER] Excluding: ${promo.id} "${promo.title.substring(0, 30)}" - doesn't match audience: "${promoFilterAudience}"`);
                }
                return matchesAudience;
            })
            // Apply category filter
            .filter(promo => {
                if (promoFilterCategory === 'All') return true;
                const applicableIds = promo.applicableServiceIds || [];
                const matchesCategory = applicableIds.some(id => {
                    const service = allServices.find(s => s.id === id);
                    if (!service || !service.categoryId) return false;
                    const category = categories.find(c => c.id === service.categoryId);
                    return category?.name === promoFilterCategory;
                });
                if (!matchesCategory && activeTab === 'redeemable') {
                    console.log(`[CATEGORY FILTER] Excluding: ${promo.id} "${promo.title.substring(0, 30)}" - doesn't match category: "${promoFilterCategory}"`);
                }
                return matchesCategory;
            });
        
        console.log(`[FILTER RESULT] Filtered ${filtered.length} promotions for tab "${activeTab}"`);
        if (activeTab === 'redeemable') {
            if (filtered.length > 0) {
                console.log('[SUCCESS] Redeemable vouchers found:', filtered.map(p => ({
                    id: p.id,
                    title: p.title,
                    isPublic: p.isPublic,
                    pointsRequired: p.pointsRequired
                })));
            } else {
                console.log('[WARNING] No redeemable vouchers found!');
                console.log('[DEBUG] All normalized promotions:', normalizedPromotions.map(p => ({
                    id: p.id,
                    title: p.title.substring(0, 30),
                    isPublic: p.isPublic,
                    isPublicType: typeof p.isPublic
                })));
            }
        }
        
        return filtered;
    }, [promotions, activeTab, promoSearchTerm, promoFilterAudience, promoFilterCategory, allServices]);

    const promoTotalPages = Math.ceil(filteredPromotions.length / PROMOTIONS_PER_PAGE);
    const paginatedPromotions = useMemo<Promotion[]>(() => {
        const startIndex = (promoCurrentPage - 1) * PROMOTIONS_PER_PAGE;
        return filteredPromotions.slice(startIndex, startIndex + PROMOTIONS_PER_PAGE);
    }, [filteredPromotions, promoCurrentPage]);

    useEffect(() => {
        setPromoCurrentPage(1);
    }, [promoSearchTerm, promoFilterAudience, promoFilterCategory, activeTab]);

    const handleAddPromotion = () => { setEditingPromotion(null); setIsPromotionModalOpen(true); };
    const handleEditPromotion = (promo: Promotion) => { setEditingPromotion(promo); setIsPromotionModalOpen(true); };
    const handleSavePromotion = async (promoData: Promotion) => {
        try {
            let savedPromo: Promotion;
            if (promoData.id) {
                // Get old promotion to check if isPublic changed
                const oldPromo = promotions.find(p => p.id === promoData.id);
                const oldIsPublicValue = oldPromo?.isPublic as any;
                const oldIsPublic = oldIsPublicValue === true || oldIsPublicValue === 1 || oldIsPublicValue === '1' || String(oldIsPublicValue).toLowerCase() === 'true';
                const newIsPublicValue = promoData.isPublic as any;
                const newIsPublic = newIsPublicValue === true || newIsPublicValue === 1 || newIsPublicValue === '1' || String(newIsPublicValue).toLowerCase() === 'true';
                
                savedPromo = await apiService.updatePromotion(promoData.id, promoData);
                // Normalize the saved promotion data before updating state
                const isPublicValue = savedPromo.isPublic as any; // API may return number/string from DB
                const normalizedSavedPromo = {
                    ...savedPromo,
                    isPublic: isPublicValue === true || 
                             isPublicValue === 1 || 
                             isPublicValue === '1' ||
                             String(isPublicValue).toLowerCase() === 'true',
                    pointsRequired: savedPromo.pointsRequired ? Number(savedPromo.pointsRequired) : null
                };
                setPromotions(prev => prev.map(p => p.id === normalizedSavedPromo.id ? normalizedSavedPromo : p));
                
                // If changed from public to private or vice versa, refetch all promotions to ensure consistency
                if (oldIsPublic !== newIsPublic) {
                    console.log('🔄 [PROMOTION UPDATE] isPublic changed, refetching all promotions...');
                    const refetchedPromotions = await apiService.getPromotions({ all: true });
                    setPromotions(refetchedPromotions);
                }
            } else {
                savedPromo = await apiService.createPromotion(promoData);
                // Normalize the saved promotion data before updating state
                const isPublicValue = savedPromo.isPublic as any; // API may return number/string from DB
                const normalizedSavedPromo = {
                    ...savedPromo,
                    isPublic: isPublicValue === true || 
                             isPublicValue === 1 || 
                             isPublicValue === '1' ||
                             String(isPublicValue).toLowerCase() === 'true',
                    pointsRequired: savedPromo.pointsRequired ? Number(savedPromo.pointsRequired) : null
                };
                setPromotions(prev => [normalizedSavedPromo, ...prev]);
            }
            setToast({ visible: true, message: `Lưu khuyến mãi ${savedPromo.title} thành công!` });
        } catch (err: any) {
            console.error("Error saving promotion:", err);
            setToast({ visible: true, message: `Lưu khuyến mãi thất bại: ${err.message}` });
        } finally {
            setIsPromotionModalOpen(false);
            setTimeout(() => setToast({ visible: false, message: '' }), 4000);
        }
    };
    const handleDeletePromotion = async (promoId: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa khuyến mãi này? Thao tác này không thể hoàn tác.')) {
            try {
                await apiService.deletePromotion(promoId);
                setPromotions(prev => prev.filter(p => p.id !== promoId));
                setToast({ visible: true, message: `Đã xóa khuyến mãi thành công!` });
            } catch (err: any) {
                console.error("Error deleting promotion:", err);
                setToast({ visible: true, message: `Xóa khuyến mãi thất bại: ${err.message}` });
            } finally {
                setTimeout(() => setToast({ visible: false, message: '' }), 4000);
            }
        }
    };

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

    const getAudienceDisplay = (audience?: PromotionTargetAudience | 'All') => {
        if (!audience || audience === 'All') return 'Tất cả khách hàng';
        if (audience === 'New Clients') return 'Khách hàng mới';
        if (audience === 'Birthday') return 'Khách hàng sinh nhật';
        if (audience === 'VIP') return 'Khách hàng VIP';
        if (audience.startsWith('Tier Level')) {
            const level = audience.split(' ')[2];
            const tier = allTiers.find(t => t.level === parseInt(level));
            return `Hạng ${tier?.name || level}`;
        }
        return audience;
    }

    const getServiceNames = (serviceIds?: string[]) => {
        if (!serviceIds || serviceIds.length === 0) return 'Tất cả dịch vụ';
        const names = serviceIds.map(id => allServices.find(s => s.id === id)?.name).filter(Boolean);
        return names.length > 0 ? names.join(', ') : 'Dịch vụ cụ thể';
    };

    return (
        <div>
            {isPromotionModalOpen && <AddEditPromotionModal promotion={editingPromotion} onClose={() => setIsPromotionModalOpen(false)} onSave={handleSavePromotion} allServices={allServices} allTiers={allTiers} />}
            
            {toast.visible && (
                <div className="fixed top-24 right-6 bg-green-500 text-white p-4 rounded-lg shadow-lg z-[100] animate-fadeInDown transition-all">
                    <div className="flex items-center gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{toast.message}</span>
                    </div>
                </div>
            )}

            <h1 className="text-3xl font-bold text-gray-800 mb-6">Quản lý Khuyến mãi</h1>
            
            {/* Tab Navigation */}
            <div className="mb-6 flex border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('vouchers')}
                    className={`px-6 py-3 font-medium text-lg transition-colors ${
                        activeTab === 'vouchers'
                            ? 'border-b-2 border-brand-primary text-brand-dark'
                            : 'text-gray-500 hover:text-brand-dark'
                    }`}
                >
                    Voucher
                </button>
                <button
                    onClick={() => setActiveTab('redeemable')}
                    className={`px-6 py-3 font-medium text-lg transition-colors ${
                        activeTab === 'redeemable'
                            ? 'border-b-2 border-brand-primary text-brand-dark'
                            : 'text-gray-500 hover:text-brand-dark'
                    }`}
                >
                    Voucher đổi thưởng
                </button>
                <button
                    onClick={() => setActiveTab('tier')}
                    className={`px-6 py-3 font-medium text-lg transition-colors ${
                        activeTab === 'tier'
                            ? 'border-b-2 border-brand-primary text-brand-dark'
                            : 'text-gray-500 hover:text-brand-dark'
                    }`}
                >
                    Voucher VIP
                </button>
            </div>
            
            {isLoading ? (
                <div className="text-center py-10 bg-white rounded-lg shadow-md">
                    <p className="text-lg text-gray-500">Đang tải dữ liệu ưu đãi...</p>
                </div>
            ) : error ? (
                <div className="text-center py-10 bg-white rounded-lg shadow-md">
                    <p className="text-lg text-red-500">Lỗi: {error}</p>
                </div>
            ) : activeTab === 'tier' ? (
                <TierVouchersManagement
                    allPromotions={promotions}
                    allTiers={allTiers}
                    allServices={allServices}
                    onPromotionChange={() => {
                        // Refetch promotions when a promotion is changed
                        const fetchPromoData = async () => {
                            try {
                                const fetchedPromotions = await apiService.getPromotions({ all: true });
                                setPromotions(fetchedPromotions);
                            } catch (err: any) {
                                console.error("Error refetching promotions:", err);
                            }
                        };
                        fetchPromoData();
                    }}
                />
            ) : (
                <div>
                    <div className="mb-6 flex flex-col md:flex-row gap-4">
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tiêu đề hoặc mã..."
                            value={promoSearchTerm}
                            onChange={(e) => setPromoSearchTerm(e.target.value)}
                            className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-brand-primary focus:border-brand-primary"
                        />
                        <select value={promoFilterAudience} onChange={e => setPromoFilterAudience(e.target.value as PromotionTargetAudience | 'All')} className="p-3 border border-gray-300 rounded-lg bg-white">
                            <option value="All">Tất cả đối tượng</option>
                            <option value="New Clients">Khách hàng mới</option>
                            <option value="Birthday">Khách hàng sinh nhật</option>
                        </select>
                        <select value={promoFilterCategory} onChange={e => setPromoFilterCategory(e.target.value)} className="p-3 border border-gray-300 rounded-lg bg-white">
                            {allServiceCategories.map(category => <option key={category} value={category}>{category === 'All' ? 'Tất cả danh mục' : category}</option>)}
                        </select>
                        <div className="flex items-center bg-gray-200 rounded-lg p-1">
                            <button onClick={() => setPromoViewMode('grid')} className={`p-2 rounded-md ${promoViewMode === 'grid' ? 'bg-white shadow' : 'text-gray-500'}`}><GridIcon className="w-5 h-5" /></button>
                            <button onClick={() => setPromoViewMode('table')} className={`p-2 rounded-md ${promoViewMode === 'table' ? 'bg-white shadow' : 'text-gray-500'}`}><ListIcon className="w-5 h-5" /></button>
                        </div>
                        <button onClick={handleAddPromotion} className="flex items-center justify-center gap-2 bg-brand-primary text-white font-semibold p-3 rounded-lg hover:bg-brand-dark transition-colors"><PlusIcon className="w-5 h-5" />Thêm khuyến mãi</button>
                    </div>

                    {paginatedPromotions.length > 0 ? (
                        promoViewMode === 'grid' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {paginatedPromotions.map(promo => {
                                    const isExpired = new Date(promo.expiryDate) < new Date();
                                    return (
                                        <div key={promo.id} className={`bg-white rounded-lg shadow-md flex flex-col ${isExpired ? 'opacity-50 grayscale' : ''}`}>
                                            <div className="relative p-4">
                                                <div className="flex gap-2">
                                                    <span className="px-2 py-1 text-xs font-bold rounded-full bg-blue-500 text-white">
                                                        {promo.discountType === 'percentage' ? `${promo.discountValue}% Off` : formatPrice(promo.discountValue)}
                                                    </span>
                                                </div>
                                                {isExpired && (
                                                    <span className="absolute top-2 right-2 px-2 py-1 text-xs font-bold rounded-full bg-red-600 text-white">
                                                        Hết hạn
                                                    </span>
                                                )}
                                            </div>
                                            <div className="p-4 flex flex-col flex-grow">
                                                <h3 className="font-bold text-gray-800 text-lg">{promo.title}</h3>
                                                <p className="text-sm text-gray-500 mb-1 line-clamp-2 flex-grow">{promo.description}</p>
                                                <div className="flex justify-between items-center my-2 text-sm">
                                                    <span className="text-gray-600">Mã: <span className="font-mono bg-gray-100 px-1 rounded">{promo.code}</span></span>
                                                    <span className="flex items-center gap-1 text-gray-700">
                                                        <TimerIcon className="w-4 h-4" /> {getRemainingTime(promo.expiryDate)}
                                                    </span>
                                                </div>
                                                {/* Hiển thị số lượng còn lại */}
                                                <div className="mt-2 text-sm">
                                                    {(() => {
                                                        // Ưu tiên sử dụng remainingQuantity từ backend (có thể có trong response nhưng chưa có trong type)
                                                        // Nếu không có, fallback về stock (cho tương thích ngược)
                                                        const promoAny = promo as any; // Backend may return additional fields
                                                        const remainingQty = promoAny.remainingQuantity !== undefined ? promoAny.remainingQuantity : (promo.stock !== null && promo.stock !== undefined ? promo.stock : null);
                                                        const isRedeemable = promo.pointsRequired && Number(promo.pointsRequired) > 0;
                                                        
                                                        // Chỉ hiển thị "Không giới hạn" nếu stock = null và không phải voucher đổi điểm
                                                        const stockValue = promo.stock as any; // May be number, null, or string from API
                                                        if (!isRedeemable && (stockValue === null || stockValue === undefined || stockValue === '')) {
                                                            return <span className="text-gray-500">Không giới hạn</span>;
                                                        }
                                                        
                                                        // Nếu remainingQty là null/undefined nhưng có stock, sử dụng stock
                                                        const displayQty = remainingQty !== null && remainingQty !== undefined ? remainingQty : (promo.stock !== null && promo.stock !== undefined ? promo.stock : null);
                                                        
                                                        if (displayQty === null || displayQty === undefined) {
                                                            return <span className="text-gray-500">Không giới hạn</span>;
                                                        }
                                                        
                                                        if (isRedeemable) {
                                                            return (
                                                                <div className="flex flex-col">
                                                                    <span className={displayQty <= 0 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
                                                                        Còn {displayQty} voucher
                                                                    </span>
                                                                    {promoAny.totalRedeemed !== undefined && (
                                                                        <span className="text-xs text-gray-500">
                                                                            (Đã đổi: {promoAny.totalRedeemed}, Đã dùng: {promoAny.usedCount || 0})
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            );
                                                        } else {
                                                            return (
                                                                <div className="flex flex-col">
                                                                    <span className={displayQty <= 0 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
                                                                        Còn {displayQty} lượt
                                                                    </span>
                                                                    {promoAny.usedCount !== undefined && promo.stock !== null && (
                                                                        <span className="text-xs text-gray-500">
                                                                            (Tổng: {Number(promo.stock) + Number(promoAny.usedCount || 0)}, Đã dùng: {promoAny.usedCount || 0})
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            );
                                                        }
                                                    })()}
                                                </div>
                                                <div className="mt-auto pt-4 border-t flex flex-wrap gap-2 justify-end">
                                                    <button onClick={() => handleEditPromotion(promo)} className="p-2 text-gray-500 hover:text-green-600" title="Chỉnh sửa"><EditIcon className="w-5 h-5" /></button>
                                                    <button onClick={() => handleDeletePromotion(promo.id)} className="p-2 text-gray-500 hover:text-red-600" title="Xóa"><TrashIcon className="w-5 h-5" /></button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                                <table className="w-full whitespace-nowrap">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr className="text-left text-sm font-semibold text-gray-600">
                                            <th className="p-4">Khuyến mãi</th>
                                            <th className="p-4">Mã</th>
                                            <th className="p-4">Giá trị</th>
                                            <th className="p-4">Đối tượng</th>
                                            <th className="p-4">Phạm vi dịch vụ</th>
                                            <th className="p-4">Hết hạn</th>
                                            <th className="p-4">Còn lại</th>
                                            <th className="p-4">Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedPromotions.map(promo => (
                                            <tr key={promo.id} className="border-b border-gray-200 hover:bg-gray-50">
                                                <td className="p-4">
                                                    <div>
                                                        <p className="font-semibold text-gray-800">{promo.title}</p>
                                                        <p className="text-sm text-gray-500">{promo.description}</p>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-sm font-mono">{promo.code}</td>
                                                <td className="p-4 text-sm">
                                                    {promo.discountType === 'percentage' ? `${promo.discountValue}%` : formatPrice(promo.discountValue)}
                                                </td>
                                                <td className="p-4 text-sm">{getAudienceDisplay(promo.targetAudience)}</td>
                                                <td className="p-4 text-xs max-w-[150px] truncate" title={getServiceNames(promo.applicableServiceIds)}>
                                                    {getServiceNames(promo.applicableServiceIds)}
                                                </td>
                                                <td className="p-4 text-sm">
                                                    {new Date(promo.expiryDate) < new Date() ? (
                                                        <span className="text-red-600 font-semibold">Đã hết hạn</span>
                                                    ) : (
                                                        <div className="flex items-center gap-1 text-gray-700">
                                                            <TimerIcon className="w-4 h-4" /> {getRemainingTime(promo.expiryDate)}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-4 text-sm">
                                                    {(() => {
                                                        // Ưu tiên sử dụng remainingQuantity từ backend (có thể có trong response nhưng chưa có trong type)
                                                        // Nếu không có, fallback về stock (cho tương thích ngược)
                                                        const promoAny = promo as any; // Backend may return additional fields
                                                        const remainingQty = promoAny.remainingQuantity !== undefined ? promoAny.remainingQuantity : (promo.stock !== null && promo.stock !== undefined ? promo.stock : null);
                                                        const isRedeemable = promo.pointsRequired && Number(promo.pointsRequired) > 0;
                                                        
                                                        // Chỉ hiển thị "Không giới hạn" nếu stock = null và không phải voucher đổi điểm
                                                        const stockValue = promo.stock as any; // May be number, null, or string from API
                                                        if (!isRedeemable && (stockValue === null || stockValue === undefined || stockValue === '')) {
                                                            return <span className="text-gray-500">Không giới hạn</span>;
                                                        }
                                                        
                                                        // Nếu remainingQty là null/undefined nhưng có stock, sử dụng stock
                                                        const displayQty = remainingQty !== null && remainingQty !== undefined ? remainingQty : (promo.stock !== null && promo.stock !== undefined ? promo.stock : null);
                                                        
                                                        if (displayQty === null || displayQty === undefined) {
                                                            return <span className="text-gray-500">Không giới hạn</span>;
                                                        }
                                                        
                                                        if (isRedeemable) {
                                                            // Voucher đổi điểm
                                                            return (
                                                                <div className="flex flex-col">
                                                                    <span className={displayQty <= 0 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
                                                                        Còn {displayQty} voucher
                                                                    </span>
                                                                    {promoAny.totalRedeemed !== undefined && (
                                                                        <span className="text-xs text-gray-500">
                                                                            (Đã đổi: {promoAny.totalRedeemed}, Đã dùng: {promoAny.usedCount || 0})
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            );
                                                        } else {
                                                            // Voucher thường
                                                            return (
                                                                <div className="flex flex-col">
                                                                    <span className={displayQty <= 0 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
                                                                        Còn {displayQty} lượt
                                                                    </span>
                                                                    {promoAny.usedCount !== undefined && promo.stock !== null && (
                                                                        <span className="text-xs text-gray-500">
                                                                            (Tổng: {Number(promo.stock) + Number(promoAny.usedCount || 0)}, Đã dùng: {promoAny.usedCount || 0})
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            );
                                                        }
                                                    })()}
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-1">
                                                        <button onClick={() => handleEditPromotion(promo)} className="p-2 text-gray-500 hover:text-green-600" title="Chỉnh sửa"><EditIcon className="w-5 h-5" /></button>
                                                        <button onClick={() => handleDeletePromotion(promo.id)} className="p-2 text-gray-500 hover:text-red-600" title="Xóa"><TrashIcon className="w-5 h-5" /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    ) : (
                        <div className="text-center py-10 text-gray-500">Không tìm thấy khuyến mãi nào.</div>
                    )}
                    {promoTotalPages > 0 && <Pagination currentPage={promoCurrentPage} totalPages={promoTotalPages} onPageChange={setPromoCurrentPage} />}
                </div>
            )}
        </div>
    );
};

export default AdminPromotionsPage;
