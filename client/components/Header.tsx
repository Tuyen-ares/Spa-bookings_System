

import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import type { User } from '../../types';
import { LogoIcon, ChevronDownIcon, MenuIcon, CloseIcon, ChatBubbleLeftRightIcon } from '../../shared/icons';

interface HeaderProps {
    currentUser: User | null;
    onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentUser, onLogout }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const navigate = useNavigate();
    const userMenuRef = useRef<HTMLDivElement>(null);

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
    
    const baseLinks = [
      { path: '/', name: 'Trang chủ' },
      { path: '/services', name: 'Dịch vụ' },
      { path: '/treatment-courses', name: 'Liệu trình' },
      { path: '/promotions', name: 'Ưu đãi' },
      { path: '/qa', name: 'Q&A' },
      { path: '/contact', name: 'Liên hệ' },
    ];
    
    const NavItem: React.FC<{ to: string, name: string, onClick?: () => void }> = ({ to, name, onClick }) => (
        <NavLink
            to={to}
            onClick={onClick}
            className={({ isActive }) => `nav-link relative font-medium transition-colors px-3 py-2 rounded-md text-base ${isActive ? 'active font-bold bg-brand-primary/10 text-brand-primary' : 'text-brand-dark hover:bg-brand-secondary hover:text-brand-primary'}`}
        >
            {name}
        </NavLink>
    );

    const mobileNavItems = [...baseLinks];
    if (currentUser) {
        mobileNavItems.push({ path: '/appointments', name: 'Lịch hẹn' });
    }

    return (
        <>
            <header className={`fixed top-0 left-0 right-0 z-50 h-20 transition-all duration-300 animate-fadeInDown ${isScrolled ? 'bg-brand-secondary/90 backdrop-blur-sm shadow-md border-b border-black/5' : 'bg-transparent'}`}>
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-full">
                    <NavLink to="/" className="flex items-center gap-2 group transition-transform hover:scale-105" aria-label="Anh Thơ Spa - Trang chủ">
                        <LogoIcon className="w-8 h-8 text-brand-dark" />
                        <span className="text-xl sm:text-2xl font-serif font-bold text-brand-dark">Anh Thơ Spa</span>
                    </NavLink>

                    <nav className="hidden md:flex items-center gap-8">
                        {baseLinks.map(link => <NavItem key={link.path} to={link.path} name={link.name} />)}
                        {currentUser && <NavItem to="/appointments" name="Lịch hẹn" />}
                    </nav>

                    <div className="hidden md:flex items-center gap-4">
                        {currentUser ? (
                            <div className="relative" ref={userMenuRef}>
                                <button onClick={() => setIsUserMenuOpen(prev => !prev)} className="flex items-center gap-2 group p-1 rounded-full transition-colors hover:bg-brand-primary/10" aria-haspopup="true" aria-expanded={isUserMenuOpen}>
                                    <img src={currentUser.profilePictureUrl} alt={currentUser.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-brand-secondary group-hover:ring-brand-primary transition-all" />
                                    <span className="font-medium text-brand-dark">{currentUser.name.split(' ').pop()}</span>
                                    <ChevronDownIcon className={`w-5 h-5 text-brand-dark transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                                </button>
                                
                                <div className={`absolute right-0 mt-2 w-56 origin-top-right bg-white rounded-lg shadow-xl py-2 transition-all duration-200 ease-out transform ${isUserMenuOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}>
                                    <div className="px-4 py-2 border-b">
                                        <p className="font-bold text-brand-dark truncate">{currentUser.name}</p>
                                        <p className="text-sm text-gray-500 truncate">{currentUser.email}</p>
                                    </div>
                                    {currentUser.role === 'Admin' && (
                                        <Link to="/admin" className="block w-full text-left px-4 py-2 text-brand-text font-semibold hover:bg-brand-secondary" onClick={() => setIsUserMenuOpen(false)}>
                                            Trang quản trị
                                        </Link>
                                    )}
                                    <Link to="/profile" className="block w-full text-left px-4 py-2 text-brand-text hover:bg-brand-secondary" onClick={() => setIsUserMenuOpen(false)}>Hồ sơ của tôi</Link>
                                    <Link to="/appointments" className="block w-full text-left px-4 py-2 text-brand-text hover:bg-brand-secondary" onClick={() => setIsUserMenuOpen(false)}>Lịch hẹn của tôi</Link>
                                    <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50">Đăng xuất</button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Link to="/login" className="font-medium text-brand-dark px-4 py-2 rounded-md hover:bg-brand-secondary/70 transition-colors">Đăng nhập</Link>
                                <Link to="/register" className="font-medium bg-brand-dark text-white px-4 py-2 rounded-md hover:bg-brand-primary transition-colors">Đăng ký</Link>
                            </div>
                        )}
                    </div>

                    <div className="md:hidden">
                        <button onClick={() => setIsMobileMenuOpen(true)} aria-label="Mở menu">
                            <MenuIcon className="w-7 h-7 text-brand-dark"/>
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            <div className={`fixed inset-0 bg-black/40 z-[100] transition-opacity md:hidden ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsMobileMenuOpen(false)}>
                <div className={`fixed top-0 right-0 h-full w-4/5 max-w-sm bg-white shadow-lg p-6 flex flex-col items-center justify-center transition-transform transform ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`} onClick={e => e.stopPropagation()}>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="absolute top-5 right-5 text-gray-500 hover:text-gray-800" aria-label="Đóng menu">
                        <CloseIcon className="w-7 h-7"/>
                    </button>
                    
                    <nav className="flex flex-col gap-y-6 text-center w-full">
                        {isMobileMenuOpen && (
                            <>
                                {mobileNavItems.map((link, index) => (
                                     <NavLink
                                        key={link.path}
                                        to={link.path}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={({ isActive }) => `block px-4 py-3 rounded-md text-lg font-medium opacity-0 animate-fadeInUp ${isActive ? 'bg-brand-secondary text-brand-dark' : 'text-brand-text'}`}
                                        style={{ animationDelay: `${100 + index * 50}ms` }}
                                    >
                                        {link.name}
                                    </NavLink>
                                ))}
                                
                                <div className="border-t my-4 opacity-0 animate-fadeInUp" style={{ animationDelay: `${100 + mobileNavItems.length * 50}ms` }}></div>

                                {currentUser ? (
                                    <>
                                        {currentUser.role === 'Admin' && (
                                            <NavLink
                                                to="/admin"
                                                onClick={() => setIsMobileMenuOpen(false)}
                                                className={({ isActive }) => `block px-4 py-3 rounded-md text-lg font-medium opacity-0 animate-fadeInUp ${isActive ? 'bg-brand-secondary text-brand-dark' : 'text-brand-text'}`}
                                                style={{ animationDelay: `${150 + mobileNavItems.length * 50}ms` }}
                                            >
                                                Trang quản trị
                                            </NavLink>
                                        )}
                                        <NavLink
                                            to="/profile"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className={({ isActive }) => `block px-4 py-3 rounded-md text-lg font-medium opacity-0 animate-fadeInUp ${isActive ? 'bg-brand-secondary text-brand-dark' : 'text-brand-text'}`}
                                            style={{ animationDelay: `${150 + mobileNavItems.length * 50}ms` }}
                                        >
                                            Hồ sơ: {currentUser.name}
                                        </NavLink>
                                        <button
                                            onClick={handleLogout}
                                            className="block w-full px-4 py-3 rounded-md text-lg font-medium text-red-600 opacity-0 animate-fadeInUp"
                                            style={{ animationDelay: `${200 + mobileNavItems.length * 50}ms` }}
                                        >
                                            Đăng xuất
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <NavLink
                                            to="/login"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className={({ isActive }) => `block px-4 py-3 rounded-md text-lg font-medium opacity-0 animate-fadeInUp ${isActive ? 'bg-brand-secondary text-brand-dark' : 'text-brand-text'}`}
                                            style={{ animationDelay: `${150 + mobileNavItems.length * 50}ms` }}
                                        >
                                            Đăng nhập
                                        </NavLink>
                                        <NavLink
                                            to="/register"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="block bg-brand-dark text-white px-4 py-3 rounded-md text-lg font-medium mt-2 opacity-0 animate-fadeInUp"
                                            style={{ animationDelay: `${200 + mobileNavItems.length * 50}ms` }}
                                        >
                                            Đăng ký
                                        </NavLink>
                                    </>
                                )}
                            </>
                        )}
                    </nav>
                </div>
            </div>
        </>
    );
};

export default Header;
