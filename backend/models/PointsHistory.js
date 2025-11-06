// backend/models/PointsHistory.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const PointsHistory = sequelize.define('PointsHistory', {
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
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    pointsChange: { // positive for earning, negative for spending
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    tableName: 'points_history',
    timestamps: false,
  });

  return PointsHistory;
};