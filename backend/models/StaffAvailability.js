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
      allowNull: true,
      comment: 'Ngày cụ thể (NULL nếu là lịch định kỳ)',
    },
    dayOfWeek: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Thứ trong tuần: 0=CN, 1=T2, ..., 6=T7 (NULL nếu là lịch cụ thể)',
    },
    startTime: {
      type: DataTypes.STRING(10),
      allowNull: true,
      comment: 'Giờ bắt đầu (HH:MM) cho lịch định kỳ',
    },
    endTime: {
      type: DataTypes.STRING(10),
      allowNull: true,
      comment: 'Giờ kết thúc (HH:MM) cho lịch định kỳ',
    },
    isAvailable: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
      comment: 'Có sẵn sàng không (cho lịch định kỳ)',
    },
    timeSlots: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Mảng: [{time: "09:00", availableServiceIds: ["sv1", "sv2"]}] (cho lịch cụ thể)',
    },
  }, {
    tableName: 'staff_availability',
    timestamps: false,
  });

  return StaffAvailability;
};