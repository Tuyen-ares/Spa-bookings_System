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
            where: { email }
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
    const { name, email, password, phone, gender, birthday } = req.body;
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

        // Validate phone number if provided
        if (phone && !/^[0-9]{10,11}$/.test(phone.replace(/\s/g, ''))) {
            await t.rollback();
            return res.status(400).json({ message: 'Số điện thoại không hợp lệ. Vui lòng nhập 10-11 chữ số.' });
        }

        // Validate birthday if provided
        if (birthday) {
            const birthDate = new Date(birthday);
            const today = new Date();
            if (birthDate > today) {
                await t.rollback();
                return res.status(400).json({ message: 'Ngày sinh không thể là ngày trong tương lai.' });
            }
            const age = today.getFullYear() - birthDate.getFullYear();
            if (age < 13 || age > 120) {
                await t.rollback();
                return res.status(400).json({ message: 'Ngày sinh không hợp lệ. Bạn phải từ 13 tuổi trở lên.' });
            }
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = `user-client-${uuidv4()}`;

        const newUser = await db.User.create({
            id: userId,
            name,
            email,
            password: hashedPassword,
            phone: phone ? phone.trim() : null,
            profilePictureUrl: `https://picsum.photos/seed/${userId}/200`,
            joinDate: new Date().toISOString().split('T')[0],
            birthday: birthday || null,
            gender: gender || null,
            role: 'Client',
            status: 'Active',
            lastLogin: new Date().toISOString(),
        }, { transaction: t });

        // Initialize wallet for the new user
        await db.Wallet.create({
            userId: newUser.id,
            balance: 0,
            points: 0,
            totalEarned: 0,
            totalSpent: 0
        }, { transaction: t });

        // Commit the transaction
        await t.commit();

        // Fetch the complete user object to return
        const finalUser = await db.User.findByPk(newUser.id);

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

// POST /api/auth/change-password - Change password for logged-in user
router.post('/change-password', async (req, res) => {
    const { userId, currentPassword, newPassword } = req.body;

    try {
        if (!userId || !currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
        }

        // Find user
        const user = await db.User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'Người dùng không tồn tại' });
        }

        // Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Mật khẩu hiện tại không đúng' });
        }

        // Check if new password is different from current password
        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            return res.status(400).json({ message: 'Mật khẩu mới phải khác mật khẩu hiện tại' });
        }

        // Hash new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await user.update({ password: hashedNewPassword });

        console.log(`Password changed for user: ${user.email}`);
        res.json({ message: 'Đổi mật khẩu thành công' });

    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ message: 'Lỗi server. Vui lòng thử lại sau' });
    }
});

module.exports = router;