import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import type { User } from '../../types';
import { ChevronDownIcon, BellIcon, MenuIcon, SearchIcon } from '../../shared/icons';

interface AdminHeaderProps {
    currentUser: User;
    onLogout: () => void;
    toggleMobileSidebar: () => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ currentUser, onLogout, toggleMobileSidebar }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

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
        <header className="flex-shrink-0 flex items-center justify-between h-20 px-6 bg-white border-b border-gray-200 z-30 relative shadow-sm">
            {/* Left side: Hamburger menu for mobile and Search bar for desktop */}
            <div className="flex items-center">
                <button onClick={toggleMobileSidebar} className="text-gray-500 focus:outline-none lg:hidden" aria-label="Mở menu">
                    <MenuIcon className="h-6 w-6"/>
                </button>
                <div className="relative hidden md:block ml-4">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                       <SearchIcon className="w-5 h-5 text-gray-400"/>
                    </span>
                    <input className="w-full max-w-xs py-2 pl-10 pr-4 text-gray-700 bg-gray-100 border border-transparent rounded-lg focus:outline-none focus:bg-white focus:border-brand-primary" type="text" placeholder="Tìm kiếm toàn cục..." />
                </div>
            </div>
            
            {/* Right side: Notifications and User Menu */}
            <div className="flex items-center space-x-4">
                <button className="relative p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none rounded-full" aria-label="Thông báo">
                    <span className="absolute top-0 right-0 h-2 w-2 mt-1 mr-2 bg-red-500 rounded-full"></span>
                    <span className="absolute top-0 right-0 h-2 w-2 mt-1 mr-2 bg-red-500 rounded-full animate-ping"></span>
                    <BellIcon className="h-6 w-6"/>
                </button>

                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-brand-dark"
                        aria-haspopup="true"
                        aria-expanded={isMenuOpen}
                    >
                        <img
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-200"
                            src={currentUser.profilePictureUrl}
                            alt={currentUser.name}
                        />
                        <span className="hidden md:inline">{currentUser.name}</span>
                        <ChevronDownIcon className={`w-5 h-5 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isMenuOpen && (
                        <div className="absolute right-0 w-48 mt-2 py-2 bg-white rounded-md shadow-lg z-20">
                            <Link to="/" className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                Quay lại trang chủ
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
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

export default AdminHeader;
