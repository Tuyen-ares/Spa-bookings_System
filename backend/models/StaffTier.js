// backend/models/StaffTier.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const StaffTier = sequelize.define('StaffTier', {
    id: {
      type: DataTypes.ENUM('Mới', 'Thành thạo', 'Chuyên gia'),
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    minAppointments: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    minRating: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    commissionBoost: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    color: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    badgeImageUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: 'staff_tiers',
    timestamps: false,
  });

  return StaffTier;
};