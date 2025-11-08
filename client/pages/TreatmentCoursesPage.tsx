import React, { useState, useMemo, useEffect } from 'react';
import type { TreatmentCourse, User } from '../../types';
import { FilterIcon, SearchIcon } from '../../shared/icons';
import TreatmentCourseCard from '../components/TreatmentCourseCard';
import { ServiceCardSkeleton } from '../components/SkeletonLoader';
import * as apiService from '../services/apiService';

interface TreatmentCoursesPageProps {
    currentUser: User | null;
    allTreatmentCourses: TreatmentCourse[];
}

const TreatmentCoursesPage: React.FC<TreatmentCoursesPageProps> = ({ currentUser, allTreatmentCourses }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSessionsPerWeek, setSelectedSessionsPerWeek] = useState<number[]>([]);
    const [selectedDurationRange, setSelectedDurationRange] = useState<[number, number]>([30, 180]);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [localCourses, setLocalCourses] = useState<TreatmentCourse[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch treatment courses directly if allTreatmentCourses is empty
    useEffect(() => {
        const fetchCourses = async () => {
            // If allTreatmentCourses is provided and has data, use it
            if (allTreatmentCourses && allTreatmentCourses.length > 0) {
                // Filter to show only template courses (clientId is null) for client-side display
                // Note: allTreatmentCourses from App.tsx may include all courses, so we filter here
                const templateCourses = allTreatmentCourses.filter(c => !c.clientId || c.clientId === null || c.clientId === '');
                setLocalCourses(templateCourses);
                return;
            }
            
            // Otherwise, fetch directly from API
            try {
                setIsLoading(true);
                setError(null);
                // Fetch only template courses (clientId is null) for client-side display
                const fetchedCourses = await apiService.getTreatmentCourses(true);
                setLocalCourses(fetchedCourses);
            } catch (error) {
                console.error("Failed to fetch treatment courses in TreatmentCoursesPage:", error);
                setError("Không thể tải danh sách liệu trình.");
                setLocalCourses([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCourses();
    }, [allTreatmentCourses]);

    // Use localCourses if available, otherwise fallback to allTreatmentCourses
    const coursesToUse = useMemo(() => {
        if (localCourses.length > 0) {
            return localCourses;
        }
        if (allTreatmentCourses && allTreatmentCourses.length > 0) {
            // Filter to show only template courses (clientId is null) for client-side display
            return allTreatmentCourses.filter(c => !c.clientId || c.clientId === null);
        }
        return [];
    }, [localCourses, allTreatmentCourses]);

    // Get unique values for filters
    const uniqueSessionsPerWeek = useMemo(() => {
        const sessions = coursesToUse.map(c => c.sessionsPerWeek);
        return Array.from(new Set(sessions)).sort((a, b) => a - b);
    }, [coursesToUse]);

    const minDuration = 30;
    const maxDuration = 180;

    // Filter and search
    const filteredCourses = useMemo(() => {
        let filtered = [...coursesToUse];

        // Search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(course =>
                course.serviceName.toLowerCase().includes(term) ||
                (course.description && course.description.toLowerCase().includes(term))
            );
        }

        // Sessions per week filter
        if (selectedSessionsPerWeek.length > 0) {
            filtered = filtered.filter(course => 
                selectedSessionsPerWeek.includes(course.sessionsPerWeek)
            );
        }

        // Duration filter
        filtered = filtered.filter(course =>
            course.sessionDuration >= selectedDurationRange[0] &&
            course.sessionDuration <= selectedDurationRange[1]
        );

        return filtered;
    }, [coursesToUse, searchTerm, selectedSessionsPerWeek, selectedDurationRange]);

    const handleSessionsPerWeekChange = (sessions: number) => {
        setSelectedSessionsPerWeek(prev =>
            prev.includes(sessions)
                ? prev.filter(s => s !== sessions)
                : [...prev, sessions]
        );
    };

    const FilterSidebar = () => (
        <aside className="space-y-8">
            <div>
                <h3 className="font-bold text-brand-text text-lg mb-3">Số buổi/tuần</h3>
                <div>
                    {uniqueSessionsPerWeek.map(sessions => (
                        <label 
                            key={sessions} 
                            className="group flex items-center space-x-3 cursor-pointer py-1 px-2 rounded-md transition-colors hover:bg-brand-secondary"
                        >
                            <input
                                type="checkbox"
                                checked={selectedSessionsPerWeek.includes(sessions)}
                                onChange={() => handleSessionsPerWeekChange(sessions)}
                                className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary transition-colors group-hover:border-brand-primary"
                            />
                            <span className="text-base text-gray-700 transition-colors group-hover:text-brand-dark">
                                {sessions} buổi/tuần
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="font-bold text-brand-text text-lg mb-3">Thời lượng/buổi (phút)</h3>
                <input
                    type="range"
                    min={minDuration}
                    max={maxDuration}
                    value={selectedDurationRange[1]}
                    step="15"
                    onChange={(e) => setSelectedDurationRange([selectedDurationRange[0], Number(e.target.value)])}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-primary"
                />
                <div className="text-base text-brand-text mt-2 text-center">
                    {selectedDurationRange[0]} - {selectedDurationRange[1]} phút
                </div>
            </div>
        </aside>
    );

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="text-center mb-12">
                <h1 className="text-3xl sm:text-4xl font-serif font-bold text-brand-dark">Danh Sách Liệu Trình</h1>
                <p className="mt-4 text-lg text-brand-text max-w-2xl mx-auto">
                    Khám phá các liệu trình chăm sóc được thiết kế riêng cho bạn tại Anh Thơ Spa.
                </p>
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
                                placeholder="Tìm kiếm theo tên liệu trình..."
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
                    ) : filteredCourses.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                            {filteredCourses.map((course) => (
                                <TreatmentCourseCard 
                                    key={course.id} 
                                    treatmentCourse={course}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-white rounded-lg shadow-md">
                            <p className="text-lg text-brand-text">Không tìm thấy liệu trình nào phù hợp.</p>
                            <p className="text-sm text-gray-500 mt-2">
                                {coursesToUse.length > 0 
                                    ? "Vui lòng thử thay đổi bộ lọc của bạn." 
                                    : "Hiện tại chưa có liệu trình nào được đăng tải."}
                            </p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default TreatmentCoursesPage;
