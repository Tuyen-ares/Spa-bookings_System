'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const wallets = [
      {
        id: 'wallet-client-1',
        userId: 'user-client-1',
        points: 900,
        tierLevel: 2,
        totalSpent: 900000,
        lastUpdated: new Date('2024-07-28T10:00:00.000Z')
      },
      {
        id: 'wallet-client-2',
        userId: 'user-client-2',
        points: 2200,
        tierLevel: 3,
        totalSpent: 2200000,
        lastUpdated: new Date('2024-08-05T14:00:00.000Z')
      },
      {
        id: 'wallet-client-3',
        userId: 'user-client-3',
        points: 5500,
        tierLevel: 4,
        totalSpent: 5500000,
        lastUpdated: new Date('2024-08-10T09:30:00.000Z')
      },
    ];

    await queryInterface.bulkInsert('wallets', wallets, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('wallets', null, {});
  }
};
