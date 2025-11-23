'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add 'Pending' to status enum
    await queryInterface.sequelize.query(`
      ALTER TABLE users 
      MODIFY COLUMN status ENUM('Active', 'Inactive', 'Locked', 'Pending') 
      NOT NULL DEFAULT 'Active'
    `);

    // Add emailVerificationToken field
    await queryInterface.addColumn('users', 'emailVerificationToken', {
      type: Sequelize.STRING(255),
      allowNull: true,
      unique: true,
    });

    // Add isEmailVerified field
    await queryInterface.addColumn('users', 'isEmailVerified', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove columns
    await queryInterface.removeColumn('users', 'emailVerificationToken');
    await queryInterface.removeColumn('users', 'isEmailVerified');

    // Revert status enum (remove 'Pending')
    await queryInterface.sequelize.query(`
      ALTER TABLE users 
      MODIFY COLUMN status ENUM('Active', 'Inactive', 'Locked') 
      NOT NULL DEFAULT 'Active'
    `);
  }
};
