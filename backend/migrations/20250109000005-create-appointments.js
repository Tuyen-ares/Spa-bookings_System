'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('appointments', {
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
      userId: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'ID khách hàng',
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      userName: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Tên khách hàng (để hiển thị trên lịch)'
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: 'Ngày hẹn (YYYY-MM-DD)'
      },
      time: {
        type: Sequelize.STRING(10),
        allowNull: false,
        comment: 'Giờ hẹn (HH:MM)'
      },
      status: {
        type: Sequelize.ENUM('upcoming', 'completed', 'cancelled', 'pending', 'in-progress'),
        allowNull: false,
        defaultValue: 'pending',
        comment: 'pending=chờ duyệt, upcoming=đã duyệt, in-progress=đang thực hiện, completed=hoàn thành, cancelled=đã hủy'
      },
      paymentStatus: {
        type: Sequelize.ENUM('Paid', 'Unpaid'),
        allowNull: true,
        defaultValue: 'Unpaid'
      },
      therapist: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Tên nhân viên (để hiển thị trên lịch)'
      },
      therapistId: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'ID nhân viên',
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      notesForTherapist: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      staffNotesAfterSession: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      isStarted: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false
      },
      isCompleted: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false
      },
      reviewRating: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Đánh giá sau khi hoàn thành (1-5)'
      },
      rejectionReason: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Lý do từ chối/hủy (Admin từ chối)'
      },
      bookingGroupId: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Nhóm các booking cùng một lần đặt'
      },
      roomId: {
        type: Sequelize.STRING,
        allowNull: true
      }
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      timestamps: false
    });

    // Add indexes
    await queryInterface.addIndex('appointments', ['date', 'time'], {
      name: 'date_time'
    });
    await queryInterface.addIndex('appointments', ['status'], {
      name: 'status'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('appointments');
  }
};
