// backend/models/Review.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Review = sequelize.define('Review', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    serviceId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'services',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    serviceName: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    appointmentId: { // Optional, link to a specific appointment
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      references: {
        model: 'appointments',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    userName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    userImageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    rating: {
      type: DataTypes.INTEGER, // 1 to 5 stars
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    images: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Mảng URL ảnh đánh giá: ["url1", "url2"]',
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    managerReply: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isHidden: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  }, {
    tableName: 'reviews',
    timestamps: false,
  });

  return Review;
};