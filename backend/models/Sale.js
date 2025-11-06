// backend/models/Sale.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Sale = sequelize.define('Sale', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    staffId: {
      type: DataTypes.STRING,
      allowNull: true, // Can be null if sale not tied to a specific staff
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    productId: {
      type: DataTypes.STRING,
      allowNull: true, // Can be null if product is deleted
      references: {
        model: 'products',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    productName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    totalAmount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('completed', 'pending', 'returned'),
      allowNull: false,
      defaultValue: 'completed',
    },
    clientId: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    paymentId: {
      type: DataTypes.STRING,
      allowNull: true, // Link to payment if separate
    },
  }, {
    tableName: 'sales',
    timestamps: false,
  });

  return Sale;
};