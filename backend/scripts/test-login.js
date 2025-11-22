// Test login script to verify password hashing
const bcrypt = require('bcryptjs');
const db = require('../config/database');

async function testLogin() {
  try {
    console.log('🔍 Testing login...\n');
    
    // Test email and password
    const testEmail = 'admin@spa.vn';
    const testPassword = 'password123';
    
    console.log(`Email: ${testEmail}`);
    console.log(`Password: ${testPassword}\n`);
    
    // Find user
    const user = await db.User.findOne({ where: { email: testEmail } });
    
    if (!user) {
      console.log('❌ User not found in database!');
      console.log('\n📋 Checking all users in database:');
      const allUsers = await db.User.findAll({
        attributes: ['id', 'email', 'name', 'role']
      });
      console.log(`Found ${allUsers.length} users:`);
      allUsers.forEach(u => {
        console.log(`  - ${u.email} (${u.name}, ${u.role})`);
      });
      return;
    }
    
    console.log('✅ User found:');
    console.log(`  ID: ${user.id}`);
    console.log(`  Name: ${user.name}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Role: ${user.role}`);
    console.log(`  Status: ${user.status}`);
    console.log(`  Password hash: ${user.password.substring(0, 20)}...`);
    console.log(`  Password hash length: ${user.password.length}\n`);
    
    // Test password comparison
    console.log('🔐 Testing password comparison...');
    const isValid = await bcrypt.compare(testPassword, user.password);
    
    if (isValid) {
      console.log('✅ Password is VALID!');
    } else {
      console.log('❌ Password is INVALID!');
      console.log('\n🔧 Testing hash generation...');
      const newHash = await bcrypt.hash(testPassword, 10);
      console.log(`New hash: ${newHash.substring(0, 20)}...`);
      console.log(`Old hash: ${user.password.substring(0, 20)}...`);
      console.log('\n⚠️  Hashes are different. Need to update password in database.');
    }
    
    await db.sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testLogin();

