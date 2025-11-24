
// import React, { useState, useEffect, useRef, useMemo } from 'react';
// import { Link } from 'react-router-dom';
// import ServiceCard from '../components/ServiceCard';
// import PromotionCard from '../components/PromotionCard';
// import { ServiceCardSkeleton } from '../components/SkeletonLoader';
// import { ChevronLeftIcon, ChevronRightIcon, StarIcon } from '../../shared/icons';
// import * as apiService from '../services/apiService';
// import type { Service, Promotion, Review } from '../../types';

// const heroSlides = [
//     {
//         imageUrl: '/img/general/hero-1.jpg',
//         title: 'Nơi Vẻ Đẹp Thăng Hoa',
//         subtitle: 'Trải nghiệm dịch vụ spa 5 sao với các liệu trình độc quyền, giúp bạn tái tạo năng lượng và gìn giữ nét xuân.',
//         buttonText: 'Khám Phá Dịch Vụ',
//         buttonLink: '/services',
//     },
//     {
//         imageUrl: '/img/general/hero-2.jpg',
//         title: 'Ưu Đãi Đặc Biệt Mùa Hè',
//         subtitle: 'Giảm giá lên đến 30% cho các gói chăm sóc da và massage toàn thân. Đừng bỏ lỡ!',
//         buttonText: 'Xem Ưu Đãi',
//         buttonLink: '/promotions',
//     },
//     {
//         imageUrl: '/img/general/hero-3.jpg',
//         title: 'Đội Ngũ Chuyên Viên Hàng Đầu',
//         subtitle: 'Với kinh nghiệm và sự tận tâm, chúng tôi cam kết mang đến cho bạn sự hài lòng tuyệt đối.',
//         buttonText: 'Đặt Lịch Hẹn',
//         buttonLink: '/booking',
//     },
// ];

// const Hero = () => {
//     const [currentSlide, setCurrentSlide] = useState(0);

//     useEffect(() => {
//         const timer = setInterval(() => {
//             setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
//         }, 5000);
//         return () => clearInterval(timer);
//     }, []);

//     return (
//         <section className="relative w-full h-[90vh] text-white">
//             {heroSlides.map((slide, index) => (
//                 <div
//                     key={index}
//                     className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
//                 >
//                     <img src={slide.imageUrl} alt={slide.title} className="w-full h-full object-cover" />
//                     <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent"></div>
//                 </div>
//             ))}
//             <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
//                 {heroSlides.map((slide, index) => (
//                     <div
//                         key={index}
//                         className={`transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0 hidden'}`}
//                     >
//                         <h1 key={`${index}-title`} className="text-4xl sm:text-5xl lg:text-7xl font-serif font-bold text-white mb-4 animate-slideUpFade">
//                             {slide.title}
//                         </h1>
//                         <p key={`${index}-subtitle`} className="text-lg md:text-xl max-w-2xl mx-auto mb-8 animate-slideUpFade animation-delay-300">
//                             {slide.subtitle}
//                         </p>
//                         <Link
//                             key={`${index}-button`}
//                             to={slide.buttonLink}
//                             className="bg-brand-primary text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-brand-dark transition-transform transform hover:scale-105 shadow-lg animate-slideUpFade animation-delay-500"
//                         >
//                             {slide.buttonText}
//                         </Link>
//                     </div>
//                 ))}
//             </div>
//              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex space-x-3">
//                 {heroSlides.map((_, index) => (
//                     <button
//                         key={index}
//                         onClick={() => setCurrentSlide(index)}
//                         className={`w-3 h-3 rounded-full transition-all duration-300 ${currentSlide === index ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white'}`}
//                         aria-label={`Chuyển đến slide ${index + 1}`}
//                     />
//                 ))}
//             </div>
//         </section>
//     );
// };

// interface HomePageProps {
//     allServices: Service[];
//     allPromotions: Promotion[];
//     isLoading: boolean;
// }

// export const HomePage: React.FC<HomePageProps> = ({ allServices, allPromotions, isLoading }) => {
//     const [recentReviews, setRecentReviews] = useState<Review[]>([]);
//     const [isLoadingReviews, setIsLoadingReviews] = useState(true);
//     const [localServices, setLocalServices] = useState<Service[]>([]);
//     const [isLoadingServices, setIsLoadingServices] = useState(false);

//     // Fetch services directly if allServices is empty
//     useEffect(() => {
//         const fetchServices = async () => {
//             // If allServices is provided and has data, use it
//             if (allServices && allServices.length > 0) {
//                 setLocalServices(allServices);
//                 return;
//             }
            
//             // Otherwise, fetch directly from API
//             try {
//                 setIsLoadingServices(true);
//                 const fetchedServices = await apiService.getServices();
//                 setLocalServices(fetchedServices);
//             } catch (error) {
//                 console.error("Failed to fetch services in HomePage:", error);
//                 setLocalServices([]);
//             } finally {
//                 setIsLoadingServices(false);
//             }
//         };

//         fetchServices();
//     }, [allServices]);

//     useEffect(() => {
//         const fetchReviews = async () => {
//             try {
//                 setIsLoadingReviews(true);
//                 const fetchedReviews = await apiService.getReviews({});
//                 setRecentReviews(fetchedReviews);
//             } catch (error) {
//                 console.error("Failed to fetch reviews:", error);
//                 setRecentReviews([]);
//             } finally {
//                 setIsLoadingReviews(false);
//             }
//         };
//         fetchReviews();
//     }, []);

//     // Use localServices if available, otherwise fallback to allServices
//     // Priority: localServices > allServices
//     const servicesToUse = useMemo(() => {
//         if (localServices.length > 0) {
//             return localServices;
//         }
//         if (allServices && allServices.length > 0) {
//             return allServices;
//         }
//         return [];
//     }, [localServices, allServices]);

//     const featuredServices = useMemo(() => {
//         if (!servicesToUse || servicesToUse.length === 0) {
//             return [];
//         }
//         // Helper function to safely convert value to boolean (handles boolean, number, string, undefined)
//         // Note: Database may return numbers (0/1) or strings even though TypeScript types say boolean
//         const toBoolean = (value: any, defaultValue: boolean = false): boolean => {
//             if (value === undefined || value === null) return defaultValue;
//             if (typeof value === 'boolean') return value;
//             if (typeof value === 'number') return value !== 0;
//             if (typeof value === 'string') {
//                 const lower = value.toLowerCase();
//                 return lower === 'true' || lower === '1' || lower === 'yes';
//             }
//             return defaultValue;
//         };
        
