// backend/routes/promotions.js
const express = require('express');
const router = express.Router();
const db = require('../config/database'); // Sequelize models
const { v4: uuidv4 } = require('uuid');

// GET /api/promotions - Get all promotions
router.get('/', async (req, res) => {
    try {
        const promotions = await db.Promotion.findAll();
        res.json(promotions);
    } catch (error) {
        console.error('Error fetching promotions:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/promotions/:id - Get promotion by ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const promotion = await db.Promotion.findByPk(id);
        if (promotion) {
            res.json(promotion);
        } else {
            res.status(404).json({ message: 'Promotion not found' });
        }
    } catch (error) {
        console.error('Error fetching promotion by ID:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/promotions - Add a new promotion (Admin only)
router.post('/', async (req, res) => {
    const newPromotionData = req.body;
    if (!newPromotionData.title || !newPromotionData.code || !newPromotionData.expiryDate || newPromotionData.discountValue === undefined) {
        return res.status(400).json({ message: 'Missing required promotion data' });
    }
    try {
        const createdPromotion = await db.Promotion.create({
            id: `promo-${uuidv4()}`,
            imageUrl: `https://picsum.photos/seed/${uuidv4()}/500/300`, // Default image
            usageCount: 0,
            ...newPromotionData,
        });
        res.status(201).json(createdPromotion);
    } catch (error) {
        console.error('Error creating promotion:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// PUT /api/promotions/:id - Update a promotion (Admin only)
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const updatedPromotionData = req.body;
    try {
        const promotion = await db.Promotion.findByPk(id);
        if (!promotion) {
            return res.status(404).json({ message: 'Promotion not found' });
        }
        await promotion.update(updatedPromotionData);
        res.json(promotion);
    } catch (error) {
        console.error('Error updating promotion:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// DELETE /api/promotions/:id - Delete a promotion (Admin only)
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const promotion = await db.Promotion.findByPk(id);
        if (!promotion) {
            return res.status(404).json({ message: 'Promotion not found' });
        }
        await promotion.destroy();
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting promotion:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/promotions/apply/:code - Apply promotion code (check stock and decrement)
router.post('/apply/:code', async (req, res) => {
    const { code } = req.params;
    try {
        const promotion = await db.Promotion.findOne({ where: { code } });
        if (!promotion) {
            return res.status(404).json({ message: 'Mã khuyến mãi không hợp lệ' });
        }

        // Check if promotion is active
        if (!promotion.isActive) {
            return res.status(400).json({ message: 'Mã khuyến mãi này không còn hoạt động' });
        }

        // Check expiry date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiryDate = new Date(promotion.expiryDate);
        expiryDate.setHours(0, 0, 0, 0);
        if (today > expiryDate) {
            return res.status(400).json({ message: 'Mã khuyến mãi đã hết hạn' });
        }

        // Check stock (số lượng còn lại)
        if (promotion.stock !== null && promotion.stock <= 0) {
            return res.status(400).json({ message: 'Mã khuyến mãi đã hết lượt sử dụng' });
        }

        // Decrement stock (trừ 1)
        if (promotion.stock !== null) {
            await promotion.decrement('stock', { by: 1 });
        }
        
        // Fetch updated promotion
        const updatedPromotion = await db.Promotion.findByPk(promotion.id);
        
        res.json({
            success: true,
            message: 'Áp dụng mã thành công',
            promotion: updatedPromotion
        });
    } catch (error) {
        console.error('Error applying promotion:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
