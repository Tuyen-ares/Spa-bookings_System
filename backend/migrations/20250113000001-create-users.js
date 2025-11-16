'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      profilePictureUrl: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      joinDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      birthday: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      gender: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      role: {
        type: Sequelize.ENUM('Admin', 'Staff', 'Client'),
        allowNull: false,
        defaultValue: 'Client',
      },
      status: {
        type: Sequelize.ENUM('Active', 'Inactive', 'Locked'),
        allowNull: false,
        defaultValue: 'Active',
      },
      lastLogin: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      loginHistory: {
        type: Sequelize.JSON,
        allowNull: true,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('users');
  }
};