//         return servicesToUse
//             .filter(s => {
//                 // Check isActive (default to true if undefined)
//                 const isActive = toBoolean(s.isActive, true);
//                 return isActive;
//             })
//             .sort((a, b) => {
//                 // Handle both string and number ratings
//                 const ratingA = typeof a.rating === 'string' ? parseFloat(a.rating) : (a.rating || 0);
//                 const ratingB = typeof b.rating === 'string' ? parseFloat(b.rating) : (b.rating || 0);
//                 return ratingB - ratingA;
//             })
//             .slice(0, 8);
//     }, [servicesToUse]);
    
    
//   const comboServices = useMemo(() => {
//     if (!servicesToUse || servicesToUse.length === 0) {
//       return [];
//     }
//     return servicesToUse
//       .filter((s) => {
//         const isActive = s.isActive !== false;
//         const name = s.name ? String(s.name).toLowerCase() : "";
//         const categoryIdentifier =
//           s.categoryId !== undefined && s.categoryId !== null
//             ? String(s.categoryId).toLowerCase()
//             : "";
//         const isComboByName = name.includes("gói") || name.includes("combo");
//         const isComboByCategory =
//           categoryIdentifier === "spa package" ||
//           categoryIdentifier.includes("spa package");
//         return isActive && (isComboByName || isComboByCategory);
//       })
//       .slice(0, 8);
//   }, [servicesToUse]);
    
//    const comboDeals = useMemo(() => {
//     if (!servicesToUse || servicesToUse.length === 0) {
//       return [];
//     }
//     return servicesToUse
//       .filter((s) => {
//         const isActive = s.isActive !== false;
//         const name = s.name ? String(s.name).toLowerCase() : "";
//         const category =
//           s.categoryId !== undefined && s.categoryId !== null
//             ? String(s.categoryId).toLowerCase()
//             : "";
//         const hasDiscount = Boolean(s.discountPrice);
//         const isComboByName = name.includes("gói") || name.includes("combo");
//         const isComboByCategory =
//           category === "spa package" || category.includes("spa package");
//         return isActive && (isComboByName || isComboByCategory) && hasDiscount;
//       })
//       .slice(0, 8);
//   }, [servicesToUse]);
  
//     const featuredPromotions = useMemo(() => {
//         return allPromotions.filter(promo => {
//             // Only show public promotions on homepage
//             if (promo.isPublic === false) return false;
//             const expiry = promo.expiryDate ? new Date(promo.expiryDate) : null;
//             const now = new Date();
//             const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
//             return expiry && expiry > now && expiry <= thirtyDaysFromNow;
//         }).slice(0, 8);
//     }, [allPromotions]);

//     const [currentServiceIndex, setCurrentServiceIndex] = useState(0);
//     const [serviceItemsPerView, setServiceItemsPerView] = useState(3);

//     const [currentPromoIndex, setCurrentPromoIndex] = useState(0);
//     const [promoItemsPerView, setPromoItemsPerView] = useState(3);
    
//     const [currentComboIndex, setCurrentComboIndex] = useState(0);
//     const [comboItemsPerView, setComboItemsPerView] = useState(3);
    
//     const [currentComboDealIndex, setCurrentComboDealIndex] = useState(0);
//     const [comboDealItemsPerView, setComboDealItemsPerView] = useState(3);


//     useEffect(() => {
//         const handleResize = () => {
//             let newItemsPerView = 3;
//             if (window.innerWidth < 768) {
//                 newItemsPerView = 1;
//             } else if (window.innerWidth < 1024) {
//                 newItemsPerView = 2;
//             } else {
//                 newItemsPerView = 3;
//             }
//             setServiceItemsPerView(newItemsPerView);
//             setPromoItemsPerView(newItemsPerView);
//             setComboItemsPerView(newItemsPerView);
//             setComboDealItemsPerView(newItemsPerView);
//         };

//         window.addEventListener('resize', handleResize);
//         handleResize();
//         return () => window.removeEventListener('resize', handleResize);
//     }, []);

//     const totalServices = featuredServices.length;
//     const maxServiceIndex = Math.max(0, totalServices - serviceItemsPerView);

//     const handleNextService = () => {
//         setCurrentServiceIndex(prev => Math.min(prev + 1, maxServiceIndex));
//     };

//     const handlePrevService = () => {
//         setCurrentServiceIndex(prev => Math.max(prev - 1, 0));
//     };
    
//     const totalCombos = comboServices.length;
//     const maxComboIndex = Math.max(0, totalCombos - comboItemsPerView);

//     const handleNextCombo = () => {
//         setCurrentComboIndex(prev => Math.min(prev + 1, maxComboIndex));
//     };

//     const handlePrevCombo = () => {
//         setCurrentComboIndex(prev => Math.max(prev - 1, 0));
//     };
    
//     const totalComboDeals = comboDeals.length;
//     const maxComboDealIndex = Math.max(0, totalComboDeals - comboDealItemsPerView);

//     const handleNextComboDeal = () => {
//         setCurrentComboDealIndex(prev => Math.min(prev + 1, maxComboDealIndex));
//     };

//     const handlePrevComboDeal = () => {
//         setCurrentComboDealIndex(prev => Math.max(prev - 1, 0));
//     };

//     const totalPromotions = featuredPromotions.length;
//     const maxPromoIndex = Math.max(0, totalPromotions - promoItemsPerView);

//     const handleNextPromo = () => {
//         setCurrentPromoIndex(prev => Math.min(prev + 1, maxPromoIndex));
//     };

//     const handlePrevPromo = () => {
//         setCurrentPromoIndex(prev => Math.max(prev - 1, 0));
//     };


//     return (
//         <div className="animate-fadeInUp">
//             <Hero />

//             <section id="about" className="py-24 bg-brand-light">
//                 <div className="container mx-auto px-4 grid md:grid-cols-2 gap-16 items-center">
//                     <div>
//                         <img src="/img/general/about-spa.jpg" alt="About Anh Tho Spa" className="rounded-lg shadow-soft-xl" loading="lazy" />
//                     </div>
//                     <div>
//                         <h2 className="text-4xl sm:text-5xl font-serif font-bold text-brand-text mb-6">Chào Mừng Đến Với Anh Thơ Spa</h2>
//                         <p className="text-lg text-brand-text/80 mb-4 leading-relaxed">
//                             Tại Anh Thơ Spa, chúng tôi tin rằng vẻ đẹp thực sự đến từ sự cân bằng giữa cơ thể, tâm trí và tinh thần. Sứ mệnh của chúng tôi là mang đến cho bạn một không gian yên tĩnh, nơi bạn có thể tạm gác lại những bộn bề cuộc sống và tận hưởng những giây phút chăm sóc bản thân quý giá.
//                         </p>
//                         <p className="text-brand-text/80 mb-8 leading-relaxed">
//                             Với đội ngũ chuyên viên giàu kinh nghiệm, sản phẩm cao cấp và công nghệ hiện đại, chúng tôi cam kết mang đến những liệu trình hiệu quả và an toàn nhất.
//                         </p>
//                         <Link to="/services" className="bg-brand-dark text-white font-semibold py-3 px-8 rounded-lg hover:bg-brand-primary transition-colors shadow-soft-lg hover:shadow-soft-xl transform hover:-translate-y-0.5">
//                             Tìm Hiểu Thêm
//                         </Link>
//                     </div>
//                 </div>
//             </section>
            
