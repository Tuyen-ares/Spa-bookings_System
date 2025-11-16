// backend/models/User.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING, 
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    profilePictureUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    joinDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    birthday: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    gender: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM('Admin', 'Staff', 'Client'),
      allowNull: false,
      defaultValue: 'Client',
    },
    status: {
      type: DataTypes.ENUM('Active', 'Inactive', 'Locked'),
      allowNull: false,
      defaultValue: 'Active',
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    loginHistory: {
      type: DataTypes.JSON,
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
    tableName: 'users',
    timestamps: false,
  });

  return User;
};