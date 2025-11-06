// backend/models/Mission.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Mission = sequelize.define('Mission', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    points: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    isCompleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    userId: { // Missions are tied to a specific user
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    type: {
        type: DataTypes.ENUM('service_count', 'service_variety', 'review_count', 'login'),
        allowNull: true
    },
    required: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    serviceCategory: {
        type: DataTypes.STRING,
        allowNull: true
    }
  }, {
    tableName: 'missions',
    timestamps: false,
  });

  return Mission;
};