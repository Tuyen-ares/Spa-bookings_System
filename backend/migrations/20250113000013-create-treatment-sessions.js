'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('treatment_sessions', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false,
      },
      treatmentCourseId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'treatment_courses',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        comment: 'ID liệu trình',
      },
      appointmentId: {
        type: Sequelize.STRING,
        allowNull: true,
        references: {
          model: 'appointments',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        comment: 'ID lịch hẹn (liên kết với appointments)',
      },
      sessionNumber: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Số thứ tự buổi (1, 2, 3, ...)',
      },
      status: {
        type: Sequelize.ENUM('scheduled', 'completed', 'cancelled', 'missed'),
        allowNull: false,
        defaultValue: 'scheduled',
        comment: 'Trạng thái buổi điều trị',
      },
      sessionDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: 'Ngày thực hiện',
      },
      sessionTime: {
        type: Sequelize.STRING(10),
        allowNull: false,
        comment: 'Giờ thực hiện (HH:MM)',
      },
      staffId: {
        type: Sequelize.STRING,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        comment: 'ID nhân viên thực hiện',
      },
      customerStatusNotes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Ghi chú tình trạng khách (TEXT, không phải ENUM) - Ví dụ: "Khách ổn, da sáng hơn, không có kích ứng"',
      },
      adminNotes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Ghi chú của admin sau buổi',
      },
      completedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Ngày hoàn thành',
      },
    });

    // Add indexes
    await queryInterface.addIndex('treatment_sessions', ['treatmentCourseId'], {
      name: 'idx_ts_course',
    });
    await queryInterface.addIndex('treatment_sessions', ['appointmentId'], {
      name: 'idx_ts_appointment',
    });
    await queryInterface.addIndex('treatment_sessions', ['staffId'], {
      name: 'idx_ts_staff',
    });
    await queryInterface.addIndex('treatment_sessions', ['sessionDate'], {
      name: 'idx_ts_date',
    });
    await queryInterface.addIndex('treatment_sessions', ['status'], {
      name: 'idx_ts_status',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('treatment_sessions');
  }
};

