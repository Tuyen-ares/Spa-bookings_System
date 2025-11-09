
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import ServiceCard from '../components/ServiceCard';
import PromotionCard from '../components/PromotionCard';
import { ServiceCardSkeleton } from '../components/SkeletonLoader';
import { ChevronLeftIcon, ChevronRightIcon, StarIcon } from '../../shared/icons';
import * as apiService from '../services/apiService';
import type { Service, Promotion, Review } from '../../types';

const heroSlides = [
    {
        imageUrl: '/img/general/hero-1.jpg',
        title: 'Nơi Vẻ Đẹp Thăng Hoa',
        subtitle: 'Trải nghiệm dịch vụ spa 5 sao với các liệu trình độc quyền, giúp bạn tái tạo năng lượng và gìn giữ nét xuân.',
        buttonText: 'Khám Phá Dịch Vụ',
        buttonLink: '/services',
    },
    {
        imageUrl: '/img/general/hero-2.jpg',
        title: 'Ưu Đãi Đặc Biệt Mùa Hè',
        subtitle: 'Giảm giá lên đến 30% cho các gói chăm sóc da và massage toàn thân. Đừng bỏ lỡ!',
        buttonText: 'Xem Ưu Đãi',
        buttonLink: '/promotions',
    },
    {
        imageUrl: '/img/general/hero-3.jpg',
        title: 'Đội Ngũ Chuyên Viên Hàng Đầu',
        subtitle: 'Với kinh nghiệm và sự tận tâm, chúng tôi cam kết mang đến cho bạn sự hài lòng tuyệt đối.',
        buttonText: 'Đặt Lịch Hẹn',
        buttonLink: '/booking',
    },
];

const Hero = () => {
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    return (
        <section className="relative w-full h-[90vh] text-white">
            {heroSlides.map((slide, index) => (
                <div
                    key={index}
                    className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
                >
                    <img src={slide.imageUrl} alt={slide.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent"></div>
                </div>
            ))}
            <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
                {heroSlides.map((slide, index) => (
                    <div
                        key={index}
                        className={`transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0 hidden'}`}
                    >
                        <h1 key={`${index}-title`} className="text-4xl sm:text-5xl lg:text-7xl font-serif font-bold text-white mb-4 animate-slideUpFade">
                            {slide.title}
                        </h1>
                        <p key={`${index}-subtitle`} className="text-lg md:text-xl max-w-2xl mx-auto mb-8 animate-slideUpFade animation-delay-300">
                            {slide.subtitle}
                        </p>
                        <Link
                            key={`${index}-button`}
                            to={slide.buttonLink}
                            className="bg-brand-primary text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-brand-dark transition-transform transform hover:scale-105 shadow-lg animate-slideUpFade animation-delay-500"
                        >
                            {slide.buttonText}
                        </Link>
                    </div>
                ))}
            </div>
             <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex space-x-3">
                {heroSlides.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${currentSlide === index ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white'}`}
                        aria-label={`Chuyển đến slide ${index + 1}`}
                    />
                ))}
            </div>
        </section>
    );
};

interface HomePageProps {
    allServices: Service[];
    allPromotions: Promotion[];
    isLoading: boolean;
}

