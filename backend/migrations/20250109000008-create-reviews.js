'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('reviews', {
      id: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true
      },
      userId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
        allowNull: true
      },
      appointmentId: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
        references: {
          model: 'appointments',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      userName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      userImageUrl: {
        type: Sequelize.STRING,
        allowNull: true
      },
      rating: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Điểm đánh giá (1-5)'
      },
      comment: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      images: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Mảng URL ảnh đánh giá: ["url1", "url2"]'
      },
      date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      managerReply: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Phản hồi từ quản lý'
      },
      isHidden: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      }
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      timestamps: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('reviews');
  }
};
