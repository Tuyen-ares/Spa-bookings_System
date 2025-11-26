
import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ServiceCard from '../components/ServiceCard';
import type { Service, ServiceCategory } from '../../types';
import { FilterIcon, StarIcon, SearchIcon, ChevronDownIcon, XCircleIcon } from '../../shared/icons';
import * as apiService from '../services/apiService';
import { ServiceCardSkeleton } from '../components/SkeletonLoader';

const SERVICES_PER_PAGE = 9;

const PRICE_RANGES = [
    { key: '0-499999', label: 'Dưới 500k', min: 0, max: 499999 },
    { key: '500000-999999', label: '500k - 1M', min: 500000, max: 999999 },
    { key: '1000000-1999999', label: '1M - 2M', min: 1000000, max: 1999999 },
    { key: '2000000-Infinity', label: 'Trên 2M', min: 2000000, max: Infinity },
];

// Sort Options
const SORT_OPTIONS = [
    { value: 'default', label: 'Mặc định' },
    { value: 'name-asc', label: 'Tên (A - Z)' },
    { value: 'name-desc', label: 'Tên (Z - A)' },
    { value: 'price-asc', label: 'Giá (Thấp - Cao)' },
    { value: 'price-desc', label: 'Giá (Cao - Thấp)' },
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
        <nav className="mt-16 flex justify-center items-center gap-3 animate-fadeInUp">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-5 py-2.5 text-sm font-bold text-gray-600 bg-white rounded-full shadow-sm border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5"
            >
                Trước
            </button>
            {pageNumbers.map((number) => (
                <button
                    key={number}
                    onClick={() => onPageChange(number)}
                    className={`w-10 h-10 text-sm font-bold rounded-full shadow-sm border transition-all duration-300 transform hover:-translate-y-0.5 ${
                        currentPage === number 
                        ? 'bg-ocean-gradient text-white border-transparent shadow-lg scale-110' 
                        : 'bg-white text-gray-600 border-gray-200 hover:border-brand-primary hover:text-brand-primary'
                    }`}
                >
                    {number}
                </button>
            ))}
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-5 py-2.5 text-sm font-bold text-gray-600 bg-white rounded-full shadow-sm border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5"
            >
                Sau
            </button>
        </nav>
    );
};

interface ServicesListPageProps {
    allServices: Service[];
}

