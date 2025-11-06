// backend/models/InternalNews.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const InternalNews = sequelize.define('InternalNews', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    authorId: {
      type: DataTypes.STRING, // User ID of Admin/Manager
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      allowNull: false,
      defaultValue: 'medium',
    },
  }, {
    tableName: 'internal_news',
    timestamps: false,
  });

  return InternalNews;
};