import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import * as apiService from '../services/apiService';
import { EyeIcon, EyeSlashIcon } from '../../shared/icons';

const ResetPasswordPage: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
    const [status, setStatus] = useState<'loading' | 'ready' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [userInfo, setUserInfo] = useState<{ email?: string; name?: string } | null>(null);
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);

    useEffect(() => {
        // Check if we're on a non-hash URL (from old email link) and redirect to hash URL
        if (window.location.pathname.startsWith('/reset-password/') && !window.location.hash) {
            const pathToken = window.location.pathname.replace('/reset-password/', '');
            console.log('🔄 Redirecting from non-hash URL to hash URL with token:', pathToken.substring(0, 20) + '...');
            window.location.href = `/#/reset-password/${pathToken}`;
            return;
        }

        const verifyToken = async () => {
            if (!token) {
                setStatus('error');
                setMessage('Token đặt lại mật khẩu không hợp lệ.');
                return;
            }

            try {
                console.log('🔍 Verifying reset token:', token.substring(0, 20) + '...');
                const result = await apiService.verifyResetToken(token);
                console.log('✅ Reset token verified:', result);
                setStatus('ready');
                setUserInfo({ email: result.email, name: result.name });
            } catch (error: any) {
                console.error('❌ Error verifying reset token:', error);
                setStatus('error');
                setMessage(error.message || 'Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.');
            }
        };

        verifyToken();
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp.');
            return;
        }

        if (newPassword.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự.');
            return;
        }

        try {
            console.log('🔄 Resetting password with token...');
            const result = await apiService.resetPasswordWithToken(token!, newPassword);
            console.log('✅ Password reset successful');
            setStatus('success');
            setMessage(result.message);
            setShowSuccessDialog(true);
        } catch (error: any) {
            console.error('❌ Error resetting password:', error);
            setError(error.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.');
        }
    };

    const handleCloseDialog = () => {
        setShowSuccessDialog(false);
        navigate('/login', { replace: true });
    };

    return (
        <>
            {/* Success Dialog Modal */}
            {showSuccessDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-8 text-center">
                        <div className="mb-6">
                            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100">
                                <svg className="h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                        <h2 className="text-3xl font-serif font-bold text-brand-dark mb-4">
                            Đặt Lại Mật Khẩu Thành Công!
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Mật khẩu của bạn đã được đặt lại thành công. Bạn có thể đăng nhập với mật khẩu mới.
                        </p>
                        <button
                            onClick={handleCloseDialog}
                            className="w-full bg-brand-dark text-white font-bold py-3 px-6 rounded-md hover:bg-brand-primary transition-colors duration-300 shadow-lg"
                        >
                            Đăng Nhập Ngay
                        </button>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="container mx-auto px-4 py-16 flex justify-center items-center min-h-[70vh]">
                <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-2xl">
                    <h1 className="text-3xl font-serif font-bold text-brand-dark text-center mb-6">Đặt Lại Mật Khẩu</h1>
                    
                    {status === 'loading' && (
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-primary mx-auto mb-4"></div>
                            <p className="text-gray-600">Đang xác thực token...</p>
                        </div>
                    )}

                    {status === 'ready' && (
                        <>
                            {userInfo && (
                                <p className="text-center text-sm text-gray-600 mb-6">
                                    Xin chào <span className="font-semibold">{userInfo.name}</span> ({userInfo.email})
                                    <br />
                                    Vui lòng nhập mật khẩu mới của bạn.
                                </p>
                            )}
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label htmlFor="new-password" className="block text-sm font-medium text-brand-text">Mật khẩu mới</label>
                                    <div className="relative mt-1">
                                        <input
                                            id="new-password"
                                            type={isPasswordVisible ? 'text' : 'password'}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required
                                            minLength={6}
                                            placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                                            className="block w-full p-3 border border-gray-300 rounded-md shadow-sm transition-all duration-300 focus:border-transparent focus:ring-2 focus:ring-brand-primary"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                                            className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-brand-dark"
                                            aria-label={isPasswordVisible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                                        >
                                            {isPasswordVisible ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="confirm-password-reset" className="block text-sm font-medium text-brand-text">Xác nhận mật khẩu mới</label>
                                    <div className="relative mt-1">
                                        <input
                                            id="confirm-password-reset"
                                            type={isConfirmPasswordVisible ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                            minLength={6}
                                            placeholder="Nhập lại mật khẩu mới"
                                            className="block w-full p-3 border border-gray-300 rounded-md shadow-sm transition-all duration-300 focus:border-transparent focus:ring-2 focus:ring-brand-primary"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                                            className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-brand-dark"
                                            aria-label={isConfirmPasswordVisible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                                        >
                                            {isConfirmPasswordVisible ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>
                                {error && (
                                    <p className="text-red-500 text-sm text-center">{error}</p>
                                )}
                                <div>
                                    <button
                                        type="submit"
                                        className="w-full bg-brand-dark text-white font-bold py-3 px-4 rounded-md hover:bg-brand-primary transition-colors duration-300 shadow-lg"
                                    >
                                        Đặt Lại Mật Khẩu
                                    </button>
                                </div>
                            </form>
                            <p className="mt-6 text-center text-sm text-gray-600">
                                Nhớ mật khẩu của bạn?{' '}
                                <Link to="/login" className="font-medium text-brand-primary hover:text-brand-dark">
                                    Đăng nhập
                                </Link>
                            </p>
                        </>
                    )}

                    {status === 'error' && (
                        <div className="text-center">
                            <div className="mb-4">
                                <svg className="mx-auto h-16 w-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-serif font-bold text-brand-dark mb-4">Token Không Hợp Lệ</h2>
                            <p className="text-gray-600 mb-6">{message}</p>
                            <div className="space-y-3">
                                <Link
                                    to="/forgot-password"
                                    className="block w-full bg-brand-primary text-white font-bold py-2 px-4 rounded-md hover:bg-brand-dark transition-colors text-center"
                                >
                                    Yêu Cầu Link Mới
                                </Link>
                                <Link
                                    to="/login"
                                    className="block text-brand-primary hover:text-brand-dark font-medium text-center"
                                >
                                    Quay lại trang Đăng nhập
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default ResetPasswordPage;

