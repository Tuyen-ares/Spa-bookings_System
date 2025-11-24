// backend/models/TreatmentCourse.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TreatmentCourse = sequelize.define('TreatmentCourse', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    serviceId: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'ID dịch vụ (liệu trình gắn liền với dịch vụ)',
    },
    serviceName: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Tên dịch vụ',
    },
    clientId: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'ID khách hàng',
    },
    totalSessions: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Tổng số buổi (dựa trên số lượng khách chọn khi đặt lịch)',
    },
    completedSessions: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Số buổi đã hoàn thành',
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: 'Ngày bắt đầu (từ ngày đặt lịch)',
    },
    durationWeeks: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Số tuần (mặc định: số dịch vụ + 1, admin có thể chỉnh)',
    },
    expiryDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: 'Hạn sử dụng (startDate + durationWeeks)',
    },
    frequencyType: {
      type: DataTypes.ENUM('weeks_per_session', 'sessions_per_week'),
      allowNull: true,
      comment: 'Loại tần suất: weeks_per_session = mấy tuần 1 lần, sessions_per_week = mấy lần 1 tuần',
    },
    frequencyValue: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Giá trị tần suất (ví dụ: 2 tuần 1 lần hoặc 2 lần/tuần)',
    },
    therapistId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'ID nhân viên phụ trách',
    },
    status: {
      type: DataTypes.ENUM('active', 'completed', 'expired', 'cancelled'),
      allowNull: false,
      defaultValue: 'active',
      comment: 'Trạng thái liệu trình',
    },
    paymentStatus: {
      type: DataTypes.ENUM('Paid', 'Unpaid'),
      allowNull: false,
      defaultValue: 'Unpaid',
      comment: 'Trạng thái thanh toán (Đã thanh toán, Chưa thanh toán)',
    },
    totalAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      defaultValue: null,
      comment: 'Tổng số tiền thực tế khi khách đặt lịch (sau khi áp dụng giảm giá/voucher)',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Ghi chú tổng quan',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Ngày tạo',
    },
  }, {
    tableName: 'treatment_courses',
    timestamps: false, // Using createdAt manually
  });

  return TreatmentCourse;
};

