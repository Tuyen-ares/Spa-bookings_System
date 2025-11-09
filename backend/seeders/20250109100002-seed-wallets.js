'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const wallets = [
      {
        userId: 'user-client-1',
        balance: 100000,
        points: 900,
        totalEarned: 900,
        totalSpent: 0,
      },
      {
        userId: 'user-client-2',
        balance: 200000,
        points: 2200,
        totalEarned: 2200,
        totalSpent: 0,
      },
      {
        userId: 'user-client-3',
        balance: 500000,
        points: 5500,
        totalEarned: 5500,
        totalSpent: 0,
      },
    ];

    await queryInterface.bulkInsert('wallets', wallets, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('wallets', null, {});
  }
};
