import React, { useState, useMemo, useEffect } from 'react';
import type { Promotion, Service, Appointment, User, PromotionTargetAudience, Tier, Review } from '../../types';
import AddEditPromotionModal from '../components/AddEditPromotionModal';
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

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Promotion Management States
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
                const fetchedPromotions = await apiService.getPromotions();
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
                const applicableIds = promo.applicableServiceIds || [];
                return applicableIds.some(id => allServices.find(s => s.id === id)?.category === promoFilterCategory);
            });
    }, [promotions, promoSearchTerm, promoFilterAudience, promoFilterCategory, allServices]);

    const promoTotalPages = Math.ceil(filteredPromotions.length / PROMOTIONS_PER_PAGE);
    const paginatedPromotions = useMemo<Promotion[]>(() => {
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
            
            {isLoading ? (
                <div className="text-center py-10 bg-white rounded-lg shadow-md">
                    <p className="text-lg text-gray-500">Đang tải dữ liệu ưu đãi...</p>
                </div>
            ) : error ? (
                <div className="text-center py-10 bg-white rounded-lg shadow-md">
                    <p className="text-lg text-red-500">Lỗi: {error}</p>
                </div>
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
                                            <th className="p-4">Còn lại</th>
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
                                                <td className="p-4 text-sm">
                                                    {promo.stock === null || promo.stock === undefined ? (
                                                        <span className="text-gray-500">Không giới hạn</span>
                                                    ) : (
                                                        <span className={promo.stock <= 0 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
                                                            {promo.stock} lượt
                                                        </span>
                                                    )}
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
