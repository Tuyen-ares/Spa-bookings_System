import React, { useState, useEffect } from 'react';
import type { Notification, User } from '../../types';
import * as apiService from '../../client/services/apiService';
import { BellIcon } from '../../shared/icons';

interface AdminNotificationBellProps {
    currentUser: User | null;
}

export const AdminNotificationBell: React.FC<AdminNotificationBellProps> = ({ currentUser }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (currentUser) {
            loadNotifications();
            loadUnreadCount();
            
            // Poll for new notifications every 15 seconds (more frequent for admin)
            const interval = setInterval(() => {
                loadUnreadCount();
            }, 15000);
            
            return () => clearInterval(interval);
        }
    }, [currentUser]);

    const loadNotifications = async () => {
        if (!currentUser) return;
        try {
            setLoading(true);
            const data = await apiService.getNotifications(currentUser.id);
            setNotifications(data);
        } catch (error) {
            console.error('Error loading notifications:', error);
        } finally {
            setLoading(false);
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
            await apiService.markNotificationRead(id);
            loadNotifications();
            loadUnreadCount();
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const handleMarkAllRead = async () => {
        if (!currentUser) return;
        try {
            await apiService.markAllNotificationsRead(currentUser.id);
            loadNotifications();
            loadUnreadCount();
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await apiService.deleteNotification(id);
            loadNotifications();
            loadUnreadCount();
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
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

    const getIcon = (type: string) => {
        switch (type) {
            case 'new_appointment':
                return '📅';
            case 'appointment_confirmed':
                return '✅';
            case 'appointment_cancelled':
                return '❌';
            case 'payment_received':
                return '💰';
            case 'payment_success':
                return '💳';
            case 'new_customer':
                return '👤';
            case 'review_received':
                return '⭐';
            default:
                return '📢';
        }
    };

    if (!currentUser) return null;

    return (
        <div className="relative">
            <button
                onClick={() => {
                    setIsOpen(!isOpen);
                    if (!isOpen) loadNotifications();
                }}
                className="relative p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none rounded-full transition"
            >
                <BellIcon className="h-6 w-6"/>
                {unreadCount > 0 && (
                    <>
                        <span className="absolute top-0 right-0 h-2 w-2 mt-1 mr-2 bg-red-500 rounded-full"></span>
                        <span className="absolute top-0 right-0 h-2 w-2 mt-1 mr-2 bg-red-500 rounded-full animate-ping"></span>
                        <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 -mt-1 -mr-1 font-semibold">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    </>
                )}
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsOpen(false)}
                    />
                    
                    {/* Notification Panel */}
                    <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-[600px] overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-brand-primary to-brand-dark">
                            <h3 className="font-bold text-white text-lg">Thông báo quản trị</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllRead}
                                    className="text-sm text-white hover:text-gray-200 transition underline"
                                >
                                    Đánh dấu tất cả đã đọc
                                </button>
                            )}
                        </div>

                        <div className="overflow-y-auto flex-1">
                            {loading ? (
                                <div className="p-8 text-center text-gray-500">
                                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
                                    <p className="mt-2">Đang tải...</p>
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    <BellIcon className="h-12 w-12 mx-auto mb-2 text-gray-300"/>
                                    <p>Không có thông báo nào</p>
                                </div>
                            ) : (
                                notifications.map((notif) => (
                                    <div
                                        key={notif.id}
                                        className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer ${
                                            !notif.isRead ? 'bg-blue-50 border-l-4 border-l-brand-primary' : ''
                                        }`}
                                    >
                                        <div className="flex gap-3">
                                            <span className="text-2xl flex-shrink-0">{getIcon(notif.type)}</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start gap-2">
                                                    <h4 className={`font-semibold text-sm text-gray-800 ${!notif.isRead ? 'font-bold' : ''}`}>
                                                        {notif.title}
                                                    </h4>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(notif.id);
                                                        }}
                                                        className="text-gray-400 hover:text-red-500 transition flex-shrink-0"
                                                        title="Xóa thông báo"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{notif.message}</p>
                                                <div className="flex justify-between items-center mt-2">
                                                    <span className="text-xs text-gray-400">
                                                        {formatTime(notif.createdAt)}
                                                    </span>
                                                    {!notif.isRead && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleMarkRead(notif.id);
                                                            }}
                                                            className="text-xs text-brand-primary hover:text-brand-dark font-semibold transition"
                                                        >
                                                            Đánh dấu đã đọc
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        
                        {notifications.length > 0 && (
                            <div className="p-3 border-t border-gray-200 bg-gray-50 text-center">
                                <button 
                                    onClick={() => setIsOpen(false)}
                                    className="text-sm text-brand-primary hover:text-brand-dark font-semibold transition"
                                >
                                    Đóng
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};
