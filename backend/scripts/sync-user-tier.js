// Script to sync tierLevel for a specific user
const db = require('../config/database');
const { calculateTierInfo } = require('../utils/tierUtils');

async function syncUserTier(userId) {
    try {
        await db.sequelize.authenticate();
        console.log('✅ Database connected\n');

        const wallet = await db.Wallet.findOne({ where: { userId } });
        if (!wallet) {
            console.log('❌ Wallet not found for user:', userId);
            process.exit(1);
        }

        const totalSpent = parseFloat(wallet.totalSpent?.toString() || '0') || 0;
        const tierInfo = calculateTierInfo(totalSpent);
        const oldTierLevel = wallet.tierLevel;
        const newTierLevel = tierInfo.currentTier.level;

        console.log('📊 Wallet Info:');
        console.log(`   User ID: ${wallet.userId}`);
        console.log(`   Total Spent: ${totalSpent.toLocaleString('vi-VN')} VNĐ`);
        console.log(`   Current tierLevel: ${oldTierLevel}`);
        console.log(`   Correct tierLevel: ${newTierLevel} (${tierInfo.currentTier.name})\n`);

        if (oldTierLevel !== newTierLevel) {
            await wallet.update({ tierLevel: newTierLevel });
            console.log(`✅ Updated tierLevel: ${oldTierLevel} → ${newTierLevel} (${tierInfo.currentTier.name})`);
        } else {
            console.log('✅ Tier already correct');
        }

        await db.sequelize.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

// Get userId from command line argument
const userId = process.argv[2] || 'user-client-hoantuyen';
syncUserTier(userId);

