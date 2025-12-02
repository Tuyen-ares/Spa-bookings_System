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
            // IMPORTANT: Use raw: false to get Sequelize instances with proper data types
            let allPromotions = await db.Promotion.findAll({
                where: { isActive: true },
                raw: false // Get Sequelize instances, not plain objects
            });

            console.log(`\n🔍 [REDEEMABLE FILTER] Total active promotions: ${allPromotions.length}`);

            // Filter for private vouchers (isPublic = false/0) with pointsRequired > 0
            let promotions = allPromotions.filter(promo => {
                // Get raw values from Sequelize instance - try multiple methods
                let promoData;
                if (promo.toJSON) {
                    promoData = promo.toJSON();
                } else if (promo.dataValues) {
                    promoData = promo.dataValues;
                } else {
                    promoData = promo;
                }
                
                // Check if private: isPublic should be false, 0, or '0'
                const isPublicRaw = promoData.isPublic;
                // Also check the Sequelize instance directly
                const isPublicFromInstance = promo.isPublic !== undefined ? promo.isPublic : isPublicRaw;
                const isPublicValue = isPublicFromInstance !== undefined ? isPublicFromInstance : isPublicRaw;
                
                const isPrivate = isPublicValue === false ||
                    isPublicValue === 0 ||
                    isPublicValue === '0' ||
                    String(isPublicValue).toLowerCase() === 'false';

                // Check if has pointsRequired > 0
                const pointsRequiredRaw = promoData.pointsRequired;
                // Also check the Sequelize instance directly
                const pointsRequiredFromInstance = promo.pointsRequired !== undefined ? promo.pointsRequired : pointsRequiredRaw;
                const pointsRequiredValue = pointsRequiredFromInstance !== undefined ? pointsRequiredFromInstance : pointsRequiredRaw;
                
                const pointsRequired = Number(pointsRequiredValue);
                const hasPointsRequired = !isNaN(pointsRequired) && pointsRequired > 0;

                // Debug logging for each voucher
                if (isPrivate && !hasPointsRequired) {
                    console.log(`   ⚠️ [FILTER OUT] ${promoData.id}: ${promoData.title}`);
                    console.log(`      - isPublic (raw): ${isPublicRaw} (${typeof isPublicRaw}), (instance): ${isPublicFromInstance} (${typeof isPublicFromInstance})`);
                    console.log(`      - pointsRequired (raw): ${pointsRequiredRaw} (${typeof pointsRequiredRaw}), (instance): ${pointsRequiredFromInstance} (${typeof pointsRequiredFromInstance})`);
                    console.log(`      - isPrivate: ${isPrivate}, hasPointsRequired: ${hasPointsRequired}`);
                }

                if (!isPrivate || !hasPointsRequired) {
                    return false;
                }

                console.log(`   ✅ [INCLUDED] ${promoData.id}: ${promoData.title} - isPrivate: ${isPrivate}, pointsRequired: ${pointsRequired}`);
                return true;
            });

            console.log(`\n✅ [REDEEMABLE FILTER] Found ${promotions.length} private vouchers with pointsRequired > 0`);
            promotions.forEach(p => {
                const pData = p.toJSON ? p.toJSON() : (p.dataValues || p);
                console.log(`   - ${pData.id}: ${pData.title}, isPublic: ${pData.isPublic}, pointsRequired: ${pData.pointsRequired}`);
            });

            // Filter out expired vouchers
            // IMPORTANT: For redeemable vouchers (private vouchers), do NOT filter by stock
            // Stock check is not applicable for redeemable vouchers - they are redeemed with points
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            promotions = promotions.filter(promo => {
                // Get promo data
                let promoData;
                if (promo.toJSON) {
                    promoData = promo.toJSON();
                } else if (promo.dataValues) {
                    promoData = promo.dataValues;
                } else {
                    promoData = promo;
                }
                
                // Check expiry date
                const expiryDate = new Date(promoData.expiryDate);
                expiryDate.setHours(0, 0, 0, 0);
                if (today > expiryDate) {
                    console.log(`   ⚠️ [FILTER OUT] Voucher ${promoData.id} expired`);
                    return false;
                }
                
                // IMPORTANT: Do NOT filter by stock for redeemable vouchers (private vouchers)
                // Redeemable vouchers are redeemed with points, stock is not applicable
                // Stock check only applies to public vouchers, not redeemable vouchers
                console.log(`   ✅ [INCLUDED] Voucher ${promoData.id} passed expiry check (stock check skipped for redeemable vouchers)`);
                return true;
            });

            console.log(`\n📤 [REDEEMABLE FILTER] Returning ${promotions.length} redeemable vouchers after filtering`);
            // Convert to plain objects for JSON response and normalize isPublic
            const responseData = promotions.map(p => {
                let promo;
                if (p.toJSON) {
                    promo = p.toJSON();
                } else if (p.dataValues) {
                    promo = p.dataValues;
                } else {
                    promo = p;
                }
                
                // Normalize isPublic to boolean (should be false for redeemable vouchers)
                if (promo.isPublic !== undefined) {
                    const isPublicValue = promo.isPublic;
                    promo.isPublic = isPublicValue === true || isPublicValue === 1 || isPublicValue === '1';
                }
                
                // Ensure pointsRequired is a number
                if (promo.pointsRequired !== undefined && promo.pointsRequired !== null) {
                    promo.pointsRequired = Number(promo.pointsRequired);
                }
                
                console.log(`   📦 [RESPONSE] ${promo.id}: ${promo.title}, isPublic: ${promo.isPublic}, pointsRequired: ${promo.pointsRequired}`);
                return promo;
            });
            
            console.log(`\n✅ [REDEEMABLE FILTER] Sending ${responseData.length} vouchers to client\n`);
            return res.json(responseData);
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

            // Check if user is truly a new client (no successful bookings at all)
            const userAppointments = await db.Appointment.findAll({
                where: {
                    userId: userId,
                    status: { [Op.ne]: 'cancelled' }
                }
            });
            
            const isNewClient = userAppointments.length === 0 || 
                !userAppointments.some(apt => 
                    apt.paymentStatus === 'Paid' || 
                    apt.status === 'completed' || 
                    apt.status === 'upcoming' || 
                    apt.status === 'scheduled'
                );

            // Filter promotions
            promotions = promotions.filter(promo => {
                if (promo.targetAudience === 'Birthday') {
                    // Only show if today is user's birthday AND user hasn't used it today
                    if (!isBirthday) return false;
                    if (hasUsedBirthdayVoucherToday) return false;
                } else if (promo.targetAudience === 'New Clients') {
                    // Only show if user is truly new (no successful bookings) AND hasn't used voucher
                    if (!isNewClient) return false;
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
        
        // Check if this is a VIP tier voucher (targetAudience starts with "Tier Level")
        const isVIPTierVoucher = newPromotionData.targetAudience && 
            String(newPromotionData.targetAudience).startsWith('Tier Level');
        
        // If this is a VIP tier voucher, check if there's already a voucher for this tier
        // VIP tier vouchers: Only 1 voucher allowed per tier (must delete old one before creating new)
        if (isVIPTierVoucher) {
            const tierLevel = String(newPromotionData.targetAudience).replace('Tier Level ', '');
            const targetAudience = `Tier Level ${tierLevel}`;
            
            // Check if there's already a voucher for this tier (active or inactive)
            const existingVoucher = await db.Promotion.findOne({
                where: {
                    targetAudience: targetAudience
                }
            });
            
            if (existingVoucher) {
                console.log(`❌ [VIP VOUCHER CREATE] Voucher already exists for Tier Level ${tierLevel}: ${existingVoucher.id} - ${existingVoucher.title}`);
                return res.status(400).json({ 
                    message: `Đã tồn tại voucher cho hạng ${tierLevel}. Vui lòng xóa voucher cũ trước khi tạo voucher mới.`,
                    existingVoucherId: existingVoucher.id,
                    existingVoucherTitle: existingVoucher.title
                });
            }
            
            // Ensure isActive is set to true for the new voucher (default)
            if (newPromotionData.isActive === undefined) {
                newPromotionData.isActive = true;
            }
            
            console.log(`✅ [VIP VOUCHER CREATE] No existing voucher for Tier Level ${tierLevel}, creating new voucher`);
        }
        
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
        const oldIsPublic = promotion.isPublic === true || promotion.isPublic === 1 || promotion.isPublic === '1' || String(promotion.isPublic).toLowerCase() === 'true';
        
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

        const newIsPublic = updatedPromotionData.isPublic !== undefined 
            ? (updatedPromotionData.isPublic === true || updatedPromotionData.isPublic === 1 || updatedPromotionData.isPublic === '1' || String(updatedPromotionData.isPublic).toLowerCase() === 'true')
            : oldIsPublic;

        // Ensure pointsRequired is properly handled
        if (updatedPromotionData.pointsRequired !== undefined) {
            if (updatedPromotionData.pointsRequired === '' || updatedPromotionData.pointsRequired === null) {
                updatedPromotionData.pointsRequired = null;
            } else {
                updatedPromotionData.pointsRequired = parseInt(updatedPromotionData.pointsRequired) || null;
            }
        }

        // IMPORTANT: If changing from public to private, ensure pointsRequired is set
        // If isPublic changed from true to false and pointsRequired is not set, set a default value
        if (oldIsPublic && !newIsPublic) {
            // Changing from public to private
            console.log(`🔄 [UPDATE PROMOTION] Voucher ${promotion.id} changing from public to private`);
            console.log(`   - Old isPublic: ${oldIsPublic}, New isPublic: ${newIsPublic}`);
            console.log(`   - Updated pointsRequired: ${updatedPromotionData.pointsRequired}`);
            console.log(`   - Existing pointsRequired: ${promotion.pointsRequired}`);
            
            if (!updatedPromotionData.pointsRequired || updatedPromotionData.pointsRequired === null || updatedPromotionData.pointsRequired === '') {
                // If pointsRequired is not provided, check if promotion already has a value
                const existingPointsRequired = promotion.pointsRequired;
                if (!existingPointsRequired || existingPointsRequired === null || existingPointsRequired === 0) {
                    // No existing pointsRequired, set a default (e.g., 100 points)
                    // Or you can require admin to set it explicitly
                    console.warn(`⚠️ [UPDATE PROMOTION] Voucher ${promotion.id} changed from public to private but pointsRequired is not set. Setting default: 100 points`);
                    updatedPromotionData.pointsRequired = 100; // Default value, admin should set this properly
                } else {
                    // Keep existing value
                    console.log(`✅ [UPDATE PROMOTION] Keeping existing pointsRequired: ${existingPointsRequired}`);
                    updatedPromotionData.pointsRequired = existingPointsRequired;
                }
            } else {
                console.log(`✅ [UPDATE PROMOTION] Using provided pointsRequired: ${updatedPromotionData.pointsRequired}`);
            }
        }

        // Check if this is a VIP tier voucher
        const isVIPTierVoucher = promotion.targetAudience && 
            String(promotion.targetAudience).startsWith('Tier Level');
        
        // If this is a VIP tier voucher and isActive is being set to true,
        // deactivate all other vouchers for the same tier
        if (isVIPTierVoucher) {
            const tierLevel = String(promotion.targetAudience).replace('Tier Level ', '');
            const targetAudience = `Tier Level ${tierLevel}`;
            
            // Check if isActive is being set to true (or not being changed and is currently true)
            const currentIsActive = promotion.isActive === true || promotion.isActive === 1 || 
                String(promotion.isActive).toLowerCase() === 'true';
            const newIsActive = updatedPromotionData.isActive !== undefined 
                ? (updatedPromotionData.isActive === true || updatedPromotionData.isActive === 1 || 
                   String(updatedPromotionData.isActive).toLowerCase() === 'true')
                : currentIsActive;
            
            // If the voucher will be active after update, deactivate all other vouchers for this tier
            if (newIsActive) {
                const deactivatedCount = await db.Promotion.update(
                    { isActive: false },
                    {
                        where: {
                            targetAudience: targetAudience,
                            isActive: true,
                            id: { [Op.ne]: id } // Exclude the current voucher being updated
                        }
                    }
                );
                
                if (deactivatedCount[0] > 0) {
                    console.log(`🔄 [VIP VOUCHER UPDATE] Deactivated ${deactivatedCount[0]} existing voucher(s) for Tier Level ${tierLevel}`);
                }
            }
        }
        
        console.log('\n📝 [UPDATE PROMOTION] Updating promotion with data:', JSON.stringify(updatedPromotionData, null, 2));
        await promotion.update(updatedPromotionData);

        // Fetch updated promotion to return (reload from database to ensure correct values)
        const updatedPromotion = await db.Promotion.findByPk(id);
        
        // Verify the update
        const verifyData = updatedPromotion.toJSON ? updatedPromotion.toJSON() : updatedPromotion;
        console.log(`✅ [UPDATE PROMOTION] Updated promotion ${id}:`);
        console.log(`   - isPublic: ${verifyData.isPublic} (${typeof verifyData.isPublic})`);
        console.log(`   - pointsRequired: ${verifyData.pointsRequired} (${typeof verifyData.pointsRequired})`);

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

        // Normalize isPublic để xác định loại voucher
        const normalizedIsPublic = promotion.isPublic === true || promotion.isPublic === 1 || promotion.isPublic === '1';
        const isRedeemedVoucher = !normalizedIsPublic; // Voucher đổi điểm (isPublic = false)
        
        // QUAN TRỌNG: Kiểm tra stock CHỈ cho voucher public, KHÔNG kiểm tra cho voucher đổi điểm
        // Voucher đổi điểm: Chỉ cần kiểm tra xem user có unused PromotionUsage (appointmentId = null) không
        if (normalizedIsPublic) {
            // Voucher public: Kiểm tra stock
            if (promotion.stock !== null && promotion.stock <= 0) {
                return res.status(400).json({ message: 'Mã khuyến mãi đã hết lượt sử dụng' });
            }
        }

        // QUAN TRỌNG: Với voucher đổi điểm, BẮT BUỘC phải có userId để kiểm tra unused PromotionUsage
        // Nếu không có userId, không thể validate voucher đổi điểm
        if (!userId && !normalizedIsPublic) {
            console.log(`   ⚠️ [WARNING] userId is required for redeemed vouchers (isPublic = false)`);
            return res.status(400).json({ message: 'Cần thông tin người dùng để áp dụng voucher đổi điểm' });
        }
        
        // Check if user has already used this promotion
        // QUAN TRỌNG: Chỉ reject nếu PromotionUsage có appointmentId != null (đã dùng)
        // Nếu appointmentId = null, nghĩa là voucher đổi điểm chưa dùng, vẫn cho phép áp dụng
        if (userId) {
            if (normalizedIsPublic) {
                // Voucher public: Kiểm tra xem đã dùng chưa (có PromotionUsage với appointmentId != null)
                const usedUsage = await db.PromotionUsage.findOne({
                    where: { 
                        userId, 
                        promotionId: promotion.id,
                        appointmentId: { [Op.ne]: null } // Đã được dùng (có appointmentId)
                    }
                });

                if (usedUsage) {
                    // For Birthday promotions, check if used this year
                    if (promotion.targetAudience === 'Birthday') {
                        const usedYear = new Date(usedUsage.usedAt).getFullYear();
                        if (usedYear === today.getFullYear()) {
                            return res.status(400).json({ message: 'Bạn đã sử dụng mã khuyến mãi sinh nhật trong năm này' });
                        }
                    } else if (promotion.targetAudience === 'New Clients') {
                        return res.status(400).json({ message: 'Bạn đã sử dụng mã khuyến mãi này rồi' });
                    } else {
                        // Voucher public thường: có thể dùng nhiều lần nếu còn stock
                        // Không reject ở đây, để stock check xử lý
                    }
                }
            } else {
                // Voucher đổi điểm (isPublic = false): Kiểm tra xem có voucher chưa dùng không
                // QUAN TRỌNG: Chỉ cần kiểm tra unused PromotionUsage, KHÔNG cần kiểm tra stock
                const unusedRedeemedUsages = await db.PromotionUsage.findAll({
                    where: { 
                        userId, 
                        promotionId: promotion.id,
                        appointmentId: { [Op.is]: null } // Chưa dùng (appointmentId = null)
                    }
                });

                console.log(`\n🔍 [VOUCHER VALIDATION] Checking redeemed voucher availability:`);
                console.log(`   - Found ${unusedRedeemedUsages.length} unused PromotionUsage records`);
                console.log(`   - Promotion ID: ${promotion.id}`);
                console.log(`   - Promotion Code: ${promotion.code}`);
                console.log(`   - User ID: ${userId}`);
                console.log(`   - Promotion stock: ${promotion.stock} (không quan trọng đối với voucher đổi điểm)`);

                if (unusedRedeemedUsages.length === 0) {
                    console.log(`   ❌ [VALIDATION FAILED] No unused redeemed voucher found`);
                    return res.status(400).json({ message: 'Mã khuyến mãi này không còn khả dụng. Vui lòng chọn mã khác.' });
                }
                
                console.log(`   ✅ [VALIDATION PASSED] Found ${unusedRedeemedUsages.length} unused voucher(s) - voucher có thể sử dụng!`);
                console.log(`   ⚠️ IMPORTANT: NOT creating new PromotionUsage - only validating`);
                console.log(`   ⚠️ IMPORTANT: Voucher sẽ được trừ khi đặt lịch thành công (trong POST /api/appointments)`);
            }
        } else {
            // Nếu không có userId, chỉ cho phép validate voucher public (không cần userId)
            if (!normalizedIsPublic) {
                console.log(`   ⚠️ [WARNING] userId is required for redeemed vouchers (isPublic = false)`);
                console.log(`   ❌ [VALIDATION FAILED] Cannot validate redeemed voucher without userId`);
                return res.status(400).json({ message: 'Cần thông tin người dùng để áp dụng voucher đổi điểm' });
            }
            // Đối với voucher public, không cần userId để validate (đã kiểm tra stock ở trên)
            console.log(`   ℹ️ [INFO] Validating public voucher without userId - stock check already passed`);
        }

        // QUAN TRỌNG: Route này CHỈ validate voucher, KHÔNG tạo PromotionUsage nếu không có appointmentId
        // PromotionUsage chỉ được tạo khi appointment được tạo thành công (trong POST /api/appointments)
        // Điều này ngăn voucher public xuất hiện ở "Voucher của tôi" khi chỉ chọn mà chưa đặt lịch
        // VÀ ngăn voucher đổi điểm tăng số lượng khi chỉ chọn mà chưa đặt lịch
        
        console.log(`\n🔍 [POST /apply/${code}] Final validation summary:`);
        console.log(`   - userId: ${userId || 'NOT PROVIDED'}`);
        console.log(`   - appointmentId: ${appointmentId || 'undefined (validation only)'}`);
        console.log(`   - serviceId: ${serviceId || 'undefined'}`);
        console.log(`   - promotionId: ${promotion.id}`);
        console.log(`   - promotionCode: ${promotion.code}`);
        console.log(`   - isPublic: ${promotion.isPublic} (normalized: ${normalizedIsPublic})`);
        console.log(`   - isRedeemedVoucher: ${isRedeemedVoucher}`);
        console.log(`   ⚠️ IMPORTANT: This route ONLY validates, does NOT create PromotionUsage`);
        console.log(`   ⚠️ PromotionUsage will be created/updated in POST /api/appointments when booking is confirmed`);
        
        // KHÔNG trừ stock ở đây - stock sẽ được trừ khi tạo appointment thành công
        // KHÔNG tạo PromotionUsage ở đây - PromotionUsage sẽ được tạo khi tạo appointment thành công

        // Fetch promotion để trả về (không cần update vì chưa trừ stock)
        const updatedPromotion = await db.Promotion.findByPk(promotion.id);
        
        console.log(`   ✅ [SUCCESS] All validations passed - returning success response`);
        console.log(`   ✅ Response: success=true, message='Áp dụng mã thành công'`);

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

        // QUAN TRỌNG: Cho phép đổi voucher nhiều lần, không giới hạn số lần đổi
        // Chỉ cần kiểm tra: còn stock, còn điểm, voucher còn active, chưa hết hạn

        // Deduct points from wallet
        const newPoints = wallet.points - promotion.pointsRequired;
        await wallet.update({
            points: newPoints
        });

        // Note: Points history is derived from Payment records, not stored separately
        console.log(`✅ Deducted ${promotion.pointsRequired} points from user ${userId} wallet`);

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
        // QUAN TRỌNG: CHỈ lấy voucher đổi điểm (isPublic = false), KHÔNG lấy voucher public
        // Fetch tất cả PromotionUsage trước, sau đó filter ở application level để đảm bảo chính xác
        const allUnusedUsages = await db.PromotionUsage.findAll({
            where: {
                userId: userId,
                appointmentId: { [Op.is]: null } // Only unused vouchers
            },
            include: [{
                model: db.Promotion,
                required: true // Inner join - only get vouchers that still exist
            }]
        });
        
        // Filter để CHỈ lấy PromotionUsage của voucher đổi điểm (isPublic = false)
        const unusedRedeemedUsages = allUnusedUsages.filter(usage => {
            const promotion = usage.Promotion || (usage.get ? usage.get('Promotion') : null);
            if (!promotion) return false;
            
            const promoData = promotion.toJSON ? promotion.toJSON() : promotion;
            const isPublicNormalized = promoData.isPublic === true || promoData.isPublic === 1 || promoData.isPublic === '1';
            
            // CHỈ lấy voucher đổi điểm (isPublic = false)
            const isRedeemedVoucher = !isPublicNormalized;
            
            if (!isRedeemedVoucher) {
                console.log(`   ⚠️ Skipping public voucher PromotionUsage: ${promoData.code || promoData.id}, isPublic = ${promoData.isPublic}`);
            }
            
            return isRedeemedVoucher;
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
        let redeemedVouchers = Object.values(voucherCounts).map(({ promotion, count }) => {
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

        // QUAN TRỌNG: CHỈ trả về voucher đổi điểm (isPublic = false)
        // KHÔNG trả về voucher public (isPublic = true) vì voucher public không bao giờ xuất hiện ở "Voucher của tôi"
        redeemedVouchers = redeemedVouchers.filter(v => {
            // Kiểm tra lại isPublic sau khi normalize
            const isPublicNormalized = v.isPublic === true || v.isPublic === 1 || v.isPublic === '1';
            
            // CHỈ hiển thị voucher đổi điểm (isPublic = false), LOẠI BỎ voucher public
            if (isPublicNormalized) {
                console.log(`   ⚠️ Filtering out public voucher ${v.code || v.id}: isPublic = ${v.isPublic} (raw), normalized = ${isPublicNormalized} (chỉ hiển thị voucher đổi điểm)`);
                return false;
            }
            
            // Nếu là voucher đổi điểm (isPublic = false) và có stock
            if (!isPublicNormalized && v.stock !== null) {
                // Chỉ hiển thị nếu stock > 0
                if (v.stock <= 0) {
                    console.log(`   ⚠️ Filtering out voucher ${v.code || v.id}: stock = ${v.stock} (voucher đổi điểm hết stock)`);
                    return false;
                }
            }
            
            // CHỈ trả về voucher đổi điểm (isPublic = false)
            return !isPublicNormalized;
        });

        console.log(`   ✅ Returning ${redeemedVouchers.length} unique redeemed vouchers (after stock filter)`);
        redeemedVouchers.forEach(v => {
            console.log(`      - ${v.code || v.id}: redeemedCount = ${v.redeemedCount}, stock = ${v.stock}`);
        });
        console.log(`🔍 [GET /my-redeemed/${userId}] ==========================================\n`);

        res.json(redeemedVouchers);
    } catch (error) {
        console.error('❌ Error fetching my redeemed vouchers:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
