// backend/models/RedeemedReward.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const RedeemedReward = sequelize.define('RedeemedReward', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
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
    rewardDescription: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    pointsUsed: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    dateRedeemed: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  }, {
    tableName: 'redeemed_rewards',
    timestamps: false,
  });

  return RedeemedReward;
};