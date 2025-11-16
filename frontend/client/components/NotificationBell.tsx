import React, { useState, useEffect, useCallback } from 'react';
import type { Notification, User } from '../../types';
import * as apiService from '../services/apiService';

interface NotificationBellProps {
    currentUser: User | null;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ currentUser }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Real-time polling - check every 5 seconds when app is active
    useEffect(() => {
        if (currentUser && isOpen) {
            // Load immediately when dropdown opens
            loadNotifications();
            loadUnreadCount();
            
            // Poll every 5 seconds while dropdown is open
            const interval = setInterval(() => {
                loadUnreadCount();
                if (isOpen) {
                    loadNotifications();
                }
            }, 5000);
            
            return () => clearInterval(interval);
        }
    }, [currentUser, isOpen]);

    const loadNotifications = async () => {
        if (!currentUser) return;
        try {
            setLoading(true);
            const data = await apiService.getNotifications(currentUser.id);
            setNotifications(data);
            // Update unread count based on loaded notifications
            const unread = data.filter(n => !n.isRead).length;
            setUnreadCount(unread);
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
            
            // Update local state immediately (don't wait for API)
            setNotifications(prev =>
                prev.map(notif =>
                    notif.id === id ? { ...notif, isRead: true } : notif
                )
            );
            
            // Update unread count immediately
            setUnreadCount(prev => Math.max(0, prev - 1));
            
            // Reload in background to ensure sync
            loadNotifications();
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const handleMarkAllRead = async () => {
        if (!currentUser) return;
        try {
            await apiService.markAllNotificationsRead(currentUser.id);
            
            // Update local state immediately
            setNotifications(prev =>
                prev.map(notif => ({ ...notif, isRead: true }))
            );
            setUnreadCount(0);
            
            // Reload in background
            loadNotifications();
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await apiService.deleteNotification(id);
            
            // Update local state immediately
            setNotifications(prev => prev.filter(notif => notif.id !== id));
            
            // Reload in background
            loadNotifications();
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
                return '🔔';
            case 'appointment_confirmed':
                return '✅';
            case 'appointment_cancelled':
                return '❌';
            case 'appointment_reminder':
                return '⏰';
            case 'treatment_course_reminder':
                return '📅';
            case 'promotion':
                return '🎁';
            case 'payment_success':
                return '💳';
            case 'payment_received':
                return '💰';
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
                }}
                className="relative p-2 text-gray-700 hover:text-amber-600 transition"
                title="Thông báo"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="font-bold text-gray-800">Thông báo ({unreadCount})</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                            >
                                Đánh dấu tất cả là đã đọc
                            </button>
                        )}
                    </div>

                    <div className="overflow-y-auto flex-1">
                        {loading ? (
                            <div className="p-4 text-center text-gray-500">Đang tải...</div>
                        ) : notifications.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">Không có thông báo</div>
                        ) : (
                            notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    onClick={() => handleMarkRead(notif.id)}
                                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer ${
                                        !notif.isRead ? 'bg-blue-50' : ''
                                    }`}
                                >
                                    <div className="flex gap-3">
                                        <span className="text-2xl flex-shrink-0">{getIcon(notif.type)}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start gap-2">
                                                <div className="flex-1">
                                                    <h4 className="font-semibold text-sm text-gray-800 break-words">
                                                        {notif.title}
                                                    </h4>
                                                </div>
                                                {!notif.isRead && (
                                                    <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1 break-words">{notif.message}</p>
                                            <div className="flex justify-between items-center mt-2">
                                                <span className="text-xs text-gray-400">
                                                    {formatTime(notif.createdAt)}
                                                </span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(notif.id);
                                                    }}
                                                    className="text-gray-400 hover:text-red-500 transition"
                                                    title="Xóa"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
