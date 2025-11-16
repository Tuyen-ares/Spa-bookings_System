import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as apiService from '../services/apiService';
import type { TreatmentCourse, User } from '../../types';
import { ClockIcon, CheckCircleIcon } from '../../shared/icons';

interface TreatmentPackagesPageProps {
    currentUser: User | null;
}

const TreatmentPackagesPage: React.FC<TreatmentPackagesPageProps> = ({ currentUser }) => {
    const navigate = useNavigate();
    const [packages, setPackages] = useState<TreatmentCourse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');

    useEffect(() => {
        loadPackages();
    }, []);

    const loadPackages = async () => {
        setIsLoading(true);
        try {
            // Get all treatment courses (templates)
            const data = await apiService.getTreatmentCourses();
            // Filter only active templates (no clientId)
            const templates = data.filter((course: TreatmentCourse) => 
                course.status === 'active' && !course.clientId
            );
            setPackages(templates);
        } catch (error) {
            console.error('Error loading packages:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredPackages = packages.filter(pkg => {
        if (filter === 'all') return true;
        const price = pkg.price || 0;
        if (filter === 'low') return price < 2000000;
        if (filter === 'medium') return price >= 2000000 && price < 5000000;
        if (filter === 'high') return price >= 5000000;
        return true;
    });

    const handleBookPackage = (packageId: string) => {
        if (!currentUser) {
            navigate('/login');
            return;
        }
        navigate(`/treatment-packages/${packageId}`);
    };

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-12">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
                        <p className="text-gray-600">Đang tải gói liệu trình...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-brand-secondary to-white py-12">
            <div className="container mx-auto px-4">
                {/* Hero Section */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-serif font-bold text-brand-dark mb-4">
                        Gói Liệu Trình Chăm Sóc
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Lựa chọn gói liệu trình phù hợp với nhu cầu của bạn. Mỗi gói được thiết kế bởi chuyên gia để mang lại hiệu quả tối ưu.
                    </p>
                </div>

                {/* Filter */}
                <div className="flex justify-center gap-4 mb-8 flex-wrap">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-6 py-2 rounded-full font-medium transition-all ${
                            filter === 'all'
                                ? 'bg-brand-primary text-white shadow-md'
                                : 'bg-white text-gray-700 hover:bg-brand-secondary'
                        }`}
                    >
                        Tất cả
                    </button>
                    <button
                        onClick={() => setFilter('low')}
                        className={`px-6 py-2 rounded-full font-medium transition-all ${
                            filter === 'low'
                                ? 'bg-brand-primary text-white shadow-md'
                                : 'bg-white text-gray-700 hover:bg-brand-secondary'
                        }`}
                    >
                        Dưới 2 triệu
                    </button>
                    <button
                        onClick={() => setFilter('medium')}
                        className={`px-6 py-2 rounded-full font-medium transition-all ${
                            filter === 'medium'
                                ? 'bg-brand-primary text-white shadow-md'
                                : 'bg-white text-gray-700 hover:bg-brand-secondary'
                        }`}
                    >
                        2-5 triệu
                    </button>
                    <button
                        onClick={() => setFilter('high')}
                        className={`px-6 py-2 rounded-full font-medium transition-all ${
                            filter === 'high'
                                ? 'bg-brand-primary text-white shadow-md'
                                : 'bg-white text-gray-700 hover:bg-brand-secondary'
                        }`}
                    >
                        Trên 5 triệu
                    </button>
                </div>

                {/* Packages Grid */}
                {filteredPackages.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-lg shadow-md">
                        <p className="text-gray-500 text-lg">Chưa có gói liệu trình nào</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredPackages.map((pkg) => (
                            <div
                                key={pkg.id}
                                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                            >
                                {/* Package Image */}
                                <div className="relative h-48 bg-gradient-to-br from-brand-primary to-brand-secondary">
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="text-center text-white">
                                            <div className="text-5xl font-bold mb-2">{pkg.totalSessions}</div>
                                            <div className="text-sm uppercase tracking-wide">Buổi điều trị</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Package Content */}
                                <div className="p-6">
                                    <h3 className="text-2xl font-bold text-brand-dark mb-3">
                                        {pkg.name}
                                    </h3>

                                    {pkg.description && (
                                        <p className="text-gray-600 mb-4 line-clamp-2">
                                            {pkg.description}
                                        </p>
                                    )}

                                    {/* Services List */}
                                    <div className="mb-4">
                                        <h4 className="text-sm font-semibold text-gray-700 mb-2 uppercase">Dịch vụ bao gồm:</h4>
                                        <ul className="space-y-2">
                                            {pkg.services && pkg.services.slice(0, 3).map((service) => (
                                                <li key={service.serviceId} className="flex items-start gap-2 text-sm text-gray-600">
                                                    <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                                    <span>{service.serviceName}</span>
                                                </li>
                                            ))}
                                            {pkg.services && pkg.services.length > 3 && (
                                                <li className="text-sm text-brand-primary font-medium">
                                                    + {pkg.services.length - 3} dịch vụ khác
                                                </li>
                                            )}
                                        </ul>
                                    </div>

                                    {/* Consultant */}
                                    {pkg.consultantName && (
                                        <div className="mb-4 text-sm text-gray-600">
                                            <span className="font-medium">Chuyên viên tư vấn:</span> {pkg.consultantName}
                                        </div>
                                    )}

                                    {/* Price */}
                                    <div className="border-t border-gray-200 pt-4 mb-4">
                                        <div className="flex items-end justify-between">
                                            <div>
                                                <div className="text-sm text-gray-500 mb-1">Giá gói</div>
                                                <div className="text-3xl font-bold text-brand-primary">
                                                    {(pkg.price || 0).toLocaleString('vi-VN')}đ
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm text-gray-500 mb-1">Trung bình/buổi</div>
                                                <div className="text-lg font-semibold text-gray-700">
                                                    {Math.round((pkg.price || 0) / pkg.totalSessions).toLocaleString('vi-VN')}đ
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* CTA Button */}
                                    <button
                                        onClick={() => handleBookPackage(pkg.id)}
                                        className="w-full bg-brand-primary text-white font-semibold py-3 px-6 rounded-lg hover:bg-brand-dark transition-colors duration-300"
                                    >
                                        Xem chi tiết & Đặt ngay
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TreatmentPackagesPage;
