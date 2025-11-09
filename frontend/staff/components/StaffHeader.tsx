import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import type { User } from '../../types';
import { ChevronDownIcon, BellIcon, SearchIcon, MenuIcon, SunIcon, MoonIcon } from '../../shared/icons';

interface StaffHeaderProps {
    currentUser: User;
    onLogout: () => void;
    toggleMobileSidebar: () => void;
}

const StaffHeader: React.FC<StaffHeaderProps> = ({ currentUser, onLogout, toggleMobileSidebar }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(() => {
        if (typeof window !== 'undefined' && window.localStorage) {
            return localStorage.theme === 'dark' || 
                   (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
        }
        return false;
    });
    const menuRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.theme = 'dark';
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.theme = 'light';
        }
    }, [isDarkMode]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    const handleLogout = () => {
        onLogout();
        navigate('/login');
    };

    return (
        <header className="flex-shrink-0 flex items-center justify-between h-20 px-6 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700 z-30 relative shadow-sm">
            <div className="flex items-center">
                <button onClick={toggleMobileSidebar} className="text-gray-500 dark:text-gray-300 focus:outline-none lg:hidden" aria-label="Mở menu">
                    <MenuIcon className="h-6 w-6"/>
                </button>
                <div className="relative hidden md:block ml-4">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                       <SearchIcon className="w-5 h-5 text-gray-400"/>
                    </span>
                    <input className="w-full max-w-xs py-2 pl-10 pr-4 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-transparent rounded-lg focus:outline-none focus:bg-white dark:focus:bg-gray-600 focus:border-brand-primary" type="text" placeholder="Tìm kiếm nhanh..." />
                </div>
            </div>
            
            <div className="flex items-center space-x-4">
                <button onClick={() => setIsDarkMode(!isDarkMode)} className="relative p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none rounded-full" aria-label="Toggle Dark Mode">
                    {isDarkMode ? <SunIcon className="h-6 w-6 text-yellow-400" /> : <MoonIcon className="h-6 w-6" />}
                </button>
                
                <Link to="/staff/notifications" className="relative p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none rounded-full" aria-label="Thông báo">
                    <span className="absolute top-0 right-0 h-2 w-2 mt-1 mr-2 bg-red-500 rounded-full"></span>
                    <span className="absolute top-0 right-0 h-2 w-2 mt-1 mr-2 bg-red-500 rounded-full animate-ping"></span>
                    <BellIcon className="h-6 w-6"/>
                </Link>

                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-brand-dark dark:hover:text-brand-primary"
                        aria-haspopup="true"
                        aria-expanded={isMenuOpen}
                    >
                        <img
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-600"
                            src={currentUser.profilePictureUrl}
                            alt={currentUser.name}
                        />
                        <span className="hidden md:inline">{currentUser.name}</span>
                        <ChevronDownIcon className={`w-5 h-5 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isMenuOpen && (
                        <div className="absolute right-0 w-48 mt-2 py-2 bg-white dark:bg-gray-800 rounded-md shadow-lg z-20 border dark:border-gray-700">
                            <Link to="/staff/profile" className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setIsMenuOpen(false)}>
                                Hồ sơ của tôi
                            </Link>
                             {/* <Link to="/" className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                Trang chủ Spa
                            </Link> */}
                            <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                            <button
                                onClick={handleLogout}
                                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                            >
                                Đăng xuất
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default StaffHeader;
