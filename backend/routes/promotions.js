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

        // Parse applicableServiceIds from JSON string to array for all promotions
        // This ensures the data is in the correct format before filtering
        promotions.forEach(promo => {
            if (promo.applicableServiceIds && typeof promo.applicableServiceIds === 'string') {
                try {
                    promo.applicableServiceIds = JSON.parse(promo.applicableServiceIds);
                } catch (e) {
                    console.warn(`Failed to parse applicableServiceIds for promotion ${promo.id}:`, e);
                    promo.applicableServiceIds = [];
                }
            }
            if (!Array.isArray(promo.applicableServiceIds)) {
                promo.applicableServiceIds = promo.applicableServiceIds ? [promo.applicableServiceIds] : [];
            }
        });

        // If userId and serviceId provided, filter by eligibility
        if (userId && serviceId) {
            const user = await db.User.findByPk(userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Check if user has ever booked this service (any status except cancelled)
            // Logic: Voucher "Khách hàng mới" chỉ được dùng 1 lần cho 1 dịch vụ mà khách chưa đặt lịch dịch vụ đó lần nào
            // QUAN TRỌNG: Kiểm tra cả Appointment và TreatmentCourse để đảm bảo chính xác
            const hasBookedService = await db.Appointment.findOne({
                where: {
                    userId: userId,
                    serviceId: serviceId,
                    status: { [Op.ne]: 'cancelled' } // Bất kỳ status nào trừ cancelled
                }
            });

            // Nếu không tìm thấy trong Appointment, kiểm tra trong TreatmentCourse
            // QUAN TRỌNG: TreatmentCourse có field serviceId, nên kiểm tra theo serviceId
            let hasBookedServiceViaCourse = false;
            if (!hasBookedService) {
                const treatmentCourse = await db.TreatmentCourse.findOne({
                    where: {
                        clientId: userId,
                        serviceId: serviceId,
                        status: { [Op.ne]: 'cancelled' } // Chỉ tính các liệu trình không bị hủy
                    }
                });
                hasBookedServiceViaCourse = !!treatmentCourse;
            }
            
            const hasBookedThisService = hasBookedService || hasBookedServiceViaCourse;
            
            // Log để debug
            if (hasBookedThisService) {
                console.log(`   📋 User ${userId} has already booked service ${serviceId}:`);
                if (hasBookedService) {
                    console.log(`      - Found via Appointment`);
                }
                if (hasBookedServiceViaCourse) {
                    console.log(`      - Found via TreatmentCourse`);
                }
            }

            // Check promotion usage - CHỈ tính là "đã dùng" nếu có appointmentId != null
            const usedPromotions = await db.PromotionUsage.findAll({
                where: { 
                    userId: userId,
                    appointmentId: { [Op.ne]: null } // CHỈ tính PromotionUsage đã được dùng (có appointmentId)
                }
            });
            const usedPromotionIds = new Set(usedPromotions.map(u => u.promotionId));

            // Check if user has used "New Clients" voucher for this specific service
            // Logic: Mỗi dịch vụ chỉ được dùng voucher "Khách hàng mới" 1 lần
            // QUAN TRỌNG: Chỉ tính các PromotionUsage có appointmentId != null VÀ appointment không bị cancelled/rejected
            const hasUsedNewClientVoucherForService = await db.PromotionUsage.findOne({
                where: {
                    userId: userId,
                    serviceId: serviceId,
                    appointmentId: { [Op.ne]: null } // Đã được dùng (có appointmentId)
                },
                include: [{
                    model: db.Promotion,
                    where: {
                        targetAudience: 'New Clients'
                    },
                    required: true
                }, {
                    model: db.Appointment,
                    required: true,
                    where: {
                        status: { [Op.ne]: 'cancelled' }, // Không tính appointment bị cancelled
                        rejectionReason: { [Op.or]: [{ [Op.is]: null }, { [Op.eq]: '' }] } // Không tính appointment bị rejected
                    }
                }]
            });

            // Check if today is user's birthday
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const isBirthday = user.birthday && (() => {
                const birthday = new Date(user.birthday);
                birthday.setHours(0, 0, 0, 0);
                return birthday.getMonth() === today.getMonth() &&
                    birthday.getDate() === today.getDate();
            })();

            // Check if user has already used birthday voucher today
            // QUAN TRỌNG: Chỉ tính là "đã dùng" nếu có PromotionUsage với appointmentId != null
            let hasUsedBirthdayVoucherToday = false;
            if (isBirthday) {
                const birthdayVoucherUsages = await db.PromotionUsage.findAll({
                    where: {
                        userId: userId,
                        appointmentId: { [Op.ne]: null } // Đã được dùng (có appointmentId)
                    },
                    include: [{
                        model: db.Promotion,
                        where: {
                            targetAudience: 'Birthday'
                        },
                        required: true
                    }, {
                        model: db.Appointment,
                        required: true
                    }]
                });
                
                if (birthdayVoucherUsages.length > 0) {
                    // Kiểm tra xem có appointment nào không bị cancelled/rejected không
                    const validUsages = birthdayVoucherUsages.filter(usage => {
                        if (!usage.Appointment) return false;
                        return usage.Appointment.status !== 'cancelled' && 
                               (!usage.Appointment.rejectionReason || usage.Appointment.rejectionReason.trim() === '');
                    });
                    
                    if (validUsages.length > 0) {
                        // Kiểm tra xem có dùng trong ngày hôm nay không
                        hasUsedBirthdayVoucherToday = validUsages.some(usage => {
                            const usedDate = new Date(usage.usedAt || usage.createdAt);
                            usedDate.setHours(0, 0, 0, 0);
                            return usedDate.getTime() === today.getTime();
                        });
                    }
                }
            }

            // Filter promotions based on eligibility
            promotions = promotions.filter(promo => {
                // Parse applicableServiceIds from JSON string to array if needed
                if (promo.applicableServiceIds && typeof promo.applicableServiceIds === 'string') {
                    try {
                        promo.applicableServiceIds = JSON.parse(promo.applicableServiceIds);
                    } catch (e) {
                        console.warn(`Failed to parse applicableServiceIds for promotion ${promo.id}:`, e);
                        promo.applicableServiceIds = [];
                    }
                }
                if (!Array.isArray(promo.applicableServiceIds)) {
                    promo.applicableServiceIds = [];
                }

                // For client pages, only show public promotions (unless they know the code)
                // This filter is already applied in the query above, but we keep it here for safety

                // Check target audience
                if (promo.targetAudience === 'New Clients') {
                    // Logic: Voucher "Khách hàng mới" chỉ được dùng 1 lần cho 1 dịch vụ mà khách chưa đặt lịch dịch vụ đó lần nào
                    // 1. Kiểm tra xem user đã từng đặt lịch dịch vụ này chưa (bất kỳ status nào, trừ cancelled)
                    //    Kiểm tra cả Appointment và TreatmentCourse
                    if (hasBookedThisService) {
                        console.log(`   ❌ User ${userId} has already booked service ${serviceId} (via appointment or treatment course), cannot use New Clients voucher`);
                        return false;
                    }

                    // 2. Kiểm tra xem user đã dùng voucher "Khách hàng mới" cho dịch vụ này chưa
                    if (hasUsedNewClientVoucherForService) {
                        console.log(`   ❌ User ${userId} has already used New Clients voucher for service ${serviceId}`);
                        return false;
                    }

                    // 3. Check if promotion is for this specific service
                    if (promo.applicableServiceIds &&
                        Array.isArray(promo.applicableServiceIds) &&
                        promo.applicableServiceIds.length > 0 &&
                        !promo.applicableServiceIds.includes(serviceId)) {
                        console.log(`   ❌ Promotion ${promo.id} is not applicable to service ${serviceId}`);
                        return false;
                    }

                    console.log(`   ✅ User ${userId} can use New Clients voucher ${promo.id} for service ${serviceId}`);
                } else if (promo.targetAudience === 'Birthday') {
                    // Only show if today is user's birthday AND user hasn't used it today
                    if (!isBirthday) return false;
                    if (hasUsedBirthdayVoucherToday) {
                        console.log(`   ❌ User ${userId} has already used birthday voucher today`);
                        return false;
                    }
                } else if (promo.targetAudience === 'All') {
                    // Show all active promotions
                }

                // Check if already used (for non-Birthday, non-New Clients promotions)
                if (promo.targetAudience !== 'Birthday' && promo.targetAudience !== 'New Clients') {
                    if (usedPromotionIds.has(promo.id)) {
                        return false; // Already used
                    }
                }

                // Check expiry
                const expiryDate = new Date(promo.expiryDate);
                expiryDate.setHours(0, 0, 0, 0);
                if (today > expiryDate) return false;

                // Check stock
                if (promo.stock !== null && promo.stock <= 0) return false;

                return true;
            });
        } else if (userId && !serviceId) {
            // Logic cho "Voucher dành cho bạn" tab (có userId nhưng không có serviceId)
            const user = await db.User.findByPk(userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Check if today is user's birthday
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const isBirthday = user.birthday && (() => {
                const birthday = new Date(user.birthday);
                birthday.setHours(0, 0, 0, 0);
                return birthday.getMonth() === today.getMonth() &&
                    birthday.getDate() === today.getDate();
            })();

            // Check if user has already used birthday voucher today
            let hasUsedBirthdayVoucherToday = false;
            if (isBirthday) {
                const birthdayVoucherUsages = await db.PromotionUsage.findAll({
                    where: {
                        userId: userId,
                        appointmentId: { [Op.ne]: null } // Đã được dùng (có appointmentId)
                    },
                    include: [{
                        model: db.Promotion,
                        where: {
                            targetAudience: 'Birthday'
                        },
                        required: true
                    }, {
                        model: db.Appointment,
                        required: true
                    }]
                });
                
                if (birthdayVoucherUsages.length > 0) {
                    const validUsages = birthdayVoucherUsages.filter(usage => {
                        if (!usage.Appointment) return false;
                        return usage.Appointment.status !== 'cancelled' && 
                               (!usage.Appointment.rejectionReason || usage.Appointment.rejectionReason.trim() === '');
                    });
                    
                    if (validUsages.length > 0) {
                        hasUsedBirthdayVoucherToday = validUsages.some(usage => {
                            const usedDate = new Date(usage.usedAt || usage.createdAt);
                            usedDate.setHours(0, 0, 0, 0);
                            return usedDate.getTime() === today.getTime();
                        });
                    }
                }
            }

            // Check if user has used "New Clients" voucher for any service
            const hasUsedNewClientVoucherForAnyService = await db.PromotionUsage.findOne({
                where: {
                    userId: userId,
                    appointmentId: { [Op.ne]: null } // Đã được dùng (có appointmentId)
                },
                include: [{
                    model: db.Promotion,
                    where: {
                        targetAudience: 'New Clients'
                    },
                    required: true
                }]
            });

            // Filter promotions
            promotions = promotions.filter(promo => {
                if (promo.targetAudience === 'Birthday') {
                    // Only show if today is user's birthday AND user hasn't used it today
                    if (!isBirthday) return false;
                    if (hasUsedBirthdayVoucherToday) return false;
                } else if (promo.targetAudience === 'New Clients') {
                    // Only show if user hasn't used this voucher for any service yet
                    if (hasUsedNewClientVoucherForAnyService) return false;
                }
                return true;
            });
        }

        // Normalize isPublic to boolean for all promotions and calculate remaining quantity
        const normalizedPromotions = await Promise.all(promotions.map(async (p) => {
            try {
                const promo = p.toJSON ? p.toJSON() : p;

                // Parse applicableServiceIds from JSON string to array if needed
                if (promo.applicableServiceIds) {
                    if (typeof promo.applicableServiceIds === 'string') {
                        try {
                            promo.applicableServiceIds = JSON.parse(promo.applicableServiceIds);
                        } catch (e) {
                            console.warn(`Failed to parse applicableServiceIds for promotion ${promo.id}:`, e);
                            promo.applicableServiceIds = [];
                        }
                    }
                    // Ensure it's an array
                    if (!Array.isArray(promo.applicableServiceIds)) {
                        promo.applicableServiceIds = [];
                    }
                } else {
                    promo.applicableServiceIds = [];
                }

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

                // Tính số lượng còn lại
                // Voucher thường (isPublic = true): stock - số lần đã dùng (PromotionUsage với appointmentId != null)
                // Voucher đổi điểm (isPublic = false, pointsRequired > 0): số PromotionUsage đã tạo - số đã dùng
                try {
                    if (promo.isPublic === true) {
                        // Voucher thường: stock - số lần đã dùng
                        const usedCount = await db.PromotionUsage.count({
                            where: {
                                promotionId: promo.id,
                                appointmentId: { [Op.ne]: null } // Đã được dùng
                            }
                        });
                        // Normalize stock: convert to number if not null/undefined, otherwise keep as null
                        let stock = promo.stock;
                        if (stock !== null && stock !== undefined && stock !== '') {
                            stock = Number(stock);
                            if (isNaN(stock)) {
                                stock = null;
                            }
                        } else {
                            stock = null;
                        }
                        // Tính remainingQuantity: nếu stock có giá trị thì tính, nếu null thì null (không giới hạn)
                        promo.remainingQuantity = stock !== null ? Math.max(0, stock - usedCount) : null;
                        promo.usedCount = usedCount;
                        // Đảm bảo stock được trả về đúng kiểu
                        promo.stock = stock;
                    } else if (promo.pointsRequired && Number(promo.pointsRequired) > 0) {
                        // Voucher đổi điểm: tính dựa vào stock (giống voucher thường)
                        // Khi khách đổi điểm, stock sẽ bị trừ đi 1
                        // remainingQuantity = stock (đã trừ khi đổi điểm)
                        const usedCount = await db.PromotionUsage.count({
                            where: {
                                promotionId: promo.id,
                                appointmentId: { [Op.ne]: null } // Đã được dùng
                            }
                        });
                        // Normalize stock: convert to number if not null/undefined, otherwise keep as null
                        let stock = promo.stock;
                        if (stock !== null && stock !== undefined && stock !== '') {
                            stock = Number(stock);
                            if (isNaN(stock)) {
                                stock = null;
                            }
                        } else {
                            stock = null;
                        }
                        // Tính remainingQuantity: stock (đã trừ khi đổi điểm)
                        // Không cần trừ usedCount vì stock đã bị trừ khi đổi điểm rồi
                        promo.remainingQuantity = stock !== null ? Math.max(0, stock) : null;
                        promo.usedCount = usedCount;
                        // Đảm bảo stock được trả về đúng kiểu
                        promo.stock = stock;
                        // Tính totalRedeemed để hiển thị thông tin bổ sung
                        const totalRedeemed = await db.PromotionUsage.count({
                            where: {
                                promotionId: promo.id
                            }
                        });
                        promo.totalRedeemed = totalRedeemed;
                    } else {
                        promo.remainingQuantity = null;
                    }
                } catch (calcError) {
                    console.error(`Error calculating remainingQuantity for promotion ${promo.id}:`, calcError);
                    // Set default values on error
                    promo.remainingQuantity = null;
                    promo.usedCount = 0;
                    promo.stock = promo.stock !== null && promo.stock !== undefined ? Number(promo.stock) : null;
                }

                return promo;
            } catch (promoError) {
                console.error(`Error processing promotion ${p.id || 'unknown'}:`, promoError);
                // Return a minimal valid promotion object to prevent crash
                return {
                    id: p.id || 'unknown',
                    title: p.title || 'Unknown',
                    isPublic: false,
                    pointsRequired: null,
                    remainingQuantity: null,
                    usedCount: 0,
                    stock: null,
                    applicableServiceIds: []
                };
            }
        }));

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
        console.error('Error stack:', error.stack);
        res.status(500).json({
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
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
        const newPoints = wallet.points - promotion.pointsRequired;
        await wallet.update({
            points: newPoints
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
            remainingPoints: newPoints
        });
    } catch (error) {
        console.error('Error redeeming voucher:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/promotions/my-redeemed/:userId - Get all redeemed (but not yet used) vouchers for a user
router.get('/my-redeemed/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        console.log(`\n🔍 [GET /my-redeemed/${userId}] Fetching redeemed vouchers...`);

        // Get all PromotionUsage records for this user where appointmentId is null (unused redeemed vouchers)
        const unusedRedeemedUsages = await db.PromotionUsage.findAll({
            where: {
                userId: userId,
                appointmentId: { [Op.is]: null } // Only unused vouchers
            },
            include: [{
                model: db.Promotion,
                required: true // Inner join - only get vouchers that still exist
            }]
        });

        console.log(`   Found ${unusedRedeemedUsages.length} unused PromotionUsage records`);

        // Group by promotionId and count
        const voucherCounts = {};
        unusedRedeemedUsages.forEach(usage => {
            const promoId = usage.promotionId;
            if (!voucherCounts[promoId]) {
                // Get promotion data (may be in usage.Promotion or need to fetch)
                const promotion = usage.Promotion || usage.get ? usage.get('Promotion') : null;
                if (promotion) {
                    voucherCounts[promoId] = {
                        promotion: promotion,
                        count: 0
                    };
                }
            }
            if (voucherCounts[promoId]) {
                voucherCounts[promoId].count++;
            }
        });

        // Convert to array format with redeemedCount
        const redeemedVouchers = Object.values(voucherCounts).map(({ promotion, count }) => {
            const promoData = promotion.toJSON ? promotion.toJSON() : promotion;
            // Normalize isActive and isPublic to boolean
            const normalized = {
                ...promoData,
                isActive: promoData.isActive === true || promoData.isActive === 1 || promoData.isActive === '1',
                isPublic: promoData.isPublic === true || promoData.isPublic === 1 || promoData.isPublic === '1',
                redeemedCount: count
            };
            return normalized;
        });

        console.log(`   ✅ Returning ${redeemedVouchers.length} unique redeemed vouchers`);
        redeemedVouchers.forEach(v => {
            console.log(`      - ${v.code || v.id}: redeemedCount = ${v.redeemedCount}`);
        });
        console.log(`🔍 [GET /my-redeemed/${userId}] ==========================================\n`);

        res.json(redeemedVouchers);
    } catch (error) {
        console.error('❌ Error fetching my redeemed vouchers:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
