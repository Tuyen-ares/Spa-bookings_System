'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('treatment_courses', 'totalAmount', {
      type: Sequelize.DECIMAL(15, 2),
      allowNull: true,
      defaultValue: null,
      comment: 'Tổng số tiền thực tế khi khách đặt lịch (sau khi áp dụng giảm giá/voucher)',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('treatment_courses', 'totalAmount');
  }
};

