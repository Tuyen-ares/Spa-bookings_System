import React, { useState, useMemo, useEffect } from 'react';
import type { RedeemableVoucher, RedeemedReward, User, Tier, PromotionTargetAudience, Service } from '../../types';
import AddEditRedeemableVoucherModal from '../components/AddEditRedeemableVoucherModal';
import AddEditTierModal from '../components/AddEditTierModal'; // New Modal for Tiers
import * as apiService from '../../client/services/apiService';
// --- ICONS ---
import { PlusIcon, SearchIcon, GiftIcon, HistoryIcon, SettingsIcon,EditIcon,TrashIcon,GridIcon,ListIcon} from '../../shared/icons';

const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
const LOYALTY_ITEMS_PER_PAGE = 6;

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

const getAudienceDisplay = (audience?: PromotionTargetAudience | 'All', tiers: Tier[] = []) => {
    if (!audience || audience === 'All') return 'Tất cả khách hàng';
    if (audience === 'VIP') return 'Khách hàng VIP';
    if (audience.startsWith('Tier Level')) {
        const level = audience.split(' ')[2];
        const tier = tiers.find(t => t.level === parseInt(level));
        return `Hạng ${tier?.name || level}`;
    }
    return audience;
}

// FIX: Modified getServiceNames to accept `allServices` as a parameter
const getServiceNames = (serviceIds?: string[], allServices?: Service[]) => {
    if (!serviceIds || serviceIds.length === 0) return 'Tất cả dịch vụ';
    // FIX: Use the `allServices` parameter instead of MOCK_SERVICES
    const serviceList = allServices || [];
    const names = serviceIds.map(id => serviceList.find(s => s.id === id)?.name).filter(Boolean);
    return names.length > 0 ? names.join(', ') : 'Dịch vụ cụ thể';
};

interface LoyaltyShopPageProps {
    allTiers: Tier[]; // FIX: Added allTiers prop
    allServices: Service[]; // FIX: Added allServices prop
}

