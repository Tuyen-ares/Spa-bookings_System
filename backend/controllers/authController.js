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
            if (error.message === 'Email already registered') {
                res.status(409).json({ message: 'Email đã tồn tại' });
            } else {
                res.status(500).json({
                    message: 'Internal server error'
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
            res.status(401).json({
                message: 'Email hoặc mật khẩu không hợp lệ'
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
     * POST /api/auth/reset-password - Reset password
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
}

module.exports = new AuthController();
