

import React, { useState, useMemo, useEffect } from 'react';
import type { Service, ServiceCategory } from '../../types';
import * as apiService from '../../client/services/apiService';

type ServiceWithStatus = Service & { isActive: boolean };

interface AddEditServiceModalProps {
    service: ServiceWithStatus | null;
    onClose: () => void;
    onSave: (service: Partial<ServiceWithStatus>) => void;
    categories: string[];
    onUpdateCategories: (newCategoryList: string[]) => void;
}

const AddEditServiceModal: React.FC<AddEditServiceModalProps> = ({ service, onClose, onSave, categories, onUpdateCategories }) => {
    const [formData, setFormData] = useState<Partial<ServiceWithStatus>>(service || {
        name: '', price: 0, duration: 30, category: categories[0] || '',
        description: '', longDescription: '', imageUrl: '', isActive: true,
        rating: 0, reviewCount: 0, isHot: false, isNew: false,
    });
    const [imagePreview, setImagePreview] = useState<string>(service?.imageUrl || '');
    const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryError, setNewCategoryError] = useState('');
    const [formError, setFormError] = useState('');

    useEffect(() => {
        const defaultCategory = categories.length > 0 ? categories[0] : '';
        if (service) {
            setFormData({ ...service });
            setImagePreview(service.imageUrl || '');
        } else {
            setFormData({
                name: '', price: 0, duration: 30, category: defaultCategory,
                description: '', longDescription: '', imageUrl: '', isActive: true,
                rating: 0, reviewCount: 0, isHot: false, isNew: false,
            });
            setImagePreview('');
        }
        setShowNewCategoryInput(false);
        setNewCategoryName('');
        setNewCategoryError('');
        setFormError('');
    }, [service, categories]);
    
    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (e.target.value === 'addNewCategory') {
            setShowNewCategoryInput(true);
            setFormData(prev => ({ ...prev, category: '' }));
        } else {
            setShowNewCategoryInput(false);
            setFormData(prev => ({ ...prev, category: e.target.value }));
        }
    };


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'number') {
            setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
        } else if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }

        if (name === 'imageUrl') {
            setImagePreview(value);
        }
        setFormError('');
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setImagePreview(result);
                setFormData(prev => ({ ...prev, imageUrl: result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleNewCategory = async () => {
        setNewCategoryError('');
        if (!newCategoryName.trim()) {
            setNewCategoryError('Tên danh mục không được để trống.');
            return;
        }
        if (categories.some(c => c.toLowerCase() === newCategoryName.trim().toLowerCase())) {
            setNewCategoryError('Danh mục này đã tồn tại.');
            return;
        }
        
        try {
            const newCategory = await apiService.createServiceCategory({ name: newCategoryName.trim() });
            onUpdateCategories([...categories, newCategory.name]);
            setFormData(prev => ({ ...prev, category: newCategory.name }));
            setNewCategoryName('');
            setShowNewCategoryInput(false);
        } catch (error: any) {
            console.error("Error adding new category:", error);
            setNewCategoryError(error.message || "Không thể thêm danh mục mới.");
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');

        if (!formData.name || !formData.price || !formData.duration || !formData.category || !formData.description) {
            setFormError('Vui lòng điền đầy đủ các trường bắt buộc.');
            return;
        }

        if (formData.category === '' && !showNewCategoryInput) {
            setFormError('Vui lòng chọn hoặc thêm một danh mục.');
            return;
        }

        onSave(formData as ServiceWithStatus);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 max-h-[80vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">{service ? 'Chỉnh sửa Dịch vụ' : 'Thêm Dịch vụ mới'}</h2>
                        {formError && <p className="text-red-500 text-sm mb-4">{formError}</p>}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Tên dịch vụ</label>
                                <input type="text" name="name" value={formData.name || ''} onChange={handleChange} className="mt-1 w-full p-2 border rounded" required />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Mô tả ngắn</label>
                                <textarea name="description" value={formData.description || ''} onChange={handleChange} rows={2} className="mt-1 w-full p-2 border rounded" required></textarea>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Mô tả chi tiết</label>
                                <textarea name="longDescription" value={formData.longDescription || ''} onChange={handleChange} rows={4} className="mt-1 w-full p-2 border rounded"></textarea>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Hình ảnh</label>
                                <div className="mt-1 flex items-center gap-4">
                                    <div className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-md flex items-center justify-center">
                                        {imagePreview ? <img src={imagePreview} alt="Xem trước" className="w-full h-full object-cover rounded-md" /> : <span className="text-xs text-gray-500 text-center">Xem trước</span>}
                                    </div>
                                    <div className="flex-grow">
                                        <label htmlFor="imageUrl" className="block text-xs font-medium text-gray-500">Dán liên kết ảnh</label>
                                        <input type="text" name="imageUrl" id="imageUrl" value={formData.imageUrl || ''} onChange={handleChange} className="mt-1 w-full p-2 border rounded text-sm" placeholder="https://picsum.photos/..." />
                                        <div className="relative text-center my-2"><div className="absolute inset-y-1/2 left-0 w-full h-px bg-gray-200"></div><span className="relative text-xs text-gray-400 bg-white px-2">hoặc</span></div>
                                        <label htmlFor="file-upload" className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 w-full text-center block">Tải lên từ máy</label>
                                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
                                    </div>
                                </div>
                            </div>

                            <div><label className="block text-sm font-medium text-gray-700">Giá (VND)</label><input type="number" name="price" value={formData.price || 0} onChange={handleChange} className="mt-1 w-full p-2 border rounded" required /></div>
                            <div><label className="block text-sm font-medium text-gray-700">Giá giảm (nếu có)</label><input type="number" name="discountPrice" value={formData.discountPrice || ''} onChange={handleChange} className="mt-1 w-full p-2 border rounded" /></div>
                            <div><label className="block text-sm font-medium text-gray-700">Thời lượng (phút)</label><input type="number" name="duration" value={formData.duration || 0} onChange={handleChange} className="mt-1 w-full p-2 border rounded" required /></div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Danh mục</label>
                                {!showNewCategoryInput ? (
                                    <select name="category" value={formData.category || ''} onChange={handleCategoryChange} className="mt-1 w-full p-2 border rounded" required>
                                        <option value="">Chọn danh mục</option>
                                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                        <option value="addNewCategory">--- Thêm danh mục mới ---</option>
                                    </select>
                                ) : (
                                    <div className="mt-1">
                                        <div className="flex items-center gap-2">
                                            <input type="text" value={newCategoryName} onChange={(e) => { setNewCategoryName(e.target.value); setNewCategoryError(''); }} className="flex-grow p-2 border rounded" placeholder="Tên danh mục mới" required />
                                            <button type="button" onClick={handleNewCategory} className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm">Thêm</button>
                                        </div>
                                        {newCategoryError && <p className="text-red-500 text-xs mt-1">{newCategoryError}</p>}
                                        <button type="button" onClick={() => setShowNewCategoryInput(false)} className="text-sm text-gray-500 hover:underline mt-1">Chọn từ danh mục có sẵn</button>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
                                <select name="isActive" value={String(formData.isActive)} onChange={(e) => setFormData(prev => ({...prev, isActive: e.target.value === 'true'}))} className="mt-1 w-full p-2 border rounded">
                                    <option value="true">Hoạt động</option>
                                    <option value="false">Không hoạt động</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Đánh dấu</label>
                                <div className="mt-1 flex gap-4">
                                    <label className="flex items-center"><input type="checkbox" name="isHot" checked={formData.isHot || false} onChange={handleChange} className="rounded text-brand-primary" /><span className="ml-2 text-sm text-gray-700">Hot</span></label>
                                    <label className="flex items-center"><input type="checkbox" name="isNew" checked={formData.isNew || false} onChange={handleChange} className="rounded text-brand-primary" /><span className="ml-2 text-sm text-gray-700">Mới</span></label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-6 py-4 flex justify-end gap-4 rounded-b-lg">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Hủy</button>
                        <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-dark">Lưu</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddEditServiceModal;