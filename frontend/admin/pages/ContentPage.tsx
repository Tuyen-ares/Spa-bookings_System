
// admin/pages/ContentPage.tsx
import React, { useState, useMemo } from 'react';
import type { InternalNews, User } from '../../types';
import AddEditNewsModal from '../components/AddEditNewsModal';
import { PlusIcon, EditIcon, TrashIcon, NewspaperIcon } from '../../shared/icons';
import * as apiService from '../../client/services/apiService';

interface ContentPageProps {
    currentUser: User;
    allInternalNews: InternalNews[];
    setAllInternalNews: React.Dispatch<React.SetStateAction<InternalNews[]>>;
    allUsers: User[];
}

const ContentPage: React.FC<ContentPageProps> = ({ currentUser, allInternalNews, setAllInternalNews, allUsers }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingNews, setEditingNews] = useState<InternalNews | null>(null);
    const [toast, setToast] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' });

    const sortedNews = useMemo(() => {
        return [...allInternalNews].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [allInternalNews]);

    const handleAddNews = () => {
        setEditingNews(null);
        setIsModalOpen(true);
    };

    const handleEditNews = (news: InternalNews) => {
        setEditingNews(news);
        setIsModalOpen(true);
    };

    const handleSaveNews = async (newsData: InternalNews) => {
        try {
            if (editingNews) {
                const updatedNews = await apiService.updateInternalNews(newsData.id, newsData);
                setAllInternalNews(prev => prev.map(n => n.id === updatedNews.id ? updatedNews : n));
                setToast({ visible: true, message: `Cập nhật tin "${updatedNews.title}" thành công!` });
            } else {
                const newNews = await apiService.createInternalNews({ ...newsData, authorId: currentUser.id });
                setAllInternalNews(prev => [newNews, ...prev]);
                setToast({ visible: true, message: `Đã thêm tin "${newNews.title}" thành công!` });
            }
        } catch (err: any) {
            console.error("Error saving news:", err);
            setToast({ visible: true, message: `Lưu tin thất bại: ${err.message}` });
        } finally {
            setIsModalOpen(false);
            setTimeout(() => setToast({ visible: false, message: '' }), 4000);
        }
    };

    const handleDeleteNews = async (newsId: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
            try {
                await apiService.deleteInternalNews(newsId);
                setAllInternalNews(prev => prev.filter(n => n.id !== newsId));
                setToast({ visible: true, message: 'Đã xóa bài viết thành công!' });
            } catch (err: any) {
                console.error("Error deleting news:", err);
                setToast({ visible: true, message: `Xóa bài viết thất bại: ${err.message}` });
            } finally {
                setTimeout(() => setToast({ visible: false, message: '' }), 4000);
            }
        }
    };
    
    const getPriorityBadge = (priority: 'low' | 'medium' | 'high') => {
        const styles = {
            low: 'bg-blue-100 text-blue-800',
            medium: 'bg-yellow-100 text-yellow-800',
            high: 'bg-red-100 text-red-800',
        };
        const text = {
            low: 'Thấp',
            medium: 'Trung bình',
            high: 'Cao',
        };
        return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[priority]}`}>{text[priority]}</span>;
    };

    return (
        <div>
            {isModalOpen && (
                <AddEditNewsModal
                    newsItem={editingNews}
                    currentUser={currentUser}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveNews}
                />
            )}

            {toast.visible && (
                <div className="fixed top-24 right-6 bg-green-500 text-white p-4 rounded-lg shadow-lg z-[100] animate-fadeInDown">
                    {toast.message}
                </div>
            )}

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                    <NewspaperIcon className="w-8 h-8 text-brand-primary" />
                    Quản lý Nội dung & Tin tức
                </h1>
                <button onClick={handleAddNews} className="flex items-center justify-center gap-2 bg-brand-primary text-white font-semibold p-3 rounded-lg hover:bg-brand-dark transition-colors">
                    <PlusIcon className="w-5 h-5" /> Thêm bài viết mới
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                <table className="w-full whitespace-nowrap">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr className="text-left text-sm font-semibold text-gray-600">
                            <th className="p-4">Tiêu đề</th>
                            <th className="p-4">Tác giả</th>
                            <th className="p-4">Ngày đăng</th>
                            <th className="p-4">Độ ưu tiên</th>
                            <th className="p-4">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedNews.length > 0 ? (
                            sortedNews.map(news => {
                                const author = allUsers.find(u => u.id === news.authorId);
                                return (
                                    <tr key={news.id} className="border-b border-gray-200 hover:bg-gray-50">
                                        <td className="p-4 max-w-sm">
                                            <p className="font-semibold text-gray-800 truncate" title={news.title}>{news.title}</p>
                                        </td>
                                        <td className="p-4 text-sm text-gray-600">{author?.name || 'Không rõ'}</td>
                                        <td className="p-4 text-sm text-gray-600">{new Date(news.date).toLocaleDateString('vi-VN')}</td>
                                        <td className="p-4">{getPriorityBadge(news.priority)}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => handleEditNews(news)} className="p-2 text-gray-500 hover:text-green-600" title="Chỉnh sửa"><EditIcon className="w-5 h-5" /></button>
                                                <button onClick={() => handleDeleteNews(news.id)} className="p-2 text-gray-500 hover:text-red-600" title="Xóa"><TrashIcon className="w-5 h-5" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={5} className="text-center p-8 text-gray-500">
                                    Chưa có bài viết nào. Bắt đầu bằng cách thêm một bài viết mới!
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ContentPage;
