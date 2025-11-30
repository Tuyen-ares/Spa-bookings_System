
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ServiceCard from '../components/ServiceCard';
import PromotionCard from '../components/PromotionCard';
import { ServiceCardSkeleton } from '../components/SkeletonLoader';
import { ChevronLeftIcon, ChevronRightIcon, StarIcon, SparklesIcon, CheckCircleIcon, ArrowRightIcon, ProfileIcon } from '../../shared/icons';
import * as apiService from '../services/apiService';
import type { Service, Promotion, Review } from '../../types';

const heroSlides = [
    {
        imageUrl: '../../../assets/IMG/hinhGiaoDien/banner-1.png',
        title: 'Nơi Vẻ Đẹp Thăng Hoa',
        subtitle: 'Trải nghiệm dịch vụ spa 5 sao với các liệu trình độc quyền, giúp bạn tái tạo năng lượng và gìn giữ nét xuân.',
        buttonText: 'Khám Phá Dịch Vụ',
        buttonLink: '/services',
    },
    {
        imageUrl: '../../../assets/IMG/hinhGiaoDien/banner-2.jpg',
        title: 'Ưu Đãi Đặc Biệt Mùa Hè',
        subtitle: 'Giảm giá lên đến 30% cho các gói chăm sóc da và massage toàn thân. Đừng bỏ lỡ!',
        buttonText: 'Xem Ưu Đãi',
        buttonLink: '/promotions',
    },
    {
        imageUrl: '../../../assets/IMG/hinhGiaoDien/banner-3.jpg',
        title: 'Đội Ngũ Chuyên Viên Hàng Đầu',
        subtitle: 'Với kinh nghiệm và sự tận tâm, chúng tôi cam kết mang đến cho bạn sự hài lòng tuyệt đối.',
        buttonText: 'Đặt Lịch Hẹn',
        buttonLink: '/booking',
    },
    {
        imageUrl: '../../../assets/IMG/hinhGiaoDien/banner-4.jpg',
        title: 'Công Nghệ Làm Đẹp Tiên Tiến',
        subtitle: 'Sử dụng trang thiết bị hiện đại chuẩn FDA, mang lại hiệu quả điều trị tối ưu và an toàn tuyệt đối cho làn da của bạn.',
        buttonText: 'Tìm Hiểu Thêm',
        buttonLink: '/about',
    },
    {
        imageUrl: '../../../assets/IMG/hinhGiaoDien/banner-5.jpg',
        title: 'Không Gian Thư Giãn Tuyệt Đối',
        subtitle: 'Hòa mình vào thiên nhiên với không gian xanh mát, hương thơm tinh dầu dịu nhẹ giúp xua tan mọi căng thẳng, mệt mỏi.',
        buttonText: 'Xem Thư Viện',
        buttonLink: '/about',
    },
];

