import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import * as apiService from '../services/apiService';

const VerifyEmailPage: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');
    const [email, setEmail] = useState('');
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);
    const [verifiedUser, setVerifiedUser] = useState<any>(null);

    useEffect(() => {
        // Check if we're on a non-hash URL (from old email link) and redirect to hash URL
        if (window.location.pathname.startsWith('/verify-email/') && !window.location.hash) {
            const pathToken = window.location.pathname.replace('/verify-email/', '');
            console.log('🔄 Redirecting from non-hash URL to hash URL with token:', pathToken.substring(0, 20) + '...');
            window.location.href = `/#/verify-email/${pathToken}`;
            return;
        }

        const verifyEmail = async () => {
            if (!token) {
                setStatus('error');
                setMessage('Token xác nhận không hợp lệ.');
                return;
            }

            try {
                console.log('🔍 Verifying email with token:', token ? token.substring(0, 20) + '...' : 'null');
                const result = await apiService.verifyEmail(token);
                console.log('✅ Verify email result:', result);
                
                setStatus('success');
                setMessage(result.message);
                
                // If token is returned, save it and show success dialog
                if (result.token && result.user) {
                    setVerifiedUser(result.user);
                    localStorage.setItem('token', result.token);
                    localStorage.setItem('currentUser', JSON.stringify(result.user));
                    // Dispatch custom event to notify App.tsx to update user state
                    window.dispatchEvent(new CustomEvent('user-verified', { detail: result.user }));
                    // Show success dialog
                    setShowSuccessDialog(true);
                } else if (result.alreadyVerified) {
                    // If already verified, just show message and redirect to login
                    setMessage(result.message + ' Bạn có thể đăng nhập ngay.');
                    setTimeout(() => {
                        navigate('/login');
                    }, 2000);
                }
            } catch (error: any) {
                console.error('❌ Error verifying email:', error);
                setStatus('error');
                setMessage(error.message || 'Không thể xác nhận email. Vui lòng thử lại.');
            }
        };

        verifyEmail();
    }, [token, navigate]);

    const handleResendEmail = async () => {
        if (!email) {
            alert('Vui lòng nhập địa chỉ email của bạn.');
            return;
        }

        try {
            const result = await apiService.resendVerificationEmail(email);
            alert(result.message);
        } catch (error: any) {
            alert(error.message || 'Không thể gửi lại email. Vui lòng thử lại sau.');
        }
    };

    return (
        <div className="container mx-auto px-4 py-16 flex justify-center items-center min-h-[70vh]">
            <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-2xl text-center">
                {status === 'loading' && (
                    <>
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-primary mx-auto mb-4"></div>
                        <h1 className="text-2xl font-serif font-bold text-brand-dark mb-4">Đang xác nhận email...</h1>
                        <p className="text-gray-600">Vui lòng đợi trong giây lát.</p>
                    </>
                )}

                {status === 'success' && !showSuccessDialog && (
                    <>
                        <div className="mb-4">
                            <svg className="mx-auto h-16 w-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-serif font-bold text-brand-dark mb-4">Xác nhận thành công!</h1>
                        <p className="text-gray-600 mb-6">{message}</p>
                        <p className="text-sm text-gray-500">Đang chuyển hướng...</p>
                    </>
                )}

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
                                Xác thực Email Thành Công!
                            </h2>
                            <p className="text-gray-600 mb-2">
                                Tài khoản của bạn đã được kích hoạt thành công.
                            </p>
                            {verifiedUser && (
                                <p className="text-sm text-gray-500 mb-6">
                                    Chào mừng <span className="font-semibold text-brand-dark">{verifiedUser.name}</span>!
                                </p>
                            )}
                            <div className="space-y-3">
                                <button
                                    onClick={() => {
                                        setShowSuccessDialog(false);
                                        navigate('/', { replace: true });
                                        // Force reload to ensure App.tsx reads the new user from localStorage
                                        setTimeout(() => {
                                            window.location.reload();
                                        }, 100);
                                    }}
                                    className="w-full bg-brand-dark text-white font-bold py-3 px-6 rounded-md hover:bg-brand-primary transition-colors duration-300 shadow-lg"
                                >
                                    Vào Trang Chủ
                                </button>
                                <button
                                    onClick={() => {
                                        setShowSuccessDialog(false);
                                        navigate('/booking', { replace: true });
                                        setTimeout(() => {
                                            window.location.reload();
                                        }, 100);
                                    }}
                                    className="w-full bg-brand-primary text-white font-bold py-3 px-6 rounded-md hover:bg-brand-dark transition-colors duration-300"
                                >
                                    Đặt Lịch Ngay
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <>
                        <div className="mb-4">
                            <svg className="mx-auto h-16 w-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-serif font-bold text-brand-dark mb-4">Xác nhận thất bại</h1>
                        <p className="text-gray-600 mb-6">{message}</p>
                        
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="resend-email" className="block text-sm font-medium text-gray-700 mb-2">
                                    Gửi lại email xác nhận
                                </label>
                                <input
                                    id="resend-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Nhập địa chỉ email của bạn"
                                    className="w-full p-3 border border-gray-300 rounded-md mb-2"
                                />
                                <button
                                    onClick={handleResendEmail}
                                    className="w-full bg-brand-primary text-white font-bold py-2 px-4 rounded-md hover:bg-brand-dark transition-colors"
                                >
                                    Gửi lại email
                                </button>
                            </div>
                            
                            <div className="pt-4 border-t">
                                <Link
                                    to="/login"
                                    className="text-brand-primary hover:text-brand-dark font-medium"
                                >
                                    Quay lại trang đăng nhập
                                </Link>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default VerifyEmailPage;