//             <section className="py-24 bg-brand-secondary">
//                 <div className="container mx-auto px-4">
//                     <div className="text-center mb-16">
//                         <h2 className="text-4xl sm:text-5xl font-serif font-bold text-brand-text">Dịch Vụ Nổi Bật</h2>
//                         <p className="mt-4 text-lg text-brand-text/70 max-w-2xl mx-auto">Những liệu trình được khách hàng yêu thích và tin dùng nhất tại Anh Thơ Spa.</p>
//                     </div>
//                     {(isLoading || isLoadingServices) ? (
//                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
//                             {[...Array(3)].map((_, index) => <ServiceCardSkeleton key={index} />)}
//                         </div>
//                     ) : featuredServices.length === 0 ? (
//                         <div className="text-center py-10 bg-white rounded-lg shadow-soft-lg">
//                             <p className="text-lg text-gray-500">Không có dịch vụ nổi bật nào để hiển thị.</p>
//                             {servicesToUse.length > 0 && (
//                                 <p className="text-sm text-gray-400 mt-2">
//                                     Tìm thấy {servicesToUse.length} dịch vụ nhưng không có dịch vụ nào được đánh dấu là "nổi bật".
//                                 </p>
//                             )}
//                         </div>
//                     ) : (
//                         <>
//                             <div className="relative">
//                                 <div className="overflow-hidden">
//                                     <div 
//                                         className="flex transition-transform duration-500 ease-in-out -mx-4" 
//                                         style={{ transform: `translateX(-${currentServiceIndex * (100 / serviceItemsPerView)}%)` }}
//                                     >
//                                         {featuredServices.map(service => (
//                                             <div 
//                                                 key={service.id} 
//                                                 className="flex-shrink-0 px-4"
//                                                 style={{ flexBasis: `${100 / serviceItemsPerView}%` }}
//                                             >
//                                                 <ServiceCard service={service} />
//                                             </div>
//                                         ))}
//                                     </div>
//                                 </div>
//                                 {totalServices > serviceItemsPerView && (
//                                     <>
//                                         <button
//                                             onClick={handlePrevService}
//                                             disabled={currentServiceIndex === 0}
//                                             className="absolute top-1/2 -left-6 -translate-y-1/2 p-3 bg-white rounded-full shadow-soft-lg text-brand-dark hover:bg-brand-secondary disabled:opacity-50 disabled:cursor-not-allowed z-10"
//                                             aria-label="Dịch vụ trước"
//                                         >
//                                             <ChevronLeftIcon className="w-6 h-6" />
//                                         </button>
//                                         <button
//                                             onClick={handleNextService}
//                                             disabled={currentServiceIndex >= maxServiceIndex}
//                                             className="absolute top-1/2 -right-6 -translate-y-1/2 p-3 bg-white rounded-full shadow-soft-lg text-brand-dark hover:bg-brand-secondary disabled:opacity-50 disabled:cursor-not-allowed z-10"
//                                             aria-label="Dịch vụ sau"
//                                         >
//                                             <ChevronRightIcon className="w-6 h-6" />
//                                         </button>
//                                     </>
//                                 )}
//                             </div>
//                         </>
//                     )}
//                 </div>
//             </section>

//             {comboServices.length > 0 && (
//             <section className="py-24 bg-brand-light">
//                 <div className="container mx-auto px-4">
//                     <div className="text-center mb-16">
//                         <h2 className="text-4xl sm:text-5xl font-serif font-bold text-brand-text">Các Gói Dịch Vụ</h2>
//                         <p className="mt-4 text-lg text-brand-text/70 max-w-2xl mx-auto">Trải nghiệm sự kết hợp hoàn hảo giữa các liệu trình với gói combo tiết kiệm của chúng tôi.</p>
//                     </div>
//                     {isLoading ? (
//                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
//                             {[...Array(3)].map((_, index) => <ServiceCardSkeleton key={index} />)}
//                         </div>
//                     ) : (
//                         <>
//                             <div className="relative">
//                                 <div className="overflow-hidden">
//                                     <div 
//                                         className="flex transition-transform duration-500 ease-in-out -mx-4" 
//                                         style={{ transform: `translateX(-${currentComboIndex * (100 / comboItemsPerView)}%)` }}
//                                     >
//                                         {comboServices.map(service => (
//                                             <div 
//                                                 key={service.id} 
//                                                 className="flex-shrink-0 px-4"
//                                                 style={{ flexBasis: `${100 / comboItemsPerView}%` }}
//                                             >
//                                                 <ServiceCard service={service} />
//                                             </div>
//                                         ))}
//                                     </div>
//                                 </div>
//                                 {totalCombos > comboItemsPerView && (
//                                     <>
//                                         <button
//                                             onClick={handlePrevCombo}
//                                             disabled={currentComboIndex === 0}
//                                             className="absolute top-1/2 -left-6 -translate-y-1/2 p-3 bg-white rounded-full shadow-soft-lg text-brand-dark hover:bg-brand-secondary disabled:opacity-50 disabled:cursor-not-allowed z-10"
//                                             aria-label="Combo trước"
//                                         >
//                                             <ChevronLeftIcon className="w-6 h-6" />
//                                         </button>
//                                         <button
//                                             onClick={handleNextCombo}
//                                             disabled={currentComboIndex >= maxComboIndex}
//                                             className="absolute top-1/2 -right-6 -translate-y-1/2 p-3 bg-white rounded-full shadow-soft-lg text-brand-dark hover:bg-brand-secondary disabled:opacity-50 disabled:cursor-not-allowed z-10"
//                                             aria-label="Combo sau"
//                                         >
//                                             <ChevronRightIcon className="w-6 h-6" />
//                                         </button>
//                                     </>
//                                 )}
//                             </div>
//                         </>
//                     )}
//                 </div>
//             </section>
//             )}

