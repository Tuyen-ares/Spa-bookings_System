// Test script to check most booked services
const db = require('./config/database');
const { Sequelize } = require('sequelize');

async function testMostBooked() {
    try {
        console.log('=== Testing Most Booked Services ===\n');

        // 1. Check all appointments with their status
        console.log('1. Checking all appointments statuses:');
        const allAppointments = await db.Appointment.findAll({
            attributes: ['id', 'serviceId', 'serviceName', 'status', 'date'],
            order: [['date', 'DESC']],
            limit: 20
        });
        console.log(`Total appointments (latest 20): ${allAppointments.length}`);
        allAppointments.forEach(apt => {
            console.log(`  - ${apt.serviceName} (${apt.serviceId}): status="${apt.status}", date=${apt.date}`);
        });

        // 2. Count by status
        console.log('\n2. Count appointments by status:');
        const statusCounts = await db.Appointment.findAll({
            attributes: [
                'status',
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
            ],
            group: ['status'],
            raw: true
        });
        statusCounts.forEach(s => {
            console.log(`  - ${s.status}: ${s.count}`);
        });

        // 3. Count completed appointments per service
        console.log('\n3. Completed appointments per service:');
        const completedByService = await db.Appointment.findAll({
            attributes: [
                'serviceId',
                'serviceName',
                [Sequelize.fn('COUNT', Sequelize.col('Appointment.id')), 'bookingCount']
            ],
            where: {
                status: 'completed'
            },
            group: ['serviceId', 'serviceName'],
            order: [[Sequelize.literal('bookingCount'), 'DESC']],
            raw: true
        });
        
        if (completedByService.length > 0) {
            console.log(`Found ${completedByService.length} services with completed bookings:`);
            completedByService.forEach(s => {
                console.log(`  - ${s.serviceName} (${s.serviceId}): ${s.bookingCount} bookings`);
            });
        } else {
            console.log('  No completed appointments found!');
        }

        // 4. Test the actual service method
        console.log('\n4. Testing getMostBookedServices method:');
        const serviceService = require('./services/serviceService');
        const mostBooked = await serviceService.getMostBookedServices(4);
        console.log(`Result: ${mostBooked.length} services returned`);
        mostBooked.forEach((service, idx) => {
            console.log(`  ${idx + 1}. ${service.name} (${service.id})`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

testMostBooked();
