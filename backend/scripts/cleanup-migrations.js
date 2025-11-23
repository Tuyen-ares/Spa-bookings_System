// Script to clean up deleted migration records from SequelizeMeta
require('dotenv').config();
const mysql = require('mysql2/promise');

async function cleanupMigrations() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT) || 3307,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'anhthospa_db',
  });

  try {
    // List of deleted migration files
    const deletedMigrations = [
      '20250113000002-create-rooms.js', // Không có trong db.txt
      '20250116000001-alter-services-imageurl-to-longtext.js',
      '20250116000003-add-pending-status-to-treatment-courses.js',
      '20250116000004-add-points-required-to-promotions.js',
      '20250117000001-add-payment-status-to-treatment-courses.js',
      '20250120000001-add-promotion-id-to-appointments.js',
      '20250120000003-add-is-public-to-promotions.js',
      '20251123123601-remove-imageUrl-from-promotions.js',
    ];

    console.log('Cleaning up deleted migration records...');

    for (const migration of deletedMigrations) {
      const [result] = await connection.execute(
        'DELETE FROM SequelizeMeta WHERE name = ?',
        [migration]
      );
      if (result.affectedRows > 0) {
        console.log(`✓ Removed: ${migration}`);
      } else {
        console.log(`- Not found: ${migration}`);
      }
    }

    console.log('\nCleanup completed!');
  } catch (error) {
    console.error('Error cleaning up migrations:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

cleanupMigrations()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });

