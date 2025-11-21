'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const services = [
      {
        id: 'svc-facial-basic',
        name: 'Chăm sóc da mặt cơ bản',
        description: 'Làm sạch sâu, cấp ẩm cho da.',
        price: 500000,
        discountPercent: 0,
        duration: 60,
        categoryId: 2,
        imageUrl: 'https://picsum.photos/seed/facial-basic/400/300',
        rating: 4.8,
        reviewCount: 120,
        isActive: true,
      },
      {
        id: 'svc-massage-body',
        name: 'Massage body thảo dược',
        description: 'Thư giãn toàn thân, giảm căng thẳng.',
        price: 700000,
        discountPercent: 15,
        duration: 90,
        categoryId: 1,
        imageUrl: 'https://picsum.photos/seed/massage-body/400/300',
        rating: 4.9,
        reviewCount: 250,
        isActive: true,
      },
      {
        id: 'svc-hair-removal',
        name: 'Triệt lông nách Diode Laser',
        description: 'Triệt lông vĩnh viễn, an toàn.',
        price: 800000,
        discountPercent: 0,
        duration: 30,
        categoryId: 6,
        imageUrl: 'https://picsum.photos/seed/hair-removal/400/300',
        rating: 4.7,
        reviewCount: 95,
        isActive: true,
      },
      {
        id: 'svc-combo-relax',
        name: 'Gói Thư Giãn Toàn Diện',
        description: 'Combo massage body và chăm sóc da mặt chuyên sâu.',
        price: 1200000,
        discountPercent: 17,
        duration: 150,
        categoryId: 5,
        imageUrl: 'https://picsum.photos/seed/combo-relax/400/300',
        rating: 4.9,
        reviewCount: 75,
        isActive: true,
      },
      {
        id: 'svc-combo-detox',
        name: 'Gói Thanh Lọc & Tái Tạo Da',
        description: 'Kết hợp xông hơi thải độc và liệu trình cấy tảo xoắn.',
        price: 1500000,
        discountPercent: 20,
        duration: 120,
        categoryId: 5,
        imageUrl: 'https://picsum.photos/seed/combo-detox/400/300',
        rating: 4.8,
        reviewCount: 45,
        isActive: true,
      },
      {
        id: 'svc-combo-royal',
        name: 'Gói Chăm Sóc Toàn Thân Hoàng Gia',
        description: 'Trải nghiệm đẳng cấp hoàng gia với tẩy tế bào chết, ủ dưỡng thể và massage đá nóng.',
        price: 2500000,
        discountPercent: 20,
        duration: 180,
        categoryId: 5,
        imageUrl: 'https://picsum.photos/seed/combo-royal/400/300',
        rating: 5.0,
        reviewCount: 30,
        isActive: true,
      },
    ];

    await queryInterface.bulkInsert('services', services, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('services', null, {});
  }
};
