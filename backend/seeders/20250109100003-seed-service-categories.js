'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const categories = [
      { id: 1, name: 'Massage' },
      { id: 2, name: 'Skincare' },
      { id: 3, name: 'Body Care' },
      { id: 4, name: 'Relax' },
      { id: 5, name: 'Spa Package' },
      { id: 6, name: 'Triệt Lông' },
      { id: 7, name: 'Clinic' },
      { id: 8, name: 'Nail' },
      { id: 9, name: 'Khác' },
    ];

    await queryInterface.bulkInsert('service_categories', categories, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('service_categories', null, {});
  }
};
