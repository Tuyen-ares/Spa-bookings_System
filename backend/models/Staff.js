
// backend/models/Staff.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Staff = sequelize.define('Staff', {
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
    staffRole: {
      type: DataTypes.ENUM('Manager', 'Technician', 'Receptionist'),
      allowNull: false,
    },
    specialty: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    experience: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    staffTierId: {
      type: DataTypes.ENUM('Mới', 'Thành thạo', 'Chuyên gia'),
      allowNull: true,
      references: {
        model: 'staff_tiers',
        key: 'id'
      },
      onDelete: 'SET NULL',
    },
    commissionRate: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0,
    },
    qrCodeUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    kpiGoals: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  }, {
    tableName: 'staff',
    timestamps: false,
  });
  return Staff;
};