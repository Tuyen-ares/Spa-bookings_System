// backend/routes/promotions.js
const express = require('express');
const router = express.Router();
const db = require('../config/database'); // Sequelize models
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');

// GET /api/promotions - Get all promotions
// Optional query params: userId, serviceId (for filtering applicable promotions)
router.get('/', async (req, res) => {
    try {
        const { userId, serviceId } = req.query;
        
        // If no userId provided, only return public promotions (for client pages)
        const whereClause: any = { isActive: true };
        if (!userId) {
            whereClause.isPublic = true; // Only show public promotions on client pages
        }
        // If userId provided (for booking page), return both public and private (private can be applied if code is known)
        
        let promotions = await db.Promotion.findAll({
            where: whereClause
        });
        
        // If userId and serviceId provided, filter by eligibility
        if (userId && serviceId) {
            const user = await db.User.findByPk(userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            
            // Check user's completed/paid appointments for this service
            // User has used service if there's any appointment with status completed/upcoming and paymentStatus Paid
            const hasUsedService = await db.Appointment.findOne({
                where: {
                    userId: userId,
                    serviceId: serviceId,
                    status: { [Op.in]: ['completed', 'upcoming', 'scheduled'] },
                    paymentStatus: 'Paid'
                }
            });
            
            // Check promotion usage
            const usedPromotions = await db.PromotionUsage.findAll({
                where: { userId: userId }
            });
            const usedPromotionIds = new Set(usedPromotions.map(u => u.promotionId));
            
            // Check if today is user's birthday
            const today = new Date();
            const isBirthday = user.birthday && (() => {
                const birthday = new Date(user.birthday);
                return birthday.getMonth() === today.getMonth() && 
                       birthday.getDate() === today.getDate();
            })();
            
            // Filter promotions based on eligibility
            promotions = promotions.filter(promo => {
                // For client pages, only show public promotions (unless they know the code)
                // This filter is already applied in the query above, but we keep it here for safety
                
                // Check if already used
                if (usedPromotionIds.has(promo.id)) {
                    // For Birthday promotions, can only use once per year
                    if (promo.targetAudience === 'Birthday') {
                        const birthdayUsage = usedPromotions.find(u => 
                            u.promotionId === promo.id && 
                            new Date(u.usedAt).getFullYear() === today.getFullYear()
                        );
                        if (birthdayUsage) return false;
                    } else {
                        return false; // Already used
                    }
                }
                
                // Check target audience
                if (promo.targetAudience === 'New Clients') {
                    // Only show if user hasn't used this service
                    if (hasUsedService) return false;
                    // Check if promotion is for this specific service
                    if (promo.applicableServiceIds && 
                        Array.isArray(promo.applicableServiceIds) && 
                        promo.applicableServiceIds.length > 0 &&
                        !promo.applicableServiceIds.includes(serviceId)) {
                        return false;
                    }
                } else if (promo.targetAudience === 'Birthday') {
                    // Only show if today is user's birthday
                    if (!isBirthday) return false;
                } else if (promo.targetAudience === 'All') {
                    // Show all active promotions
                }
                
                // Check expiry
                const expiryDate = new Date(promo.expiryDate);
                expiryDate.setHours(0, 0, 0, 0);
                if (today > expiryDate) return false;
                
                // Check stock
                if (promo.stock !== null && promo.stock <= 0) return false;
                
                return true;
            });
        }
        
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
// Body: { userId, appointmentId?, serviceId? }
router.post('/apply/:code', async (req, res) => {
    const { code } = req.params;
    const { userId, appointmentId, serviceId } = req.body;
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

        // Check if user has already used this promotion
        if (userId) {
            const existingUsage = await db.PromotionUsage.findOne({
                where: { userId, promotionId: promotion.id }
            });
            
            if (existingUsage) {
                // For Birthday promotions, check if used this year
                if (promotion.targetAudience === 'Birthday') {
                    const usedYear = new Date(existingUsage.usedAt).getFullYear();
                    if (usedYear === today.getFullYear()) {
                        return res.status(400).json({ message: 'Bạn đã sử dụng mã khuyến mãi sinh nhật trong năm này' });
                    }
                } else {
                    return res.status(400).json({ message: 'Bạn đã sử dụng mã khuyến mãi này rồi' });
                }
            }
        }

        // Decrement stock (trừ 1)
        if (promotion.stock !== null) {
            await promotion.decrement('stock', { by: 1 });
        }
        
        // Record promotion usage if userId provided
        if (userId) {
            await db.PromotionUsage.create({
                id: `promo-usage-${uuidv4()}`,
                userId: userId,
                promotionId: promotion.id,
                appointmentId: appointmentId || null,
                serviceId: serviceId || null,
            });
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
