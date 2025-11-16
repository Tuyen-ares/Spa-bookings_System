// backend/models/TreatmentPackage.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TreatmentPackage = sequelize.define('TreatmentPackage', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Tên gói liệu trình (VD: Liệu trình làm sáng da toàn diện)',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Mô tả chi tiết về gói liệu trình',
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Giá của gói liệu trình',
    },
    originalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Giá gốc (để hiển thị giảm giá)',
    },
    totalSessions: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10,
      comment: 'Tổng số buổi trong gói',
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Thời hạn sử dụng (số ngày)',
    },
    benefits: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Lợi ích của gói liệu trình (JSON array)',
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Ảnh đại diện cho gói',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Gói có đang hoạt động không',
    },
    isFeatured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Gói có được nổi bật không',
    },
    displayOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Thứ tự hiển thị',
    },
    minSessionsPerWeek: {
      type: DataTypes.INTEGER,
      defaultValue: 2,
      comment: 'Số buổi tối thiểu mỗi tuần',
    },
    maxSessionsPerWeek: {
      type: DataTypes.INTEGER,
      defaultValue: 3,
      comment: 'Số buổi tối đa mỗi tuần',
    }
  }, {
    tableName: 'treatment_packages',
    timestamps: true,
    indexes: [
      {
        fields: ['isActive']
      },
      {
        fields: ['isFeatured']
      },
      {
        fields: ['displayOrder']
      }
    ]
  });

  return TreatmentPackage;
};
