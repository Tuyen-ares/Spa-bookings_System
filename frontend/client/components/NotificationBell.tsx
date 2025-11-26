
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import type { InternalNotification, User } from '../../types';
import * as apiService from '../services/apiService';
import { 
    BellIcon, 
    CalendarIcon, 
    CheckCircleIcon, 
    XCircleIcon, 
    GiftIcon, 
    CurrencyDollarIcon, 
    ClockIcon,
    TrashIcon
} from '../../shared/icons';

interface NotificationBellProps {
    currentUser: User | null;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ currentUser }) => {
    const [notifications, setNotifications] = useState<InternalNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
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
            console.log('🔔 Loading notifications for user:', currentUser.id);
            const data = await apiService.getInternalNotifications(currentUser.id);
            console.log('📥 Notifications loaded:', data);
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
            // Optimistic update
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

    // Helper to get style configuration based on notification type
    const getTypeConfig = (type: string) => {
        switch (type) {
            case 'appointment_new':
            case 'appointment_confirmed':
                return { icon: <CheckCircleIcon className="w-5 h-5" />, color: 'text-green-600', bg: 'bg-green-100' };
            case 'appointment_cancelled':
                return { icon: <XCircleIcon className="w-5 h-5" />, color: 'text-red-600', bg: 'bg-red-100' };
            case 'shift_change':
            case 'appointment_reminder':
            case 'treatment_course_reminder':
                return { icon: <ClockIcon className="w-5 h-5" />, color: 'text-blue-600', bg: 'bg-blue-100' };
            case 'promo_alert':
            case 'promotion':
                return { icon: <GiftIcon className="w-5 h-5" />, color: 'text-purple-600', bg: 'bg-purple-100' };
            case 'payment_success':
            case 'payment_received':
                return { icon: <CurrencyDollarIcon className="w-5 h-5" />, color: 'text-emerald-600', bg: 'bg-emerald-100' };
            case 'new_appointment':
                return { icon: <CalendarIcon className="w-5 h-5" />, color: 'text-brand-primary', bg: 'bg-brand-secondary/30' };
            case 'admin_message':
            case 'system_news':
            case 'client_feedback':
            default:
                return { icon: <BellIcon className="w-5 h-5" />, color: 'text-gray-600', bg: 'bg-gray-100' };
        }
    };

    const getNotificationTitle = (type: string) => {
        switch (type) {
            case 'appointment_confirmed': return 'Lịch hẹn đã xác nhận';
            case 'appointment_new': return 'Lịch hẹn mới';
            case 'appointment_cancelled': return 'Lịch hẹn bị hủy';
            case 'appointment_reminder': return 'Nhắc nhở lịch hẹn';
            case 'treatment_course_reminder': return 'Nhắc nhở liệu trình';
            case 'promotion':
            case 'promo_alert': return 'Ưu đãi mới';
            case 'payment_success': return 'Thanh toán thành công';
            case 'payment_received': return 'Đã nhận thanh toán';
            case 'shift_change': return 'Thay đổi ca làm việc';
            case 'admin_message': return 'Tin nhắn từ quản trị';
            case 'system_news': return 'Tin tức hệ thống';
            case 'client_feedback': return 'Phản hồi khách hàng';
            default: return 'Thông báo';
        }
    };

    if (!currentUser) return null;

    const handleBellClick = () => {
        setIsOpen(!isOpen);
        // Khi mở thông báo lần đầu, đánh dấu tất cả đã đọc
        if (!isOpen && unreadCount > 0) {
            handleMarkAllRead();
        }
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={handleBellClick}
                className={`relative p-2.5 rounded-full transition-all duration-300 group ${
                    isOpen ? 'bg-brand-primary text-white shadow-md' : 'text-gray-500 hover:bg-gray-100 hover:text-brand-dark'
                }`}
                aria-label="Thông báo"
            >
                <div className={`${unreadCount > 0 ? 'animate-wiggle' : ''}`}>
                    <BellIcon className="w-6 h-6" />
                </div>
                
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 text-[10px] font-bold text-white items-center justify-center border-2 border-white">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-4 w-[400px] bg-white/95 backdrop-blur-xl rounded-2xl shadow-soft-xl ring-1 ring-black/5 z-50 overflow-hidden animate-fadeIn origin-top-right">
                    {/* Header */}
                    <div className="px-5 py-4 border-b border-gray-100 bg-white flex justify-between items-center sticky top-0 z-10">
                        <h3 className="font-serif font-bold text-brand-dark text-lg">Thông báo</h3>
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
                        {loading && notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <div className="animate-spin w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                                <span className="text-sm text-gray-500">Đang tải...</span>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                    <BellIcon className="w-8 h-8 text-gray-300" />
                                </div>
                                <p className="text-gray-800 font-medium">Không có thông báo nào</p>
                                <p className="text-sm text-gray-500 mt-1">Bạn sẽ thấy các cập nhật mới tại đây.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {notifications.map((notif) => {
                                    const style = getTypeConfig(notif.type);
                                    return (
                                        <div
                                            key={notif.id}
                                            onClick={() => handleMarkRead(notif.id)}
                                            className={`group relative p-4 transition-all duration-200 hover:bg-gray-50 cursor-pointer flex gap-4 ${
                                                !notif.isRead ? 'bg-brand-primary/5' : 'bg-white'
                                            }`}
                                        >
                                            {/* Icon Box */}
                                            <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${style.bg} ${style.color}`}>
                                                {style.icon}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start gap-2 mb-1">
                                                    <h4 className={`text-sm ${!notif.isRead ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                                                        {getNotificationTitle(notif.type)}
                                                    </h4>
                                                    <span className="text-[10px] text-gray-400 flex-shrink-0 whitespace-nowrap">
                                                        {formatTime(notif.date)}
                                                    </span>
                                                </div>
                                                
                                                <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                                                    {notif.type === 'appointment_cancelled' && notif.message.includes('Lý do:') ? (
                                                        <>
                                                            <span>{notif.message.split('Lý do:')[0].trim()}</span>
                                                            <br />
                                                            <span className="text-red-500 font-medium bg-red-50 px-1.5 py-0.5 rounded mt-1 inline-block">
                                                                Lý do: {notif.message.split('Lý do:')[1].trim()}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        notif.message
                                                    )}
                                                </p>
                                            </div>

                                            {/* Hover Action / Status Indicator */}
                                            <div className="flex flex-col justify-between items-end pl-2">
                                                {!notif.isRead && (
                                                    <span className="w-2 h-2 bg-brand-primary rounded-full mb-2"></span>
                                                )}
                                                
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(notif.id);
                                                    }}
                                                    className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100"
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
