// backend/models/Service.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Service = sequelize.define('Service', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    longDescription: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      get() {
        const value = this.getDataValue('price');
        return value === null ? null : parseFloat(value);
      }
    },
    discountPercent: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: 'Phần trăm giảm giá (0-100)',
      validate: {
        min: 0,
        max: 100
      }
    },
    discountPrice: {
      type: DataTypes.VIRTUAL,
      get() {
        const price = this.getDataValue('price');
        const discountPercent = this.getDataValue('discountPercent');
        if (!price || !discountPercent || discountPercent === 0) {
          return null;
        }
        return parseFloat((price * (1 - discountPercent / 100)).toFixed(2));
      }
    },
    duration: {
      type: DataTypes.INTEGER, // in minutes
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Tên danh mục (để hiển thị)',
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'service_categories',
        key: 'id'
      },
      onDelete: 'SET NULL',
    },
    imageUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    rating: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    reviewCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    isHot: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    isNew: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    promoExpiryDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    isActive: { 
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  }, {
    tableName: 'services',
    timestamps: false,
  });

  return Service;
};