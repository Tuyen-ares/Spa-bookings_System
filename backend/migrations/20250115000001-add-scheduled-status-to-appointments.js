'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add 'scheduled' to the status enum
    await queryInterface.sequelize.query(
      `ALTER TABLE appointments MODIFY COLUMN status ENUM('upcoming', 'completed', 'cancelled', 'pending', 'in-progress', 'scheduled') NOT NULL DEFAULT 'pending'`
    );
  },

  async down(queryInterface, Sequelize) {
    // Remove 'scheduled' from the status enum
    await queryInterface.sequelize.query(
      `ALTER TABLE appointments MODIFY COLUMN status ENUM('upcoming', 'completed', 'cancelled', 'pending', 'in-progress') NOT NULL DEFAULT 'pending'`
    );
  }
};
