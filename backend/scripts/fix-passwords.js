// Fix passwords for all users in database
const bcrypt = require('bcryptjs');
const db = require('../config/database');

async function fixPasswords() {
  try {
    console.log('🔧 Fixing passwords for all users...\n');
    
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    console.log(`New password hash: ${hashedPassword.substring(0, 30)}...\n`);
    
    // Get all users
    const users = await db.User.findAll();
    console.log(`Found ${users.length} users to update\n`);
    
    // Update all users with new password hash
    for (const user of users) {
      await user.update({ password: hashedPassword });
      console.log(`✅ Updated password for: ${user.email} (${user.name})`);
    }
    
    console.log(`\n✅ Successfully updated ${users.length} users`);
    console.log(`\n📝 Login credentials:`);
    console.log(`   Email: admin@spa.vn`);
    console.log(`   Password: ${password}`);
    
    await db.sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

fixPasswords();

