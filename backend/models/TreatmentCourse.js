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
    sessionsPerWeek: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: 'Số buổi mỗi tuần (ví dụ: 2 buổi/tuần)',
    },
    weekDays: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Mảng các thứ trong tuần: [1,3,5] = Thứ 2, Thứ 4, Thứ 6 (0=CN, 1=T2, ..., 6=T7)',
    },
    sessionDuration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 60,
      comment: 'Thời gian mỗi buổi (phút)',
    },
    sessionTime: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Giờ cố định cho các buổi (ví dụ: "18:00")',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Mô tả liệu trình',
    },
    imageUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'URL hình ảnh liệu trình',
    },
    sessions: { // Array of TreatmentSession as JSON
      type: DataTypes.JSON,
      allowNull: true,
    },
    initialAppointmentId: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'appointments',
        key: 'id',
      },
      onDelete: 'SET NULL',
      comment: 'ID appointment đầu tiên tạo ra liệu trình (để lấy userId từ appointments)',
    },
    clientId: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
      comment: 'ID khách hàng (có thể NULL cho template, lấy từ appointments nếu cần)',
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
    expiryDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: 'Hạn sử dụng liệu trình',
    },
    nextAppointmentDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: 'Ngày hẹn tiếp theo (để nhắc nhở)',
    },
  }, {
    tableName: 'treatment_courses',
    timestamps: false,
  });

  return TreatmentCourse;
};
