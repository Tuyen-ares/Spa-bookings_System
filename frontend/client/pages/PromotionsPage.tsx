
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import type { Promotion, Wallet, RedeemableVoucher, PointsHistory, User, Tier, Service, Appointment } from '../../types';
import * as apiService from '../services/apiService';
// FIX: Replaced missing icon 'ShareIcon' with 'PaperAirplaneIcon' to fix import error.
import { ArrowRightIcon, GiftIcon, HistoryIcon, ClockIcon, QrCodeIcon, SparklesIcon, PaperAirplaneIcon } from '../../shared/icons';

// ... (existing helper functions: formatCurrency, useCountdown, isExpiringSoon) ...
const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
const useCountdown = (targetDate: string) => {
    const calculateTimeLeft = () => {
        const difference = +new Date(targetDate) - +new Date();
        let timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
        if (difference > 0) {
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
                total: difference,
            };
        }
        return timeLeft;
    };
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
    useEffect(() => {
        const timer = setTimeout(() => { setTimeLeft(calculateTimeLeft()); }, 1000);
        return () => clearTimeout(timer);
    });
    return timeLeft;
};
const isExpiringSoon = (expiryDate: string) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 7;
};

const hexToRgba = (hex: string, alpha: number): string => {
    if (!hex || hex.length < 4) return `rgba(255, 255, 255, ${alpha})`;
    let c: any = hex.substring(1).split('');
    if (c.length === 3) { c = [c[0], c[0], c[1], c[1], c[2], c[2]]; }
    c = '0x' + c.join('');
    return `rgba(${(c >> 16) & 255}, ${(c >> 8) & 255}, ${c & 255}, ${alpha})`;
};


// ... (existing interfaces) ...
interface PromotionsPageProps {
    currentUser: User | null;
    wallet: Wallet | null;
    setWallet: React.Dispatch<React.SetStateAction<Wallet | null>>;
    userVouchers: Promotion[];
    setUserVouchers: React.Dispatch<React.SetStateAction<Promotion[]>>;
    allTiers: Tier[];
}


