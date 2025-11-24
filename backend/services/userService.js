// backend/services/userService.js
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
// Import tier utilities
let calculateTierInfo;
try {
    const tierUtils = require('../utils/tierUtils');
    calculateTierInfo = tierUtils.calculateTierInfo;
    if (typeof calculateTierInfo !== 'function') {
        console.error('❌ calculateTierInfo is not a function after import. Available keys:', Object.keys(tierUtils));
    } else {
        console.log('✅ calculateTierInfo imported successfully');
    }
} catch (error) {
    console.error('❌ Error importing tierUtils:', error);
    throw error;
}

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
                id: require('uuid').v4(),
                userId: user.id,
                points: 0,
                totalSpent: 0.00
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

        // Check if email is being updated and if it's unique
        if (userData.email && userData.email !== user.email) {
            const existingUser = await db.User.findOne({ 
                where: { 
                    email: userData.email,
                    id: { [Op.ne]: id } // Exclude current user
                } 
            });
            if (existingUser) {
                throw new Error('Email đã được sử dụng bởi tài khoản khác. Vui lòng chọn email khác.');
            }
        }

        // If updating password, hash it
        if (userData.password) {
            userData.password = await bcrypt.hash(userData.password, 10);
        }

        await user.update(userData);
        
        // Reload user to get updated data
        await user.reload();
        
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
     * Get user tier information based on totalSpent
     */
    async getUserTier(id) {
        try {
            // Verify calculateTierInfo is available
            if (typeof calculateTierInfo !== 'function') {
                console.error('❌ calculateTierInfo is not a function. Type:', typeof calculateTierInfo);
                throw new Error('calculateTierInfo function is not available');
            }

            const user = await db.User.findByPk(id, {
                include: [{
                    model: db.Wallet,
                    required: false
                }]
            });

        if (!user) {
            throw new Error('User not found');
        }

            const wallet = user.Wallet;
            const totalSpent = wallet ? parseFloat(wallet.totalSpent?.toString() || '0') : 0;
            
            console.log('🔍 getUserTier - User ID:', id, 'Total Spent:', totalSpent);
            
            const tierInfo = calculateTierInfo(totalSpent);
            
            console.log('✅ Tier info calculated:', {
                currentTier: tierInfo.currentTier?.name,
                discountPercent: tierInfo.currentTier?.discountPercent
            });

            return {
                currentTier: tierInfo.currentTier,
                nextTier: tierInfo.nextTier,
                discountPercent: tierInfo.currentTier.discountPercent
            };
        } catch (error) {
            console.error('❌ Error in getUserTier:', error);
            throw error;
        }
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
