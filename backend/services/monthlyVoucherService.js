// backend/services/monthlyVoucherService.js
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');

/**
 * Service để gửi voucher hàng tháng cho khách VIP theo tier
 */
class MonthlyVoucherService {
    /**
     * Lấy promotion template cho tier cụ thể
     * @param {number} tierLevel - Tier level (1, 2, hoặc 3)
     * @returns {Promise<Object|null>} Promotion template hoặc null
     */
    async getTierPromotionTemplate(tierLevel) {
        const targetAudience = `Tier Level ${tierLevel}`;

        // Tìm promotion template cho tier này (chỉ lấy voucher active)
        // Với logic mới, chỉ có 1 voucher active cho mỗi tier
        // Note: Promotion model không có timestamps, nên không có createdAt
        // Sử dụng id để order (id mới hơn thường có thứ tự lớn hơn)
        const promotion = await db.Promotion.findOne({
            where: {
                targetAudience: targetAudience,
                isActive: true,
            },
            order: [['id', 'DESC']] // Lấy promotion mới nhất dựa trên id
        });

        if (!promotion) {
            console.log(`⚠️ [Monthly Voucher] No active voucher found for Tier Level ${tierLevel}`);
        } else {
            console.log(`✅ [Monthly Voucher] Found active voucher for Tier Level ${tierLevel}: ${promotion.title} (${promotion.code})`);
        }

        return promotion;
    }

    /**
     * Kiểm tra xem user đã nhận voucher tháng này chưa
     * @param {string} userId - User ID
     * @param {string} promotionId - Promotion ID
     * @param {Date} currentMonth - Tháng hiện tại (đầu tháng)
     * @returns {Promise<boolean>} true nếu đã nhận, false nếu chưa
     */
    async hasReceivedVoucherThisMonth(userId, promotionId, currentMonth) {
        const startOfMonth = new Date(currentMonth);
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const endOfMonth = new Date(currentMonth);
        endOfMonth.setMonth(endOfMonth.getMonth() + 1);
        endOfMonth.setDate(0); // Ngày cuối cùng của tháng
        endOfMonth.setHours(23, 59, 59, 999);

        // console.log(`   🔍 [Check Received] Checking if user ${userId} received promotion ${promotionId} this month`);
        // console.log(`      Month range: ${startOfMonth.toISOString()} to ${endOfMonth.toISOString()}`);

        // Kiểm tra xem có PromotionUsage nào được tạo trong tháng này không
        const existingUsage = await db.PromotionUsage.findOne({
            where: {
                userId: userId,
                promotionId: promotionId,
                usedAt: {
                    [Op.between]: [startOfMonth, endOfMonth]
                }
            }
        });

        // if (existingUsage) {
        //     console.log(`   ⚠️ [Check Received] User đã nhận voucher này trong tháng này (usedAt: ${existingUsage.usedAt})`);
        // } else {
        //     console.log(`   ✅ [Check Received] User chưa nhận voucher này trong tháng này`);
        // }

        return !!existingUsage;
    }

    /**
     * Gửi voucher hàng tháng cho user
     * @param {string} userId - User ID
     * @param {number} tierLevel - Tier level của user
     * @param {Date} currentMonth - Tháng hiện tại
     * @returns {Promise<Object>} Kết quả gửi voucher
     */
    async sendMonthlyVoucherToUser(userId, tierLevel, currentMonth = new Date()) {
        try {
            const tierNames = { 1: 'Đồng', 2: 'Bạc', 3: 'Kim cương' };
            const tierName = tierNames[tierLevel] || `Tier ${tierLevel}`;

            // console.log(`\n🔍 [Send Voucher] Bắt đầu gửi voucher cho user ${userId}, Tier Level ${tierLevel} (${tierName})`);

            // Lấy promotion template cho tier này
            const promotion = await this.getTierPromotionTemplate(tierLevel);

            if (!promotion) {
                // console.log(`   ❌ [Send Voucher] Không tìm thấy voucher template cho Tier Level ${tierLevel} (${tierName})`);
                // console.log(`   💡 [Hint] Cần tạo voucher với targetAudience = "Tier Level ${tierLevel}" trong admin panel`);
                return {
                    success: false,
                    message: `Không tìm thấy voucher template cho Tier Level ${tierLevel} (${tierName}). Vui lòng tạo voucher cho hạng này trong admin panel.`,
                    userId,
                    tierLevel,
                    tierName
                };
            }

            // console.log(`   ✅ [Send Voucher] Tìm thấy voucher: ${promotion.title} (${promotion.code})`);

            // Kiểm tra xem đã nhận voucher tháng này chưa
            const hasReceived = await this.hasReceivedVoucherThisMonth(userId, promotion.id, currentMonth);

            if (hasReceived) {
                // console.log(`   ⏭️ [Send Voucher] User ${userId} đã nhận voucher ${promotion.code} tháng này rồi, bỏ qua`);
                return {
                    success: false,
                    message: `User đã nhận voucher tháng này rồi`,
                    userId,
                    tierLevel,
                    promotionId: promotion.id
                };
            }

            // Kiểm tra voucher còn hạn không
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const expiryDate = new Date(promotion.expiryDate);
            expiryDate.setHours(0, 0, 0, 0);

            if (today > expiryDate) {
                return {
                    success: false,
                    message: `Voucher đã hết hạn`,
                    userId,
                    tierLevel,
                    promotionId: promotion.id
                };
            }

            // Tạo PromotionUsage (voucher chưa dùng, appointmentId = null)
            const promotionUsage = await db.PromotionUsage.create({
                id: `promo-usage-${uuidv4()}`,
                userId: userId,
                promotionId: promotion.id,
                appointmentId: null, // Chưa dùng
                serviceId: null,
                usedAt: new Date() // Thời điểm nhận voucher
            });

            // Tạo notification để thông báo cho user
            const user = await db.User.findByPk(userId);

            // Format discount value
            let discountText = '';
            if (promotion.discountType === 'percentage') {
                discountText = `Giảm ${promotion.discountValue}%`;
            } else {
                discountText = `Giảm ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(promotion.discountValue)}`;
            }

            await db.Notification.create({
                id: `notif-${uuidv4()}`,
                userId: userId,
                type: 'promotion',
                title: `🎁 Nhận voucher VIP hạng ${tierName} hàng tháng!`,
                message: `Chúc mừng! Bạn đã nhận voucher VIP hạng ${tierName} tháng này: "${promotion.title}" (${discountText}). Mã voucher: ${promotion.code}. Voucher có giá trị đến ${new Date(promotion.expiryDate).toLocaleDateString('vi-VN')}. Hãy sử dụng ngay!`,
                relatedId: promotion.id,
                sentVia: 'app',
                isRead: false,
                emailSent: false,
                createdAt: new Date()
            });

            console.log(`   📬 [Notification] Đã tạo thông báo cho user ${userId} (${user?.fullName || 'N/A'}) - Voucher hạng ${tierName}`);

            console.log(`   ✅ [Send Voucher] Đã gửi voucher ${promotion.code} cho user ${userId} (Tier Level ${tierLevel} - ${tierName})`);

            return {
                success: true,
                message: `Đã gửi voucher thành công`,
                userId,
                tierLevel,
                promotionId: promotion.id,
                promotionCode: promotion.code,
                promotionUsageId: promotionUsage.id
            };
        } catch (error) {
            console.error(`❌ [Monthly Voucher] Lỗi khi gửi voucher cho user ${userId}:`, error);
            return {
                success: false,
                message: `Lỗi: ${error.message}`,
                userId,
                tierLevel,
                error: error.message
            };
        }
    }

