// backend/models/TreatmentCourseSession.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TreatmentCourseSession = sequelize.define('TreatmentCourseSession', {
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
      comment: 'ID liệu trình của khách hàng',
    },
    sessionNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Số thứ tự buổi (1, 2, 3...)',
    },
    serviceId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'services',
        key: 'id',
      },
      onDelete: 'RESTRICT',
      comment: 'Dịch vụ sử dụng cho buổi này',
    },
    serviceName: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Tên dịch vụ',
    },
    appointmentId: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'appointments',
        key: 'id',
      },
      onDelete: 'SET NULL',
      comment: 'ID lịch hẹn cho buổi này',
    },
    status: {
      type: DataTypes.ENUM('pending', 'scheduled', 'completed', 'cancelled', 'no-show'),
      defaultValue: 'pending',
      comment: 'Trạng thái buổi',
    },
    scheduledDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: 'Ngày đã đặt lịch',
    },
    scheduledTime: {
      type: DataTypes.STRING(10),
      allowNull: true,
      comment: 'Giờ đã đặt lịch (HH:mm)',
    },
    completedDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Ngày hoàn thành thực tế',
    },
    therapistId: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'SET NULL',
      comment: 'ID kỹ thuật viên thực hiện',
    },
    therapistName: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Tên kỹ thuật viên',
    },
    skinConditionBefore: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Tình trạng da trước buổi',
    },
    skinConditionAfter: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Tình trạng da sau buổi',
    },
    treatmentNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Ghi chú trị liệu buổi này',
    },
    photos: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Ảnh trước/sau [{type: "before"/"after", url}]',
    },
    nextSessionAdvice: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Tư vấn cho buổi tiếp theo',
    },
  }, {
    tableName: 'treatment_course_sessions',
    timestamps: true,
    indexes: [
      {
        fields: ['courseId']
      },
      {
        fields: ['courseId', 'sessionNumber'],
        unique: true
      },
      {
        fields: ['status']
      },
      {
        fields: ['appointmentId']
      }
    ]
  });

  return TreatmentCourseSession;
};
