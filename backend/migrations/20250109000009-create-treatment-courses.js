'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('treatment_courses', {
      id: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true
      },
      serviceId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'services',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      serviceName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      totalSessions: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Tổng số buổi trong liệu trình'
      },
      sessionsPerWeek: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: 'Số buổi mỗi tuần'
      },
      weekDays: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Mảng các thứ trong tuần: [1,3,5] = Thứ 2, Thứ 4, Thứ 6'
      },
      sessionDuration: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 60,
        comment: 'Thời gian mỗi buổi (phút)'
      },
      sessionTime: {
        type: Sequelize.STRING(10),
        allowNull: true,
        comment: 'Giờ cố định cho các buổi (ví dụ: "18:00")'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Mô tả liệu trình'
      },
      imageUrl: {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: 'URL hình ảnh liệu trình'
      },
      sessions: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Mảng các buổi điều trị: [{date, therapist, notes, status}]'
      },
      initialAppointmentId: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'ID appointment đầu tiên (để lấy userId)',
        references: {
          model: 'appointments',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      clientId: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'ID khách hàng (NULL cho template)',
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      therapistId: {
        type: Sequelize.STRING,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      status: {
        type: Sequelize.ENUM('active', 'completed', 'paused'),
        allowNull: false,
        defaultValue: 'active'
      },
      expiryDate: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: 'Hạn sử dụng liệu trình'
      },
      nextAppointmentDate: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: 'Ngày hẹn tiếp theo (để nhắc nhở)'
      }
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      timestamps: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('treatment_courses');
  }
};
