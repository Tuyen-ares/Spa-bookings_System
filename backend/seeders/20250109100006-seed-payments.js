'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const payments = [
      {
        id: 'pay-1',
        appointmentId: 'apt-1',
        userId: 'user-client-1',
        serviceName: 'Chăm sóc da mặt cơ bản',
        amount: 500000,
        method: 'Cash',
        status: 'Completed',
        transactionId: null,
        date: new Date('2024-07-28T10:00:00.000Z'),
        therapistId: 'user-tech-1'
      },
    ];

    await queryInterface.bulkInsert('payments', payments, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('payments', null, {});
  }
};
