
// backend/models/Customer.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Customer = sequelize.define('Customer', {
    userId: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE',
    },
    tierLevel: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      references: {
        model: 'tiers',
        key: 'level'
      }
    },
    selfCareIndex: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 50,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    totalSpending: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    lastTierUpgradeDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    qrCodeUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    tableName: 'customers',
    timestamps: false,
  });
  return Customer;
};