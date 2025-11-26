
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import type { User, Wallet, Tier, Mission, Appointment, Service, PointsHistory, LoginAttempt, Payment, Review, Promotion } from '../../types';
import {
    TrophyIcon, CreditCardIcon, ShieldCheckIcon,
    EditIcon, HistoryIcon, ProfileIcon, LogoutIcon, AppointmentsIcon, StarIcon, GiftIcon, MailIcon, PhoneIcon, CakeIcon, LocationIcon, QrCodeIcon, ExclamationTriangleIcon, PrinterIcon, VNPayIcon, SparklesIcon, TrashIcon, EyeIcon, EyeSlashIcon, ClockIcon
} from '../../shared/icons';
import * as apiService from '../services/apiService';


// --- HELPERS ---
const lightenColor = (hex: string, percent: number): string => {
    if (!hex || hex.length < 4) return '#FFFFFF';
    hex = hex.replace(/^\s*#|\s*$/g, '');
    if (hex.length === 3) {
        hex = hex.replace(/(.)/g, '$1$1');
    }
    const r = parseInt(hex.substring(0, 2), 16),
          g = parseInt(hex.substring(2, 4), 16),
          b = parseInt(hex.substring(4, 6), 16);

    const amount = Math.floor(255 * (percent / 100));

    return '#' +
        ('0' + Math.min(255, r + amount).toString(16)).slice(-2) +
        ('0' + Math.min(255, g + amount).toString(16)).slice(-2) +
        ('0' + Math.min(255, b + amount).toString(16)).slice(-2);
};

const hexToRgba = (hex: string, alpha: number): string => {
    if (!hex || hex.length < 4) return `rgba(255, 255, 255, ${alpha})`;
    let c: any = hex.substring(1).split('');
    if (c.length === 3) { c = [c[0], c[0], c[1], c[1], c[2], c[2]]; }
    c = '0x' + c.join('');
    return `rgba(${(c >> 16) & 255}, ${(c >> 8) & 255}, ${c & 255}, ${alpha})`;
};

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

// --- NEWLY ADDED COMPONENTS TO FIX ERRORS ---

// FIX: Added ReviewModal component definition to resolve "Cannot find name 'ReviewModal'" error.
const ReviewModal: React.FC<{
    appointment: Appointment;
    currentUser: User;
    onClose: () => void;
    onSubmitSuccess: () => void;
}> = ({ appointment, currentUser, onClose, onSubmitSuccess }) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const serviceName = appointment.serviceName;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            alert('Vui lòng chọn số sao đánh giá.');
            return;
        }
        setIsSubmitting(true);
        try {
            const reviewPayload: Partial<Review> = {
                userId: currentUser.id,
                serviceId: appointment.serviceId,
                appointmentId: appointment.id,
                userName: currentUser.name,
                userImageUrl: currentUser.profilePictureUrl,
                rating: rating,
                comment: comment.trim(),
                serviceName: serviceName,
            };
            await apiService.createReview(reviewPayload);
            alert('✅ Cảm ơn bạn đã đánh giá! Đánh giá của bạn đã được ghi nhận.');
            onSubmitSuccess();
            onClose();
        } catch (error: any) {
            console.error("Failed to submit review:", error);
            const errorMessage = error?.response?.data?.message || error?.message || "Gửi đánh giá thất bại. Vui lòng thử lại.";
            alert("❌ " + errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 sm:p-8" onClick={e => e.stopPropagation()}>
                <h3 className="text-2xl font-serif font-bold text-brand-dark mb-2">Đánh giá dịch vụ</h3>
                <p className="text-gray-600 mb-6">Bạn đang đánh giá cho dịch vụ: <strong className="text-brand-primary">{serviceName}</strong></p>
                <form onSubmit={handleSubmit}>
                    <div className="flex justify-center items-center mb-4">
                        <span className="mr-4 font-semibold text-gray-700">Chất lượng:</span>
                        <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <StarIcon
                                    key={star}
                                    className={`w-8 h-8 cursor-pointer transition-colors ${star <= (hoverRating || rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="mb-4">
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Chia sẻ cảm nhận chi tiết của bạn..."
                            rows={4}
                            maxLength={500}
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-brand-primary focus:border-brand-primary resize-none"
                        ></textarea>
                        <div className="flex justify-between items-center mt-1">
                            <span className="text-xs text-gray-500">Tối đa 500 ký tự</span>
                            <span className="text-xs text-gray-500">{comment.length}/500</span>
                        </div>
                    </div>
                    <div className="flex justify-end gap-4">
                         <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Hủy</button>
                        <button
                            type="submit"
                            disabled={isSubmitting || rating === 0}
                            className="px-6 py-2 bg-brand-primary text-white font-bold rounded-md hover:bg-brand-dark transition-colors disabled:opacity-50"
                        >
                            {isSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// FIX: Added ProfileSidebar component definition to resolve "Cannot find name 'ProfileSidebar'" error.
const ProfileSidebar: React.FC<{
    activeTab: string;
    setActiveTab: (tab: string) => void;
    onLogout: () => void;
}> = ({ activeTab, setActiveTab, onLogout }) => {
    const navItems = [
        { id: 'profile', label: 'Thông tin cá nhân', icon: <ProfileIcon className="w-6 h-6" /> },
        { id: 'membership', label: 'Hạng thành viên', icon: <TrophyIcon className="w-6 h-6" /> },
        { id: 'appointments', label: 'Lịch hẹn của tôi', icon: <AppointmentsIcon className="w-6 h-6" /> },
        { id: 'reviews', label: 'Đánh giá của tôi', icon: <StarIcon className="w-6 h-6" /> },
        { id: 'payments', label: 'Lịch sử thanh toán', icon: <CreditCardIcon className="w-6 h-6" /> },
        { id: 'security', label: 'Bảo mật', icon: <ShieldCheckIcon className="w-6 h-6" /> },
        { id: 'promotions', label: 'Ưu đãi của tôi', icon: <GiftIcon className="w-6 h-6" /> },
    ];

    return (
        <aside className="lg:w-1/4">
            <div className="bg-white p-4 rounded-lg shadow-soft-lg border border-gray-200/50">
                <nav className="space-y-1">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg text-left font-semibold transition-colors text-base ${
                                activeTab === item.id
                                    ? 'bg-brand-primary text-white shadow-md'
                                    : 'text-gray-700 hover:bg-brand-secondary hover:text-brand-dark'
                            }`}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </button>
                    ))}
                    <div className="pt-2 mt-2 border-t">
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-4 px-4 py-3 rounded-lg text-left font-semibold text-red-600 hover:bg-red-50 transition-colors"
                    >
                        <LogoutIcon className="w-6 h-6" />
                        <span>Đăng xuất</span>
                    </button>
                    </div>
                </nav>
            </div>
        </aside>
    );
};

