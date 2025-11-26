
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import * as apiService from '../services/apiService';
import { 
    CheckCircleIcon, 
    XCircleIcon, 
    MailIcon, 
    HomeIcon, 
    CalendarIcon, 
    ArrowUturnLeftIcon,
    LogoIcon
} from '../../shared/icons';

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
            window.location.href = `/#/verify-email/${pathToken}`;
            return;
        }

        const verifyEmail = async () => {
            if (!token) {
                setStatus('error');
                setMessage('Token xác nhận không hợp lệ hoặc đường dẫn đã hỏng.');
                return;
            }

            try {
                const result = await apiService.verifyEmail(token);
                
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
                    setMessage(result.message);
                    setTimeout(() => {
                        navigate('/login');
                    }, 3000);
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
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-brand-light px-4 font-sans">
            {/* Dynamic Animated Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 via-white to-rose-50 animate-gradient-slow z-0 opacity-90"></div>

            {/* Background Decorations */}
            <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-brand-primary/5 rounded-full mix-blend-multiply filter blur-[80px] animate-float"></div>
            <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-100/40 rounded-full mix-blend-multiply filter blur-[80px] animate-float" style={{ animationDelay: '2s' }}></div>

            <div className="w-full max-w-lg bg-white/80 backdrop-blur-2xl p-8 sm:p-10 rounded-[2.5rem] shadow-2xl z-10 border border-white/60 animate-fadeInUp relative">
                
                {/* Top Logo */}
                <div className="flex justify-center mb-8">
                    <Link to="/" className="p-3 bg-white rounded-full shadow-md hover:scale-105 transition-transform">
                        <LogoIcon className="h-10 w-10 text-brand-primary" />
                    </Link>
                </div>

                {status === 'loading' && (
                    <div className="text-center py-8">
                        <div className="relative w-20 h-20 mx-auto mb-6">
                            <div className="absolute inset-0 border-4 border-brand-secondary rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-brand-primary rounded-full border-t-transparent animate-spin"></div>
                            <LogoIcon className="absolute inset-0 m-auto h-8 w-8 text-brand-primary animate-pulse" />
                        </div>
                        <h2 className="text-2xl font-serif font-bold text-brand-dark mb-2">Đang xác thực...</h2>
                        <p className="text-gray-500">Vui lòng đợi trong giây lát, chúng tôi đang kiểm tra thông tin của bạn.</p>
                    </div>
                )}

                {status === 'success' && !showSuccessDialog && (
                    <div className="text-center py-6">
                        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner animate-[bounce_1s_infinite]">
                            <CheckCircleIcon className="w-12 h-12 text-green-600" />
                        </div>
                        <h2 className="text-3xl font-serif font-bold text-brand-dark mb-3">Thành Công!</h2>
                        <p className="text-gray-600 mb-8 font-medium">{message}</p>
                        <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                            <div className="w-2 h-2 bg-brand-primary rounded-full animate-ping"></div>
                            Đang chuyển hướng đến trang đăng nhập...
                        </div>
                    </div>
                )}

                {/* Success Dialog Modal Overlay */}
                {showSuccessDialog && (
                    <div className="absolute inset-0 bg-white/95 backdrop-blur-xl z-20 flex flex-col items-center justify-center p-8 rounded-[2.5rem] text-center animate-fadeIn">
                        {/* Confetti decoration */}
                        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-30">
                            <div className="absolute top-10 left-10 w-4 h-4 bg-red-400 rounded-full animate-bounce"></div>
                            <div className="absolute top-20 right-20 w-3 h-3 bg-blue-400 transform rotate-45 animate-pulse"></div>
                            <div className="absolute bottom-10 left-1/3 w-5 h-5 bg-yellow-400 rounded-md animate-spin"></div>
                        </div>

                        <div className="w-20 h-20 bg-green-50 border-2 border-green-100 rounded-full flex items-center justify-center mb-6 shadow-lg">
                            <CheckCircleIcon className="w-10 h-10 text-green-500" />
                        </div>

                        <h2 className="text-2xl font-serif font-extrabold text-brand-dark mb-2">
                            Chào mừng, {verifiedUser?.name || 'Bạn'}!
                        </h2>
                        <p className="text-gray-500 mb-8 text-sm">
                            Tài khoản của bạn đã được kích hoạt thành công. Hãy bắt đầu hành trình làm đẹp ngay hôm nay.
                        </p>

                        <div className="w-full space-y-3">
                            <button
                                onClick={() => {
                                    setShowSuccessDialog(false);
                                    navigate('/', { replace: true });
                                    setTimeout(() => window.location.reload(), 100);
                                }}
                                className="w-full py-4 bg-brand-dark text-white font-bold rounded-xl hover:bg-brand-primary shadow-lg hover:shadow-brand-primary/30 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2"
                            >
                                <HomeIcon className="w-5 h-5"/> Vào Trang Chủ
                            </button>
                            <button
                                onClick={() => {
                                    setShowSuccessDialog(false);
                                    navigate('/booking', { replace: true });
                                    setTimeout(() => window.location.reload(), 100);
                                }}
                                className="w-full py-4 bg-white text-brand-primary border border-brand-primary/30 font-bold rounded-xl hover:bg-brand-secondary/30 transition-all flex items-center justify-center gap-2"
                            >
                                <CalendarIcon className="w-5 h-5"/> Đặt Lịch Ngay
                            </button>
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div className="text-center">
                        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-100">
                            <XCircleIcon className="w-10 h-10 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-serif font-bold text-gray-800 mb-2">Xác nhận thất bại</h2>
                        <p className="text-gray-500 mb-8 text-sm px-4">{message}</p>
                        
                        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 text-left">
                            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                <MailIcon className="w-4 h-4 text-brand-primary" /> Gửi lại email xác nhận
                            </h3>
                            <div className="space-y-3">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Nhập địa chỉ email của bạn"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none bg-white"
                                />
                                <button
                                    onClick={handleResendEmail}
                                    className="w-full py-3 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-dark transition-all shadow-md hover:shadow-lg"
                                >
                                    Gửi lại liên kết
                                </button>
                            </div>
                        </div>
                        
                        <div className="mt-8">
                            <Link
                                to="/login"
                                className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-brand-primary transition-colors"
                            >
                                <ArrowUturnLeftIcon className="w-4 h-4" /> Quay lại đăng nhập
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerifyEmailPage;
