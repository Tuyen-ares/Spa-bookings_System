'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('staff_availability', {
      id: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true
      },
      staffId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: 'Ngày cụ thể (NULL nếu là lịch định kỳ)'
      },
      dayOfWeek: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Thứ trong tuần: 0=CN, 1=T2, ..., 6=T7 (NULL nếu là lịch cụ thể)'
      },
      startTime: {
        type: Sequelize.STRING(10),
        allowNull: true,
        comment: 'Giờ bắt đầu (HH:MM) cho lịch định kỳ'
      },
      endTime: {
        type: Sequelize.STRING(10),
        allowNull: true,
        comment: 'Giờ kết thúc (HH:MM) cho lịch định kỳ'
      },
      isAvailable: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: true,
        comment: 'Có sẵn sàng không (cho lịch định kỳ)'
      },
      timeSlots: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Mảng: [{time: "09:00", availableServiceIds: ["sv1", "sv2"]}] (cho lịch cụ thể)'
      }
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      timestamps: false
    });

    // Add indexes
    await queryInterface.addIndex('staff_availability', ['staffId', 'date'], {
      name: 'staffId_date'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('staff_availability');
  }
};
