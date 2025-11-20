'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('treatment_courses', 'paymentStatus', {
      type: Sequelize.ENUM('Paid', 'Unpaid'),
      allowNull: false,
      defaultValue: 'Unpaid',
      comment: 'Trạng thái thanh toán (Đã thanh toán, Chưa thanh toán)'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('treatment_courses', 'paymentStatus');
  }
};

