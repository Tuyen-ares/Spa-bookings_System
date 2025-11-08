// backend/models/Payment.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Payment = sequelize.define('Payment', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    transactionId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bookingId: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'appointments',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    appointmentId: { // Optional: Link to appointment
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'appointments',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    serviceName: { // Stored for easier lookup
      type: DataTypes.STRING,
      allowNull: true,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    method: {
      type: DataTypes.ENUM('Cash', 'Card', 'Momo', 'VNPay', 'ZaloPay'),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('Completed', 'Pending', 'Refunded', 'Failed'),
      allowNull: false,
      defaultValue: 'Pending',
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    therapistId: { // Therapist who performed the service for commission tracking
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
  }, {
    tableName: 'payments',
    timestamps: false,
  });

  return Payment;
};
