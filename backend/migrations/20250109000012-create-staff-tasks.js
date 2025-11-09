'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('staff_tasks', {
      id: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      assignedToId: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'ID nhân viên được giao',
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      assignedById: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'ID admin/manager giao việc',
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      dueDate: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('pending', 'in-progress', 'completed', 'overdue'),
        allowNull: false,
        defaultValue: 'pending'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      completedAt: {
        type: Sequelize.DATE,
        allowNull: true
      }
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      timestamps: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('staff_tasks');
  }
};