export const LoyaltyShopPage: React.FC<LoyaltyShopPageProps> = ({ allTiers, allServices }) => { // FIX: Destructure allTiers and allServices from props
    const [redeemableVouchers, setRedeemableVouchers] = useState<RedeemableVoucher[]>([]);
    const [redeemedRewards, setRedeemedRewards] = useState<RedeemedReward[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    
    const [activeTab, setActiveTab] = useState<'vouchers' | 'history' | 'tiers'>('vouchers');

    // Voucher Management States
    const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
    const [editingVoucher, setEditingVoucher] = useState<RedeemableVoucher | null>(null);
    const [voucherSearchTerm, setVoucherSearchTerm] = useState('');
    const [voucherFilterAudience, setVoucherFilterAudience] = useState<PromotionTargetAudience | 'All'>('All');
    const [voucherCurrentPage, setVoucherCurrentPage] = useState(1);
    const [voucherViewMode, setVoucherViewMode] = useState<'grid' | 'table'>('grid');

    // Tier Management States
    const [isTierModalOpen, setIsTierModalOpen] = useState(false);
    const [editingTier, setEditingTier] = useState<Tier | null>(null);

    const [toast, setToast] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [vouchers, rewards, usersData] = await Promise.all([
                    apiService.getRedeemableVouchers(),
                    apiService.getRedeemedRewards(),
                    apiService.getUsers(),
                ]);
                setRedeemableVouchers(vouchers);
                setRedeemedRewards(rewards);
                setUsers(usersData);
            } catch (error) {
                console.error("Failed to fetch loyalty shop data:", error);
            }
        };
        fetchData();
    }, []);

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

    const voucherTotalPages = Math.ceil(filteredRedeemableVouchers.length / LOYALTY_ITEMS_PER_PAGE);
    const paginatedRedeemableVouchers = useMemo(() => {
        const startIndex = (voucherCurrentPage - 1) * LOYALTY_ITEMS_PER_PAGE;
        return filteredRedeemableVouchers.slice(startIndex, startIndex + LOYALTY_ITEMS_PER_PAGE);
    }, [filteredRedeemableVouchers, voucherCurrentPage]);

    useEffect(() => {
        setVoucherCurrentPage(1);
    }, [voucherSearchTerm, voucherFilterAudience]);

    const handleAddVoucher = () => { setEditingVoucher(null); setIsVoucherModalOpen(true); };
    const handleEditVoucher = (voucher: RedeemableVoucher) => { setEditingVoucher(voucher); setIsVoucherModalOpen(true); };
    const handleSaveVoucher = (voucher: RedeemableVoucher) => {
        if (editingVoucher) {
            setRedeemableVouchers(prev => prev.map(v => v.id === voucher.id ? voucher : v));
            setToast({ visible: true, message: `Cập nhật voucher ${voucher.description} thành công!` });
        } else {
            const newVoucher: RedeemableVoucher = { ...voucher, id: `redeem-${Date.now()}` };
            setRedeemableVouchers(prev => [newVoucher, ...prev]);
            setToast({ visible: true, message: `Thêm voucher ${voucher.description} thành công!` });
        }
        setIsVoucherModalOpen(false);
        setTimeout(() => setToast({ visible: false, message: '' }), 4000);
    };
    const handleDeleteVoucher = (voucherId: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa voucher đổi điểm này?')) {
            setRedeemableVouchers(prev => prev.filter(v => v.id !== voucherId));
            setToast({ visible: true, message: `Đã xóa voucher thành công!` });
            setTimeout(() => setToast({ visible: false, message: '' }), 4000);
        }
    };

    // --- Tier Management Logic ---
    const handleEditTier = (tier: Tier) => { setEditingTier(tier); setIsTierModalOpen(true); };
    const handleSaveTier = (updatedTier: Tier) => {
        // FIX: Directly update the `allTiers` prop (or trigger parent update)
        // Since `allTiers` is a prop, we can't directly mutate it here.
        // In a real app, this would involve calling `apiService.updateTier` which then updates `allTiers` in App.tsx.
        // For now, we'll simulate the save and alert.
        setToast({ visible: true, message: `Cập nhật hạng ${updatedTier.name} thành công!` });
        setIsTierModalOpen(false);
        // This is where you'd call a prop function like `onUpdateTier(updatedTier)`
        // For now, it's just a visual toast.
        setTimeout(() => setToast({ visible: false, message: '' }), 4000);
    };

    return (
        <div>
            {/* FIX: Pass allServices and allTiers to AddEditRedeemableVoucherModal */}
            {isVoucherModalOpen && <AddEditRedeemableVoucherModal voucher={editingVoucher} onClose={() => setIsVoucherModalOpen(false)} onSave={handleSaveVoucher} allServices={allServices} allTiers={allTiers} />}
            {isTierModalOpen && editingTier && <AddEditTierModal tier={editingTier} onClose={() => setIsTierModalOpen(false)} onSave={handleSaveTier} />}

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

            <h1 className="text-3xl font-bold text-gray-800 mb-6">Cửa hàng Loyalty & Hệ thống VIP</h1>

            <div className="mb-8 flex justify-start border-b border-gray-200">
                <button onClick={() => setActiveTab('vouchers')} className={`px-6 py-3 font-medium text-lg transition-colors flex items-center gap-2 ${activeTab === 'vouchers' ? 'border-b-2 border-brand-primary text-brand-dark' : 'text-gray-500 hover:text-brand-dark'}`}>
                    <GiftIcon className="w-5 h-5"/> Voucher đổi điểm
                </button>
                <button onClick={() => setActiveTab('history')} className={`px-6 py-3 font-medium text-lg transition-colors flex items-center gap-2 ${activeTab === 'history' ? 'border-b-2 border-brand-primary text-brand-dark' : 'text-gray-500 hover:text-brand-dark'}`}>
                    <HistoryIcon className="w-5 h-5"/> Lịch sử đổi quà
                </button>
                <button onClick={() => setActiveTab('tiers')} className={`px-6 py-3 font-medium text-lg transition-colors flex items-center gap-2 ${activeTab === 'tiers' ? 'border-b-2 border-brand-primary text-brand-dark' : 'text-gray-500 hover:text-brand-dark'}`}>
                    <SettingsIcon className="w-5 h-5"/> Cấu hình cấp độ
                </button>
            </div>

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

                    {voucherViewMode === 'grid' ? (
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
                                        <p className="text-sm text-gray-500 mb-1">Đối tượng: {getAudienceDisplay(voucher.targetAudience, allTiers)}</p>
                                        <p className="text-xs text-gray-600 line-clamp-2 flex-grow" title={getServiceNames(voucher.applicableServiceIds, allServices)}>
                                            Áp dụng cho: {getServiceNames(voucher.applicableServiceIds, allServices)}
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
                                            <td className="p-4 text-sm">{getAudienceDisplay(voucher.targetAudience, allTiers)}</td>
                                            <td className="p-4 text-xs max-w-[150px] truncate" title={getServiceNames(voucher.applicableServiceIds, allServices)}>
                                                {getServiceNames(voucher.applicableServiceIds, allServices)}
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
                    )}
                    {voucherTotalPages > 0 && <Pagination currentPage={voucherCurrentPage} totalPages={voucherTotalPages} onPageChange={setVoucherCurrentPage} />}
                    {filteredRedeemableVouchers.length === 0 && (
                        <div className="text-center py-10 text-gray-500">Không tìm thấy voucher đổi điểm nào.</div>
                    )}
                </div>
            )}

            {activeTab === 'history' && (
                <div>
                    <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                        <table className="w-full whitespace-nowrap">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr className="text-left text-sm font-semibold text-gray-600">
                                    <th className="p-4">Người dùng</th>
                                    <th className="p-4">Mô tả phần thưởng</th>
                                    <th className="p-4">Điểm đã dùng</th>
                                    <th className="p-4">Ngày đổi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {redeemedRewards.length > 0 ? (
                                    redeemedRewards.map(reward => {
                                        const user = users.find(u => u.id === reward.userId);
                                        return (
                                            <tr key={reward.id} className="border-b border-gray-200 hover:bg-gray-50">
                                                <td className="p-4">{user?.name || 'N/A'}</td>
                                                <td className="p-4">{reward.rewardDescription}</td>
                                                <td className="p-4 text-red-600 font-semibold">-{reward.pointsUsed.toLocaleString('vi-VN')} điểm</td>
                                                <td className="p-4">{new Date(reward.dateRedeemed).toLocaleDateString('vi-VN')}</td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr><td colSpan={4} className="text-center py-10 text-gray-500">Chưa có lịch sử đổi quà.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'tiers' && (
                <div>
                    <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                        <table className="w-full whitespace-nowrap">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr className="text-left text-sm font-semibold text-gray-600">
                                    <th className="p-4">Cấp độ</th>
                                    <th className="p-4">Tên hạng</th>
                                    <th className="p-4">Điểm yêu cầu</th>
                                    <th className="p-4">Chi tiêu tối thiểu</th>
                                    <th className="p-4">Màu sắc</th>
                                    <th className="p-4">Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* FIX: Use allTiers prop directly here */}
                                {allTiers.length > 0 ? (
                                    allTiers.sort((a,b) => a.level - b.level).map(tier => (
                                        <tr key={tier.level} className="border-b border-gray-200 hover:bg-gray-50">
                                            <td className="p-4 text-sm font-bold">{tier.level}</td>
                                            <td className="p-4 text-sm font-semibold">{tier.name}</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-sm">{tier.pointsRequired.toLocaleString('vi-VN')} điểm</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-sm">{formatPrice(tier.minSpendingRequired)}</td>
                                            <td className="p-4">
                                                <div className="w-6 h-6 rounded-full border border-gray-300" style={{ backgroundColor: tier.color }}></div>
                                            </td>
                                            <td className="p-4">
                                                <button onClick={() => handleEditTier(tier)} className="p-2 text-gray-500 hover:text-green-600" title="Chỉnh sửa"><EditIcon className="w-5 h-5" /></button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={6} className="text-center py-10 text-gray-500">Không có cấp độ nào được cấu hình.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
