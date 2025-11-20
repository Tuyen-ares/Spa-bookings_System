
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
        let wallet = await db.Wallet.findOne({ where: { userId } });
        if (!wallet) {
            // Create a default wallet if not found for the user
            const user = await db.User.findByPk(userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found, cannot create wallet.' });
            }
            wallet = await db.Wallet.create({ 
                id: uuidv4(),
                userId: user.id, 
                points: 0, 
                totalSpent: 0.00 
            });
            res.status(201).json(wallet);
        } else {
            res.json(wallet);
        }
    } catch (error) {
        console.error('Error fetching or creating wallet:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// PUT /api/wallets/:userId - Update user's wallet (points, totalSpent)
router.put('/:userId', async (req, res) => {
    const { userId } = req.params;
    const updatedWalletData = req.body; // e.g., { points: 1500, totalSpent: 500000 }

    try {
        const wallet = await db.Wallet.findOne({ where: { userId } });
        if (!wallet) {
            return res.status(404).json({ message: 'Wallet not found for this user.' });
        }

        await wallet.update(updatedWalletData);

        res.json(wallet);
    } catch (error) {
        console.error('Error updating wallet:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/wallets/:userId/points-history - Get user's points history from wallet
// Note: pointsHistory field has been removed from wallets table
router.get('/:userId/points-history', async (req, res) => {
    const { userId } = req.params;
    try {
        const wallet = await db.Wallet.findOne({ where: { userId } });
        if (!wallet) {
            return res.status(404).json({ message: 'Wallet not found' });
        }
        // Return empty array as pointsHistory is no longer stored in wallets table
        res.json([]);
    } catch (error) {
        console.error('Error fetching points history:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/wallets/:userId/points-history - Add an entry to points history in wallet
// Note: pointsHistory field has been removed from wallets table
router.post('/:userId/points-history', async (req, res) => {
    const { userId } = req.params;
    try {
        const wallet = await db.Wallet.findOne({ where: { userId } });
        if (!wallet) {
            return res.status(404).json({ message: 'Wallet not found' });
        }
        // Points history is no longer stored in wallets table
        res.json({ message: 'Points history entry added (not stored)', pointsHistory: [] });
    } catch (error) {
        console.error('Error creating points history entry:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});



module.exports = router;