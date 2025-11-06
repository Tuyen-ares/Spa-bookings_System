
// admin/components/AddEditNewsModal.tsx
import React, { useState, useEffect } from 'react';
import type { InternalNews, User } from '../../types';

interface AddEditNewsModalProps {
    newsItem: InternalNews | null;
    currentUser: User;
    onClose: () => void;
    onSave: (news: InternalNews) => void;
}

const AddEditNewsModal: React.FC<AddEditNewsModalProps> = ({ newsItem, currentUser, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<InternalNews>>({
        title: '',
        content: '',
        priority: 'medium',
    });

    useEffect(() => {
        if (newsItem) {
            setFormData(newsItem);
        } else {
            setFormData({
                title: '',
                content: '',
                priority: 'medium',
            });
        }
    }, [newsItem]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const dataToSave: InternalNews = {
            id: formData.id || `news-${Date.now()}`,
            title: formData.title || 'Không có tiêu đề',
            content: formData.content || '',
            authorId: newsItem ? newsItem.authorId : currentUser.id,
            date: newsItem ? newsItem.date : new Date().toISOString(),
            priority: formData.priority || 'medium',
        };
        onSave(dataToSave);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 max-h-[80vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">{newsItem ? 'Chỉnh sửa Bài viết' : 'Thêm Bài viết Mới'}</h2>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="title" className="block text-sm font-medium text-gray-700">Tiêu đề</label>
                                <input
                                    id="title"
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    className="mt-1 w-full p-2 border rounded-md"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="content" className="block text-sm font-medium text-gray-700">Nội dung</label>
                                <textarea
                                    id="content"
                                    name="content"
                                    value={formData.content}
                                    onChange={handleChange}
                                    rows={10}
                                    className="mt-1 w-full p-2 border rounded-md"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Độ ưu tiên</label>
                                <select
                                    id="priority"
                                    name="priority"
                                    value={formData.priority}
                                    onChange={handleChange}
                                    className="mt-1 w-full p-2 border rounded-md bg-white"
                                >
                                    <option value="low">Thấp</option>
                                    <option value="medium">Trung bình</option>
                                    <option value="high">Cao</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-6 py-4 flex justify-end gap-4 rounded-b-lg">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Hủy</button>
                        <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-dark">Lưu bài viết</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddEditNewsModal;
