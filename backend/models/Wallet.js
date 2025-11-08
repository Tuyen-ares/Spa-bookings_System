// backend/models/Wallet.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Wallet = sequelize.define('Wallet', {
    userId: {
      type: DataTypes.STRING,
      primaryKey: true, // Wallet is identified by userId
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    balance: { // For storing monetary balance if applicable
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    points: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    totalEarned: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Tổng điểm đã tích được',
    },
    totalSpent: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Tổng điểm đã sử dụng',
    },
    pointsHistory: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Lịch sử điểm: [{date, pointsChange, type, source, description}]',
    },
  }, {
    tableName: 'wallets',
    timestamps: false,
  });

  return Wallet;
};