export const ServicesListPage: React.FC<ServicesListPageProps> = ({ allServices }) => {
    const location = useLocation();
    const [services, setServices] = useState<Service[]>([]); 
    const [categories, setCategories] = useState<ServiceCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filter States
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [minRating, setMinRating] = useState<number>(0);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([]);
    const [sortOption, setSortOption] = useState<string>('default'); 
    const [durationRange, setDurationRange] = useState<[number, number]>([0, 240]);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setIsLoading(true);
                setError(null);
                
                if (allServices && allServices.length > 0) {
                    setServices(allServices.filter(s => s.isActive !== false));
                } else {
                    const fetchedServices = await apiService.getServices();
                    setServices(fetchedServices.filter(s => s.isActive !== false));
                }

                const fetchedCategories = await apiService.getServiceCategories();
                setCategories(fetchedCategories);
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
    }, [allServices]);

    // Logic để đọc params từ URL và set filter category
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const categoryParam = params.get('category');
        
        if (categoryParam) {
            // Giải mã URL encoded string (ví dụ %20 -> space)
            const decodedCategory = decodeURIComponent(categoryParam);
            // Normalize category for robust matching later
            setSelectedCategories([decodedCategory]);
        } else {
            setSelectedCategories([]);
        }
    }, [location.search]);

    const { minDuration, maxDuration } = useMemo(() => {
        if (services.length === 0) return { minDuration: 0, maxDuration: 180 };
        const durations = services.map(s => s.duration);
        return {
            minDuration: Math.min(...durations, 0),
            maxDuration: Math.max(...durations, 180)
        };
    }, [services]);
    
    useEffect(() => {
        if (services.length > 0 && durationRange[1] === 240) {
            setDurationRange([minDuration, maxDuration]);
        }
    }, [services, minDuration, maxDuration]);
    
    const handleCategoryChange = (categoryId: number | null) => {
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

    const filteredAndSortedServices = useMemo(() => {
        const activePriceRanges = PRICE_RANGES.filter(r => selectedPriceRanges.includes(r.key));
        
        // 1. Filter
        let result = services.filter(service => {
            // Resolve category name from categoryId (Service does not have a `category` string property).
            // This ensures filtering works reliably using the categories lookup.
            const serviceCategoryName = categories.find(c => c.id === service.categoryId)?.name || '';
            
            // Case-insensitive comparison for robustness
            const normalizedServiceCat = serviceCategoryName.toLowerCase();
            const normalizedSelectedCats = selectedCategories.map(c => c.toLowerCase());

            const categoryMatch = selectedCategories.length === 0 || normalizedSelectedCats.includes(normalizedServiceCat);
            
            const price = service.discountPrice || service.price;
            const priceMatch = activePriceRanges.length === 0 || activePriceRanges.some(range => price >= range.min && price <= range.max);

            const durationMatch = service.duration <= durationRange[1];
            const searchLower = searchTerm.toLowerCase();
            const searchMatch = service.name.toLowerCase().includes(searchLower) || 
                                normalizedServiceCat.includes(searchLower) ||
                                service.description.toLowerCase().includes(searchLower);
            
            const ratingMatch = (service.rating || 0) >= minRating;
            
            return categoryMatch && priceMatch && searchMatch && durationMatch && ratingMatch;
        });

        // 2. Sort
        if (sortOption !== 'default') {
            result.sort((a, b) => {
                const priceA = a.discountPrice || a.price;
                const priceB = b.discountPrice || b.price;

                switch (sortOption) {
                    case 'name-asc':
                        return a.name.localeCompare(b.name);
                    case 'name-desc':
                        return b.name.localeCompare(a.name);
                    case 'price-asc':
                        return priceA - priceB;
                    case 'price-desc':
                        return priceB - priceA;
                    default:
                        return 0;
                }
            });
        }

        return result;
    }, [services, selectedCategories, selectedPriceRanges, durationRange, searchTerm, minRating, sortOption, categories]);

    useEffect(() => {
        setCurrentPage(1);
    }, [selectedCategories, selectedPriceRanges, durationRange, searchTerm, minRating, sortOption]);
    
    const indexOfLastService = currentPage * SERVICES_PER_PAGE;
    const indexOfFirstService = indexOfLastService - SERVICES_PER_PAGE;
    const currentServices = filteredAndSortedServices.slice(indexOfFirstService, indexOfLastService);

    const clearAllFilters = () => {
        setSelectedCategories([]);
        setSelectedPriceRanges([]);
        setSearchTerm('');
        setMinRating(0);
        setDurationRange([minDuration, maxDuration]);
        setSortOption('default');
    };

    const FilterSidebar = () => (
        <aside className="space-y-8 bg-white p-6 rounded-[2rem] shadow-soft-lg border border-gray-100 sticky top-24">
            <div className="flex justify-between items-center mb-4">
                 <h3 className="font-serif font-bold text-brand-dark text-xl">Bộ lọc tìm kiếm</h3>
                 <button onClick={clearAllFilters} className="text-xs text-gray-500 hover:text-red-500 font-semibold transition-colors">Xóa tất cả</button>
            </div>

            {/* Categories */}
            <div>
                <h4 className="font-bold text-gray-700 text-sm uppercase tracking-wider mb-4">Danh mục</h4>
                <div className="space-y-2">
                    <label className="group flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors">
                        <span className={`text-sm font-medium transition-colors ${selectedCategories.length === 0 ? 'text-brand-primary font-bold' : 'text-gray-600'}`}>Tất cả</span>
                         <input
                            type="checkbox"
                            name="category"
                            value="all"
                            checked={selectedCategories.length === 0}
                            onChange={() => handleCategoryChange(null)}
                            className="w-4 h-4 rounded text-brand-primary focus:ring-brand-primary border-gray-300"
                        />
                    </label>
                    
                    {categories.map(category => (
                        <label key={category.id} className="group flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors">
                             <span className={`text-sm font-medium transition-colors ${selectedCategories.includes(category.name) ? 'text-brand-primary font-bold' : 'text-gray-600'}`}>{category.name}</span>
                             <input
                                type="checkbox"
                                name="category"
                                value={category.id}
                                checked={selectedCategories.includes(category.name)}
                                onChange={() => handleCategoryChange(category.id)}
                                className="w-4 h-4 rounded text-brand-primary focus:ring-brand-primary border-gray-300"
                            />
                        </label>
                    ))}
                </div>
            </div>

            {/* Price Range */}
            <div>
                <h4 className="font-bold text-gray-700 text-sm uppercase tracking-wider mb-4 border-t pt-6">Khoảng giá</h4>
                <div className="space-y-2">
                    {PRICE_RANGES.map(range => (
                        <label key={range.key} className="group flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors">
                            <span className={`text-sm font-medium transition-colors ${selectedPriceRanges.includes(range.key) ? 'text-brand-primary font-bold' : 'text-gray-600'}`}>{range.label}</span>
                             <input
                                type="checkbox"
                                checked={selectedPriceRanges.includes(range.key)}
                                onChange={() => handlePriceRangeChange(range.key)}
                                className="w-4 h-4 rounded text-brand-primary focus:ring-brand-primary border-gray-300"
                            />
                        </label>
                    ))}
                </div>
            </div>

             {/* Duration */}
             <div>
                <h4 className="font-bold text-gray-700 text-sm uppercase tracking-wider mb-4 border-t pt-6">Thời lượng</h4>
                <div className="px-2">
                    <input
                        type="range"
                        min={minDuration}
                        max={maxDuration}
                        value={durationRange[1]}
                        step="15"
                        onChange={(e) => setDurationRange([durationRange[0], Number(e.target.value)])}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-primary"
                    />
                     <div className="text-sm text-gray-600 mt-2 flex justify-between font-medium">
                         <span>{minDuration}p</span>
                         <span className="text-brand-primary font-bold">Dưới {durationRange[1]}p</span>
                         <span>{maxDuration}p</span>
                     </div>
                </div>
            </div>

            {/* Rating */}
            <div>
                <h4 className="font-bold text-gray-700 text-sm uppercase tracking-wider mb-4 border-t pt-6">Đánh giá</h4>
                <div className="flex justify-between gap-2">
                    {[1, 2, 3, 4, 5].map(rating => (
                        <button
                            key={rating}
                            onClick={() => setMinRating(rating === minRating ? 0 : rating)}
                            className={`flex flex-col items-center justify-center w-full p-2 rounded-xl transition-all duration-300 border ${
                                minRating === rating 
                                ? 'bg-yellow-50 border-yellow-400 shadow-sm transform scale-110' 
                                : 'bg-white border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                           <span className={`font-bold text-sm ${minRating === rating ? 'text-yellow-700' : 'text-gray-500'}`}>{rating}</span>
                           <StarIcon className={`w-4 h-4 ${minRating === rating ? 'text-yellow-400' : 'text-gray-300'}`} />
                        </button>
                    ))}
                </div>
            </div>
        </aside>
    );

    return (
        <div className="bg-gray-50 min-h-screen pb-20">
            {/* Hero Banner */}
             <div className="relative h-[40vh] bg-brand-dark overflow-hidden mb-12 flex items-center justify-center">
                <div className="absolute inset-0 bg-ocean-gradient opacity-90"></div>
                <div className="absolute inset-0 bg-[url('/img/general/noise.png')] opacity-20 mix-blend-soft-light"></div>
                <div className="absolute -top-20 -right-20 w-[500px] h-[500px] bg-cyan-400/30 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute -bottom-20 -left-20 w-[500px] h-[500px] bg-rose-400/20 rounded-full blur-[100px] animate-pulse animation-delay-500"></div>
                
                <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
                    <span className="text-cyan-200 font-bold tracking-[0.3em] uppercase text-xs md:text-sm mb-4 block animate-fadeInDown">Khám phá vẻ đẹp</span>
                    <h1 className="text-5xl md:text-6xl font-serif font-extrabold text-white mb-6 drop-shadow-lg animate-slideUpFade">Dịch Vụ Đẳng Cấp</h1>
                    <p className="text-lg md:text-xl text-cyan-50 font-medium leading-relaxed animate-slideUpFade animation-delay-200">
                        Trải nghiệm những liệu trình chăm sóc chuyên sâu, được thiết kế riêng để đánh thức vẻ đẹp tự nhiên của bạn.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 lg:px-8">
                <div className="lg:flex lg:gap-10">
                    {/* Desktop Sidebar */}
                    <div className="hidden lg:block w-1/4 flex-shrink-0">
                        <FilterSidebar />
                    </div>
                    
                    {/* Main Content */}
                    <main className="flex-1">
                        {/* Search & Sort Bar */}
                        <div className="mb-8 flex flex-col sm:flex-row gap-4">
                            {/* Search */}
                            <div className="relative group flex-grow">
                                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity"></div>
                                <div className="relative bg-white p-2 rounded-2xl shadow-lg flex items-center gap-4 border border-gray-100">
                                    <div className="relative flex-grow">
                                        <input
                                            type="text"
                                            placeholder="Tìm kiếm theo tên hoặc danh mục..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full p-4 pl-12 border-none bg-transparent focus:ring-0 text-lg text-gray-800 placeholder:text-gray-400"
                                        />
                                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-brand-primary" />
                                    </div>
                                    <button 
                                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                                        className="lg:hidden p-4 bg-gray-100 text-brand-dark rounded-xl hover:bg-gray-200 transition-colors"
                                    >
                                        <FilterIcon className="w-6 h-6"/>
                                    </button>
                                    <button className="hidden sm:block px-8 py-3 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-dark transition-colors shadow-md">
                                        Tìm kiếm
                                    </button>
                                </div>
                            </div>
                            
                            {/* Sort Dropdown */}
                            <div className="relative w-full sm:w-auto">
                                <select
                                    value={sortOption}
                                    onChange={(e) => setSortOption(e.target.value)}
                                    className="w-full sm:w-48 h-full pl-4 pr-4 py-4 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-brand-primary focus:border-transparent appearance-none cursor-pointer font-semibold text-gray-700"
                                >
                                    {SORT_OPTIONS.map(option => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                                    <ChevronDownIcon className="h-4 w-4" />
                                </div>
                            </div>
                        </div>

                        {isFilterOpen && (
                            <div className="lg:hidden mb-8 animate-fadeIn">
                                <FilterSidebar />
                            </div>
                        )}
                        
                        {/* Results Info */}
                        <div className="flex justify-between items-center mb-6">
                            <p className="text-gray-500 font-medium">Hiển thị <span className="text-brand-dark font-bold">{currentServices.length}</span> trên tổng số <span className="text-brand-dark font-bold">{filteredAndSortedServices.length}</span> dịch vụ</p>
                            {selectedCategories.length > 0 && (
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {selectedCategories.map(cat => (
                                        <span key={cat} className="px-3 py-1 bg-brand-primary/10 text-brand-primary rounded-full text-xs font-bold flex items-center gap-1 whitespace-nowrap">
                                            {cat} <button onClick={() => handleCategoryChange(categories.find(c => c.name === cat)?.id || null)}><XCircleIcon className="w-4 h-4 hover:text-red-500"/></button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {isLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                                {[...Array(6)].map((_, index) => <ServiceCardSkeleton key={index} />)}
                            </div>
                        ) : error ? (
                            <div className="text-center py-20 bg-white rounded-[2rem] shadow-sm border border-red-100">
                                <XCircleIcon className="w-16 h-16 text-red-400 mx-auto mb-4"/>
                                <p className="text-xl text-red-600 font-bold">Đã xảy ra lỗi</p>
                                <p className="text-gray-500 mt-2">{error}</p>
                            </div>
                        ) : currentServices.length > 0 ? (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                                    {currentServices.map((service) => (
                                        <div key={service.id} className="h-full">
                                            <ServiceCard service={service} />
                                        </div>
                                    ))}
                                </div>
                                <Pagination
                                    totalServices={filteredAndSortedServices.length}
                                    servicesPerPage={SERVICES_PER_PAGE}
                                    currentPage={currentPage}
                                    onPageChange={setCurrentPage}
                                />
                            </>
                        ) : (
                            <div className="text-center py-24 bg-white rounded-[2rem] shadow-sm border border-dashed border-gray-200">
                                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <SearchIcon className="w-10 h-10 text-gray-300" />
                                </div>
                                <p className="text-2xl font-bold text-gray-700 mb-2">Không tìm thấy dịch vụ nào</p>
                                <p className="text-gray-500 mb-6">Hãy thử thay đổi từ khóa tìm kiếm hoặc bộ lọc của bạn.</p>
                                <button onClick={clearAllFilters} className="px-6 py-3 bg-brand-secondary text-brand-dark font-bold rounded-full hover:bg-brand-primary hover:text-white transition-all shadow-sm">
                                    Xóa bộ lọc
                                </button>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};
