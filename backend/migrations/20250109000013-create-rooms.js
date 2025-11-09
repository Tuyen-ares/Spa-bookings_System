'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('rooms', {
      id: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      capacity: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 1
      },
      equipmentIds: {
        type: Sequelize.JSON,
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

    // Add foreign key to appointments table
    await queryInterface.addConstraint('appointments', {
      fields: ['roomId'],
      type: 'foreign key',
      name: 'appointments_fk_room',
      references: {
        table: 'rooms',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove foreign key first
    await queryInterface.removeConstraint('appointments', 'appointments_fk_room');
    await queryInterface.dropTable('rooms');
  }
};
