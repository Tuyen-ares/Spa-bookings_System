
import React, { useState, useEffect, useMemo } from 'react';
import type { Notification, User } from '../../types';
import * as apiService from '../../client/services/apiService';
import { BellIcon, TrashIcon } from '../../shared/icons';

interface NotificationsPageProps {
    currentUser: User;
}

const NotificationsPage: React.FC<NotificationsPageProps> = ({ currentUser }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const notificationsPerPage = 20;

    useEffect(() => {
        if (currentUser) {
            loadNotifications();
            
            // Poll for new notifications every 30 seconds
            const interval = setInterval(() => {
                loadNotifications();
            }, 30000);
            
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

    const handleMarkRead = async (id: string) => {
        try {
            await apiService.markNotificationRead(id);
            loadNotifications();
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const handleMarkAllRead = async () => {
        if (!currentUser) return;
        try {
            await apiService.markAllNotificationsRead(currentUser.id);
            loadNotifications();
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Bạn có chắc muốn xóa thông báo này?')) return;
        try {
            await apiService.deleteNotification(id);
            loadNotifications();
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const handleDeleteAll = async () => {
        if (!window.confirm('Bạn có chắc muốn xóa tất cả thông báo đã đọc?')) return;
        try {
            const readNotifications = filteredNotifications.filter(n => n.isRead);
            for (const notif of readNotifications) {
                await apiService.deleteNotification(notif.id);
            }
            loadNotifications();
        } catch (error) {
            console.error('Error deleting all read notifications:', error);
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
        return date.toLocaleDateString('vi-VN', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'new_appointment':
                return '📅';
            case 'appointment_confirmed':
                return '✅';
            case 'appointment_cancelled':
                return '❌';
            case 'appointment_reminder':
                return '⏰';
            case 'payment_received':
                return '💰';
            case 'payment_success':
                return '💳';
            case 'treatment_course_reminder':
                return '💊';
            case 'promotion':
                return '🎁';
            case 'system':
                return '📢';
            default:
                return '🔔';
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'new_appointment': return 'Lịch hẹn mới';
            case 'appointment_confirmed': return 'Xác nhận lịch hẹn';
            case 'appointment_cancelled': return 'Hủy lịch hẹn';
            case 'appointment_reminder': return 'Nhắc nhở lịch hẹn';
            case 'payment_received': return 'Thanh toán';
            case 'payment_success': return 'Thanh toán thành công';
            case 'treatment_course_reminder': return 'Nhắc nhở liệu trình';
            case 'promotion': return 'Khuyến mãi';
            case 'system': return 'Hệ thống';
            default: return 'Thông báo';
        }
    };

    // Filter notifications
    const filteredNotifications = useMemo(() => {
        let filtered = notifications;

        // Filter by read/unread status
        if (filter === 'unread') {
            filtered = filtered.filter(n => !n.isRead);
        } else if (filter === 'read') {
            filtered = filtered.filter(n => n.isRead);
        }

        // Filter by type
        if (typeFilter !== 'all') {
            filtered = filtered.filter(n => n.type === typeFilter);
        }

        return filtered;
    }, [notifications, filter, typeFilter]);

    // Pagination
    const totalPages = Math.ceil(filteredNotifications.length / notificationsPerPage);
    const startIndex = (currentPage - 1) * notificationsPerPage;
    const endIndex = startIndex + notificationsPerPage;
    const paginatedNotifications = filteredNotifications.slice(startIndex, endIndex);

    // Get unique notification types
    const notificationTypes = useMemo(() => {
        const types = new Set(notifications.map(n => n.type));
        return Array.from(types);
    }, [notifications]);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Thông Báo</h1>
                    <p className="text-gray-600 mt-1">
                        {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Tất cả thông báo đã được đọc'}
                    </p>
                </div>
                <div className="flex gap-2">
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllRead}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                        >
                            Đánh dấu tất cả đã đọc
                        </button>
                    )}
                    <button
                        onClick={handleDeleteAll}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center gap-2"
                    >
                        <TrashIcon className="w-5 h-5" />
                        Xóa tất cả đã đọc
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Lọc theo trạng thái</label>
                        <div className="flex gap-2">
                            {(['all', 'unread', 'read'] as const).map((f) => (
                                <button
                                    key={f}
                                    onClick={() => {
                                        setFilter(f);
                                        setCurrentPage(1);
                                    }}
                                    className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                                        filter === f
                                            ? 'bg-brand-primary text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {f === 'all' ? 'Tất cả' : f === 'unread' ? 'Chưa đọc' : 'Đã đọc'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Lọc theo loại</label>
                        <select
                            value={typeFilter}
                            onChange={(e) => {
                                setTypeFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
                        >
                            <option value="all">Tất cả loại</option>
                            {notificationTypes.map(type => (
                                <option key={type} value={type}>{getTypeLabel(type)}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Notifications List */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mb-4"></div>
                        <p className="text-gray-600">Đang tải thông báo...</p>
                    </div>
                ) : paginatedNotifications.length === 0 ? (
                    <div className="p-12 text-center">
                        <BellIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-600 text-lg">Không có thông báo nào</p>
                        <p className="text-gray-500 text-sm mt-2">
                            {filter !== 'all' || typeFilter !== 'all' 
                                ? 'Thử thay đổi bộ lọc để xem thêm thông báo'
                                : 'Tất cả thông báo sẽ hiển thị ở đây'}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="divide-y divide-gray-200">
                            {paginatedNotifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    className={`p-6 hover:bg-gray-50 transition ${
                                        !notif.isRead ? 'bg-blue-50 border-l-4 border-l-brand-primary' : ''
                                    }`}
                                >
                                    <div className="flex gap-4">
                                        <div className="flex-shrink-0">
                                            <span className="text-3xl">{getIcon(notif.type)}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className={`text-lg font-semibold text-gray-800 ${!notif.isRead ? 'font-bold' : ''}`}>
                                                            {notif.title}
                                                        </h3>
                                                        {!notif.isRead && (
                                                            <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                                                                Mới
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-600 mb-2">{notif.message}</p>
                                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                                        <span>{getTypeLabel(notif.type)}</span>
                                                        <span>•</span>
                                                        <span>{formatTime(notif.createdAt)}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {!notif.isRead && (
                                                        <button
                                                            onClick={() => handleMarkRead(notif.id)}
                                                            className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                                                        >
                                                            Đánh dấu đã đọc
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(notif.id)}
                                                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                                        title="Xóa thông báo"
                                                    >
                                                        <TrashIcon className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
                                <div className="text-sm text-gray-600">
                                    Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredNotifications.length)} trong tổng số {filteredNotifications.length} thông báo
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Trước
                                    </button>
                                    <div className="flex gap-1">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                            <button
                                                key={page}
                                                onClick={() => setCurrentPage(page)}
                                                className={`px-4 py-2 border rounded-lg ${
                                                    currentPage === page
                                                        ? 'bg-brand-primary text-white border-brand-primary'
                                                        : 'border-gray-300 hover:bg-gray-50'
                                                }`}
                                            >
                                                {page}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Sau
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default NotificationsPage;

