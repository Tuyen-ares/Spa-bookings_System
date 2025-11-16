import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '../../types';

interface AdminProfilePageProps {
    currentUser: User;
    onUpdateUser: (updatedUser: User) => void;
}

const AdminProfilePage: React.FC<AdminProfilePageProps> = ({ currentUser, onUpdateUser }) => {
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: currentUser.name,
        email: currentUser.email,
        phone: currentUser.phone || '',
        birthday: currentUser.birthday || '',
        gender: currentUser.gender || '',
    });

    const handleSave = async () => {
        try {
            // TODO: Call API to update user profile
            // const updatedUser = await apiService.updateUserProfile(currentUser.id, formData);
            // onUpdateUser(updatedUser);
            
            // Temporary: Update local state
            onUpdateUser({
                ...currentUser,
                ...formData
            });
            
            setIsEditing(false);
            alert('Cập nhật hồ sơ thành công!');
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Không thể cập nhật hồ sơ');
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Hồ sơ Admin</h1>
                <p className="text-gray-600 mt-1">Quản lý thông tin cá nhân của bạn</p>
            </div>

            {/* Profile Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Avatar Section */}
                <div className="bg-gradient-to-r from-brand-primary to-brand-secondary p-8 text-center">
                    <img
                        src={currentUser.profilePictureUrl}
                        alt={currentUser.name}
                        className="w-32 h-32 rounded-full mx-auto border-4 border-white shadow-lg object-cover"
                    />
                    <h2 className="text-2xl font-bold text-white mt-4">{currentUser.name}</h2>
                    <p className="text-white/90 mt-1">{currentUser.email}</p>
                    <div className="mt-3">
                        <span className="inline-block px-4 py-1 bg-white/20 text-white rounded-full text-sm font-medium">
                            👑 Administrator
                        </span>
                    </div>
                </div>

                {/* Info Section */}
                <div className="p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-semibold text-gray-900">Thông tin cá nhân</h3>
                        {!isEditing ? (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-dark transition"
                            >
                                ✏️ Chỉnh sửa
                            </button>
                        ) : (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setIsEditing(false);
                                        setFormData({
                                            name: currentUser.name,
                                            email: currentUser.email,
                                            phone: currentUser.phone || '',
                                            birthday: currentUser.birthday || '',
                                            gender: currentUser.gender || '',
                                        });
                                    }}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-dark transition"
                                >
                                    💾 Lưu
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Họ và tên
                            </label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                />
                            ) : (
                                <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">
                                    {currentUser.name}
                                </div>
                            )}
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email
                            </label>
                            <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">
                                {currentUser.email}
                                <span className="ml-2 text-xs text-gray-500">(Không thể thay đổi)</span>
                            </div>
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Số điện thoại
                            </label>
                            {isEditing ? (
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="Nhập số điện thoại"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                />
                            ) : (
                                <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">
                                    {currentUser.phone || 'Chưa cập nhật'}
                                </div>
                            )}
                        </div>

                        {/* Birthday */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Ngày sinh
                            </label>
                            {isEditing ? (
                                <input
                                    type="date"
                                    value={formData.birthday}
                                    onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                />
                            ) : (
                                <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">
                                    {currentUser.birthday 
                                        ? new Date(currentUser.birthday).toLocaleDateString('vi-VN')
                                        : 'Chưa cập nhật'}
                                </div>
                            )}
                        </div>

                        {/* Gender */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Giới tính
                            </label>
                            {isEditing ? (
                                <select
                                    value={formData.gender}
                                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                >
                                    <option value="">Chọn giới tính</option>
                                    <option value="male">Nam</option>
                                    <option value="female">Nữ</option>
                                    <option value="other">Khác</option>
                                </select>
                            ) : (
                                <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">
                                    {currentUser.gender === 'male' ? 'Nam' :
                                     currentUser.gender === 'female' ? 'Nữ' :
                                     currentUser.gender === 'other' ? 'Khác' :
                                     'Chưa cập nhật'}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Additional Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="text-sm text-gray-600 mb-1">Vai trò</div>
                    <div className="text-xl font-bold text-brand-primary">{currentUser.role}</div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="text-sm text-gray-600 mb-1">Trạng thái</div>
                    <div className="text-xl font-bold text-green-600">{currentUser.status}</div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="text-sm text-gray-600 mb-1">Ngày tham gia</div>
                    <div className="text-xl font-bold text-gray-900">
                        {new Date(currentUser.joinDate).toLocaleDateString('vi-VN')}
                    </div>
                </div>
            </div>

            {/* Security Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mt-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Bảo mật</h3>
                <div className="space-y-4">
                    <button
                        onClick={() => navigate('/admin/change-password')}
                        className="w-full md:w-auto px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                    >
                        🔒 Đổi mật khẩu
                    </button>
                    <div className="text-sm text-gray-500 mt-2">
                        Lần đăng nhập gần nhất: {currentUser.lastLogin 
                            ? new Date(currentUser.lastLogin).toLocaleString('vi-VN')
                            : 'Chưa có thông tin'}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminProfilePage;
