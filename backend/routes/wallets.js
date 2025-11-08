
// backend/routes/wallets.js
const express = require('express');
const router = express.Router();
const db = require('../config/database'); // Sequelize models
const { v4: uuidv4 } = require('uuid');
const { LUCKY_WHEEL_PRIZES } = require('../constants.js'); // Import constants

// GET /api/wallets/lucky-wheel-prizes - Get lucky wheel prizes (from constants)
router.get('/lucky-wheel-prizes', (req, res) => {
    res.json(LUCKY_WHEEL_PRIZES);
});

// GET /api/wallets/:userId - Get user's wallet
router.get('/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        let wallet = await db.Wallet.findByPk(userId);
        if (!wallet) {
            // Create a default wallet if not found for the user
            const user = await db.User.findByPk(userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found, cannot create wallet.' });
            }
            wallet = await db.Wallet.create({ userId: user.id, balance: 0, points: 0, totalEarned: 0, totalSpent: 0 });
            res.status(201).json(wallet);
        } else {
            res.json(wallet);
        }
    } catch (error) {
        console.error('Error fetching or creating wallet:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// PUT /api/wallets/:userId - Update user's wallet (points, balance, spinsLeft)
router.put('/:userId', async (req, res) => {
    const { userId } = req.params;
    const updatedWalletData = req.body; // e.g., { points: 1500, spinsLeft: 2 }

    try {
        const wallet = await db.Wallet.findByPk(userId);
        if (!wallet) {
            return res.status(404).json({ message: 'Wallet not found for this user.' });
        }

        await wallet.update(updatedWalletData);

        // Note: Tier upgrade functionality disabled - Tier table removed
        // Tier upgrade can be implemented manually if needed

        res.json(wallet);
    } catch (error) {
        console.error('Error updating wallet:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/wallets/:userId/points-history - Get user's points history from wallet
router.get('/:userId/points-history', async (req, res) => {
    const { userId } = req.params;
    try {
        const wallet = await db.Wallet.findByPk(userId);
        if (!wallet) {
            return res.status(404).json({ message: 'Wallet not found' });
        }
        const pointsHistory = wallet.pointsHistory || [];
        res.json(pointsHistory);
    } catch (error) {
        console.error('Error fetching points history:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/wallets/:userId/points-history - Add an entry to points history in wallet
router.post('/:userId/points-history', async (req, res) => {
    const { userId } = req.params;
    const { date, pointsChange, type, source, description } = req.body;

    if (!description || pointsChange === undefined) {
        return res.status(400).json({ message: 'Missing description or pointsChange for history entry' });
    }

    try {
        const wallet = await db.Wallet.findByPk(userId);
        if (!wallet) {
            return res.status(404).json({ message: 'Wallet not found' });
        }

        const pointsHistory = wallet.pointsHistory || [];
        const newEntry = {
            date: date || new Date().toISOString().split('T')[0],
            pointsChange,
            type: type || (pointsChange > 0 ? 'earned' : 'spent'),
            source: source || 'manual',
            description
        };
        pointsHistory.push(newEntry);

        await wallet.update({ pointsHistory });
        res.status(201).json(newEntry);
    } catch (error) {
        console.error('Error creating points history entry:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});



module.exports = router;