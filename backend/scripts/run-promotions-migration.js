/**
 * Script to run promotions table migration
 * Removes unnecessary columns: usageCount, usageLimit, pointsRequired, isVoucher
 */

const path = require('path');
const fs = require('fs');

// Load .env file from backend directory
const backendEnvPath = path.join(__dirname, '../.env');
if (!fs.existsSync(backendEnvPath)) {
  console.error('❌ ERROR: backend/.env file not found at:', backendEnvPath);
  console.error('Please create backend/.env with database configuration');
  process.exit(1);
}

require('dotenv').config({ path: backendEnvPath });

const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'anhhthospa_db',
  port: parseInt(process.env.DB_PORT) || 3306
};

console.log('📋 Database Config:');
console.log('  Host:', dbConfig.host);
console.log('  Port:', dbConfig.port);
console.log('  Database:', dbConfig.database);
console.log('  User:', dbConfig.user);
console.log('');

async function runMigration() {
  let connection;
  
  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database successfully!\n');

    console.log('📋 Running promotions table migration...\n');

    // Step 1: Drop unnecessary columns
    console.log('1️⃣ Dropping usageCount column...');
    try {
      await connection.query('ALTER TABLE promotions DROP COLUMN usageCount');
      console.log('   ✅ usageCount dropped');
    } catch (err) {
      if (err.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.log('   ⚠️  usageCount column does not exist');
      } else {
        console.log('   ⚠️  Error:', err.message);
      }
    }

    console.log('2️⃣ Dropping usageLimit column...');
    try {
      await connection.query('ALTER TABLE promotions DROP COLUMN usageLimit');
      console.log('   ✅ usageLimit dropped');
    } catch (err) {
      if (err.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.log('   ⚠️  usageLimit column does not exist');
      } else {
        console.log('   ⚠️  Error:', err.message);
      }
    }

    console.log('3️⃣ Dropping pointsRequired column...');
    try {
      await connection.query('ALTER TABLE promotions DROP COLUMN pointsRequired');
      console.log('   ✅ pointsRequired dropped');
    } catch (err) {
      if (err.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.log('   ⚠️  pointsRequired column does not exist');
      } else {
        console.log('   ⚠️  Error:', err.message);
      }
    }

    console.log('4️⃣ Dropping isVoucher column...');
    try {
      await connection.query('ALTER TABLE promotions DROP COLUMN isVoucher');
      console.log('   ✅ isVoucher dropped');
    } catch (err) {
      if (err.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.log('   ⚠️  isVoucher column does not exist');
      } else {
        console.log('   ⚠️  Error:', err.message);
      }
    }

    // Step 2: Ensure stock column exists
    console.log('\n5️⃣ Checking stock column...');
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'promotions' AND COLUMN_NAME = 'stock'
    `, [dbConfig.database]);

    if (columns.length === 0) {
      console.log('   📝 Creating stock column...');
      await connection.query(`
        ALTER TABLE promotions 
        ADD COLUMN stock INT NULL 
        COMMENT 'Số lượng còn lại (NULL = không giới hạn)'
      `);
      console.log('   ✅ stock column created');
    } else {
      console.log('   ✅ stock column already exists');
    }

    // Step 3: Update stock for active promotions
    console.log('\n6️⃣ Updating stock for active promotions...');
    const [updateResult] = await connection.query(`
      UPDATE promotions 
      SET stock = 100 
      WHERE stock IS NULL AND isActive = 1
    `);
    console.log(`   ✅ Updated ${updateResult.affectedRows} promotions with stock = 100`);

    // Step 4: Show final table structure
    console.log('\n7️⃣ Final table structure:');
    const [tableInfo] = await connection.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'promotions'
      ORDER BY ORDINAL_POSITION
    `, [dbConfig.database]);
    
    console.table(tableInfo);

    // Step 5: Show sample data
    console.log('\n8️⃣ Sample promotions data:');
    const [promotions] = await connection.query(`
      SELECT id, code, title, discountType, discountValue, stock, isActive, expiryDate 
      FROM promotions 
      LIMIT 5
    `);
    console.table(promotions);

    console.log('\n✅ Migration completed successfully!');
    console.log('📊 Promotions table has been simplified.');
    console.log('   - Removed: usageCount, usageLimit, pointsRequired, isVoucher');
    console.log('   - Kept: stock (số lượng còn lại)\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed.');
    }
  }
}

// Run the migration
runMigration();
