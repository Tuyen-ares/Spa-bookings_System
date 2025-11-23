// Script to fix database schema to match db.txt
require('dotenv').config();
const mysql = require('mysql2/promise');

async function fixSchema() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT) || 3307,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'anhthospa_db',
  });

  try {
    console.log('Fixing database schema...\n');
    
    // Check if imageUrl column exists in promotions
    const [columns] = await connection.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'promotions' AND COLUMN_NAME = 'imageUrl'`,
      [process.env.DB_NAME || 'anhthospa_db']
    );

    if (columns.length > 0) {
      console.log('Removing imageUrl column from promotions table...');
      await connection.execute('ALTER TABLE promotions DROP COLUMN imageUrl');
      console.log('✓ Removed imageUrl column');
    } else {
      console.log('✓ imageUrl column does not exist (already removed)');
    }

    // Check for rooms table (not in db.txt)
    const [roomsTable] = await connection.execute(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'rooms'`,
      [process.env.DB_NAME || 'anhthospa_db']
    );

    if (roomsTable.length > 0) {
      console.log('\n⚠️  Table "rooms" exists but is not in db.txt');
      console.log('   Keeping it for now (may be used by other parts of the system)');
    }

    // Check for staff_availability table (not in db.txt)
    const [staffAvailTable] = await connection.execute(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'staff_availability'`,
      [process.env.DB_NAME || 'anhthospa_db']
    );

    if (staffAvailTable.length > 0) {
      console.log('⚠️  Table "staff_availability" exists but is not in db.txt');
      console.log('   Keeping it for now (may be used by other parts of the system)');
    }

    console.log('\nSchema fix completed!');
  } catch (error) {
    console.error('Error fixing schema:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

fixSchema()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });

