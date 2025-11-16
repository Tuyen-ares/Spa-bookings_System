const db = require('./config/database');

async function checkColumns() {
  try {
    const [treatmentCoursesColumns] = await db.sequelize.query(
      `SHOW FULL COLUMNS FROM treatment_courses WHERE Field = 'id'`
    );
    
    const [servicesColumns] = await db.sequelize.query(
      `SHOW FULL COLUMNS FROM services WHERE Field = 'id'`
    );
    
    console.log('treatment_courses.id:', JSON.stringify(treatmentCoursesColumns[0], null, 2));
    console.log('\nservices.id:', JSON.stringify(servicesColumns[0], null, 2));
    
    await db.sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkColumns();

