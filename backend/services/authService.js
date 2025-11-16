// backend/services/authService.js
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

class AuthService {
    /**
     * Register new user
     */
    async register(userData) {
        const { name, email, password, phone, role = 'Client', gender, birthday } = userData;

        // Check if user exists
        const existingUser = await db.User.findOne({ where: { email } });
        if (existingUser) {
            throw new Error('Email already registered');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = `user-client-${uuidv4()}`;

        // Start transaction
        const t = await db.sequelize.transaction();

        try {
            // Create user
            const user = await db.User.create({
                id: userId,
                name,
                email,
                password: hashedPassword,
                phone: phone ? phone.trim() : null,
                profilePictureUrl: `https://picsum.photos/seed/${userId}/200`,
                joinDate: new Date().toISOString().split('T')[0],
                birthday: birthday || null,
                gender: gender || null,
                role,
                status: 'Active',
                lastLogin: new Date().toISOString()
            }, { transaction: t });

            // Create wallet for client
            if (role === 'Client') {
                await db.Wallet.create({
                    userId: user.id,
                    balance: 0,
                    points: 0,
                    totalEarned: 0,
                    totalSpent: 0,
                    pointsHistory: []
                }, { transaction: t });
            }

            // Commit transaction
            await t.commit();

            // Fetch complete user
            const finalUser = await db.User.findByPk(user.id);

            // Generate token
            const token = this.generateToken(finalUser);

            return {
                user: this.formatUserResponse(finalUser),
                token
            };
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    /**
     * Login user
     */
    async login(email, password) {
        // Find user
        const user = await db.User.findOne({ where: { email } });
        if (!user) {
            throw new Error('Invalid email or password');
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            throw new Error('Invalid email or password');
        }

        // Check if user is active
        if (user.status !== 'Active') {
            throw new Error('Account is inactive or locked');
        }

        // Update last login and login history
        const loginHistory = user.loginHistory || [];
        loginHistory.unshift({
            date: new Date().toISOString()
        });
        
        // Keep only last 10 login records
        const trimmedHistory = loginHistory.slice(0, 10);
        
        await user.update({
            lastLogin: new Date(),
            loginHistory: trimmedHistory
        });

        // Generate token
        const token = this.generateToken(user);

        return {
            user: this.formatUserResponse(user),
            token
        };
    }

    /**
     * Generate JWT token
     */
    generateToken(user) {
        return jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );
    }

    /**
     * Verify JWT token
     */
    verifyToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        } catch (error) {
            throw new Error('Invalid or expired token');
        }
    }

    /**
     * Format user response (remove sensitive data)
     */
    formatUserResponse(user) {
        const userData = user.toJSON();
        delete userData.password;
        return userData;
    }

    /**
     * Change password
     */
    async changePassword(userId, oldPassword, newPassword) {
        const user = await db.User.findByPk(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Verify old password
        const isValid = await bcrypt.compare(oldPassword, user.password);
        if (!isValid) {
            throw new Error('Current password is incorrect');
        }

        // Check if new password is different from current password
        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            throw new Error('New password must be different');
        }

        // Hash and update new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await user.update({ password: hashedPassword });

        return { message: 'Password changed successfully' };
    }

    /**
     * Reset password (admin function or forgot password)
     */
    async resetPassword(email, newPassword) {
        const user = await db.User.findOne({ where: { email } });
        if (!user) {
            throw new Error('User not found');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await user.update({ password: hashedPassword });

        return { message: 'Password reset successfully' };
    }
}

module.exports = new AuthService();
