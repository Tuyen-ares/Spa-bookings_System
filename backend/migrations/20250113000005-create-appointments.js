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
      userName: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Tên khách hàng (để hiển thị trên lịch)',
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
        type: Sequelize.ENUM('upcoming', 'completed', 'cancelled', 'pending', 'in-progress'),
        allowNull: false,
        defaultValue: 'pending',
      },
      paymentStatus: {
        type: Sequelize.ENUM('Paid', 'Unpaid'),
        allowNull: true,
        defaultValue: 'Unpaid',
      },
      therapist: {
        type: Sequelize.STRING,
        allowNull: true,
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
      isStarted: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      isCompleted: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      reviewRating: {
        type: Sequelize.INTEGER,
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
    await queryInterface.dropTable('appointments');
  }
};