//             {comboDeals.length > 0 && (
//             <section className="py-24 bg-brand-secondary">
//                 <div className="container mx-auto px-4">
//                     <div className="text-center mb-16">
//                         <h2 className="text-4xl sm:text-5xl font-serif font-bold text-brand-text">Các Combo Ưu Đãi Trong Tháng</h2>
//                         <p className="mt-4 text-lg text-brand-text/70 max-w-2xl mx-auto">Tiết kiệm hơn với các gói dịch vụ kết hợp đang có giá ưu đãi đặc biệt.</p>
//                     </div>
//                     {isLoading ? (
//                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
//                             {[...Array(3)].map((_, index) => <ServiceCardSkeleton key={index} />)}
//                         </div>
//                     ) : (
//                         <>
//                             <div className="relative">
//                                 <div className="overflow-hidden">
//                                     <div 
//                                         className="flex transition-transform duration-500 ease-in-out -mx-4" 
//                                         style={{ transform: `translateX(-${currentComboDealIndex * (100 / comboDealItemsPerView)}%)` }}
//                                     >
//                                         {comboDeals.map(service => (
//                                             <div 
//                                                 key={service.id} 
//                                                 className="flex-shrink-0 px-4"
//                                                 style={{ flexBasis: `${100 / comboDealItemsPerView}%` }}
//                                             >
//                                                 <ServiceCard service={service} />
//                                             </div>
//                                         ))}
//                                     </div>
//                                 </div>
//                                 {totalComboDeals > comboDealItemsPerView && (
//                                     <>
//                                         <button
//                                             onClick={handlePrevComboDeal}
//                                             disabled={currentComboDealIndex === 0}
//                                             className="absolute top-1/2 -left-6 -translate-y-1/2 p-3 bg-white rounded-full shadow-soft-lg text-brand-dark hover:bg-brand-secondary disabled:opacity-50 disabled:cursor-not-allowed z-10"
//                                             aria-label="Ưu đãi combo trước"
//                                         >
//                                             <ChevronLeftIcon className="w-6 h-6" />
//                                         </button>
//                                         <button
//                                             onClick={handleNextComboDeal}
//                                             disabled={currentComboDealIndex >= maxComboDealIndex}
//                                             className="absolute top-1/2 -right-6 -translate-y-1/2 p-3 bg-white rounded-full shadow-soft-lg text-brand-dark hover:bg-brand-secondary disabled:opacity-50 disabled:cursor-not-allowed z-10"
//                                             aria-label="Ưu đãi combo sau"
//                                         >
//                                             <ChevronRightIcon className="w-6 h-6" />
//                                         </button>
//                                     </>
//                                 )}
//                             </div>
//                         </>
//                     )}
//                 </div>
//             </section>
//             )}

//             {featuredPromotions.length > 0 && (
//                 <section className="py-24 bg-brand-light">
//                     <div className="container mx-auto px-4">
//                         <div className="text-center mb-16">
//                             <h2 className="text-4xl sm:text-5xl font-serif font-bold text-brand-text">Ưu Đãi Nổi Bật</h2>
//                             <p className="mt-4 text-lg text-brand-text/70 max-w-2xl mx-auto">Đừng bỏ lỡ các chương trình khuyến mãi hấp dẫn đang diễn ra!</p>
//                         </div>
//                         {isLoading ? (
//                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
//                                 {[...Array(3)].map((_, index) => <ServiceCardSkeleton key={index} />)}
//                             </div>
//                         ) : (
//                             <>
//                                 <div className="relative">
//                                     <div className="overflow-hidden">
//                                         <div 
//                                             className="flex transition-transform duration-500 ease-in-out -mx-4" 
//                                             style={{ transform: `translateX(-${currentPromoIndex * (100 / promoItemsPerView)}%)` }}
//                                         >
//                                             {featuredPromotions.map((promotion) => (
//                                                 <div 
//                                                     key={promotion.id} 
//                                                     className="flex-shrink-0 px-4"
//                                                     style={{ flexBasis: `${100 / promoItemsPerView}%` }}
//                                                 >
//                                                     <PromotionCard promotion={promotion} />
//                                                 </div>
//                                             ))}
//                                         </div>
//                                     </div>
//                                     {totalPromotions > promoItemsPerView && (
//                                         <>
//                                             <button
//                                                 onClick={handlePrevPromo}
//                                                 disabled={currentPromoIndex === 0}
//                                                 className="absolute top-1/2 -left-6 -translate-y-1/2 p-3 bg-white rounded-full shadow-soft-lg text-brand-dark hover:bg-brand-secondary disabled:opacity-50 disabled:cursor-not-allowed z-10"
//                                                 aria-label="Ưu đãi trước"
//                                             >
//                                                 <ChevronLeftIcon className="w-6 h-6" />
//                                             </button>
//                                             <button
//                                                 onClick={handleNextPromo}
//                                                 disabled={currentPromoIndex >= maxPromoIndex}
//                                                 className="absolute top-1/2 -right-6 -translate-y-1/2 p-3 bg-white rounded-full shadow-soft-lg text-brand-dark hover:bg-brand-secondary disabled:opacity-50 disabled:cursor-not-allowed z-10"
//                                                 aria-label="Ưu đãi sau"
//                                             >
//                                                 <ChevronRightIcon className="w-6 h-6" />
//                                             </button>
//                                         </>
//                                     )}
//                                 </div>
//                             </>
//                         )}
//                     </div>
//                 </section>
//             )}
            
