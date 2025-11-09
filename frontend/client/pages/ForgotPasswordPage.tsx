
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const ForgotPasswordPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(`Nếu email "${email}" tồn tại trong hệ thống, chúng tôi đã gửi một liên kết đặt lại mật khẩu đến đó.`);
    };

    return (
        <div className="container mx-auto px-4 py-16 flex justify-center items-center min-h-[70vh]">
            <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-2xl">
                <h1 className="text-3xl font-serif font-bold text-brand-dark text-center mb-6">Quên Mật Khẩu</h1>
                
                {message ? (
                    <div className="text-center">
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
                            <div>
                                <button
                                    type="submit"
                                    className="w-full bg-brand-dark text-white font-bold py-3 px-4 rounded-md hover:bg-brand-primary transition-colors duration-300 shadow-lg"
                                >
                                    Gửi Liên Kết Đặt Lại
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