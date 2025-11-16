'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('treatment_courses', 'templateId', {
      type: Sequelize.STRING,
      allowNull: true,
      after: 'id',
      comment: 'ID của template liệu trình (nếu course này được tạo từ template)'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('treatment_courses', 'templateId');
  }
};