    /**
     * Gửi voucher hàng tháng cho tất cả khách VIP
     * @param {Date} currentMonth - Tháng hiện tại (mặc định là tháng hiện tại)
     * @returns {Promise<Object>} Kết quả gửi voucher
     */
    async sendMonthlyVouchersToAllVIPUsers(currentMonth = new Date()) {
        try {
            console.log(`\n📅 [Monthly Voucher] Bắt đầu gửi voucher hàng tháng cho khách VIP...`);
            console.log(`   Tháng: ${currentMonth.getMonth() + 1}/${currentMonth.getFullYear()}`);

            // Lấy tất cả user có tierLevel >= 1 (VIP)
            // Lấy wallets trước, sau đó filter users
            const wallets = await db.Wallet.findAll({
                where: {
                    tierLevel: {
                        [Op.gte]: 1 // Tier 1, 2, hoặc 3
                    }
                }
            });

            // Lấy user IDs và filter active clients
            const walletUserIds = wallets.map(w => w.userId);
            const activeClients = await db.User.findAll({
                where: {
                    id: {
                        [Op.in]: walletUserIds
                    },
                    role: 'Client',
                    status: 'Active'
                }
            });

            const activeClientIds = new Set(activeClients.map(u => u.id));
            const validWallets = wallets.filter(w => activeClientIds.has(w.userId));

            console.log(`   Tìm thấy ${validWallets.length} khách VIP`);

            // Thống kê theo tier
            const tierNamesMap = { 1: 'Đồng', 2: 'Bạc', 3: 'Kim cương' };
            const tierStats = {};
            validWallets.forEach(w => {
                const tierName = tierNamesMap[w.tierLevel] || `Tier ${w.tierLevel}`;
                if (!tierStats[tierName]) {
                    tierStats[tierName] = { count: 0, level: w.tierLevel };
                }
                tierStats[tierName].count++;
            });
            console.log(`   📊 Phân bổ theo tier:`);
            Object.keys(tierStats).forEach(tierName => {
                console.log(`      - Hạng ${tierName} (Level ${tierStats[tierName].level}): ${tierStats[tierName].count} khách`);
            });

            const results = {
                total: validWallets.length,
                success: 0,
                failed: 0,
                skipped: 0,
                details: [],
                tierStats: tierStats
            };

            // Gửi voucher cho từng user
            for (const wallet of validWallets) {
                const result = await this.sendMonthlyVoucherToUser(
                    wallet.userId,
                    wallet.tierLevel,
                    currentMonth
                );

                if (result.success) {
                    results.success++;
                } else if (result.message.includes('đã nhận')) {
                    results.skipped++;
                } else {
                    results.failed++;
                }

                results.details.push(result);
            }

            console.log(`\n📊 [Monthly Voucher] Kết quả:`);
            console.log(`   ✅ Thành công: ${results.success}`);
            console.log(`   ⏭️  Đã nhận rồi: ${results.skipped}`);
            console.log(`   ❌ Thất bại: ${results.failed}`);
            console.log(`   📋 Tổng cộng: ${results.total}\n`);

            return results;
        } catch (error) {
            console.error(`❌ [Monthly Voucher] Lỗi khi gửi voucher cho tất cả VIP:`, error);
            throw error;
        }
    }
}

module.exports = new MonthlyVoucherService();