const Hero = () => {
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
        }, 3000); 
        return () => clearInterval(timer);
    }, []);

    return (
        <section className="relative w-full h-[75vh] overflow-hidden bg-gray-900">
            {heroSlides.map((slide, index) => (
                <div
                    key={index}
                    className={`absolute inset-0 transition-all duration-700 ease-in-out transform ${index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}
                >
                    <img src={slide.imageUrl} alt={slide.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/10"></div>
                </div>
            ))}
            
            <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center items-center text-center">
                {heroSlides.map((slide, index) => (
                    <div
                        key={index}
                        className={`transition-all duration-700 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl px-4 ${index === currentSlide ? 'opacity-100 translate-y-[-50%]' : 'opacity-0 translate-y-[-40%] pointer-events-none'}`}
                    >
                        {/* Crystal Clear Glass Effect */}
                        <div className="relative bg-gradient-to-br from-white/10 to-white/0 backdrop-blur-[1px] border border-white/30 p-8 md:p-12 rounded-[3rem] shadow-2xl overflow-hidden">
                            
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent pointer-events-none"></div>
                            
                            <div className="relative z-10 flex flex-col items-center">
                                <div className="inline-block px-5 py-1.5 mb-5 border border-white/50 rounded-full bg-white/10 backdrop-blur-md text-white text-[10px] font-extrabold tracking-[0.2em] uppercase animate-fadeInUp shadow-sm">
                                    Welcome to Anh Thơ Spa
                                </div>
                                
                                <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif font-extrabold text-white mb-5 leading-tight drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] animate-slideUpFade animation-delay-200">
                                    {slide.title}
                                </h1>
                                <p className="text-base md:text-lg text-white font-bold mb-8 leading-relaxed max-w-xl mx-auto animate-slideUpFade animation-delay-300 drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)]">
                                    {slide.subtitle}
                                </p>
                                <Link
                                    to={slide.buttonLink}
                                    className="group relative inline-flex items-center gap-2 bg-white/20 hover:bg-white/40 backdrop-blur-md border-2 border-white/50 text-white font-bold py-3 px-10 rounded-full text-base shadow-[0_4px_14px_0_rgba(0,0,0,0.39)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.23)] hover:-translate-y-1 transition-all duration-300 animate-slideUpFade animation-delay-500"
                                >
                                    <span className="drop-shadow-md">{slide.buttonText}</span>
                                    <ArrowRightIcon className="w-5 h-5 transition-transform group-hover:translate-x-1 drop-shadow-md" />
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
             <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-3">
                {heroSlides.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={`h-1.5 rounded-full transition-all duration-500 border border-white/50 shadow-sm ${currentSlide === index ? 'w-10 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'w-2 bg-white/30 hover:bg-white/60'}`}
                        aria-label={`Slide ${index + 1}`}
                    />
                ))}
            </div>
        </section>
    );
};

// Component con để xử lý hiệu ứng đếm số với màu chữ chuyển động
const AnimatedStatItem = ({ end, suffix, label, delay = 0, gradientColors }: { end: number, suffix: string, label: string, delay?: number, gradientColors: string }) => {
    const [count, setCount] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Visibility detection + guarantee start: try IntersectionObserver, fallback to bounding rect,
    // and as a safety net, force-visible after a short delay so counts always animate on full reload.
    useEffect(() => {
        let observer: IntersectionObserver | null = null;
        let cancelled = false;

        const checkVisibilityFallback = () => {
            if (!ref.current) return false;
            const rect = ref.current.getBoundingClientRect();
            const inView = rect.top < ((globalThis as any).innerHeight || 0) && rect.bottom > 0;
            if (inView) setIsVisible(true);
            return inView;
        };

        if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
            observer = new IntersectionObserver((entries) => {
                const entry = entries[0];
                if (entry && entry.isIntersecting) {
                    setIsVisible(true);
                    if (observer) {
                        observer.disconnect();
                        observer = null;
                    }
                }
            }, { threshold: 0.2 });

            if (ref.current) observer.observe(ref.current);
        } else {
            if (!checkVisibilityFallback()) {
                const onScroll = () => {
                    if (cancelled) return;
                    if (checkVisibilityFallback()) {
                        (globalThis as any).removeEventListener('scroll', onScroll);
                        (globalThis as any).removeEventListener('resize', onScroll);
                    }
                };
                (globalThis as any).addEventListener('scroll', onScroll, { passive: true });
                (globalThis as any).addEventListener('resize', onScroll);
            }
        }

        // Immediate check in case element already visible
        if (!isVisible) checkVisibilityFallback();

        // Safety net: if still not visible after short delay, mark visible so animation always runs on reload
        const forceTimeout = (globalThis as any).setTimeout(() => {
            if (!isVisible) setIsVisible(true);
        }, 350);

        return () => {
            cancelled = true;
            if (observer) observer.disconnect();
            (globalThis as any).clearTimeout(forceTimeout);
        };
    }, []);

    // Animate count using requestAnimationFrame for smoothness and reliability.
    // Simpler and more deterministic: always start animation on mount (after optional delay)
    // For large numbers (>=1000) animate in K-units to keep UI responsive (e.g. 10K)
    useEffect(() => {
        let rafId: number | null = null;
        let timeoutId: number | null = null;
        let mounted = true;
        const duration = 1200; // ms

        const startAnimation = () => {
            const targetIsK = end >= 1000;
            const target = targetIsK ? Math.ceil(end / 1000) : end;
            const startTime = performance.now();

            const step = (now: number) => {
                if (!mounted) return;
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const value = Math.floor(progress * target);
                setCount(value);
                if (progress < 1) {
                    rafId = requestAnimationFrame(step);
                } else {
                    setCount(target);
                }
            };

            rafId = requestAnimationFrame(step);
        };

        timeoutId = (globalThis as any).setTimeout(() => startAnimation(), delay);

        return () => {
            mounted = false;
            if (rafId) cancelAnimationFrame(rafId);
            if (timeoutId) (globalThis as any).clearTimeout(timeoutId);
        };
    }, [end, delay]);

    // Format count for display. If original `end` was >=1000 we animate/display in K-units.
    const formatCount = (n: number) => {
        if (end >= 1000) {
            return `${n}K`;
        }
        return String(n);
    };

    return (
        <div ref={ref} className="relative p-6 group flex flex-col items-center justify-center transition-all duration-300 hover:-translate-y-1">
            <p className={`text-5xl md:text-6xl font-serif font-extrabold text-transparent bg-clip-text bg-gradient-to-r ${gradientColors} bg-[length:400%_400%] animate-gradient-slow mb-3 drop-shadow-sm`}>
                {formatCount(count)}{suffix}
            </p>
            <p className="text-xs md:text-sm text-gray-600 font-extrabold whitespace-normal text-center group-hover:text-brand-primary transition-colors">{label}</p>
        </div>
    );
};

