import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import ServiceCard from '../components/ServiceCard';
import type { Service } from '../../types';
import { SearchIcon, ArrowUturnLeftIcon } from '../../shared/icons';
import { ServiceCardSkeleton } from '../components/SkeletonLoader';
import * as apiService from '../services/apiService';

interface SearchResultsPageProps {
    allServices: Service[];
}

export const SearchResultsPage: React.FC<SearchResultsPageProps> = ({ allServices }) => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const navigate = useNavigate();
    
    const [services, setServices] = useState<Service[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [localSearchTerm, setLocalSearchTerm] = useState(query);

    // If allServices is passed as prop, use it. Otherwise fetch.
    // This ensures the page works even if refreshed directly or navigated to without pre-loaded data.
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                let data = allServices;
                if (!data || data.length === 0) {
                    data = await apiService.getServices();
                }
                // Only show active services
                setServices(data.filter(s => s.isActive !== false));
            } catch (error) {
                console.error("Failed to fetch services for search:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [allServices]);

    // Update local search term when URL query changes
    useEffect(() => {
        setLocalSearchTerm(query);
    }, [query]);

    const searchResults = useMemo(() => {
        if (!query.trim()) return [];
        const lowerQuery = query.toLowerCase().trim();
        
        return services.filter(service => 
            service.name.toLowerCase().includes(lowerQuery) ||
            service.description.toLowerCase().includes(lowerQuery) ||
            (service.categoryId !== undefined && String(service.categoryId).toLowerCase().includes(lowerQuery))
        );
    }, [services, query]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (localSearchTerm.trim()) {
            navigate(`/search-results?q=${encodeURIComponent(localSearchTerm.trim())}`);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-4">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-gray-500 hover:text-brand-primary mb-8 transition-colors group font-semibold"
                >
                    <div className="p-2 bg-white rounded-full shadow-sm mr-3 group-hover:bg-brand-secondary transition-colors border border-gray-200">
                        <ArrowUturnLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    </div>
                    Quay lại
                </button>

                <div className="max-w-4xl mx-auto mb-12">
                     <h1 className="text-3xl md:text-4xl font-serif font-bold text-brand-dark text-center mb-8">
                        Kết quả tìm kiếm
                    </h1>
                    
                    <form onSubmit={handleSearchSubmit} className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/20 to-brand-accent/20 rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity"></div>
                        <input
                            type="text"
                            value={localSearchTerm}
                            onChange={(e) => setLocalSearchTerm(e.target.value)}
                            placeholder="Tìm kiếm dịch vụ, liệu trình..."
                            className="w-full p-5 pl-14 bg-white rounded-2xl shadow-soft-lg border border-transparent focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all text-lg text-gray-800 placeholder:text-gray-400 relative z-10"
                        />
                        <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-brand-primary z-20" />
                        <button 
                            type="submit" 
                            className="absolute right-3 top-1/2 -translate-y-1/2 bg-ocean-gradient text-white px-6 py-2.5 rounded-xl font-bold hover:shadow-lg transition-all shadow-md z-20"
                        >
                            Tìm
                        </button>
                    </form>
                </div>

                <div className="mb-8">
                     {query && (
                        <p className="text-lg text-gray-600 font-medium border-b pb-4">
                            Tìm thấy <span className="text-brand-primary font-bold">{searchResults.length}</span> kết quả cho từ khóa "<span className="text-brand-dark">{query}</span>"
                        </p>
                    )}
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => <ServiceCardSkeleton key={i} />)}
                    </div>
                ) : searchResults.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {searchResults.map(service => (
                            <div key={service.id} className="h-full">
                                <ServiceCard service={service} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-[2rem] shadow-sm border border-dashed border-gray-200">
                        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <SearchIcon className="w-10 h-10 text-gray-300" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Không tìm thấy kết quả nào</h3>
                        <p className="text-gray-500 mb-8 max-w-md mx-auto">
                            Rất tiếc, chúng tôi không tìm thấy dịch vụ nào phù hợp với từ khóa "{query}". Hãy thử từ khóa khác hoặc xem tất cả dịch vụ.
                        </p>
                        <Link 
                            to="/services" 
                            className="inline-flex items-center justify-center px-8 py-3 bg-brand-secondary text-brand-dark font-bold rounded-full hover:bg-brand-primary hover:text-white transition-all shadow-sm"
                        >
                            Xem tất cả dịch vụ
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};