export const PromotionsPage: React.FC<PromotionsPageProps> = ({ currentUser, wallet, setWallet, userVouchers, setUserVouchers, allTiers }) => {
    const navigate = useNavigate();
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [redeemableVouchers, setRedeemableVouchers] = useState<RedeemableVoucher[]>([]);
    const [redeemedVouchers, setRedeemedVouchers] = useState<Array<Promotion & { redeemedCount: number }>>([]); // Vouchers đã đổi bằng điểm
    const [pointsHistory, setPointsHistory] = useState<Array<{date: string; pointsChange: number; type: string; source: string; description: string}>>([]);
    
    // New states for extra data and features
    const [allServices, setAllServices] = useState<Service[]>([]);
    const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
    const [isBirthdayGiftOpened, setIsBirthdayGiftOpened] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [qrModalData, setQrModalData] = useState<{ code: string; title: string } | null>(null);
    const [detailModalData, setDetailModalData] = useState<Promotion | null>(null);
    const [activeTab, setActiveTab] = useState<'my_offers' | 'general' | 'history' | 'redeem'>('my_offers');
    const [lastFetchTime, setLastFetchTime] = useState<number>(Date.now());
    
    // Pagination states for redeem vouchers
    const [redeemCurrentPage, setRedeemCurrentPage] = useState(1);
    const [redeemItemsPerPage, setRedeemItemsPerPage] = useState(6);
    
    // (Lucky wheel removed)

    // Refetch redeemable vouchers when tab changes to 'redeem'
    useEffect(() => {
        if (activeTab === 'redeem') {
            const fetchRedeemable = async () => {
                try {
                    const fetchedRedeemable = await apiService.getRedeemableVouchers();
                    console.log('🔄 [TAB CHANGE] Refetched redeemable vouchers:', fetchedRedeemable?.length || 0);
                    setRedeemableVouchers(fetchedRedeemable || []);
                } catch (error) {
                    console.error('Error refetching redeemable vouchers:', error);
                }
            };
            fetchRedeemable();
        }
    }, [activeTab]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [fetchedPromotions, fetchedRedeemable, fetchedServices, userAppointments] = await Promise.all([
                    apiService.getPromotions(currentUser ? { userId: currentUser.id } : undefined),
                    apiService.getRedeemableVouchers(),
                    apiService.getServices(),
                    currentUser ? apiService.getUserAppointments(currentUser.id) : Promise.resolve([]),
                ]);

                console.log('\n📥 [CLIENT] Fetched redeemable vouchers:', fetchedRedeemable);
                console.log(`📊 [CLIENT] Total: ${fetchedRedeemable?.length || 0} vouchers`);
                if (fetchedRedeemable && fetchedRedeemable.length > 0) {
                    fetchedRedeemable.forEach((v: any) => {
                        console.log(`   ✅ ${v.id}: ${v.title}, isPublic: ${v.isPublic} (${typeof v.isPublic}), pointsRequired: ${v.pointsRequired} (${typeof v.pointsRequired})`);
                    });
                } else {
                    console.log('   ⚠️ [CLIENT] No redeemable vouchers found!');
                }
                setPromotions(fetchedPromotions);
                setRedeemableVouchers(fetchedRedeemable || []);
                setAllServices(fetchedServices);
                setAllAppointments(userAppointments);
                setLastFetchTime(Date.now());

                if (currentUser) {
                    const [fetchedPointsHistory, fetchedWallet, fetchedRedeemed] = await Promise.all([
                        apiService.getUserPointsHistory(currentUser.id),
                        apiService.getUserWallet(currentUser.id),
                        apiService.getMyRedeemedVouchers(currentUser.id)
                    ]);
                    setPointsHistory(fetchedPointsHistory);
                    setWallet(fetchedWallet);
                    setRedeemedVouchers(fetchedRedeemed || []);
                    console.log('✅ Fetched redeemed vouchers:', fetchedRedeemed?.length || 0);
                }
            } catch (error) { 
                console.error("Failed to fetch promotions page data:", error); 
                // Set empty array on error to prevent undefined
                setRedeemableVouchers([]);
            }
        };
        fetchData();
        
        // Listen for refresh events (e.g., after booking with voucher or payment success)
        const handleRefresh = () => {
            console.log('🔄 [PromotionsPage] Refreshing vouchers after booking/payment...');
            fetchData();
        };
        
        window.addEventListener('refresh-vouchers', handleRefresh);
        window.addEventListener('refresh-appointments', handleRefresh);
        
        // Also refresh when page becomes visible (user navigates back)
        const handleVisibilityChange = () => {
            if (!document.hidden && currentUser) {
                console.log('🔄 [PromotionsPage] Page visible, refreshing vouchers...');
                fetchData();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        return () => {
            window.removeEventListener('refresh-vouchers', handleRefresh);
            window.removeEventListener('refresh-appointments', handleRefresh);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [currentUser, setWallet]);

    // (AI suggestion removed per request)

    // Check if today is user's birthday
    const isBirthdayToday = useMemo(() => {
        if (!currentUser?.birthday) return false;
        const today = new Date();
        const birthDate = new Date(currentUser.birthday);
        return today.getMonth() === birthDate.getMonth() && today.getDate() === birthDate.getDate();
    }, [currentUser]);
    
    // Check if user has used a service (for New Clients vouchers)
    const hasUsedService = useMemo(() => {
        if (!currentUser || allAppointments.length === 0) return false;
        // Check if user has any completed/paid appointments
        return allAppointments.some(app =>
            (app.status === 'completed' || app.status === 'upcoming' || app.status === 'scheduled') &&
            app.paymentStatus === 'Paid'
        );
    }, [currentUser, allAppointments]);
    
    // Get available vouchers for "Ưu đãi của tôi" tab
    // QUAN TRỌNG: Chỉ hiển thị voucher Birthday và New Clients, KHÔNG hiển thị voucher public khác
    const myAvailableVouchers = useMemo(() => {
        if (!currentUser) return [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return promotions.filter(promo => {
            // Only show active, non-expired promotions
            if (!promo.isActive) return false;
            const expiryDate = new Date(promo.expiryDate);
            expiryDate.setHours(0, 0, 0, 0);
            if (today > expiryDate) return false;
            if (promo.stock !== null && promo.stock <= 0) return false;
            
            // CHỈ hiển thị voucher với targetAudience là Birthday hoặc New Clients
            // KHÔNG hiển thị voucher public thông thường (targetAudience === 'All' hoặc null)
            if (promo.targetAudience !== 'Birthday' && promo.targetAudience !== 'New Clients') {
                return false; // Loại bỏ tất cả voucher khác (bao gồm voucher public thông thường)
            }
            
            // Show birthday vouchers if today is birthday
            if (promo.targetAudience === 'Birthday' && isBirthdayToday) {
                return true;
            }
            
            // Show new client vouchers if user hasn't used any service
            if (promo.targetAudience === 'New Clients' && !hasUsedService) {
                return true;
            }
            
            return false;
        });
    }, [currentUser, promotions, isBirthdayToday, hasUsedService]);
    
    // Get all public promotions for "Ưu đãi chung" tab
    const generalPromotions = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return promotions.filter(promo => {
            if (!promo.isActive) return false;
            if (promo.isPublic !== true) return false; // Only show public promotions
            const expiryDate = new Date(promo.expiryDate);
            expiryDate.setHours(0, 0, 0, 0);
            if (today > expiryDate) return false;
            if (promo.stock !== null && promo.stock <= 0) return false;
            return true;
        });
    }, [promotions]);
    
    // Get private vouchers that can be redeemed with points
    // Use redeemableVouchers from API - display ALL vouchers regardless of user points
    const redeemablePrivateVouchers = useMemo(() => {
        // Display all redeemable vouchers, even if user is not logged in or doesn't have enough points
        // The API already filters for isPublic: false, pointsRequired > 0, isActive: true, not expired, and has stock
        return redeemableVouchers || [];
    }, [redeemableVouchers]);

    // Pagination for redeem vouchers
    const redeemTotalPages = Math.ceil(redeemablePrivateVouchers.length / redeemItemsPerPage);
    const paginatedRedeemVouchers = useMemo(() => {
        const startIndex = (redeemCurrentPage - 1) * redeemItemsPerPage;
        const endIndex = startIndex + redeemItemsPerPage;
        return redeemablePrivateVouchers.slice(startIndex, endIndex);
    }, [redeemablePrivateVouchers, redeemCurrentPage, redeemItemsPerPage]);

    // Reset to page 1 when tab changes
    useEffect(() => {
        if (activeTab === 'redeem') {
            setRedeemCurrentPage(1);
        }
    }, [activeTab]);
    
    const handleOpenBirthdayGift = () => {
        setIsBirthdayGiftOpened(true);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
    };

    // Lucky wheel feature removed from UI and logic
    const handleRedeemVoucher = async (voucher: RedeemableVoucher) => { /* existing logic */ };
    const handleClaimPromotion = async (promoToClaim: Promotion) => { /* existing logic */ };
    
    const handleRedeemWithPoints = async (promotion: Promotion) => {
        if (!currentUser || !wallet) return;
        
        if (wallet.points < (promotion.pointsRequired || 0)) {
            alert(`Bạn cần ${promotion.pointsRequired} điểm để đổi voucher này. Bạn hiện có ${wallet.points} điểm.`);
            return;
        }
        
        if (!window.confirm(`Bạn có chắc muốn đổi ${promotion.pointsRequired} điểm để lấy voucher "${promotion.title}"?`)) {
            return;
        }
        
        try {
            const result = await apiService.redeemVoucherWithPoints(promotion.id, currentUser.id);
            alert(result.message);
            
            // Refresh wallet, promotions, redeemable vouchers, and redeemed vouchers
            const [updatedWallet, updatedRedeemable, updatedRedeemed] = await Promise.all([
                apiService.getUserWallet(currentUser.id),
                apiService.getRedeemableVouchers(),
                apiService.getMyRedeemedVouchers(currentUser.id)
            ]);
            setWallet(updatedWallet);
            setRedeemableVouchers(updatedRedeemable);
            setRedeemedVouchers(updatedRedeemed || []);
            console.log('✅ Refreshed redeemed vouchers after redemption:', updatedRedeemed?.length || 0);
            
            const updatedPromotions = await apiService.getPromotions({ userId: currentUser.id });
            setPromotions(updatedPromotions);
            
            // Switch to "Ưu đãi của tôi" tab to show the newly redeemed voucher
            setActiveTab('my_offers');
        } catch (error: any) {
            console.error('Error redeeming voucher:', error);
            alert(error.message || 'Có lỗi xảy ra khi đổi voucher');
        }
    };
    
    const handleUsePromotion = (promotion: Promotion) => {
        // Navigate to booking page with serviceId if applicable
        if (promotion.applicableServiceIds && promotion.applicableServiceIds.length > 0) {
            navigate(`/booking?serviceId=${promotion.applicableServiceIds[0]}&promoCode=${promotion.code}`);
        } else {
            navigate(`/booking?promoCode=${promotion.code}`);
        }
    };
    
    // ... (rest of component JSX)
    return (
      <div className="container mx-auto px-4 py-12">
        {/* ... (existing header and title JSX) ... */}
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-brand-dark text-center mb-12">Ưu Đãi & Điểm Thưởng</h1>

        <div className="max-w-6xl mx-auto">
            <div className="mb-8 flex justify-center border-b border-gray-200">
                <button onClick={() => setActiveTab('my_offers')} className={`px-6 py-3 font-medium text-lg transition-colors ${activeTab === 'my_offers' ? 'border-b-2 border-brand-primary text-brand-dark' : 'text-gray-500 hover:text-brand-dark'}`}>Ưu đãi của tôi</button>
                <button onClick={() => setActiveTab('general')} className={`px-6 py-3 font-medium text-lg transition-colors ${activeTab === 'general' ? 'border-b-2 border-brand-primary text-brand-dark' : 'text-gray-500 hover:text-brand-dark'}`}>Ưu đãi chung</button>
                <button onClick={() => setActiveTab('redeem')} className={`px-6 py-3 font-medium text-lg transition-colors ${activeTab === 'redeem' ? 'border-b-2 border-brand-primary text-brand-dark' : 'text-gray-500 hover:text-brand-dark'}`}>Đổi điểm lấy voucher</button>
                <button onClick={() => setActiveTab('history')} className={`px-6 py-3 font-medium text-lg transition-colors ${activeTab === 'history' ? 'border-b-2 border-brand-primary text-brand-dark' : 'text-gray-500 hover:text-brand-dark'}`}>Lịch sử điểm</button>
            </div>
            
            {/* ... (rest of the component structure with new tabs) ... */}

            {activeTab === 'my_offers' && currentUser && (
                <div className="space-y-12 animate-fadeInUp">
                    {/* User Wallet Info */}
                    {wallet && (
                         <div className="bg-gradient-to-r from-brand-primary to-pink-400 text-white p-6 rounded-lg shadow-md flex flex-col md:flex-row items-center justify-between">
                            <div className="text-center md:text-left mb-4 md:mb-0">
                                <p className="text-xl font-semibold">Xin chào, {currentUser.name}!</p>
                                <p className="text-3xl font-bold mt-1">{wallet.points.toLocaleString()} điểm</p>
                            </div>
                            <Link to="/profile" className="bg-white text-brand-dark px-6 py-3 rounded-full font-bold shadow-lg hover:bg-gray-100 transition-colors">
                                Quản lý hồ sơ
                            </Link>
                        </div>
                    )}
                    
                    {/* Birthday & New Client Vouchers */}
                    {myAvailableVouchers.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-2xl font-serif font-bold text-gray-800">Voucher dành cho bạn</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {myAvailableVouchers.map(promo => (
                                    <div key={promo.id} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col border-2 border-brand-primary/50">
                                        <div className="p-5 flex flex-col flex-grow">
                                            <div className="flex items-center gap-2 mb-2">
                                                {promo.targetAudience === 'Birthday' && (
                                                    <span className="bg-pink-100 text-pink-600 text-xs font-bold px-2 py-1 rounded">🎂 Sinh nhật</span>
                                                )}
                                                {promo.targetAudience === 'New Clients' && (
                                                    <span className="bg-blue-100 text-blue-600 text-xs font-bold px-2 py-1 rounded">🆕 Khách mới</span>
                                                )}
                                            </div>
                                            <h3 className="font-bold text-lg text-gray-800 mb-2">{promo.title}</h3>
                                            <p className="text-gray-600 text-sm mb-4 line-clamp-2">{promo.description}</p>
                                            <div className="flex gap-2 mt-auto">
                                                <button
                                                    onClick={() => setDetailModalData(promo)}
                                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md font-semibold hover:bg-gray-200 transition-colors"
                                                >
                                                    Chi tiết
                                                </button>
                                                <Link 
                                                    to={`/booking?promoCode=${promo.code}${promo.applicableServiceIds && promo.applicableServiceIds.length > 0 ? `&serviceId=${promo.applicableServiceIds[0]}` : ''}`}
                                                    className="flex-1 text-center bg-brand-primary text-white py-2 px-4 rounded-md font-semibold hover:bg-brand-dark transition-colors"
                                                >
                                                    Sử dụng ngay
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {/* {myAvailableVouchers.length === 0 && (
                        <div className="text-center text-gray-500 py-6">
                            <p>Hiện tại không có voucher nào dành cho bạn.</p>
                            {isBirthdayToday && <p className="mt-2">🎂 Chúc mừng sinh nhật! Voucher sinh nhật sẽ xuất hiện ở đây.</p>}
                            {!hasUsedService && <p className="mt-2">🆕 Voucher dành cho khách hàng mới sẽ xuất hiện ở đây.</p>}
                        </div>
                    )} */}
                    {/* My Vouchers - Display redeemed vouchers (vouchers đã đổi bằng điểm) */}
                    {/* QUAN TRỌNG: CHỈ hiển thị voucher đổi điểm (isPublic = false), KHÔNG hiển thị voucher public */}
                    <div>
                        <h2 className="text-2xl font-serif font-bold text-gray-800 mb-4">Voucher của tôi</h2>
                        {redeemedVouchers.filter((v: any) => {
                            // CHỈ hiển thị voucher đổi điểm (isPublic = false)
                            const isPublic = v.isPublic === true || v.isPublic === 1 || v.isPublic === '1';
                            return !isPublic && v.redeemedCount > 0;
                        }).length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {redeemedVouchers.filter((v: any) => {
                                    // CHỈ hiển thị voucher đổi điểm (isPublic = false)
                                    const isPublic = v.isPublic === true || v.isPublic === 1 || v.isPublic === '1';
                                    return !isPublic && v.redeemedCount > 0;
                                }).map((voucher: any) => (
                                    <div key={voucher.id} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col transition-all hover:shadow-xl border-2 border-brand-primary/50">
                                        <div className="p-5 flex flex-col flex-grow">
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="font-bold text-lg text-gray-800">{voucher.title}</h3>
                                                {voucher.redeemedCount > 0 && (
                                                    <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full">
                                                        Còn {voucher.redeemedCount} voucher
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex justify-between items-center text-sm font-semibold mb-4">
                                                <span className="text-brand-primary">Mã: {voucher.code}</span>
                                                <span className="text-red-500 flex items-center gap-1">
                                                    <ClockIcon className="w-4 h-4" /> 
                                                    {new Date(voucher.expiryDate).toLocaleDateString('vi-VN')}
                                                </span>
                                            </div>
                                            <div className="flex gap-2">
                                                <Link 
                                                    to={`/booking?promoCode=${voucher.code}`} 
                                                    className="flex-1 text-center bg-brand-primary text-white py-2 px-4 rounded-md font-semibold hover:bg-brand-dark transition-colors"
                                                >
                                                    Dùng ngay
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : ( 
                            <p className="text-center text-gray-500 py-6">Bạn chưa có voucher nào đã đổi bằng điểm.</p> 
                        )}
                    </div>
                </div>
            )}
            
            {activeTab === 'general' && (
                <div className="space-y-12 animate-fadeInUp">
                    <h2 className="text-2xl font-serif font-bold text-gray-800">Tất cả ưu đãi</h2>
                    {generalPromotions.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {generalPromotions.map(promo => {
                                const discountDisplay = promo.discountType === 'percentage' 
                                    ? `${promo.discountValue}%` 
                                    : formatCurrency(promo.discountValue);
                                return (
                                    <div key={promo.id} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col border-2 border-brand-primary/50">
                                        <div className="p-5 flex flex-col flex-grow">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">ƯU ĐÃI -{discountDisplay}</span>
                                            </div>
                                            <h3 className="font-bold text-lg text-gray-800 mb-2">{promo.title}</h3>
                                            <p className="text-gray-600 text-sm mb-4 line-clamp-2">{promo.description}</p>
                                            <div className="text-xs text-gray-500 mb-4">
                                                <span className="flex items-center gap-1">
                                                    <ClockIcon className="w-4 h-4" />
                                                    Hết hạn: {new Date(promo.expiryDate).toLocaleDateString('vi-VN')}
                                                </span>
                                            </div>
                                            <div className="flex gap-2 mt-auto">
                                                <button
                                                    onClick={() => setDetailModalData(promo)}
                                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md font-semibold hover:bg-gray-200 transition-colors"
                                                >
                                                    Chi tiết
                                                </button>
                                                <button 
                                                    onClick={() => handleUsePromotion(promo)}
                                                    className="flex-1 bg-brand-primary text-white py-2 px-4 rounded-md font-semibold hover:bg-brand-dark transition-colors"
                                                >
                                                    Sử dụng ngay
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 py-6">
                            <p>Hiện tại không có ưu đãi nào.</p>
                        </div>
                    )}
                </div>
            )}
            
            {activeTab === 'redeem' && (
                <div className="space-y-12 animate-fadeInUp">
                    {wallet ? (
                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 rounded-lg shadow-md">
                            <p className="text-xl font-semibold mb-2">Điểm hiện có</p>
                            <p className="text-4xl font-bold">{wallet.points.toLocaleString()} điểm</p>
                            <p className="text-sm mt-2 opacity-90">Đổi điểm để nhận voucher độc quyền</p>
                        </div>
                    ) : (
                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 rounded-lg shadow-md">
                            <p className="text-xl font-semibold mb-2">Điểm hiện có</p>
                            <p className="text-4xl font-bold">0 điểm</p>
                            <p className="text-sm mt-2 opacity-90">Đăng nhập để tích điểm và đổi voucher độc quyền</p>
                        </div>
                    )}
                    
                    <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-serif font-bold text-gray-800">Voucher có thể đổi bằng điểm</h2>
                        {redeemablePrivateVouchers.length > 0 && (
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-600">
                                    Hiển thị {Math.min((redeemCurrentPage - 1) * redeemItemsPerPage + 1, redeemablePrivateVouchers.length)} - {Math.min(redeemCurrentPage * redeemItemsPerPage, redeemablePrivateVouchers.length)} / {redeemablePrivateVouchers.length} voucher
                                </span>
                                <select
                                    value={redeemItemsPerPage}
                                    onChange={(e) => {
                                        setRedeemItemsPerPage(Number(e.target.value));
                                        setRedeemCurrentPage(1);
                                    }}
                                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-brand-primary focus:border-brand-primary"
                                >
                                    <option value={6}>6 voucher/trang</option>
                                    <option value={9}>9 voucher/trang</option>
                                    <option value={12}>12 voucher/trang</option>
                                    <option value={18}>18 voucher/trang</option>
                                </select>
                            </div>
                        )}
                    </div>
                    {redeemablePrivateVouchers.length > 0 ? (
                        <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {paginatedRedeemVouchers.map(promo => {
                                const p: any = promo as any;
                                const discountDisplay = p.discountType === 'percentage' 
                                    ? `${p.discountValue}%` 
                                    : formatCurrency(p.discountValue);
                                const canAfford = wallet && wallet.points >= (p.pointsRequired || 0);
                                return (
                                    <div key={p.id} className={`bg-white rounded-lg shadow-md overflow-hidden flex flex-col border-2 ${canAfford ? 'border-purple-500' : 'border-gray-300'}`}>
                                        <div className="p-5 flex flex-col flex-grow">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded">🔒 PRIVATE</span>
                                                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">-{discountDisplay}</span>
                                            </div>
                                            <h3 className="font-bold text-lg text-gray-800 mb-2">{p.title}</h3>
                                            <p className="text-gray-600 text-sm mb-4 line-clamp-2">{p.description}</p>
                                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
                                                <p className="text-sm font-semibold text-purple-800">
                                                    💎 {p.pointsRequired} điểm
                                                </p>
                                                {wallet ? (
                                                    <p className={`text-xs mt-1 ${canAfford ? 'text-green-600' : 'text-red-600'}`}>
                                                        {canAfford 
                                                            ? `✓ Bạn có đủ điểm (${wallet.points} điểm)` 
                                                            : `✗ Bạn cần thêm ${(p.pointsRequired || 0) - wallet.points} điểm`}
                                                    </p>
                                                ) : (
                                                    <p className="text-xs mt-1 text-gray-600">
                                                        Đăng nhập để xem số điểm của bạn
                                                    </p>
                                                )}
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    if (!currentUser) {
                                                        alert('Vui lòng đăng nhập để đổi voucher');
                                                        return;
                                                    }
                                                    handleRedeemWithPoints(p as Promotion);
                                                }}
                                                disabled={!currentUser || !canAfford}
                                                className={`w-full py-2 px-4 rounded-md font-semibold transition-colors mt-auto ${
                                                    currentUser && canAfford
                                                        ? 'bg-purple-600 text-white hover:bg-purple-700' 
                                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                }`}
                                            >
                                                {!currentUser ? 'Đăng nhập để đổi' : (canAfford ? 'Đổi ngay' : 'Không đủ điểm')}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                            
                            {/* Pagination Controls */}
                            {redeemTotalPages > 1 && (
                                <div className="mt-8 flex justify-center items-center gap-2">
                                    <button
                                        onClick={() => setRedeemCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={redeemCurrentPage === 1}
                                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                            redeemCurrentPage === 1
                                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        Trước
                                    </button>
                                    
                                    <div className="flex gap-1">
                                        {Array.from({ length: redeemTotalPages }, (_, i) => i + 1).map(page => {
                                            // Show first page, last page, current page, and pages around current
                                            if (
                                                page === 1 ||
                                                page === redeemTotalPages ||
                                                (page >= redeemCurrentPage - 1 && page <= redeemCurrentPage + 1)
                                            ) {
                                                return (
                                                    <button
                                                        key={page}
                                                        onClick={() => setRedeemCurrentPage(page)}
                                                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                                            redeemCurrentPage === page
                                                                ? 'bg-brand-primary text-white'
                                                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        {page}
                                                    </button>
                                                );
                                            } else if (
                                                page === redeemCurrentPage - 2 ||
                                                page === redeemCurrentPage + 2
                                            ) {
                                                return (
                                                    <span key={page} className="px-2 py-2 text-gray-500">
                                                        ...
                                                    </span>
                                                );
                                            }
                                            return null;
                                        })}
                                    </div>
                                    
                                    <button
                                        onClick={() => setRedeemCurrentPage(prev => Math.min(redeemTotalPages, prev + 1))}
                                        disabled={redeemCurrentPage === redeemTotalPages}
                                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                            redeemCurrentPage === redeemTotalPages
                                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        Sau
                                    </button>
                                    
                                    <span className="text-sm text-gray-600 ml-4">
                                        Trang {redeemCurrentPage} / {redeemTotalPages}
                                    </span>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center text-gray-500 py-6">
                            <p>Hiện tại không có voucher nào có thể đổi bằng điểm.</p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'history' && (
                 <div className="animate-fadeInUp">
                    <h2 className="text-2xl font-serif font-bold text-gray-800 mb-6">Lịch sử điểm</h2>
                    {wallet && (
                        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Điểm hiện có</p>
                                    <p className="text-3xl font-bold text-brand-primary">{wallet.points.toLocaleString()} điểm</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-600">Tổng đã chi tiêu</p>
                                    <p className="text-xl font-semibold text-gray-800">{formatCurrency(parseFloat(wallet.totalSpent?.toString() || '0'))}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {pointsHistory.length > 0 ? (
                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mô tả</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thay đổi</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {pointsHistory.map((entry, index) => (
                                        <tr key={index}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {new Date(entry.date).toLocaleDateString('vi-VN')}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {entry.description}
                                            </td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-semibold ${entry.pointsChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {entry.pointsChange > 0 ? '+' : ''}{entry.pointsChange} điểm
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow-md p-12 text-center">
                            <p className="text-gray-500">Chưa có lịch sử điểm.</p>
                            <p className="text-sm text-gray-400 mt-2">Bạn sẽ nhận được điểm khi thanh toán dịch vụ (1000 VNĐ = 1 điểm)</p>
                        </div>
                    )}
                </div>
            )}

            {detailModalData && (
                <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4" onClick={() => setDetailModalData(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="sticky top-0 bg-gradient-to-r from-brand-primary to-brand-dark text-white p-6 rounded-t-2xl">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <h3 className="text-2xl font-bold mb-2">{detailModalData.title}</h3>
                                    <p className="text-white/90 text-sm">{detailModalData.description}</p>
                                </div>
                                <button onClick={() => setDetailModalData(null)} className="text-white hover:bg-white/20 rounded-full p-2 transition-colors">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <div className="bg-gradient-to-r from-red-50 to-orange-50 p-4 rounded-lg border border-red-200">
                                <p className="text-sm text-gray-600 mb-1">Giảm giá</p>
                                <p className="text-3xl font-bold text-red-600">
                                    {detailModalData.discountType === 'percentage' 
                                        ? `${detailModalData.discountValue}%`
                                        : `${detailModalData.discountValue.toLocaleString()} VNĐ`}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-600 mb-1">Mã voucher</p>
                                    <p className="font-mono font-bold text-brand-primary">{detailModalData.code}</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-600 mb-1">Hạn sử dụng</p>
                                    <p className="font-semibold text-gray-800">{new Date(detailModalData.expiryDate).toLocaleDateString('vi-VN')}</p>
                                </div>
                            </div>

                            {detailModalData.targetAudience && (
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                    <p className="text-sm text-gray-600 mb-1">Đối tượng áp dụng</p>
                                    <p className="font-semibold text-blue-800">{detailModalData.targetAudience}</p>
                                </div>
                            )}

                            {detailModalData.minOrderValue && detailModalData.minOrderValue > 0 && (
                                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                                    <p className="text-sm text-gray-600 mb-1">Giá trị đơn hàng tối thiểu</p>
                                    <p className="font-semibold text-yellow-800">{detailModalData.minOrderValue.toLocaleString()} VNĐ</p>
                                </div>
                            )}

                            {detailModalData.applicableServiceIds && detailModalData.applicableServiceIds.length > 0 && (
                                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                    <p className="text-sm text-gray-600 mb-2">Dịch vụ áp dụng</p>
                                    <div className="space-y-1">
                                        {detailModalData.applicableServiceIds.map(serviceId => {
                                            const service = allServices.find(s => s.id === serviceId);
                                            return service ? (
                                                <p key={serviceId} className="text-sm font-medium text-purple-800">• {service.name}</p>
                                            ) : null;
                                        })}
                                    </div>
                                </div>
                            )}

                            {detailModalData.stock !== null && (
                                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                    <p className="text-sm text-gray-600 mb-1">Số lượng còn lại</p>
                                    <p className="font-semibold text-green-800">{detailModalData.stock} voucher</p>
                                </div>
                            )}

                            {detailModalData.pointsRequired && detailModalData.pointsRequired > 0 && (
                                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                                    <p className="text-sm text-gray-600 mb-1">Điểm cần đổi</p>
                                    <p className="font-semibold text-indigo-800">{detailModalData.pointsRequired} điểm</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {qrModalData && (
                <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4" onClick={() => setQrModalData(null)}>
                    <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6 text-center" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Mã QR cho ưu đãi</h3>
                        <p className="text-brand-primary mb-4 font-semibold">{qrModalData.title}</p>
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrModalData.code)}`} alt={`QR Code for ${qrModalData.code}`} className="mx-auto my-4 border-4 p-2 rounded-lg" />
                        <p className="text-gray-600">Đưa mã này cho nhân viên tại quầy để áp dụng ưu đãi.</p>
                        <p className="font-mono text-2xl font-bold my-3">{qrModalData.code}</p>
                    </div>
                </div>
            )}
        </div>
      </div>
    );
};
