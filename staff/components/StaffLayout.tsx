import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import StaffSidebar from './StaffSidebar';
import StaffHeader from './StaffHeader';
import type { User } from '../../types';

interface StaffLayoutProps {
    currentUser: User;
    onLogout: () => void;
}

const StaffLayout: React.FC<StaffLayoutProps> = ({ currentUser, onLogout }) => {
    const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    const toggleDesktopSidebar = () => setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed);
    const toggleMobileSidebar = () => setIsMobileSidebarOpen(!isMobileSidebarOpen);

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900 font-sans">
            {/* Desktop Sidebar */}
            <div className="hidden lg:flex flex-shrink-0">
                <StaffSidebar 
                    isCollapsed={isDesktopSidebarCollapsed} 
                    toggleSidebar={toggleDesktopSidebar} 
                    currentUser={currentUser} 
                />
            </div>

            {/* Mobile Sidebar Overlay */}
            <div className={`fixed inset-0 z-40 flex lg:hidden transition-transform duration-300 ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                 <StaffSidebar 
                    isCollapsed={false} 
                    toggleSidebar={() => {}} 
                    isMobile={true} 
                    closeMobileMenu={toggleMobileSidebar}
                    currentUser={currentUser}
                 />
                <div className="flex-1 bg-black/50" onClick={toggleMobileSidebar} aria-hidden="true"></div>
            </div>
            
            <div className="flex-1 flex flex-col overflow-hidden">
                <StaffHeader 
                    currentUser={currentUser} 
                    onLogout={onLogout} 
                    toggleMobileSidebar={toggleMobileSidebar} 
                />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900">
                    <div className="container mx-auto px-6 py-8">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default StaffLayout;
