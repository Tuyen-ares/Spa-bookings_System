import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User, StaffTier } from '../../types';
// FIX: Remove MOCK_STAFF_TIERS import as it no longer exists in constants.
import { AVAILABLE_SPECIALTIES } from '../../constants';
import { UsersIcon, EditIcon, CameraIcon, BuildingOffice2Icon, PhoneIcon, AwardIcon, QrCodeIcon } from '../../shared/icons';
// Icons


interface StaffProfilePageProps {
    currentUser: User;
    onUpdateUser: (user: User) => void;
}

const StaffProfilePage: React.FC<StaffProfilePageProps> = ({ currentUser, onUpdateUser }) => {
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<User>(currentUser);
    const [imagePreview, setImagePreview] = useState<string>(currentUser.profilePictureUrl || '');

    const isTechnician = currentUser.role === 'Staff';

    useEffect(() => {
        setFormData(currentUser);
        setImagePreview(currentUser.profilePictureUrl || '');
    }, [currentUser]);

    const myStaffTier: StaffTier | undefined = useMemo(() => {
        // Staff tiers are configuration constants (fetched from backend)
        // For now, default to 'Mới' tier since staffTierId is not in users table
        // TODO: Calculate staff tier based on appointments count and rating when needed
        const STAFF_TIERS: StaffTier[] = [
            { id: 'Mới', name: 'Mới', minAppointments: 0, minRating: 0, commissionBoost: 0, color: '#A8A29E', badgeImageUrl: 'https://picsum.photos/seed/staff-tier-new/50/50' },
            { id: 'Thành thạo', name: 'Thành thạo', minAppointments: 50, minRating: 4, commissionBoost: 0.05, color: '#EF4444', badgeImageUrl: 'https://picsum.photos/seed/staff-tier-proficient/50/50' },
            { id: 'Chuyên gia', name: 'Chuyên gia', minAppointments: 150, minRating: 4.7, commissionBoost: 0.1, color: '#10B981', badgeImageUrl: 'https://picsum.photos/seed/staff-tier-expert/50/50' },
        ];
        return STAFF_TIERS.find(tier => tier.id === 'Mới') || STAFF_TIERS[0];
    }, []);

    const handleSave = () => {
        onUpdateUser(formData); // This updates the global currentUser in App.tsx and local storage
        setIsEditing(false);
        alert('Cập nhật hồ sơ thành công!');
    };

    const handleCancel = () => {
        setFormData(currentUser);
        setImagePreview(currentUser.profilePictureUrl || '');
        setIsEditing(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'profilePictureUrl') {
            setImagePreview(value);
        }
    };
    
    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        // Note: staffProfile fields (experience, etc.) removed from users table in db.txt
        // This handler is kept for backward compatibility but doesn't update any fields
        const { name, value } = e.target;
        // Just update formData directly if needed
        setFormData(prev => ({ ...prev, [name]: value }));
    };


    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Note: specialty field removed from users table in db.txt
        // This handler is kept for backward compatibility but doesn't update any fields
        // Specialty filtering is no longer available
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setImagePreview(result);
                setFormData(prev => ({ ...prev, profilePictureUrl: result }));
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="container mx-auto px-4 py-12">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center text-gray-700 font-semibold hover:text-brand-dark mb-6 transition-colors group"
                aria-label="Quay lại trang trước"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 transition-transform group-hover:-translate-x-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                Quay lại
            </button>

            <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-xl">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-6">
                        <div className="relative group">
                            <img src={imagePreview} alt={currentUser.name} className="w-28 h-28 rounded-full object-cover ring-4 ring-brand-primary/50" />
                            {isEditing && (
                                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                    <CameraIcon className="w-8 h-8 text-white" />
                                </div>
                            )}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">{currentUser.name}</h1>
                            {/* Note: staffRole removed from users table in db.txt */}
                            <p className="text-brand-primary text-lg font-semibold">Nhân viên</p>
                            {myStaffTier && (
                                <p className="text-sm mt-1 font-semibold" style={{color: myStaffTier.color}}>Cấp bậc: {myStaffTier.name}</p>
                            )}
                            <p className="text-sm text-gray-500">Tham gia từ: {new Date(currentUser.joinDate).toLocaleDateString('vi-VN')}</p>
                        </div>
                    </div>
                    {!isEditing && (
                        <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-brand-secondary text-brand-dark hover:bg-brand-primary hover:text-white transition-colors">
                            <EditIcon className="w-4 h-4" /> Chỉnh sửa
                        </button>
                    )}
                </div>

                {isEditing ? (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Họ và tên</label>
                                <input type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 w-full p-2 border rounded" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} className="mt-1 w-full p-2 border rounded bg-gray-100" readOnly />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Số điện thoại</label>
                                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="mt-1 w-full p-2 border rounded" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Ngày sinh</label>
                                <input type="date" name="birthday" value={formData.birthday ? new Date(formData.birthday).toISOString().split('T')[0] : ''} onChange={handleChange} className="mt-1 w-full p-2 border rounded" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Giới tính</label>
                                <select name="gender" value={formData.gender || ''} onChange={handleChange} className="mt-1 w-full p-2 border rounded">
                                    <option value="">Chọn giới tính</option>
                                    <option value="Nữ">Nữ</option>
                                    <option value="Nam">Nam</option>
                                    <option value="Khác">Khác</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Liên kết ảnh đại diện</label>
                                <input type="text" name="profilePictureUrl" value={formData.profilePictureUrl || ''} onChange={handleChange} className="mt-1 w-full p-2 border rounded" placeholder="https://..." />
                                <div className="relative text-center my-2">
                                    <div className="absolute inset-y-1/2 left-0 w-full h-px bg-gray-200"></div>
                                    <span className="relative text-xs text-gray-400 bg-white px-2">hoặc</span>
                                </div>
                                <label htmlFor="file-upload" className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 w-full text-center block">Tải lên từ máy</label>
                                <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
                            </div>
                            {/* Note: specialty and experience fields removed from users table in db.txt */}
                            {/* Specialty and experience editing sections removed */}
                        </div>
                        <div className="flex justify-end gap-4 mt-6">
                            <button type="button" onClick={handleCancel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Hủy</button>
                            <button type="submit" onClick={handleSave} className="bg-brand-primary text-white px-4 py-2 rounded-md hover:bg-brand-dark">Lưu thay đổi</button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="bg-gray-50 p-6 rounded-lg border">
                            <h3 className="text-lg font-semibold text-gray-700 mb-3">Thông tin liên hệ</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <p className="flex items-center gap-2"><UsersIcon className="w-5 h-5 text-gray-500" /> <span className="font-semibold text-gray-800">{currentUser.name}</span></p>
                                <p className="flex items-center gap-2"><PhoneIcon className="w-5 h-5 text-gray-500" /> <span className="font-semibold text-gray-800">{currentUser.phone || 'Chưa cập nhật'}</span></p>
                                <p className="flex items-center gap-2"><BuildingOffice2Icon className="w-5 h-5 text-gray-500" /> <span className="font-semibold text-gray-800">{currentUser.email}</span></p>
                                {/* Note: staffRole removed from users table in db.txt */}
                                <p className="flex items-center gap-2"><AwardIcon className="w-5 h-5 text-gray-500" /> <span className="font-semibold text-gray-800">Nhân viên</span></p>
                            </div>
                        </div>

                        {/* Note: specialty, experience, and qrCodeUrl fields removed from users table in db.txt */}
                        {/* Professional info and QR code sections removed */}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StaffProfilePage;
