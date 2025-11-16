// backend/models/StaffShift.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const StaffShift = sequelize.define('StaffShift', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    staffId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    shiftType: {
      type: DataTypes.ENUM('morning', 'afternoon', 'evening', 'leave', 'custom'),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('approved', 'pending', 'rejected'),
      allowNull: false,
      defaultValue: 'pending',
    },
    requestedBy: { // For swap requests (staffId)
      type: DataTypes.STRING,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    assignedManagerId: { // Manager who approved/rejected
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    shiftHours: { // { start: string; end: string }
      type: DataTypes.JSON,
      allowNull: true,
    },
    isUpForSwap: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    swapClaimedBy: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    managerApprovalStatus: {
      type: DataTypes.ENUM('pending_approval', 'approved', 'rejected'),
      allowNull: true,
    },
    roomId: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'rooms',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
  }, {
    tableName: 'staff_shifts',
    timestamps: false,
  });

  return StaffShift;
};