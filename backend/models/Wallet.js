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
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    points: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    spinsLeft: { // For lucky wheel game
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 3, 
    },
  }, {
    tableName: 'wallets',
    timestamps: false,
  });

  return Wallet;
};
