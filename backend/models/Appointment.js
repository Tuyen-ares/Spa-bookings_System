// backend/models/Appointment.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Appointment = sequelize.define('Appointment', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    serviceId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'services', // refers to Service model
        key: 'id',
      },
    },
    serviceName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'users', // refers to User model (client)
        key: 'id',
      },
    },
    userName: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Tên khách hàng (để hiển thị trên lịch)',
    },
    date: {
      type: DataTypes.DATEONLY, // YYYY-MM-DD
      allowNull: false,
    },
    time: {
      type: DataTypes.STRING, // e.g., 'HH:MM'
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('upcoming', 'completed', 'cancelled', 'pending', 'in-progress', 'scheduled'),
      allowNull: false,
      defaultValue: 'pending',
    },
    paymentStatus: {
      type: DataTypes.ENUM('Paid', 'Unpaid'),
      allowNull: true,
      defaultValue: 'Unpaid',
    },
    therapist: { // Name of the therapist
      type: DataTypes.STRING,
      allowNull: true,
    },
    therapistId: { // ID of the therapist (User.id where role is Technician)
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'users', // refers to User model (staff)
        key: 'id',
      },
    },
    notesForTherapist: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    staffNotesAfterSession: {
      type: DataTypes.TEXT,
      allowNull: true, // This can also serve as a customer's review comment
    },
    isStarted: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    isCompleted: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    reviewRating: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    rejectionReason: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    bookingGroupId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    roomId: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'rooms',
        key: 'id',
      },
    },
    treatmentCourseId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Link to treatment course if this appointment is part of a course',
    },
    treatmentSessionId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Link to specific session in treatment course',
    }
  }, {
    tableName: 'appointments',
    timestamps: false,
  });

  return Appointment;
};
