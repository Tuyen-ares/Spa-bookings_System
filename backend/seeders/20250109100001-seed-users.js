'use strict';
const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash('password123', 10);

    const users = [
      // Admin & Manager
      {
        id: 'user-admin',
        name: 'Trần Thị Hạnh',
        email: 'admin@spa.vn',
        password: hashedPassword,
        phone: '0901112233',
        profilePictureUrl: 'https://picsum.photos/seed/U001/200',
        joinDate: '2024-01-05',
        birthday: '1992-02-10',
        gender: 'Nữ',
        role: 'Admin',
        status: 'Active',
        lastLogin: new Date(),
      },
      {
        id: 'user-manager',
        name: 'Nguyễn Quang Minh',
        email: 'manager@spa.vn',
        password: hashedPassword,
        phone: '0908889999',
        profilePictureUrl: 'https://picsum.photos/seed/U002/200',
        joinDate: '2024-01-20',
        birthday: '1990-03-14',
        gender: 'Nam',
        role: 'Staff',
        status: 'Active',
        lastLogin: new Date(),
      },
      // Technicians
      {
        id: 'user-tech-1',
        name: 'Lê Phương Anh',
        email: 'tech1@spa.vn',
        password: hashedPassword,
        phone: '0907778888',
        profilePictureUrl: 'https://picsum.photos/seed/U003/200',
        joinDate: '2024-02-01',
        birthday: '1995-06-20',
        gender: 'Nữ',
        role: 'Staff',
        status: 'Active',
        lastLogin: new Date(),
      },
      {
        id: 'user-tech-2',
        name: 'Phạm Văn Tài',
        email: 'tech2@spa.vn',
        password: hashedPassword,
        phone: '0903334444',
        profilePictureUrl: 'https://picsum.photos/seed/U004/200',
        joinDate: '2024-02-10',
        birthday: '1994-09-25',
        gender: 'Nam',
        role: 'Staff',
        status: 'Active',
        lastLogin: new Date(),
      },
      // Receptionist
      {
        id: 'user-recep-1',
        name: 'Trần Bích Ngọc',
        email: 'recep1@spa.vn',
        password: hashedPassword,
        phone: '0905556666',
        profilePictureUrl: 'https://picsum.photos/seed/U005/200',
        joinDate: '2024-03-02',
        birthday: '1998-12-12',
        gender: 'Nữ',
        role: 'Staff',
        status: 'Active',
        lastLogin: new Date(),
      },
      // Clients
      {
        id: 'user-client-1',
        name: 'Nguyễn Thu Hằng',
        email: 'client1@spa.vn',
        password: hashedPassword,
        phone: '0900001111',
        profilePictureUrl: 'https://picsum.photos/seed/C001/200',
        joinDate: '2024-03-15',
        birthday: '1996-07-21',
        gender: 'Nữ',
        role: 'Client',
        status: 'Active',
        lastLogin: new Date('2024-07-20T10:00:00.000Z'),
      },
      {
        id: 'user-client-2',
        name: 'Lưu Hữu Nam',
        email: 'client2@spa.vn',
        password: hashedPassword,
        phone: '0901112222',
        profilePictureUrl: 'https://picsum.photos/seed/C002/200',
        joinDate: '2024-04-01',
        birthday: '1998-10-02',
        gender: 'Nam',
        role: 'Client',
        status: 'Active',
        lastLogin: new Date(),
      },
      {
        id: 'user-client-3',
        name: 'Phan Mai Chi',
        email: 'client3@spa.vn',
        password: hashedPassword,
        phone: '0902223333',
        profilePictureUrl: 'https://picsum.photos/seed/C003/200',
        joinDate: '2024-05-12',
        birthday: '2000-05-05',
        gender: 'Nữ',
        role: 'Client',
        status: 'Active',
        lastLogin: new Date(),
      },
    ];

    await queryInterface.bulkInsert('users', users, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', null, {});
  }
};
