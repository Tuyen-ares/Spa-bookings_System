'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('wallets', {
      userId: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      balance: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
        comment: 'Số dư tiền mặt'
      },
      points: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Điểm tích lũy hiện tại'
      },
      totalEarned: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Tổng điểm đã tích'
      },
      totalSpent: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Tổng điểm đã dùng'
      },
      pointsHistory: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Lịch sử điểm: [{date, pointsChange, type, source, description}]'
      }
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      timestamps: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('wallets');
  }
};
