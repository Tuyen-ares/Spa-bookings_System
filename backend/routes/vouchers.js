
// backend/routes/vouchers.js
const express = require('express');
const router = express.Router();
const db = require('../config/database'); // Sequelize models
const { v4: uuidv4 } = require('uuid');

// GET /api/vouchers/tiers - Get all tiers
// Note: Tier table removed - returning empty array
router.get('/tiers', async (req, res) => {
    try {
        res.json([]);
    } catch (error) {
        console.error('Error fetching tiers:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Note: RedeemableVoucher and RedeemedReward tables removed - merged into promotions table
// All routes return empty arrays or errors
router.get('/redeemed', async (req, res) => {
    res.json([]);
});

router.get('/', async (req, res) => {
    res.json([]);
});

router.get('/:id', async (req, res) => {
    res.status(404).json({ message: 'Voucher functionality has been removed' });
});

router.post('/', async (req, res) => {
    res.status(404).json({ message: 'Voucher functionality has been removed' });
});

router.put('/:id', async (req, res) => {
    res.status(404).json({ message: 'Voucher functionality has been removed' });
});

router.delete('/:id', async (req, res) => {
    res.status(404).json({ message: 'Voucher functionality has been removed' });
});

router.post('/redeemed', async (req, res) => {
    res.status(404).json({ message: 'Reward functionality has been removed' });
});



// PUT /api/vouchers/tiers/:level - Update a tier (Admin only)
// Note: Tier table removed - returning error
router.put('/tiers/:level', async (req, res) => {
    res.status(404).json({ message: 'Tier functionality has been removed' });
});

module.exports = router;