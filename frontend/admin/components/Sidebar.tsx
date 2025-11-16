

import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
    ChartBarIcon, UsersIcon, ServicesIcon, AppointmentsIcon, PaymentsIcon, StaffIcon,
    PromotionsIcon, LoyaltyIcon, MegaphoneIcon, ReportsIcon, SettingsIcon,
    ChevronDownIcon, LogoIcon, NewspaperIcon, ClipboardListIcon, RoomIcon
} from '../../shared/icons';

interface SidebarProps {
    isCollapsed: boolean;
    toggleSidebar: () => void;
    isMobile?: boolean;
    closeMobileMenu?: () => void;
}

const navGroups = [
    {
        title: 'Quản lý',
        links: [
            { name: 'Tổng quan', path: '/admin/overview', icon: <ChartBarIcon className="w-5 h-5"/> },
            { name: 'Người dùng', path: '/admin/users', icon: <UsersIcon className="w-5 h-5"/> },
            { name: 'Dịch vụ', path: '/admin/services', icon: <ServicesIcon className="w-5 h-5"/> },
            { name: 'Lịch hẹn', path: '/admin/appointments', icon: <AppointmentsIcon className="w-5 h-5"/> },
            { name: 'Liệu trình điều trị', path: '/admin/treatment-courses', icon: <ClipboardListIcon className="w-5 h-5"/> },
            { name: 'Thanh toán', path: '/admin/payments', icon: <PaymentsIcon className="w-5 h-5"/> },
            { name: 'Nhân viên', path: '/admin/staff', icon: <StaffIcon className="w-5 h-5"/> },
            { name: 'Quản lý Công việc', path: '/admin/jobs', icon: <ClipboardListIcon className="w-5 h-5"/> },
            { name: 'Quản lý phòng', path: '/admin/rooms', icon: <RoomIcon className="w-5 h-5"/> },
            { name: 'Khuyến mãi', path: '/admin/promotions', icon: <PromotionsIcon className="w-5 h-5"/> },
            { name: 'Báo cáo', path: '/admin/reports', icon: <ReportsIcon className="w-5 h-5"/> },
        ]
    },
];

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, toggleSidebar, isMobile = false, closeMobileMenu }) => {
    const [openGroups, setOpenGroups] = useState<string[]>(['Quản lý']);

    const toggleGroup = (title: string) => {
        setOpenGroups(prev => 
            prev.includes(title) ? prev.filter(g => g !== title) : [...prev, title]
        );
    };

    return (
        <aside className={`flex flex-col bg-gray-800 text-gray-200 transition-all duration-300 ${isCollapsed && !isMobile ? 'w-20' : 'w-64'}`}>
            <div className="flex items-center justify-between h-20 px-4 border-b border-gray-700">
                <Link to="/admin" className="flex items-center gap-2 text-white">
                    <LogoIcon className="w-8 h-8 text-brand-primary" />
                    {!isCollapsed && <span className="text-xl font-serif font-bold">Admin</span>}
                </Link>
                {!isMobile && (
                     <button onClick={toggleSidebar} className="p-1 rounded-full hover:bg-gray-700">
                        {/* A simple icon to indicate collapse/expand */}
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
                    </button>
                )}
            </div>
            
            <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
                {navGroups.map(group => (
                    <div key={group.title}>
                        <button
                            onClick={() => toggleGroup(group.title)}
                            className={`w-full flex items-center justify-between p-2 text-sm font-semibold uppercase text-gray-400 rounded-md hover:bg-gray-700 ${isCollapsed ? 'justify-center' : ''}`}
                        >
                            {!isCollapsed && <span>{group.title}</span>}
                            {!isCollapsed && <ChevronDownIcon className={`w-5 h-5 transition-transform ${openGroups.includes(group.title) ? 'rotate-180' : ''}`} />}
                        </button>
                        <div className={`mt-1 space-y-1 overflow-hidden transition-all duration-300 ${openGroups.includes(group.title) && !isCollapsed ? 'max-h-full' : 'max-h-0'}`}>
                            {group.links.map(link => (
                                <NavLink
                                    key={link.name}
                                    to={link.path}
                                    onClick={closeMobileMenu}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors group ${
                                        isActive
                                            ? 'bg-brand-primary text-white shadow-md'
                                            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                        } ${isCollapsed ? 'justify-center' : ''}`
                                    }
                                    title={isCollapsed ? link.name : undefined}
                                >
                                    <span className="group-hover:scale-110 transition-transform">{link.icon}</span>
                                    {!isCollapsed && link.name}
                                </NavLink>
                            ))}
                        </div>
                         {isCollapsed && openGroups.includes(group.title) && (
                            <div className="mt-1 space-y-1">
                                {group.links.map(link => (
                                    <NavLink key={link.name} to={link.path} onClick={closeMobileMenu} className={({ isActive }) => `flex justify-center items-center p-3 rounded-md transition-colors group ${isActive ? 'bg-brand-primary text-white' : 'text-gray-300 hover:bg-gray-700'}`} title={link.name}>
                                        <span className="group-hover:scale-110 transition-transform">{link.icon}</span>
                                    </NavLink>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </nav>
        </aside>
    );
};

export default Sidebar;