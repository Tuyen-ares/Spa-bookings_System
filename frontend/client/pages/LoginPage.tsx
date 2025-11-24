// import React, { useState } from 'react';
// import { Link, useLocation } from 'react-router-dom';
// import type { User } from '../../types';
// import { EyeIcon, EyeSlashIcon, GoogleIcon } from '../../shared/icons';
// import * as apiService from '../services/apiService';

// interface LoginPageProps {
//     onLogin: (response: { user: User, token: string }) => void;
// }

// const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
//     const [email, setEmail] = useState('');
//     const [password, setPassword] = useState('');
//     const [error, setError] = useState('');
//     const [successMessage, setSuccessMessage] = useState('');
//     const [isPasswordVisible, setIsPasswordVisible] = useState(false);
//     const location = useLocation();

//     React.useEffect(() => {
//         if (location.state?.message) {
//             setSuccessMessage(location.state.message);
//         }
//     }, [location]);

//     const handleSubmit = async (e: React.FormEvent) => {
//         e.preventDefault();
//         setError('');
//         setSuccessMessage('');

//         try {
//             const loginResponse = await apiService.login({ email, password });
//             onLogin(loginResponse);
//             // Navigation is now handled by the useEffect in App.tsx
//         } catch (err: any) {
//             setError(err.message || 'Đăng nhập thất bại.');
//         }
//     };
    
//     const handleGoogleLogin = async () => {
//         setError('');
//         setSuccessMessage('');
//         // TODO: Implement real Google OAuth login
//         // For now, show error message that Google login is not yet implemented
//         setError('Đăng nhập bằng Google chưa được hỗ trợ. Vui lòng sử dụng email và mật khẩu để đăng nhập.');
//     }

//     return (
//         <div className="container mx-auto px-4 py-16 flex justify-center items-center min-h-[70vh]">
//             <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-2xl">
//                 <h1 className="text-2xl sm:text-3xl font-serif font-bold text-brand-dark text-center mb-6">Đăng Nhập</h1>
//                 {successMessage && <p className="text-green-600 bg-green-50 p-3 rounded-md text-sm text-center mb-4">{successMessage}</p>}
                
//                 <form onSubmit={handleSubmit} className="space-y-6">
//                      <div>
//                         <label htmlFor="email" className="block text-sm font-medium text-brand-text">Địa chỉ Email</label>
//                         <input
//                             id="email"
//                             type="email"
//                             value={email}
//                             onChange={(e) => setEmail(e.target.value)}
//                             required
//                             className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm"
//                         />
//                     </div>
//                     <div>
//                         <label htmlFor="password" className="block text-sm font-medium text-brand-text">Mật khẩu</label>
//                          <div className="relative mt-1">
//                             <input
//                                 id="password"
//                                 type={isPasswordVisible ? 'text' : 'password'}
//                                 value={password}
//                                 onChange={(e) => setPassword(e.target.value)}
//                                 required
//                                 className="block w-full p-3 border border-gray-300 rounded-md shadow-sm"
//                             />
//                             <button
//                                 type="button"
//                                 onClick={() => setIsPasswordVisible(!isPasswordVisible)}
//                                 className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400"
//                             >
//                                 {isPasswordVisible ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
//                             </button>
//                         </div>
//                     </div>
//                     {error && <p className="text-red-500 text-sm text-center">{error}</p>}
//                     <div>
//                         <button
//                             type="submit"
//                             className="w-full bg-brand-dark text-white font-bold py-3 px-4 rounded-md hover:bg-brand-primary"
//                         >
//                             Đăng Nhập
//                         </button>
//                     </div>
//                 </form>
//                 <div className="mt-4 text-right">
//                     <Link to="/forgot-password" className="text-sm text-brand-primary hover:text-brand-dark">Quên mật khẩu?</Link>
//                 </div>
//                 <div className="relative my-6">
//                     <div className="absolute inset-0 flex items-center">
//                         <div className="w-full border-t border-gray-300"></div>
//                     </div>
//                     <div className="relative flex justify-center text-sm">
//                         <span className="px-2 bg-white text-gray-500">hoặc</span>
//                     </div>
//                 </div>
//                 <div>
//                     <button onClick={handleGoogleLogin} className="w-full flex justify-center items-center gap-2 bg-white border border-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-md hover:bg-gray-50">
//                         <GoogleIcon className="w-5 h-5" /> Đăng nhập với Google
//                     </button>
//                 </div>
//                 <p className="mt-6 text-center text-sm text-gray-600">
//                     Chưa có tài khoản?{' '}
//                     <Link to="/register" className="font-medium text-brand-primary hover:text-brand-dark">
//                         Đăng ký ngay
//                     </Link>
//                 </p>
//             </div>
//         </div>
//     );
// };

