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
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    imageUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    discountType: {
      type: DataTypes.ENUM('percentage', 'fixed'),
      allowNull: false,
    },
    discountValue: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    termsAndConditions: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    targetAudience: {
      type: DataTypes.ENUM(
        'All', 'New Clients', 'Birthday', 'Group', 'VIP',
        'Tier Level 1', 'Tier Level 2', 'Tier Level 3', 'Tier Level 4',
        'Tier Level 5', 'Tier Level 6', 'Tier Level 7', 'Tier Level 8'
      ),
      allowNull: true,
      defaultValue: 'All',
    },
    applicableServiceIds: { // Store string[] as JSON
      type: DataTypes.JSON,
      allowNull: true,
    },
    minOrderValue: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0.00,
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Số lượng voucher còn lại (NULL = không giới hạn)',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
    },
  }, {
    tableName: 'promotions',
    timestamps: false,
  });

  return Promotion;
};
