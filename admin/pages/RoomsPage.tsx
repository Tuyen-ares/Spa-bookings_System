import React, { useState, useMemo, useEffect } from 'react';
import type { Room } from '../../types';
import { PlusIcon, SearchIcon, EditIcon, TrashIcon } from '../../shared/icons';
import * as apiService from '../../client/services/apiService';

interface RoomsPageProps {
    allRooms?: Room[];
}

const RoomsPage: React.FC<RoomsPageProps> = ({ allRooms = [] }) => {
    const [localRooms, setLocalRooms] = useState<Room[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'All' | 'Active' | 'Inactive'>('All');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState<Room | null>(null);
    const [formData, setFormData] = useState<Partial<Room>>({
        name: '',
        capacity: 1,
        isActive: true,
        equipmentIds: null,
    });

    const [toast, setToast] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' });

    const fetchRooms = async () => {
        try {
            setIsLoading(true);
            setError(null);
            console.log('Fetching rooms from API...');
            const fetchedRooms = await apiService.getRooms();
            console.log('Fetched rooms:', fetchedRooms);
            setLocalRooms(fetchedRooms || []);
        } catch (err: any) {
            console.error("Error fetching rooms:", err);
            const errorMessage = err.message || err.toString() || "Không thể tải danh sách phòng.";
            setError(errorMessage);
            setLocalRooms([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRooms();
    }, []);

    const filteredRooms = useMemo(() => {
        return localRooms
            .filter(room => 
                room.name.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .filter(room => 
                filterStatus === 'All' || 
                (filterStatus === 'Active' && room.isActive) || 
                (filterStatus === 'Inactive' && !room.isActive)
            );
    }, [localRooms, searchTerm, filterStatus]);

    const handleAddRoom = () => {
        setEditingRoom(null);
        setFormData({
            name: '',
            capacity: 1,
            isActive: true,
            equipmentIds: null,
        });
        setIsModalOpen(true);
    };

    const handleEditRoom = (room: Room) => {
        setEditingRoom(room);
        setFormData({
            name: room.name,
            capacity: room.capacity,
            isActive: room.isActive,
            equipmentIds: room.equipmentIds || null,
        });
        setIsModalOpen(true);
    };

    const handleSaveRoom = async () => {
        try {
            if (!formData.name || !formData.name.trim()) {
                setToast({ visible: true, message: 'Vui lòng nhập tên phòng' });
                return;
            }

            if (!formData.capacity || formData.capacity < 1) {
                setToast({ visible: true, message: 'Sức chứa phải lớn hơn 0' });
                return;
            }

            if (editingRoom) {
                await apiService.updateRoom(editingRoom.id, formData);
                setToast({ visible: true, message: `Cập nhật phòng ${formData.name} thành công!` });
            } else {
                await apiService.createRoom(formData);
                setToast({ visible: true, message: `Tạo phòng ${formData.name} thành công!` });
            }

            setIsModalOpen(false);
            await fetchRooms();
        } catch (err: any) {
            console.error("Error saving room:", err);
            setToast({ visible: true, message: `Lưu phòng thất bại: ${err.message}` });
        }
    };

    const handleDeleteRoom = async (room: Room) => {
        if (!window.confirm(`Bạn có chắc chắn muốn xóa phòng "${room.name}"?`)) {
            return;
        }

        try {
            await apiService.deleteRoom(room.id);
            setToast({ visible: true, message: `Xóa phòng ${room.name} thành công!` });
            await fetchRooms();
        } catch (err: any) {
            console.error("Error deleting room:", err);
            setToast({ visible: true, message: `Xóa phòng thất bại: ${err.message}` });
        }
    };

    useEffect(() => {
        if (toast.visible) {
            const timer = setTimeout(() => {
                setToast({ visible: false, message: '' });
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Quản lý phòng</h1>
                        <p className="text-gray-600 mt-1">Quản lý danh sách phòng và sức chứa</p>
                    </div>
                </div>
                <div className="flex justify-center items-center h-64 bg-white rounded-lg shadow-sm">
                    <div className="text-gray-500">Đang tải danh sách phòng...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Quản lý phòng</h1>
                        <p className="text-gray-600 mt-1">Quản lý danh sách phòng và sức chứa</p>
                    </div>
                    <button
                        onClick={fetchRooms}
                        className="flex items-center gap-2 bg-brand-primary text-white px-4 py-2 rounded-lg hover:bg-brand-primary-dark transition-colors"
                    >
                        <span>Thử lại</span>
                    </button>
                </div>
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    <p className="font-semibold">Lỗi khi tải danh sách phòng:</p>
                    <p className="mt-1">{error}</p>
                    <p className="mt-2 text-sm text-red-600">
                        Vui lòng kiểm tra:
                        <br />1. Backend server đã chạy chưa? (http://localhost:3001)
                        <br />2. Bảng `rooms` đã được tạo trong database chưa?
                        <br />3. Đã chạy script SQL từ `db.txt` chưa?
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Quản lý phòng</h1>
                    <p className="text-gray-600 mt-1">Quản lý danh sách phòng và sức chứa</p>
                </div>
                <button
                    onClick={handleAddRoom}
                    className="flex items-center gap-2 bg-brand-primary text-white px-4 py-2 rounded-lg hover:bg-brand-primary-dark transition-colors"
                >
                    <PlusIcon className="w-5 h-5" />
                    <span>Thêm phòng</span>
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm phòng..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                        />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as 'All' | 'Active' | 'Inactive')}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                    >
                        <option value="All">Tất cả trạng thái</option>
                        <option value="Active">Hoạt động</option>
                        <option value="Inactive">Không hoạt động</option>
                    </select>
                </div>
            </div>

            {/* Rooms Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tên phòng
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Sức chứa
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Trạng thái
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Thao tác
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredRooms.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                        Không tìm thấy phòng nào
                                    </td>
                                </tr>
                            ) : (
                                filteredRooms.map((room) => (
                                    <tr key={room.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{room.name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{room.capacity} người</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                    room.isActive
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                }`}
                                            >
                                                {room.isActive ? 'Hoạt động' : 'Không hoạt động'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleEditRoom(room)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                    title="Sửa"
                                                >
                                                    <EditIcon className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteRoom(room)}
                                                    className="text-red-600 hover:text-red-900"
                                                    title="Xóa"
                                                >
                                                    <TrashIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">
                                {editingRoom ? 'Sửa phòng' : 'Thêm phòng mới'}
                            </h2>
                        </div>
                        <div className="px-6 py-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tên phòng <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.name || ''}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                                    placeholder="Nhập tên phòng"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Sức chứa (người) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={formData.capacity || 1}
                                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                                    placeholder="Nhập sức chứa"
                                />
                            </div>
                            <div>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.isActive ?? true}
                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                        className="w-4 h-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Hoạt động</span>
                                </label>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleSaveRoom}
                                className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-dark transition-colors"
                            >
                                {editingRoom ? 'Cập nhật' : 'Tạo mới'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast.visible && (
                <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg z-50">
                    {toast.message}
                </div>
            )}
        </div>
    );
};

export default RoomsPage;

