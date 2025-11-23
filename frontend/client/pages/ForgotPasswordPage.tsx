
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as apiService from '../services/apiService';

const ForgotPasswordPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setIsLoading(true);

        try {
            console.log('🔄 Sending forgot password request for email:', email);
            const result = await apiService.forgotPassword(email);
            console.log('✅ Forgot password response:', result);
            setMessage(result.message);
        } catch (err: any) {
            console.error('❌ Forgot password error:', err);
            // Check if it's a 404 error (route not found)
            if (err.message && err.message.includes('Not Found')) {
                setError('Không tìm thấy API endpoint. Vui lòng kiểm tra lại backend server.');
            } else {
                setError(err.message || 'Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-16 flex justify-center items-center min-h-[70vh]">
            <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-2xl">
                <h1 className="text-3xl font-serif font-bold text-brand-dark text-center mb-6">Quên Mật Khẩu</h1>
                
                {message ? (
                    <div className="text-center">
                        <div className="mb-4">
                            <svg className="mx-auto h-16 w-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="text-green-600 bg-green-50 p-3 rounded-md text-sm mb-4">{message}</p>
                        <Link to="/login" className="font-medium text-brand-primary hover:text-brand-dark">
                            Quay lại trang Đăng nhập
                        </Link>
                    </div>
                ) : (
                    <>
                        <p className="text-center text-sm text-gray-600 mb-6">
                            Đừng lo lắng! Nhập địa chỉ email của bạn và chúng tôi sẽ gửi cho bạn một liên kết để đặt lại mật khẩu.
                        </p>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="email-forgot" className="block text-sm font-medium text-brand-text">Địa chỉ Email</label>
                                <input
                                    id="email-forgot"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="Vui lòng nhập địa chỉ email của bạn"
                                    className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm transition-all duration-300 focus:border-transparent focus:ring-2 focus:ring-brand-primary"
                                />
                            </div>
                            {error && (
                                <p className="text-red-500 text-sm text-center">{error}</p>
                            )}
                            <div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-brand-dark text-white font-bold py-3 px-4 rounded-md hover:bg-brand-primary transition-colors duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? 'Đang gửi...' : 'Gửi Liên Kết Đặt Lại'}
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
            </div>
        </div>
    );
};

export default ForgotPasswordPage;