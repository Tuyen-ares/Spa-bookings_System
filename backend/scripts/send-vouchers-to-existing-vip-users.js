/**
 * Script để gửi voucher cho tất cả user VIP hiện tại chưa nhận voucher tháng này
 * Usage: node scripts/send-vouchers-to-existing-vip-users.js
 */

require('dotenv').config({ path: './backend/.env' });
const db = require('../config/database');
const monthlyVoucherService = require('../services/monthlyVoucherService');
const { Op } = require('sequelize');

(async () => {
    try {
        console.log('📁 Loading .env from:', process.env.DOTENV_CONFIG_PATH || './backend/.env');
        console.log('✅ Successfully loaded .env file');
        
        await db.sequelize.authenticate();
        console.log('✅ Database connected\n');

        // Lấy tất cả user VIP (tierLevel >= 1)
        const wallets = await db.Wallet.findAll({
            where: {
                tierLevel: {
                    [Op.gte]: 1 // Tier 1, 2, hoặc 3
                }
            }
        });

        console.log(`📊 Tìm thấy ${wallets.length} wallet VIP\n`);

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

        console.log(`📊 Tìm thấy ${validWallets.length} khách VIP đang active\n`);

        // Thống kê theo tier
        const tierNamesMap = { 1: 'Đồng', 2: 'Bạc', 3: 'Kim cương' };
        const tierStats = {};
        validWallets.forEach(w => {
            const tierName = tierNamesMap[w.tierLevel] || `Tier ${w.tierLevel}`;
            if (!tierStats[tierName]) {
                tierStats[tierName] = { count: 0, level: w.tierLevel, wallets: [] };
            }
            tierStats[tierName].count++;
            tierStats[tierName].wallets.push(w);
        });

        console.log('📊 Phân bổ theo tier:');
        Object.keys(tierStats).forEach(tierName => {
            console.log(`   - Hạng ${tierName} (Level ${tierStats[tierName].level}): ${tierStats[tierName].count} khách`);
        });
        console.log('');

        const results = {
            total: validWallets.length,
            success: 0,
            failed: 0,
            skipped: 0,
            details: []
        };

        // Gửi voucher cho từng user
        for (const wallet of validWallets) {
            const tierName = tierNamesMap[wallet.tierLevel] || `Tier ${wallet.tierLevel}`;
            console.log(`\n📬 [${tierName}] Đang xử lý user ${wallet.userId}...`);
            
            const result = await monthlyVoucherService.sendMonthlyVoucherToUser(
                wallet.userId,
                wallet.tierLevel,
                new Date() // Tháng hiện tại
            );

            if (result.success) {
                results.success++;
                console.log(`   ✅ Thành công: Đã gửi voucher ${result.promotionCode}`);
            } else if (result.message.includes('đã nhận')) {
                results.skipped++;
                console.log(`   ⏭️  Đã nhận rồi: ${result.message}`);
            } else {
                results.failed++;
                console.log(`   ❌ Thất bại: ${result.message}`);
            }

            results.details.push(result);
        }

        console.log('\n\n📊 ==========================================');
        console.log('📊 KẾT QUẢ TỔNG KẾT:');
        console.log('📊 ==========================================');
        console.log(`   📋 Tổng số khách VIP: ${results.total}`);
        console.log(`   ✅ Thành công: ${results.success}`);
        console.log(`   ⏭️  Đã nhận rồi: ${results.skipped}`);
        console.log(`   ❌ Thất bại: ${results.failed}`);
        console.log('📊 ==========================================\n');

        // Chi tiết theo tier
        console.log('📊 Chi tiết theo tier:');
        Object.keys(tierStats).forEach(tierName => {
            const tierWallets = tierStats[tierName].wallets;
            const tierResults = tierWallets.map(w => {
                const detail = results.details.find(d => d.userId === w.userId);
                return detail;
            });
            
            const tierSuccess = tierResults.filter(r => r && r.success).length;
            const tierSkipped = tierResults.filter(r => r && r.message && r.message.includes('đã nhận')).length;
            const tierFailed = tierResults.filter(r => r && !r.success && !r.message.includes('đã nhận')).length;
            
            console.log(`\n   Hạng ${tierName}:`);
            console.log(`      - Tổng: ${tierWallets.length}`);
            console.log(`      - Thành công: ${tierSuccess}`);
            console.log(`      - Đã nhận rồi: ${tierSkipped}`);
            console.log(`      - Thất bại: ${tierFailed}`);
        });

        await db.sequelize.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        await db.sequelize.close();
        process.exit(1);
    }
})();

