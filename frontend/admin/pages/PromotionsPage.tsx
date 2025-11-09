import React, { useState, useMemo, useEffect } from 'react';
import type { Promotion, RedeemableVoucher, Service, Appointment, User, PromotionTargetAudience, Tier, RedeemedReward, Review } from '../../types';
import AddEditPromotionModal from '../components/AddEditPromotionModal';
import AddEditRedeemableVoucherModal from '../components/AddEditRedeemableVoucherModal';
import { PlusIcon, EditIcon, TrashIcon, ChartBarIcon, SparklesIcon, GridIcon, ListIcon,InfoIcon ,TimerIcon, ShoppingCartIcon} from '../../shared/icons';
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
    const [redeemableVouchers, setRedeemableVouchers] = useState<RedeemableVoucher[]>([]);
    const [redeemedRewards, setRedeemedRewards] = useState<RedeemedReward[]>([]); // For reports tab
    const [wallets, setWallets] = useState<Record<string, { points: number }>>({});

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [activeTab, setActiveTab] = useState<'promotions' | 'vouchers' | 'reports'>('promotions');

    // Promotion Management States
    const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false);
    const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
    const [promoSearchTerm, setPromoSearchTerm] = useState('');
    const [promoFilterAudience, setPromoFilterAudience] = useState<PromotionTargetAudience | 'All'>('All');
    const [promoFilterCategory, setPromoFilterCategory] = useState('All');
    const [promoCurrentPage, setPromoCurrentPage] = useState(1);
    const [promoViewMode, setPromoViewMode] = useState<'grid' | 'table'>('grid');

    // Redeemable Voucher Management States
    const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
    const [editingVoucher, setEditingVoucher] = useState<RedeemableVoucher | null>(null);
    const [voucherSearchTerm, setVoucherSearchTerm] = useState('');
    const [voucherFilterAudience, setVoucherFilterAudience] = useState<PromotionTargetAudience | 'All'>('All');
    const [voucherCurrentPage, setVoucherCurrentPage] = useState(1);
    const [voucherViewMode, setVoucherViewMode] = useState<'grid' | 'table'>('grid');

    const [toast, setToast] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' });

    useEffect(() => {
        const fetchPromoData = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const fetchedPromotions = await apiService.getPromotions();
                setPromotions(fetchedPromotions);
                const fetchedRedeemableVouchers = await apiService.getRedeemableVouchers();
                setRedeemableVouchers(fetchedRedeemableVouchers);
                const fetchedRedeemedRewards = await apiService.getRedeemedRewards();
                setRedeemedRewards(fetchedRedeemedRewards);

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
                setRedeemableVouchers([]);
                setRedeemedRewards([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPromoData();
    }, [allServices, allTiers, allUsers, allAppointments, allReviews]); // Depend on global props to trigger re-fetch if they change

    // --- Promotions Tab Logic ---
    const allServiceCategories = useMemo(() => {
        const categories = new Set(allServices.map(s => {
            // Handle both string category and potential object
            const cat = s.category;
            if (typeof cat === 'string') return cat;
            if (cat && typeof cat === 'object' && 'name' in cat) return (cat as any).name;
            return String(cat || '');
        }).filter(Boolean));
        return ['All', ...Array.from(categories).sort()];
    }, [allServices]);

    const filteredPromotions = useMemo(() => {
        return promotions
            .filter(promo => promo.title.toLowerCase().includes(promoSearchTerm.toLowerCase()) || promo.code.toLowerCase().includes(promoSearchTerm.toLowerCase()))
            .filter(promo => promoFilterAudience === 'All' || promo.targetAudience === promoFilterAudience)
            .filter(promo => {
                if (promoFilterCategory === 'All') return true;
                if (!promo.applicableServiceIds || promo.applicableServiceIds.length === 0) return true;
                return promo.applicableServiceIds.some(serviceId => allServices.find(s => s.id === serviceId)?.category === promoFilterCategory);
            })
            .sort((a,b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
    }, [promotions, promoSearchTerm, promoFilterAudience, promoFilterCategory, allServices]);

    const promoTotalPages = Math.ceil(filteredPromotions.length / PROMOTIONS_PER_PAGE);
    const paginatedPromotions = useMemo(() => {
        const startIndex = (promoCurrentPage - 1) * PROMOTIONS_PER_PAGE;
        return filteredPromotions.slice(startIndex, startIndex + PROMOTIONS_PER_PAGE);
    }, [filteredPromotions, promoCurrentPage]);

    useEffect(() => {
        setPromoCurrentPage(1);
    }, [promoSearchTerm, promoFilterAudience, promoFilterCategory]);

    const handleAddPromotion = () => { setEditingPromotion(null); setIsPromotionModalOpen(true); };
    const handleEditPromotion = (promo: Promotion) => { setEditingPromotion(promo); setIsPromotionModalOpen(true); };
    const handleSavePromotion = async (promoData: Promotion) => {
        try {
            let savedPromo: Promotion;
            if (promoData.id) {
                savedPromo = await apiService.updatePromotion(promoData.id, promoData);
                setPromotions(prev => prev.map(p => p.id === savedPromo.id ? savedPromo : p));
            } else {
                savedPromo = await apiService.createPromotion(promoData);
                setPromotions(prev => [savedPromo, ...prev]);
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
    
    // --- Redeemable Vouchers Tab Logic ---
    const filteredRedeemableVouchers = useMemo(() => {
        return redeemableVouchers
            .filter(voucher => voucher.description.toLowerCase().includes(voucherSearchTerm.toLowerCase()))
            .filter(voucher => {
                if (voucherFilterAudience === 'All') return true;
                return voucher.targetAudience === voucherFilterAudience || (voucherFilterAudience === 'VIP' && (voucher.targetAudience?.includes('Tier Level') || voucher.targetAudience === 'VIP'));
            })
            .sort((a,b) => a.pointsRequired - b.pointsRequired);
    }, [redeemableVouchers, voucherSearchTerm, voucherFilterAudience]);

    const voucherTotalPages = Math.ceil(filteredRedeemableVouchers.length / PROMOTIONS_PER_PAGE);
    const paginatedRedeemableVouchers = useMemo(() => {
        const startIndex = (voucherCurrentPage - 1) * PROMOTIONS_PER_PAGE;
        return filteredRedeemableVouchers.slice(startIndex, startIndex + PROMOTIONS_PER_PAGE);
    }, [filteredRedeemableVouchers, voucherCurrentPage]);

    useEffect(() => {
        setVoucherCurrentPage(1);
    }, [voucherSearchTerm, voucherFilterAudience]);

    const handleAddVoucher = () => { setEditingVoucher(null); setIsVoucherModalOpen(true); };
    const handleEditVoucher = (voucher: RedeemableVoucher) => { setEditingVoucher(voucher); setIsVoucherModalOpen(true); };
    const handleSaveVoucher = async (voucherData: RedeemableVoucher) => {
        try {
            let savedVoucher: RedeemableVoucher;
            if (voucherData.id) {
                savedVoucher = await apiService.updateRedeemableVoucher(voucherData.id, voucherData);
                setRedeemableVouchers(prev => prev.map(v => v.id === savedVoucher.id ? savedVoucher : v));
            } else {
                savedVoucher = await apiService.createRedeemableVoucher(voucherData);
                setRedeemableVouchers(prev => [savedVoucher, ...prev]);
            }
            setToast({ visible: true, message: `Lưu voucher ${savedVoucher.description} thành công!` });
        } catch (err: any) {
            console.error("Error saving voucher:", err);
            setToast({ visible: true, message: `Lưu voucher thất bại: ${err.message}` });
        } finally {
            setIsVoucherModalOpen(false);
            setTimeout(() => setToast({ visible: false, message: '' }), 4000);
        }
    };
    const handleDeleteVoucher = async (voucherId: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa voucher đổi điểm này? Thao tác này không thể hoàn tác.')) {
            try {
                await apiService.deleteRedeemableVoucher(voucherId);
                setRedeemableVouchers(prev => prev.filter(v => v.id !== voucherId));
                setToast({ visible: true, message: `Đã xóa voucher thành công!` });
            } catch (err: any) {
                console.error("Error deleting voucher:", err);
                setToast({ visible: true, message: `Xóa voucher thất bại: ${err.message}` });
            } finally {
                setTimeout(() => setToast({ visible: false, message: '' }), 4000);
            }
        }
    };

    // --- Reports Tab Logic ---
    const reportStats = useMemo(() => {
        // FIX: Added allAppointments and allReviews to dependencies and included in conditional return
        if (isLoading || error || allServices.length === 0 || allAppointments.length === 0 || allUsers.length === 0 || allReviews.length === 0) return {
            totalPromotions: 0, activePromotions: 0, expiredPromotions: 0, usageCounts: [],
            totalRedeemedVouchers: 0, totalRedeemedValue: 0, redeemedByTier: []
        };
        const now = new Date();
        const totalPromotions = promotions.length;
        const activePromotions = promotions.filter(p => new Date(p.expiryDate) > now).length;
        const expiredPromotions = totalPromotions - activePromotions;
        
        const usageCounts = promotions.map(p => ({
            name: p.title,
            count: p.usageCount || 0,
        })).sort((a,b) => b.count - a.count);

        const totalRedeemedVouchers = redeemedRewards.length;
        // TODO: Calculate total redeemed value from actual redemption records when redemption table is added
        const totalRedeemedValue = 0;

        const redeemedByTier: Record<string, number> = {};
        allReviews.forEach(rr => { // FIX: Use allReviews for customer feedback analysis
            const user = allUsers.find(u => u.id === rr.userId);
            if (user) {
                // Calculate tier level from wallet points since tierLevel is not in users table
                const userPoints = wallets[user.id]?.points || 0;
                const sortedTiers = [...allTiers].sort((a, b) => (a.pointsRequired || 0) - (b.pointsRequired || 0));
                let userTier = 1; // Default to tier 1
                for (let i = sortedTiers.length - 1; i >= 0; i--) {
                    if (userPoints >= (sortedTiers[i].pointsRequired || 0)) {
                        userTier = sortedTiers[i].level;
                        break;
                    }
                }
                const tierName = allTiers.find(t => t.level === userTier)?.name || 'Khách hàng';
                redeemedByTier[tierName] = (redeemedByTier[tierName] || 0) + 1;
            }
        });
        const redeemedByTierArray = Object.entries(redeemedByTier)
            .map(([tier, count]) => ({ tier, count }))
            .sort((a,b) => b.count - a.count);


        return {
            totalPromotions,
            activePromotions,
            expiredPromotions,
            usageCounts,
            totalRedeemedVouchers,
            totalRedeemedValue,
            redeemedByTier: redeemedByTierArray,
        };
    }, [promotions, redeemedRewards, redeemableVouchers, allUsers, allTiers, isLoading, error, allServices, allAppointments, allReviews, wallets]); // FIX: Added wallets to dependency array

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
            {isVoucherModalOpen && <AddEditRedeemableVoucherModal voucher={editingVoucher} onClose={() => setIsVoucherModalOpen(false)} onSave={handleSaveVoucher} allServices={allServices} allTiers={allTiers} />}
            
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

            <h1 className="text-3xl font-bold text-gray-800 mb-6">Quản lý Khuyến mãi & Ưu đãi</h1>
            
            <div className="mb-8 flex justify-start border-b border-gray-200">
                <button onClick={() => setActiveTab('promotions')} className={`px-6 py-3 font-medium text-lg transition-colors flex items-center gap-2 ${activeTab === 'promotions' ? 'border-b-2 border-brand-primary text-brand-dark' : 'text-gray-500 hover:text-brand-dark'}`}>Chương trình khuyến mãi</button>
                <button onClick={() => setActiveTab('vouchers')} className={`px-6 py-3 font-medium text-lg transition-colors flex items-center gap-2 ${activeTab === 'vouchers' ? 'border-b-2 border-brand-primary text-brand-dark' : 'text-gray-500 hover:text-brand-dark'}`}>Voucher đổi điểm</button>
                <button onClick={() => setActiveTab('reports')} className={`px-6 py-3 font-medium text-lg transition-colors flex items-center gap-2 ${activeTab === 'reports' ? 'border-b-2 border-brand-primary text-brand-dark' : 'text-gray-500 hover:text-brand-dark'}`}>Báo cáo & Gợi ý AI</button>
            </div>

            {isLoading ? (
                <div className="text-center py-10 bg-white rounded-lg shadow-md">
                    <p className="text-lg text-gray-500">Đang tải dữ liệu ưu đãi...</p>
                </div>
            ) : error ? (
                <div className="text-center py-10 bg-white rounded-lg shadow-md">
                    <p className="text-lg text-red-500">Lỗi: {error}</p>
                </div>
            ) : (
                <>
                    {activeTab === 'promotions' && (
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
                                    {PROMOTION_TARGET_AUDIENCES.map(audience => <option key={audience} value={audience}>{getAudienceDisplay(audience)}</option>)}
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
                                                    <div className="relative">
                                                        <img src={promo.imageUrl} alt={promo.title} className="w-full h-40 object-cover rounded-t-lg" />
                                                        <div className="absolute top-2 left-2 flex gap-2">
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
                                                    <th className="p-4">Lượt dùng</th>
                                                    <th className="p-4">Hành động</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {paginatedPromotions.map(promo => (
                                                    <tr key={promo.id} className="border-b border-gray-200 hover:bg-gray-50">
                                                        <td className="p-4 flex items-center gap-3">
                                                            <img src={promo.imageUrl} alt={promo.title} className="w-10 h-10 object-cover rounded-md" />
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
                                                        <td className="p-4 text-sm">{promo.usageCount || 0}</td>
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

                    {activeTab === 'vouchers' && (
                        <div>
                            <div className="mb-6 flex flex-col md:flex-row gap-4">
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm theo mô tả..."
                                    value={voucherSearchTerm}
                                    onChange={(e) => setVoucherSearchTerm(e.target.value)}
                                    className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-brand-primary focus:border-brand-primary"
                                />
                                <select value={voucherFilterAudience} onChange={e => setVoucherFilterAudience(e.target.value as PromotionTargetAudience | 'All')} className="p-3 border border-gray-300 rounded-lg bg-white">
                                    <option value="All">Tất cả đối tượng</option>
                                    <option value="VIP">Khách hàng VIP</option>
                                    {allTiers.map(tier => <option key={`tier-${tier.level}`} value={`Tier Level ${tier.level}`}>{`Hạng ${tier.name}`}</option>)}
                                </select>
                                <div className="flex items-center bg-gray-200 rounded-lg p-1">
                                    <button onClick={() => setVoucherViewMode('grid')} className={`p-2 rounded-md ${voucherViewMode === 'grid' ? 'bg-white shadow' : 'text-gray-500'}`}><GridIcon className="w-5 h-5" /></button>
                                    <button onClick={() => setVoucherViewMode('table')} className={`p-2 rounded-md ${voucherViewMode === 'table' ? 'bg-white shadow' : 'text-gray-500'}`}><ListIcon className="w-5 h-5" /></button>
                                </div>
                                <button onClick={handleAddVoucher} className="flex items-center justify-center gap-2 bg-brand-primary text-white font-semibold p-3 rounded-lg hover:bg-brand-dark transition-colors"><PlusIcon className="w-5 h-5" />Thêm voucher</button>
                            </div>

                            {paginatedRedeemableVouchers.length > 0 ? (
                                voucherViewMode === 'grid' ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {paginatedRedeemableVouchers.map(voucher => (
                                            <div key={voucher.id} className="bg-white rounded-lg shadow-md flex flex-col">
                                                <div className="relative">
                                                    <img src="https://picsum.photos/seed/voucher-generic/400/200" alt="Voucher" className="w-full h-40 object-cover rounded-t-lg" />
                                                    <div className="absolute top-2 left-2 px-2 py-1 text-xs font-bold rounded-full bg-brand-primary text-white">
                                                        {formatPrice(voucher.value)}
                                                    </div>
                                                </div>
                                                <div className="p-4 flex flex-col flex-grow">
                                                    <h3 className="font-bold text-gray-800 text-lg">{voucher.description}</h3>
                                                    <p className="text-sm text-gray-500 mb-1">Cần: <span className="font-bold text-brand-primary">{voucher.pointsRequired.toLocaleString('vi-VN')} điểm</span></p>
                                                    <p className="text-sm text-gray-500 mb-1">Đối tượng: {getAudienceDisplay(voucher.targetAudience)}</p>
                                                    <p className="text-xs text-gray-600 line-clamp-2 flex-grow" title={getServiceNames(voucher.applicableServiceIds)}>
                                                        Áp dụng cho: {getServiceNames(voucher.applicableServiceIds)}
                                                    </p>
                                                    <div className="mt-auto pt-4 border-t flex flex-wrap gap-2 justify-end">
                                                        <button onClick={() => handleEditVoucher(voucher)} className="p-2 text-gray-500 hover:text-green-600" title="Chỉnh sửa"><EditIcon className="w-5 h-5" /></button>
                                                        <button onClick={() => handleDeleteVoucher(voucher.id)} className="p-2 text-gray-500 hover:text-red-600" title="Xóa"><TrashIcon className="w-5 h-5" /></button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                                        <table className="w-full whitespace-nowrap">
                                            <thead className="bg-gray-50 border-b border-gray-200">
                                                <tr className="text-left text-sm font-semibold text-gray-600">
                                                    <th className="p-4">Mô tả Voucher</th>
                                                    <th className="p-4">Điểm yêu cầu</th>
                                                    <th className="p-4">Giá trị</th>
                                                    <th className="p-4">Đối tượng</th>
                                                    <th className="p-4">Phạm vi dịch vụ</th>
                                                    <th className="p-4">Hành động</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {paginatedRedeemableVouchers.map(voucher => (
                                                    <tr key={voucher.id} className="border-b border-gray-200 hover:bg-gray-50">
                                                        <td className="p-4 font-semibold text-gray-800">{voucher.description}</td>
                                                        <td className="p-4 text-sm">{voucher.pointsRequired.toLocaleString('vi-VN')} điểm</td>
                                                        <td className="p-4 text-sm font-semibold text-brand-primary">{formatPrice(voucher.value)}</td>
                                                        <td className="p-4 text-sm">{getAudienceDisplay(voucher.targetAudience)}</td>
                                                        <td className="p-4 text-xs max-w-[150px] truncate" title={getServiceNames(voucher.applicableServiceIds)}>
                                                            {getServiceNames(voucher.applicableServiceIds)}
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="flex items-center gap-1">
                                                                <button onClick={() => handleEditVoucher(voucher)} className="p-2 text-gray-500 hover:text-green-600" title="Chỉnh sửa"><EditIcon className="w-5 h-5" /></button>
                                                                <button onClick={() => handleDeleteVoucher(voucher.id)} className="p-2 text-gray-500 hover:text-red-600" title="Xóa"><TrashIcon className="w-5 h-5" /></button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )
                            ) : (
                                <div className="text-center py-10 text-gray-500">Không tìm thấy voucher đổi điểm nào.</div>
                            )}
                            {voucherTotalPages > 0 && <Pagination currentPage={voucherCurrentPage} totalPages={voucherTotalPages} onPageChange={setVoucherCurrentPage} />}
                        </div>
                    )}

                    {activeTab === 'reports' && (
                        <div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div className="bg-white p-6 rounded-lg shadow-sm text-center">
                                    <p className="text-sm font-medium text-gray-500">Tổng số khuyến mãi</p>
                                    <p className="text-3xl font-bold text-gray-800 mt-1">{reportStats.totalPromotions}</p>
                                </div>
                                <div className="bg-white p-6 rounded-lg shadow-sm text-center">
                                    <p className="text-sm font-medium text-gray-500">Đang hoạt động</p>
                                    <p className="text-3xl font-bold text-green-600 mt-1">{reportStats.activePromotions}</p>
                                </div>
                                <div className="bg-white p-6 rounded-lg shadow-sm text-center">
                                    <p className="text-sm font-medium text-gray-500">Đã hết hạn</p>
                                    <p className="text-3xl font-bold text-red-600 mt-1">{reportStats.expiredPromotions}</p>
                                </div>
                                <div className="bg-white p-6 rounded-lg shadow-sm text-center">
                                    <p className="text-sm font-medium text-gray-500">Tổng Voucher đã đổi</p>
                                    <p className="text-3xl font-bold text-gray-800 mt-1">{reportStats.totalRedeemedVouchers}</p>
                                </div>
                                <div className="bg-white p-6 rounded-lg shadow-sm text-center md:col-span-2">
                                    <p className="text-sm font-medium text-gray-500">Tổng giá trị Voucher đã đổi</p>
                                    <p className="text-3xl font-bold text-brand-primary mt-1">{formatPrice(reportStats.totalRedeemedValue)}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                <div className="bg-white p-6 rounded-lg shadow-sm">
                                    <h3 className="text-lg font-semibold text-gray-700 flex items-center mb-4"><ChartBarIcon className="w-6 h-6 mr-2 text-brand-primary"/>Hiệu quả Khuyến mãi (Lượt dùng)</h3>
                                    {reportStats.usageCounts.length > 0 ? (
                                        <div className="space-y-4">
                                            {reportStats.usageCounts.map((item, index) => (
                                                <div key={index} className="flex items-center gap-4">
                                                    <span className="w-2/3 text-sm text-gray-800 truncate">{item.name}</span>
                                                    <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                                                        <div className="bg-brand-primary h-2.5 rounded-full" style={{ width: `${(item.count / Math.max(...reportStats.usageCounts.map(uc => uc.count), 1)) * 100}%` }}></div>
                                                    </div>
                                                    <span className="text-sm font-bold text-brand-dark">{item.count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-center text-gray-500">Chưa có dữ liệu lượt dùng.</p>
                                    )}
                                </div>
                                <div className="bg-white p-6 rounded-lg shadow-sm">
                                    <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2"><SparklesIcon className="w-6 h-6 mr-2 text-yellow-500"/>AI Gợi ý Chương trình Ưu đãi</h3>
                                    <ul className="text-sm text-gray-600 space-y-3">
                                        <li className="p-3 bg-blue-50 rounded-md border-l-4 border-blue-400 flex items-start gap-2">
                                            <InfoIcon className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5"/>
                                            <span><strong>Gợi ý:</strong> Tạo ưu đãi combo "Facial & Body Massage" với giá ưu đãi để tăng doanh thu cho các dịch vụ cốt lõi.</span>
                                        </li>
                                        <li className="p-3 bg-yellow-50 rounded-md border-l-4 border-yellow-400 flex items-start gap-2">
                                            <InfoIcon className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5"/>
                                            <span><strong>Phân tích:</strong> Dịch vụ "Triệt lông nách" có lượt đặt cao nhất nhưng tỷ lệ quay lại thấp. Cân nhắc gói ưu đãi trọn gói.</span>
                                        </li>
                                        <li className="p-3 bg-green-50 rounded-md border-l-4 border-green-400 flex items-start gap-2">
                                            <InfoIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"/>
                                            <span><strong>Đề xuất:</strong> Gửi ưu đãi sinh nhật tự động cho khách hàng hạng Vàng trở lên vào đầu tháng sinh của họ.</span>
                                        </li>
                                    </ul>
                                </div>
                                <div className="xl:col-span-2 bg-white p-6 rounded-lg shadow-sm">
                                    <h3 className="text-lg font-semibold text-gray-700 flex items-center mb-4"><ShoppingCartIcon className="w-6 h-6 mr-2 text-blue-500"/>Voucher đã đổi theo cấp độ</h3>
                                    {reportStats.redeemedByTier.length > 0 ? (
                                        <div className="space-y-4">
                                            {reportStats.redeemedByTier.map((item, index) => (
                                                <div key={index} className="flex items-center gap-4">
                                                    <span className="w-1/3 text-sm text-gray-800 truncate">{item.tier}</span>
                                                    <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                                                        <div className="bg-brand-primary h-2.5 rounded-full" style={{ width: `${(item.count / Math.max(...reportStats.redeemedByTier.map(uc => uc.count), 1)) * 100}%` }}></div>
                                                    </div>
                                                    <span className="text-sm font-bold text-gray-700">{item.count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-center text-gray-500">Chưa có dữ liệu voucher đã đổi.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
