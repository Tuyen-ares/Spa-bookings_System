// backend/models/InternalNotification.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const InternalNotification = sequelize.define('InternalNotification', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    recipientId: {
      type: DataTypes.STRING, // User ID of staff or client, 'all' for all staff/clients
      allowNull: true, // Can be 'all'
    },
    recipientType: {
      type: DataTypes.ENUM('staff', 'client', 'all'),
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM(
        'appointment_new', 'appointment_cancelled', 'shift_change', 'admin_message',
        'promo_alert', 'system_news', 'client_feedback'
      ),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    link: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    relatedAppointmentId: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'appointments',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
  }, {
    tableName: 'internal_notifications',
    timestamps: false,
  });

  return InternalNotification;
};