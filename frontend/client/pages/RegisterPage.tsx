

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { User } from '../../types';
import { EyeIcon, EyeSlashIcon } from '../../shared/icons';
import * as apiService from '../services/apiService';

interface RegisterPageProps {
    onRegister: (response: { user: User, token: string }) => void;
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp.');
            return;
        }

        // Validate phone number (Vietnamese format)
        if (phone && !/^[0-9]{10,11}$/.test(phone.replace(/\s/g, ''))) {
            setError('Số điện thoại không hợp lệ. Vui lòng nhập 10-11 chữ số.');
            return;
        }

        // Validate birthday
        if (birthday) {
            const birthDate = new Date(birthday);
            const today = new Date();
            if (birthDate > today) {
                setError('Ngày sinh không thể là ngày trong tương lai.');
                return;
            }
            const age = today.getFullYear() - birthDate.getFullYear();
            if (age < 13 || age > 120) {
                setError('Ngày sinh không hợp lệ. Bạn phải từ 13 tuổi trở lên.');
                return;
            }
        }

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
            
            onRegister(registeredUserResponse);
            // Navigation is now handled by the useEffect in App.tsx

        } catch (err: any) {
            setError(err.message || 'Đăng ký thất bại. Vui lòng thử lại.');
        }
    };

    return (
        <div className="container mx-auto px-4 py-16 flex justify-center items-center min-h-[70vh]">
            <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-2xl">
                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-brand-dark text-center mb-6">Tạo Tài Khoản Mới</h1>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-brand-text">Họ và Tên</label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm transition-all duration-300 focus:border-transparent focus:ring-2 focus:ring-brand-primary"
                        />
                    </div>
                    <div>
                        <label htmlFor="email-register" className="block text-sm font-medium text-brand-text">Địa chỉ Email</label>
                        <input
                            id="email-register"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm transition-all duration-300 focus:border-transparent focus:ring-2 focus:ring-brand-primary"
                        />
                    </div>
                    <div>
                        <label htmlFor="phone-register" className="block text-sm font-medium text-brand-text">Số điện thoại</label>
                        <input
                            id="phone-register"
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="0123456789"
                            required
                            className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm transition-all duration-300 focus:border-transparent focus:ring-2 focus:ring-brand-primary"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="gender-register" className="block text-sm font-medium text-brand-text">Giới tính</label>
                            <select
                                id="gender-register"
                                value={gender}
                                onChange={(e) => setGender(e.target.value)}
                                required
                                className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm transition-all duration-300 focus:border-transparent focus:ring-2 focus:ring-brand-primary"
                            >
                                <option value="">Chọn giới tính</option>
                                <option value="Nam">Nam</option>
                                <option value="Nữ">Nữ</option>
                                <option value="Khác">Khác</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="birthday-register" className="block text-sm font-medium text-brand-text">Ngày sinh</label>
                            <input
                                id="birthday-register"
                                type="date"
                                value={birthday}
                                onChange={(e) => setBirthday(e.target.value)}
                                required
                                max={new Date().toISOString().split('T')[0]}
                                className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm transition-all duration-300 focus:border-transparent focus:ring-2 focus:ring-brand-primary"
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="password-register" className="block text-sm font-medium text-brand-text">Mật khẩu</label>
                        <div className="relative mt-1">
                            <input
                                id="password-register"
                                type={isPasswordVisible ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
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
                        <label htmlFor="confirm-password" className="block text-sm font-medium text-brand-text">Xác nhận Mật khẩu</label>
                        <div className="relative mt-1">
                            <input
                                id="confirm-password"
                                type={isConfirmPasswordVisible ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
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
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    <div>
                        <button
                            type="submit"
                            className="w-full bg-brand-dark text-white font-bold py-3 px-4 rounded-md hover:bg-brand-primary transition-colors duration-300 shadow-lg"
                        >
                            Đăng Ký
                        </button>
                    </div>
                </form>
                <p className="mt-6 text-center text-sm text-gray-600">
                    Đã có tài khoản?{' '}
                    <Link to="/login" className="font-medium text-brand-primary hover:text-brand-dark">
                        Đăng nhập
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;
