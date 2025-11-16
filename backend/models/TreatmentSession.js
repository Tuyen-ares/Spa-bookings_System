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
      // Foreign key via associations
    },
    sessionNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Buổi thứ mấy (1, 2, 3...)',
    },
    appointmentId: {
      type: DataTypes.STRING,
      allowNull: true,
      // Foreign key via associations
      comment: 'Link to appointment nếu đã đặt lịch',
    },
    scheduledDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: 'Ngày dự kiến thực hiện',
    },
    scheduledTime: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Giờ dự kiến (VD: 09:00)',
    },
    completedDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Ngày thực tế hoàn thành',
    },
    therapistId: {
      type: DataTypes.STRING,
      allowNull: true,
      // Foreign key via associations
    },
    therapistName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('scheduled', 'completed', 'cancelled', 'missed', 'pending'),
      allowNull: false,
      defaultValue: 'pending',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Ghi chú trước buổi (từ khách hàng)',
    },
    therapistNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Ghi chú sau buổi (từ chuyên viên)',
    },
    skinCondition: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Tình trạng da quan sát được',
    },
    productsUsed: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Danh sách sản phẩm đã sử dụng',
    },
    nextSessionRecommendation: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Đề xuất cho buổi tiếp theo',
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Đánh giá của khách (1-5 sao)',
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
    tableName: 'treatment_sessions',
    timestamps: true,
  });

  return TreatmentSession;
};
