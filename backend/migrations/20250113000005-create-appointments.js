'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('appointments', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false,
      },
      serviceId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'services',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      serviceName: {
        type: Sequelize.STRING,
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
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      time: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('upcoming', 'completed', 'cancelled', 'pending', 'in-progress', 'scheduled'),
        allowNull: false,
        defaultValue: 'pending',
      },
      paymentStatus: {
        type: Sequelize.ENUM('Paid', 'Unpaid'),
        allowNull: true,
        defaultValue: 'Unpaid',
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
      notesForTherapist: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      staffNotesAfterSession: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      rejectionReason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      bookingGroupId: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      promotionId: {
        type: Sequelize.STRING,
        allowNull: true,
        references: {
          model: 'promotions',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        comment: 'ID mã khuyến mãi/voucher được áp dụng',
      },
    });

    // Add indexes
    await queryInterface.addIndex('appointments', ['date', 'time'], {
      name: 'date_time',
    });
    await queryInterface.addIndex('appointments', ['status'], {
      name: 'status',
    });
    await queryInterface.addIndex('appointments', ['promotionId'], {
      name: 'promotionId',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('appointments');
  }
};
