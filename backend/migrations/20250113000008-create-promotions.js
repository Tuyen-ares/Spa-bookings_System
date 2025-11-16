'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('promotions', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      expiryDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      imageUrl: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      discountType: {
        type: Sequelize.ENUM('percentage', 'fixed'),
        allowNull: false,
      },
      discountValue: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      termsAndConditions: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      targetAudience: {
        type: Sequelize.ENUM(
          'All', 'New Clients', 'Birthday', 'Group', 'VIP',
          'Tier Level 1', 'Tier Level 2', 'Tier Level 3', 'Tier Level 4',
          'Tier Level 5', 'Tier Level 6', 'Tier Level 7', 'Tier Level 8'
        ),
        allowNull: true,
        defaultValue: 'All',
      },
      applicableServiceIds: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      minOrderValue: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0.00,
      },
      usageCount: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      usageLimit: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'NULL = không giới hạn',
      },
      pointsRequired: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
        comment: 'Điểm cần để đổi (0 = không cần, >0 = voucher đổi điểm)',
      },
      isVoucher: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('promotions');
  }
};
