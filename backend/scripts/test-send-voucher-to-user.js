/**
 * Script để test gửi voucher cho user cụ thể
 * Usage: node scripts/test-send-voucher-to-user.js <userId>
 */

require('dotenv').config({ path: './backend/.env' });
const db = require('../config/database');
const monthlyVoucherService = require('../services/monthlyVoucherService');

const userId = process.argv[2]; // Get userId from command line argument

if (!userId) {
    console.error('❌ Usage: node scripts/test-send-voucher-to-user.js <userId>');
    process.exit(1);
}

(async () => {
    try {
        console.log('📁 Loading .env from:', process.env.DOTENV_CONFIG_PATH || './backend/.env');
        console.log('✅ Successfully loaded .env file');
        
        await db.sequelize.authenticate();
        console.log('✅ Database connected\n');

        // Lấy thông tin user và wallet
        const user = await db.User.findByPk(userId);
        if (!user) {
            console.error(`❌ User không tồn tại: ${userId}`);
            await db.sequelize.close();
            process.exit(1);
        }

        const wallet = await db.Wallet.findOne({ where: { userId } });
        if (!wallet) {
            console.error(`❌ Wallet không tồn tại cho user: ${userId}`);
            await db.sequelize.close();
            process.exit(1);
        }

        console.log('📊 Thông tin User:');
        console.log(`   - ID: ${user.id}`);
        console.log(`   - Tên: ${user.fullName || user.name}`);
        console.log(`   - Email: ${user.email}`);
        console.log(`   - Role: ${user.role}`);
        console.log(`   - Status: ${user.status}`);
        console.log('\n📊 Thông tin Wallet:');
        console.log(`   - Tier Level: ${wallet.tierLevel}`);
        console.log(`   - Total Spent: ${parseFloat(wallet.totalSpent || 0).toLocaleString('vi-VN')} VNĐ`);
        console.log(`   - Points: ${wallet.points || 0}`);

        if (wallet.tierLevel < 1) {
            console.error(`\n❌ User không thuộc tier VIP (tierLevel: ${wallet.tierLevel})`);
            console.log('   Chỉ có tierLevel >= 1 (Đồng, Bạc, Kim cương) mới được gửi voucher VIP');
            await db.sequelize.close();
            process.exit(1);
        }

        const tierNames = { 1: 'Đồng', 2: 'Bạc', 3: 'Kim cương' };
        const tierName = tierNames[wallet.tierLevel] || `Tier ${wallet.tierLevel}`;
        console.log(`\n✅ User thuộc hạng: ${tierName} (Tier Level ${wallet.tierLevel})`);

        // Kiểm tra voucher template
        console.log(`\n🔍 Kiểm tra voucher template cho Tier Level ${wallet.tierLevel}...`);
        const promotion = await monthlyVoucherService.getTierPromotionTemplate(wallet.tierLevel);
        
        if (!promotion) {
            console.error(`\n❌ Không tìm thấy voucher template cho Tier Level ${wallet.tierLevel}`);
            console.log('   Vui lòng tạo voucher với targetAudience = "Tier Level ' + wallet.tierLevel + '" trong admin panel');
            await db.sequelize.close();
            process.exit(1);
        }

        console.log(`✅ Tìm thấy voucher: ${promotion.title} (${promotion.code})`);
        console.log(`   - Discount: ${promotion.discountType === 'percentage' ? promotion.discountValue + '%' : promotion.discountValue.toLocaleString('vi-VN') + ' VNĐ'}`);
        console.log(`   - Min Order: ${promotion.minOrderValue ? promotion.minOrderValue.toLocaleString('vi-VN') + ' VNĐ' : 'Không có'}`);
        console.log(`   - Expiry Date: ${promotion.expiryDate}`);

        // Gửi voucher
        console.log(`\n📬 Bắt đầu gửi voucher cho user ${userId}...`);
        const result = await monthlyVoucherService.sendMonthlyVoucherToUser(
            userId,
            wallet.tierLevel,
            new Date() // Tháng hiện tại
        );

        console.log('\n📊 Kết quả:');
        if (result.success) {
            console.log('✅ Gửi voucher thành công!');
            console.log(`   - Promotion ID: ${result.promotionId}`);
            console.log(`   - Promotion Code: ${result.promotionCode}`);
            console.log(`   - Promotion Usage ID: ${result.promotionUsageId}`);
        } else {
            console.log('❌ Gửi voucher thất bại:');
            console.log(`   - Lý do: ${result.message}`);
            if (result.error) {
                console.log(`   - Error: ${result.error}`);
            }
        }

        await db.sequelize.close();
        process.exit(result.success ? 0 : 1);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        await db.sequelize.close();
        process.exit(1);
    }
})();

