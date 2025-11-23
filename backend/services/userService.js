// backend/services/userService.js
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');

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
     * Upload avatar
     */
    async uploadAvatar(id, imageData) {
        const user = await db.User.findByPk(id);
        if (!user) {
            throw new Error('User not found');
        }

        const fs = require('fs');
        const path = require('path');
        const { v4: uuidv4 } = require('uuid');

        try {
            // Parse base64 image data
            // Format: data:image/jpeg;base64,/9j/4AAQSkZJRg...
            const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');
            
            // Determine file extension from image data
            let extension = 'jpg';
            if (imageData.startsWith('data:image/png')) {
                extension = 'png';
            } else if (imageData.startsWith('data:image/jpeg') || imageData.startsWith('data:image/jpg')) {
                extension = 'jpg';
            } else if (imageData.startsWith('data:image/gif')) {
                extension = 'gif';
            } else if (imageData.startsWith('data:image/webp')) {
                extension = 'webp';
            }

            // Create uploads directory if it doesn't exist
            // Check both possible locations: backend/public and root public
            let uploadsDir = path.join(__dirname, '../public/uploads/avatars');
            let publicRoot = path.join(__dirname, '../public');
            
            // If backend/public doesn't exist, use root public
            if (!fs.existsSync(path.join(__dirname, '../public'))) {
                uploadsDir = path.join(__dirname, '../../public/uploads/avatars');
                publicRoot = path.join(__dirname, '../../public');
            }
            
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }

            // Generate unique filename
            const filename = `avatar-${id}-${uuidv4()}.${extension}`;
            const filepath = path.join(uploadsDir, filename);

            // Save file
            fs.writeFileSync(filepath, buffer);

            // Generate URL (relative to public directory)
            const avatarUrl = `/uploads/avatars/${filename}`;

            // Update user's profile picture URL
            await user.update({ profilePictureUrl: avatarUrl });

            // Delete old avatar file if it exists and is in uploads/avatars directory
            if (user.profilePictureUrl && user.profilePictureUrl.startsWith('/uploads/avatars/')) {
                const oldFilePath = path.join(publicRoot, user.profilePictureUrl);
                if (fs.existsSync(oldFilePath)) {
                    try {
                        fs.unlinkSync(oldFilePath);
                    } catch (err) {
                        console.warn('Failed to delete old avatar:', err);
                    }
                }
            }

            return avatarUrl;
        } catch (error) {
            console.error('Error saving avatar file:', error);
            throw new Error('Không thể lưu ảnh đại diện. Vui lòng thử lại.');
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
