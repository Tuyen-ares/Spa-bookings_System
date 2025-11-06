// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const db = require('../config/database'); // Sequelize models
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await db.User.findOne({ 
            where: { email },
            include: [
                { model: db.Customer, as: 'customerProfile', include: [{ model: db.Tier, as: 'Tier' }] },
                { model: db.Staff, as: 'staffProfile', include: [{model: db.StaffTier, as: 'StaffTier'}] }
            ]
        });

        if (user && (await bcrypt.compare(password, user.password))) {
            // Update last login
            await user.update({ lastLogin: new Date().toISOString() });
            
            // Create token
            const token = jwt.sign(
                { userId: user.id, email: user.email, role: user.role },
                process.env.JWT_SECRET || 'your_default_secret',
                { expiresIn: '2h' }
            );

            // Exclude password from the response
            const userWithoutPassword = user.toJSON();
            delete userWithoutPassword.password;

            console.log(`User logged in: ${user.email}`);
            // Return user and token
            res.json({ user: userWithoutPassword, token });
        } else {
            res.status(401).json({ message: 'Email hoặc mật khẩu không hợp lệ' });
        }
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    const t = await db.sequelize.transaction(); // Start a transaction

    try {
        const existingUser = await db.User.findOne({ where: { email } });
        if (existingUser) {
            await t.rollback();
            return res.status(409).json({ message: 'Email đã tồn tại' });
        }

        if (!name || !email || !password || password.length < 6) {
            await t.rollback();
            return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin và mật khẩu phải có ít nhất 6 ký tự.' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = `user-client-${uuidv4()}`;

        const newUser = await db.User.create({
            id: userId,
            name,
            email,
            password: hashedPassword,
            phone: '',
            profilePictureUrl: `https://picsum.photos/seed/${userId}/200`,
            joinDate: new Date().toISOString().split('T')[0],
            birthday: '1990-01-01',
            role: 'Client',
            status: 'Active',
            lastLogin: new Date().toISOString(),
        }, { transaction: t });

        // Initialize customer profile for the new user
        await db.Customer.create({
            userId: newUser.id,
            tierLevel: 1,
            selfCareIndex: 50,
            totalSpending: 0,
            lastTierUpgradeDate: new Date().toISOString(),
        }, { transaction: t });

        // Initialize wallet for the new user
        await db.Wallet.create({
            userId: newUser.id,
            balance: 0,
            points: 0,
            spinsLeft: 3
        }, { transaction: t });

        // Commit the transaction
        await t.commit();

        // Fetch the complete user object with profile to return
        const finalUser = await db.User.findByPk(newUser.id, {
            include: [
                { model: db.Customer, as: 'customerProfile', include: [{ model: db.Tier, as: 'Tier' }] }
            ]
        });

        // Create token for newly registered user
        const token = jwt.sign(
            { userId: finalUser.id, email: finalUser.email, role: finalUser.role },
            process.env.JWT_SECRET || 'your_default_secret',
            { expiresIn: '2h' }
        );

        const userWithoutPassword = finalUser.toJSON();
        delete userWithoutPassword.password;

        console.log(`User registered: ${newUser.email}`);
        res.status(201).json({ user: userWithoutPassword, token });

    } catch (error) {
        await t.rollback();
        console.error('Error during registration:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;