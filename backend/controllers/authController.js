// backend/controllers/authController.js
const authService = require('../services/authService');

class AuthController {
    /**
     * POST /api/auth/register - Register new user
     */
    async register(req, res) {
        try {
            const { name, email, password, phone, gender, birthday } = req.body;

            // Validation
            if (!name || !email || !password || password.length < 6) {
                return res.status(400).json({ 
                    message: 'Vui lòng điền đầy đủ thông tin và mật khẩu phải có ít nhất 6 ký tự.' 
                });
            }

            // Validate phone number if provided
            if (phone && !/^[0-9]{10,11}$/.test(phone.replace(/\s/g, ''))) {
                return res.status(400).json({ 
                    message: 'Số điện thoại không hợp lệ. Vui lòng nhập 10-11 chữ số.' 
                });
            }

            // Validate birthday if provided
            if (birthday) {
                const birthDate = new Date(birthday);
                const today = new Date();
                if (birthDate > today) {
                    return res.status(400).json({ 
                        message: 'Ngày sinh không thể là ngày trong tương lai.' 
                    });
                }
                const age = today.getFullYear() - birthDate.getFullYear();
                if (age < 13 || age > 120) {
                    return res.status(400).json({ 
                        message: 'Ngày sinh không hợp lệ. Bạn phải từ 13 tuổi trở lên.' 
                    });
                }
            }

            const result = await authService.register(req.body);
            console.log(`User registered: ${email}`);
            res.status(201).json(result);
        } catch (error) {
            console.error('Error registering user:', error);
            console.error('Error stack:', error.stack);
            if (error.message === 'Email already registered') {
                res.status(409).json({ message: 'Email đã tồn tại' });
            } else {
                res.status(500).json({
                    message: 'Internal server error',
                    error: process.env.NODE_ENV === 'development' ? error.message : undefined
                });
            }
        }
    }

    /**
     * POST /api/auth/login - Login user
     */
    async login(req, res) {
        try {
            const { email, password } = req.body;
            const result = await authService.login(email, password);
            console.log(`User logged in: ${email}`);
            res.json(result);
        } catch (error) {
            console.error('Error logging in:', error);
            const statusCode = error.message.includes('xác nhận') || error.message.includes('verified') ? 403 : 401;
            res.status(statusCode).json({
                message: error.message || 'Email hoặc mật khẩu không hợp lệ'
            });
        }
    }

    /**
     * POST /api/auth/change-password - Change password
     */
    async changePassword(req, res) {
        try {
            const { userId, currentPassword, newPassword } = req.body;

            // Validation
            if (!userId || !currentPassword || !newPassword) {
                return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({ 
                    message: 'Mật khẩu mới phải có ít nhất 6 ký tự' 
                });
            }

            const result = await authService.changePassword(userId, currentPassword, newPassword);
            console.log(`Password changed for user: ${userId}`);
            res.json({ message: 'Đổi mật khẩu thành công' });
        } catch (error) {
            console.error('Error changing password:', error);
            if (error.message === 'User not found') {
                res.status(404).json({ message: 'Người dùng không tồn tại' });
            } else if (error.message === 'Current password is incorrect') {
                res.status(401).json({ message: 'Mật khẩu hiện tại không đúng' });
            } else if (error.message === 'New password must be different') {
                res.status(400).json({ message: 'Mật khẩu mới phải khác mật khẩu hiện tại' });
            } else {
                res.status(500).json({ message: 'Lỗi server. Vui lòng thử lại sau' });
            }
        }
    }

    /**
     * POST /api/auth/forgot-password - Request password reset
     */
    async forgotPassword(req, res) {
        try {
            console.log('📧 Forgot password request received:', req.body);
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ message: 'Vui lòng cung cấp địa chỉ email.' });
            }

            const result = await authService.forgotPassword(email);
            console.log('✅ Forgot password result:', result);
            res.json(result);
        } catch (error) {
            console.error('❌ Error in forgot password:', error);
            res.status(400).json({
                message: error.message || 'Không thể xử lý yêu cầu đặt lại mật khẩu. Vui lòng thử lại.'
            });
        }
    }

    /**
     * GET /api/auth/reset-password/:token - Verify reset password token
     */
    async verifyResetToken(req, res) {
        try {
            const { token } = req.params;
            if (!token) {
                return res.status(400).json({ message: 'Token đặt lại mật khẩu không hợp lệ.' });
            }

            const result = await authService.verifyResetToken(token);
            res.json(result);
        } catch (error) {
            console.error('Error verifying reset token:', error);
            res.status(400).json({
                message: error.message || 'Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.'
            });
        }
    }

    /**
     * POST /api/auth/reset-password/:token - Reset password with token
     */
    async resetPasswordWithToken(req, res) {
        try {
            const { token } = req.params;
            const { newPassword } = req.body;

            if (!token) {
                return res.status(400).json({ message: 'Token đặt lại mật khẩu không hợp lệ.' });
            }

            if (!newPassword || newPassword.length < 6) {
                return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
            }

            const result = await authService.resetPasswordWithToken(token, newPassword);
            res.json(result);
        } catch (error) {
            console.error('Error resetting password:', error);
            res.status(400).json({
                message: error.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.'
            });
        }
    }

    /**
     * POST /api/auth/reset-password - Reset password (admin function - old method, kept for backward compatibility)
     */
    async resetPassword(req, res) {
        try {
            const { email, newPassword } = req.body;
            const result = await authService.resetPassword(email, newPassword);
            res.json(result);
        } catch (error) {
            console.error('Error resetting password:', error);
            res.status(400).json({
                error: 'Password reset failed',
                message: error.message
            });
        }
    }

    /**
     * GET /api/auth/verify - Verify token
     */
    async verifyToken(req, res) {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');
            if (!token) {
                return res.status(401).json({ error: 'No token provided' });
            }

            const decoded = authService.verifyToken(token);
            res.json({ valid: true, user: decoded });
        } catch (error) {
            res.status(401).json({
                error: 'Invalid token',
                message: error.message
            });
        }
    }

    /**
     * GET /api/auth/verify-email/:token - Verify email with token
     */
    async verifyEmail(req, res) {
        try {
            const { token } = req.params;
            console.log('📧 Verify email request received, token:', token ? token.substring(0, 20) + '...' : 'null');
            
            if (!token) {
                console.log('❌ No token provided');
                return res.status(400).json({ message: 'Token xác nhận không hợp lệ.' });
            }

            const result = await authService.verifyEmail(token);
            console.log('✅ Email verification successful:', result.user ? result.user.email : 'already verified');
            res.json(result);
        } catch (error) {
            console.error('❌ Error verifying email:', error);
            console.error('Error stack:', error.stack);
            res.status(400).json({
                message: error.message || 'Không thể xác nhận email. Vui lòng thử lại.'
            });
        }
    }

    /**
     * POST /api/auth/resend-verification - Resend verification email
     */
    async resendVerificationEmail(req, res) {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ message: 'Vui lòng cung cấp địa chỉ email.' });
            }

            const result = await authService.resendVerificationEmail(email);
            res.json(result);
        } catch (error) {
            console.error('Error resending verification email:', error);
            res.status(400).json({
                message: error.message || 'Không thể gửi lại email xác nhận. Vui lòng thử lại.'
            });
        }
    }
}

module.exports = new AuthController();
