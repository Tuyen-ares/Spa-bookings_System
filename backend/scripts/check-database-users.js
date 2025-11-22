// Check all users in database
const db = require('../config/database');

async function checkUsers() {
  try {
    console.log('🔍 Checking users in database...\n');
    
    const users = await db.User.findAll({
      attributes: ['id', 'email', 'name', 'role', 'status'],
      order: [['email', 'ASC']]
    });
    
    console.log(`Found ${users.length} users:\n`);
    
    if (users.length === 0) {
      console.log('⚠️  No users found in database!');
      console.log('💡 Run seed data: npx sequelize-cli db:seed:all');
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email}`);
        console.log(`   Name: ${user.name}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Status: ${user.status}`);
        console.log('');
      });
    }
    
    await db.sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

checkUsers();

