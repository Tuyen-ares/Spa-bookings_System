// backend/models/TreatmentReminder.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TreatmentReminder = sequelize.define('TreatmentReminder', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    courseId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'treatment_courses',
        key: 'id',
      },
      onDelete: 'CASCADE',
      comment: 'ID liệu trình',
    },
    clientId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
      comment: 'ID khách hàng',
    },
    sessionNumber: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Buổi tiếp theo cần đặt',
    },
    reminderType: {
      type: DataTypes.ENUM('next_session', 'expiry_warning', 'missed_appointment', 'completion'),
      allowNull: false,
      comment: 'Loại nhắc nhở',
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Tiêu đề thông báo',
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Nội dung thông báo',
    },
    scheduledDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: 'Ngày gợi ý đặt lịch',
    },
    sentDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Ngày gửi thông báo',
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Đã đọc chưa',
    },
    isSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Đã gửi chưa',
    },
  }, {
    tableName: 'treatment_reminders',
    timestamps: true,
    indexes: [
      {
        fields: ['clientId']
      },
      {
        fields: ['courseId']
      },
      {
        fields: ['isSent', 'scheduledDate']
      },
      {
        fields: ['isRead']
      }
    ]
  });

  return TreatmentReminder;
};