const StatsSection = () => {
    return (
        <div className="relative z-20 -mt-24 container mx-auto px-4 animate-fadeInUp">
            {/* Animated Gradient Border Wrapper */}
            <div className="relative p-[3px] rounded-[3rem] overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] hover:shadow-[0_25px_70px_-15px_rgba(225,29,72,0.3)] transition-shadow duration-500 max-w-7xl mx-auto">
                
                {/* Moving Gradient Layer (The Border) */}
                <div className="absolute inset-0 bg-[length:400%_400%] bg-gradient-to-r from-cyan-400 via-brand-primary to-purple-600 animate-gradient-slow opacity-80"></div>
                
                {/* Inner White Content */}
                <div className="relative bg-white/95 backdrop-blur-xl rounded-[2.8rem] p-8 md:p-12 overflow-hidden">
                    
                    {/* Subtle Background Pattern */}
                    <div className="absolute inset-0 bg-[url('/img/general/noise.png')] opacity-20 mix-blend-soft-light"></div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                        <AnimatedStatItem 
                            end={5} 
                            suffix="+" 
                            label="Năm Kinh Nghiệm" 
                            delay={0} 
                            gradientColors="from-cyan-400 via-blue-600 to-purple-600"
                        />
                        <AnimatedStatItem 
                            end={10000} 
                            suffix="+" 
                            label="Khách Hàng Vui Vẻ" 
                            delay={200} 
                            gradientColors="from-rose-400 via-fuchsia-500 to-indigo-500"
                        />
                        <AnimatedStatItem 
                            end={30} 
                            suffix="+" 
                            label="Dịch Vụ Đa Dạng" 
                            delay={400} 
                            gradientColors="from-amber-400 via-orange-500 to-red-500"
                        />
                        <AnimatedStatItem 
                            end={100} 
                            suffix="%" 
                            label="Mỹ Phẩm Tự Nhiên" 
                            delay={600} 
                            gradientColors="from-emerald-400 via-teal-500 to-cyan-500"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

const ServicesOverviewSection = () => {
    const navigate = useNavigate();

    const handleNavigate = (category: string) => {
        navigate(`/services?category=${encodeURIComponent(category)}`);
    };

    const categories = [
        { 
            label: 'Nail', 
            category: 'Nail',
            imgUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=300&q=80'
        },
        { 
            label: 'Massage', 
            category: 'MASSAGE THƯ GIÃN',
            imgUrl: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&w=300&q=80'
        },
        { 
            label: 'Chăm Sóc Da', 
            category: 'CHĂM SÓC DA',
            imgUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=300&q=80'
        },
        { 
            label: 'Chăm Sóc Cơ Thể', 
            category: 'CHĂM SÓC CƠ THỂ',
            imgUrl: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=300&q=80'
        },
        { 
            label: 'Chăm Sóc Tóc', 
            category: 'CHĂM SÓC TÓC',
            imgUrl: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=300&q=80'
        }, 
        { 
            label: 'Triệt Lông', 
            category: 'WAXING',
            imgUrl: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&w=300&q=80'
        },
    ];

    return (
        <section className="py-16 bg-white relative">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-secondary/50 to-transparent pointer-events-none"></div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center mb-12">
                     <span className="text-brand-primary font-bold tracking-widest uppercase text-xs bg-white px-4 py-1.5 rounded-full shadow-md border border-brand-secondary">Danh mục</span>
                    <h2 className="text-4xl md:text-5xl font-serif font-extrabold text-brand-dark mt-4 mb-4">
                        Dịch vụ của Anh Thơ
                    </h2>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-12 max-w-7xl mx-auto">
                    {categories.map((item, idx) => (
                        <div 
                            key={idx} 
                            onClick={() => handleNavigate(item.category)}
                            className="flex flex-col items-center text-center group cursor-pointer"
                        >
                            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden shadow-lg border-4 border-white mb-4 group-hover:shadow-2xl group-hover:border-brand-primary/30 transition-all duration-500 transform group-hover:-translate-y-2">
                                <img 
                                    src={item.imgUrl} 
                                    alt={item.label} 
                                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                                    loading="lazy"
                                />
                                {/* Overlay */}
                                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-300"></div>
                            </div>
                            <span className="text-sm font-bold text-gray-700 uppercase tracking-wider group-hover:text-brand-primary transition-colors duration-300">
                                {item.label}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="max-w-3xl mx-auto text-center">
                    <p className="text-gray-600 text-base leading-relaxed mb-8 font-medium">
                        Dịch vụ trọn gói nhà Anh Thơ bao gồm từ 2 đến 3 dịch vụ lẻ kết hợp với nhau để đem lại trải nghiệm và ưu đãi tốt nhất.
                        Tất cả các dịch vụ Trọn gói đều được miễn phí xông hơi khô hoặc xông hơi ướt thảo dược.
                    </p>
                    <Link 
                        to="/services" 
                        className="group inline-flex items-center justify-center px-8 py-3 bg-ocean-gradient text-white text-xs font-bold uppercase tracking-widest rounded-full shadow-lg hover:shadow-cyan-700/50 hover:-translate-y-1 transition-all duration-300"
                    >
                        XEM CHI TIẾT
                         <ArrowRightIcon className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1"/>
                    </Link>
                </div>
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
    const [mostBookedServices, setMostBookedServices] = useState<Service[]>([]);
    const [isLoadingMostBooked, setIsLoadingMostBooked] = useState(false);

    useEffect(() => {
        const fetchServices = async () => {
            if (allServices && allServices.length > 0) {
                setLocalServices(allServices);
                return;
            }
            
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
        const fetchMostBooked = async () => {
            try {
                setIsLoadingMostBooked(true);
                const fetchedMostBooked = await apiService.getMostBookedServices(4);
                setMostBookedServices(fetchedMostBooked);
            } catch (error) {
                console.error("Failed to fetch most booked services:", error);
                setMostBookedServices([]);
            } finally {
                setIsLoadingMostBooked(false);
            }
        };

        fetchMostBooked();
    }, []);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                setIsLoadingReviews(true);
                const fetchedReviews = await apiService.getReviews({});
                
                // Fetch user profile pictures for each review based on userId
                const reviewsWithUserData = await Promise.all(
                    fetchedReviews.map(async (review) => {
                        if (review.userId) {
                            try {
                                const user = await apiService.getUserById(review.userId);
                                return {
                                    ...review,
                                    userImageUrl: user.profilePictureUrl || review.userImageUrl,
                                    userName: user.name || review.userName
                                };
                            } catch (error) {
                                console.error(`Failed to fetch user data for review ${review.id}:`, error);
                                return review;
                            }
                        }
                        return review;
                    })
                );
                
                setRecentReviews(reviewsWithUserData);
            } catch (error) {
                console.error("Failed to fetch reviews:", error);
                setRecentReviews([]);
            } finally {
                setIsLoadingReviews(false);
            }
        };
        fetchReviews();
    }, []);

    const servicesToUse = useMemo(() => {
        if (localServices.length > 0) return localServices;
        if (allServices && allServices.length > 0) return allServices;
        return [];
    }, [localServices, allServices]);

    const featuredServices = useMemo(() => {
        // Use mostBookedServices if available, otherwise fallback to top rated
        if (mostBookedServices && mostBookedServices.length > 0) {
            return mostBookedServices.slice(0, 4);
        }
        
        // Fallback: show top-rated services
        if (!servicesToUse || servicesToUse.length === 0) return [];
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
            .filter(s => toBoolean(s.isActive, true))
            .sort((a, b) => {
                const ratingA = typeof a.rating === 'string' ? parseFloat(a.rating) : (a.rating || 0);
                const ratingB = typeof b.rating === 'string' ? parseFloat(b.rating) : (b.rating || 0);
                return ratingB - ratingA;
            })
            .slice(0, 4);
    }, [mostBookedServices, servicesToUse]);
    
    const comboServices = useMemo(() => {
        if (!servicesToUse || servicesToUse.length === 0) return [];
        return servicesToUse
        .filter((s) => {
            const isActive = s.isActive !== false;
            const name = s.name ? String(s.name).toLowerCase() : "";
            const categoryIdentifier = s.categoryId !== undefined && s.categoryId !== null ? String(s.categoryId).toLowerCase() : "";
            const isComboByName = name.includes("gói") || name.includes("combo");
            const isComboByCategory = categoryIdentifier === "spa package" || categoryIdentifier.includes("spa package");
            return isActive && (isComboByName || isComboByCategory);
        })
        .slice(0, 12);
    }, [servicesToUse]);
    
    const comboDeals = useMemo(() => {
        if (!servicesToUse || servicesToUse.length === 0) return [];
        return servicesToUse
        .filter((s) => {
            const isActive = s.isActive !== false;
            const name = s.name ? String(s.name).toLowerCase() : "";
            const category = s.categoryId !== undefined && s.categoryId !== null ? String(s.categoryId).toLowerCase() : "";
            const hasDiscount = Boolean(s.discountPrice);
            const isComboByName = name.includes("gói") || name.includes("combo");
            const isComboByCategory = category === "spa package" || category.includes("spa package");
            return isActive && (isComboByName || isComboByCategory) && hasDiscount;
        })
        .slice(0, 12);
    }, [servicesToUse]);
  
    const featuredPromotions = useMemo(() => {
        return allPromotions.filter(promo => {
            if (promo.isPublic === false) return false;
            const expiry = promo.expiryDate ? new Date(promo.expiryDate) : null;
            const now = new Date();
            const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            return expiry && expiry > now && expiry <= thirtyDaysFromNow;
        }).slice(0, 8);
    }, [allPromotions]);

    // Carousel State
    const useCarousel = (itemsLength: number) => {
        const [currentIndex, setCurrentIndex] = useState(0);
        const [itemsPerView, setItemsPerView] = useState(4);

        useEffect(() => {
            const handleResize = () => {
                if (window.innerWidth < 768) setItemsPerView(1);
                else if (window.innerWidth < 1024) setItemsPerView(2);
                else setItemsPerView(4); 
            };
            window.addEventListener('resize', handleResize);
            handleResize();
            return () => window.removeEventListener('resize', handleResize);
        }, []);

        const maxIndex = Math.max(0, itemsLength - itemsPerView);
        const next = () => setCurrentIndex(prev => Math.min(prev + 1, maxIndex));
        const prev = () => setCurrentIndex(prev => Math.max(prev - 1, 0));

        return { currentIndex, itemsPerView, next, prev, maxIndex };
    };

    const serviceCarousel = useCarousel(featuredServices.length);
    const comboCarousel = useCarousel(comboServices.length);
    const dealCarousel = useCarousel(comboDeals.length);
    const promoCarousel = useCarousel(featuredPromotions.length);

    const SectionHeader = ({ title, subtitle, badgeText }: { title: string, subtitle: string, badgeText?: string }) => (
        <div className="mb-8 max-w-2xl">
            {badgeText && (
                 <span className="inline-block px-3 py-1 mb-3 border border-brand-primary/30 rounded-full bg-brand-secondary text-brand-primary text-[10px] font-extrabold tracking-widest uppercase shadow-sm">
                    {badgeText}
                </span>
            )}
            <h2 className="text-3xl sm:text-4xl font-serif font-extrabold text-brand-dark mb-3 leading-tight">{title}</h2>
            <p className="text-base text-gray-600 font-medium leading-relaxed">{subtitle}</p>
        </div>
    );

    return (
        <div className="animate-fadeInUp bg-gray-50 font-sans overflow-x-hidden selection:bg-brand-primary selection:text-white">
            <Hero />
            <StatsSection />

            {/* Philosophy / Intro Section */}
            <section className="py-16 relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyan-300/20 rounded-full mix-blend-multiply filter blur-[100px] animate-pulse"></div>
                 <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-300/20 rounded-full mix-blend-multiply filter blur-[100px] animate-pulse animation-delay-500"></div>

                <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center relative z-10">
                    <div className="relative group max-w-lg mx-auto lg:mx-0">
                        <div className="absolute -inset-3 bg-gradient-to-tr from-cyan-400 to-blue-500 rounded-[2rem] rotate-2 opacity-30 blur-xl transition-all duration-500 group-hover:rotate-1 group-hover:opacity-50"></div>
                        <img src="../../../assets/IMG/hinhGiaoDien/about-anhthospa.jpg" alt="About Anh Tho Spa" className="relative rounded-[2rem] shadow-xl w-full h-auto object-cover z-10 border-4 border-white" loading="lazy" />
                        
                        {/* Floating Glass Badge */}
                         <div className="absolute -bottom-6 -right-6 z-20 bg-white/90 backdrop-blur-xl p-4 rounded-2xl shadow-lg max-w-[200px] border border-white animate-bounce-slow">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="p-2 bg-yellow-100 rounded-full text-yellow-600">
                                    <SparklesIcon className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800 text-sm">Không gian</p>
                                    <p className="text-[10px] text-gray-500 font-semibold uppercase">Sang trọng</p>
                                </div>
                            </div>
                            <p className="text-xs text-gray-600 leading-relaxed">Hòa mình vào thiên nhiên.</p>
                        </div>
                    </div>
                    <div>
                        <span className="text-brand-primary font-bold tracking-widest uppercase text-xs bg-white px-3 py-1 rounded-full shadow-sm border border-brand-secondary">Về Chúng Tôi</span>
                        <h2 className="text-3xl sm:text-4xl font-serif font-extrabold text-brand-text mb-4 mt-4 leading-tight">
                             Đánh Thức Vẻ Đẹp <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-blue-800">Tiềm Ẩn Của Bạn</span>
                        </h2>
                        <p className="text-base text-gray-700 mb-6 leading-relaxed font-medium">
                            Tại Anh Thơ Spa, chúng tôi tin rằng vẻ đẹp thực sự đến từ sự cân bằng. Sứ mệnh của chúng tôi là mang đến không gian yên tĩnh để bạn tạm gác lại âu lo.
                        </p>
                        <ul className="space-y-3 mb-8">
                            {['Liệu trình cá nhân hóa', '100% Mỹ phẩm chính hãng', 'Đội ngũ chuyên gia tận tâm'].map((item, idx) => (
                                <li key={idx} className="flex items-center gap-3 text-gray-800 font-bold bg-white p-3 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all hover:border-brand-primary/30 text-sm">
                                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                        <CheckCircleIcon className="w-4 h-4 text-green-600" />
                                    </div>
                                    {item}
                                </li>
                            ))}
                        </ul>
                        <Link to="/about" className="group inline-flex items-center justify-center px-8 py-3 bg-brand-dark text-white text-sm font-bold rounded-full hover:bg-brand-primary transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1">
                            <span>Tìm Hiểu Thêm</span>
                            <ArrowRightIcon className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1"/>
                        </Link>
                    </div>
                </div>
            </section>
            
            <ServicesOverviewSection />
            
            {/* Featured Services */}
            <section className="py-12 bg-white relative">
                <div className="container mx-auto px-4 relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
                        <SectionHeader title="Dịch Vụ Cốt Lõi" subtitle="4 dịch vụ được đặt nhiều nhất." badgeText="Most Booked" />
                        
                        {featuredServices.length > serviceCarousel.itemsPerView && (
                             <div className="hidden md:flex gap-2 mb-4">
                                <button onClick={serviceCarousel.prev} disabled={serviceCarousel.currentIndex === 0} className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center hover:border-brand-primary hover:bg-brand-primary hover:text-white text-gray-400 transition-all disabled:opacity-30"><ChevronLeftIcon className="w-5 h-5" /></button>
                                <button onClick={serviceCarousel.next} disabled={serviceCarousel.currentIndex >= serviceCarousel.maxIndex} className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center hover:border-brand-primary hover:bg-brand-primary hover:text-white text-gray-400 transition-all disabled:opacity-30"><ChevronRightIcon className="w-5 h-5" /></button>
                            </div>
                        )}
                    </div>

                    {(isLoadingMostBooked || isLoadingServices) ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {[...Array(4)].map((_, index) => <ServiceCardSkeleton key={index} />)}
                        </div>
                    ) : featuredServices.length === 0 ? (
                        <div className="text-center py-10">
                            <p className="text-lg text-gray-500">Không có dịch vụ nổi bật nào.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {featuredServices.map(service => (
                                <ServiceCard key={service.id} service={service} />
                            ))}
                        </div>
                    )}
                     <div className="mt-8 text-center">
                        <Link to="/services" className="inline-block px-8 py-2.5 border-2 border-brand-dark text-brand-dark font-bold rounded-full hover:bg-brand-dark hover:text-white transition-all duration-300 text-sm">
                            Xem Tất Cả
                        </Link>
                    </div>
                </div>
            </section>

            {/* Combo Services */}
            {comboServices.length > 0 && (
            <section className="py-12 relative bg-gradient-to-b from-brand-secondary to-white">
                <div className="container mx-auto px-4 relative z-10">
                     <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
                        <SectionHeader title="Các Gói Dịch Vụ" subtitle="Sự kết hợp hoàn hảo giữa các liệu trình." badgeText="Packages" />
                        
                        {comboServices.length > comboCarousel.itemsPerView && (
                             <div className="flex gap-2 mb-4">
                                <button onClick={comboCarousel.prev} disabled={comboCarousel.currentIndex === 0} className="w-10 h-10 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center hover:border-brand-primary hover:bg-brand-primary hover:text-white text-gray-400 transition-all disabled:opacity-30"><ChevronLeftIcon className="w-5 h-5" /></button>
                                <button onClick={comboCarousel.next} disabled={comboCarousel.currentIndex >= comboCarousel.maxIndex} className="w-10 h-10 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center hover:border-brand-primary hover:bg-brand-primary hover:text-white text-gray-400 transition-all disabled:opacity-30"><ChevronRightIcon className="w-5 h-5" /></button>
                            </div>
                        )}
                    </div>

                    <div className="relative overflow-hidden -mx-4 px-4 py-4">
                        <div 
                            className="flex transition-transform duration-700 ease-out" 
                            style={{ transform: `translateX(-${comboCarousel.currentIndex * (100 / comboCarousel.itemsPerView)}%)` }}
                        >
                            {comboServices.map(service => (
                                <div 
                                    key={service.id} 
                                    className="flex-shrink-0 px-3"
                                    style={{ flexBasis: `${100 / comboCarousel.itemsPerView}%` }}
                                >
                                    <ServiceCard service={service} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
            )}

            {/* Monthly Combo Deals Section */}
            {comboDeals.length > 0 && (
                <section className="py-16 bg-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-rose-50 via-orange-50 to-purple-50 opacity-80"></div>
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('/img/general/noise.png')] opacity-10 mix-blend-soft-light"></div>

                    <div className="container mx-auto px-4 relative z-10">
                        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
                            <div>
                                <span className="inline-block py-1 px-4 rounded-full bg-white border border-brand-accent text-brand-accent font-bold text-[10px] uppercase tracking-wider mb-3 shadow-sm">Limited Time</span>
                                <h2 className="text-3xl md:text-4xl font-serif font-extrabold text-brand-dark mb-3">Ưu Đãi Tháng</h2>
                                <p className="text-gray-600 text-base font-medium">Cơ hội trải nghiệm dịch vụ 5 sao với mức giá hấp dẫn.</p>
                            </div>
                            
                            {comboDeals.length > dealCarousel.itemsPerView && (
                                 <div className="flex gap-2">
                                    <button onClick={dealCarousel.prev} disabled={dealCarousel.currentIndex === 0} className="w-10 h-10 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center hover:border-brand-accent hover:bg-brand-accent hover:text-white text-gray-400 transition-all disabled:opacity-30"><ChevronLeftIcon className="w-5 h-5" /></button>
                                    <button onClick={dealCarousel.next} disabled={dealCarousel.currentIndex >= dealCarousel.maxIndex} className="w-10 h-10 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center hover:border-brand-accent hover:bg-brand-accent hover:text-white text-gray-400 transition-all disabled:opacity-30"><ChevronRightIcon className="w-5 h-5" /></button>
                                </div>
                            )}
                        </div>

                        <div className="relative overflow-hidden -mx-4 px-4 py-4">
                            <div 
                                className="flex transition-transform duration-700 ease-out" 
                                style={{ transform: `translateX(-${dealCarousel.currentIndex * (100 / dealCarousel.itemsPerView)}%)` }}
                            >
                                {comboDeals.map(service => (
                                    <div 
                                        key={service.id} 
                                        className="flex-shrink-0 px-3"
                                        style={{ flexBasis: `${100 / dealCarousel.itemsPerView}%` }}
                                    >
                                        <div className="transform hover:-translate-y-2 transition-transform duration-500 h-full">
                                            <ServiceCard service={service} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                         <div className="text-center mt-8">
                            <Link to="/promotions" className="inline-flex items-center gap-2 text-brand-accent font-bold text-base hover:text-brand-dark transition-colors border-b-2 border-brand-accent pb-0.5 hover:border-brand-dark">Xem ưu đãi <ArrowRightIcon className="w-4 h-4"/></Link>
                        </div>
                    </div>
                </section>
            )}

            {/* Promotions Carousel */}
            {featuredPromotions.length > 0 && (
                <section className="py-12 bg-brand-secondary/30">
                    <div className="container mx-auto px-4">
                        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
                            <SectionHeader title="Chương Trình Khuyến Mãi" subtitle="Quà tặng đặc biệt tri ân khách hàng." badgeText="Hot Deals" />
                            
                            {featuredPromotions.length > promoCarousel.itemsPerView && (
                                <div className="flex gap-2 mb-4">
                                    <button onClick={promoCarousel.prev} disabled={promoCarousel.currentIndex === 0} className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center hover:border-brand-primary hover:bg-brand-primary hover:text-white text-gray-400 transition-all disabled:opacity-30"><ChevronLeftIcon className="w-5 h-5" /></button>
                                    <button onClick={promoCarousel.next} disabled={promoCarousel.currentIndex >= promoCarousel.maxIndex} className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center hover:border-brand-primary hover:bg-brand-primary hover:text-white text-gray-400 transition-all disabled:opacity-30"><ChevronRightIcon className="w-5 h-5" /></button>
                                </div>
                            )}
                        </div>

                        {isLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[...Array(3)].map((_, index) => <ServiceCardSkeleton key={index} />)}
                            </div>
                        ) : (
                            <div className="relative overflow-hidden -mx-4 px-4 py-4">
                                <div 
                                    className="flex transition-transform duration-700 ease-out -mx-4" 
                                    style={{ transform: `translateX(-${promoCarousel.currentIndex * (100 / promoCarousel.itemsPerView)}%)` }}
                                >
                                    {featuredPromotions.map((promotion) => (
                                        <div 
                                            key={promotion.id} 
                                            className="flex-shrink-0 px-3"
                                            style={{ flexBasis: `${100 / promoCarousel.itemsPerView}%` }}
                                        >
                                            <PromotionCard promotion={promotion} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            )}
            
            {/* Testimonials */}
             <section className="py-16 relative bg-fixed bg-center bg-cover" style={{ backgroundImage: "url('/img/general/testimonials-bg.jpg')" }}>
                <div className="absolute inset-0 bg-white/90 backdrop-blur-[2px]"></div>
                
                <div className="container mx-auto px-4 relative z-10">
                    <div className="text-center mb-12">
                        <span className="text-brand-primary font-bold tracking-widest uppercase text-xs border border-brand-primary/20 px-3 py-1.5 rounded-full bg-white/50">Testimonials</span>
                        <h2 className="text-3xl md:text-4xl font-serif font-extrabold text-brand-dark mt-4 mb-4">Lời Nói Từ Trái Tim</h2>
                         <p className="text-gray-600 text-lg font-medium max-w-2xl mx-auto leading-relaxed">Niềm tin và sự hài lòng của khách hàng là thước đo thành công.</p>
                    </div>

                    {isLoadingReviews ? (
                        <div className="text-center text-gray-500">Đang tải đánh giá...</div>
                    ) : recentReviews.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                            {recentReviews.slice(0, 3).map((review) => (
                                <div key={review.id} className="bg-white p-8 rounded-[1.5rem] border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-1 relative">
                                     <div className="absolute -top-5 right-6 w-10 h-10 bg-brand-primary text-white rounded-full flex items-center justify-center shadow-md">
                                        <span className="text-2xl font-serif">"</span>
                                     </div>
                                     
                                     <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 rounded-full border-2 border-brand-secondary overflow-hidden bg-gray-200 flex items-center justify-center">
                                            {review.userImageUrl ? (
                                                <img 
                                                    src={review.userImageUrl.startsWith('http') ? review.userImageUrl : `http://localhost:3001${review.userImageUrl}`}
                                                    alt={review.userName}
                                                    className="w-full h-full object-cover object-center" 
                                                    style={{ objectPosition: 'center 30%' }}
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                        const parent = e.currentTarget.parentElement;
                                                        if (parent && !parent.querySelector('svg')) {
                                                            const icon = document.createElement('div');
                                                            icon.innerHTML = '<svg class="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path></svg>';
                                                            parent.appendChild(icon.firstChild);
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <ProfileIcon className="w-6 h-6 text-gray-400" />
                                            )}
                                        </div>
                                        <div>
                                             <h4 className="font-bold text-lg text-brand-text">{review.userName}</h4>
                                             <div className="flex text-yellow-400 mt-0.5">
                                                {[...Array(5)].map((_, i) => <StarIcon key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'text-gray-300'}`} />)}
                                            </div>
                                        </div>
                                     </div>
                                    <p className="text-gray-600 text-base italic leading-relaxed font-medium">"{review.comment}"</p>
                                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                                        <p className="text-[10px] text-brand-primary font-bold uppercase tracking-wider">{review.serviceName}</p>
                                        <p className="text-xs text-gray-400">{new Date(review.date).toLocaleDateString('vi-VN')}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                         <div className="text-center text-gray-500">Chưa có đánh giá nào.</div>
                    )}
                </div>
            </section>

             {/* CTA Section - Compact */}
            <section className="py-16 bg-white relative overflow-hidden">
                <div className="container mx-auto px-4">
                    <div className="relative rounded-[2rem] overflow-hidden shadow-xl">
                         <div className="absolute inset-0 bg-gradient-to-r from-cyan-800 to-blue-800"></div>
                         
                         <div className="absolute top-0 left-0 w-full h-full bg-[url('/img/general/spa-pattern.png')] opacity-10 mix-blend-overlay"></div>
                         <div className="absolute top-0 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-[60px] animate-pulse"></div>
                         <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-400/20 rounded-full blur-[60px] animate-pulse animation-delay-500"></div>

                         <div className="relative z-10 px-6 py-16 md:py-24 text-center">
                            <h2 className="text-3xl md:text-5xl font-serif font-extrabold text-white mb-6 drop-shadow-md">
                                Sẵn Sàng Cho Một Trải Nghiệm Mới?
                            </h2>
                            <p className="text-lg text-cyan-100 mb-10 max-w-2xl mx-auto font-medium leading-relaxed">
                                Đừng để sự mệt mỏi cản bước bạn. Hãy dành thời gian chăm sóc bản thân ngay hôm nay.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link
                                    to="/booking"
                                    className="bg-white text-cyan-900 font-bold py-3 px-10 rounded-full shadow-lg hover:shadow-white/30 hover:bg-cyan-50 transition-all hover:-translate-y-1 text-base"
                                >
                                    Đặt Lịch Ngay
                                </Link>
                                <Link
                                    to="/contact"
                                    className="bg-transparent border-2 border-white/40 backdrop-blur-sm text-white font-bold py-3 px-10 rounded-full hover:bg-white/10 hover:border-white transition-all hover:-translate-y-1 text-base"
                                >
                                    Liên Hệ Tư Vấn
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};
export default HomePage;
