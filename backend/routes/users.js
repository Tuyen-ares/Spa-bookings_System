
// backend/routes/users.js
const express = require('express');
const router = express.Router();
const db = require('../config/database'); // Sequelize models
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs'); // Import bcrypt for hashing

const includeProfiles = [
    { model: db.Customer, as: 'customerProfile', include: [{ model: db.Tier, as: 'Tier' }] },
    // StaffProfile uses an aliased association to StaffTier, so include must specify the alias
    { model: db.Staff, as: 'staffProfile', include: [{ model: db.StaffTier, as: 'StaffTier' }] }
];

const formatUserOutput = (user) => {
    if (!user) return null;
    const userJson = user.toJSON();
    delete userJson.password;
    return userJson;
};

// GET /api/users - Get all users
router.get('/', async (req, res) => {
    try {
        const users = await db.User.findAll({ include: includeProfiles });
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
        const user = await db.User.findByPk(id, { include: includeProfiles });
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

// PUT /api/users/:id - Update user and their profile
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { customerProfile, staffProfile, ...userData } = req.body;
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

        // Update associated profiles if they exist
        if (customerProfile) {
            const customer = await user.getCustomerProfile({ transaction: t });
            if (customer) await customer.update(customerProfile, { transaction: t });
        }
        if (staffProfile) {
            const staff = await user.getStaffProfile({ transaction: t });
            if (staff) await staff.update(staffProfile, { transaction: t });
        }

        await t.commit();
        
        // Refetch the updated user with all associations
        const updatedUser = await db.User.findByPk(id, { include: includeProfiles });

        res.json(formatUserOutput(updatedUser));

    } catch (error) {
        await t.rollback();
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/users - Add a new user (Admin only)
router.post('/', async (req, res) => {
    const { customerProfile, staffProfile, ...userData } = req.body;
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

        if (createdUser.role === 'Client' && customerProfile) {
            await db.Customer.create({ userId: createdUser.id, ...customerProfile }, { transaction: t });
        }
        if ((createdUser.role === 'Staff' || createdUser.role === 'Admin') && staffProfile) {
            await db.Staff.create({ userId: createdUser.id, ...staffProfile }, { transaction: t });
        }
        
        // Initialize wallet for the new user
        await db.Wallet.create({ userId: createdUser.id, balance: 0, points: 0, spinsLeft: 3 }, { transaction: t });

        await t.commit();

        const finalUser = await db.User.findByPk(createdUser.id, { include: includeProfiles });

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
        await user.destroy(); // This will also cascade delete associated Wallet, PointsHistory, etc.
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
