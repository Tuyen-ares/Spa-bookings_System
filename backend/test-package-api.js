const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

async function testPackageAPI() {
  try {
    console.log('🧪 Testing Treatment Package API\n');

    // 1. Get all services first
    console.log('1️⃣ Getting services...');
    const servicesRes = await axios.get(`${BASE_URL}/services`);
    const services = servicesRes.data;
    console.log(`✅ Found ${services.length} services`);
    
    // Take first 3 services for the package
    const selectedServices = services.slice(0, 3).map((service, index) => ({
      serviceId: service.id,
      serviceName: service.name,
      order: index + 1,
      sessionsPerService: 3
    }));

    console.log('\n2️⃣ Creating a treatment package...');
    const packageData = {
      name: 'Gói chăm sóc da toàn diện',
      description: 'Gói liệu trình chăm sóc da toàn diện với 3 dịch vụ chuyên sâu',
      price: 2500000,
      originalPrice: 3000000,
      totalSessions: 9,
      duration: 60,
      benefits: JSON.stringify([
        'Làm sạch da sâu',
        'Cải thiện độ đàn hồi',
        'Giảm nếp nhăn'
      ]),
      isActive: true,
      isFeatured: true,
      displayOrder: 1,
      services: selectedServices
    };

    const createRes = await axios.post(`${BASE_URL}/treatment-packages`, packageData);
    const createdPackage = createRes.data;
    console.log(`✅ Created package:`, createdPackage.id);
    console.log(`   Name: ${createdPackage.name}`);
    console.log(`   Price: ${createdPackage.price.toLocaleString('vi-VN')} VNĐ`);
    console.log(`   Services: ${createdPackage.services?.length || 0} services`);

    // 3. Get package details
    console.log('\n3️⃣ Getting package details...');
    const detailsRes = await axios.get(`${BASE_URL}/treatment-packages/${createdPackage.id}`);
    const packageDetails = detailsRes.data;
    console.log(`✅ Package details:`);
    console.log(`   Total sessions: ${packageDetails.totalSessions}`);
    console.log(`   Services:`);
    packageDetails.services.forEach(s => {
      console.log(`      ${s.order}. ${s.serviceName} (${s.sessionsPerService} sessions)`);
    });

    // 4. List all packages
    console.log('\n4️⃣ Listing all active packages...');
    const listRes = await axios.get(`${BASE_URL}/treatment-packages?activeOnly=true`);
    console.log(`✅ Found ${listRes.data.length} active packages`);

    // 5. Enroll in package (simulate customer enrollment)
    console.log('\n5️⃣ Testing enrollment...');
    const enrollData = {
      userId: 'user-test', // You'll need a real user ID
      treatmentGoals: 'Cải thiện làn da, giảm nếp nhăn',
      initialCondition: 'Da khô, có dấu hiệu lão hóa'
    };
    
    try {
      const enrollRes = await axios.post(
        `${BASE_URL}/treatment-packages/${createdPackage.id}/enroll`,
        enrollData
      );
      console.log(`✅ Enrollment successful!`);
      console.log(`   Course ID: ${enrollRes.data.course.id}`);
      console.log(`   Sessions created: ${enrollRes.data.course.totalSessions}`);
    } catch (enrollError) {
      console.log(`⚠️  Enrollment failed (expected if user doesn't exist): ${enrollError.response?.data?.message || enrollError.message}`);
    }

    console.log('\n✅ All tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testPackageAPI();
