import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import type { User, StaffRole } from '../../types';
import {
    DashboardIcon, CalendarIcon, AppointmentsIcon, TreatmentIcon,
    CustomerInteractionIcon, RewardsIcon, UpsellingIcon, ReportsIcon,
    // FIX: Replaced NotificationsIcon with BellIcon as it's the correct icon for notifications.
    BellIcon, ProfileIcon, TransactionHistoryIcon,
    ChevronDoubleLeftIcon, ChevronDoubleRightIcon, LogoIcon, ChevronDownIcon,
    ClipboardListIcon,
    UsersIcon
} from '../../shared/icons';

interface StaffSidebarProps {
    isCollapsed: boolean;
    toggleSidebar: () => void;
    currentUser: User;
    isMobile?: boolean;
    closeMobileMenu?: () => void;
}

const getNavGroups = (staffRole: StaffRole | 'Admin') => {
    const allLinks = [
        // Group: Chung
        { name: 'Tổng quan', path: '/staff/dashboard', icon: <DashboardIcon className="w-5 h-5" />, group: 'Chung' },
        { name: 'Lịch làm việc', path: '/staff/schedule', icon: <CalendarIcon className="w-5 h-5" />, group: 'Chung' },
        { name: 'Lịch hẹn cá nhân', path: '/staff/appointments', icon: <AppointmentsIcon className="w-5 h-5" />, group: 'Chung' },
        // FIX: Replaced ClipboardDocumentListIcon with ClipboardListIcon as it's available in shared/icons.tsx.
        { name: 'Công việc của tôi', path: '/staff/my-tasks', icon: <ClipboardListIcon className="w-5 h-5" />, group: 'Chung' },
        // FIX: Replaced NotificationsIcon with BellIcon to match available icons.
        { name: 'Thông báo & Tin nội bộ', path: '/staff/notifications', icon: <BellIcon className="w-5 h-5" />, group: 'Chung' },

        // Group: Nghiệp vụ
        { name: 'Liệu trình khách hàng', path: '/staff/treatment-progress', icon: <TreatmentIcon className="w-5 h-5" />, roles: ['Technician', 'Manager', 'Admin'], group: 'Nghiệp vụ' },
        { name: 'Khách hàng của tôi', path: '/staff/my-clients', icon: <UsersIcon className="w-5 h-5" />, group: 'Nghiệp vụ' },
        { name: 'Tư vấn KH', path: '/staff/customer-interaction', icon: <CustomerInteractionIcon className="w-5 h-5" />, group: 'Nghiệp vụ' },
        { name: 'Bán thêm sản phẩm', path: '/staff/upselling', icon: <UpsellingIcon className="w-5 h-5" />, roles: ['Technician', 'Manager', 'Admin'], group: 'Nghiệp vụ' },

        // Group: Hiệu suất
        { name: 'Điểm thưởng cá nhân', path: '/staff/rewards', icon: <RewardsIcon className="w-5 h-5" />, roles: ['Technician', 'Manager', 'Admin'], group: 'Hiệu suất' },
        { name: 'Thống kê cá nhân', path: '/staff/personal-reports', icon: <ReportsIcon className="w-5 h-5" />, roles: ['Technician', 'Manager', 'Admin'], group: 'Hiệu suất' },
        { name: 'Lịch sử giao dịch', path: '/staff/transaction-history', icon: <TransactionHistoryIcon className="w-5 h-5" />, roles: ['Technician', 'Manager', 'Admin'], group: 'Hiệu suất' },

        // Group: Tài khoản
        { name: 'Hồ sơ cá nhân', path: '/staff/profile', icon: <ProfileIcon className="w-5 h-5" />, group: 'Tài khoản' },
    ];

    const visibleLinks = allLinks.filter(link => !link.roles || link.roles.includes(staffRole));

    const groups = visibleLinks.reduce((acc, link) => {
        acc[link.group] = acc[link.group] || [];
        acc[link.group].push(link);
        return acc;
    }, {} as Record<string, typeof visibleLinks>);

    return Object.entries(groups).map(([title, links]) => ({ title, links }));
};


const StaffSidebar: React.FC<StaffSidebarProps> = ({ isCollapsed, toggleSidebar, currentUser, isMobile = false, closeMobileMenu }) => {
    // Note: staffRole field removed from users table in db.txt
    // Default to 'Technician' for all Staff since we can't determine their specific role
    const role: StaffRole | 'Admin' = currentUser.role === 'Admin' ? 'Admin' : 'Technician';
    const navGroups = getNavGroups(role);
    const [openGroups, setOpenGroups] = useState<string[]>(['Chung', 'Nghiệp vụ', 'Hiệu suất', 'Tài khoản']);

    const toggleGroup = (title: string) => {
        setOpenGroups(prev =>
            prev.includes(title) ? prev.filter(g => g !== title) : [...prev, title]
        );
    };

    return (
        <aside className={`flex flex-col bg-slate-800 text-gray-200 dark:bg-gray-900 dark:border-r dark:border-gray-800 transition-all duration-300 ${isCollapsed && !isMobile ? 'w-20' : 'w-64'}`}>
            <div className="flex items-center justify-between h-20 px-4 border-b border-slate-700 dark:border-gray-800">
                <Link to="/staff" className="flex items-center gap-2 text-white">
                    <LogoIcon className="w-8 h-8 text-brand-primary" />
                    {!isCollapsed && <span className="text-xl font-serif font-bold">Staff Portal</span>}
                </Link>
                {!isMobile && (
                    <button onClick={toggleSidebar} className="p-1 rounded-full text-gray-400 hover:bg-slate-700 dark:hover:bg-gray-700">
                        {isCollapsed ? <ChevronDoubleRightIcon className="w-5 h-5" /> : <ChevronDoubleLeftIcon className="w-5 h-5" />}
                    </button>
                )}
            </div>

            <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
                {navGroups.map(group => (
                    <div key={group.title}>
                        <button
                            onClick={() => toggleGroup(group.title)}
                            className={`w-full flex items-center justify-between p-2 text-xs font-semibold uppercase text-gray-400 rounded-md hover:bg-slate-700 dark:hover:bg-gray-700 ${isCollapsed ? 'justify-center' : ''}`}
                        >
                            {!isCollapsed && <span>{group.title}</span>}
                            {!isCollapsed && <ChevronDownIcon className={`w-4 h-4 transition-transform ${openGroups.includes(group.title) ? 'rotate-180' : ''}`} />}
                        </button>
                        <div className={`mt-1 space-y-1 overflow-hidden transition-all duration-300 ${openGroups.includes(group.title) && !isCollapsed ? 'max-h-96' : 'max-h-0'}`}>
                            {group.links.map(link => (
                                <NavLink
                                    key={link.name}
                                    to={link.path}
                                    onClick={closeMobileMenu}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors group ${isActive
                                            ? 'bg-brand-primary text-white shadow-md'
                                            : 'text-gray-300 hover:bg-slate-700 dark:hover:bg-gray-700 hover:text-white'
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
                                    <NavLink key={link.name} to={link.path} onClick={closeMobileMenu} className={({ isActive }) => `flex justify-center items-center p-3 rounded-md transition-colors group ${isActive ? 'bg-brand-primary text-white' : 'text-gray-300 hover:bg-slate-700 dark:hover:bg-gray-700'}`} title={link.name}>
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

export default StaffSidebar;
