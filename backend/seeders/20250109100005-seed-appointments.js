'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const appointments = [
      {
        id: 'apt-1',
        serviceId: 'svc-facial-basic',
        serviceName: 'Chăm sóc da mặt cơ bản',
        userId: 'user-client-1',
        therapistId: 'user-tech-1',
        date: '2024-07-28',
        time: '10:00',
        status: 'completed',
        paymentStatus: 'Paid',
        notesForTherapist: 'Khách thích massage nhẹ nhàng'
      },
      {
        id: 'apt-2',
        serviceId: 'svc-massage-body',
        serviceName: 'Massage body thảo dược',
        userId: 'user-client-2',
        therapistId: 'user-tech-2',
        date: '2024-08-05',
        time: '14:00',
        status: 'upcoming',
        paymentStatus: 'Unpaid',
        notesForTherapist: null
      },
    ];

    await queryInterface.bulkInsert('appointments', appointments, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('appointments', null, {});
  }
};
