'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Alter imageUrl column from TEXT/varchar to LONGTEXT
    await queryInterface.sequelize.query(`
      ALTER TABLE services 
      MODIFY COLUMN imageUrl LONGTEXT DEFAULT NULL
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Revert back to TEXT (not varchar(500) to avoid data loss)
    await queryInterface.sequelize.query(`
      ALTER TABLE services 
      MODIFY COLUMN imageUrl TEXT DEFAULT NULL
    `);
  }
};

