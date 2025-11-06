




import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ServiceCard from '../components/ServiceCard';
// FIX: Added missing Appointment type import.
import type { Review, Service, User, Promotion, Appointment } from '../../types';
import { StarIcon, HeartIcon, ClockIcon } from '../../shared/icons';
import * as apiService from '../services/apiService';

interface ServiceDetailPageProps {
    allServices: Service[];
    currentUser: User | null;
    allPromotions: Promotion[];
    setAllReviews: React.Dispatch<React.SetStateAction<Review[]>>;
    setAllAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
}

const ServiceDetailPage: React.FC<ServiceDetailPageProps> = ({ allServices, currentUser, allPromotions, setAllReviews, setAllAppointments }) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    
    const [service, setService] = useState<Service | null>(null);
    const [serviceReviews, setServiceReviews] = useState<Review[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isFavorite, setIsFavorite] = useState(false);

    // New states for review form
    const [userCanReview, setUserCanReview] = useState(false);
    const [isReviewFormVisible, setIsReviewFormVisible] = useState(false);
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [newRating, setNewRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [newComment, setNewComment] = useState('');
    const [reviewMessage, setReviewMessage] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            if (!id) {
                setError("Service ID is missing.");
                setIsLoading(false);
                return;
            }
            try {
                setIsLoading(true);
                setError(null);
                const fetchedService = await apiService.getServiceById(id);
                setService(fetchedService);

                const fetchedReviews = await apiService.getReviews({ serviceId: id });
                setServiceReviews(fetchedReviews.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
                
                const fetchedUsers = await apiService.getUsers();
                setAllUsers(fetchedUsers);

            } catch (err: any) {
                console.error("Failed to fetch service detail data:", err);
                setService(null);
                setServiceReviews([]);
                setError(err.message || "Không thể tải chi tiết dịch vụ.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [id]);

    useEffect(() => {
        const checkReviewEligibility = async () => {
            if (currentUser && service) {
                try {
                    const userAppointments = await apiService.getUserAppointments(currentUser.id);
                    const completedAppointmentsForThisService = userAppointments.filter(
                        app => app.serviceId === service.id && app.status === 'completed'
                    );

                    if (completedAppointmentsForThisService.length > 0) {
                        const userReviewsForThisService = serviceReviews.filter(
                            review => review.userId === currentUser.id && review.serviceId === service.id
                        );
                        
                        if (completedAppointmentsForThisService.length > userReviewsForThisService.length) {
                            setUserCanReview(true);
                            setReviewMessage('');
                        } else {
                            setUserCanReview(false);
                            setReviewMessage('Bạn đã đánh giá tất cả các lần sử dụng dịch vụ này.');
                        }
                    } else {
                        setUserCanReview(false);
                        setReviewMessage('Bạn cần hoàn thành dịch vụ này để có thể đánh giá.');
                    }
                } catch (error) {
                    console.error("Failed to check review eligibility:", error);
                    setUserCanReview(false);
                }
            } else {
                setUserCanReview(false);
            }
        };

        if (service) {
            checkReviewEligibility();
        }

    }, [currentUser, service, serviceReviews]);

    const expiringSoonPromo = useMemo(() => {
        if (!service || !allPromotions) return null;

        const now = new Date();
        const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const applicablePromos = allPromotions.filter(promo => {
            const appliesToService = !promo.applicableServiceIds || promo.applicableServiceIds.length === 0 || promo.applicableServiceIds.includes(service.id);
            if (!appliesToService) return false;

            const expiryDate = new Date(promo.expiryDate);
            return expiryDate > now && expiryDate <= sevenDaysFromNow;
        });
        
        return applicablePromos.length > 0 ? applicablePromos[0] : null;
    }, [service, allPromotions]);


    const suitableTherapists = useMemo(() => {
        if (!service || allUsers.length === 0) return [];
        const technicians = allUsers.filter(u => u.role === 'Staff' && u.staffProfile?.staffRole === 'Technician' && u.staffProfile?.specialty?.some(s => service.category.includes(s)));
        return technicians.slice(0, 3).map(t => t.name);
    }, [service, allUsers]);
    
    const relatedServices = useMemo(() => {
        if (!service || allServices.length === 0) return [];
        return allServices.filter(
            s => s.category === service.category && s.id !== service.id && s.isActive
        ).slice(0, 3);
    }, [service, allServices]);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    const toggleFavorite = () => {
        setIsFavorite(!isFavorite);
        alert(`Dịch vụ đã được ${isFavorite ? 'gỡ khỏi' : 'thêm vào'} yêu thích (chức năng mock).`);
    }

    const handleConsultationClick = () => {
        window.dispatchEvent(new CustomEvent('open-chatbot'));
    };

    const handleReviewSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newRating === 0 || !currentUser || !service) {
            alert('Vui lòng chọn số sao đánh giá.');
            return;
        }
        setIsSubmittingReview(true);
        try {
            const userAppointments = await apiService.getUserAppointments(currentUser.id);
            const reviewedAppointmentIds = new Set(
                (await apiService.getReviews({ userId: currentUser.id }))
                .map(r => r.appointmentId)
                .filter(Boolean) as string[]
            );
            
            const appointmentToReview = userAppointments.find(
                app => app.serviceId === service.id &&
                       app.status === 'completed' &&
                       !reviewedAppointmentIds.has(app.id)
            );

            const reviewPayload: Partial<Review> = {
                userId: currentUser.id,
                serviceId: service.id,
                appointmentId: appointmentToReview?.id,
                userName: currentUser.name,
                userImageUrl: currentUser.profilePictureUrl,
                rating: newRating,
                comment: newComment,
                serviceName: service.name,
            };

            const createdReview = await apiService.createReview(reviewPayload);

            // Update local and global state
            setServiceReviews(prev => [createdReview, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
            setAllReviews(prev => [createdReview, ...prev]);

            if (appointmentToReview) {
                setAllAppointments(prev => prev.map(app => 
                    app.id === appointmentToReview.id ? { ...app, reviewRating: createdReview.rating } : app
                ));
            }

            setIsReviewFormVisible(false);
            setNewRating(0);
            setNewComment('');
            
        } catch (error) {
            console.error("Failed to submit review:", error);
            alert("Gửi đánh giá thất bại. Vui lòng thử lại.");
        } finally {
            setIsSubmittingReview(false);
        }
    };


    if (isLoading) {
        return <div className="text-center py-20 text-brand-dark">Đang tải dịch vụ...</div>;
    }

    if (error) {
        return <div className="text-center py-20 text-red-500">Lỗi: {error}</div>;
    }

    if (!service) {
        return <div className="text-center py-20 text-brand-text">Dịch vụ không tồn tại.</div>;
    }

    const reviewForm = (
        <div className="mt-12 max-w-4xl mx-auto animate-fadeInUp">
            <h3 className="text-2xl font-serif font-bold text-brand-dark mb-4">Viết đánh giá của bạn</h3>
            <form onSubmit={handleReviewSubmit} className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-center items-center mb-4">
                    <span className="mr-4 font-semibold text-gray-700">Đánh giá của bạn:</span>
                    <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <StarIcon
                                key={star}
                                className={`w-8 h-8 cursor-pointer transition-colors ${star <= (hoverRating || newRating) ? 'text-yellow-400' : 'text-gray-300'}`}
                                onClick={() => setNewRating(star)}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                            />
                        ))}
                    </div>
                </div>
                <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Chia sẻ cảm nhận chi tiết của bạn về dịch vụ..."
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-brand-primary focus:border-brand-primary mb-4"
                    required
                ></textarea>
                <div className="text-right">
                    <button
                        type="submit"
                        disabled={isSubmittingReview || newRating === 0}
                        className="bg-brand-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}
                    </button>
                </div>
            </form>
        </div>
    );
    
    const reviewCtaSection = (
        <div className="mt-12 max-w-4xl mx-auto text-center bg-white p-6 rounded-lg shadow-md">
            {currentUser ? (
                userCanReview ? (
                    <>
                        <h3 className="text-xl font-bold text-brand-dark mb-2">Chia sẻ trải nghiệm của bạn</h3>
                        <p className="text-gray-600 mb-4">Bạn đã sử dụng dịch vụ này. Hãy để lại đánh giá để giúp chúng tôi và những khách hàng khác nhé!</p>
                        <button 
                            onClick={() => setIsReviewFormVisible(true)}
                            className="bg-brand-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-brand-dark transition-colors"
                        >
                            Viết đánh giá
                        </button>
                    </>
                ) : (
                    <p className="text-gray-600">{reviewMessage}</p>
                )
            ) : (
                <p className="text-gray-600">
                    <Link to="/login" className="font-bold text-brand-primary hover:underline">Đăng nhập</Link> để viết đánh giá cho dịch vụ này.
                </p>
            )}
        </div>
    );

    return (
        <div className="container mx-auto px-4 py-12">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center text-brand-dark font-semibold hover:text-brand-primary mb-6 transition-colors group"
                aria-label="Quay lại trang trước"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 transition-transform group-hover:-translate-x-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Quay lại danh sách
            </button>

            <div className="bg-white shadow-xl rounded-lg overflow-hidden">
                <div className="md:flex">
                    <div className="md:w-1/2">
                        <img className="h-full w-full object-cover" src={service.imageUrl.replace('/400/300', '/800/600')} alt={service.name} />
                    </div>
                    <div className="p-8 md:w-1/2 flex flex-col">
                        <div>
                            <p className="text-sm text-brand-primary font-semibold">{service.category}</p>
                            <div className="flex justify-between items-start">
                                <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-brand-dark mt-2 mb-4">{service.name}</h1>
                                <button onClick={toggleFavorite} className={`p-2 rounded-full transition-colors duration-300 ${isFavorite ? 'text-red-500 bg-red-100' : 'text-gray-400 hover:bg-gray-100'}`} aria-label="Thêm vào yêu thích">
                                    <HeartIcon className="w-7 h-7" />
                                </button>
                            </div>
                            <div className="flex items-center mb-4">
                                <div className="flex items-center text-yellow-500">
                                    {[...Array(Math.round(service.rating))].map((_, i) => <StarIcon key={i} className="w-5 h-5"/>)}
                                </div>
                                <span className="ml-2 text-brand-text text-sm">({service.reviewCount} đánh giá)</span>
                            </div>
                            <p className="text-brand-text text-base leading-relaxed mb-6">{service.longDescription}</p>

                            {expiringSoonPromo && (
                                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 rounded-md mb-6 animate-pulse">
                                    <div className="flex">
                                        <div className="py-1">
                                            <ClockIcon className="h-6 w-6 text-yellow-500 mr-4" />
                                        </div>
                                        <div>
                                            <p className="font-bold">Ưu đãi sắp hết hạn!</p>
                                            <p className="text-sm">
                                                {expiringSoonPromo.title}. Còn hạn đến ngày {new Date(expiringSoonPromo.expiryDate).toLocaleDateString('vi-VN')}.
                                                <Link to={`/booking?serviceId=${service.id}&promoCode=${expiringSoonPromo.code}`} className="font-bold underline ml-2 hover:text-yellow-900">
                                                    Dùng ngay!
                                                </Link>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            <div className="grid grid-cols-2 gap-4 text-brand-text mb-6 border-t border-b border-gray-200 py-4">
                                <div className="flex flex-col">
                                    <span className="font-semibold text-gray-500 text-sm">Giá:</span>
                                    <span className="text-brand-primary font-bold text-lg">{formatPrice(service.price)}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-semibold text-gray-500 text-sm">Thời gian:</span>
                                    <span className="font-bold text-lg">{service.duration} phút</span>
                                </div>
                            </div>

                             <div className="mb-6">
                                <h3 className="font-semibold text-brand-dark mb-3">Chuyên viên phù hợp:</h3>
                                <div className="flex flex-wrap gap-3">
                                    {suitableTherapists.length > 0 ? (
                                        suitableTherapists.map(therapist => (
                                            <span key={therapist} className="bg-brand-secondary text-brand-dark text-sm font-medium px-3 py-1 rounded-full">{therapist}</span>
                                        ))
                                    ) : (
                                        <span className="text-sm text-gray-500 italic">Chưa có chuyên viên phù hợp.</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <div className="mt-auto flex flex-col sm:flex-row gap-4">
                            <Link 
                                to={`/booking?serviceId=${service.id}`} 
                                className="flex-1 text-center block bg-brand-primary text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-brand-dark transition-colors duration-300"
                            >
                                Đặt Lịch Ngay
                            </Link>
                             <button
                                onClick={handleConsultationClick}
                                className="flex-1 text-center block bg-brand-secondary text-brand-dark font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-brand-primary hover:text-white transition-colors duration-300 border border-brand-primary/50"
                            >
                                Tư Vấn Thêm
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Customer Reviews Section */}
            <div className="mt-16">
                <h2 className="text-3xl font-serif font-bold text-brand-dark text-center mb-10">Đánh giá từ khách hàng</h2>
                {serviceReviews.length > 0 ? (
                    <div className="max-w-4xl mx-auto space-y-8">
                        {serviceReviews.map((review: Review) => (
                            <div key={review.id} className="bg-white p-6 rounded-lg shadow-md flex items-start space-x-4">
                                <img src={review.userImageUrl} alt={review.userName} className="w-14 h-14 rounded-full flex-shrink-0" />
                                <div>
                                    <div className="flex items-center mb-1">
                                        <h4 className="font-bold text-brand-dark mr-2">{review.userName}</h4>
                                        <div className="flex text-yellow-400">
                                            {[...Array(review.rating)].map((_, i) => <StarIcon key={i} className="w-4 h-4"/>)}
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-500 mb-2">{new Date(review.date).toLocaleDateString('vi-VN')}</p>
                                    <p className="text-brand-text italic">"{review.comment}"</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-brand-text">Chưa có đánh giá nào cho dịch vụ này.</p>
                )}
            </div>
            
            {isReviewFormVisible ? reviewForm : reviewCtaSection}

            {/* Related Services Section */}
            {relatedServices.length > 0 && (
                <div className="mt-16">
                    <h2 className="text-3xl font-serif font-bold text-brand-dark text-center mb-10">Dịch Vụ Liên Quan</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {relatedServices.map(relatedService => (
                            <ServiceCard key={relatedService.id} service={relatedService} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ServiceDetailPage;