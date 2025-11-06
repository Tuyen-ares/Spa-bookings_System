// backend/models/ServiceCategory.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const ServiceCategory = sequelize.define('ServiceCategory', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
  }, {
    tableName: 'service_categories',
    timestamps: false,
  });

  return ServiceCategory;
};