
// backend/routes/users.js
const express = require('express');
const router = express.Router();
const db = require('../config/database'); // Sequelize models
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs'); // Import bcrypt for hashing

// Note: Customer and Staff tables removed - all user info in users table

const formatUserOutput = (user) => {
    if (!user) return null;
    const userJson = user.toJSON();
    delete userJson.password;
    return userJson;
};

// GET /api/users - Get all users
router.get('/', async (req, res) => {
    try {
        const users = await db.User.findAll();
        res.json(users.map(formatUserOutput));
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/users/:id - Get user by ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const user = await db.User.findByPk(id);
        if (user) {
            res.json(formatUserOutput(user));
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('Error fetching user by ID:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// PUT /api/users/:id - Update user
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const userData = req.body;
    const t = await db.sequelize.transaction();

    try {
        const user = await db.User.findByPk(id, { transaction: t });
        if (!user) {
            await t.rollback();
            return res.status(404).json({ message: 'User not found' });
        }

        // Handle password update
        if (userData.password && userData.password.length > 0) {
            userData.password = await bcrypt.hash(userData.password, 10);
        } else {
            delete userData.password;
        }

        // Update main user record
        await user.update(userData, { transaction: t });

        await t.commit();
        
        // Refetch the updated user
        const updatedUser = await db.User.findByPk(id);

        res.json(formatUserOutput(updatedUser));

    } catch (error) {
        await t.rollback();
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/users - Add a new user (Admin only)
router.post('/', async (req, res) => {
    const userData = req.body;
    if (!userData.email || !userData.name || !userData.password) {
        return res.status(400).json({ message: 'Missing required user data' });
    }
    const t = await db.sequelize.transaction();

    try {
        if (await db.User.findOne({ where: { email: userData.email } })) {
            await t.rollback();
            return res.status(409).json({ message: 'User with this email already exists' });
        }
        
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const userId = `user-${uuidv4()}`;

        const createdUser = await db.User.create({
            id: userId,
            ...userData,
            password: hashedPassword,
            profilePictureUrl: userData.profilePictureUrl || `https://picsum.photos/seed/${userId}/200`,
            joinDate: new Date().toISOString().split('T')[0],
            lastLogin: new Date().toISOString(),
        }, { transaction: t });
        
        // Initialize wallet for the new user
        await db.Wallet.create({ 
            userId: createdUser.id, 
            balance: 0, 
            points: 0, 
            totalEarned: 0, 
            totalSpent: 0
        }, { transaction: t });

        await t.commit();

        const finalUser = await db.User.findByPk(createdUser.id);

        res.status(201).json(formatUserOutput(finalUser));

    } catch (error) {
        await t.rollback();
        console.error('Error creating user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


// DELETE /api/users/:id - Delete a user (Admin only)
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const user = await db.User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        await user.destroy(); // This will also cascade delete associated Wallet, etc.
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// PUT /api/users/:id/password-reset (Admin direct reset)
router.put('/:id/password-reset', async (req, res) => {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    try {
        const user = await db.User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        user.password = await bcrypt.hash(newPassword, 10); // Hash the new password
        await user.save();
        res.status(200).json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// PUT /api/users/:id/toggle-lock (Admin only)
router.put('/:id/toggle-lock', async (req, res) => {
    const { id } = req.params;
    try {
        const user = await db.User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const newStatus = user.status === 'Locked' ? 'Active' : 'Locked';
        await user.update({ status: newStatus });
        res.status(200).json({ message: 'User status toggled successfully', newStatus: user.status });
    } catch (error) {
        console.error('Error toggling user lock status:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
