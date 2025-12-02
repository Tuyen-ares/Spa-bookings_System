'use strict';
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Hash password
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    // Lấy ngày hôm nay (format YYYY-MM-DD)
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    
    // Danh sách 6 tài khoản client
    const clients = [
      {
        id: `user-diamond-birthday-1`,
        name: 'Trần Kim Cương',
        email: 'diamond1.birthday@spa.vn',
        password: hashedPassword,
        phone: '0901111111',
        profilePictureUrl: 'https://picsum.photos/seed/DIAMOND1/200',
        joinDate: todayStr,
        birthday: todayStr,
        gender: 'Nữ',
        role: 'Client',
        status: 'Active',
        isEmailVerified: true,
        emailVerificationToken: null,
        lastLogin: null,
      },
      {
        id: `user-diamond-birthday-2`,
        name: 'Lê Ngọc Kim',
        email: 'diamond2.birthday@spa.vn',
        password: hashedPassword,
        phone: '0902222222',
        profilePictureUrl: 'https://picsum.photos/seed/DIAMOND2/200',
        joinDate: todayStr,
        birthday: todayStr,
        gender: 'Nam',
        role: 'Client',
        status: 'Active',
        isEmailVerified: true,
        emailVerificationToken: null,
        lastLogin: null,
      },
      {
        id: `user-diamond-birthday-3`,
        name: 'Phạm Quý Bảo',
        email: 'diamond3.birthday@spa.vn',
        password: hashedPassword,
        phone: '0903333333',
        profilePictureUrl: 'https://picsum.photos/seed/DIAMOND3/200',
        joinDate: todayStr,
        birthday: todayStr,
        gender: 'Nữ',
        role: 'Client',
        status: 'Active',
        isEmailVerified: true,
        emailVerificationToken: null,
        lastLogin: null,
      },
      {
        id: `user-diamond-birthday-4`,
        name: 'Hoàng Thành Đạt',
        email: 'diamond4.birthday@spa.vn',
        password: hashedPassword,
        phone: '0904444444',
        profilePictureUrl: 'https://picsum.photos/seed/DIAMOND4/200',
        joinDate: todayStr,
        birthday: todayStr,
        gender: 'Nam',
        role: 'Client',
        status: 'Active',
        isEmailVerified: true,
        emailVerificationToken: null,
        lastLogin: null,
      },
      {
        id: `user-diamond-birthday-5`,
        name: 'Võ Minh Châu',
        email: 'diamond5.birthday@spa.vn',
        password: hashedPassword,
        phone: '0905555555',
        profilePictureUrl: 'https://picsum.photos/seed/DIAMOND5/200',
        joinDate: todayStr,
        birthday: todayStr,
        gender: 'Nữ',
        role: 'Client',
        status: 'Active',
        isEmailVerified: true,
        emailVerificationToken: null,
        lastLogin: null,
      },
      {
        id: `user-diamond-birthday-6`,
        name: 'Đặng Thanh Tùng',
        email: 'diamond6.birthday@spa.vn',
        password: hashedPassword,
        phone: '0906666666',
        profilePictureUrl: 'https://picsum.photos/seed/DIAMOND6/200',
        joinDate: todayStr,
        birthday: todayStr,
        gender: 'Nam',
        role: 'Client',
        status: 'Active',
        isEmailVerified: true,
        emailVerificationToken: null,
        lastLogin: null,
      },
    ];

    // Tạo wallets với totalSpent >= 50 triệu để đạt hạng kim cương (tierLevel = 3)
    // Theo tierUtils.js: Kim cương cần >= 50,000,000 VND
    const wallets = clients.map((client, index) => {
      const totalSpent = 55000000 + (index * 1000000); // Từ 55 triệu đến 60 triệu
      return {
        id: `wallet-${client.id}`,
        userId: client.id,
        points: Math.floor(totalSpent / 1000), // 1 point per 1000 VND
        tierLevel: 3, // Hạng kim cương
        totalSpent: totalSpent,
        lastUpdated: new Date(),
      };
    });

    // Insert users
    await queryInterface.bulkInsert('users', clients, {});
    
    // Insert wallets
    await queryInterface.bulkInsert('wallets', wallets, {});
    
    console.log(`\n✅ Đã tạo 6 user kim cương với birthday hôm nay (${todayStr}):`);
    clients.forEach((client, index) => {
      console.log(`\n   [${index + 1}] ${client.name}:`);
      console.log(`      - Email: ${client.email}`);
      console.log(`      - Password: 123456`);
      console.log(`      - Birthday: ${client.birthday}`);
      console.log(`      - Total Spent: ${wallets[index].totalSpent.toLocaleString('vi-VN')} VND`);
      console.log(`      - Tier Level: ${wallets[index].tierLevel} (Kim cương)`);
    });
    console.log(`\n`);
  },

  async down(queryInterface, Sequelize) {
    // Xóa wallets trước
    const userIds = [
      'user-diamond-birthday-1',
      'user-diamond-birthday-2',
      'user-diamond-birthday-3',
      'user-diamond-birthday-4',
      'user-diamond-birthday-5',
      'user-diamond-birthday-6',
    ];
    
    await queryInterface.bulkDelete('wallets', {
      userId: { [Sequelize.Op.in]: userIds }
    }, {});
    
    // Xóa users
    await queryInterface.bulkDelete('users', {
      id: { [Sequelize.Op.in]: userIds }
    }, {});
  }
};

