import React, { useState, useMemo, useEffect } from 'react';
// FIX: Added missing type imports for Service and Appointment.
import type { User, UserRole, UserStatus, StaffRole, Service, Appointment } from '../../types';
import {
    PlusIcon, SearchIcon, EditIcon, TrashIcon, LockClosedIcon,
    EyeIcon, KeyIcon
} from '../../shared/icons';
import * as apiService from '../../client/services/apiService';

const USERS_PER_PAGE = 10;

const ROLE_TRANSLATIONS: Record<UserRole | StaffRole, string> = {
    'Admin': 'Quản trị viên',
    'Manager': 'Quản lý',
    'Technician': 'Kỹ thuật viên',
    'Receptionist': 'Lễ tân',
    'Client': 'Khách hàng',
    'Staff': 'Nhân viên',
};

const getStatusText = (status: UserStatus): string => {
    switch (status) {
        case 'Active': return 'Hoạt động';
        case 'Inactive': return 'Không hoạt động';
        case 'Locked': return 'Đã khóa';
        default: return status;
    }
};

const Pagination: React.FC<{ currentPage: number; totalPages: number; onPageChange: (page: number) => void; }> = ({ currentPage, totalPages, onPageChange }) => (
    <div className="mt-6 flex justify-between items-center">
        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="px-4 py-2 text-sm bg-white border rounded-md disabled:opacity-50">Trước</button>
        <span className="text-sm text-gray-600">Trang {currentPage} / {totalPages}</span>
        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-4 py-2 text-sm bg-white border rounded-md disabled:opacity-50">Sau</button>
    </div>
);

interface StaffPageProps {
    allUsers: User[];
    allServices: Service[];
    allAppointments: Appointment[];
}

