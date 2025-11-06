
// backend/routes/vouchers.js
const express = require('express');
const router = express.Router();
const db = require('../config/database'); // Sequelize models
const { v4: uuidv4 } = require('uuid');

// GET /api/vouchers/tiers - Get all tiers
router.get('/tiers', async (req, res) => {
    try {
        const tiers = await db.Tier.findAll({ order: [['level', 'ASC']] });
        res.json(tiers);
    } catch (error) {
        console.error('Error fetching tiers:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/vouchers/redeemed - Get all redeemed rewards
router.get('/redeemed', async (req, res) => {
    try {
        const redeemedRewards = await db.RedeemedReward.findAll();
        res.json(redeemedRewards);
    } catch (error) {
        console.error('Error fetching redeemed rewards:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/vouchers - Get all redeemable vouchers
router.get('/', async (req, res) => {
    try {
        const vouchers = await db.RedeemableVoucher.findAll();
        res.json(vouchers);
    } catch (error) {
        console.error('Error fetching redeemable vouchers:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/vouchers/:id - Get redeemable voucher by ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const voucher = await db.RedeemableVoucher.findByPk(id);
        if (voucher) {
            res.json(voucher);
        } else {
            res.status(404).json({ message: 'Redeemable voucher not found' });
        }
    } catch (error) {
        console.error('Error fetching redeemable voucher by ID:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/vouchers - Add a new redeemable voucher (Admin only)
router.post('/', async (req, res) => {
    const newVoucherData = req.body;
    if (!newVoucherData.description || newVoucherData.pointsRequired === undefined || newVoucherData.value === undefined) {
        return res.status(400).json({ message: 'Missing required redeemable voucher data' });
    }
    try {
        const createdVoucher = await db.RedeemableVoucher.create({
            id: `redeem-${uuidv4()}`,
            applicableServiceIds: [], // Default
            targetAudience: 'All', // Default
            ...newVoucherData,
        });
        res.status(201).json(createdVoucher);
    } catch (error) {
        console.error('Error creating redeemable voucher:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// PUT /api/vouchers/:id - Update a redeemable voucher (Admin only)
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const updatedVoucherData = req.body;
    try {
        const voucher = await db.RedeemableVoucher.findByPk(id);
        if (!voucher) {
            return res.status(404).json({ message: 'Redeemable voucher not found' });
        }
        await voucher.update(updatedVoucherData);
        res.json(voucher);
    } catch (error) {
        console.error('Error updating redeemable voucher:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// DELETE /api/vouchers/:id - Delete a redeemable voucher (Admin only)
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const voucher = await db.RedeemableVoucher.findByPk(id);
        if (!voucher) {
            return res.status(404).json({ message: 'Redeemable voucher not found' });
        }
        await voucher.destroy();
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting redeemable voucher:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});



// POST /api/vouchers/redeemed - Add a new redeemed reward
router.post('/redeemed', async (req, res) => {
    const newRedeemedRewardData = req.body;
    if (!newRedeemedRewardData.userId || !newRedeemedRewardData.rewardDescription || newRedeemedRewardData.pointsUsed === undefined) {
        return res.status(400).json({ message: 'Missing required redeemed reward data' });
    }
    try {
        const createdReward = await db.RedeemedReward.create({
            id: uuidv4(),
            dateRedeemed: new Date().toISOString(),
            ...newRedeemedRewardData,
        });
        res.status(201).json(createdReward);
    } catch (error) {
        console.error('Error creating redeemed reward:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});



// PUT /api/vouchers/tiers/:level - Update a tier (Admin only)
router.put('/tiers/:level', async (req, res) => {
    const { level } = req.params;
    const updatedTierData = req.body;
    try {
        const tier = await db.Tier.findByPk(level);
        if (!tier) {
            return res.status(404).json({ message: 'Tier not found' });
        }
        await tier.update(updatedTierData);
        res.json(tier);
    } catch (error) {
        console.error('Error updating tier:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;