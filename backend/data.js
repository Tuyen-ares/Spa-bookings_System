
// This file will now only export constants that are NOT directly managed by the database.
// All mutable data arrays (users, services, appointments, etc.) are removed
// because they will be managed by Sequelize models and database interactions.

const {
    AVAILABLE_SPECIALTIES,
    PROMOTION_TARGET_AUDIENCES,
    AVAILABLE_TIMES,
    STANDARD_WORK_TIMES,
    LUCKY_WHEEL_PRIZES,
} = require('./constants.js');

// Export only the static constants
module.exports = {
    AVAILABLE_SPECIALTIES,
    PROMOTION_TARGET_AUDIENCES,
    AVAILABLE_TIMES,
    STANDARD_WORK_TIMES,
    LUCKY_WHEEL_PRIZES,
};
