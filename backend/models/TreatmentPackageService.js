// backend/models/TreatmentPackageService.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TreatmentPackageService = sequelize.define('TreatmentPackageService', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    treatmentPackageId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      references: {
        model: 'treatment_packages',
        key: 'id'
      }
    },
    serviceId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      references: {
        model: 'services',
        key: 'id'
      }
    },
    serviceName: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Cached service name for performance'
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: 'Thứ tự thực hiện dịch vụ trong gói'
    },
    sessionsPerService: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: 'Số buổi cho mỗi dịch vụ này trong gói'
    }
  }, {
    tableName: 'treatment_package_services',
    timestamps: true,
    indexes: [
      {
        fields: ['treatmentPackageId']
      },
      {
        fields: ['serviceId']
      }
    ]
  });

  return TreatmentPackageService;
};
