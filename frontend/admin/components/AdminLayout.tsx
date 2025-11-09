import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import AdminHeader from './AdminHeader';
import type { User } from '../../types';

interface AdminLayoutProps {
    currentUser: User;
    onLogout: () => void;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ currentUser, onLogout }) => {
    // State for desktop sidebar collapse
    const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);
    // State for mobile sidebar visibility
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    const toggleDesktopSidebar = () => setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed);
    const toggleMobileSidebar = () => setIsMobileSidebarOpen(!isMobileSidebarOpen);

    return (
        <div className="flex h-screen bg-gray-100 font-sans">
            {/* Desktop Sidebar */}
            <div className="hidden lg:flex flex-shrink-0">
                <Sidebar isCollapsed={isDesktopSidebarCollapsed} toggleSidebar={toggleDesktopSidebar} />
            </div>

            {/* Mobile Sidebar Overlay */}
            <div className={`fixed inset-0 z-40 flex lg:hidden transition-transform duration-300 ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                 <Sidebar 
                    isCollapsed={false} 
                    toggleSidebar={() => {}} 
                    isMobile={true} 
                    closeMobileMenu={toggleMobileSidebar} 
                 />
                <div className="flex-1 bg-black/50" onClick={toggleMobileSidebar} aria-hidden="true"></div>
            </div>
            
            <div className="flex-1 flex flex-col overflow-hidden">
                <AdminHeader currentUser={currentUser} onLogout={onLogout} toggleMobileSidebar={toggleMobileSidebar} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
                    <div className="container mx-auto px-6 py-8">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