// export default LoginPage;

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { User } from '../../types';
import { EyeIcon, EyeSlashIcon, GoogleIcon, LogoIcon, ArrowUturnLeftIcon } from '../../shared/icons';
import * as apiService from '../services/apiService';

interface LoginPageProps {
    onLogin: (response: { user: User, token: string }) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const location = useLocation();

    React.useEffect(() => {
        if (location.state?.message) {
            setSuccessMessage(location.state.message);
        }
    }, [location]);

    const validateEmail = (email: string) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        // Validation
        if (!email.trim() || !password.trim()) {
            setError('Vui lòng nhập đầy đủ email và mật khẩu.');
            return;
        }

        if (!validateEmail(email)) {
            setError('Định dạng email không hợp lệ. Vui lòng kiểm tra lại (ví dụ: name@example.com).');
            return;
        }

        if (password.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự.');
            return;
        }

        setIsLoading(true);

        try {
            const loginResponse = await apiService.login({ email, password });
            onLogin(loginResponse);
        } catch (err: any) {
            setError(err.message || 'Đăng nhập thất bại.');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-brand-light">
            {/* Dynamic Animated Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-100 via-white to-rose-100 animate-gradient-slow z-0 opacity-80"></div>

            {/* Distinct, Fresh Brand Blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-brand-primary/20 rounded-full mix-blend-multiply filter blur-3xl animate-float"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-brand-secondary/80 rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
            <div className="absolute top-[20%] right-[10%] w-[300px] h-[300px] bg-brand-accent/10 rounded-full mix-blend-multiply filter blur-2xl animate-pulse"></div>

            <div className="max-w-md w-full space-y-8 bg-white/80 backdrop-blur-xl p-8 sm:p-10 rounded-[2rem] shadow-glass z-10 border border-white animate-fadeInUp">
                
                <div className="flex justify-between items-start">
                    <Link to="/" className="text-gray-400 hover:text-brand-primary transition-colors p-2 hover:bg-white rounded-full" title="Quay lại trang chủ">
                        <ArrowUturnLeftIcon className="w-6 h-6"/>
                    </Link>
                    <div className="flex-grow text-center -ml-10">
                        <Link to="/" className="inline-block transform hover:scale-110 transition-transform duration-300">
                            <LogoIcon className="h-20 w-20 text-brand-primary mx-auto drop-shadow-md" />
                        </Link>
                    </div>
                </div>

                <div className="text-center">
                    <h2 className="text-4xl font-serif font-bold text-brand-dark mb-2 tracking-tight">
                        Chào Mừng
                    </h2>
                    <p className="text-base text-gray-600 font-medium">
                        Đăng nhập để tận hưởng không gian thư giãn
                    </p>
                </div>

                {successMessage && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm text-center font-medium shadow-sm">
                        {successMessage}
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm text-center font-medium shadow-sm">
                        {error}
                    </div>
                )}
                
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-5">
                        <div className="group">
                            <label htmlFor="email" className="block text-sm font-bold text-brand-dark mb-1.5 pl-1">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="appearance-none relative block w-full px-5 py-3.5 border border-gray-200 bg-white text-brand-text rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all duration-200 sm:text-sm shadow-sm hover:shadow-md"
                                placeholder="Vui lòng nhập email của bạn"
                            />
                        </div>
                        <div className="group">
                            <div className="flex items-center justify-between mb-1.5 pl-1">
                                <label htmlFor="password" className="block text-sm font-bold text-brand-dark">
                                    Mật khẩu
                                </label>
                                <Link to="/forgot-password" className="text-sm font-semibold text-brand-primary hover:text-brand-accent transition-colors">
                                    Quên mật khẩu?
                                </Link>
                            </div>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={isPasswordVisible ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="appearance-none relative block w-full px-5 py-3.5 border border-gray-200 bg-white text-brand-text rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all duration-200 sm:text-sm pr-12 shadow-sm hover:shadow-md"
                                    placeholder="Vui lòng nhập mật khẩu của bạn"
                                />
                                <button
                                    type="button"
                                    onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                                    className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-400 hover:text-brand-primary focus:outline-none transition-colors"
                                >
                                    {isPasswordVisible ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-bold rounded-2xl text-white bg-ocean-gradient hover:shadow-lg hover:shadow-brand-primary/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Đang xử lý...
                                </span>
                            ) : "Đăng Nhập Ngay"}
                        </button>
                    </div>
                </form>

                <p className="mt-8 text-center text-sm text-gray-600 font-medium">
                    Bạn chưa có tài khoản?{' '}
                    <Link to="/register" className="font-bold text-brand-primary hover:text-brand-accent transition-colors hover:underline decoration-2 underline-offset-4">
                        Đăng ký miễn phí
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;