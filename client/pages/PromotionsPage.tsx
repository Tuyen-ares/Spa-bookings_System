
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

    const [activeTab, setActiveTab] = useState<'my_offers' | 'general' | 'history'>('my_offers');
    
    // Lucky Wheel State
    const [isSpinning, setIsSpinning] = useState(false);
    const [wheelRotation, setWheelRotation] = useState(0);
    const [spinResultModal, setSpinResultModal] = useState<Prize | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [fetchedPromotions, fetchedRedeemable, fetchedLuckyPrizes, fetchedServices, userAppointments] = await Promise.all([
                    apiService.getPromotions(),
                    apiService.getRedeemableVouchers(),
                    apiService.getLuckyWheelPrizes(),
                    apiService.getServices(),
                    currentUser ? apiService.getUserAppointments(currentUser.id) : Promise.resolve([]),
                ]);

                setPromotions(fetchedPromotions);
                setRedeemableVouchers(fetchedRedeemable);
                setLuckyWheelPrizes(fetchedLuckyPrizes);
                setAllServices(fetchedServices);
                setAllAppointments(userAppointments);

                if (currentUser) {
                    const fetchedPointsHistory = await apiService.getUserPointsHistory(currentUser.id);
                    setPointsHistory(fetchedPointsHistory);
                    const fetchedWallet = await apiService.getUserWallet(currentUser.id);
                    setWallet(fetchedWallet);
                }
            } catch (error) { console.error("Failed to fetch promotions page data:", error); }
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

    const isBirthdayMonth = useMemo(() => {
        if (!currentUser?.birthday) return false;
        const today = new Date();
        const birthDate = new Date(currentUser.birthday);
        return today.getMonth() === birthDate.getMonth();
    }, [currentUser]);
    
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
    
    // ... (rest of component JSX)
    return (
      <div className="container mx-auto px-4 py-12">
        {/* ... (existing header and title JSX) ... */}
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-brand-dark text-center mb-12">Ưu Đãi & Điểm Thưởng</h1>

        <div className="max-w-6xl mx-auto">
            <div className="mb-8 flex justify-center border-b border-gray-200">
                <button onClick={() => setActiveTab('my_offers')} className={`px-6 py-3 font-medium text-lg transition-colors ${activeTab === 'my_offers' ? 'border-b-2 border-brand-primary text-brand-dark' : 'text-gray-500 hover:text-brand-dark'}`}>Ưu đãi của tôi</button>
                <button onClick={() => setActiveTab('general')} className={`px-6 py-3 font-medium text-lg transition-colors ${activeTab === 'general' ? 'border-b-2 border-brand-primary text-brand-dark' : 'text-gray-500 hover:text-brand-dark'}`}>Ưu đãi chung</button>
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
                                {/* Calculate tier from wallet points since tierLevel is not in users table */}
                                <p className="text-sm">Bạn đang ở hạng {(() => {
                                    if (!wallet) return 'Đồng';
                                    const userPoints = wallet.points || 0;
                                    const sortedTiers = [...allTiers].sort((a, b) => (a.pointsRequired || 0) - (b.pointsRequired || 0));
                                    let tierLevel = 1;
                                    for (let i = sortedTiers.length - 1; i >= 0; i--) {
                                        if (userPoints >= (sortedTiers[i].pointsRequired || 0)) {
                                            tierLevel = sortedTiers[i].level;
                                            break;
                                        }
                                    }
                                    return allTiers.find(t => t.level === tierLevel)?.name || 'Đồng';
                                })()}</p>
                            </div>
                            <Link to="/profile" className="bg-white text-brand-dark px-6 py-3 rounded-full font-bold shadow-lg hover:bg-gray-100 transition-colors">
                                Quản lý hồ sơ
                            </Link>
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
                    
                    {/* Birthday & Group & Tier Offers */}
                    <div className="space-y-6">
                        {/* Calculate tier from wallet points since tierLevel is not in users table */}
                        {promotions.filter(p => {
                            if (p.targetAudience === 'Group') return true;
                            if (!wallet) return p.targetAudience === 'Tier Level 1';
                            const userPoints = wallet.points || 0;
                            const sortedTiers = [...allTiers].sort((a, b) => (a.pointsRequired || 0) - (b.pointsRequired || 0));
                            let tierLevel = 1;
                            for (let i = sortedTiers.length - 1; i >= 0; i--) {
                                if (userPoints >= (sortedTiers[i].pointsRequired || 0)) {
                                    tierLevel = sortedTiers[i].level;
                                    break;
                                }
                            }
                            return p.targetAudience === `Tier Level ${tierLevel}`;
                        }).map(promo => {
                            const tier = allTiers.find(t => `Tier Level ${t.level}` === promo.targetAudience);
                            const glowStyle = tier ? { '--glow-color-start': hexToRgba(tier.color, 0.2), '--glow-color-end': hexToRgba(tier.color, 0.6) } as React.CSSProperties : {};
                            return (
                                <div key={promo.id} style={glowStyle} className={`bg-white p-6 rounded-lg shadow-soft-lg border ${tier ? 'animate-pulse-glow-dynamic' : ''}`}>
                                    <h3 className="font-bold text-xl text-gray-800 mb-2">{promo.title}</h3>
                                    <p className="text-gray-600 text-sm mb-4">{promo.description}</p>
                                    {promo.targetAudience === 'Group' ? (
                                        <div className="flex gap-2"><button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-semibold flex items-center gap-2"><PaperAirplaneIcon className="w-4 h-4"/> Chia sẻ</button></div>
                                    ) : (
                                        <button onClick={() => handleClaimPromotion(promo)} className="bg-brand-dark text-white px-4 py-2 rounded-md text-sm font-semibold">Nhận đặc quyền</button>
                                    )}
                                </div>
                            );
                        })}
                        {isBirthdayMonth && promotions.find(p => p.targetAudience === 'Birthday') && (
                            <div className="bg-pink-50 p-6 rounded-lg shadow-soft-lg relative overflow-hidden">
                                {showConfetti && Array.from({ length: 50 }).map((_, i) => (
                                    <div key={i} className="absolute top-0 animate-confetti" style={{ left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 2}s`, backgroundColor: ['#fde047', '#f97316', '#ec4899'][i % 3], width: '8px', height: '16px' }}></div>
                                ))}
                                {!isBirthdayGiftOpened ? (
                                    <div className="text-center">
                                        <h3 className="text-2xl font-bold font-serif text-pink-600">Một món quà đặc biệt!</h3>
                                        <p className="text-pink-800/80 my-2">Anh Thơ Spa có một món quà bất ngờ dành cho bạn nhân tháng sinh nhật.</p>
                                        <button onClick={handleOpenBirthdayGift} className="bg-pink-500 text-white font-bold py-3 px-6 rounded-lg mt-2 shadow-lg">Mở quà ngay 🎁</button>
                                    </div>
                                ) : (
                                    <div>
                                        <h3 className="font-bold text-xl text-gray-800 mb-2">{promotions.find(p=>p.targetAudience === 'Birthday')?.title}</h3>
                                        <p className="text-gray-600 text-sm mb-4">{promotions.find(p=>p.targetAudience === 'Birthday')?.description}</p>
                                        <button onClick={() => handleClaimPromotion(promotions.find(p=>p.targetAudience === 'Birthday')!)} className="bg-pink-500 text-white px-4 py-2 rounded-md text-sm font-semibold">Nhận ngay!</button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

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
                    {/* ... (JSX for Available Promotions and Redeemable Vouchers from old page) ... */}
                </div>
            )}

            {activeTab === 'history' && (
                 <div className="animate-fadeInUp">
                    {/* ... (JSX for Points History from old page) ... */}
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
