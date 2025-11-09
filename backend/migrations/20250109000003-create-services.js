'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('services', {
      id: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      longDescription: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      duration: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Duration in minutes'
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      discountPrice: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      imageUrl: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      category: {
        type: Sequelize.STRING,
        allowNull: true
      },
      categoryId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'service_categories',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      rating: {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: true,
        defaultValue: 0.00
      },
      reviewCount: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0
      },
      isHot: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false
      },
      isNew: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false
      },
      promoExpiryDate: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: true
      }
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      timestamps: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('services');
  }
};
