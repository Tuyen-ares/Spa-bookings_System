
import React, { useState, useMemo } from 'react';
import type { User, InternalNotification, InternalNews } from '../../types';

// Icons
// FIX: Replaced `MailOpenIcon` with the available `MailIcon` to resolve import error.
import { MailIcon, BellIcon, NewspaperIcon, CheckIcon, CalendarCheckIcon } from '../../shared/icons';


interface StaffNotificationsPageProps {
    currentUser: User;
    allUsers: User[];
    allInternalNotifications: InternalNotification[];
    allInternalNews: InternalNews[];
}

export const StaffNotificationsPage: React.FC<StaffNotificationsPageProps> = ({ currentUser, allUsers, allInternalNotifications, allInternalNews }) => {
    const [activeTab, setActiveTab] = useState<'notifications' | 'news'>('notifications');
    const [notifications, setNotifications] = useState<InternalNotification[]>(allInternalNotifications);
    const [news, setNews] = useState<InternalNews[]>(allInternalNews);

    const filteredNotifications = useMemo(() => {
        return notifications
            .filter(notif => notif.recipientId === currentUser.id || notif.recipientType === 'all')
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [notifications, currentUser.id]);

    const filteredNews = useMemo(() => {
        return news
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [news]);

    const handleMarkAsRead = (id: string) => {
        setNotifications(prev =>
            prev.map(notif => (notif.id === id ? { ...notif, isRead: true } : notif))
        );
    };

    const getPriorityColor = (priority: InternalNews['priority']) => {
        switch (priority) {
            case 'high': return 'bg-red-500';
            case 'medium': return 'bg-yellow-500';
            case 'low': return 'bg-blue-500';
            default: return 'bg-gray-500';
        }
    };

    const getNotificationTypeIcon = (type: InternalNotification['type']) => {
        switch (type) {
            case 'appointment_new':
            case 'appointment_cancelled':
                return <CalendarCheckIcon className="w-5 h-5 text-blue-500" />;
            case 'shift_change':
                return <BellIcon className="w-5 h-5 text-orange-500" />;
            case 'admin_message':
            case 'system_news':
                return <NewspaperIcon className="w-5 h-5 text-purple-500" />;
            case 'promo_alert':
                return <BellIcon className="w-5 h-5 text-green-500" />;
            case 'client_feedback':
                return <MailIcon className="w-5 h-5 text-pink-500" />;
            default:
                return <BellIcon className="w-5 h-5 text-gray-500" />;
        }
    };


    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Thông báo & Tin nội bộ</h1>
            <p className="text-gray-600 mb-8">Xem các thông báo cá nhân và tin tức từ quản lý.</p>

            <div className="mb-8 flex justify-start border-b border-gray-200">
                <button onClick={() => setActiveTab('notifications')} className={`px-6 py-3 font-medium text-lg transition-colors flex items-center gap-2 ${activeTab === 'notifications' ? 'border-b-2 border-brand-primary text-brand-dark' : 'text-gray-500 hover:text-brand-dark'}`}>
                    <BellIcon className="w-5 h-5" /> Thông báo cá nhân
                </button>
                <button onClick={() => setActiveTab('news')} className={`px-6 py-3 font-medium text-lg transition-colors flex items-center gap-2 ${activeTab === 'news' ? 'border-b-2 border-brand-primary text-brand-dark' : 'text-gray-500 hover:text-brand-dark'}`}>
                    <NewspaperIcon className="w-5 h-5" /> Tin tức nội bộ
                </button>
            </div>

            {activeTab === 'notifications' && (
                <div className="space-y-6">
                    {filteredNotifications.length > 0 ? (
                        filteredNotifications.map(notif => (
                            <div key={notif.id} className={`bg-white p-6 rounded-lg shadow-md flex items-start gap-4 ${notif.isRead ? 'opacity-70' : 'border-l-4 border-brand-primary'}`}>
                                <div className="flex-shrink-0">
                                    {getNotificationTypeIcon(notif.type)}
                                </div>
                                <div className="flex-1">
                                    <p className={`font-semibold text-gray-800 ${notif.isRead ? '' : 'text-brand-dark'}`}>{notif.message}</p>
                                    <p className="text-sm text-gray-500 mt-1">{new Date(notif.date).toLocaleString('vi-VN')}</p>
                                    {notif.link && !notif.isRead && (
                                        <a href={notif.link} className="text-blue-600 hover:underline text-sm mt-2 block">
                                            Xem chi tiết
                                        </a>
                                    )}
                                </div>
                                {!notif.isRead && (
                                    <button
                                        onClick={() => handleMarkAsRead(notif.id)}
                                        className="flex-shrink-0 px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors flex items-center gap-1"
                                    >
                                        <CheckIcon className="w-3 h-3" /> Đã đọc
                                    </button>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 bg-white rounded-lg shadow-md">
                            <p className="text-lg text-gray-500">Bạn không có thông báo cá nhân nào.</p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'news' && (
                <div className="space-y-6">
                    {filteredNews.length > 0 ? (
                        filteredNews.map(newsItem => (
                            <div key={newsItem.id} className="bg-white p-6 rounded-lg shadow-md border-t-4 border-blue-400">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-xl font-bold text-gray-800">{newsItem.title}</h3>
                                    <span className={`px-3 py-1 text-xs font-semibold rounded-full text-white ${getPriorityColor(newsItem.priority)}`}>
                                        {newsItem.priority === 'high' ? 'Ưu tiên cao' : newsItem.priority === 'medium' ? 'Trung bình' : 'Thấp'}
                                    </span>
                                </div>
                                <p className="text-gray-700 leading-relaxed mb-4">{newsItem.content}</p>
                                <div className="flex justify-between items-center text-sm text-gray-500">
                                    <p>Đăng bởi: {allUsers.find(u => u.id === newsItem.authorId)?.name || 'Quản trị viên'}</p>
                                    <p>{new Date(newsItem.date).toLocaleDateString('vi-VN')}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 bg-white rounded-lg shadow-md">
                            <p className="text-lg text-gray-500">Không có tin tức nội bộ nào.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};