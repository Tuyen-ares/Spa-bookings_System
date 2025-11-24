import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { User } from '../../types';
import { EyeIcon, EyeSlashIcon, LogoIcon, ArrowUturnLeftIcon } from '../../shared/icons';
import * as apiService from '../services/apiService';

interface RegisterPageProps {
    onRegister: (response: { user: User, token: string } | { message: string; email: string; requiresVerification: boolean }) => void;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ onRegister }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [gender, setGender] = useState('');
    const [birthday, setBirthday] = useState('');
    const [error, setError] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp.');
            return;
        }

        if (phone && !/^[0-9]{10,11}$/.test(phone.replace(/\s/g, ''))) {
            setError('Số điện thoại không hợp lệ.');
            return;
        }

        if (birthday) {
            const birthDate = new Date(birthday);
            const today = new Date();
            if (birthDate > today) {
                setError('Ngày sinh không hợp lệ.');
                return;
            }
        }

        setIsLoading(true);

        try {
            const newUser: Pick<User, 'name' | 'email' | 'password' | 'phone' | 'gender' | 'birthday'> = { 
                name, 
                email, 
                password,
                phone: phone.trim() || undefined,
                gender: gender || undefined,
                birthday: birthday || undefined
            };
            const registeredUserResponse = await apiService.register(newUser);
            
            // If requires verification, show success message
            if ('requiresVerification' in registeredUserResponse && registeredUserResponse.requiresVerification) {
                setError(''); // Clear any errors
                // Show success message - user needs to check email
                alert(registeredUserResponse.message + '\n\nVui lòng kiểm tra email để xác nhận tài khoản trước khi đăng nhập.');
                // Don't call onRegister, just show message and redirect to login
                // Clear form
                setName('');
                setEmail('');
                setPassword('');
                setConfirmPassword('');
                setPhone('');
                setGender('');
                setBirthday('');
                // Redirect to login page after 2 seconds
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
                return;
            }
            
            // If token is present, proceed with normal registration flow
            if ('token' in registeredUserResponse) {
                onRegister(registeredUserResponse);
                // Navigation is now handled by the useEffect in App.tsx
            }

        } catch (err: any) {
            setError(err.message || 'Đăng ký thất bại. Vui lòng thử lại.');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-brand-light py-8 px-4 sm:px-6 relative overflow-hidden">
             {/* Dynamic Animated Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-100 via-white to-rose-100 animate-gradient-slow z-0 opacity-80"></div>

            {/* Background Decorations */}
            <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-brand-primary/10 rounded-full mix-blend-multiply filter blur-3xl animate-float"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-accent/10 rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>

            <div className="max-w-2xl w-full bg-white/95 backdrop-blur-xl p-8 rounded-[2rem] shadow-glass z-10 border border-white animate-fadeInUp">
                
                {/* Header Compact */}
                <div className="flex items-center justify-between mb-6">
                    <Link to="/" className="text-gray-400 hover:text-brand-primary transition-colors p-2 hover:bg-gray-50 rounded-full" title="Quay lại">
                        <ArrowUturnLeftIcon className="w-5 h-5"/>
                    </Link>
                    <div className="flex flex-col items-center">
                         <div className="p-2 bg-brand-secondary/50 rounded-full mb-1">
                            <LogoIcon className="h-8 w-8 text-brand-primary" />
                        </div>
                        <h2 className="text-2xl font-serif font-bold text-brand-dark">Đăng Ký Thành Viên</h2>
                    </div>
                    <div className="w-9"></div> {/* Spacer for centering */}
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 border border-red-100 text-red-600 px-4 py-2 rounded-xl text-sm text-center font-medium">
                        {error}
                    </div>
                )}

                <form className="grid grid-cols-1 sm:grid-cols-2 gap-4" onSubmit={handleSubmit}>
                    {/* Row 1: Name & Phone */}
                    <div className="group">
                        <label htmlFor="name" className="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase tracking-wide">Họ và Tên</label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="block w-full px-4 py-2.5 border border-gray-200 bg-gray-50/50 text-brand-text rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all text-sm"
                            placeholder="Nguyễn Văn A"
                        />
                    </div>
                    <div className="group">
                        <label htmlFor="phone" className="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase tracking-wide">Số điện thoại</label>
                        <input
                            id="phone"
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                            className="block w-full px-4 py-2.5 border border-gray-200 bg-gray-50/50 text-brand-text rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all text-sm"
                            placeholder="09xxxxxxxxx"
                        />
                    </div>

                    {/* Row 2: Email (Full Width) */}
                    <div className="sm:col-span-2 group">
                        <label htmlFor="email" className="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase tracking-wide">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="block w-full px-4 py-2.5 border border-gray-200 bg-gray-50/50 text-brand-text rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all text-sm"
                            placeholder="name@example.com"
                        />
                    </div>

                    {/* Row 3: Gender & Birthday */}
                    <div className="group">
                        <label htmlFor="gender" className="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase tracking-wide">Giới tính</label>
                        <div className="relative">
                            <select
                                id="gender"
                                value={gender}
                                onChange={(e) => setGender(e.target.value)}
                                required
                                className="block w-full px-4 py-2.5 border border-gray-200 bg-gray-50/50 text-brand-text rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all text-sm appearance-none"
                            >
                                <option value="">Chọn</option>
                                <option value="Nam">Nam</option>
                                <option value="Nữ">Nữ</option>
                                <option value="Khác">Khác</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                                <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                            </div>
                        </div>
                    </div>
                    <div className="group">
                        <label htmlFor="birthday" className="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase tracking-wide">Ngày sinh</label>
                        <input
                            id="birthday"
                            type="date"
                            value={birthday}
                            onChange={(e) => setBirthday(e.target.value)}
                            required
                            max={new Date().toISOString().split('T')[0]}
                            className="block w-full px-4 py-2.5 border border-gray-200 bg-gray-50/50 text-brand-text rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all text-sm"
                        />
                    </div>

                    {/* Row 4: Password */}
                    <div className="group">
                        <label htmlFor="password" className="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase tracking-wide">Mật khẩu</label>
                        <div className="relative">
                            <input
                                id="password"
                                type={isPasswordVisible ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="block w-full px-4 py-2.5 border border-gray-200 bg-gray-50/50 text-brand-text rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all text-sm pr-10"
                                placeholder="••••••••"
                            />
                             <button
                                type="button"
                                onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-brand-primary focus:outline-none"
                            >
                                {isPasswordVisible ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>
                    <div className="group">
                        <label htmlFor="confirmPassword" className="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase tracking-wide">Xác nhận MK</label>
                        <div className="relative">
                            <input
                                id="confirmPassword"
                                type={isConfirmPasswordVisible ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="block w-full px-4 py-2.5 border border-gray-200 bg-gray-50/50 text-brand-text rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all text-sm pr-10"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-brand-primary focus:outline-none"
                            >
                                {isConfirmPasswordVisible ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>
                    
                    {/* Submit Button */}
                    <div className="sm:col-span-2 mt-2">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-ocean-gradient hover:shadow-lg hover:shadow-brand-primary/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? "Đang xử lý..." : "Đăng Ký Ngay"}
                        </button>
                    </div>
                </form>
                
                <div className="mt-6 text-center pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-600 font-medium">
                        Đã có tài khoản?{' '}
                        <Link to="/login" className="font-bold text-brand-primary hover:text-brand-accent transition-colors hover:underline">
                            Đăng nhập ngay
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
