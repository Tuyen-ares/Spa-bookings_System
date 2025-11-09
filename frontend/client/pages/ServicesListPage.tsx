
import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ServiceCard from '../components/ServiceCard';
import type { Service, ServiceCategory } from '../../types';
import { FilterIcon, StarIcon, SearchIcon } from '../../shared/icons';
import * as apiService from '../services/apiService';
import { ServiceCardSkeleton } from '../components/SkeletonLoader';

const SERVICES_PER_PAGE = 9;

const PRICE_RANGES = [
    { key: '0-499999', label: 'Dưới 500.000 đ', min: 0, max: 499999 },
    { key: '500000-999999', label: '500.000đ - dưới 1.000.000đ', min: 500000, max: 999999 },
    { key: '1000000-1499999', label: '1.000.000đ - dưới 1.500.000đ', min: 1000000, max: 1499999 },
    { key: '1500000-1999999', label: '1.500.000đ - dưới 2.000.000đ', min: 1500000, max: 1999999 },
    { key: '2000000-2499999', label: '2.000.000đ - dưới 2.500.000đ', min: 2000000, max: 2499999 },
    { key: '2500000-2999999', label: '2.500.000đ - dưới 3.000.000đ', min: 2500000, max: 2999999 },
    { key: '3000000-3499999', label: '3.000.000đ - dưới 3.500.000đ', min: 3000000, max: 3499999 },
    { key: '3500000-3999999', label: '3.500.000đ - dưới 4.000.000đ', min: 3500000, max: 3999999 },
    { key: '4000000-Infinity', label: 'Từ 4.000.000đ trở lên', min: 4000000, max: Infinity },
];


interface PaginationProps {
    totalServices: number;
    servicesPerPage: number;
    currentPage: number;
    onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ totalServices, servicesPerPage, currentPage, onPageChange }) => {
    const totalPages = Math.ceil(totalServices / servicesPerPage);
    if (totalPages <= 1) return null;

    const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

    return (
        <nav className="mt-12 flex justify-center items-center gap-2 sm:gap-3" aria-label="Pagination">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-semibold text-brand-dark bg-white rounded-lg shadow-sm border border-gray-200 transition-all duration-200 hover:shadow-md hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-sm"
            >
                Trước
            </button>
            {pageNumbers.map((number) => (
                <button
                    key={number}
                    onClick={() => onPageChange(number)}
                    className={`w-10 h-10 text-sm font-semibold rounded-lg shadow-sm border transition-all duration-200 hover:shadow-md hover:-translate-y-px ${
                        currentPage === number 
                        ? 'bg-brand-primary text-white border-brand-dark shadow-lg scale-105' 
                        : 'bg-white text-brand-dark border-gray-200 hover:bg-brand-secondary'
                    }`}
                >
                    {number}
                </button>
            ))}
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm font-semibold text-brand-dark bg-white rounded-lg shadow-sm border border-gray-200 transition-all duration-200 hover:shadow-md hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-sm"
            >
                Sau
            </button>
        </nav>
    );
};

interface ServicesListPageProps {
    allServices: Service[]; // Prop from App.tsx
}

