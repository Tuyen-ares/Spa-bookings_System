'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const promotions = [
      {
        id: 'promo-1',
        title: 'Giảm 20% cho dịch vụ Facial',
        description: 'Ưu đãi đặc biệt cho tất cả các dịch vụ chăm sóc da mặt.',
        code: 'FACIAL20',
        discountType: 'percentage',
        discountValue: 20,
        expiryDate: '2024-12-31',
        applicableServiceIds: JSON.stringify(['svc-facial-basic']),
        termsAndConditions: 'Áp dụng cho tất cả khách hàng.',
        imageUrl: 'https://picsum.photos/seed/promo-facial/500/300',
      },
    ];

    await queryInterface.bulkInsert('promotions', promotions, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('promotions', null, {});
  }
};
