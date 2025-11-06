// backend/models/Promotion.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Promotion = sequelize.define('Promotion', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    expiryDate: {
      type: DataTypes.STRING, // ISO string
      allowNull: false,
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    discountType: {
      type: DataTypes.ENUM('percentage', 'fixed'),
      allowNull: false,
    },
    discountValue: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    termsAndConditions: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    targetAudience: {
      type: DataTypes.ENUM(
        'All', 'New Clients', 'Birthday', 'VIP',
        'Tier Level 1', 'Tier Level 2', 'Tier Level 3', 'Tier Level 4',
        'Tier Level 5', 'Tier Level 6', 'Tier Level 7', 'Tier Level 8'
      ),
      allowNull: true,
      defaultValue: 'All',
    },
    applicableServiceIds: { // Store string[] as JSON
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    minOrderValue: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0,
    },
    usageCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
  }, {
    tableName: 'promotions',
    timestamps: false,
  });

  return Promotion;
};
