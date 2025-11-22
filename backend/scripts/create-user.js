// Create a new user in database
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function createUser() {
  try {
    const email = 'hoantuyen2004@gmail.com';
    const password = '123456';
    const name = 'Hoàn Tuyền';
    
    console.log('🔧 Creating user...\n');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Name: ${name}\n`);
    
    // Check if user exists
    const existingUser = await db.User.findOne({ 
      where: db.sequelize.where(
        db.sequelize.fn('LOWER', db.sequelize.col('email')),
        email.toLowerCase()
      )
    });
    
    if (existingUser) {
      console.log('⚠️  User already exists!');
      console.log(`   ID: ${existingUser.id}`);
      console.log(`   Name: ${existingUser.name}`);
      console.log(`   Role: ${existingUser.role}`);
      console.log(`   Status: ${existingUser.status}\n`);
      
      // Update password
      const hashedPassword = await bcrypt.hash(password, 10);
      await existingUser.update({ password: hashedPassword });
      console.log('✅ Password updated successfully!');
    } else {
      // Create new user
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const user = await db.User.create({
        id: `user-${uuidv4()}`,
        email: email,
        name: name,
        password: hashedPassword,
        phone: null,
        role: 'Client',
        status: 'Active',
        joinDate: new Date().toISOString().split('T')[0],
        birthday: null,
        gender: null,
        profilePictureUrl: null,
        lastLogin: null
      });
      
      console.log('✅ User created successfully!');
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Role: ${user.role}\n`);
      
      // Create wallet for client
      await db.Wallet.create({
        id: `wallet-${uuidv4()}`,
        userId: user.id,
        points: 0,
        tierLevel: 1,
        totalSpent: 0,
        lastUpdated: new Date()
      });
      
      console.log('✅ Wallet created for user!');
    }
    
    console.log('\n📝 Login credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    
    await db.sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

createUser();

