import React, { useState, useEffect, useRef, useMemo } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import type { User, Service } from '../../types';
import { LogoIcon, ChevronDownIcon, MenuIcon, CloseIcon, SearchIcon, LogoutIcon, ProfileIcon, AppointmentsIcon, ShieldCheckIcon } from '../../shared/icons';
import { NotificationBell } from './NotificationBell';

interface HeaderProps {
    currentUser: User | null;
    onLogout: () => void;
    allServices: Service[];
}

const Header: React.FC<HeaderProps> = ({ currentUser, onLogout, allServices }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const navigate = useNavigate();
    const userMenuRef = useRef<HTMLDivElement>(null);
    
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        onLogout();
        setIsUserMenuOpen(false);
        setIsMobileMenuOpen(false);
        navigate('/');
    };
    
    // Search Logic
    const searchResults = useMemo(() => {
        if (searchQuery.trim().length < 2) return [];
        return allServices.filter(service => 
            service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            service.description.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 5);
    }, [searchQuery, allServices]);

    const suggestedServices = useMemo(() => {
        if (!isSearchOpen) return [];
        return [...allServices]
            .filter(s => s.isActive)
            .sort((a, b) => {
                // Cast to any to handle optional properties safely
                const serviceA = a as any;
                const serviceB = b as any;
                const scoreA = (serviceA.isHot ? 3 : 0) + (serviceA.discountPrice ? 2 : 0) + (serviceA.isNew ? 1 : 0) + (serviceA.rating > 4.8 ? 1 : 0);
                const scoreB = (serviceB.isHot ? 3 : 0) + (serviceB.discountPrice ? 2 : 0) + (serviceB.isNew ? 1 : 0) + (serviceB.rating > 4.8 ? 1 : 0);
                return scoreB - scoreA;
            })
            .slice(0, 5);
    }, [allServices, isSearchOpen]);
    
    useEffect(() => {
        if (isSearchOpen) {
            searchInputRef.current?.focus();
        } else {
            setSearchQuery('');
        }
    }, [isSearchOpen]);
    
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setIsSearchOpen(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);
    
        // Base navigation links
        const baseLinks = [
            { path: '/', name: 'Trang chủ' },
            { path: '/about', name: 'Giới thiệu' },
            { path: '/services', name: 'Dịch vụ' },
            { path: '/promotions', name: 'Ưu đãi' },
            { path: '/booking', name: 'Đặt lịch' },
            { path: '/qa', name: 'Hỏi & Đáp' },
            { path: '/contact', name: 'Liên hệ' },
        ];
    
    const NavItem: React.FC<{ to: string, name: string, onClick?: () => void }> = ({ to, name, onClick }) => (
        <NavLink
            to={to}
            onClick={onClick}
            className={({ isActive }) => `
                relative px-3 py-2 text-xl font-bold transition-colors duration-300 group
                ${isActive ? 'text-brand-primary' : 'text-gray-700 hover:text-brand-dark'}
            `}
        >
            {({ isActive }) => (
                <>
                    {name}
                    <span className={`absolute bottom-0 left-0 h-0.5 bg-ocean-gradient transition-all duration-300 ease-out ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                </>
            )}
        </NavLink>
    );

    const mobileNavItems = [...baseLinks];
    if (currentUser) {
        mobileNavItems.push({ path: '/appointments', name: 'Lịch hẹn' });
    }

    return (
        <>
            <header 
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] 
                ${isScrolled ? 'bg-white/95 backdrop-blur-lg shadow-sm border-b border-gray-100 h-24' : 'bg-transparent h-28'}`}
            >
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-full">
                    {/* Logo Area - Larger */}
                    <NavLink to="/" className="flex items-center gap-4 group" aria-label="Anh Thơ Spa - Trang chủ">
                        <div className="relative">
                            <div className="absolute inset-0 bg-brand-primary/20 rounded-full blur-md scale-0 group-hover:scale-125 transition-transform duration-500"></div>
                            <LogoIcon className={`text-brand-primary relative z-10 transform group-hover:rotate-12 transition-all duration-500 ${isScrolled ? 'w-12 h-12' : 'w-16 h-16'}`} />
                        </div>
                        <div className="flex flex-col">
                            <span className={`font-serif font-extrabold text-brand-dark leading-none tracking-tight group-hover:text-brand-primary transition-all duration-300 ${isScrolled ? 'text-3xl' : 'text-4xl'}`}>Anh Thơ</span>
                            <span className="text-sm font-sans font-bold text-gray-500 uppercase tracking-[0.2em] leading-none mt-1">Spa & Beauty</span>
                        </div>
                    </NavLink>

                    {/* Desktop Navigation - Larger */}
                    <nav className="hidden xl:flex items-center gap-8">
                        {baseLinks.map(link => <NavItem key={link.path} to={link.path} name={link.name} />)}
                        {/* Added Appointments Link explicitly for logged-in users, replacing Contact position conceptually */}
                        {currentUser && <NavItem to="/appointments" name="Lịch hẹn" />}
                    </nav>

                    {/* Right Actions - Larger */}
                    <div className="hidden lg:flex items-center gap-6">
                        <button 
                            onClick={() => setIsSearchOpen(true)} 
                            className="p-3 rounded-full text-gray-600 hover:bg-brand-secondary hover:text-brand-primary transition-colors duration-300" 
                            aria-label="Tìm kiếm"
                        >
                            <SearchIcon className="w-7 h-7 stroke-[2.5]"/>
                        </button>

                        {currentUser ? (
                            <div className="flex items-center gap-4">
                                <NotificationBell currentUser={currentUser} />
                                <div className="relative" ref={userMenuRef}>
                                    <button 
                                        onClick={() => setIsUserMenuOpen(prev => !prev)} 
                                        className={`flex items-center gap-3 pl-2 pr-4 py-2 rounded-full border transition-all duration-300 ${isUserMenuOpen ? 'bg-brand-secondary border-brand-primary/30' : 'bg-white border-gray-200 hover:border-brand-primary/50 hover:shadow-md'}`}
                                        aria-haspopup="true" 
                                        aria-expanded={isUserMenuOpen}
                                    >
                                        <div className="w-11 h-11 rounded-full ring-2 ring-white shadow-sm overflow-hidden bg-gray-200 flex items-center justify-center flex-shrink-0">
                                            {currentUser.profilePictureUrl ? (
                                                <img 
                                                    src={currentUser.profilePictureUrl.startsWith('http') ? currentUser.profilePictureUrl : `http://localhost:3001${currentUser.profilePictureUrl}`}
                                                    alt={currentUser.name} 
                                                    className="w-full h-full object-cover object-center" 
                                                    style={{ objectPosition: 'center 30%' }}
                                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                />
                                            ) : (
                                                <ProfileIcon className="w-6 h-6 text-gray-400" />
                                            )}
                                        </div>
                                        <span className="font-bold text-lg text-brand-dark max-w-[140px] truncate">{currentUser.name.split(' ').pop()}</span>
                                        <ChevronDownIcon className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    
                                    {/* Dropdown Menu - Larger */}
                                    <div className={`absolute right-0 mt-4 w-80 origin-top-right bg-white rounded-2xl shadow-glass border border-white/50 py-2 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isUserMenuOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}>
                                        <div className="px-6 py-5 border-b border-gray-100 bg-brand-secondary/30">
                                            <p className="text-sm text-gray-500 mb-1 uppercase tracking-wider font-bold">Xin chào</p>
                                            <p className="font-bold text-brand-dark truncate text-xl">{currentUser.name}</p>
                                            <p className="text-sm text-brand-primary font-bold mt-1 bg-white/50 inline-block px-2 py-0.5 rounded-full">{currentUser.role}</p>
                                        </div>
                                        <div className="p-2 space-y-1">
                                            {currentUser.role === 'Admin' && (
                                                <Link to="/admin" className="flex items-center gap-4 px-4 py-3 rounded-xl text-lg font-semibold text-gray-700 hover:bg-brand-secondary hover:text-brand-primary transition-colors" onClick={() => setIsUserMenuOpen(false)}>
                                                    <ShieldCheckIcon className="w-6 h-6" /> Trang quản trị
                                                </Link>
                                            )}
                                            <Link to="/profile" className="flex items-center gap-4 px-4 py-3 rounded-xl text-lg font-semibold text-gray-700 hover:bg-brand-secondary hover:text-brand-primary transition-colors" onClick={() => setIsUserMenuOpen(false)}>
                                                <ProfileIcon className="w-6 h-6" /> Hồ sơ cá nhân
                                            </Link>
                                            <Link to="/appointments" className="flex items-center gap-4 px-4 py-3 rounded-xl text-lg font-semibold text-gray-700 hover:bg-brand-secondary hover:text-brand-primary transition-colors" onClick={() => setIsUserMenuOpen(false)}>
                                                <AppointmentsIcon className="w-6 h-6" /> Lịch hẹn của tôi
                                            </Link>
                                            <button onClick={handleLogout} className="flex items-center gap-4 px-4 py-3 rounded-xl text-lg font-semibold text-red-600 hover:bg-red-50 transition-colors w-full">
                                                <LogoutIcon className="w-6 h-6" /> Đăng xuất
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4">
                                <Link to="/login" className="font-bold text-brand-dark text-lg px-6 py-3 rounded-full hover:bg-gray-100 transition-colors">
                                    Đăng nhập
                                </Link>
                                <Link to="/register" className="font-bold text-white text-lg px-8 py-3 rounded-full bg-ocean-gradient shadow-lg shadow-brand-primary/30 hover:shadow-brand-primary/50 hover:-translate-y-0.5 transition-all duration-300">
                                    Đăng ký ngay
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Button - Larger */}
                    <div className="lg:hidden flex items-center gap-5">
                         <button onClick={() => setIsSearchOpen(true)} className="p-2 text-brand-dark" aria-label="Tìm kiếm">
                             <SearchIcon className="w-8 h-8 stroke-2"/>
                        </button>
                        {/* Mobile Notification Bell */}
                        {currentUser && <NotificationBell currentUser={currentUser} />}
                        <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-brand-dark" aria-label="Mở menu">
                            <MenuIcon className="w-10 h-10"/>
                        </button>
                    </div>
                </div>
            </header>
            
            {/* Fullscreen Search Modal */}
            {isSearchOpen && (
                <div className="fixed inset-0 z-[100] bg-white/95 backdrop-blur-xl animate-fadeIn flex flex-col" onClick={() => setIsSearchOpen(false)}>
                     <div className="container mx-auto px-4 pt-8 pb-4 flex justify-end">
                        <button onClick={() => setIsSearchOpen(false)} className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                            <CloseIcon className="w-8 h-8 text-gray-600" />
                        </button>
                     </div>
                    <div className="container mx-auto px-4 max-w-4xl flex-grow pt-10" onClick={e => e.stopPropagation()}>
                        <div className="relative mb-12 group">
                            <SearchIcon className="absolute left-8 top-1/2 -translate-y-1/2 w-10 h-10 text-gray-400 group-focus-within:text-brand-primary transition-colors" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && searchQuery.trim()) {
                                        navigate(`/search-results?q=${encodeURIComponent(searchQuery.trim())}`);
                                        setIsSearchOpen(false);
                                    }
                                }}
                                placeholder="Tìm kiếm dịch vụ, liệu trình..."
                                className="w-full p-8 pl-24 bg-gray-50 rounded-[2.5rem] text-3xl font-serif font-bold text-brand-dark shadow-inner border-2 border-transparent focus:bg-white focus:border-brand-primary focus:outline-none focus:shadow-2xl transition-all placeholder:text-gray-300"
                            />
                        </div>
                        
                        <div className="space-y-10 animate-slideUpFade animation-delay-200">
                            {searchQuery.trim().length >= 2 && (
                                <div>
                                     <div className="flex items-center justify-between mb-8 ml-4">
                                         <h4 className="text-lg font-bold text-gray-400 uppercase tracking-wider">Kết quả tìm kiếm ({searchResults.length})</h4>
                                         {searchResults.length > 0 && (
                                             <button
                                                 onClick={() => {
                                                     navigate(`/search-results?q=${encodeURIComponent(searchQuery.trim())}`);
                                                     setIsSearchOpen(false);
                                                 }}
                                                 className="px-6 py-2 bg-brand-primary text-white rounded-full font-bold hover:bg-brand-dark transition-colors"
                                             >
                                                 Xem tất cả
                                             </button>
                                         )}
                                     </div>
                                     {searchResults.length > 0 ? (
                                        <div className="grid grid-cols-1 gap-6">
                                            {searchResults.map(service => (
                                                <Link 
                                                    key={service.id} 
                                                    to={`/service/${service.id}`}
                                                    onClick={() => setIsSearchOpen(false)}
                                                    className="flex items-center gap-8 p-6 rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group"
                                                >
                                                    <img src={service.imageUrl} alt={service.name} className="w-24 h-24 object-cover rounded-2xl shadow-md" />
                                                    <div className="flex-grow">
                                                        <p className="text-2xl font-bold font-serif text-brand-dark group-hover:text-brand-primary transition-colors">{service.name}</p>
                                                        <p className="text-base text-gray-500 line-clamp-1 mt-2">{service.description}</p>
                                                    </div>
                                                    <div className="text-right">
                                                         <span className="text-xl font-bold text-brand-primary block">
                                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(service.discountPrice || service.price)}
                                                         </span>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-16">
                                            <p className="text-2xl text-gray-400 font-serif italic">Không tìm thấy kết quả nào phù hợp.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Menu Overlay */}
            <div className={`fixed inset-0 z-[90] lg:hidden ${isMobileMenuOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
                {/* Backdrop */}
                <div 
                    className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-500 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0'}`} 
                    onClick={() => setIsMobileMenuOpen(false)}
                />
                
                {/* Side Drawer - Larger Fonts */}
                <div className={`absolute top-0 right-0 h-full w-[85%] max-w-md bg-white shadow-2xl transform transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                    <div className="flex items-center justify-between p-8 border-b border-gray-100">
                         <span className="text-3xl font-serif font-bold text-brand-dark">Menu</span>
                        <button onClick={() => setIsMobileMenuOpen(false)} className="p-3 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200" aria-label="Đóng menu">
                            <CloseIcon className="w-8 h-8"/>
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto py-8 px-6 space-y-4">
                        {mobileNavItems.map((link, index) => (
                             <NavLink
                                key={link.path}
                                to={link.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={({ isActive }) => `
                                    block px-6 py-5 rounded-2xl text-2xl font-bold transition-all duration-300
                                    ${isActive 
                                        ? 'bg-brand-secondary text-brand-primary translate-x-2 shadow-sm' 
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-brand-dark'
                                    }
                                `}
                                style={{ transitionDelay: `${index * 50}ms` }}
                            >
                                {link.name}
                            </NavLink>
                        ))}
                    </div>

                    <div className="p-8 border-t border-gray-100 bg-gray-50">
                        {currentUser ? (
                            <div className="space-y-6">
                                <div className="flex items-center gap-4 mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                                    <div className="w-16 h-16 rounded-full border-2 border-white shadow-md overflow-hidden bg-gray-200 flex items-center justify-center flex-shrink-0">
                                        {currentUser.profilePictureUrl ? (
                                            <img 
                                                src={currentUser.profilePictureUrl.startsWith('http') ? currentUser.profilePictureUrl : `http://localhost:3001${currentUser.profilePictureUrl}`}
                                                alt={currentUser.name} 
                                                className="w-full h-full object-cover object-center" 
                                                style={{ objectPosition: 'center 30%' }}
                                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                            />
                                        ) : (
                                            <ProfileIcon className="w-8 h-8 text-gray-400" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-bold text-xl text-gray-900">{currentUser.name}</p>
                                        <p className="text-sm text-gray-500">{currentUser.email}</p>
                                    </div>
                                </div>
                                {currentUser.role === 'Admin' && (
                                    <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="block w-full py-4 px-6 bg-gray-800 text-white text-center rounded-xl font-bold text-lg hover:bg-gray-700 transition-colors shadow-md">
                                        Trang quản trị
                                    </Link>
                                )}
                                <div className="grid grid-cols-2 gap-4">
                                    <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="py-4 px-4 bg-white border border-gray-200 text-gray-700 text-center rounded-xl font-bold text-lg hover:bg-gray-50 transition-colors shadow-sm">
                                        Hồ sơ
                                    </Link>
                                    <button onClick={handleLogout} className="py-4 px-4 bg-red-50 text-red-600 text-center rounded-xl font-bold text-lg hover:bg-red-100 transition-colors">
                                        Đăng xuất
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <Link to="/register" onClick={() => setIsMobileMenuOpen(false)} className="block w-full py-5 bg-ocean-gradient text-white text-center rounded-xl font-bold text-xl shadow-lg hover:shadow-brand-primary/40 transition-all">
                                    Đăng ký ngay
                                </Link>
                                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="block w-full py-5 bg-white border-2 border-gray-200 text-gray-700 text-center rounded-xl font-bold text-xl hover:bg-gray-50 transition-colors">
                                    Đăng nhập
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Header;