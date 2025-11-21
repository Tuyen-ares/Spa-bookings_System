'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('promotions', 'isPublic', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: true,
      comment: 'true = public (hiển thị trên trang khách hàng), false = private (chỉ dùng khi biết mã)',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('promotions', 'isPublic');
  }
};

