'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('promotion_usage', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false,
      },
      userId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      promotionId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'promotions',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      appointmentId: {
        type: Sequelize.STRING,
        allowNull: true,
        references: {
          model: 'appointments',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      serviceId: {
        type: Sequelize.STRING,
        allowNull: true,
        references: {
          model: 'services',
          key: 'id',
        },
        onDelete: 'SET NULL',
        comment: 'Service ID for New Clients promotion tracking',
      },
      usedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Add indexes for better query performance
    await queryInterface.addIndex('promotion_usage', ['userId', 'promotionId'], {
      name: 'promotion_usage_user_promo_idx',
    });
    await queryInterface.addIndex('promotion_usage', ['userId', 'serviceId'], {
      name: 'promotion_usage_user_service_idx',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('promotion_usage');
  }
};