export const ServicesListPage: React.FC<ServicesListPageProps> = ({ allServices }) => {
    const location = useLocation(); // Track route changes
    const [services, setServices] = useState<Service[]>([]); 
    const [categories, setCategories] = useState<ServiceCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);


    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setIsLoading(true);
                setError(null);
                
                // If allServices is provided and has data, use it
                // Otherwise, fetch directly from API
                if (allServices && allServices.length > 0) {
                    setServices(allServices.filter(s => s.isActive !== false));
                } else {
                    // Fetch services directly from API if allServices is empty or not provided
                    const fetchedServices = await apiService.getServices();
                    setServices(fetchedServices.filter(s => s.isActive !== false));
                }

                const categoryNames = await apiService.getServiceCategories();
                // API returns ServiceCategory objects, not strings
                setCategories(categoryNames);
            } catch (err: any) {
                console.error("Failed to fetch services or categories:", err);
                setError(err.message || "Không thể tải dịch vụ hoặc danh mục.");
                setServices([]);
                setCategories([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialData();
    }, [location.pathname]); // Re-fetch when navigating to this page

    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [minRating, setMinRating] = useState<number>(0);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    
    const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([]);


    const { minDuration, maxDuration } = useMemo(() => {
        if (services.length === 0) return { minDuration: 0, maxDuration: 180 };
        const durations = services.map(s => s.duration);
        return {
            minDuration: Math.min(...durations, 0),
            maxDuration: Math.max(...durations, 180)
        };
    }, [services]);
    
    const [durationRange, setDurationRange] = useState<[number, number]>([0, 240]);

    useEffect(() => {
        if (services.length > 0) {
            setDurationRange([minDuration, maxDuration]);
        }
    }, [services, minDuration, maxDuration]);
    
    const handleCategoryChange = (categoryId: number | null) => {
        // categoryId null means "Tất cả" (All)
        if (categoryId === null) {
            setSelectedCategories([]);
            return;
        }
        
        const categoryName = categories.find(c => c.id === categoryId)?.name || '';
        setSelectedCategories(prev => {
            const isSelected = prev.includes(categoryName);
            if (isSelected) {
                return prev.filter(c => c !== categoryName);
            } else {
                return [...prev, categoryName];
            }
        });
    };

    const handlePriceRangeChange = (key: string) => {
        setSelectedPriceRanges(prev => 
            prev.includes(key) ? prev.filter(r => r !== key) : [...prev, key]
        );
    };


    const filteredServices = useMemo(() => {
        const activePriceRanges = PRICE_RANGES.filter(r => selectedPriceRanges.includes(r.key));
        
        return services.filter(service => {
            const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(service.category);
            
            const price = service.discountPrice || service.price;
            const priceMatch = activePriceRanges.length === 0 || activePriceRanges.some(range => price >= range.min && price <= range.max);

            const durationMatch = service.duration <= durationRange[1];
            const searchMatch = service.name.toLowerCase().includes(searchTerm.toLowerCase());
            const ratingMatch = service.rating >= minRating;
            return categoryMatch && priceMatch && searchMatch && durationMatch && ratingMatch;
        });
    }, [services, selectedCategories, selectedPriceRanges, durationRange, searchTerm, minRating]);

    useEffect(() => {
        setCurrentPage(1);
    }, [selectedCategories, selectedPriceRanges, durationRange, searchTerm, minRating]);
    
    const indexOfLastService = currentPage * SERVICES_PER_PAGE;
    const indexOfFirstService = indexOfLastService - SERVICES_PER_PAGE;
    const currentServices = filteredServices.slice(indexOfFirstService, indexOfLastService);

    
    const FilterSidebar = () => (
        <aside className="space-y-8">
            <div>
                <h3 className="font-bold text-brand-text text-lg mb-3">Danh mục</h3>
                <div>
                    {/* "Tất cả" option */}
                    <label className="group flex items-center space-x-3 cursor-pointer py-1 px-2 rounded-md transition-colors hover:bg-brand-secondary">
                         <input
                            type="checkbox"
                            name="category"
                            value="all"
                            checked={selectedCategories.length === 0}
                            onChange={() => handleCategoryChange(null)}
                            className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary transition-colors group-hover:border-brand-primary"
                        />
                        <span className="text-base text-gray-700 transition-colors group-hover:text-brand-dark">Tất cả</span>
                    </label>
                    
                    {/* Category options */}
                    {categories.map(category => (
                        <label key={category.id} className="group flex items-center space-x-3 cursor-pointer py-1 px-2 rounded-md transition-colors hover:bg-brand-secondary">
                             <input
                                type="checkbox"
                                name="category"
                                value={category.id}
                                checked={selectedCategories.includes(category.name)}
                                onChange={() => handleCategoryChange(category.id)}
                                className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary transition-colors group-hover:border-brand-primary"
                            />
                            <span className="text-base text-gray-700 transition-colors group-hover:text-brand-dark">{category.name}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="font-bold text-brand-text text-lg mb-3">Khoảng giá</h3>
                <div>
                    {PRICE_RANGES.map(range => (
                        <label key={range.key} className="group flex items-center space-x-3 cursor-pointer py-1 px-2 rounded-md transition-colors hover:bg-brand-secondary">
                             <input
                                type="checkbox"
                                checked={selectedPriceRanges.includes(range.key)}
                                onChange={() => handlePriceRangeChange(range.key)}
                                className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary transition-colors group-hover:border-brand-primary"
                            />
                            <span className="text-base text-gray-700 transition-colors group-hover:text-brand-dark">{range.label}</span>
                        </label>
                    ))}
                </div>
            </div>

             <div>
                <h3 className="font-bold text-brand-text text-lg mb-3">Thời lượng (phút)</h3>
                <input
                    type="range"
                    min={minDuration}
                    max={maxDuration}
                    value={durationRange[1]}
                    step="15"
                    onChange={(e) => setDurationRange([durationRange[0], Number(e.target.value)])}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-primary"
                />
                 <div className="text-base text-brand-text mt-2 text-center">Dưới {durationRange[1]} phút</div>
            </div>

            <div>
                <h3 className="font-bold text-brand-text text-lg mb-3">Đánh giá</h3>
                <div className="flex justify-around items-center">
                    {[1, 2, 3, 4, 5].map(rating => (
                        <button
                            key={rating}
                            onClick={() => setMinRating(rating)}
                            className={`flex flex-col items-center gap-1 p-2 rounded-md transition-colors w-12 ${
                                minRating === rating 
                                ? 'bg-yellow-100 ring-2 ring-yellow-400' 
                                : 'hover:bg-yellow-50'
                            }`}
                        >
                           <span className="font-semibold">{rating}</span>
                           <StarIcon className="w-5 h-5 text-yellow-400" />
                        </button>
                    ))}
                </div>
                 <button onClick={() => setMinRating(0)} className="text-sm text-blue-600 hover:underline w-full text-center mt-3">Xóa lọc đánh giá</button>
            </div>
        </aside>
    );

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="text-center mb-12">
                <h1 className="text-3xl sm:text-4xl font-serif font-bold text-brand-dark">Danh Sách Dịch Vụ</h1>
                <p className="mt-4 text-lg text-brand-text max-w-2xl mx-auto">Khám phá các liệu trình chăm sóc được thiết kế riêng cho bạn tại Anh Thơ Spa.</p>
            </div>
            
            <div className="lg:flex lg:gap-8">
                {/* Desktop Sidebar */}
                <div className="hidden lg:block w-1/4">
                    <FilterSidebar />
                </div>
                
                {/* Main Content */}
                <main className="flex-1">
                    <div className="mb-6 flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-lg shadow-soft-lg border border-brand-accent/30">
                        <div className="relative flex-grow w-full">
                            <input
                                type="text"
                                placeholder="Tìm kiếm theo tên dịch vụ..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-brand-primary focus:border-brand-primary shadow-sm"
                            />
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        </div>
                        <button 
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className="w-full sm:w-auto flex-shrink-0 flex items-center justify-center gap-2 bg-brand-secondary p-3 rounded-lg shadow-sm font-semibold text-brand-dark hover:bg-brand-primary hover:text-white transition-colors lg:hidden"
                        >
                            <FilterIcon className="w-5 h-5"/>
                            <span>{isFilterOpen ? 'Đóng bộ lọc' : 'Mở bộ lọc'}</span>
                        </button>
                    </div>

                    {isFilterOpen && (
                        <div className="lg:hidden mb-6 bg-white p-4 mt-2 rounded-lg shadow-lg">
                            <FilterSidebar />
                        </div>
                    )}
                    
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                            {[...Array(6)].map((_, index) => <ServiceCardSkeleton key={index} />)}
                        </div>
                    ) : error ? (
                        <div className="text-center py-16 bg-white rounded-lg shadow-md">
                            <p className="text-lg text-red-500">Lỗi: {error}</p>
                            <p className="text-sm text-gray-500 mt-2">Vui lòng thử tải lại trang hoặc kiểm tra kết nối.</p>
                        </div>
                    ) : currentServices.length > 0 ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                                {currentServices.map((service) => (
                                    <ServiceCard 
                                        key={service.id} 
                                        service={service}
                                    />
                                ))}
                            </div>
                            <Pagination
                                totalServices={filteredServices.length}
                                servicesPerPage={SERVICES_PER_PAGE}
                                currentPage={currentPage}
                                onPageChange={setCurrentPage}
                            />
                        </>
                    ) : (
                        <div className="text-center py-16 bg-white rounded-lg shadow-md">
                            <p className="text-lg text-brand-text">Không tìm thấy dịch vụ nào phù hợp.</p>
                            <p className="text-sm text-gray-500 mt-2">Vui lòng thử thay đổi bộ lọc của bạn.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};
