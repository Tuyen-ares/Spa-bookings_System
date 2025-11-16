'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('staff_shifts', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false,
      },
      staffId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      shiftType: {
        type: Sequelize.ENUM('morning', 'afternoon', 'evening', 'leave', 'custom'),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('approved', 'pending', 'rejected'),
        allowNull: false,
        defaultValue: 'pending',
      },
      requestedBy: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      assignedManagerId: {
        type: Sequelize.STRING,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      shiftHours: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      isUpForSwap: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      swapClaimedBy: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      managerApprovalStatus: {
        type: Sequelize.ENUM('pending_approval', 'approved', 'rejected'),
        allowNull: true,
      },
      roomId: {
        type: Sequelize.STRING,
        allowNull: true,
        references: {
          model: 'rooms',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('staff_shifts');
  }
};
