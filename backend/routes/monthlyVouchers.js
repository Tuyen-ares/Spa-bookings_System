// backend/routes/monthlyVouchers.js
const express = require('express');
const router = express.Router();
const monthlyVoucherService = require('../services/monthlyVoucherService');

// Logging middleware for debugging
router.use((req, res, next) => {
    console.log(`\n📥 [Monthly Vouchers Route] ${req.method} ${req.path}`);
    console.log(`   Query:`, req.query);
    console.log(`   Params:`, req.params);
    next();
});

/**
 * POST /api/monthly-vouchers/send
 * Gửi voucher hàng tháng cho tất cả khách VIP (Admin only)
 * Body: { month?: string } - Optional: "YYYY-MM" format, mặc định là tháng hiện tại
 */
router.post('/send', async (req, res) => {
    try {
        const { month } = req.body;
        
        let currentMonth = new Date();
        if (month) {
            // Parse month string (YYYY-MM)
            const [year, monthNum] = month.split('-').map(Number);
            if (year && monthNum && monthNum >= 1 && monthNum <= 12) {
                currentMonth = new Date(year, monthNum - 1, 1);
            } else {
                return res.status(400).json({ 
                    message: 'Định dạng tháng không hợp lệ. Sử dụng format: YYYY-MM (ví dụ: 2025-01)' 
                });
            }
        }

        const results = await monthlyVoucherService.sendMonthlyVouchersToAllVIPUsers(currentMonth);
        
        res.json({
            success: true,
            message: `Đã xử lý ${results.total} khách VIP`,
            results: results
        });
    } catch (error) {
        console.error('Error sending monthly vouchers:', error);
        res.status(500).json({ 
            message: 'Lỗi khi gửi voucher hàng tháng',
            error: error.message 
        });
    }
});

/**
 * POST /api/monthly-vouchers/send/:userId
 * Gửi voucher hàng tháng cho 1 user cụ thể (Admin only)
 */
router.post('/send/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { month } = req.body;
        
        // Lấy wallet để biết tierLevel
        const db = require('../config/database');
        const wallet = await db.Wallet.findOne({ where: { userId } });
        
        if (!wallet) {
            return res.status(404).json({ message: 'Không tìm thấy wallet của user' });
        }

        if (wallet.tierLevel < 1) {
            return res.status(400).json({ 
                message: `User không thuộc tier VIP (tierLevel: ${wallet.tierLevel})` 
            });
        }

        let currentMonth = new Date();
        if (month) {
            const [year, monthNum] = month.split('-').map(Number);
            if (year && monthNum && monthNum >= 1 && monthNum <= 12) {
                currentMonth = new Date(year, monthNum - 1, 1);
            }
        }

        const result = await monthlyVoucherService.sendMonthlyVoucherToUser(
            userId,
            wallet.tierLevel,
            currentMonth
        );

        if (result.success) {
            res.json({
                success: true,
                message: result.message,
                data: result
            });
        } else {
            res.status(400).json({
                success: false,
                message: result.message,
                data: result
            });
        }
    } catch (error) {
        console.error('Error sending monthly voucher to user:', error);
        res.status(500).json({ 
            message: 'Lỗi khi gửi voucher',
            error: error.message 
        });
    }
});

/**
 * POST /api/monthly-vouchers/send-tier/:tierLevel
 * Gửi voucher hàng tháng cho tất cả user ở tier cụ thể (Admin only)
 */
