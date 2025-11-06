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
      allowNull: false,
      unique: true,
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
    appointmentId: { // Optional: A payment might be for a product directly
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
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    method: {
      type: DataTypes.ENUM('Cash', 'Card', 'Momo', 'VNPay', 'ZaloPay'),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('Completed', 'Pending', 'Refunded'),
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
    productId: { // If payment is for a product sale
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'products',
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
