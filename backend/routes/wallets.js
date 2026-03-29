
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
// Always returns fresh data from database and auto-syncs tierLevel if needed
router.get('/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        // Use reload: true to ensure we get fresh data from database
        let wallet = await db.Wallet.findOne({
            where: { userId },
            // Force fresh query (no cache)
            raw: false
        });

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
                tierLevel: 0, // Default: Thành viên (level 0)
                totalSpent: 0.00
            });
            res.status(201).json(wallet);
        } else {
            // Reload to ensure we have the latest data from database
            await wallet.reload();

            // Auto-sync tierLevel nếu không khớp với totalSpent (fix khi sửa trực tiếp trong DB)
            const { calculateTierInfo } = require('../utils/tierUtils');
            const totalSpent = parseFloat(wallet.totalSpent?.toString() || '0') || 0;
            const tierInfo = calculateTierInfo(totalSpent);
            const correctTierLevel = tierInfo.currentTier.level;

            // Nếu tierLevel không khớp với totalSpent, tự động sync lại
            if (wallet.tierLevel !== correctTierLevel) {
                console.log(`🔄 [GET Wallet] Auto-syncing tierLevel: userId=${userId}, totalSpent=${totalSpent}, oldTierLevel=${wallet.tierLevel} → newTierLevel=${correctTierLevel} (${tierInfo.currentTier.name})`);
                await wallet.update({ tierLevel: correctTierLevel }, {
                    // Skip hook để tránh loop, vì chúng ta đã tính toán đúng rồi
                    hooks: false
                });
                // Reload lại để có giá trị mới
                await wallet.reload();
            }

            // Tự động kiểm tra và gửi voucher VIP nếu user chưa nhận voucher tháng này
            // Chỉ kiểm tra nếu user là VIP (tierLevel >= 1)
            if (wallet.tierLevel >= 1) {
                try {
                    const monthlyVoucherService = require('../services/monthlyVoucherService');

                    // Kiểm tra xem user đã nhận voucher tháng này chưa (async, không block response)
                    // Gửi voucher trong background để không làm chậm response
                    setImmediate(async () => {
                        try {
                            const result = await monthlyVoucherService.sendMonthlyVoucherToUser(
                                wallet.userId,
                                wallet.tierLevel,
                                new Date() // Tháng hiện tại
                            );

                            // if (result.success) {
                            //     console.log(`✅ [GET Wallet] Đã tự động gửi voucher cho user ${wallet.userId} (Tier Level ${wallet.tierLevel})`);
                            // } else if (result.message && result.message.includes('đã nhận')) {
                            //     // User đã nhận voucher rồi, không cần làm gì
                            //     console.log(`ℹ️ [GET Wallet] User ${wallet.userId} đã nhận voucher tháng này rồi`);
                            // } else {
                            //     // Có thể không có voucher template hoặc lỗi khác
                            //     console.log(`⚠️ [GET Wallet] Không thể gửi voucher cho user ${wallet.userId}: ${result.message || 'Unknown error'}`);
                            // }
                        } catch (error) {
                            // Không throw error để không ảnh hưởng đến response
                            console.error(`❌ [GET Wallet] Lỗi khi tự động gửi voucher cho user ${wallet.userId}:`, error.message);
                        }
                    });
                } catch (error) {
                    // Không throw error để không ảnh hưởng đến response
                    console.error(`❌ [GET Wallet] Lỗi khi load monthlyVoucherService:`, error.message);
                }
            }

            // Đảm bảo trả về đầy đủ các field, bao gồm tierLevel
            const walletData = wallet.toJSON();
            // Explicitly include tierLevel in response
            res.json({
                id: walletData.id,
                userId: walletData.userId,
                points: walletData.points,
                tierLevel: walletData.tierLevel !== undefined ? walletData.tierLevel : wallet.tierLevel,
                totalSpent: walletData.totalSpent,
                lastUpdated: walletData.lastUpdated
            });
        }
    } catch (error) {
        console.error('Error fetching or creating wallet:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// PUT /api/wallets/:userId - Update user's wallet (points, totalSpent)
// Note: tierLevel sẽ tự động được sync khi totalSpent thay đổi (qua model hook)
router.put('/:userId', async (req, res) => {
    const { userId } = req.params;
    const updatedWalletData = req.body; // e.g., { points: 1500, totalSpent: 500000 }

    try {
        const wallet = await db.Wallet.findOne({ where: { userId } });
        if (!wallet) {
            return res.status(404).json({ message: 'Wallet not found for this user.' });
        }

        // Nếu totalSpent được update, đảm bảo tierLevel được sync
        if (updatedWalletData.totalSpent !== undefined) {
            const { calculateTierInfo } = require('../utils/tierUtils');
            const newTotalSpent = parseFloat(updatedWalletData.totalSpent) || 0;
            const tierInfo = calculateTierInfo(newTotalSpent);
            updatedWalletData.tierLevel = tierInfo.currentTier.level;

            console.log(`🔄 [PUT Wallet] Syncing tierLevel: totalSpent=${newTotalSpent} → tierLevel=${tierInfo.currentTier.level} (${tierInfo.currentTier.name})`);
        }

        await wallet.update(updatedWalletData);

        res.json(wallet);
    } catch (error) {
        console.error('Error updating wallet:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/wallets/:userId/points-history - Get user's points history from payments
// Calculate points from completed payments: 1000 VND = 1 point
router.get('/:userId/points-history', async (req, res) => {
    const { userId } = req.params;
    try {
        const wallet = await db.Wallet.findOne({ where: { userId } });
        if (!wallet) {
            return res.status(404).json({ message: 'Wallet not found' });
        }

        // Get all completed payments for this user
        const payments = await db.Payment.findAll({
            where: {
                userId: userId,
                status: 'Completed'
            },
            include: [{
                model: db.Appointment,
                as: 'Appointment',
                attributes: ['id', 'serviceName', 'serviceId'],
                required: false
            }],
            order: [['date', 'DESC']]
        });

        // Convert payments to points history entries
        // 1000 VND = 1 point
        const pointsHistory = payments.map(payment => {
            const amount = parseFloat(payment.amount) || 0;
            const pointsEarned = Math.floor(amount / 1000);
            const serviceName = payment.serviceName || payment.Appointment?.serviceName || 'Dịch vụ';

            return {
                date: payment.date.toISOString().split('T')[0],
                pointsChange: pointsEarned,
                type: 'earned',
                source: 'payment',
                description: `Thanh toán ${serviceName}: +${pointsEarned} điểm (${amount.toLocaleString('vi-VN')} VNĐ)`
            };
        });

        res.json(pointsHistory);
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

// POST /api/wallets/sync-all-tiers - Sync tierLevel cho tất cả wallets dựa trên totalSpent hiện tại
// Utility endpoint để fix các wallets có tierLevel không đồng bộ
router.post('/sync-all-tiers', async (req, res) => {
    try {
        const { calculateTierInfo } = require('../utils/tierUtils');
        const wallets = await db.Wallet.findAll();

        let updatedCount = 0;
        let skippedCount = 0;

        for (const wallet of wallets) {
            const totalSpent = parseFloat(wallet.totalSpent?.toString() || '0') || 0;
            const tierInfo = calculateTierInfo(totalSpent);
            const correctTierLevel = tierInfo.currentTier.level;

            // Chỉ update nếu tierLevel không đúng
            if (wallet.tierLevel !== correctTierLevel) {
                await wallet.update({ tierLevel: correctTierLevel });
                updatedCount++;
                console.log(`✅ [Sync Tiers] Wallet ${wallet.userId}: totalSpent=${totalSpent} → tierLevel ${wallet.tierLevel} → ${correctTierLevel} (${tierInfo.currentTier.name})`);
            } else {
                skippedCount++;
            }
        }

        res.json({
            message: 'Tier sync completed',
            total: wallets.length,
            updated: updatedCount,
            skipped: skippedCount
        });
    } catch (error) {
        console.error('Error syncing tiers:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/wallets/:userId/sync-tier - Sync tierLevel cho một wallet cụ thể
router.post('/:userId/sync-tier', async (req, res) => {
    const { userId } = req.params;
    try {
        const wallet = await db.Wallet.findOne({ where: { userId } });
        if (!wallet) {
            return res.status(404).json({ message: 'Wallet not found' });
        }

        const { calculateTierInfo } = require('../utils/tierUtils');
        const totalSpent = parseFloat(wallet.totalSpent?.toString() || '0') || 0;
        const tierInfo = calculateTierInfo(totalSpent);
        const oldTierLevel = wallet.tierLevel;
        const newTierLevel = tierInfo.currentTier.level;

        if (oldTierLevel !== newTierLevel) {
            await wallet.update({ tierLevel: newTierLevel });
            res.json({
                message: 'Tier synced successfully',
                wallet: wallet,
                oldTierLevel: oldTierLevel,
                newTierLevel: newTierLevel,
                tierName: tierInfo.currentTier.name
            });
        } else {
            res.json({
                message: 'Tier already in sync',
                wallet: wallet,
                tierLevel: oldTierLevel,
                tierName: tierInfo.currentTier.name
            });
        }
    } catch (error) {
        console.error('Error syncing tier:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;