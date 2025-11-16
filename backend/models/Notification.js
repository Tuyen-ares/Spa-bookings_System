// backend/models/Notification.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
      // Foreign key will be added manually if needed
    },
    type: {
      type: DataTypes.ENUM(
        'new_appointment',
        'appointment_confirmed',
        'appointment_cancelled',
        'appointment_reminder',
        'treatment_course_reminder',
        'promotion',
        'payment_success',
        'system'
      ),
      allowNull: false,
      defaultValue: 'system',
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    relatedId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'ID của appointment, treatment course, etc.',
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    sentVia: {
      type: DataTypes.ENUM('app', 'email', 'both'),
      allowNull: false,
      defaultValue: 'app',
    },
    emailSent: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'notifications',
    timestamps: false,
  });

  return Notification;
};