const StaffPage: React.FC<StaffPageProps> = ({ allUsers, allServices, allAppointments }) => {
    const [localStaff, setLocalStaff] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState<StaffRole | 'All'>('All');
    const [filterStatus, setFilterStatus] = useState<UserStatus | 'All'>('All');
    const [currentPage, setCurrentPage] = useState(1);
    
    // Fetch staff data from API if allUsers is empty or refresh when needed
    useEffect(() => {
        const fetchStaffData = async () => {
            setIsLoading(true);
            try {
                // If allUsers is empty or has no staff, fetch from API
                if (!allUsers || allUsers.length === 0) {
                    console.log('StaffPage: allUsers is empty, fetching from API...');
                    const fetchedUsers = await apiService.getUsers();
                    const staffMembers = fetchedUsers.filter(u => u.role === 'Admin' || u.role === 'Staff');
                    setLocalStaff(staffMembers);
                    console.log('StaffPage: Fetched staff from API:', staffMembers.length);
                } else {
                    // Filter staff from allUsers prop
                    const staffMembers = allUsers.filter(u => u.role === 'Admin' || u.role === 'Staff');
                    setLocalStaff(staffMembers);
                    console.log('StaffPage: Filtered staff from props:', staffMembers.length, 'Total users:', allUsers.length);
                }
            } catch (error) {
                console.error('StaffPage: Error fetching staff:', error);
                // Fallback: try to filter from allUsers even if empty
                const staffMembers = allUsers ? allUsers.filter(u => u.role === 'Admin' || u.role === 'Staff') : [];
                setLocalStaff(staffMembers);
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchStaffData();
    }, [allUsers]);

    const filteredStaff = useMemo(() => {
        if (!localStaff || localStaff.length === 0) {
            return [];
        }
        
        let filtered = localStaff;
        
        // Filter by search term
        if (searchTerm.trim()) {
            filtered = filtered.filter(user => {
                const nameMatch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
                const emailMatch = user.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
                return nameMatch || emailMatch;
            });
        }
        
        // Filter by status
        if (filterStatus !== 'All') {
            filtered = filtered.filter(user => user.status === filterStatus);
        }
        
        // Filter by role (Note: staffRole not in db.txt users table, so filter by role only)
        if (filterRole !== 'All') {
            // Since we don't have staffRole field, we can only filter by Admin/Staff
            // For now, show all Staff when filtering by any staff role
            filtered = filtered.filter(user => user.role === 'Staff' || user.role === 'Admin');
        }
        
        return filtered;
    }, [localStaff, searchTerm, filterRole, filterStatus]);

    const totalPages = Math.ceil(filteredStaff.length / USERS_PER_PAGE);
    const paginatedStaff = useMemo<User[]>(() => {
        const startIndex = (currentPage - 1) * USERS_PER_PAGE;
        return filteredStaff.slice(startIndex, startIndex + USERS_PER_PAGE);
    }, [filteredStaff, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterRole, filterStatus]);

    const handleAction = (action: string, user: User) => {
        alert(`Chức năng "${action}" cho người dùng "${user.name}" đang được phát triển.`);
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Quản lý Nhân viên</h1>
            
            <div className="mb-6 flex flex-col md:flex-row gap-4">
                <div className="relative flex-grow">
                    <input type="text" placeholder="Tìm kiếm theo tên hoặc email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-brand-primary focus:border-brand-primary" />
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
                <select value={filterRole} onChange={e => setFilterRole(e.target.value as StaffRole | 'All')} className="p-3 border border-gray-300 rounded-lg bg-white">
                    <option value="All">Tất cả vai trò</option>
                    <option value="Manager">Quản lý</option>
                    <option value="Technician">Kỹ thuật viên</option>
                    <option value="Receptionist">Lễ tân</option>
                </select>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as UserStatus | 'All')} className="p-3 border border-gray-300 rounded-lg bg-white">
                    <option value="All">Tất cả trạng thái</option>
                    <option value="Active">Hoạt động</option>
                    <option value="Inactive">Không hoạt động</option>
                    <option value="Locked">Đã khóa</option>
                </select>
                <button onClick={() => handleAction('Thêm nhân viên', {} as User)} className="flex items-center justify-center gap-2 bg-brand-primary text-white font-semibold p-3 rounded-lg hover:bg-brand-dark transition-colors"><PlusIcon className="w-5 h-5" />Thêm</button>
            </div>

            {isLoading ? (
                <div className="text-center py-10 bg-white rounded-lg shadow-md">
                    <p className="text-lg text-gray-500">Đang tải danh sách nhân viên...</p>
                </div>
            ) : paginatedStaff.length > 0 ? (
                <>
                    <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                        <table className="w-full whitespace-nowrap">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr className="text-left text-sm font-semibold text-gray-600">
                                    <th className="p-4">Nhân viên</th>
                                    <th className="p-4">Vai trò</th>
                                    <th className="p-4">Chuyên môn</th>
                                    <th className="p-4">Trạng thái</th>
                                    <th className="p-4">Đăng nhập cuối</th>
                                    <th className="p-4">Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedStaff.map(user => (
                                    <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <img src={user.profilePictureUrl} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                                                <div>
                                                    <p className="font-semibold text-gray-800">{user.name}</p>
                                                    <p className="text-sm text-gray-500">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                                {ROLE_TRANSLATIONS[user.role]}
                                            </span>
                                        </td>
                                        <td className="p-4 text-xs text-gray-600 max-w-xs truncate">
                                            N/A
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.status === 'Active' ? 'bg-green-100 text-green-800' : user.status === 'Inactive' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                                {getStatusText(user.status)}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-gray-600">{new Date(user.lastLogin).toLocaleString('vi-VN')}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => handleAction('Xem chi tiết', user)} className="p-2 text-gray-500 hover:text-blue-600" title="Xem chi tiết"><EyeIcon className="w-5 h-5" /></button>
                                                <button onClick={() => handleAction('Chỉnh sửa', user)} className="p-2 text-gray-500 hover:text-green-600" title="Chỉnh sửa"><EditIcon className="w-5 h-5" /></button>
                                                <button onClick={() => handleAction('Khóa/Mở khóa', user)} className="p-2 text-gray-500 hover:text-yellow-600" title={user.status === 'Locked' ? "Mở khóa" : "Khóa"}><LockClosedIcon className="w-5 h-5" /></button>
                                                <button onClick={() => handleAction('Đặt lại mật khẩu', user)} className="p-2 text-gray-500 hover:text-purple-600" title="Đặt lại mật khẩu"><KeyIcon className="w-5 h-5" /></button>
                                                <button onClick={() => handleAction('Xóa', user)} className="p-2 text-gray-500 hover:text-red-600" title="Xóa"><TrashIcon className="w-5 h-5" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
                </>
            ) : (
                <div className="text-center py-10 text-gray-500 bg-white rounded-lg shadow-md">Không tìm thấy nhân viên nào.</div>
            )}
        </div>
    );
};

export default StaffPage;
