// backend/models/Tier.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Tier = sequelize.define('Tier', {
    level: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    pointsRequired: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    minSpendingRequired: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    color: { // hex color
      type: DataTypes.STRING,
      allowNull: true,
    },
    textColor: { // Tailwind class name
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    tableName: 'tiers',
    timestamps: false,
  });

  return Tier;
};