// FIX: Added ProfileHeader component definition to resolve "Cannot find name 'ProfileHeader'" error.
const ProfileHeader: React.FC<{ currentUser: User; currentTier: Tier | undefined; onUpdateUser: (user: User) => void; }> = ({ currentUser, currentTier, onUpdateUser }) => {
    return (
        <div className="bg-white p-6 rounded-lg shadow-soft-lg border border-gray-200/50 flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gray-200 ring-4 ring-brand-secondary transition-all flex items-center justify-center">
                        <ProfileIcon className="w-12 h-12 text-gray-400" />
                </div>
            </div>
            <div className="text-center sm:text-left">
                <h1 className="text-3xl font-bold font-serif text-brand-text">{currentUser.name}</h1>
                <p className="text-lg text-gray-500">{currentUser.email}</p>
                {currentTier && (
                    <div 
                        className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold border-2"
                        style={{
                            color: currentTier.color,
                            borderColor: currentTier.color,
                            backgroundColor: hexToRgba(currentTier.color, 0.1)
                        }}
                    >
                        <TrophyIcon className="w-5 h-5"/>
                        Hạng {currentTier.name}
                    </div>
                )}
            </div>
        </div>
    );
};


// --- TAB CONTENT COMPONENTS ---

const ProfileInfoRow: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode; onEdit?: () => void; }> = ({ icon, label, value, onEdit }) => (
    <div className="flex justify-between items-center py-4 border-b border-gray-200/80 group">
        <div className="flex items-center gap-4">
            <div className="text-brand-dark">{icon}</div>
            <div>
                <p className="text-sm font-medium text-gray-500">{label}</p>
                <div className="font-semibold text-gray-800 text-base">{value}</div>
            </div>
        </div>
        {onEdit && (
            <button onClick={onEdit} className="p-2 rounded-full text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100 hover:text-brand-dark">
                <EditIcon className="w-5 h-5" />
            </button>
        )}
    </div>
);


const ProfileInfoTab: React.FC<{ currentUser: User; onUpdateUser: (user: User) => void; }> = ({ currentUser, onUpdateUser }) => {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingField, setEditingField] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: currentUser.name,
        email: currentUser.email,
        phone: currentUser.phone || '',
        gender: currentUser.gender || '',
        birthday: currentUser.birthday ? new Date(currentUser.birthday).toISOString().split('T')[0] : ''
    });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleEdit = (field: string) => {
        setEditingField(field);
        setIsEditModalOpen(true);
        setError('');
    };

    const handleCloseModal = () => {
        setIsEditModalOpen(false);
        setEditingField(null);
        setError('');
        // Reset form data to current user data
        setFormData({
            name: currentUser.name,
            email: currentUser.email,
            phone: currentUser.phone || '',
            gender: currentUser.gender || '',
            birthday: currentUser.birthday ? new Date(currentUser.birthday).toISOString().split('T')[0] : ''
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            // Validate email if editing email
            if (editingField === 'Email' && formData.email !== currentUser.email) {
                // Email validation will be done on backend
            }

            // Prepare update data based on editing field
            const updateData: Partial<User> = {};
            if (editingField === 'Họ và tên') {
                if (!formData.name.trim()) {
                    setError('Họ và tên không được để trống');
                    setIsSubmitting(false);
                    return;
                }
                updateData.name = formData.name.trim();
            } else if (editingField === 'Email') {
                if (!formData.email.trim()) {
                    setError('Email không được để trống');
                    setIsSubmitting(false);
                    return;
                }
                // Basic email validation
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(formData.email.trim())) {
                    setError('Email không hợp lệ');
                    setIsSubmitting(false);
                    return;
                }
                updateData.email = formData.email.trim();
            } else if (editingField === 'Số điện thoại') {
                if (formData.phone && !/^[0-9]{10,11}$/.test(formData.phone.replace(/\s/g, ''))) {
                    setError('Số điện thoại không hợp lệ. Vui lòng nhập 10-11 chữ số.');
                    setIsSubmitting(false);
                    return;
                }
                updateData.phone = formData.phone.trim() || null;
            } else if (editingField === 'Ngày sinh & Giới tính') {
                if (formData.birthday) {
                    const birthDate = new Date(formData.birthday);
                    const today = new Date();
                    if (birthDate > today) {
                        setError('Ngày sinh không thể là ngày trong tương lai.');
                        setIsSubmitting(false);
                        return;
                    }
                    const age = today.getFullYear() - birthDate.getFullYear();
                    if (age < 13 || age > 120) {
                        setError('Ngày sinh không hợp lệ. Bạn phải từ 13 tuổi trở lên.');
                        setIsSubmitting(false);
                        return;
                    }
                }
                updateData.birthday = formData.birthday || null;
                updateData.gender = formData.gender || null;
            }

            // Update user
            const updatedUser = await apiService.updateUser(currentUser.id, updateData);
            onUpdateUser(updatedUser);
            
            // Refresh appointments to sync with admin/staff
            window.dispatchEvent(new Event('refresh-appointments'));
            
            handleCloseModal();
            alert('Cập nhật thông tin thành công!');
        } catch (err: any) {
            console.error('Error updating user:', err);
            setError(err.message || 'Có lỗi xảy ra khi cập nhật thông tin. Vui lòng thử lại.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <div className="bg-white p-6 sm:p-8 rounded-lg shadow-soft-lg animate-fadeInUp border border-gray-200/50">
                <h2 className="text-2xl font-bold font-serif text-brand-text mb-6">Thông tin cá nhân</h2>
                
                <div className="space-y-2">
                    <ProfileInfoRow icon={<ProfileIcon className="w-6 h-6"/>} label="Họ và tên" value={currentUser.name} onEdit={() => handleEdit('Họ và tên')} />
                    <ProfileInfoRow icon={<MailIcon className="w-6 h-6"/>} label="Email" value={currentUser.email} onEdit={() => handleEdit('Email')} />
                    <ProfileInfoRow icon={<PhoneIcon className="w-6 h-6"/>} label="Số điện thoại" value={currentUser.phone || 'Chưa cập nhật'} onEdit={() => handleEdit('Số điện thoại')} />
                    <ProfileInfoRow icon={<CakeIcon className="w-6 h-6"/>} label="Ngày sinh & Giới tính" value={`${currentUser.birthday ? new Date(currentUser.birthday).toLocaleDateString('vi-VN') : 'Chưa cập nhật'} - ${currentUser.gender || 'Chưa cập nhật'}`} onEdit={() => handleEdit('Ngày sinh & Giới tính')} />
                </div>
            </div>

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4" onClick={handleCloseModal}>
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Chỉnh sửa {editingField}</h3>
                        
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {editingField === 'Họ và tên' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Họ và tên</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                                    />
                                </div>
                            )}

                            {editingField === 'Email' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Email phải là duy nhất trong hệ thống</p>
                                </div>
                            )}

                            {editingField === 'Số điện thoại' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="0123456789"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                                    />
                                </div>
                            )}

                            {editingField === 'Ngày sinh & Giới tính' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Ngày sinh</label>
                                        <input
                                            type="date"
                                            value={formData.birthday}
                                            onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                                            max={new Date().toISOString().split('T')[0]}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Giới tính</label>
                                        <select
                                            value={formData.gender}
                                            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                                        >
                                            <option value="">Chọn giới tính</option>
                                            <option value="Nam">Nam</option>
                                            <option value="Nữ">Nữ</option>
                                            <option value="Khác">Khác</option>
                                        </select>
                                    </div>
                                </>
                            )}

                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-sm text-red-600">{error}</p>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-dark font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? 'Đang lưu...' : 'Lưu'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};


