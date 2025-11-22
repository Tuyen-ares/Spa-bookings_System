// backend/routes/promotions.js
const express = require('express');
const router = express.Router();
const db = require('../config/database'); // Sequelize models
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');

// GET /api/promotions - Get all promotions
// Optional query params: userId, serviceId (for filtering applicable promotions), redeemableOnly, all (for admin to get all promotions)
router.get('/', async (req, res) => {
    try {
        const { userId, serviceId, redeemableOnly, all } = req.query;
        
        // If redeemableOnly is true, return only private vouchers that can be redeemed with points
        if (redeemableOnly === 'true' || redeemableOnly === true) {
            // Fetch all active promotions first, then filter in JavaScript
            // This ensures we get all data and can properly check isPublic and pointsRequired
            let allPromotions = await db.Promotion.findAll({
                where: { isActive: true }
            });
            
            console.log(`Total active promotions: ${allPromotions.length}`);
            
            // Filter for private vouchers (isPublic = false/0) with pointsRequired > 0
            let promotions = allPromotions.filter(promo => {
                // Check if private: isPublic should be false, 0, or '0'
                const isPrivate = promo.isPublic === false || 
                                 promo.isPublic === 0 || 
                                 promo.isPublic === '0' ||
                                 String(promo.isPublic).toLowerCase() === 'false';
                
                // Check if has pointsRequired > 0
                const pointsRequired = Number(promo.pointsRequired);
                const hasPointsRequired = !isNaN(pointsRequired) && pointsRequired > 0;
                
                if (!isPrivate || !hasPointsRequired) {
                    return false;
                }
                
                return true;
            });
            
            console.log(`Found ${promotions.length} private vouchers with pointsRequired > 0`);
            promotions.forEach(p => {
                console.log(`- ${p.id}: ${p.title}, isPublic: ${p.isPublic}, pointsRequired: ${p.pointsRequired}`);
            });
            
            // Filter out expired vouchers and vouchers with no stock
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            promotions = promotions.filter(promo => {
                const expiryDate = new Date(promo.expiryDate);
                expiryDate.setHours(0, 0, 0, 0);
                if (today > expiryDate) {
                    console.log(`Voucher ${promo.id} expired`);
                    return false;
                }
                const stock = Number(promo.stock);
                if (!isNaN(stock) && stock <= 0) {
                    console.log(`Voucher ${promo.id} out of stock`);
                    return false;
                }
                return true;
            });
            
            console.log(`Returning ${promotions.length} redeemable vouchers after filtering`);
            // Convert to plain objects for JSON response and normalize isPublic
            return res.json(promotions.map(p => {
                const promo = p.toJSON ? p.toJSON() : p;
                // Normalize isPublic to boolean
                if (promo.isPublic !== undefined) {
                    promo.isPublic = promo.isPublic === true || promo.isPublic === 1 || promo.isPublic === '1';
                }
                return promo;
            }));
        }
        
        // If no userId provided, only return public promotions (for client pages)
        // But if 'all=true' is provided, return all promotions (for admin pages)
        const whereClause = { isActive: true };
        if (!userId && (all !== 'true' && all !== true)) {
            whereClause.isPublic = true; // Only show public promotions on client pages
        }
        // If userId provided (for booking page), return both public and private (private can be applied if code is known)
        // If all=true provided (for admin page), return all promotions
        
        console.log('Fetching promotions with whereClause:', JSON.stringify(whereClause, null, 2));
        let promotions = await db.Promotion.findAll({
            where: whereClause
        });
        console.log(`Found ${promotions.length} promotions from database`);
        
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
        
        // Normalize isPublic to boolean for all promotions
        const normalizedPromotions = promotions.map(p => {
            const promo = p.toJSON ? p.toJSON() : p;
            if (promo.isPublic !== undefined) {
                // Convert to boolean: true if explicitly true/1/'1'/'true', false otherwise
                if (promo.isPublic === true || 
                    promo.isPublic === 1 || 
                    promo.isPublic === '1' ||
                    String(promo.isPublic).toLowerCase() === 'true') {
                    promo.isPublic = true;
                } else {
                    promo.isPublic = false;
                }
            }
            // Ensure pointsRequired is a number or null
            if (promo.pointsRequired !== undefined && promo.pointsRequired !== null) {
                const numPoints = Number(promo.pointsRequired);
                promo.pointsRequired = !isNaN(numPoints) ? numPoints : null;
            } else {
                promo.pointsRequired = null;
            }
            return promo;
        });
        
        console.log(`Returning ${normalizedPromotions.length} normalized promotions`);
        const privateWithPoints = normalizedPromotions.filter(p => !p.isPublic && p.pointsRequired && p.pointsRequired > 0);
        console.log(`Private vouchers with points in response: ${privateWithPoints.length}`);
        if (privateWithPoints.length > 0) {
            console.log('Sample private vouchers:', privateWithPoints.slice(0, 3).map(p => ({
                id: p.id,
                title: p.title.substring(0, 30),
                isPublic: p.isPublic,
                pointsRequired: p.pointsRequired
            })));
        }
        
        res.json(normalizedPromotions);
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
            // Normalize isPublic to boolean
            const promo = promotion.toJSON ? promotion.toJSON() : promotion;
            if (promo.isPublic !== undefined) {
                if (promo.isPublic === true || 
                    promo.isPublic === 1 || 
                    promo.isPublic === '1' ||
                    String(promo.isPublic).toLowerCase() === 'true') {
                    promo.isPublic = true;
                } else {
                    promo.isPublic = false;
                }
            }
            res.json(promo);
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
        // Ensure isPublic is properly converted to boolean
        if (newPromotionData.isPublic !== undefined) {
            // Convert to boolean: true if explicitly true/1/'true', false otherwise
            if (newPromotionData.isPublic === true || 
                newPromotionData.isPublic === 1 || 
                newPromotionData.isPublic === '1' ||
                String(newPromotionData.isPublic).toLowerCase() === 'true') {
                newPromotionData.isPublic = true;
            } else {
                newPromotionData.isPublic = false;
            }
        } else {
            // Default to true if not provided
            newPromotionData.isPublic = true;
        }
        
        // Ensure pointsRequired is properly handled
        if (newPromotionData.pointsRequired !== undefined) {
            if (newPromotionData.pointsRequired === '' || newPromotionData.pointsRequired === null) {
                newPromotionData.pointsRequired = null;
            } else {
                newPromotionData.pointsRequired = parseInt(newPromotionData.pointsRequired) || null;
            }
        }
        
        // Ensure applicableServiceIds is properly handled (should be array or null)
        if (newPromotionData.applicableServiceIds !== undefined) {
            if (!Array.isArray(newPromotionData.applicableServiceIds) || newPromotionData.applicableServiceIds.length === 0) {
                newPromotionData.applicableServiceIds = null;
            }
            // Sequelize JSON field will handle array automatically
        }
        
        // Ensure imageUrl has a default if not provided
        if (!newPromotionData.imageUrl || newPromotionData.imageUrl.trim() === '') {
            newPromotionData.imageUrl = `https://picsum.photos/seed/${uuidv4()}/500/300`;
        }
        
        // Ensure stock is properly handled
        if (newPromotionData.stock !== undefined) {
            if (newPromotionData.stock === '' || newPromotionData.stock === null) {
                newPromotionData.stock = null;
            } else {
                newPromotionData.stock = parseInt(newPromotionData.stock) || null;
            }
        }
        
        console.log('Creating promotion with data:', JSON.stringify(newPromotionData, null, 2));
        const createdPromotion = await db.Promotion.create({
            id: `promo-${uuidv4()}`,
            usageCount: 0,
            ...newPromotionData,
        });
        
        // Ensure isPublic is returned as boolean for frontend
        const responseData = createdPromotion.toJSON ? createdPromotion.toJSON() : createdPromotion;
        if (responseData.isPublic !== undefined) {
            if (responseData.isPublic === true || 
                responseData.isPublic === 1 || 
                responseData.isPublic === '1' ||
                String(responseData.isPublic).toLowerCase() === 'true') {
                responseData.isPublic = true;
            } else {
                responseData.isPublic = false;
            }
        }
        
        console.log('Created promotion response:', JSON.stringify(responseData, null, 2));
        res.status(201).json(responseData);
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
        
        // Ensure isPublic is properly converted to boolean
        if (updatedPromotionData.isPublic !== undefined) {
            // Convert to boolean: true if explicitly true/1/'true', false otherwise
            if (updatedPromotionData.isPublic === true || 
                updatedPromotionData.isPublic === 1 || 
                updatedPromotionData.isPublic === '1' ||
                String(updatedPromotionData.isPublic).toLowerCase() === 'true') {
                updatedPromotionData.isPublic = true;
            } else {
                updatedPromotionData.isPublic = false;
            }
        }
        
        // Ensure pointsRequired is properly handled
        if (updatedPromotionData.pointsRequired !== undefined) {
            if (updatedPromotionData.pointsRequired === '' || updatedPromotionData.pointsRequired === null) {
                updatedPromotionData.pointsRequired = null;
            } else {
                updatedPromotionData.pointsRequired = parseInt(updatedPromotionData.pointsRequired) || null;
            }
        }
        
        console.log('Updating promotion with data:', JSON.stringify(updatedPromotionData, null, 2));
        await promotion.update(updatedPromotionData);
        
        // Fetch updated promotion to return (reload from database to ensure correct values)
        const updatedPromotion = await db.Promotion.findByPk(id);
        
        // Ensure isPublic and pointsRequired are returned correctly for frontend
        const responseData = updatedPromotion.toJSON ? updatedPromotion.toJSON() : updatedPromotion;
        if (responseData.isPublic !== undefined) {
            if (responseData.isPublic === true || 
                responseData.isPublic === 1 || 
                responseData.isPublic === '1' ||
                String(responseData.isPublic).toLowerCase() === 'true') {
                responseData.isPublic = true;
            } else {
                responseData.isPublic = false;
            }
        }
        // Ensure pointsRequired is a number or null
        if (responseData.pointsRequired !== undefined && responseData.pointsRequired !== null) {
            responseData.pointsRequired = Number(responseData.pointsRequired);
        }
        
        console.log('Returning updated promotion:', JSON.stringify(responseData, null, 2));
        res.json(responseData);
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

// POST /api/promotions/:promotionId/redeem - Redeem points for private voucher
router.post('/:promotionId/redeem', async (req, res) => {
    try {
        const { promotionId } = req.params;
        const { userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }
        
        // Get promotion
        const promotion = await db.Promotion.findByPk(promotionId);
        if (!promotion) {
            return res.status(404).json({ message: 'Voucher not found' });
        }
        
        // Check if promotion is private and has pointsRequired
        if (promotion.isPublic !== false || !promotion.pointsRequired) {
            return res.status(400).json({ message: 'Voucher này không thể đổi bằng điểm' });
        }
        
        // Check if promotion is active
        if (!promotion.isActive) {
            return res.status(400).json({ message: 'Voucher không còn hoạt động' });
        }
        
        // Check expiry
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiryDate = new Date(promotion.expiryDate);
        expiryDate.setHours(0, 0, 0, 0);
        if (today > expiryDate) {
            return res.status(400).json({ message: 'Voucher đã hết hạn' });
        }
        
        // Check stock
        if (promotion.stock !== null && promotion.stock <= 0) {
            return res.status(400).json({ message: 'Voucher đã hết lượt sử dụng' });
        }
        
        // Get user wallet
        const wallet = await db.Wallet.findOne({ where: { userId } });
        if (!wallet) {
            return res.status(404).json({ message: 'Wallet not found' });
        }
        
        // Check if user has enough points
        if (wallet.points < promotion.pointsRequired) {
            return res.status(400).json({ 
                message: `Bạn cần ${promotion.pointsRequired} điểm để đổi voucher này. Bạn hiện có ${wallet.points} điểm.` 
            });
        }
        
        // Check if user has already used this promotion
        const existingUsage = await db.PromotionUsage.findOne({
            where: { userId, promotionId: promotion.id }
        });
        if (existingUsage) {
            return res.status(400).json({ message: 'Bạn đã đổi voucher này rồi' });
        }
        
        // Deduct points from wallet
        await wallet.update({
            points: wallet.points - promotion.pointsRequired
        });
        
        // Decrement stock
        if (promotion.stock !== null) {
            await promotion.decrement('stock', { by: 1 });
        }
        
        // Record promotion usage (but don't link to appointment yet)
        await db.PromotionUsage.create({
            id: `promo-usage-${uuidv4()}`,
            userId: userId,
            promotionId: promotion.id,
            appointmentId: null,
            serviceId: null,
        });
        
        // Fetch updated promotion
        const updatedPromotion = await db.Promotion.findByPk(promotion.id);
        
        res.json({
            success: true,
            message: `Đổi voucher thành công! Đã trừ ${promotion.pointsRequired} điểm.`,
            promotion: updatedPromotion,
            remainingPoints: wallet.points - promotion.pointsRequired
        });
    } catch (error) {
        console.error('Error redeeming voucher:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
