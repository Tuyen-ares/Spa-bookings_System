// backend/models/PromotionUsage.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const PromotionUsage = sequelize.define('PromotionUsage', {
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
    promotionId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'promotions',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    appointmentId: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'appointments',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    serviceId: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'services',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    usedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'promotion_usage',
    timestamps: false,
  });

  return PromotionUsage;
};

