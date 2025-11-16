// backend/models/TreatmentCourse.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const TreatmentCourse = sequelize.define('TreatmentCourse', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    templateId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'ID của template liệu trình (nếu course này được tạo từ template)',
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Tên gói liệu trình (VD: Liệu trình làm sáng da)',
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Giá của gói liệu trình',
    },
    packageId: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'treatment_packages',
        key: 'id',
      },
      comment: 'ID của gói liệu trình mẫu (nếu khách đăng ký từ package)',
    },
    serviceId: {
      type: DataTypes.STRING,
      allowNull: true, // Changed to nullable for backward compatibility
      references: {
        model: 'services',
        key: 'id',
      },
      comment: 'DEPRECATED: Use treatment_course_services table instead',
    },
    serviceName: {
      type: DataTypes.STRING,
      allowNull: true, // Changed to nullable
      comment: 'DEPRECATED: Use treatment_course_services table instead',
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
      type: DataTypes.ENUM('draft', 'active', 'paused', 'completed', 'expired', 'cancelled'),
      allowNull: false,
      defaultValue: 'active',
      comment: 'Trạng thái liệu trình',
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
    // Phase 1 additions
    progressPercentage: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Phần trăm hoàn thành (0-100), tính từ sessions completed',
    },
    completedSessions: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Số buổi đã hoàn thành',
    },
    lastCompletedDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Ngày hoàn thành buổi cuối cùng',
    },
    treatmentGoals: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Mục tiêu điều trị (VD: Giảm mụn 80%, se khít lỗ chân lông)',
    },
    initialSkinCondition: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Tình trạng da ban đầu',
    },
    consultantId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'ID chuyên viên tư vấn',
    },
    consultantName: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Tên chuyên viên tư vấn',
    },
    isPaused: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Liệu trình có đang tạm dừng không',
    },
    pauseReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Lý do tạm dừng',
    },
    pausedDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Ngày bắt đầu tạm dừng',
    },
    resumedDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Ngày tiếp tục sau khi tạm dừng',
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: 'Ngày bắt đầu liệu trình',
    },
    actualCompletionDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Ngày hoàn thành thực tế',
    },
    remindersSent: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
      comment: 'Lịch sử các reminder đã gửi [{type, date, status}]',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'treatment_courses',
    timestamps: true,
  });

  return TreatmentCourse;
};
