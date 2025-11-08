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
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Mô tả danh mục',
    },
    iconUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'URL icon danh mục',
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: 'Thứ tự hiển thị',
    },
  }, {
    tableName: 'service_categories',
    timestamps: false,
  });

  return ServiceCategory;
};