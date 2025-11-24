'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const categories = [
      { id: 1, name: 'Nail' },
      { id: 2, name: 'MASSAGE THƯ GIÃN' },
      { id: 3, name: 'CHĂM SÓC DA' },
      { id: 4, name: 'CHĂM SÓC CƠ THỂ' },
      { id: 5, name: 'CHĂM SÓC TÓC' },
      { id: 6, name: 'WAXING' },
    ];

    await queryInterface.bulkInsert('service_categories', categories, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('service_categories', null, {});
  }
};
