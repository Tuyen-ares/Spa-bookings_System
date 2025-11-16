/**
 * Script to fix existing cash payments status from 'Completed' to 'Pending'
 * Run this once to migrate old data
 */

const { Sequelize } = require('sequelize');
const path = require('path');

// Load database configuration
const dbConfig = require('../config/database');

async function fixCashPayments() {
    console.log('🔧 Starting cash payment status migration...\n');

    const sequelize = new Sequelize(
        dbConfig.database,
        dbConfig.username,
        dbConfig.password,
        {
            host: dbConfig.host,
            port: dbConfig.port,
            dialect: 'mysql',
            logging: false
        }
    );

    try {
        // Test connection
        await sequelize.authenticate();
        console.log('✅ Database connection established\n');

        // Update all Cash payments that are 'Completed' to 'Pending'
        const [results] = await sequelize.query(`
            UPDATE payments 
            SET status = 'Pending' 
            WHERE method = 'Cash' 
            AND status = 'Completed'
        `);

        console.log(`✅ Updated ${results.affectedRows} cash payment(s) from 'Completed' to 'Pending'\n`);

        // Update corresponding appointments to 'Unpaid'
        const [appointmentResults] = await sequelize.query(`
            UPDATE appointments a
            INNER JOIN payments p ON a.id = p.appointmentId
            SET a.paymentStatus = 'Unpaid'
            WHERE p.method = 'Cash' 
            AND p.status = 'Pending'
        `);

        console.log(`✅ Updated ${appointmentResults.affectedRows} appointment(s) payment status to 'Unpaid'\n`);

        console.log('🎉 Migration completed successfully!');

    } catch (error) {
        console.error('❌ Error during migration:', error);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}

// Run the migration
fixCashPayments();
