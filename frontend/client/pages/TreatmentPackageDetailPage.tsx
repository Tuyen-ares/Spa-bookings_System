import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as apiService from '../services/apiService';
import type { TreatmentCourse, User } from '../../types';
import { ClockIcon, CheckCircleIcon, StarIcon } from '../../shared/icons';

interface TreatmentPackageDetailPageProps {
    currentUser: User | null;
}

const TreatmentPackageDetailPage: React.FC<TreatmentPackageDetailPageProps> = ({ currentUser }) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [packageData, setPackageData] = useState<TreatmentCourse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isBooking, setIsBooking] = useState(false);

    useEffect(() => {
        if (id) {
            loadPackageDetail();
        }
    }, [id]);

    const loadPackageDetail = async () => {
        setIsLoading(true);
        try {
            const data = await apiService.getTreatmentCourseById(id!);
            setPackageData(data);
        } catch (error) {
            console.error('Error loading package:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleBookNow = async () => {
        if (!currentUser) {
            navigate('/login');
            return;
        }

        if (!window.confirm('Bạn có chắc muốn đăng ký gói liệu trình này?')) {
            return;
        }

        setIsBooking(true);
        try {
            // Create enrollment - this will create a new treatment course for the user
            const enrollmentData = {
                packageId: id,
                clientId: currentUser.id,
                name: packageData?.name || 'Gói liệu trình',
                description: packageData?.description,
                price: packageData?.price || 0,
                totalSessions: packageData?.totalSessions || 1,
                sessionsPerWeek: 2, // Default value
                services: packageData?.services?.map(s => ({
                    serviceId: s.serviceId,
                    serviceName: s.serviceName,
                    order: s.order
                })) || [],
                consultantId: packageData?.consultantId || null,
                consultantName: packageData?.consultantName || '',
                startDate: new Date().toISOString().split('T')[0]
            };

            const response: any = await apiService.createTreatmentCourse(enrollmentData);
            alert('Đăng ký gói liệu trình thành công! Bạn có thể đặt lịch các buổi điều trị.');
            // Emit event to refresh treatment courses in App.tsx
            window.dispatchEvent(new CustomEvent('refresh-treatment-courses'));
            // Navigate to the newly created treatment course detail page
            const courseId = response.course?.id || response.id;
            navigate(`/treatment-course/${courseId}`);
        } catch (error: any) {
            console.error('Error booking package:', error);
            alert(error?.message || 'Không thể đăng ký gói liệu trình. Vui lòng thử lại.');
        } finally {
            setIsBooking(false);
        }
    };

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-12">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
                        <p className="text-gray-600">Đang tải thông tin gói...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!packageData) {
        return (
            <div className="container mx-auto px-4 py-12">
                <div className="text-center py-16 bg-white rounded-lg shadow-md">
                    <p className="text-lg text-red-500 mb-4">Không tìm thấy gói liệu trình</p>
                    <button
                        onClick={() => navigate('/treatment-packages')}
                        className="text-brand-primary hover:underline"
                    >
                        ← Quay lại danh sách
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-brand-secondary to-white py-12">
            <div className="container mx-auto px-4">
                <button
                    onClick={() => navigate('/treatment-packages')}
                    className="mb-6 text-brand-primary hover:underline flex items-center gap-2"
                >
                    ← Quay lại danh sách gói liệu trình
                </button>

                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    {/* Hero Section */}
                    <div className="relative h-64 bg-gradient-to-br from-brand-primary to-brand-secondary">
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center text-white">
                                <h1 className="text-5xl font-bold mb-4">{packageData.name}</h1>
                                <div className="text-2xl">
                                    {packageData.totalSessions} buổi điều trị
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-8">
                        {/* Description */}
                        {packageData.description && (
                            <div className="mb-8">
                                <p className="text-lg text-gray-700 leading-relaxed">
                                    {packageData.description}
                                </p>
                            </div>
                        )}

                        {/* Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-brand-secondary p-6 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <ClockIcon className="w-5 h-5 text-brand-primary" />
                                    <h3 className="font-semibold text-brand-text">Tổng số buổi</h3>
                                </div>
                                <p className="text-2xl font-bold text-brand-primary">
                                    {packageData.totalSessions} buổi
                                </p>
                            </div>

                            <div className="bg-brand-secondary p-6 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <StarIcon className="w-5 h-5 text-brand-primary" />
                                    <h3 className="font-semibold text-brand-text">Giá gói</h3>
                                </div>
                                <p className="text-2xl font-bold text-brand-primary">
                                    {(packageData.price || 0).toLocaleString('vi-VN')} đ
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                    ~{Math.round((packageData.price || 0) / packageData.totalSessions).toLocaleString('vi-VN')} đ/buổi
                                </p>
                            </div>

                            <div className="bg-brand-secondary p-6 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <StarIcon className="w-5 h-5 text-brand-primary" />
                                    <h3 className="font-semibold text-brand-text">Trạng thái</h3>
                                </div>
                                <p className="text-lg font-semibold text-green-600">
                                    Đang mở đăng ký
                                </p>
                            </div>
                        </div>

                        {/* Services List */}
                        {packageData.services && packageData.services.length > 0 && (
                            <div className="mb-8">
                                <h3 className="text-2xl font-bold text-brand-text mb-4">Dịch vụ bao gồm</h3>
                                <div className="bg-gray-50 rounded-lg p-6">
                                    <ul className="space-y-4">
                                        {packageData.services
                                            .sort((a, b) => (a.order || 0) - (b.order || 0))
                                            .map((service, index) => (
                                                <li key={service.serviceId} className="flex items-start gap-4 pb-4 border-b border-gray-200 last:border-0">
                                                    <span className="flex-shrink-0 w-8 h-8 bg-brand-primary text-white rounded-full flex items-center justify-center font-bold">
                                                        {index + 1}
                                                    </span>
                                                    <div className="flex-1">
                                                        <div className="font-semibold text-gray-900 text-lg">
                                                            {service.serviceName}
                                                        </div>
                                                        <div className="text-gray-600 mt-1 flex items-center gap-4">
                                                            <span className="flex items-center gap-1">
                                                                <ClockIcon className="w-4 h-4" />
                                                                {service.duration} phút
                                                            </span>
                                                            <span className="text-brand-primary font-medium">
                                                                {service.price?.toLocaleString('vi-VN')} đ
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <CheckCircleIcon className="w-6 h-6 text-green-500 flex-shrink-0" />
                                                </li>
                                            ))}
                                    </ul>
                                </div>
                            </div>
                        )}

                        {/* Consultant Info */}
                        {packageData.consultantName && (
                            <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
                                <h3 className="font-semibold text-brand-text mb-2">Chuyên viên tư vấn</h3>
                                <p className="text-gray-700 text-lg">{packageData.consultantName}</p>
                            </div>
                        )}

                        {/* Booking Section */}
                        <div className="bg-gradient-to-r from-brand-primary to-brand-secondary p-8 rounded-lg text-white">
                            <h3 className="text-2xl font-bold mb-4">Sẵn sàng bắt đầu hành trình làm đẹp?</h3>
                            <p className="mb-6 text-lg">
                                Đăng ký ngay để nhận tư vấn chi tiết và đặt lịch điều trị với chuyên gia của chúng tôi.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <button
                                    onClick={handleBookNow}
                                    disabled={isBooking}
                                    className="flex-1 bg-white text-brand-primary font-bold py-4 px-8 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                                >
                                    {isBooking ? 'Đang xử lý...' : 'Đăng ký ngay'}
                                </button>
                                <button
                                    onClick={() => navigate('/treatment-packages')}
                                    className="flex-1 bg-transparent border-2 border-white text-white font-bold py-4 px-8 rounded-lg hover:bg-white hover:text-brand-primary transition-colors text-lg"
                                >
                                    Xem gói khác
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TreatmentPackageDetailPage;
