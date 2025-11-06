// backend/models/RedeemableVoucher.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const RedeemableVoucher = sequelize.define('RedeemableVoucher', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    pointsRequired: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    value: { // in VND, if it's a monetary voucher
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    applicableServiceIds: { // Store string[] as JSON
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    targetAudience: {
      type: DataTypes.ENUM(
        'All', 'VIP',
        'Tier Level 1', 'Tier Level 2', 'Tier Level 3', 'Tier Level 4',
        'Tier Level 5', 'Tier Level 6', 'Tier Level 7', 'Tier Level 8'
      ),
      allowNull: true,
      defaultValue: 'All',
    },
  }, {
    tableName: 'redeemable_vouchers',
    timestamps: false,
  });

  return RedeemableVoucher;
};
