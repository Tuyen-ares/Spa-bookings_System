'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('treatment_courses', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false,
      },
      serviceId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'services',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      serviceName: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Tên dịch vụ',
      },
      clientId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      totalSessions: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Tổng số buổi (dựa trên số lượng khách chọn khi đặt lịch)',
      },
      completedSessions: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Số buổi đã hoàn thành',
      },
      startDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: 'Ngày bắt đầu (từ ngày đặt lịch)',
      },
      durationWeeks: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Số tuần (mặc định: số dịch vụ + 1, admin có thể chỉnh)',
      },
      expiryDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: 'Hạn sử dụng (startDate + durationWeeks)',
      },
      frequencyType: {
        type: Sequelize.ENUM('weeks_per_session', 'sessions_per_week'),
        allowNull: true,
        comment: 'Loại tần suất: weeks_per_session = mấy tuần 1 lần, sessions_per_week = mấy lần 1 tuần',
      },
      frequencyValue: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Giá trị tần suất (ví dụ: 2 tuần 1 lần hoặc 2 lần/tuần)',
      },
      therapistId: {
        type: Sequelize.STRING,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        comment: 'ID nhân viên phụ trách',
      },
      status: {
        type: Sequelize.ENUM('active', 'completed', 'expired', 'cancelled'),
        allowNull: false,
        defaultValue: 'active',
        comment: 'Trạng thái liệu trình',
      },
      paymentStatus: {
        type: Sequelize.ENUM('Paid', 'Unpaid'),
        allowNull: false,
        defaultValue: 'Unpaid',
        comment: 'Trạng thái thanh toán (Đã thanh toán, Chưa thanh toán)',
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Ghi chú tổng quan',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'Ngày tạo',
      },
    });

    // Add indexes
    await queryInterface.addIndex('treatment_courses', ['serviceId'], {
      name: 'idx_tc_service',
    });
    await queryInterface.addIndex('treatment_courses', ['clientId'], {
      name: 'idx_tc_client',
    });
    await queryInterface.addIndex('treatment_courses', ['therapistId'], {
      name: 'idx_tc_therapist',
    });
    await queryInterface.addIndex('treatment_courses', ['status'], {
      name: 'idx_tc_status',
    });
    await queryInterface.addIndex('treatment_courses', ['expiryDate'], {
      name: 'idx_tc_expiry',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('treatment_courses');
  }
};

