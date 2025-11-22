
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import type { Promotion, Wallet, RedeemableVoucher, PointsHistory, User, Tier, Prize, Service, Appointment } from '../../types';
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
    const [pointsHistory, setPointsHistory] = useState<Array<{date: string; pointsChange: number; type: string; source: string; description: string}>>([]);
    const [luckyWheelPrizes, setLuckyWheelPrizes] = useState<Prize[]>([]);
    
    // New states for extra data and features
    const [allServices, setAllServices] = useState<Service[]>([]);
    const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
    const [aiSuggestion, setAiSuggestion] = useState<Promotion | null>(null);
    const [isBirthdayGiftOpened, setIsBirthdayGiftOpened] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [qrModalData, setQrModalData] = useState<{ code: string; title: string } | null>(null);

    const [activeTab, setActiveTab] = useState<'my_offers' | 'general' | 'history' | 'redeem'>('my_offers');
    
    // Lucky Wheel State
    const [isSpinning, setIsSpinning] = useState(false);
    const [wheelRotation, setWheelRotation] = useState(0);
    const [spinResultModal, setSpinResultModal] = useState<Prize | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [fetchedPromotions, fetchedRedeemable, fetchedLuckyPrizes, fetchedServices, userAppointments] = await Promise.all([
                    apiService.getPromotions(currentUser ? { userId: currentUser.id } : undefined),
                    apiService.getRedeemableVouchers(),
                    apiService.getLuckyWheelPrizes(),
                    apiService.getServices(),
                    currentUser ? apiService.getUserAppointments(currentUser.id) : Promise.resolve([]),
                ]);

                console.log('Fetched redeemable vouchers:', fetchedRedeemable);
                setPromotions(fetchedPromotions);
                setRedeemableVouchers(fetchedRedeemable || []);
                setLuckyWheelPrizes(fetchedLuckyPrizes);
                setAllServices(fetchedServices);
                setAllAppointments(userAppointments);

                if (currentUser) {
                    const fetchedPointsHistory = await apiService.getUserPointsHistory(currentUser.id);
                    setPointsHistory(fetchedPointsHistory);
                    const fetchedWallet = await apiService.getUserWallet(currentUser.id);
                    setWallet(fetchedWallet);
                }
            } catch (error) { 
                console.error("Failed to fetch promotions page data:", error); 
                // Set empty array on error to prevent undefined
                setRedeemableVouchers([]);
            }
        };
        fetchData();
    }, [currentUser, setWallet]);

    // AI suggestion logic
    useEffect(() => {
        if (currentUser && allServices.length > 0 && allAppointments.length > 0 && promotions.length > 0) {
            const usedCategoryIds = new Set(
                allAppointments
                    .map(app => allServices.find(s => s.id === app.serviceId)?.categoryId)
                    .filter(Boolean)
            );
            const suggestion = promotions.find(p => {
                if (!p.applicableServiceIds || p.applicableServiceIds.length === 0) return false;
                const promoService = allServices.find(s => s.id === p.applicableServiceIds![0]);
                return promoService && !usedCategoryIds.has(promoService.categoryId);
            });
            setAiSuggestion(suggestion || null);
        }
    }, [currentUser, allServices, allAppointments, promotions]);

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
    
    const handleOpenBirthdayGift = () => {
        setIsBirthdayGiftOpened(true);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
    };

    // ... (rest of the logic: availablePromotions, handleRedeemVoucher, handleClaimPromotion, handleSpin, etc.) ...
     const handleSpin = async () => {
        // Note: spinsLeft field removed from Wallet type in db.txt
        // Lucky wheel functionality disabled until spinsLeft is re-added to database
        if (!currentUser || !wallet || isSpinning) return;
        alert('Tính năng vòng quay may mắn đang được bảo trì.');
        return;
    
        setIsSpinning(true);
        try {
            const prizes = luckyWheelPrizes;
            if (prizes.length === 0) { setIsSpinning(false); return; }
            
            const totalPrizes = prizes.length;
            const randomPrizeIndex = Math.floor(Math.random() * totalPrizes);
            const prize = prizes[randomPrizeIndex];
            const segmentAngle = 360 / totalPrizes;
            const randomOffset = (Math.random() - 0.5) * (segmentAngle * 0.8);
            const targetAngle = (randomPrizeIndex * segmentAngle) + (segmentAngle / 2) + randomOffset;
            const finalRotation = (360 * 5) + (360 - targetAngle);
    
            setWheelRotation(prev => prev + finalRotation);
    
            setTimeout(async () => {
                setIsSpinning(false);
                setSpinResultModal(prize);
                try {
                    const freshWallet = await apiService.getUserWallet(currentUser.id);
                    let walletUpdatePayload: Partial<Wallet> = {};
                    let newHistoryEntry: { date?: string; pointsChange: number; type?: string; source?: string; description: string } | null = null;
    
                    switch (prize.type) {
                        case 'points':
                            walletUpdatePayload = { points: freshWallet.points + prize.value };
                            newHistoryEntry = { description: `Vòng quay may mắn: +${prize.value} điểm`, pointsChange: prize.value, type: 'earned', source: 'lucky_wheel' };
                            break;
                        case 'spin':
                            // Note: spinsLeft removed from Wallet, skip this prize type
                            newHistoryEntry = { description: `Vòng quay may mắn: +${prize.value} lượt quay (tạm thời không khả dụng)`, pointsChange: 0, type: 'earned', source: 'lucky_wheel' };
                            break;
                        case 'voucher':
                        case 'voucher_fixed':
                            const newVoucher: Promotion = {
                                id: `uv-wheel-${Date.now()}`,
                                title: prize.type === 'voucher' ? `Voucher giảm ${prize.value}%` : `Voucher giảm ${formatCurrency(prize.value)}`,
                                description: `Voucher từ Vòng quay may mắn.`,
                                code: `LUCKY${Math.floor(1000 + Math.random() * 9000)}`,
                                expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                                imageUrl: '/img/promotions/promo-voucher.jpg',
                                discountType: prize.type === 'voucher' ? 'percentage' : 'fixed',
                                discountValue: prize.value,
                                termsAndConditions: 'Voucher áp dụng cho lần đặt lịch tiếp theo.',
                            };
                            setUserVouchers(prev => [...prev, newVoucher!]);
                            newHistoryEntry = { description: `Vòng quay may mắn: Nhận ${newVoucher.title}`, pointsChange: 0 };
                            break;
                    }
    
                    if (Object.keys(walletUpdatePayload).length > 0) {
                        const walletAfterPrize = await apiService.updateUserWallet(currentUser.id, walletUpdatePayload);
                        setWallet(walletAfterPrize);
                    }
    
                    if (newHistoryEntry) {
                        await apiService.createPointsHistoryEntry(currentUser.id, newHistoryEntry);
                        // Refresh points history
                        const updatedHistory = await apiService.getUserPointsHistory(currentUser.id);
                        setPointsHistory(updatedHistory.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
                    }
    
                } catch (error) { console.error("Failed to apply prize:", error); alert("Đã có lỗi xảy ra khi nhận phần thưởng."); }
            }, 5500);
        } catch (error) {
            console.error("Failed to spin wheel:", error);
            alert("Vòng quay thất bại.");
            if(currentUser) {
                const actualWallet = await apiService.getUserWallet(currentUser.id);
                setWallet(actualWallet);
            }
            setIsSpinning(false);
        }
    };
    const formatWheelLabel = (label: string) => {
        const words = label.split(' ');
        if (words.length > 1) {
            if (!isNaN(Number(words[0]))) { return <div className="flex flex-col items-center leading-tight"><span>{words[0]}</span><span className="text-xs">{words.slice(1).join(' ')}</span></div>; }
            if (words[0].toLowerCase() === 'thêm' && words.length > 2) { return <div className="flex flex-col items-center leading-tight"><span>{words[0]} {words[1]}</span><span className="text-xs">{words.slice(2).join(' ')}</span></div>; }
            return <div className="flex flex-col items-center leading-tight"><span>{words[0]}</span><span className="text-xs">{words.slice(1).join(' ')}</span></div>;
        }
        return <span>{label}</span>;
    };
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
            
            // Refresh wallet, promotions, and redeemable vouchers
            const [updatedWallet, updatedRedeemable] = await Promise.all([
                apiService.getUserWallet(currentUser.id),
                apiService.getRedeemableVouchers()
            ]);
            setWallet(updatedWallet);
            setRedeemableVouchers(updatedRedeemable);
            
            const updatedPromotions = await apiService.getPromotions({ userId: currentUser.id });
            setPromotions(updatedPromotions);
            
            // Add to user vouchers
            setUserVouchers(prev => [...prev, result.promotion]);
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
                    
                    {myAvailableVouchers.length === 0 && (
                        <div className="text-center text-gray-500 py-6">
                            <p>Hiện tại không có voucher nào dành cho bạn.</p>
                            {isBirthdayToday && <p className="mt-2">🎂 Chúc mừng sinh nhật! Voucher sinh nhật sẽ xuất hiện ở đây.</p>}
                            {!hasUsedService && <p className="mt-2">🆕 Voucher dành cho khách hàng mới sẽ xuất hiện ở đây.</p>}
                        </div>
                    )}

                    {/* AI Suggestion */}
                    {aiSuggestion && (
                        <div className="bg-white p-6 rounded-lg shadow-soft-lg border border-purple-200/80">
                            <h3 className="text-xl font-bold font-serif text-brand-text mb-4 flex items-center gap-2"><SparklesIcon className="w-6 h-6 text-purple-500" /> Dành riêng cho bạn</h3>
                             <div className="flex flex-col sm:flex-row gap-6">
                                <img src={aiSuggestion.imageUrl} alt={aiSuggestion.title} className="w-full sm:w-48 h-32 object-cover rounded-md flex-shrink-0" />
                                <div>
                                    <p className="font-semibold text-lg text-brand-dark">{aiSuggestion.title}</p>
                                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{aiSuggestion.description}</p>
                                    <button onClick={() => handleClaimPromotion(aiSuggestion)} className="mt-4 bg-purple-600 text-white font-semibold py-2 px-5 rounded-lg hover:bg-purple-700 transition-colors text-sm">Nhận ưu đãi</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Lucky Wheel */}
                    {wallet && luckyWheelPrizes.length > 0 && (
                        <section className="bg-white p-8 rounded-lg shadow-soft-xl text-center">
                            {/* ... (Lucky Wheel JSX from before) ... */}
                        </section>
                    )}
                    

                    {/* My Vouchers */}
                    <div>
                        <h2 className="text-2xl font-serif font-bold text-gray-800 mb-4">Voucher của tôi</h2>
                        {userVouchers.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {userVouchers.map(promo => (
                                    <div key={promo.id} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col transition-all hover:shadow-xl border-2 border-brand-primary/50">
                                        <div className="p-5 flex flex-col flex-grow">
                                            <h3 className="font-bold text-lg text-gray-800 mb-2">{promo.title}</h3>
                                            <div className="flex justify-between items-center text-sm font-semibold mb-4">
                                                <span className="text-brand-primary">Mã: {promo.code}</span>
                                                <span className="text-red-500 flex items-center gap-1"><ClockIcon className="w-4 h-4" /> {new Date(promo.expiryDate).toLocaleDateString('vi-VN')}</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <Link to={`/booking?promoCode=${promo.code}`} className="flex-1 text-center bg-brand-primary text-white py-2 px-4 rounded-md font-semibold hover:bg-brand-dark transition-colors">Dùng ngay</Link>
                                                <button onClick={() => setQrModalData({ code: promo.code, title: promo.title })} className="p-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"><QrCodeIcon className="w-5 h-5"/></button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : ( <p className="text-center text-gray-500 py-6">Bạn chưa có voucher nào.</p> )}
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
                                        {promo.imageUrl && (
                                            <img src={promo.imageUrl} alt={promo.title} className="w-full h-48 object-cover" />
                                        )}
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
                                            <button 
                                                onClick={() => handleUsePromotion(promo)}
                                                className="w-full bg-brand-primary text-white py-2 px-4 rounded-md font-semibold hover:bg-brand-dark transition-colors mt-auto"
                                            >
                                                Sử dụng ngay
                                            </button>
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
                    
                    <h2 className="text-2xl font-serif font-bold text-gray-800">Voucher có thể đổi bằng điểm</h2>
                    {redeemablePrivateVouchers.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {redeemablePrivateVouchers.map(promo => {
                                const discountDisplay = promo.discountType === 'percentage' 
                                    ? `${promo.discountValue}%` 
                                    : formatCurrency(promo.discountValue);
                                const canAfford = wallet && wallet.points >= (promo.pointsRequired || 0);
                                return (
                                    <div key={promo.id} className={`bg-white rounded-lg shadow-md overflow-hidden flex flex-col border-2 ${canAfford ? 'border-purple-500' : 'border-gray-300'}`}>
                                        {promo.imageUrl && (
                                            <img src={promo.imageUrl} alt={promo.title} className="w-full h-48 object-cover" />
                                        )}
                                        <div className="p-5 flex flex-col flex-grow">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded">🔒 PRIVATE</span>
                                                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">-{discountDisplay}</span>
                                            </div>
                                            <h3 className="font-bold text-lg text-gray-800 mb-2">{promo.title}</h3>
                                            <p className="text-gray-600 text-sm mb-4 line-clamp-2">{promo.description}</p>
                                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
                                                <p className="text-sm font-semibold text-purple-800">
                                                    💎 {promo.pointsRequired} điểm
                                                </p>
                                                {wallet ? (
                                                    <p className={`text-xs mt-1 ${canAfford ? 'text-green-600' : 'text-red-600'}`}>
                                                        {canAfford 
                                                            ? `✓ Bạn có đủ điểm (${wallet.points} điểm)` 
                                                            : `✗ Bạn cần thêm ${(promo.pointsRequired || 0) - wallet.points} điểm`}
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
                                                    handleRedeemWithPoints(promo);
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