export const HomePage: React.FC<HomePageProps> = ({ allServices, allPromotions, isLoading }) => {
    const [recentReviews, setRecentReviews] = useState<Review[]>([]);
    const [isLoadingReviews, setIsLoadingReviews] = useState(true);
    const [localServices, setLocalServices] = useState<Service[]>([]);
    const [isLoadingServices, setIsLoadingServices] = useState(false);

    // Fetch services directly if allServices is empty
    useEffect(() => {
        const fetchServices = async () => {
            // If allServices is provided and has data, use it
            if (allServices && allServices.length > 0) {
                setLocalServices(allServices);
                return;
            }
            
            // Otherwise, fetch directly from API
            try {
                setIsLoadingServices(true);
                const fetchedServices = await apiService.getServices();
                setLocalServices(fetchedServices);
            } catch (error) {
                console.error("Failed to fetch services in HomePage:", error);
                setLocalServices([]);
            } finally {
                setIsLoadingServices(false);
            }
        };

        fetchServices();
    }, [allServices]);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                setIsLoadingReviews(true);
                const fetchedReviews = await apiService.getReviews({});
                setRecentReviews(fetchedReviews);
            } catch (error) {
                console.error("Failed to fetch reviews:", error);
                setRecentReviews([]);
            } finally {
                setIsLoadingReviews(false);
            }
        };
        fetchReviews();
    }, []);

    // Use localServices if available, otherwise fallback to allServices
    // Priority: localServices > allServices
    const servicesToUse = useMemo(() => {
        if (localServices.length > 0) {
            return localServices;
        }
        if (allServices && allServices.length > 0) {
            return allServices;
        }
        return [];
    }, [localServices, allServices]);

    const featuredServices = useMemo(() => {
        if (!servicesToUse || servicesToUse.length === 0) {
            return [];
        }
        // Helper function to safely convert value to boolean (handles boolean, number, string, undefined)
        // Note: Database may return numbers (0/1) or strings even though TypeScript types say boolean
        const toBoolean = (value: any, defaultValue: boolean = false): boolean => {
            if (value === undefined || value === null) return defaultValue;
            if (typeof value === 'boolean') return value;
            if (typeof value === 'number') return value !== 0;
            if (typeof value === 'string') {
                const lower = value.toLowerCase();
                return lower === 'true' || lower === '1' || lower === 'yes';
            }
            return defaultValue;
        };
        
        return servicesToUse
            .filter(s => {
                // Check isActive (default to true if undefined)
                const isActive = toBoolean(s.isActive, true);
                // Check isHot (handle boolean, number, or string from database)
                const isHot = toBoolean(s.isHot, false);
                return isActive && isHot;
            })
            .sort((a, b) => {
                // Handle both string and number ratings
                const ratingA = typeof a.rating === 'string' ? parseFloat(a.rating) : (a.rating || 0);
                const ratingB = typeof b.rating === 'string' ? parseFloat(b.rating) : (b.rating || 0);
                return ratingB - ratingA;
            })
            .slice(0, 8);
    }, [servicesToUse]);
    
    const comboServices = useMemo(() => {
        if (!servicesToUse || servicesToUse.length === 0) {
            return [];
        }
        return servicesToUse.filter(s => 
            (s.isActive !== false) && (s.name.toLowerCase().includes('gói') || s.name.toLowerCase().includes('combo') || s.category === 'Spa Package')
        ).slice(0, 8);
    }, [servicesToUse]);
    
    const comboDeals = useMemo(() => {
        if (!servicesToUse || servicesToUse.length === 0) {
            return [];
        }
        return servicesToUse.filter(s =>
            (s.isActive !== false) &&
            (s.name.toLowerCase().includes('gói') || s.name.toLowerCase().includes('combo') || s.category === 'Spa Package') &&
            s.discountPrice
        ).slice(0, 8);
    }, [servicesToUse]);

    const featuredPromotions = useMemo(() => {
        return allPromotions.filter(promo => {
            const expiry = promo.expiryDate ? new Date(promo.expiryDate) : null;
            const now = new Date();
            const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            return expiry && expiry > now && expiry <= thirtyDaysFromNow;
        }).slice(0, 8);
    }, [allPromotions]);

    const [currentServiceIndex, setCurrentServiceIndex] = useState(0);
    const [serviceItemsPerView, setServiceItemsPerView] = useState(3);

    const [currentPromoIndex, setCurrentPromoIndex] = useState(0);
    const [promoItemsPerView, setPromoItemsPerView] = useState(3);
    
    const [currentComboIndex, setCurrentComboIndex] = useState(0);
    const [comboItemsPerView, setComboItemsPerView] = useState(3);
    
    const [currentComboDealIndex, setCurrentComboDealIndex] = useState(0);
    const [comboDealItemsPerView, setComboDealItemsPerView] = useState(3);


    useEffect(() => {
        const handleResize = () => {
            let newItemsPerView = 3;
            if (window.innerWidth < 768) {
                newItemsPerView = 1;
            } else if (window.innerWidth < 1024) {
                newItemsPerView = 2;
            } else {
                newItemsPerView = 3;
            }
            setServiceItemsPerView(newItemsPerView);
            setPromoItemsPerView(newItemsPerView);
            setComboItemsPerView(newItemsPerView);
            setComboDealItemsPerView(newItemsPerView);
        };

        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const totalServices = featuredServices.length;
    const maxServiceIndex = Math.max(0, totalServices - serviceItemsPerView);

    const handleNextService = () => {
        setCurrentServiceIndex(prev => Math.min(prev + 1, maxServiceIndex));
    };

    const handlePrevService = () => {
        setCurrentServiceIndex(prev => Math.max(prev - 1, 0));
    };
    
    const totalCombos = comboServices.length;
    const maxComboIndex = Math.max(0, totalCombos - comboItemsPerView);

    const handleNextCombo = () => {
        setCurrentComboIndex(prev => Math.min(prev + 1, maxComboIndex));
    };

    const handlePrevCombo = () => {
        setCurrentComboIndex(prev => Math.max(prev - 1, 0));
    };
    
    const totalComboDeals = comboDeals.length;
    const maxComboDealIndex = Math.max(0, totalComboDeals - comboDealItemsPerView);

    const handleNextComboDeal = () => {
        setCurrentComboDealIndex(prev => Math.min(prev + 1, maxComboDealIndex));
    };

    const handlePrevComboDeal = () => {
        setCurrentComboDealIndex(prev => Math.max(prev - 1, 0));
    };

    const totalPromotions = featuredPromotions.length;
    const maxPromoIndex = Math.max(0, totalPromotions - promoItemsPerView);

    const handleNextPromo = () => {
        setCurrentPromoIndex(prev => Math.min(prev + 1, maxPromoIndex));
    };

    const handlePrevPromo = () => {
        setCurrentPromoIndex(prev => Math.max(prev - 1, 0));
    };


    return (
        <div className="animate-fadeInUp">
            <Hero />

            <section id="about" className="py-24 bg-brand-light">
                <div className="container mx-auto px-4 grid md:grid-cols-2 gap-16 items-center">
                    <div>
                        <img src="/img/general/about-spa.jpg" alt="About Anh Tho Spa" className="rounded-lg shadow-soft-xl" loading="lazy" />
                    </div>
                    <div>
                        <h2 className="text-4xl sm:text-5xl font-serif font-bold text-brand-text mb-6">Chào Mừng Đến Với Anh Thơ Spa</h2>
                        <p className="text-lg text-brand-text/80 mb-4 leading-relaxed">
                            Tại Anh Thơ Spa, chúng tôi tin rằng vẻ đẹp thực sự đến từ sự cân bằng giữa cơ thể, tâm trí và tinh thần. Sứ mệnh của chúng tôi là mang đến cho bạn một không gian yên tĩnh, nơi bạn có thể tạm gác lại những bộn bề cuộc sống và tận hưởng những giây phút chăm sóc bản thân quý giá.
                        </p>
                        <p className="text-brand-text/80 mb-8 leading-relaxed">
                            Với đội ngũ chuyên viên giàu kinh nghiệm, sản phẩm cao cấp và công nghệ hiện đại, chúng tôi cam kết mang đến những liệu trình hiệu quả và an toàn nhất.
                        </p>
                        <Link to="/services" className="bg-brand-dark text-white font-semibold py-3 px-8 rounded-lg hover:bg-brand-primary transition-colors shadow-soft-lg hover:shadow-soft-xl transform hover:-translate-y-0.5">
                            Tìm Hiểu Thêm
                        </Link>
                    </div>
                </div>
            </section>
            
            <section className="py-24 bg-brand-secondary">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl sm:text-5xl font-serif font-bold text-brand-text">Dịch Vụ Nổi Bật</h2>
                        <p className="mt-4 text-lg text-brand-text/70 max-w-2xl mx-auto">Những liệu trình được khách hàng yêu thích và tin dùng nhất tại Anh Thơ Spa.</p>
                    </div>
                    {(isLoading || isLoadingServices) ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[...Array(3)].map((_, index) => <ServiceCardSkeleton key={index} />)}
                        </div>
                    ) : featuredServices.length === 0 ? (
                        <div className="text-center py-10 bg-white rounded-lg shadow-soft-lg">
                            <p className="text-lg text-gray-500">Không có dịch vụ nổi bật nào để hiển thị.</p>
                            {servicesToUse.length > 0 && (
                                <p className="text-sm text-gray-400 mt-2">
                                    Tìm thấy {servicesToUse.length} dịch vụ nhưng không có dịch vụ nào được đánh dấu là "nổi bật".
                                </p>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="relative">
                                <div className="overflow-hidden">
                                    <div 
                                        className="flex transition-transform duration-500 ease-in-out -mx-4" 
                                        style={{ transform: `translateX(-${currentServiceIndex * (100 / serviceItemsPerView)}%)` }}
                                    >
                                        {featuredServices.map(service => (
                                            <div 
                                                key={service.id} 
                                                className="flex-shrink-0 px-4"
                                                style={{ flexBasis: `${100 / serviceItemsPerView}%` }}
                                            >
                                                <ServiceCard service={service} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {totalServices > serviceItemsPerView && (
                                    <>
                                        <button
                                            onClick={handlePrevService}
                                            disabled={currentServiceIndex === 0}
                                            className="absolute top-1/2 -left-6 -translate-y-1/2 p-3 bg-white rounded-full shadow-soft-lg text-brand-dark hover:bg-brand-secondary disabled:opacity-50 disabled:cursor-not-allowed z-10"
                                            aria-label="Dịch vụ trước"
                                        >
                                            <ChevronLeftIcon className="w-6 h-6" />
                                        </button>
                                        <button
                                            onClick={handleNextService}
                                            disabled={currentServiceIndex >= maxServiceIndex}
                                            className="absolute top-1/2 -right-6 -translate-y-1/2 p-3 bg-white rounded-full shadow-soft-lg text-brand-dark hover:bg-brand-secondary disabled:opacity-50 disabled:cursor-not-allowed z-10"
                                            aria-label="Dịch vụ sau"
                                        >
                                            <ChevronRightIcon className="w-6 h-6" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </section>

            {comboServices.length > 0 && (
            <section className="py-24 bg-brand-light">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl sm:text-5xl font-serif font-bold text-brand-text">Các Gói Dịch Vụ</h2>
                        <p className="mt-4 text-lg text-brand-text/70 max-w-2xl mx-auto">Trải nghiệm sự kết hợp hoàn hảo giữa các liệu trình với gói combo tiết kiệm của chúng tôi.</p>
                    </div>
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[...Array(3)].map((_, index) => <ServiceCardSkeleton key={index} />)}
                        </div>
                    ) : (
                        <>
                            <div className="relative">
                                <div className="overflow-hidden">
                                    <div 
                                        className="flex transition-transform duration-500 ease-in-out -mx-4" 
                                        style={{ transform: `translateX(-${currentComboIndex * (100 / comboItemsPerView)}%)` }}
                                    >
                                        {comboServices.map(service => (
                                            <div 
                                                key={service.id} 
                                                className="flex-shrink-0 px-4"
                                                style={{ flexBasis: `${100 / comboItemsPerView}%` }}
                                            >
                                                <ServiceCard service={service} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {totalCombos > comboItemsPerView && (
                                    <>
                                        <button
                                            onClick={handlePrevCombo}
                                            disabled={currentComboIndex === 0}
                                            className="absolute top-1/2 -left-6 -translate-y-1/2 p-3 bg-white rounded-full shadow-soft-lg text-brand-dark hover:bg-brand-secondary disabled:opacity-50 disabled:cursor-not-allowed z-10"
                                            aria-label="Combo trước"
                                        >
                                            <ChevronLeftIcon className="w-6 h-6" />
                                        </button>
                                        <button
                                            onClick={handleNextCombo}
                                            disabled={currentComboIndex >= maxComboIndex}
                                            className="absolute top-1/2 -right-6 -translate-y-1/2 p-3 bg-white rounded-full shadow-soft-lg text-brand-dark hover:bg-brand-secondary disabled:opacity-50 disabled:cursor-not-allowed z-10"
                                            aria-label="Combo sau"
                                        >
                                            <ChevronRightIcon className="w-6 h-6" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </section>
            )}

            {comboDeals.length > 0 && (
            <section className="py-24 bg-brand-secondary">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl sm:text-5xl font-serif font-bold text-brand-text">Các Combo Ưu Đãi Trong Tháng</h2>
                        <p className="mt-4 text-lg text-brand-text/70 max-w-2xl mx-auto">Tiết kiệm hơn với các gói dịch vụ kết hợp đang có giá ưu đãi đặc biệt.</p>
                    </div>
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[...Array(3)].map((_, index) => <ServiceCardSkeleton key={index} />)}
                        </div>
                    ) : (
                        <>
                            <div className="relative">
                                <div className="overflow-hidden">
                                    <div 
                                        className="flex transition-transform duration-500 ease-in-out -mx-4" 
                                        style={{ transform: `translateX(-${currentComboDealIndex * (100 / comboDealItemsPerView)}%)` }}
                                    >
                                        {comboDeals.map(service => (
                                            <div 
                                                key={service.id} 
                                                className="flex-shrink-0 px-4"
                                                style={{ flexBasis: `${100 / comboDealItemsPerView}%` }}
                                            >
                                                <ServiceCard service={service} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {totalComboDeals > comboDealItemsPerView && (
                                    <>
                                        <button
                                            onClick={handlePrevComboDeal}
                                            disabled={currentComboDealIndex === 0}
                                            className="absolute top-1/2 -left-6 -translate-y-1/2 p-3 bg-white rounded-full shadow-soft-lg text-brand-dark hover:bg-brand-secondary disabled:opacity-50 disabled:cursor-not-allowed z-10"
                                            aria-label="Ưu đãi combo trước"
                                        >
                                            <ChevronLeftIcon className="w-6 h-6" />
                                        </button>
                                        <button
                                            onClick={handleNextComboDeal}
                                            disabled={currentComboDealIndex >= maxComboDealIndex}
                                            className="absolute top-1/2 -right-6 -translate-y-1/2 p-3 bg-white rounded-full shadow-soft-lg text-brand-dark hover:bg-brand-secondary disabled:opacity-50 disabled:cursor-not-allowed z-10"
                                            aria-label="Ưu đãi combo sau"
                                        >
                                            <ChevronRightIcon className="w-6 h-6" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </section>
            )}

            {featuredPromotions.length > 0 && (
                <section className="py-24 bg-brand-light">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl sm:text-5xl font-serif font-bold text-brand-text">Ưu Đãi Nổi Bật</h2>
                            <p className="mt-4 text-lg text-brand-text/70 max-w-2xl mx-auto">Đừng bỏ lỡ các chương trình khuyến mãi hấp dẫn đang diễn ra!</p>
                        </div>
                        {isLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {[...Array(3)].map((_, index) => <ServiceCardSkeleton key={index} />)}
                            </div>
                        ) : (
                            <>
                                <div className="relative">
                                    <div className="overflow-hidden">
                                        <div 
                                            className="flex transition-transform duration-500 ease-in-out -mx-4" 
                                            style={{ transform: `translateX(-${currentPromoIndex * (100 / promoItemsPerView)}%)` }}
                                        >
                                            {featuredPromotions.map((promotion) => (
                                                <div 
                                                    key={promotion.id} 
                                                    className="flex-shrink-0 px-4"
                                                    style={{ flexBasis: `${100 / promoItemsPerView}%` }}
                                                >
                                                    <PromotionCard promotion={promotion} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    {totalPromotions > promoItemsPerView && (
                                        <>
                                            <button
                                                onClick={handlePrevPromo}
                                                disabled={currentPromoIndex === 0}
                                                className="absolute top-1/2 -left-6 -translate-y-1/2 p-3 bg-white rounded-full shadow-soft-lg text-brand-dark hover:bg-brand-secondary disabled:opacity-50 disabled:cursor-not-allowed z-10"
                                                aria-label="Ưu đãi trước"
                                            >
                                                <ChevronLeftIcon className="w-6 h-6" />
                                            </button>
                                            <button
                                                onClick={handleNextPromo}
                                                disabled={currentPromoIndex >= maxPromoIndex}
                                                className="absolute top-1/2 -right-6 -translate-y-1/2 p-3 bg-white rounded-full shadow-soft-lg text-brand-dark hover:bg-brand-secondary disabled:opacity-50 disabled:cursor-not-allowed z-10"
                                                aria-label="Ưu đãi sau"
                                            >
                                                <ChevronRightIcon className="w-6 h-6" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </section>
            )}
            
             <section className="py-24 bg-brand-secondary">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-4xl sm:text-5xl font-serif font-bold text-brand-text mb-16">Khách Hàng Nói Gì Về Chúng Tôi</h2>
                    {isLoadingReviews ? (
                        <div className="text-center py-10 bg-white rounded-lg shadow-soft-lg">
                            <p className="text-lg text-gray-500">Đang tải đánh giá...</p>
                        </div>
                    ) : recentReviews.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {recentReviews.slice(0, 3).map((review) => (
                                <div key={review.id} className="bg-white p-8 rounded-lg shadow-soft-lg transition-transform transform hover:-translate-y-2">
                                    <img src={review.userImageUrl} alt={review.userName} className="w-24 h-24 rounded-full mx-auto mb-6 ring-4 ring-brand-secondary" />
                                    <div className="flex justify-center mb-4">
                                        {[...Array(review.rating)].map((_, i) => <StarIcon key={i} className="w-6 h-6 text-yellow-400" />)}
                                    </div>
                                    <p className="text-brand-text/80 italic text-lg mb-4">"{review.comment}"</p>
                                    <p className="font-semibold text-brand-text text-lg">{review.userName}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 bg-white rounded-lg shadow-soft-lg">
                            <p className="text-lg text-gray-500">Chưa có đánh giá nào gần đây.</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