const MembershipTab: React.FC<{ currentUser: User; wallet: Wallet | null; allTiers: Tier[]; pointsHistory: Array<{date: string; pointsChange: number; type: string; source: string; description: string}>; }> = ({ currentUser, wallet, allTiers, pointsHistory }) => {
    const [showLevelUpModal, setShowLevelUpModal] = useState(false);

    // Calculate tier from wallet totalSpent (money spent), not points
    const currentTier = useMemo(() => {
        if (!wallet) {
            // Return default tier (Thành viên - level 0)
            return allTiers.find(t => t.level === 0) || allTiers[0];
        }
        const totalSpent = parseFloat(wallet.totalSpent?.toString() || '0') || 0;
        const sortedTiers = [...allTiers].sort((a, b) => (b.minSpendingRequired || 0) - (a.minSpendingRequired || 0));
        let tierLevel = 0; // Default to tier 0 (Thành viên)
        for (const tier of sortedTiers) {
            if (totalSpent >= (tier.minSpendingRequired || 0)) {
                tierLevel = tier.level;
                break;
            }
        }
        return allTiers.find(t => t.level === tierLevel) || allTiers.find(t => t.level === 0) || allTiers[0];
    }, [wallet, allTiers]);
    const nextTier = useMemo(() => allTiers.find(t => t.level === (currentTier?.level || 0) + 1), [currentTier, allTiers]);

    const progressPercentage = useMemo(() => {
        if (!nextTier || !wallet) return 100;
        const totalSpent = parseFloat(wallet.totalSpent?.toString() || '0') || 0;
        const moneyForNextTier = (nextTier.minSpendingRequired || 0) - (currentTier?.minSpendingRequired || 0);
        const moneyProgressed = totalSpent - (currentTier?.minSpendingRequired || 0);
        return Math.max(0, Math.min((moneyProgressed / moneyForNextTier) * 100, 100));
    }, [wallet, currentTier, nextTier]);

    const glowStyle = useMemo(() => {
        if (!currentTier) return {};
        return {
            '--glow-color-start': hexToRgba(currentTier.color, 0.2),
            '--glow-color-end': hexToRgba(currentTier.color, 0.6)
        } as React.CSSProperties;
    }, [currentTier]);

    return (
        <div className="space-y-8 animate-fadeInUp">
            <div
                style={glowStyle}
                className="p-8 rounded-xl shadow-lg relative overflow-hidden animate-pulse-glow-dynamic"
            >
                <div className="absolute inset-0 opacity-20" style={{ background: `linear-gradient(135deg, ${currentTier?.color || '#FFFFFF'} 0%, ${lightenColor(currentTier?.color || '#FFFFFF', 40)} 100%)` }}></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
                    <div>
                        <p className="text-lg font-medium opacity-90" style={{ color: currentTier?.textColor }}>Hạng hiện tại</p>
                        <p className="text-4xl font-serif font-bold" style={{ color: currentTier?.textColor }}>{currentTier?.name || 'Thành viên'}</p>
                    </div>
                    <div className="w-px h-16 bg-white/30 hidden md:block"></div>
                    <div>
                        <p className="text-lg font-medium opacity-90" style={{ color: currentTier?.textColor }}>Tổng đã chi tiêu</p>
                        <p className="text-4xl font-bold" style={{ color: currentTier?.textColor }}>{formatCurrency(parseFloat(wallet?.totalSpent?.toString() || '0') || 0)}</p>
                    </div>
                </div>
            </div>
            
            {/* Tier Progression */}
            <div className="bg-white p-6 rounded-lg shadow-soft-lg border">
                <h3 className="text-xl font-bold font-serif text-brand-text mb-4">Mục tiêu thăng hạng</h3>
                {nextTier ? (
                    <div>
                        <div className="flex justify-between items-baseline mb-2">
                            <span className="text-sm font-medium text-gray-600">Tiến trình lên hạng <strong style={{ color: nextTier.color }}>{nextTier.name}</strong></span>
                            <span className="text-xs font-semibold text-gray-500">{formatCurrency(parseFloat(wallet?.totalSpent?.toString() || '0') || 0)} / {formatCurrency(nextTier.minSpendingRequired || 0)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-4">
                            <div className="h-4 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%`, backgroundColor: currentTier?.color }}></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            Bạn cần chi tiêu thêm <strong className="text-brand-dark">{formatCurrency((nextTier.minSpendingRequired || 0) - (parseFloat(wallet?.totalSpent?.toString() || '0') || 0))}</strong> nữa để thăng hạng.
                        </p>
                    </div>
                ) : (
                    <p className="text-center font-semibold text-brand-primary">🎉 Chúc mừng! Bạn đã đạt hạng cao nhất! 🎉</p>
                )}
                 <div className="text-center mt-4">
                </div>
            </div>

            {/* Points History */}
            <div className="bg-white p-6 rounded-lg shadow-soft-lg border">
                 <h3 className="text-xl font-bold font-serif text-brand-text mb-4 flex items-center gap-2"><HistoryIcon className="w-6 h-6"/> Lịch sử Điểm</h3>
                 <div className="overflow-x-auto max-h-80">
                    <table className="min-w-full text-sm">
                        <thead className="text-left text-gray-500 sticky top-0 bg-white">
                            <tr>
                                <th className="p-3 font-medium">Ngày</th>
                                <th className="p-3 font-medium">Mô tả</th>
                                <th className="p-3 font-medium text-right">Thay đổi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {pointsHistory.length > 0 ? pointsHistory.map((entry, index) => (
                                <tr key={`${entry.date}-${entry.description}-${entry.pointsChange}-${index}`}>
                                    <td className="p-3 text-gray-600">{new Date(entry.date).toLocaleDateString('vi-VN')}</td>
                                    <td className="p-3 text-gray-800">{entry.description}</td>
                                    <td className={`p-3 font-bold text-right ${entry.pointsChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>{entry.pointsChange >= 0 ? '+' : ''}{entry.pointsChange.toLocaleString()}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan={3} className="text-center py-8 text-gray-500">Chưa có lịch sử điểm.</td></tr>
                            )}
                        </tbody>
                    </table>
                 </div>
            </div>

            {/* Level Up Modal */}
            {showLevelUpModal && nextTier && (
                <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 animate-fadeIn" onClick={() => setShowLevelUpModal(false)}>
                    <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-8 text-center relative overflow-hidden" onClick={e => e.stopPropagation()}>
                        <SparklesIcon className="absolute -top-4 -left-4 w-24 h-24 text-yellow-300 opacity-50 transform rotate-45" />
                        <SparklesIcon className="absolute -bottom-8 -right-8 w-32 h-32 text-yellow-300 opacity-50 transform -rotate-45" />
                        <div className="relative z-10">
                            <TrophyIcon className="w-20 h-20 mx-auto text-yellow-400" />
                            <h3 className="text-3xl font-bold font-serif text-gray-800 mt-4">✨ Chúc Mừng Thăng Hạng! ✨</h3>
                            <p className="text-lg text-gray-600 mt-2">Bạn đã chính thức trở thành thành viên hạng</p>
                            <p className="text-4xl font-bold mt-2" style={{ color: nextTier.color }}>{nextTier.name}</p>
                            <p className="text-sm text-gray-500 mt-4">Hãy khám phá những ưu đãi mới dành riêng cho bạn!</p>
                            <button onClick={() => setShowLevelUpModal(false)} className="mt-6 bg-brand-primary text-white py-2 px-8 rounded-full font-semibold hover:bg-brand-dark transition-colors">Tuyệt vời!</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const PaymentsTab: React.FC<{
    currentUser: User;
    allPayments: Payment[];
    allServices: Service[];
    allUsers: User[];
    allAppointments: Appointment[];
}> = ({ currentUser, allPayments, allServices, allUsers, allAppointments }) => {
    const [viewingPayment, setViewingPayment] = useState<Payment | null>(null);
    const [paymentMethods, setPaymentMethods] = useState<Array<{ id: string; name: string; details: string; isDefault: boolean; icon: React.ReactNode }>>([]);
    const [is2faEnabled, setIs2faEnabled] = useState(false);
    const [localPayments, setLocalPayments] = useState<Payment[]>([]);
    const [isLoadingPayments, setIsLoadingPayments] = useState(false);

    // Fetch payments from API to ensure we have the latest data
    useEffect(() => {
        const fetchPayments = async () => {
            try {
                setIsLoadingPayments(true);
                // Fetch all payments from API
                const fetchedPayments = await apiService.getPayments();
                // Filter for current user
                const userPayments = fetchedPayments.filter(p => p.userId === currentUser.id);
                setLocalPayments(userPayments);
            } catch (error) {
                console.error("Failed to fetch payments:", error);
                // Fallback to allPayments from props if API call fails
                setLocalPayments(allPayments.filter(p => p.userId === currentUser.id));
            } finally {
                setIsLoadingPayments(false);
            }
        };
        
        fetchPayments();
        
        // Also listen for refresh event (e.g., after payment success)
        const handleRefresh = () => {
            fetchPayments();
        };
        window.addEventListener('refresh-appointments', handleRefresh);
        return () => {
            window.removeEventListener('refresh-appointments', handleRefresh);
        };
    }, [currentUser.id, allPayments]);

    // Also update when allPayments changes (e.g., after payment)
    useEffect(() => {
        if (allPayments.length > 0) {
            const userPayments = allPayments.filter(p => p.userId === currentUser.id);
            if (userPayments.length > 0) {
                setLocalPayments(prev => {
                    // Merge and deduplicate payments
                    const merged = [...prev, ...userPayments];
                    const unique = merged.filter((payment, index, self) => 
                        index === self.findIndex(p => p.id === payment.id)
                    );
                    return unique;
                });
            }
        }
    }, [allPayments, currentUser.id]);

    const userPayments = useMemo(() => {
        return localPayments
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [localPayments]);
    
    const STATUS_CONFIG: Record<Payment['status'], { text: string; color: string; bgColor: string; }> = {
        Completed: { text: 'Hoàn thành', color: 'text-green-800', bgColor: 'bg-green-100' },
        Pending: { text: 'Chờ xử lý', color: 'text-yellow-800', bgColor: 'bg-yellow-100' },
        Refunded: { text: 'Đã hoàn tiền', color: 'text-red-800', bgColor: 'bg-red-100' },
        Failed: { text: 'Thất bại', color: 'text-red-800', bgColor: 'bg-red-100' },
    };

    const handleSetDefault = (id: string) => {
        // TODO: Implement API call to set default payment method
        setPaymentMethods(methods => methods.map(m => ({ ...m, isDefault: m.id === id })));
        console.log('Setting default payment method:', id);
    };
    
    const handleSendInvoice = async () => {
        if (!viewingPayment) return;
        
        const transactionId = viewingPayment.transactionId || viewingPayment.id || 'N/A';
        const transactionDisplay = transactionId !== 'N/A' ? `#${transactionId.slice(0, 8)}` : 'N/A';
        
        try {
            // TODO: Implement invoice sending via email API
            console.log(`Sending invoice for payment ${transactionDisplay} to ${currentUser.email}`);
            alert(`Đã gửi hóa đơn cho giao dịch ${transactionDisplay} đến email ${currentUser.email}`);
        } catch (error) {
            console.error('Error sending invoice:', error);
            alert('Không thể gửi hóa đơn. Vui lòng thử lại sau.');
        } finally {
            setViewingPayment(null);
        }
    };

    return (
        <div className="space-y-8 animate-fadeInUp">
            {/* Payment History */}
            <div className="bg-white p-6 sm:p-8 rounded-lg shadow-soft-lg border border-gray-200/50">
                <h2 className="text-2xl font-bold font-serif text-brand-text mb-6">Lịch sử thanh toán</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="text-left text-gray-500">
                            <tr>
                                <th className="p-3 font-medium">ID</th>
                                <th className="p-3 font-medium">Dịch vụ</th>
                                <th className="p-3 font-medium">Ngày</th>
                                <th className="p-3 font-medium">Tổng tiền</th>
                                <th className="p-3 font-medium">Trạng thái</th>
                                <th className="p-3 font-medium"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoadingPayments ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-8">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand-primary"></div>
                                            <span className="text-gray-500">Đang tải lịch sử thanh toán...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : userPayments.length > 0 ? userPayments.map(payment => {
                                const staff = allUsers.find(u => u.id === payment.therapistId);
                                // Get therapist from appointment if not directly in payment
                                const appointment = payment.appointmentId ? allAppointments.find(a => a.id === payment.appointmentId) : null;
                                // Handle transactionId - may be null/undefined
                                const transactionId = payment.transactionId || payment.id || 'N/A';
                                const transactionDisplay = transactionId !== 'N/A' ? `#${transactionId.slice(0, 8)}` : 'N/A';
                                
                                return (
                                <tr key={payment.id} className="border-b last:border-0 hover:bg-gray-50">
                                    <td className="p-3 font-mono text-xs text-gray-600">{transactionDisplay}</td>
                                    <td className="p-3 font-medium text-gray-800">{payment.serviceName || 'Dịch vụ'}</td>
                                    <td className="p-3 text-gray-600">{new Date(payment.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                                    <td className="p-3 font-semibold text-brand-primary">{formatCurrency(parseFloat(String(payment.amount)) || 0)}</td>
                                    <td className="p-3"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${STATUS_CONFIG[payment.status]?.bgColor || 'bg-gray-100'} ${STATUS_CONFIG[payment.status]?.color || 'text-gray-800'}`}>{STATUS_CONFIG[payment.status]?.text || payment.status}</span></td>
                                    <td className="p-3 text-right"><button onClick={() => setViewingPayment(payment)} className="font-semibold text-blue-600 hover:underline">Chi tiết</button></td>
                                </tr>
                            )}) : (
                                <tr><td colSpan={7} className="text-center py-8 text-gray-500">Chưa có lịch sử thanh toán.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* Invoice Modal */}
            {viewingPayment && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={() => setViewingPayment(null)}>
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full" onClick={e => e.stopPropagation()}>
                        <div className="p-6">
                            <h3 className="text-2xl font-serif font-bold text-center text-brand-dark mb-4">Hóa Đơn Chi Tiết</h3>
                            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                                <div className="flex justify-between text-sm"><span className="text-gray-500">Mã giao dịch:</span><span className="font-mono font-semibold">{viewingPayment.transactionId ? `#${viewingPayment.transactionId.slice(0, 8)}` : viewingPayment.id ? `#${viewingPayment.id.slice(0, 8)}` : 'N/A'}</span></div>
                                <div className="flex justify-between text-sm"><span className="text-gray-500">Ngày:</span><span className="font-semibold">{new Date(viewingPayment.date).toLocaleString('vi-VN')}</span></div>
                                <div className="flex justify-between text-sm"><span className="text-gray-500">Phương thức:</span><span className="font-semibold">{viewingPayment.method || 'N/A'}</span></div>
                            </div>
                            <div className="my-4">
                                <img src={allServices.find(s => s.id === allAppointments.find(a => a.id === viewingPayment.appointmentId)?.serviceId)?.imageUrl || 'https://picsum.photos/400/200'} alt="Service" className="w-full h-32 object-cover rounded-md"/>
                            </div>
                            <div className="border-t border-b py-3 space-y-2">
                                <div className="flex justify-between font-semibold"><p>{viewingPayment.serviceName || 'Dịch vụ'}</p><p>{formatCurrency(parseFloat(String(viewingPayment.amount)) || 0)}</p></div>
                                {/* Discount removed - no mock data */}
                            </div>
                            <div className="flex justify-between font-bold text-lg pt-3">
                                <p>Tổng cộng</p>
                                <p className="text-brand-primary">{formatCurrency(parseFloat(String(viewingPayment.amount)) || 0)}</p>
                            </div>
                        </div>
                        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-4 rounded-b-lg">
                            <button onClick={() => setViewingPayment(null)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Đóng</button>
                            <button onClick={handleSendInvoice} className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-dark">Gửi qua Email</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const AppointmentsTab: React.FC<{
    currentUser: User;
    allAppointments: Appointment[];
    allServices: Service[];
    allUsers: User[];
    onReviewSubmit: () => void;
}> = ({ currentUser, allAppointments, allServices, allUsers, onReviewSubmit }) => {
    const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('upcoming');
    const [reviewingAppointment, setReviewingAppointment] = useState<Appointment | null>(null);
    const navigate = useNavigate();

    const myAppointments = useMemo(() => {
        return allAppointments
            .filter(app => app.userId === currentUser.id)
            .map(app => ({...app, dateTime: new Date(`${app.date}T${app.time}`) }))
            .sort((a, b) => b.dateTime.getTime() - a.dateTime.getTime());
    }, [allAppointments, currentUser.id]);

    const filteredAppointments = useMemo(() => {
        if (filter === 'all') return myAppointments;
        if (filter === 'upcoming') return myAppointments.filter(app => ['upcoming', 'pending', 'in-progress'].includes(app.status));
        return myAppointments.filter(app => app.status === filter);
    }, [myAppointments, filter]);

    const handleCancel = async (appId: string) => {
        try {
            await apiService.cancelAppointment(appId);
            // Refresh appointments after cancel
            window.dispatchEvent(new CustomEvent('refresh-appointments'));
            alert('Đã hủy lịch hẹn thành công!');
        } catch (error: any) {
            console.error('Error canceling appointment:', error);
            alert(error.message || 'Không thể hủy lịch hẹn. Vui lòng thử lại sau.');
        }
    };

    return (
        <div className="animate-fadeInUp space-y-8">
            {reviewingAppointment && (
                <ReviewModal 
                    appointment={reviewingAppointment}
                    currentUser={currentUser}
                    onClose={() => setReviewingAppointment(null)}
                    onSubmitSuccess={onReviewSubmit}
                />
            )}

            <div className="bg-white p-6 sm:p-8 rounded-lg shadow-soft-lg border border-gray-200/50">
                <h2 className="text-2xl font-bold font-serif text-brand-text mb-6">Lịch hẹn của tôi</h2>
                <div className="flex flex-wrap gap-2 border-b pb-4 mb-6">
                    {(['upcoming', 'completed', 'cancelled', 'all'] as const).map(f => {
                        const labels = { upcoming: 'Sắp tới', completed: 'Hoàn thành', cancelled: 'Đã hủy', all: 'Tất cả' };
                        return (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${filter === f ? 'bg-brand-primary text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            >
                                {labels[f]}
                            </button>
                        );
                    })}
                </div>

                {filteredAppointments.length > 0 ? (
                    <div className="space-y-6">
                        {filteredAppointments.map(app => {
                            const service = allServices.find(s => s.id === app.serviceId);
                            const therapist = allUsers.find(u => u.id === app.therapistId);
                            const statusConfig = {
                                upcoming: { text: 'Sắp tới', color: 'blue' },
                                pending: { text: 'Chờ xác nhận', color: 'yellow' },
                                'in-progress': { text: 'Đang diễn ra', color: 'purple' },
                                completed: { text: 'Hoàn thành', color: 'green' },
                                cancelled: { text: 'Đã hủy', color: 'red' },
                            };
                            const currentStatus = statusConfig[app.status] || { text: 'Không rõ', color: 'gray' };
                            
                            return (
                                <div key={app.id} className="flex flex-col sm:flex-row gap-5 p-4 border rounded-lg bg-gray-50/50">
                                    <img src={service?.imageUrl} alt={service?.name} className="w-full sm:w-40 h-28 object-cover rounded-md flex-shrink-0" />
                                    <div className="flex-grow">
                                        <div className="flex justify-between items-start">
                                            <p className="font-bold text-lg text-brand-text">{app.serviceName}</p>
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full bg-${currentStatus.color}-100 text-${currentStatus.color}-800`}>{currentStatus.text}</span>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1">{app.dateTime.toLocaleString('vi-VN', { dateStyle: 'full', timeStyle: 'short' })}</p>
                                        <p className="text-sm text-gray-500">KTV: {therapist?.name || 'Chưa phân công'}</p>
                                    </div>
                                    <div className="flex-shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 mt-3 sm:mt-0">
                                        {app.status === 'completed' && app.reviewRating && (
                                            <div className="flex items-center gap-1" title={`Bạn đã đánh giá ${app.reviewRating} sao`}>
                                                {[...Array(5)].map((_, i) => (
                                                    <StarIcon key={i} className={`w-5 h-5 ${i < app.reviewRating! ? 'text-yellow-400' : 'text-gray-300'}`} />
                                                ))}
                                            </div>
                                        )}
                                        {app.status === 'completed' && !app.reviewRating && (
                                            <button onClick={() => setReviewingAppointment(app)} className="px-3 py-1.5 text-xs font-semibold bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 w-full sm:w-auto">Đánh giá</button>
                                        )}
                                        {['upcoming', 'pending'].includes(app.status) && (
                                            <button onClick={() => handleCancel(app.id)} className="px-3 py-1.5 text-xs font-semibold bg-red-100 text-red-700 rounded-md hover:bg-red-200 w-full sm:w-auto">Hủy lịch</button>
                                        )}
                                        {['completed', 'cancelled'].includes(app.status) && (
                                            <button onClick={() => navigate(`/booking?serviceId=${app.serviceId}`)} className="px-3 py-1.5 text-xs font-semibold bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 w-full sm:w-auto">Đặt lại</button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-center text-gray-500 py-8">Không có lịch hẹn nào trong mục này.</p>
                )}
            </div>
        </div>
    );
};


const SecurityTab: React.FC<{ currentUser: User }> = ({ currentUser }) => {
    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChangePassword = async () => {
        setError('');
        setSuccess('');

        // Validation
        if (!currentPassword || !newPassword || !confirmPassword) {
            setError('Vui lòng điền đầy đủ thông tin');
            return;
        }

        if (newPassword.length < 6) {
            setError('Mật khẩu mới phải có ít nhất 6 ký tự');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            return;
        }

        if (currentPassword === newPassword) {
            setError('Mật khẩu mới phải khác mật khẩu hiện tại');
            return;
        }

        setIsLoading(true);
        try {
            await apiService.changePassword(currentUser.id, currentPassword, newPassword);
            setSuccess('Đổi mật khẩu thành công!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => {
                setShowChangePasswordModal(false);
                setSuccess('');
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Đổi mật khẩu thất bại. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCloseModal = () => {
        setShowChangePasswordModal(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setError('');
        setSuccess('');
    };

    return (
        <>
            <div className="bg-white p-8 rounded-lg shadow-soft-lg animate-fadeInUp">
                <h2 className="text-2xl font-bold font-serif text-brand-text mb-6">Bảo mật tài khoản</h2>
                <div className="space-y-4">
                    <button 
                        onClick={() => setShowChangePasswordModal(true)}
                        className="w-full text-left p-4 border rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-between"
                    >
                        <span className="font-medium">Đổi mật khẩu</span>
                        <span className="text-gray-400">→</span>
                    </button>
                </div>
            </div>

            {/* Change Password Modal */}
            {showChangePasswordModal && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={handleCloseModal}>
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full transform transition-all animate-fadeIn" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-2xl font-serif font-bold text-brand-dark">Đổi mật khẩu</h3>
                                <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-800 text-3xl font-light leading-none">&times;</button>
                            </div>
                            
                            {error && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}
                            
                            {success && (
                                <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm">
                                    {success}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu hiện tại</label>
                                    <div className="relative">
                                        <input
                                            type={showCurrentPassword ? 'text' : 'password'}
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent pr-10"
                                            placeholder="Nhập mật khẩu hiện tại"
                                            disabled={isLoading}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showCurrentPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu mới</label>
                                    <div className="relative">
                                        <input
                                            type={showNewPassword ? 'text' : 'password'}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent pr-10"
                                            placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                                            disabled={isLoading}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showNewPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Mật khẩu phải có ít nhất 6 ký tự</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Xác nhận mật khẩu mới</label>
                                    <div className="relative">
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent pr-10"
                                            placeholder="Nhập lại mật khẩu mới"
                                            disabled={isLoading}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showConfirmPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-4 rounded-b-lg">
                            <button 
                                onClick={handleCloseModal}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                                disabled={isLoading}
                            >
                                Hủy
                            </button>
                            <button 
                                onClick={handleChangePassword}
                                className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

const PromotionsTab: React.FC<{
    currentUser: User;
}> = ({ currentUser }) => {
    const [myVouchers, setMyVouchers] = useState<Array<Promotion & { redeemedCount: number }>>([]);
    const [availableVouchers, setAvailableVouchers] = useState<Promotion[]>([]);
    const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVouchers = async () => {
            try {
                setLoading(true);
                const [redeemed, applicable, appointments] = await Promise.all([
                    apiService.getMyRedeemedVouchers(currentUser.id),
                    apiService.getPromotions({ userId: currentUser.id }),
                    apiService.getUserAppointments(currentUser.id)
                ]);
                setMyVouchers(redeemed || []);
                setAvailableVouchers(applicable || []);
                setAllAppointments(appointments || []);
            } catch (error) {
                console.error('Failed to fetch vouchers:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchVouchers();

        // Listen for refresh events
        const handleRefresh = () => fetchVouchers();
        window.addEventListener('refresh-vouchers', handleRefresh);
        window.addEventListener('refresh-appointments', handleRefresh);
        
        return () => {
            window.removeEventListener('refresh-vouchers', handleRefresh);
            window.removeEventListener('refresh-appointments', handleRefresh);
        };
    }, [currentUser.id]);

    const activeMyVouchers = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return myVouchers.filter(v => {
            if (!v.isActive || v.redeemedCount <= 0) return false;
            const expiryDate = new Date(v.expiryDate);
            expiryDate.setHours(0, 0, 0, 0);
            return expiryDate >= today;
        });
    }, [myVouchers]);

    // Check if user is birthday today
    const isBirthdayToday = useMemo(() => {
        if (!currentUser?.birthday) return false;
        const today = new Date();
        const birthDate = new Date(currentUser.birthday);
        return today.getMonth() === birthDate.getMonth() && today.getDate() === birthDate.getDate();
    }, [currentUser]);

    // Check if user is truly a new client
    const isNewClient = useMemo(() => {
        if (!allAppointments) return true;
        const hasAnySuccessfulBooking = allAppointments.some(app => 
            app.status !== 'cancelled' && 
            (app.paymentStatus === 'Paid' || 
             (app.status === 'completed' || app.status === 'upcoming' || app.status === 'scheduled'))
        );
        return !hasAnySuccessfulBooking;
    }, [allAppointments]);

    const specialVouchers = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return availableVouchers.filter(v => {
            if (!v.isActive) return false;
            const expiryDate = new Date(v.expiryDate);
            expiryDate.setHours(0, 0, 0, 0);
            if (expiryDate < today) return false;
            if (v.stock !== null && v.stock <= 0) return false;
            
            // Birthday voucher: Only show on exact birthday and if not used
            if (v.targetAudience === 'Birthday') {
                if (!isBirthdayToday) return false;
                
                // Check if already used/redeemed
                const hasUsedBirthdayVoucher = myVouchers.some(mv => 
                    mv.targetAudience === 'Birthday' && mv.redeemedCount > 0
                );
                if (hasUsedBirthdayVoucher) return false;
                
                return true;
            }
            
            // New Clients voucher: Only show if truly new client and not used
            if (v.targetAudience === 'New Clients') {
                if (!isNewClient) return false;
                
                // Check if already used/redeemed
                const hasUsedNewClientVoucher = myVouchers.some(mv => 
                    mv.targetAudience === 'New Clients' && mv.redeemedCount > 0
                );
                if (hasUsedNewClientVoucher) return false;
                
                return true;
            }
            
            return false;
        });
    }, [availableVouchers, isBirthdayToday, isNewClient, myVouchers]);

    if (loading) {
        return (
            <div className="bg-white p-8 rounded-lg shadow-soft-lg animate-fadeInUp">
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fadeInUp">
            {/* Voucher đã đổi bằng điểm */}
            <div className="bg-white p-6 rounded-lg shadow-soft-lg">
                <h2 className="text-2xl font-bold font-serif text-brand-dark mb-4 flex items-center gap-2">
                    <GiftIcon className="w-6 h-6 text-brand-primary" />
                    Voucher của tôi
                </h2>
                {activeMyVouchers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activeMyVouchers.map((voucher) => (
                            <div key={voucher.id} className="border-2 border-brand-primary/50 rounded-lg p-4 hover:shadow-lg transition-shadow bg-gradient-to-br from-white to-brand-secondary/10">
                                <div className="flex items-start justify-between mb-2">
                                    <h3 className="font-bold text-lg text-gray-800">{voucher.title}</h3>
                                    <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full">
                                        x{voucher.redeemedCount}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{voucher.description}</p>
                                <div className="flex items-center justify-between text-sm mb-3">
                                    <span className="font-semibold text-brand-primary">Mã: {voucher.code}</span>
                                    <span className="text-red-500 flex items-center gap-1">
                                        <ClockIcon className="w-4 h-4" />
                                        {new Date(voucher.expiryDate).toLocaleDateString('vi-VN')}
                                    </span>
                                </div>
                                <Link
                                    to={`/booking?promoCode=${voucher.code}`}
                                    className="block text-center bg-brand-primary text-white py-2 px-4 rounded-md font-semibold hover:bg-brand-dark transition-colors"
                                >
                                    Sử dụng ngay
                                </Link>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <GiftIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p className="font-medium">Bạn chưa có voucher nào đã đổi bằng điểm</p>
                        <Link to="/promotions" className="text-brand-primary hover:underline mt-2 inline-block">
                            Khám phá voucher →
                        </Link>
                    </div>
                )}
            </div>

            {/* Voucher đặc biệt dành cho bạn */}
            {specialVouchers.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow-soft-lg">
                    <h2 className="text-2xl font-bold font-serif text-brand-dark mb-4 flex items-center gap-2">
                        <SparklesIcon className="w-6 h-6 text-yellow-500" />
                        Voucher đặc biệt dành cho bạn
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {specialVouchers.map((promo) => (
                            <div key={promo.id} className="border-2 border-yellow-400/50 rounded-lg p-4 hover:shadow-lg transition-shadow bg-gradient-to-br from-yellow-50 to-white">
                                <div className="flex items-center gap-2 mb-2">
                                    {promo.targetAudience === 'Birthday' && (
                                        <span className="bg-pink-100 text-pink-600 text-xs font-bold px-2 py-1 rounded">🎂 Sinh nhật</span>
                                    )}
                                    {promo.targetAudience === 'New Clients' && (
                                        <span className="bg-blue-100 text-blue-600 text-xs font-bold px-2 py-1 rounded">🆕 Khách mới</span>
                                    )}
                                </div>
                                <h3 className="font-bold text-lg text-gray-800 mb-2">{promo.title}</h3>
                                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{promo.description}</p>
                                <div className="flex items-center justify-between text-sm mb-3">
                                    <span className="font-semibold text-brand-primary">Mã: {promo.code}</span>
                                    <span className="text-red-500 flex items-center gap-1">
                                        <ClockIcon className="w-4 h-4" />
                                        {new Date(promo.expiryDate).toLocaleDateString('vi-VN')}
                                    </span>
                                </div>
                                <Link
                                    to={`/booking?promoCode=${promo.code}${promo.applicableServiceIds && promo.applicableServiceIds.length > 0 ? `&serviceId=${promo.applicableServiceIds[0]}` : ''}`}
                                    className="block text-center bg-gradient-to-r from-yellow-400 to-orange-400 text-white py-2 px-4 rounded-md font-semibold hover:from-yellow-500 hover:to-orange-500 transition-colors shadow-md"
                                >
                                    Sử dụng ngay
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Link to Promotions Page */}
            <div className="bg-gradient-to-r from-brand-primary to-brand-dark p-6 rounded-lg shadow-lg text-white text-center">
                <h3 className="text-xl font-bold mb-2">Khám phá thêm ưu đãi</h3>
                <p className="mb-4 text-brand-secondary">Xem tất cả các voucher và đổi điểm lấy ưu đãi hấp dẫn</p>
                <Link
                    to="/promotions"
                    className="inline-block bg-white text-brand-primary px-6 py-3 rounded-full font-bold hover:bg-brand-secondary transition-colors shadow-lg"
                >
                    Xem tất cả ưu đãi
                </Link>
            </div>
        </div>
    );
};

const PlaceholderTab: React.FC<{ title: string }> = ({ title }) => (
    <div className="bg-white p-8 rounded-lg shadow-soft-lg animate-fadeInUp">
        <h2 className="text-2xl font-bold font-serif text-brand-text mb-4">{title}</h2>
        <p className="text-gray-500">Nội dung cho mục này đang được phát triển và sẽ sớm ra mắt. Cảm ơn bạn đã kiên nhẫn!</p>
    </div>
);

const ReviewsTab: React.FC<{
    currentUser: User;
    allReviews: Review[];
    setAllReviews: React.Dispatch<React.SetStateAction<Review[]>>;
    allServices: Service[];
}> = ({ currentUser, allReviews, setAllReviews, allServices }) => {
    const [filter, setFilter] = useState<'all' | 'replied' | 'not-replied'>('all');

    const myReviews = useMemo(() => {
        return allReviews
            .filter(r => r.userId === currentUser.id)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [allReviews, currentUser.id]);

    const filteredReviews = useMemo(() => {
        if (filter === 'replied') return myReviews.filter(r => r.managerReply);
        if (filter === 'not-replied') return myReviews.filter(r => !r.managerReply);
        return myReviews;
    }, [myReviews, filter]);

    const handleToggleVisibility = async (review: Review) => {
        try {
            const updatedReview = await apiService.updateReview(review.id, { isHidden: !review.isHidden });
            setAllReviews(prev => prev.map(r => (r.id === updatedReview.id ? updatedReview : r)));
        } catch (error) {
            console.error("Failed to toggle review visibility:", error);
            alert("Cập nhật trạng thái thất bại.");
        }
    };

    const handleDelete = async (reviewId: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa vĩnh viễn đánh giá này?')) {
            try {
                await apiService.deleteReview(reviewId);
                setAllReviews(prev => prev.filter(r => r.id !== reviewId));
            } catch (error) {
                console.error("Failed to delete review:", error);
                alert("Xóa đánh giá thất bại.");
            }
        }
    };

    const handleEdit = () => {
        alert('Chức năng chỉnh sửa đang được phát triển.');
    };

    return (
        <div className="animate-fadeInUp space-y-8">
            <div className="bg-white p-6 sm:p-8 rounded-lg shadow-soft-lg border border-gray-200/50">
                <h2 className="text-2xl font-bold font-serif text-brand-text mb-6">Đánh giá & Phản hồi của tôi</h2>
                <div className="flex flex-wrap gap-2 border-b pb-4 mb-6">
                    {(['all', 'replied', 'not-replied'] as const).map(f => {
                        const labels = { all: 'Tất cả', replied: 'Có phản hồi', 'not-replied': 'Chưa phản hồi' };
                        return (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${filter === f ? 'bg-brand-primary text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            >
                                {labels[f]}
                            </button>
                        );
                    })}
                </div>

                {filteredReviews.length > 0 ? (
                    <div className="space-y-6">
                        {filteredReviews.map(review => {
                            const service = allServices.find(s => s.id === review.serviceId);
                            return (
                                <div key={review.id} className="p-5 border rounded-lg bg-gray-50/50">
                                    <div className="flex flex-col sm:flex-row gap-5">
                                        <img src={service?.imageUrl} alt={service?.name} className="w-full sm:w-32 h-24 object-cover rounded-md flex-shrink-0" />
                                        <div className="flex-grow">
                                            <div className="flex justify-between items-start">
                                                <p className="font-bold text-lg text-brand-text">{review.serviceName}</p>
                                                <div className="flex items-center gap-1">
                                                    {[...Array(5)].map((_, i) => <StarIcon key={i} className={`w-5 h-5 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`} />)}
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-500 mt-1">{new Date(review.date).toLocaleString('vi-VN')}</p>
                                            <p className="text-gray-700 mt-2 italic">"{review.comment}"</p>

                                            {review.managerReply && (
                                                <div className="mt-3 bg-blue-50 p-3 rounded-md border-l-4 border-blue-300">
                                                    <p className="font-semibold text-sm text-blue-800">Phản hồi từ Anh Thơ Spa:</p>
                                                    <p className="text-sm text-blue-700 italic">"{review.managerReply}"</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="mt-4 border-t pt-3 flex items-center justify-end gap-2">
                                        <button onClick={handleEdit} className="px-3 py-1.5 text-xs font-semibold bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">Sửa</button>
                                        <button onClick={() => handleToggleVisibility(review)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">
                                            {review.isHidden ? <EyeIcon className="w-4 h-4"/> : <EyeSlashIcon className="w-4 h-4"/>}
                                            {review.isHidden ? 'Hiện' : 'Ẩn'}
                                        </button>
                                        <button onClick={() => handleDelete(review.id)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-red-100 text-red-700 rounded-md hover:bg-red-200">
                                            <TrashIcon className="w-4 h-4"/> Xóa
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-center text-gray-500 py-8">Không có đánh giá nào trong mục này.</p>
                )}
            </div>
        </div>
    );
};


// --- MAIN COMPONENT ---
interface ProfilePageProps { 
    currentUser: User; 
    wallet: Wallet | null; 
    setWallet: React.Dispatch<React.SetStateAction<Wallet | null>>;
    onUpdateUser: (user: User) => void; 
    onLogout: () => void;
    allTiers: Tier[]; 
    allServices: Service[];
    setAllServices: React.Dispatch<React.SetStateAction<Service[]>>;
    allPayments: Payment[];
    allUsers: User[];
    allAppointments: Appointment[];
    setAllAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
    allReviews: Review[];
    setAllReviews: React.Dispatch<React.SetStateAction<Review[]>>;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ 
    currentUser, 
    wallet,
    setWallet, 
    onUpdateUser, 
    onLogout, 
    allTiers, 
    allServices,
    setAllServices, 
    allPayments, 
    allUsers, 
    allAppointments,
    setAllAppointments,
    allReviews,
    setAllReviews
}) => {
    
    const [activeTab, setActiveTab] = useState('profile');
    const [pointsHistory, setPointsHistory] = useState<Array<{date: string; pointsChange: number; type: string; source: string; description: string}>>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Calculate tier from wallet totalSpent (money spent), not points
    const currentTier = useMemo(() => {
        if (!wallet) {
            // Return default tier (Thành viên - level 0)
            return allTiers.find(t => t.level === 0) || allTiers[0];
        }
        const totalSpent = parseFloat(wallet.totalSpent?.toString() || '0') || 0;
        const sortedTiers = [...allTiers].sort((a, b) => (b.minSpendingRequired || 0) - (a.minSpendingRequired || 0));
        let tierLevel = 0; // Default to tier 0 (Thành viên)
        for (const tier of sortedTiers) {
            if (totalSpent >= (tier.minSpendingRequired || 0)) {
                tierLevel = tier.level;
                break;
            }
        }
        return allTiers.find(t => t.level === tierLevel) || allTiers.find(t => t.level === 0) || allTiers[0];
    }, [wallet, allTiers]);
    
    useEffect(() => {
        const refetchMembershipData = async () => {
            if (currentUser) {
                setIsLoadingHistory(true);
                try {
                    const [history, newWallet] = await Promise.all([
                        apiService.getUserPointsHistory(currentUser.id),
                        apiService.getUserWallet(currentUser.id)
                    ]);
                    setPointsHistory(history.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
                    setWallet(newWallet);
                } catch (err) {
                    console.error("Failed to refetch membership data:", err);
                } finally {
                    setIsLoadingHistory(false);
                }
            }
        };

        // Only refetch when the user clicks on the membership tab to see the latest data
        if (activeTab === 'membership') {
            refetchMembershipData();
        }
    }, [currentUser, activeTab, setWallet]);

    const showToast = (message: string) => {
        setToastMessage(message);
        setTimeout(() => setToastMessage(null), 3000);
    };
    
    const handleReviewSubmitSuccess = async () => {
        showToast("Cảm ơn bạn đã đánh giá!");
        try {
            // Refetch all relevant data to ensure UI consistency
            const [updatedAppointments, updatedReviews, updatedServices] = await Promise.all([
                apiService.getAppointments(),
                apiService.getReviews({}),
                apiService.getServices(),
            ]);
            setAllAppointments(updatedAppointments);
            setAllReviews(updatedReviews);
            setAllServices(updatedServices);
        } catch (error) {
            console.error("Failed to refetch data after review submission:", error);
        }
    };

    const TabContent = () => {
        switch(activeTab) {
            case 'profile':
                return <ProfileInfoTab currentUser={currentUser} onUpdateUser={onUpdateUser} />;
            case 'membership':
                return <MembershipTab currentUser={currentUser} wallet={wallet} allTiers={allTiers} pointsHistory={pointsHistory} />;
            case 'security':
                return <SecurityTab currentUser={currentUser} />;
            case 'payments':
                return <PaymentsTab currentUser={currentUser} allPayments={allPayments} allServices={allServices} allUsers={allUsers} allAppointments={allAppointments} />;
            case 'appointments':
                return <AppointmentsTab currentUser={currentUser} allAppointments={allAppointments} allServices={allServices} allUsers={allUsers} onReviewSubmit={handleReviewSubmitSuccess} />;
            case 'reviews':
                return <ReviewsTab currentUser={currentUser} allReviews={allReviews} setAllReviews={setAllReviews} allServices={allServices} />;
            case 'promotions':
                return <PromotionsTab currentUser={currentUser} />;
            default:
                return <ProfileInfoTab currentUser={currentUser} onUpdateUser={onUpdateUser} />;
        }
    };
    
    return (
        <div className="bg-brand-light min-h-screen">
            {toastMessage && (
                <div className="fixed top-28 right-6 bg-green-500 text-white p-4 rounded-lg shadow-lg z-[100] animate-fadeInDown">
                    {toastMessage}
                </div>
            )}
            <div className="container mx-auto px-4 py-12">
                 <div className="flex flex-col lg:flex-row gap-8">
                    <ProfileSidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={onLogout} />
                    
                    <main className="flex-1">
                        <ProfileHeader currentUser={currentUser} currentTier={currentTier} onUpdateUser={onUpdateUser} />
                        <div className="mt-8">
                           <TabContent />
                        </div>
                    </main>
                 </div>
            </div>
        </div>
    );
};

export default ProfilePage;
