const db = require('./config/database');

async function testAssociations() {
  try {
    console.log('Testing TreatmentCourse associations...\n');
    
    // Test loading treatment course with services
    const course = await db.TreatmentCourse.findOne({
      where: { id: 'tc-1b960d2a-d3b0-4030-be96-72ec9d1f4b13' },
      include: [{
        model: db.Service,
        as: 'CourseServices',
        through: { attributes: ['serviceName', 'order'] }
      }]
    });
    
    if (course) {
      console.log('Treatment Course:', course.name);
      console.log('Price:', course.price);
      console.log('Services in package:');
      course.CourseServices.forEach((service, index) => {
        console.log(`  ${index + 1}. ${service.name} (Order: ${service.TreatmentCourseService.order})`);
      });
    } else {
      console.log('No treatment course found');
    }
    
    await db.sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testAssociations();
