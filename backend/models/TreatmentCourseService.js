// backend/models/TreatmentCourseService.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TreatmentCourseService = sequelize.define('TreatmentCourseService', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    treatmentCourseId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      references: {
        model: 'treatment_courses',
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
      comment: 'Thứ tự thực hiện dịch vụ trong liệu trình'
    }
  }, {
    tableName: 'treatment_course_services',
    timestamps: true,
    indexes: [
      {
        fields: ['treatmentCourseId']
      },
      {
        fields: ['serviceId']
      }
    ]
  });

  return TreatmentCourseService;
};
