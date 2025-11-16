'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('notifications', {
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
      type: {
        type: Sequelize.ENUM(
          'new_appointment',
          'appointment_confirmed',
          'appointment_cancelled',
          'appointment_reminder',
          'treatment_course_reminder',
          'promotion',
          'payment_success',
          'payment_received',
          'system'
        ),
        allowNull: false,
        defaultValue: 'system',
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      relatedId: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'ID của appointment, treatment course, etc.',
      },
      isRead: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      sentVia: {
        type: Sequelize.ENUM('app', 'email', 'both'),
        allowNull: false,
        defaultValue: 'app',
      },
      emailSent: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('notifications');
  }
};
