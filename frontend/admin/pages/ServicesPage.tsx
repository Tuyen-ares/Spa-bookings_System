import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import type { Service } from '../../types';
import AddEditServiceModal from '../components/AddEditServiceModal';
import { PlusIcon, SearchIcon, GridIcon, ListIcon, EditIcon, TrashIcon } from '../../shared/icons';
import * as apiService from '../../client/services/apiService';

const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

type ServiceWithStatus = Service & { isActive: boolean };

const ServicesPage: React.FC = () => {
    const location = useLocation(); // Track route changes
    const [localServices, setLocalServices] = useState<ServiceWithStatus[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [isLoadingServices, setIsLoadingServices] = useState(true);
    const [errorServices, setErrorServices] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    const [filterStatus, setFilterStatus] = useState<'All' | 'Active' | 'Inactive'>('All');
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

    const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
    const [editingService, setEditingService] = useState<ServiceWithStatus | null>(null);

    const [toast, setToast] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' });

    const fetchServiceData = async () => {
        try {
            setIsLoadingServices(true);
            setErrorServices(null);
            const fetchedServices = await apiService.getServices();
            setLocalServices(fetchedServices.map(s => ({ ...s, isActive: s.isActive ?? true })));
            const fetchedCategories = await apiService.getServiceCategories();
            // fetchedCategories is ServiceCategory[], extract names
            const categoryNames = fetchedCategories.map(cat => cat.name || String(cat));
            setCategories(['All', ...categoryNames.sort()]);
        } catch (err: any) {
            console.error("Error fetching services:", err);
            setErrorServices(err.message || "Không thể tải danh sách dịch vụ.");
            setLocalServices([]);
            setCategories(['All']);
        } finally {
            setIsLoadingServices(false);
        }
    };

    useEffect(() => {
        fetchServiceData();
    }, [location.pathname]); // Re-fetch when navigating to this page

    const filteredServices = useMemo(() => {
        return localServices
            .filter(service => service.name.toLowerCase().includes(searchTerm.toLowerCase()) || service.description.toLowerCase().includes(searchTerm.toLowerCase()))
            .filter(service => filterCategory === 'All' || service.category === filterCategory)
            .filter(service => filterStatus === 'All' || (filterStatus === 'Active' && service.isActive) || (filterStatus === 'Inactive' && !service.isActive));
    }, [localServices, searchTerm, filterCategory, filterStatus]);

    const groupedServices: Record<string, ServiceWithStatus[]> = useMemo(() => {
        const groups: Record<string, ServiceWithStatus[]> = {};
        const sortedServices = [...filteredServices].sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
        for (const service of sortedServices) {
            if (!groups[service.category]) {
                groups[service.category] = [];
            }
            groups[service.category].push(service);
        }
        return groups;
    }, [filteredServices]);


    const handleAddService = () => {
        setEditingService(null);
        setIsAddEditModalOpen(true);
    };

    const handleEditService = (service: ServiceWithStatus) => {
        setEditingService(service);
        setIsAddEditModalOpen(true);
    };

    const handleSaveService = async (serviceData: ServiceWithStatus) => {
        try {
            let savedService: Service;
            if (serviceData.id) {
                savedService = await apiService.updateService(serviceData.id, serviceData);
            } else {
                savedService = await apiService.createService(serviceData);
            }
            
            // Close modal first
            setIsAddEditModalOpen(false);
            
            // Show loading state
            setIsLoadingServices(true);
            
            // Small delay to ensure backend has updated
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Then refetch data to ensure consistency
            await fetchServiceData();
            
            setToast({ visible: true, message: `Lưu dịch vụ ${savedService.name} thành công!` });
            setTimeout(() => setToast({ visible: false, message: '' }), 4000);
        } catch (err: any) {
            console.error("Error saving service:", err);
            setToast({ visible: true, message: `Lưu dịch vụ thất bại: ${err.message}` });
            setTimeout(() => setToast({ visible: false, message: '' }), 4000);
            setIsAddEditModalOpen(false);
        }
    };

    const handleDeleteService = async (serviceId: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa dịch vụ này? Thao tác này không thể hoàn tác.')) {
            try {
                await apiService.deleteService(serviceId);
                setLocalServices(prev => prev.filter(s => s.id !== serviceId));
                setToast({ visible: true, message: `Đã xóa dịch vụ thành công!` });
            } catch (err: any) {
                console.error("Error deleting service:", err);
                setToast({ visible: true, message: `Xóa dịch vụ thất bại: ${err.message}` });
            } finally {
                setTimeout(() => setToast({ visible: false, message: '' }), 4000);
            }
        }
    };

    const handleUpdateCategories = (newCategoryList: string[]) => {
        setCategories(['All', ...newCategoryList.sort()]);
    };

    return (
        <div>
            {isAddEditModalOpen && (
                <AddEditServiceModal
                    service={editingService}
                    onClose={() => setIsAddEditModalOpen(false)}
                    onSave={handleSaveService}
                    categories={categories.filter(c => c !== 'All')}
                    onUpdateCategories={handleUpdateCategories}
                />
            )}

            {toast.visible && (
                <div className="fixed top-24 right-6 bg-green-500 text-white p-4 rounded-lg shadow-lg z-[100] animate-fadeInDown transition-all">
                    <div className="flex items-center gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{toast.message}</span>
                    </div>
                </div>
            )}

            <h1 className="text-3xl font-bold text-gray-800 mb-6">Quản lý Dịch vụ</h1>

            <div className="mb-6 flex flex-col md:flex-row gap-4">
                <div className="relative flex-grow">
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo tên dịch vụ hoặc mô tả..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-brand-primary focus:border-brand-primary"
                    />
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
                <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="p-3 border border-gray-300 rounded-lg bg-white">
                    {categories.map(c => <option key={c} value={c}>{c === 'All' ? 'Tất cả danh mục' : c}</option>)}
                </select>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as 'All' | 'Active' | 'Inactive')} className="p-3 border border-gray-300 rounded-lg bg-white">
                    <option value="All">Tất cả trạng thái</option>
                    <option value="Active">Hoạt động</option>
                    <option value="Inactive">Không hoạt động</option>
                </select>
                <div className="flex items-center bg-gray-200 rounded-lg p-1">
                    <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-white shadow' : 'text-gray-500'}`}><GridIcon className="w-5 h-5" /></button>
                    <button onClick={() => setViewMode('table')} className={`p-2 rounded-md ${viewMode === 'table' ? 'bg-white shadow' : 'text-gray-500'}`}><ListIcon className="w-5 h-5" /></button>
                </div>
                <button onClick={handleAddService} className="flex items-center justify-center gap-2 bg-brand-primary text-white font-semibold p-3 rounded-lg hover:bg-brand-dark transition-colors"><PlusIcon className="w-5 h-5" />Thêm dịch vụ</button>
            </div>

            {isLoadingServices ? (
                <div className="text-center py-10 bg-white rounded-lg shadow-md">
                    <p className="text-lg text-gray-500">Đang tải dịch vụ...</p>
                </div>
            ) : errorServices ? (
                <div className="text-center py-10 bg-white rounded-lg shadow-md">
                    <p className="text-lg text-red-500">Lỗi: {errorServices}</p>
                </div>
            ) : Object.keys(groupedServices).length > 0 ? (
                <div className="space-y-12">
                    {viewMode === 'grid' ? (
                        Object.entries(groupedServices).map(([category, servicesInCategory]) => (
                            <div key={category}>
                                <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b-2 border-brand-primary pb-2">{category} ({servicesInCategory.length})</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {servicesInCategory.map(service => (
                                        <div key={service.id} className={`bg-white rounded-lg shadow-md flex flex-col ${!service.isActive ? 'opacity-70 grayscale' : ''}`}>
                                            <div className="relative">
                                                <img src={service.imageUrl} alt={service.name} className="w-full h-40 object-cover rounded-t-lg" />
                                                {!service.isActive && (
                                                    <span className="absolute top-2 right-2 px-2 py-1 text-xs font-bold rounded-full bg-red-600 text-white">
                                                        Không hoạt động
                                                    </span>
                                                )}
                                            </div>
                                            <div className="p-4 flex flex-col flex-grow">
                                                <h3 className="font-bold text-gray-800 text-lg">{service.name}</h3>
                                                <p className="text-sm text-gray-500 mb-1 line-clamp-2 flex-grow">{service.description}</p>
                                                <div className="flex justify-between items-center my-2 text-sm">
                                                    <span className="font-semibold text-brand-primary">{formatPrice(service.price)}</span>
                                                    <span className="text-gray-600">{service.duration} phút</span>
                                                </div>
                                                <div className="mt-auto pt-4 border-t flex flex-wrap gap-2 justify-end">
                                                    <button onClick={() => handleEditService(service)} className="p-2 text-gray-500 hover:text-green-600" title="Chỉnh sửa"><EditIcon className="w-5 h-5" /></button>
                                                    <button onClick={() => handleDeleteService(service.id)} className="p-2 text-gray-500 hover:text-red-600" title="Xóa"><TrashIcon className="w-5 h-5" /></button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                            <table className="w-full whitespace-nowrap">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr className="text-left text-sm font-semibold text-gray-600">
                                        <th className="p-4">Dịch vụ</th>
                                        <th className="p-4">Giá</th>
                                        <th className="p-4">Thời lượng</th>
                                        <th className="p-4">Trạng thái</th>
                                        <th className="p-4">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(groupedServices).map(([category, servicesInCategory]) => (
                                        <React.Fragment key={category}>
                                            <tr>
                                                <td colSpan={5} className="p-3 bg-brand-secondary">
                                                    <h3 className="font-bold text-lg text-brand-dark">{category}</h3>
                                                </td>
                                            </tr>
                                            {servicesInCategory.map(service => (
                                                <tr key={service.id} className="border-b border-gray-200 hover:bg-gray-50">
                                                    <td className="p-4 flex items-center gap-3">
                                                        <img src={service.imageUrl} alt={service.name} className="w-10 h-10 object-cover rounded-md" />
                                                        <div>
                                                            <p className="font-semibold text-gray-800">{service.name}</p>
                                                            <p className="text-sm text-gray-500 line-clamp-1">{service.description}</p>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-sm font-semibold text-brand-primary">{formatPrice(service.price)}</td>
                                                    <td className="p-4 text-sm text-gray-600">{service.duration} phút</td>
                                                    <td className="p-4">
                                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${service.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                            {service.isActive ? 'Hoạt động' : 'Không hoạt động'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-1">
                                                            <button onClick={() => handleEditService(service)} className="p-2 text-gray-500 hover:text-green-600" title="Chỉnh sửa"><EditIcon className="w-5 h-5" /></button>
                                                            <button onClick={() => handleDeleteService(service.id)} className="p-2 text-gray-500 hover:text-red-600" title="Xóa"><TrashIcon className="w-5 h-5" /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center py-10 text-gray-500 bg-white rounded-lg shadow-md">Không tìm thấy dịch vụ nào.</div>
            )}
        </div>
    );
};

export default ServicesPage;