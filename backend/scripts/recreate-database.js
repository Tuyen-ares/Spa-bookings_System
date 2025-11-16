// Script to drop all tables and recreate database schema
require('dotenv').config();
const db = require('../config/database');

async function recreateDatabase() {
    try {
        console.log('🔄 Starting database recreation...\n');

        // Drop all tables in correct order (reverse of dependencies)
        console.log('📦 Dropping all tables...');
        
        await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');
        
        const tablesToDrop = [
            'treatment_package_services',
            'treatment_course_services',
            'treatment_sessions',
            'treatment_courses',
            'treatment_packages',
            'treatment_reminders',
            'redeemed_rewards',
            'redeemedrewards',
            'reviews',
            'appointments',
            'staff_shifts',
            'staff_availability',
            'staff_tasks',
            'payments',
            'sales',
            'products',
            'promotions',
            'notifications',
            'internal_notifications',
            'internal_news',
            'wallets',
            'points_history',
            'missions',
            'tiers',
            'rooms',
            'service_categories',
            'services',
            'users'
        ];

        for (const table of tablesToDrop) {
            try {
                await db.sequelize.query(`DROP TABLE IF EXISTS \`${table}\`;`);
                console.log(`  ✅ Dropped ${table}`);
            } catch (error) {
                console.log(`  ⚠️  ${table} not found or already dropped`);
            }
        }

        await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
        
        console.log('\n✅ All tables dropped successfully!\n');

        // Sync all models (create tables) without foreign key constraints first
        console.log('📦 Creating all tables...\n');
        
        // Temporarily disable foreign key checks
        await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');
        
        // Sync all models at once
        await db.sequelize.sync({ force: false, alter: false });
        
        // Re-enable foreign key checks
        await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
        
        console.log('\n✅ All tables created successfully!\n');
        
        console.log('🎉 Database recreation completed!\n');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error recreating database:', error);
        process.exit(1);
    }
}

recreateDatabase();
