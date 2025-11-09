'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('staff_shifts', {
      id: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true
      },
      staffId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      shiftType: {
        type: Sequelize.ENUM('morning', 'afternoon', 'evening', 'leave', 'custom'),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('approved', 'pending', 'rejected'),
        allowNull: false,
        defaultValue: 'pending'
      },
      requestedBy: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'ID nhân viên yêu cầu đổi ca'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      assignedManagerId: {
        type: Sequelize.STRING,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      shiftHours: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: '{start: "09:00", end: "17:00"}'
      },
      isUpForSwap: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false
      },
      swapClaimedBy: {
        type: Sequelize.STRING,
        allowNull: true
      },
      managerApprovalStatus: {
        type: Sequelize.ENUM('pending_approval', 'approved', 'rejected'),
        allowNull: true
      }
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      timestamps: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('staff_shifts');
  }
};
