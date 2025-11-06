// backend/models/StaffAvailability.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const StaffAvailability = sequelize.define('StaffAvailability', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    staffId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    timeSlots: { // Array of { time: string, availableServiceIds: string[] }
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
  }, {
    tableName: 'staff_availability',
    timestamps: false,
    indexes: [
        {
            unique: true,
            fields: ['staffId', 'date']
        }
    ]
  });

  return StaffAvailability;
};