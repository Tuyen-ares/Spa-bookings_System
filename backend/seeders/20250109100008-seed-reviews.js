'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const reviews = [
      {
        id: 'rev-1',
        serviceId: 'svc-facial-basic',
        serviceName: 'Chăm sóc da mặt cơ bản',
        userId: 'user-client-1',
        userName: 'Nguyễn Thu Hằng',
        userImageUrl: 'https://picsum.photos/seed/C001/100',
        appointmentId: 'apt-1',
        rating: 5,
        comment: 'Dịch vụ rất tốt, nhân viên nhiệt tình.',
        date: new Date('2024-07-29'),
      },
    ];

    await queryInterface.bulkInsert('reviews', reviews, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('reviews', null, {});
  }
};