//              <section className="py-24 bg-brand-secondary">
//                 <div className="container mx-auto px-4 text-center">
//                     <h2 className="text-4xl sm:text-5xl font-serif font-bold text-brand-text mb-16">Khách Hàng Nói Gì Về Chúng Tôi</h2>
//                     {isLoadingReviews ? (
//                         <div className="text-center py-10 bg-white rounded-lg shadow-soft-lg">
//                             <p className="text-lg text-gray-500">Đang tải đánh giá...</p>
//                         </div>
//                     ) : recentReviews.length > 0 ? (
//                         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
//                             {recentReviews.slice(0, 3).map((review) => (
//                                 <div key={review.id} className="bg-white p-8 rounded-lg shadow-soft-lg transition-transform transform hover:-translate-y-2">
//                                     <img src={review.userImageUrl} alt={review.userName} className="w-24 h-24 rounded-full mx-auto mb-6 ring-4 ring-brand-secondary" />
//                                     <div className="flex justify-center mb-4">
//                                         {[...Array(review.rating)].map((_, i) => <StarIcon key={i} className="w-6 h-6 text-yellow-400" />)}
//                                     </div>
//                                     <p className="text-brand-text/80 italic text-lg mb-4">"{review.comment}"</p>
//                                     <p className="font-semibold text-brand-text text-lg">{review.userName}</p>
//                                 </div>
//                             ))}
//                         </div>
//                     ) : (
//                         <div className="text-center py-10 bg-white rounded-lg shadow-soft-lg">
//                             <p className="text-lg text-gray-500">Chưa có đánh giá nào gần đây.</p>
//                         </div>
//                     )}
//                 </div>
//             </section>
//         </div>
//     );
// }

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ServiceCard from '../components/ServiceCard';
import PromotionCard from '../components/PromotionCard';
import { ServiceCardSkeleton } from '../components/SkeletonLoader';
import { ChevronLeftIcon, ChevronRightIcon, StarIcon, SparklesIcon, CheckCircleIcon, ArrowRightIcon } from '../../shared/icons';
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
        <section className="relative w-full h-[90vh] overflow-hidden bg-brand-dark">
            {heroSlides.map((slide, index) => (
                <div
                    key={index}
                    className={`absolute inset-0 transition-all duration-[1500ms] ease-in-out transform ${index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}
                >
                    <img src={slide.imageUrl} alt={slide.title} className="w-full h-full object-cover" />
                    {/* Overlay with deeper gradient */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-white/95"></div>
                </div>
            ))}
            
            <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center items-center text-center">
                {heroSlides.map((slide, index) => (
                    <div
                        key={index}
                        className={`transition-all duration-1000 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl px-4 ${index === currentSlide ? 'opacity-100 translate-y-[-50%]' : 'opacity-0 translate-y-[-40%] pointer-events-none'}`}
                    >
                        {/* Glass Card with stronger border */}
                        <div className="relative bg-white/90 backdrop-blur-2xl border-2 border-white/80 p-10 md:p-14 rounded-[3rem] shadow-2xl overflow-hidden ring-4 ring-brand-secondary/50">
                            {/* Decorative Blobs inside card - Richer Colors */}
                            <div className="absolute top-[-50%] left-[-50%] w-full h-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-full blur-3xl animate-float"></div>
                            
                            <div className="relative z-10 flex flex-col items-center">
                                <div className="inline-block px-6 py-2 mb-6 border-2 border-brand-primary/20 rounded-full bg-white text-brand-primary text-xs font-extrabold tracking-[0.2em] uppercase animate-fadeInUp shadow-md">
                                    Welcome to Anh Thơ Spa
                                </div>
                                <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-extrabold text-brand-dark mb-6 leading-tight drop-shadow-md animate-slideUpFade animation-delay-200">
                                    {slide.title}
                                </h1>
                                <p className="text-lg md:text-xl text-gray-700 font-semibold mb-10 leading-relaxed max-w-2xl mx-auto animate-slideUpFade animation-delay-300">
                                    {slide.subtitle}
                                </p>
                                <Link
                                    to={slide.buttonLink}
                                    className="group relative inline-flex items-center gap-3 bg-ocean-gradient text-white font-bold py-4 px-12 rounded-full text-lg shadow-xl hover:shadow-cyan-700/40 hover:-translate-y-1 transition-all duration-300 animate-slideUpFade animation-delay-500 border border-white/20"
                                >
                                    <span>{slide.buttonText}</span>
                                    <ArrowRightIcon className="w-6 h-6 transition-transform group-hover:translate-x-1" />
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
             <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex gap-3">
                {heroSlides.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={`h-2 rounded-full transition-all duration-500 border border-white/50 ${currentSlide === index ? 'w-12 bg-brand-primary shadow-glow' : 'w-3 bg-white/60 hover:bg-white'}`}
                        aria-label={`Slide ${index + 1}`}
                    />
                ))}
            </div>
        </section>
    );
};

const StatsSection = () => (
    <div className="relative z-20 -mt-20 container mx-auto px-4">
        <div className="bg-white rounded-[2rem] shadow-2xl border border-gray-100 p-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center relative overflow-hidden transform hover:-translate-y-1 transition-transform duration-500">
             <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-primary via-blue-600 to-brand-accent"></div>
            
             {[
                { val: '5+', label: 'Năm Kinh Nghiệm', color: 'text-brand-primary' },
                { val: '10k+', label: 'Khách Hàng Vui Vẻ', color: 'text-blue-700' },
                { val: '50+', label: 'Dịch Vụ Đa Dạng', color: 'text-purple-700' },
                { val: '100%', label: 'Mỹ Phẩm Tự Nhiên', color: 'text-emerald-600' },
            ].map((stat, idx) => (
                <div key={idx} className="relative p-2 group">
                    <p className={`text-4xl md:text-5xl font-serif font-extrabold ${stat.color} mb-2 group-hover:scale-110 transition-transform duration-300 drop-shadow-sm`}>{stat.val}</p>
                    <p className="text-xs md:text-sm text-gray-700 font-bold uppercase tracking-wide">{stat.label}</p>
                </div>
            ))}
        </div>
    </div>
);

// Custom Icon Component for Service Overview - Using Brand Primary for Stronger Color
const ServiceIcon = ({ type }: { type: string }) => {
    const iconClass = "w-16 h-16 text-brand-primary mb-4 mx-auto stroke-[1.5] transition-all duration-300 group-hover:text-brand-accent group-hover:scale-110 filter drop-shadow-sm";
    
    switch (type) {
        case 'package': // Bottles/Stones
            return (
                <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2h6v-2M5 9H9V7a2 2 0 012-2h2a2 2 0 012 2v2h4a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V11a2 2 0 012-2z" />
                </svg>
            );
        case 'massage': // Massage Bed
             return (
                <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M20 12V8H4v4M4 12v8m16-8v8M6 8V5a1 1 0 011-1h10a1 1 0 011 1v3" />
                   <path strokeLinecap="round" strokeLinejoin="round" d="M10 4h4" />
                </svg>
            );
        case 'skin': // Face
            return (
                <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
                </svg>
            );
        case 'body': // Person Lying
            return (
                <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            );
        case 'hair': // Flower/Towel
             return (
                <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
            );
        case 'waxing': // Jar
             return (
                <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                     <circle cx="12" cy="7" r="4" />
                </svg>
            );
        default: return null;
    }
}

const ServicesOverviewSection = () => {
    const navigate = useNavigate();

    const handleNavigate = (category: string) => {
        // Navigate to services list page with category filter
        navigate(`/services?category=${encodeURIComponent(category)}`);
    };

    return (
        <section className="py-20 bg-white relative">
            {/* Subtle fresh background gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-secondary/50 to-transparent pointer-events-none"></div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center mb-16">
                     <span className="text-brand-primary font-bold tracking-widest uppercase text-sm bg-white px-5 py-2 rounded-full shadow-md border border-brand-secondary">Danh mục</span>
                    <h2 className="text-5xl md:text-6xl font-serif font-extrabold text-brand-dark mt-6 mb-6">
                        Dịch vụ của Anh Thơ
                    </h2>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-16">
                    {[
                        { type: 'package', label: 'TRỌN GÓI', category: 'Spa Package' },
                        { type: 'massage', label: 'MASSAGE THƯ GIÃN', category: 'Massage' },
                        { type: 'skin', label: 'CHĂM SÓC DA', category: 'Skincare' },
                        { type: 'body', label: 'CHĂM SÓC CƠ THỂ', category: 'Body Care' },
                        { type: 'hair', label: 'CHĂM SÓC TÓC', category: 'Hair Care' }, 
                        { type: 'waxing', label: 'WAXING', category: 'Triệt Lông' },
                    ].map((item, idx) => (
                        <div 
                            key={idx} 
                            onClick={() => handleNavigate(item.category)}
                            className="flex flex-col items-center text-center group cursor-pointer p-5 rounded-3xl bg-white border border-gray-100 hover:border-brand-primary/30 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                        >
                            <div className="mb-3 p-4 rounded-full bg-brand-secondary/30 group-hover:bg-brand-secondary/80 transition-colors">
                                <ServiceIcon type={item.type} />
                            </div>
                            <span className="text-sm font-bold text-gray-700 uppercase tracking-wider group-hover:text-brand-primary transition-colors">
                                {item.label}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="max-w-4xl mx-auto text-center">
                    <p className="text-gray-700 text-lg leading-relaxed mb-10 font-medium">
                        Dịch vụ trọn gói nhà Anh Thơ bao gồm từ 2 đến 3 dịch vụ lẻ kết hợp với nhau để đem lại trải nghiệm và ưu đãi tốt nhất.
                        Tất cả các dịch vụ Trọn gói đều được miễn phí xông hơi khô hoặc xông hơi ướt thảo dược. 
                        Bạn có thể nâng cấp các dịch vụ trong các gói để phù hợp với sở thích và nhu cầu, sẽ có phí dịch vụ chênh lệch.
                    </p>
                    <Link 
                        to="/services" 
                        className="group inline-flex items-center justify-center px-10 py-4 bg-ocean-gradient text-white text-sm font-bold uppercase tracking-widest rounded-full shadow-lg hover:shadow-cyan-700/50 hover:-translate-y-1 transition-all duration-300"
                    >
                        XEM CHI TIẾT
                         <ArrowRightIcon className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1"/>
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

    // Fetch services directly if allServices is empty
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

    const servicesToUse = useMemo(() => {
        if (localServices.length > 0) return localServices;
        if (allServices && allServices.length > 0) return allServices;
        return [];
    }, [localServices, allServices]);

    const featuredServices = useMemo(() => {
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
            .filter(s => {
                // Check isActive (default to true if undefined)
                const isActive = toBoolean(s.isActive, true);
                return isActive;
            })
            .sort((a, b) => {
                const ratingA = typeof a.rating === 'string' ? parseFloat(a.rating) : (a.rating || 0);
                const ratingB = typeof b.rating === 'string' ? parseFloat(b.rating) : (b.rating || 0);
                return ratingB - ratingA;
            })
            .slice(0, 12);
    }, [servicesToUse]);
    
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
            // Only show public promotions on homepage
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

    // Reusable Section Header
    const SectionHeader = ({ title, subtitle, badgeText }: { title: string, subtitle: string, badgeText?: string }) => (
        <div className="mb-12 max-w-3xl">
            {badgeText && (
                 <span className="inline-block px-4 py-1.5 mb-4 border border-brand-primary/30 rounded-full bg-brand-secondary text-brand-primary text-xs font-extrabold tracking-widest uppercase shadow-sm">
                    {badgeText}
                </span>
            )}
            <h2 className="text-4xl sm:text-5xl font-serif font-extrabold text-brand-dark mb-4 leading-tight">{title}</h2>
            <p className="text-lg text-gray-600 font-medium leading-relaxed">{subtitle}</p>
        </div>
    );

    return (
        <div className="animate-fadeInUp bg-gray-50 font-sans overflow-x-hidden selection:bg-brand-primary selection:text-white">
            <Hero />
            <StatsSection />

            {/* Philosophy / Intro Section */}
            <section className="py-20 relative overflow-hidden">
                 {/* Stronger, Richer Blobs */}
                 <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-cyan-300/20 rounded-full mix-blend-multiply filter blur-[100px] animate-pulse"></div>
                 <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-blue-300/20 rounded-full mix-blend-multiply filter blur-[100px] animate-pulse animation-delay-500"></div>

                <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-16 items-center relative z-10">
                    <div className="relative group">
                        <div className="absolute -inset-4 bg-gradient-to-tr from-cyan-400 to-blue-500 rounded-[2.5rem] rotate-2 opacity-30 blur-xl transition-all duration-500 group-hover:rotate-1 group-hover:opacity-50"></div>
                        <img src="/img/general/about-spa.jpg" alt="About Anh Tho Spa" className="relative rounded-[2.5rem] shadow-2xl w-full h-auto object-cover z-10 border-4 border-white" loading="lazy" />
                        
                        {/* Floating Glass Badge */}
                         <div className="absolute -bottom-8 -right-8 z-20 bg-white/90 backdrop-blur-xl p-6 rounded-3xl shadow-xl max-w-xs border border-white animate-bounce-slow">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="p-3 bg-yellow-100 rounded-full text-yellow-600">
                                    <SparklesIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800">Không gian</p>
                                    <p className="text-xs text-gray-500 font-semibold uppercase">Sang trọng & Thư thái</p>
                                </div>
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed">Hòa mình vào thiên nhiên với hương thơm thảo mộc dịu nhẹ.</p>
                        </div>
                    </div>
                    <div>
                        <span className="text-brand-primary font-bold tracking-widest uppercase text-sm bg-white px-4 py-1.5 rounded-full shadow-sm border border-brand-secondary">Về Chúng Tôi</span>
                        <h2 className="text-4xl sm:text-5xl font-serif font-extrabold text-brand-text mb-6 mt-6 leading-tight">
                             Đánh Thức Vẻ Đẹp <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-blue-800">Tiềm Ẩn Của Bạn</span>
                        </h2>
                        <p className="text-lg text-gray-700 mb-8 leading-relaxed font-medium">
                            Tại Anh Thơ Spa, chúng tôi tin rằng vẻ đẹp thực sự đến từ sự cân bằng giữa cơ thể, tâm trí và tinh thần. Sứ mệnh của chúng tôi là mang đến cho bạn một không gian yên tĩnh, nơi bạn có thể tạm gác lại những bộn bề cuộc sống.
                        </p>
                        <ul className="space-y-4 mb-10">
                            {['Liệu trình cá nhân hóa', '100% Mỹ phẩm chính hãng', 'Đội ngũ chuyên gia tận tâm'].map((item, idx) => (
                                <li key={idx} className="flex items-center gap-4 text-gray-800 font-bold bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all hover:border-brand-primary/30">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                        <CheckCircleIcon className="w-5 h-5 text-green-600" />
                                    </div>
                                    {item}
                                </li>
                            ))}
                        </ul>
                        <Link to="/about" className="group inline-flex items-center justify-center px-10 py-4 bg-brand-dark text-white text-lg font-bold rounded-full hover:bg-brand-primary transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1">
                            <span>Tìm Hiểu Thêm</span>
                            <ArrowRightIcon className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1"/>
                        </Link>
                    </div>
                </div>
            </section>
            
            {/* Services of Anh Thơ Section */}
            <ServicesOverviewSection />
            
            {/* Featured Services */}
            <section className="py-16 bg-white relative">
                <div className="container mx-auto px-4 relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
                        <SectionHeader title="Dịch Vụ Cốt Lõi" subtitle="Những liệu trình được yêu thích nhất, tinh hoa của Anh Thơ Spa." badgeText="Top Rated" />
                        
                        {featuredServices.length > serviceCarousel.itemsPerView && (
                             <div className="hidden md:flex gap-3 mb-8">
                                <button onClick={serviceCarousel.prev} disabled={serviceCarousel.currentIndex === 0} className="w-12 h-12 rounded-full border-2 border-gray-200 flex items-center justify-center hover:border-brand-primary hover:bg-brand-primary hover:text-white text-gray-400 transition-all disabled:opacity-30"><ChevronLeftIcon className="w-6 h-6" /></button>
                                <button onClick={serviceCarousel.next} disabled={serviceCarousel.currentIndex >= serviceCarousel.maxIndex} className="w-12 h-12 rounded-full border-2 border-gray-200 flex items-center justify-center hover:border-brand-primary hover:bg-brand-primary hover:text-white text-gray-400 transition-all disabled:opacity-30"><ChevronRightIcon className="w-6 h-6" /></button>
                            </div>
                        )}
                    </div>

                    {(isLoading || isLoadingServices) ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {[...Array(4)].map((_, index) => <ServiceCardSkeleton key={index} />)}
                        </div>
                    ) : featuredServices.length === 0 ? (
                        <div className="text-center py-10">
                            <p className="text-lg text-gray-500">Không có dịch vụ nổi bật nào để hiển thị.</p>
                        </div>
                    ) : (
                        <div className="relative overflow-hidden -mx-4 px-4 py-4">
                            <div 
                                className="flex transition-transform duration-700 ease-out will-change-transform" 
                                style={{ transform: `translateX(-${serviceCarousel.currentIndex * (100 / serviceCarousel.itemsPerView)}%)` }}
                            >
                                {featuredServices.map(service => (
                                    <div 
                                        key={service.id} 
                                        className="flex-shrink-0 px-4"
                                        style={{ flexBasis: `${100 / serviceCarousel.itemsPerView}%` }}
                                    >
                                        <ServiceCard service={service} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                     <div className="mt-12 text-center">
                        <Link to="/services" className="inline-block px-10 py-3 border-2 border-brand-dark text-brand-dark font-bold rounded-full hover:bg-brand-dark hover:text-white transition-all duration-300">
                            Xem Tất Cả Dịch Vụ
                        </Link>
                    </div>
                </div>
            </section>

            {/* Combo Services */}
            {comboServices.length > 0 && (
            <section className="py-16 relative bg-gradient-to-b from-brand-secondary to-white">
                <div className="container mx-auto px-4 relative z-10">
                     <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
                        <SectionHeader title="Các Gói Dịch Vụ" subtitle="Trải nghiệm sự kết hợp hoàn hảo giữa các liệu trình." badgeText="Packages" />
                        
                        {comboServices.length > comboCarousel.itemsPerView && (
                             <div className="flex gap-3 mb-8">
                                <button onClick={comboCarousel.prev} disabled={comboCarousel.currentIndex === 0} className="w-12 h-12 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center hover:border-brand-primary hover:bg-brand-primary hover:text-white text-gray-400 transition-all disabled:opacity-30"><ChevronLeftIcon className="w-6 h-6" /></button>
                                <button onClick={comboCarousel.next} disabled={comboCarousel.currentIndex >= comboCarousel.maxIndex} className="w-12 h-12 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center hover:border-brand-primary hover:bg-brand-primary hover:text-white text-gray-400 transition-all disabled:opacity-30"><ChevronRightIcon className="w-6 h-6" /></button>
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
                                    className="flex-shrink-0 px-4"
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
                <section className="py-20 bg-white relative overflow-hidden">
                     {/* Vibrant Background Gradient - Richer */}
                    <div className="absolute inset-0 bg-gradient-to-r from-rose-50 via-orange-50 to-purple-50 opacity-80"></div>
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('/img/general/noise.png')] opacity-10 mix-blend-soft-light"></div>

                    <div className="container mx-auto px-4 relative z-10">
                        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-4">
                            <div>
                                <span className="inline-block py-1.5 px-5 rounded-full bg-white border border-brand-accent text-brand-accent font-bold text-xs uppercase tracking-wider mb-4 shadow-sm">Limited Time Offers</span>
                                <h2 className="text-4xl md:text-5xl font-serif font-extrabold text-brand-dark mb-4">Combo Ưu Đãi Tháng Này</h2>
                                <p className="text-gray-700 text-lg font-medium">Cơ hội trải nghiệm dịch vụ 5 sao với mức giá hấp dẫn chưa từng có.</p>
                            </div>
                            
                            {comboDeals.length > dealCarousel.itemsPerView && (
                                 <div className="flex gap-3">
                                    <button onClick={dealCarousel.prev} disabled={dealCarousel.currentIndex === 0} className="w-12 h-12 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center hover:border-brand-accent hover:bg-brand-accent hover:text-white text-gray-400 transition-all disabled:opacity-30"><ChevronLeftIcon className="w-6 h-6" /></button>
                                    <button onClick={dealCarousel.next} disabled={dealCarousel.currentIndex >= dealCarousel.maxIndex} className="w-12 h-12 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center hover:border-brand-accent hover:bg-brand-accent hover:text-white text-gray-400 transition-all disabled:opacity-30"><ChevronRightIcon className="w-6 h-6" /></button>
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
                                        className="flex-shrink-0 px-4"
                                        style={{ flexBasis: `${100 / dealCarousel.itemsPerView}%` }}
                                    >
                                        <div className="transform hover:-translate-y-3 transition-transform duration-500 h-full">
                                            <ServiceCard service={service} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                         <div className="text-center mt-12">
                            <Link to="/promotions" className="inline-flex items-center gap-2 text-brand-accent font-bold text-lg hover:text-brand-dark transition-colors border-b-2 border-brand-accent pb-1 hover:border-brand-dark">Xem tất cả ưu đãi <ArrowRightIcon className="w-5 h-5"/></Link>
                        </div>
                    </div>
                </section>
            )}

            {/* Promotions Carousel */}
            {featuredPromotions.length > 0 && (
                <section className="py-16 bg-brand-secondary/30">
                    <div className="container mx-auto px-4">
                        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
                            <SectionHeader title="Chương Trình Khuyến Mãi" subtitle="Quà tặng đặc biệt dành tri ân khách hàng thân thiết." badgeText="Hot Deals" />
                            
                            {featuredPromotions.length > promoCarousel.itemsPerView && (
                                <div className="flex gap-3 mb-8">
                                    <button onClick={promoCarousel.prev} disabled={promoCarousel.currentIndex === 0} className="w-12 h-12 rounded-full border-2 border-gray-200 flex items-center justify-center hover:border-brand-primary hover:bg-brand-primary hover:text-white text-gray-400 transition-all disabled:opacity-30"><ChevronLeftIcon className="w-6 h-6" /></button>
                                    <button onClick={promoCarousel.next} disabled={promoCarousel.currentIndex >= promoCarousel.maxIndex} className="w-12 h-12 rounded-full border-2 border-gray-200 flex items-center justify-center hover:border-brand-primary hover:bg-brand-primary hover:text-white text-gray-400 transition-all disabled:opacity-30"><ChevronRightIcon className="w-6 h-6" /></button>
                                </div>
                            )}
                        </div>

                        {isLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                                            className="flex-shrink-0 px-4"
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
            
            {/* Testimonials - Clear & Bright Parallax */}
             <section className="py-24 relative bg-fixed bg-center bg-cover" style={{ backgroundImage: "url('/img/general/testimonials-bg.jpg')" }}>
                {/* White Overlay for Clarity */}
                <div className="absolute inset-0 bg-white/90 backdrop-blur-[2px]"></div>
                
                <div className="container mx-auto px-4 relative z-10">
                    <div className="text-center mb-20">
                        <span className="text-brand-primary font-bold tracking-widest uppercase text-sm border border-brand-primary/20 px-4 py-2 rounded-full bg-white/50">Testimonials</span>
                        <h2 className="text-5xl md:text-6xl font-serif font-extrabold text-brand-dark mt-6 mb-6">Lời Nói Từ Trái Tim</h2>
                         <p className="text-gray-700 text-xl font-medium max-w-2xl mx-auto leading-relaxed">Niềm tin và sự hài lòng của khách hàng chính là thước đo thành công lớn nhất của chúng tôi.</p>
                    </div>

                    {isLoadingReviews ? (
                        <div className="text-center text-gray-500">Đang tải đánh giá...</div>
                    ) : recentReviews.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
                            {recentReviews.slice(0, 3).map((review) => (
                                <div key={review.id} className="bg-white p-10 rounded-[2rem] border border-gray-100 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 relative">
                                     <div className="absolute -top-6 right-8 w-12 h-12 bg-brand-primary text-white rounded-full flex items-center justify-center shadow-lg">
                                        <span className="text-3xl font-serif">"</span>
                                     </div>
                                     
                                     <div className="flex items-center gap-4 mb-6">
                                        <img src={review.userImageUrl} alt={review.userName} className="w-16 h-16 rounded-full object-cover border-2 border-brand-secondary" />
                                        <div>
                                             <h4 className="font-bold text-xl text-brand-text">{review.userName}</h4>
                                             <div className="flex text-yellow-400 mt-1">
                                                {[...Array(5)].map((_, i) => <StarIcon key={i} className={`w-5 h-5 ${i < review.rating ? 'fill-current' : 'text-gray-300'}`} />)}
                                            </div>
                                        </div>
                                     </div>
                                    <p className="text-gray-700 text-lg italic leading-relaxed font-medium">"{review.comment}"</p>
                                    <div className="mt-6 pt-6 border-t border-gray-100">
                                        <p className="text-xs text-brand-primary font-bold uppercase tracking-wider">{review.serviceName}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                         <div className="text-center text-gray-500">Chưa có đánh giá nào.</div>
                    )}
                </div>
            </section>

             {/* CTA Section - High Energy */}
            <section className="py-20 bg-white relative overflow-hidden">
                <div className="container mx-auto px-4">
                    <div className="relative rounded-[3rem] overflow-hidden shadow-2xl">
                         <div className="absolute inset-0 bg-gradient-to-r from-cyan-800 to-blue-800"></div>
                         
                         {/* Glowing Orbs */}
                         <div className="absolute top-0 left-0 w-full h-full bg-[url('/img/general/spa-pattern.png')] opacity-10 mix-blend-overlay"></div>
                         <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-[80px] animate-pulse"></div>
                         <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-[80px] animate-pulse animation-delay-500"></div>

                         <div className="relative z-10 px-8 py-20 md:py-32 text-center">
                            <h2 className="text-4xl md:text-6xl font-serif font-extrabold text-white mb-8 drop-shadow-md">
                                Sẵn Sàng Cho Một Trải Nghiệm Mới?
                            </h2>
                            <p className="text-xl text-cyan-100 mb-12 max-w-3xl mx-auto font-medium leading-relaxed">
                                Đừng để sự mệt mỏi cản bước bạn. Hãy dành thời gian chăm sóc bản thân ngay hôm nay cùng các chuyên gia hàng đầu của Anh Thơ Spa.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-6 justify-center">
                                <Link
                                    to="/booking"
                                    className="bg-white text-cyan-900 font-bold py-4 px-12 rounded-full shadow-xl hover:shadow-white/30 hover:bg-cyan-50 transition-all hover:-translate-y-1 text-lg"
                                >
                                    Đặt Lịch Ngay
                                </Link>
                                <Link
                                    to="/contact"
                                    className="bg-transparent border-2 border-white/40 backdrop-blur-sm text-white font-bold py-4 px-12 rounded-full hover:bg-white/10 hover:border-white transition-all hover:-translate-y-1 text-lg"
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
}