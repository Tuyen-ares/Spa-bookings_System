// backend/models/TreatmentSession.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TreatmentSession = sequelize.define('TreatmentSession', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    treatmentCourseId: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'ID liệu trình',
    },
    appointmentId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'ID lịch hẹn (liên kết với appointments)',
    },
    sessionNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Số thứ tự buổi (1, 2, 3, ...)',
    },
    status: {
      type: DataTypes.ENUM('scheduled', 'completed', 'cancelled', 'missed'),
      allowNull: false,
      defaultValue: 'scheduled',
      comment: 'Trạng thái buổi điều trị',
    },
    sessionDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: 'Ngày thực hiện',
    },
    sessionTime: {
      type: DataTypes.STRING(10),
      allowNull: false,
      comment: 'Giờ thực hiện (HH:MM)',
    },
    staffId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'ID nhân viên thực hiện',
    },
    customerStatusNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Ghi chú tình trạng khách (TEXT, không phải ENUM) - Ví dụ: "Khách ổn, da sáng hơn, không có kích ứng"',
    },
    adminNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Ghi chú của admin sau buổi',
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Ngày hoàn thành',
    },
  }, {
    tableName: 'treatment_sessions',
    timestamps: false, // No timestamps in schema
  });

  return TreatmentSession;
};
