// backend/services/userService.js
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

class UserService {
    /**
     * Get all users
     */
    async getAllUsers(filters = {}) {
        const where = {};
        
        if (filters.role) {
            where.role = filters.role;
        }
        if (filters.status) {
            where.status = filters.status;
        }

        const users = await db.User.findAll({
            where,
            attributes: { exclude: ['password'] },
            order: [['joinDate', 'DESC']]
        });

        return users;
    }

    /**
     * Get user by ID
     */
    async getUserById(id) {
        const user = await db.User.findByPk(id, {
            attributes: { exclude: ['password'] },
            include: [{
                model: db.Wallet,
                required: false
            }]
        });

        if (!user) {
            throw new Error('User not found');
        }

        return user;
    }

    /**
     * Create new user
     */
    async createUser(userData) {
        const { email, password, ...rest } = userData;

        // Check if email exists
        const existingUser = await db.User.findOne({ where: { email } });
        if (existingUser) {
            throw new Error('Email already exists');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await db.User.create({
            id: uuidv4(),
            email,
            password: hashedPassword,
            joinDate: new Date(),
            status: 'Active',
            ...rest
        });

        // Create wallet for clients
        if (user.role === 'Client') {
            await db.Wallet.create({
                userId: user.id,
                balance: 0,
                points: 0,
                totalEarned: 0,
                totalSpent: 0,
                pointsHistory: []
            });
        }

        return this.formatUserResponse(user);
    }

    /**
     * Update user
     */
    async updateUser(id, userData) {
        const user = await db.User.findByPk(id);
        if (!user) {
            throw new Error('User not found');
        }

        // If updating password, hash it
        if (userData.password) {
            userData.password = await bcrypt.hash(userData.password, 10);
        }

        await user.update(userData);
        return this.formatUserResponse(user);
    }

    /**
     * Delete user
     */
    async deleteUser(id) {
        const user = await db.User.findByPk(id);
        if (!user) {
            throw new Error('User not found');
        }

        await user.destroy();
        return { message: 'User deleted successfully' };
    }

    /**
     * Get user profile with appointments and wallet
     */
    async getUserProfile(id) {
        const user = await db.User.findByPk(id, {
            attributes: { exclude: ['password'] },
            include: [
                {
                    model: db.Wallet,
                    required: false
                },
                {
                    model: db.Appointment,
                    as: 'ClientAppointments',
                    limit: 5,
                    order: [['date', 'DESC']],
                    required: false
                }
            ]
        });

        if (!user) {
            throw new Error('User not found');
        }

        return user;
    }

    /**
     * Update user status
     */
    async updateUserStatus(id, status) {
        const user = await db.User.findByPk(id);
        if (!user) {
            throw new Error('User not found');
        }

        await user.update({ status });
        return this.formatUserResponse(user);
    }

    /**
     * Format user response (remove password)
     */
    formatUserResponse(user) {
        const userData = user.toJSON();
        delete userData.password;
        return userData;
    }
}

module.exports = new UserService();
