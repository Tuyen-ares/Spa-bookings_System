'use strict';
const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Hash password
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    // Lấy ngày hôm nay (format YYYY-MM-DD)
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    
    // Tạo user với birthday là hôm nay
    const diamondClient = {
      id: 'user-diamond-birthday',
      name: 'Nguyễn Kim Cương',
      email: 'diamond.birthday@spa.vn',
      password: hashedPassword,
      phone: '0909998888',
      profilePictureUrl: 'https://picsum.photos/seed/DIAMOND/200',
      joinDate: todayStr,
      birthday: todayStr, // Sinh nhật hôm nay
      gender: 'Nữ',
      role: 'Client',
      status: 'Active',
      isEmailVerified: true,
      emailVerificationToken: null,
      lastLogin: null,
    };

    // Tạo wallet với totalSpent >= 50 triệu để đạt hạng kim cương (tierLevel = 3)
    // Theo tierUtils.js: Kim cương cần >= 50,000,000 VND
    const diamondWallet = {
      id: 'wallet-diamond-birthday',
      userId: 'user-diamond-birthday',
      points: 60000, // Điểm tương ứng với 60 triệu
      tierLevel: 3, // Hạng kim cương
      totalSpent: 60000000.00, // 60 triệu VND (vượt mức 50 triệu để đạt kim cương)
      lastUpdated: new Date(),
    };

    // Insert user
    await queryInterface.bulkInsert('users', [diamondClient], {});
    
    // Insert wallet
    await queryInterface.bulkInsert('wallets', [diamondWallet], {});
    
    console.log(`✅ Đã tạo user kim cương với birthday hôm nay (${todayStr}):`);
    console.log(`   - Email: ${diamondClient.email}`);
    console.log(`   - Password: 123456`);
    console.log(`   - Birthday: ${diamondClient.birthday}`);
    console.log(`   - Total Spent: ${diamondWallet.totalSpent.toLocaleString('vi-VN')} VND`);
    console.log(`   - Tier Level: ${diamondWallet.tierLevel} (Kim cương)`);
  },

  async down(queryInterface, Sequelize) {
    // Xóa wallet trước
    await queryInterface.bulkDelete('wallets', {
      userId: 'user-diamond-birthday'
    }, {});
    
    // Xóa user
    await queryInterface.bulkDelete('users', {
      id: 'user-diamond-birthday'
    }, {});
  }
};

