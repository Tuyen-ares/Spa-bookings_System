import React, { useState, useEffect, useRef } from 'react';
import type { InternalNotification, User } from '../../types';
import * as apiService from '../../client/services/apiService';
import { 
    BellIcon, 
    CalendarIcon, 
    CheckCircleIcon, 
    XCircleIcon,
    TrashIcon
} from '../../shared/icons';

interface StaffNotificationBellProps {
    currentUser: User | null;
}

export const StaffNotificationBell: React.FC<StaffNotificationBellProps> = ({ currentUser }) => {
    const [notifications, setNotifications] = useState<InternalNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Real-time polling
    useEffect(() => {
        if (currentUser) {
            loadNotifications();
            loadUnreadCount();
            
            const interval = setInterval(() => {
                loadUnreadCount();
                if (isOpen) {
                    loadNotifications();
                }
            }, 10000); // Poll every 10s
            
            return () => clearInterval(interval);
        }
    }, [currentUser, isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const loadNotifications = async () => {
        if (!currentUser) return;
        try {
            const data = await apiService.getInternalNotifications(currentUser.id);
            setNotifications(data);
            const unread = data.filter(n => !n.isRead).length;
            setUnreadCount(unread);
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    };

    const loadUnreadCount = async () => {
        if (!currentUser) return;
        try {
            const { count } = await apiService.getUnreadCount(currentUser.id);
            setUnreadCount(count);
        } catch (error) {
            console.error('Error loading unread count:', error);
        }
    };

    const handleMarkRead = async (id: string) => {
        try {
            setNotifications(prev =>
                prev.map(notif => notif.id === id ? { ...notif, isRead: true } : notif)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
            
            await apiService.markNotificationAsRead(id);
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const handleMarkAllRead = async () => {
        if (!currentUser) return;
        try {
            setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
            setUnreadCount(0);
            await apiService.markAllNotificationsRead(currentUser.id);
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            setNotifications(prev => prev.filter(notif => notif.id !== id));
            await apiService.deleteNotification(id);
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const formatTime = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '';
        
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Vừa xong';
        if (minutes < 60) return `${minutes} phút trước`;
        if (hours < 24) return `${hours} giờ trước`;
        if (days < 7) return `${days} ngày trước`;
        return date.toLocaleDateString('vi-VN');
    };

    const getTypeConfig = (type: string) => {
        switch (type) {
            case 'appointment_assigned':
            case 'shift_assigned':
                return { icon: <CalendarIcon className="w-5 h-5" />, color: 'text-blue-600', bg: 'bg-blue-100' };
            case 'appointment_cancelled':
                return { icon: <XCircleIcon className="w-5 h-5" />, color: 'text-red-600', bg: 'bg-red-100' };
            case 'appointment_completed':
                return { icon: <CheckCircleIcon className="w-5 h-5" />, color: 'text-green-600', bg: 'bg-green-100' };
            default:
                return { icon: <BellIcon className="w-5 h-5" />, color: 'text-gray-600', bg: 'bg-gray-100' };
        }
    };

    const getNotificationTitle = (type: string) => {
        switch (type) {
            case 'appointment_assigned': return 'Phân công lịch hẹn';
            case 'shift_assigned': return 'Phân công ca làm';
            case 'appointment_cancelled': return 'Lịch hẹn bị hủy';
            case 'appointment_completed': return 'Hoàn thành lịch hẹn';
            default: return 'Thông báo';
        }
    };

    const handleBellClick = () => {
        setIsOpen(!isOpen);
        if (!isOpen && unreadCount > 0) {
            handleMarkAllRead();
        }
    };

    if (!currentUser) return null;

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={handleBellClick}
                className="relative p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none rounded-full"
                aria-label="Thông báo"
            >
                <BellIcon className="h-6 w-6"/>
                {unreadCount > 0 && (
                    <>
                        <span className="absolute top-0 right-0 h-2 w-2 mt-1 mr-2 bg-red-500 rounded-full"></span>
                        <span className="absolute top-0 right-0 h-2 w-2 mt-1 mr-2 bg-red-500 rounded-full animate-ping"></span>
                    </>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-4 w-[400px] bg-white dark:bg-gray-800 rounded-2xl shadow-soft-xl ring-1 ring-black/5 z-50 overflow-hidden animate-fadeIn origin-top-right">
                    {/* Header */}
                    <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-between items-center sticky top-0 z-10">
                        <h3 className="font-serif font-bold text-gray-900 dark:text-gray-100 text-lg">Thông báo</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-xs font-medium text-brand-primary hover:text-brand-dark hover:underline transition-colors"
                            >
                                Đánh dấu đã đọc
                            </button>
                        )}
                    </div>

                    {/* List */}
                    <div className="max-h-[450px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                                <div className="w-16 h-16 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                                    <BellIcon className="w-8 h-8 text-gray-300" />
                                </div>
                                <p className="text-gray-800 dark:text-gray-200 font-medium">Không có thông báo nào</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Bạn sẽ thấy các cập nhật mới tại đây.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50 dark:divide-gray-700">
                                {notifications.map((notif) => {
                                    const style = getTypeConfig(notif.type);
                                    return (
                                        <div
                                            key={notif.id}
                                            onClick={() => handleMarkRead(notif.id)}
                                            className={`group relative p-4 transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer flex gap-4 ${
                                                !notif.isRead ? 'bg-brand-primary/5 dark:bg-brand-primary/10' : 'bg-white dark:bg-gray-800'
                                            }`}
                                        >
                                            {/* Icon Box */}
                                            <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${style.bg} ${style.color}`}>
                                                {style.icon}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start gap-2 mb-1">
                                                    <h4 className={`text-sm ${!notif.isRead ? 'font-bold text-gray-900 dark:text-gray-100' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                                                        {getNotificationTitle(notif.type)}
                                                    </h4>
                                                    <span className="text-[10px] text-gray-400 flex-shrink-0 whitespace-nowrap">
                                                        {formatTime(notif.date)}
                                                    </span>
                                                </div>
                                                
                                                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">
                                                    {notif.message}
                                                </p>
                                            </div>

                                            {/* Status Indicator & Delete */}
                                            <div className="flex flex-col justify-between items-end pl-2">
                                                {!notif.isRead && (
                                                    <span className="w-2 h-2 bg-brand-primary rounded-full mb-2"></span>
                                                )}
                                                
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(notif.id);
                                                    }}
                                                    className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-all opacity-0 group-hover:opacity-100"
                                                    title="Xóa thông báo"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