router.post('/send-tier/:tierLevel', async (req, res) => {
    console.log(`\n📬 [POST /send-tier/:tierLevel] Received request`);
    console.log(`   Params:`, req.params);
    console.log(`   Body:`, req.body);
    try {
        const { tierLevel } = req.params;
        const { month } = req.body;
        const tierLevelNum = parseInt(tierLevel);
        
        console.log(`   Parsed tierLevel: ${tierLevel} → ${tierLevelNum}`);
        
        if (isNaN(tierLevelNum) || tierLevelNum < 1 || tierLevelNum > 3) {
            return res.status(400).json({ 
                message: 'Tier level không hợp lệ. Phải là 1, 2, hoặc 3' 
            });
        }

        let currentMonth = new Date();
        if (month) {
            const [year, monthNum] = month.split('-').map(Number);
            if (year && monthNum && monthNum >= 1 && monthNum <= 12) {
                currentMonth = new Date(year, monthNum - 1, 1);
            }
        }

        const db = require('../config/database');
        const { Op } = require('sequelize');

        // Lấy tất cả user có tierLevel = tierLevelNum
        const wallets = await db.Wallet.findAll({
            where: {
                tierLevel: tierLevelNum
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

        const results = {
            total: validWallets.length,
            success: 0,
            failed: 0,
            skipped: 0,
            details: []
        };

        // Gửi voucher cho từng user
        for (const wallet of validWallets) {
            const result = await monthlyVoucherService.sendMonthlyVoucherToUser(
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

        const tierNames = { 1: 'Đồng', 2: 'Bạc', 3: 'Kim cương' };
        const tierName = tierNames[tierLevelNum] || `Tier ${tierLevelNum}`;

        res.json({
            success: true,
            message: `Đã xử lý ${results.total} khách hạng ${tierName}`,
            tierLevel: tierLevelNum,
            tierName: tierName,
            results: results
        });
    } catch (error) {
        console.error('Error sending monthly vouchers to tier:', error);
        res.status(500).json({ 
            message: 'Lỗi khi gửi voucher hàng tháng cho tier',
            error: error.message 
        });
    }
});

/**
 * GET /api/monthly-vouchers/status
 * Kiểm tra trạng thái gửi voucher tháng này
 */
router.get('/status', async (req, res) => {
    try {
        const { month } = req.query;
        
        let currentMonth = new Date();
        if (month) {
            const [year, monthNum] = month.split('-').map(Number);
            if (year && monthNum && monthNum >= 1 && monthNum <= 12) {
                currentMonth = new Date(year, monthNum - 1, 1);
            }
        }

        const db = require('../config/database');
        const { Op } = require('sequelize');

        const startOfMonth = new Date(currentMonth);
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        
        const endOfMonth = new Date(currentMonth);
        endOfMonth.setMonth(endOfMonth.getMonth() + 1);
        endOfMonth.setDate(0);
        endOfMonth.setHours(23, 59, 59, 999);

        // Đếm số lượng voucher đã gửi trong tháng này
        const sentCount = await db.PromotionUsage.count({
            where: {
                appointmentId: null, // Chưa dùng
                usedAt: {
                    [Op.between]: [startOfMonth, endOfMonth]
                }
            },
            include: [{
                model: db.Promotion,
                where: {
                    targetAudience: {
                        [Op.in]: ['Tier Level 1', 'Tier Level 2', 'Tier Level 3']
                    }
                },
                required: true
            }]
        });

        // Đếm tổng số khách VIP
        const wallets = await db.Wallet.findAll({
            where: {
                tierLevel: {
                    [Op.gte]: 1
                }
            }
        });
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
        const totalVIP = activeClients.length;

        res.json({
            month: `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`,
            totalVIP: totalVIP,
            sentCount: sentCount,
            remaining: totalVIP - sentCount
        });
    } catch (error) {
        console.error('Error getting monthly voucher status:', error);
        res.status(500).json({ 
            message: 'Lỗi khi lấy trạng thái',
            error: error.message 
        });
    }
});

/**
 * GET /api/monthly-vouchers/test-cron
 * Test endpoint để trigger cron job ngay lập tức (chỉ dùng để test, không dùng trong production)
 */
router.get('/test-cron', async (req, res) => {
    try {
        console.log('\n🧪 [TEST] Manual trigger of monthly voucher distribution...');
        const results = await monthlyVoucherService.sendMonthlyVouchersToAllVIPUsers();
        res.json({
            success: true,
            message: 'Test cron job completed',
            results: results
        });
    } catch (error) {
        console.error('❌ [TEST] Error in test cron:', error);
        res.status(500).json({ 
            message: 'Error testing cron job',
            error: error.message 
        });
    }
});

module.exports = router;

