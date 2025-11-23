'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add passwordResetToken field
    await queryInterface.addColumn('users', 'passwordResetToken', {
      type: Sequelize.STRING(255),
      allowNull: true,
      unique: true,
    });

    // Add passwordResetTokenExpires field (optional, for token expiration)
    await queryInterface.addColumn('users', 'passwordResetTokenExpires', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove columns
    await queryInterface.removeColumn('users', 'passwordResetToken');
    await queryInterface.removeColumn('users', 'passwordResetTokenExpires');
  }
};
