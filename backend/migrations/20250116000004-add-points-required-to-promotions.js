'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('promotions', 'pointsRequired', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: null,
      comment: 'Số điểm cần thiết để đổi voucher (chỉ áp dụng cho voucher private)',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('promotions', 'pointsRequired');
  }
};

