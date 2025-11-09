'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('payments', {
      id: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true
      },
      bookingId: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'ID đặt lịch',
        references: {
          model: 'appointments',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      userId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      appointmentId: {
        type: Sequelize.STRING,
        allowNull: true,
        references: {
          model: 'appointments',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      serviceName: {
        type: Sequelize.STRING,
        allowNull: true
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      method: {
        type: Sequelize.ENUM('Cash', 'Card', 'Momo', 'VNPay', 'ZaloPay', 'Pay at Counter'),
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('Completed', 'Pending', 'Refunded', 'Failed'),
        allowNull: true,
        defaultValue: 'Pending'
      },
      date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      transactionId: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Mã giao dịch từ hệ thống thanh toán'
      },
      therapistId: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'ID nhân viên (để tính hoa hồng)'
      }
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      timestamps: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('payments');
  }
};
