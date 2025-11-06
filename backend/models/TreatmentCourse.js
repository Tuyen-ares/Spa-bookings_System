// backend/models/TreatmentCourse.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const TreatmentCourse = sequelize.define('TreatmentCourse', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    serviceId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'services',
        key: 'id',
      },
    },
    serviceName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    totalSessions: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    sessions: { // Array of TreatmentSession as JSON
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    clientId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    therapistId: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    status: {
      type: DataTypes.ENUM('active', 'completed', 'paused'),
      allowNull: false,
      defaultValue: 'active',
    },
  }, {
    tableName: 'treatment_courses',
    timestamps: false,
  });

  return TreatmentCourse;
};
