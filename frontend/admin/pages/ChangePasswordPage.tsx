import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as apiService from '../../client/services/apiService';
import type { User } from '../../types';

interface ChangePasswordPageProps {
    currentUser: User;
}

const ChangePasswordPage: React.FC<ChangePasswordPageProps> = ({ currentUser }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState({
        current: false,
        new: false,
        confirm: false,
    });
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const validateForm = () => {
        if (!formData.currentPassword) {
            setMessage({ type: 'error', text: 'Vui lòng nhập mật khẩu hiện tại' });
            return false;
        }
        if (!formData.newPassword) {
            setMessage({ type: 'error', text: 'Vui lòng nhập mật khẩu mới' });
            return false;
        }
        if (formData.newPassword.length < 6) {
            setMessage({ type: 'error', text: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
            return false;
        }
        if (formData.newPassword !== formData.confirmPassword) {
            setMessage({ type: 'error', text: 'Mật khẩu xác nhận không khớp' });
            return false;
        }
        if (formData.currentPassword === formData.newPassword) {
            setMessage({ type: 'error', text: 'Mật khẩu mới phải khác mật khẩu hiện tại' });
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        try {
            // TODO: Call API to change password
            // await apiService.changePassword({
            //     currentPassword: formData.currentPassword,
            //     newPassword: formData.newPassword,
            // });

            // Temporary success message
            setMessage({
                type: 'success',
                text: 'Đổi mật khẩu thành công! Vui lòng đăng nhập lại.',
            });

            // Reset form
            setFormData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            });

            // Redirect after 2 seconds
            setTimeout(() => {
                // Logout and redirect to login
                // handleLogout();
            }, 2000);
        } catch (error) {
            console.error('Error changing password:', error);
            setMessage({
                type: 'error',
                text: error instanceof Error ? error.message : 'Không thể đổi mật khẩu',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const PasswordInput = ({
        label,
        field,
        showField,
        value,
        onChange,
    }: {
        label: string;
        field: 'current' | 'new' | 'confirm';
        showField: boolean;
        value: string;
        onChange: (value: string) => void;
    }) => (
        <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
                {label}
            </label>
            <div className="relative">
                <input
                    type={showField ? 'text' : 'password'}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={`Nhập ${label.toLowerCase()}`}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
                <button
                    type="button"
                    onClick={() =>
                        setShowPassword((prev) => ({
                            ...prev,
                            [field]: !prev[field],
                        }))
                    }
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                    {showField ? '👁️' : '👁️‍🗨️'}
                </button>
            </div>
        </div>
    );

    return (
        <div className="p-6 max-w-2xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">🔒 Đổi mật khẩu</h1>
                <p className="text-gray-600 mt-2">Cập nhật mật khẩu của bạn để bảo vệ tài khoản</p>
            </div>

            {/* Alert Messages */}
            {message && (
                <div
                    className={`mb-6 p-4 rounded-lg ${
                        message.type === 'success'
                            ? 'bg-green-50 border border-green-200 text-green-800'
                            : 'bg-red-50 border border-red-200 text-red-800'
                    }`}
                >
                    <div className="flex items-center gap-2">
                        <span>{message.type === 'success' ? '✅' : '❌'}</span>
                        <span>{message.text}</span>
                    </div>
                </div>
            )}

            {/* Form Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Current Password */}
                    <PasswordInput
                        label="Mật khẩu hiện tại"
                        field="current"
                        showField={showPassword.current}
                        value={formData.currentPassword}
                        onChange={(value) =>
                            setFormData({ ...formData, currentPassword: value })
                        }
                    />

                    {/* Divider */}
                    <div className="border-t border-gray-200 pt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Mật khẩu mới
                        </h3>
                    </div>

                    {/* New Password */}
                    <PasswordInput
                        label="Mật khẩu mới"
                        field="new"
                        showField={showPassword.new}
                        value={formData.newPassword}
                        onChange={(value) =>
                            setFormData({ ...formData, newPassword: value })
                        }
                    />

                    {/* Password Requirements */}
                    {formData.newPassword && (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="text-sm font-medium text-blue-900 mb-2">
                                Yêu cầu mật khẩu:
                            </div>
                            <ul className="space-y-1 text-sm text-blue-800">
                                <li
                                    className={
                                        formData.newPassword.length >= 6
                                            ? 'text-green-600'
                                            : 'text-red-600'
                                    }
                                >
                                    {formData.newPassword.length >= 6 ? '✓' : '✗'} Ít nhất 6 ký tự
                                </li>
                                <li
                                    className={
                                        formData.newPassword !== formData.currentPassword
                                            ? 'text-green-600'
                                            : 'text-red-600'
                                    }
                                >
                                    {formData.newPassword !== formData.currentPassword
                                        ? '✓'
                                        : '✗'}{' '}
                                    Khác mật khẩu hiện tại
                                </li>
                                <li
                                    className={
                                        formData.confirmPassword &&
                                        formData.newPassword === formData.confirmPassword
                                            ? 'text-green-600'
                                            : formData.confirmPassword
                                            ? 'text-red-600'
                                            : 'text-gray-600'
                                    }
                                >
                                    {formData.confirmPassword &&
                                    formData.newPassword === formData.confirmPassword
                                        ? '✓'
                                        : formData.confirmPassword
                                        ? '✗'
                                        : '•'}{' '}
                                    Khớp với xác nhận mật khẩu
                                </li>
                            </ul>
                        </div>
                    )}

                    {/* Confirm Password */}
                    <PasswordInput
                        label="Xác nhận mật khẩu mới"
                        field="confirm"
                        showField={showPassword.confirm}
                        value={formData.confirmPassword}
                        onChange={(value) =>
                            setFormData({ ...formData, confirmPassword: value })
                        }
                    />

                    {/* Buttons */}
                    <div className="flex gap-4 pt-6 border-t border-gray-200">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 px-6 py-3 bg-brand-primary text-white rounded-lg hover:bg-brand-dark transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                            {isLoading ? 'Đang xử lý...' : '🔒 Cập nhật mật khẩu'}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/admin/profile')}
                            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                        >
                            ❌ Hủy
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChangePasswordPage;
