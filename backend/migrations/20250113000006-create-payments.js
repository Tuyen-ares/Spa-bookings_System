'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('payments', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false,
      },
      transactionId: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      bookingId: {
        type: Sequelize.STRING,
        allowNull: true,
        references: {
          model: 'appointments',
          key: 'id',
        },
        onDelete: 'SET NULL',
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
      appointmentId: {
        type: Sequelize.STRING,
        allowNull: true,
        references: {
          model: 'appointments',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      serviceName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      method: {
        type: Sequelize.ENUM('Cash', 'Card', 'Momo', 'VNPay', 'ZaloPay'),
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('Completed', 'Pending', 'Refunded', 'Failed'),
        allowNull: false,
        defaultValue: 'Pending',
      },
      date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      therapistId: {
        type: Sequelize.STRING,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('payments');
  }
};
