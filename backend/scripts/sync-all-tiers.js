// Script to sync tierLevel for all wallets
const db = require('../config/database');
const { calculateTierInfo } = require('../utils/tierUtils');

async function syncAllTiers() {
    try {
        await db.sequelize.authenticate();
        console.log('✅ Database connected\n');

        const wallets = await db.Wallet.findAll();
        console.log(`📊 Found ${wallets.length} wallets to check...\n`);

        let updatedCount = 0;
        let skippedCount = 0;
        const updates = [];

        for (const wallet of wallets) {
            const totalSpent = parseFloat(wallet.totalSpent?.toString() || '0') || 0;
            const tierInfo = calculateTierInfo(totalSpent);
            const correctTierLevel = tierInfo.currentTier.level;

            if (wallet.tierLevel !== correctTierLevel) {
                await wallet.update({ tierLevel: correctTierLevel });
                updatedCount++;
                updates.push({
                    userId: wallet.userId,
                    totalSpent: totalSpent,
                    oldTier: wallet.tierLevel,
                    newTier: correctTierLevel,
                    tierName: tierInfo.currentTier.name
                });
                console.log(`✅ [${wallet.userId}] ${totalSpent.toLocaleString('vi-VN')} VNĐ → tierLevel ${wallet.tierLevel} → ${correctTierLevel} (${tierInfo.currentTier.name})`);
            } else {
                skippedCount++;
            }
        }

        console.log(`\n📈 Summary:`);
        console.log(`   Total wallets: ${wallets.length}`);
        console.log(`   Updated: ${updatedCount}`);
        console.log(`   Already correct: ${skippedCount}`);

        if (updates.length > 0) {
            console.log(`\n📋 Updated wallets:`);
            updates.forEach(u => {
                console.log(`   - ${u.userId}: ${u.oldTier} → ${u.newTier} (${u.tierName}) - ${u.totalSpent.toLocaleString('vi-VN')} VNĐ`);
            });
        }

        await db.sequelize.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

syncAllTiers();

