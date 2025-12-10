const db = require('../config/database');
const serviceService = require('../services/serviceService');

(async () => {
  try {
    await db.sequelize.authenticate();
    console.log('DB connected');
    try {
      await serviceService.deleteService('svc-facial-acne');
      console.log('DELETE SUCCEEDED - BUG!');
    } catch (e) {
      console.log('DELETE FAILED (EXPECTED):', e.message);
    }
    process.exit(0);
  } catch (err) {
    console.error('DB connection error', err);
    process.exit(1);
  }
})();