// Script to check database schema matches db.txt
require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkSchema() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT) || 3307,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'anhthospa_db',
  });

  try {
    console.log('Checking database schema...\n');
    
    // Get all tables
    const [tables] = await connection.execute(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE' 
       AND TABLE_NAME != 'SequelizeMeta'
       ORDER BY TABLE_NAME`,
      [process.env.DB_NAME || 'anhthospa_db']
    );

    console.log('Tables in database:');
    tables.forEach(table => {
      console.log(`  - ${table.TABLE_NAME}`);
    });

    // Check for rooms table (should not exist)
    const roomsTable = tables.find(t => t.TABLE_NAME === 'rooms');
    if (roomsTable) {
      console.log('\n⚠️  WARNING: Table "rooms" exists but is not in db.txt');
      console.log('   Consider dropping it if not needed.');
    }

    // Check promotions table structure
    const [promoColumns] = await connection.execute(
      `SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'promotions'
       ORDER BY ORDINAL_POSITION`,
      [process.env.DB_NAME || 'anhthospa_db']
    );

    console.log('\nPromotions table columns:');
    promoColumns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE}, nullable: ${col.IS_NULLABLE})`);
    });

    // Check if imageUrl exists (should not)
    const imageUrlCol = promoColumns.find(c => c.COLUMN_NAME === 'imageUrl');
    if (imageUrlCol) {
      console.log('\n❌ ERROR: Column "imageUrl" still exists in promotions table!');
    } else {
      console.log('\n✓ OK: Column "imageUrl" does not exist in promotions table');
    }

    // Check if isPublic and pointsRequired exist (should)
    const isPublicCol = promoColumns.find(c => c.COLUMN_NAME === 'isPublic');
    const pointsRequiredCol = promoColumns.find(c => c.COLUMN_NAME === 'pointsRequired');
    
    if (!isPublicCol) {
      console.log('❌ ERROR: Column "isPublic" does not exist in promotions table!');
    } else {
      console.log('✓ OK: Column "isPublic" exists');
    }
    
    if (!pointsRequiredCol) {
      console.log('❌ ERROR: Column "pointsRequired" does not exist in promotions table!');
    } else {
      console.log('✓ OK: Column "pointsRequired" exists');
    }

    // Check appointments table for promotionId
    const [apptColumns] = await connection.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'appointments'`,
      [process.env.DB_NAME || 'anhthospa_db']
    );

    const promotionIdCol = apptColumns.find(c => c.COLUMN_NAME === 'promotionId');
    if (!promotionIdCol) {
      console.log('\n❌ ERROR: Column "promotionId" does not exist in appointments table!');
    } else {
      console.log('\n✓ OK: Column "promotionId" exists in appointments table');
    }

    // Check treatment_courses for paymentStatus
    const [tcColumns] = await connection.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'treatment_courses'`,
      [process.env.DB_NAME || 'anhthospa_db']
    );

    const paymentStatusCol = tcColumns.find(c => c.COLUMN_NAME === 'paymentStatus');
    if (!paymentStatusCol) {
      console.log('❌ ERROR: Column "paymentStatus" does not exist in treatment_courses table!');
    } else {
      console.log('✓ OK: Column "paymentStatus" exists in treatment_courses table');
    }

    console.log('\nSchema check completed!');
  } catch (error) {
    console.error('Error checking schema:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

checkSchema()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });

