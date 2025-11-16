'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('services', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      longDescription: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      discountPercent: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
        comment: 'Phần trăm giảm giá (0-100)',
      },
      duration: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Thời gian dịch vụ (phút)',
      },
      category: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Tên danh mục (để hiển thị)',
      },
      categoryId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'service_categories',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      imageUrl: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      rating: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      reviewCount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      popularity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      benefits: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      suitableFor: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      process: {
        type: Sequelize.JSON,
        allowNull: true,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('services');
  }
};
