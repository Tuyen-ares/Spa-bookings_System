

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { User } from '../../types';
import { EyeIcon, EyeSlashIcon, GoogleIcon } from '../../shared/icons';
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
    const location = useLocation();

    React.useEffect(() => {
        if (location.state?.message) {
            setSuccessMessage(location.state.message);
        }
    }, [location]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        try {
            const loginResponse = await apiService.login({ email, password });
            onLogin(loginResponse);
            // Navigation is now handled by the useEffect in App.tsx
        } catch (err: any) {
            setError(err.message || 'Đăng nhập thất bại.');
        }
    };
    
    const handleGoogleLogin = async () => {
        setError('');
        setSuccessMessage('');
        // TODO: Implement real Google OAuth login
        // For now, show error message that Google login is not yet implemented
        setError('Đăng nhập bằng Google chưa được hỗ trợ. Vui lòng sử dụng email và mật khẩu để đăng nhập.');
    }

    return (
        <div className="container mx-auto px-4 py-16 flex justify-center items-center min-h-[70vh]">
            <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-2xl">
                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-brand-dark text-center mb-6">Đăng Nhập</h1>
                {successMessage && <p className="text-green-600 bg-green-50 p-3 rounded-md text-sm text-center mb-4">{successMessage}</p>}
                
                <form onSubmit={handleSubmit} className="space-y-6">
                     <div>
                        <label htmlFor="email" className="block text-sm font-medium text-brand-text">Địa chỉ Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-brand-text">Mật khẩu</label>
                         <div className="relative mt-1">
                            <input
                                id="password"
                                type={isPasswordVisible ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="block w-full p-3 border border-gray-300 rounded-md shadow-sm"
                            />
                            <button
                                type="button"
                                onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400"
                            >
                                {isPasswordVisible ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    <div>
                        <button
                            type="submit"
                            className="w-full bg-brand-dark text-white font-bold py-3 px-4 rounded-md hover:bg-brand-primary"
                        >
                            Đăng Nhập
                        </button>
                    </div>
                </form>
                <div className="mt-4 text-right">
                    <Link to="/forgot-password" className="text-sm text-brand-primary hover:text-brand-dark">Quên mật khẩu?</Link>
                </div>
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">hoặc</span>
                    </div>
                </div>
                <div>
                    <button onClick={handleGoogleLogin} className="w-full flex justify-center items-center gap-2 bg-white border border-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-md hover:bg-gray-50">
                        <GoogleIcon className="w-5 h-5" /> Đăng nhập với Google
                    </button>
                </div>
                <p className="mt-6 text-center text-sm text-gray-600">
                    Chưa có tài khoản?{' '}
                    <Link to="/register" className="font-medium text-brand-primary hover:text-brand-dark">
                        Đăng ký ngay
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
