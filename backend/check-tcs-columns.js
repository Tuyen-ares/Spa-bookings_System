const db = require('./config/database');

async function checkColumns() {
  try {
    const [tcsColumns] = await db.sequelize.query(
      `SHOW FULL COLUMNS FROM treatment_course_services WHERE Field IN ('treatmentCourseId', 'serviceId')`
    );
    
    console.log('treatment_course_services columns:');
    tcsColumns.forEach(col => {
      console.log(JSON.stringify(col, null, 2));
    });
    
    await db.sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkColumns();
