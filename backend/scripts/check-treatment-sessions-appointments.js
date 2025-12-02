// Script to check treatment sessions and their appointments
const db = require('../config/database');

async function checkTreatmentSessionsAppointments() {
    try {
        console.log('🔍 Checking completed treatment sessions and their appointments...\n');
        
        // Find all completed sessions
        const completedSessions = await db.TreatmentSession.findAll({
            where: {
                status: 'completed'
            },
            include: [
                {
                    model: db.TreatmentCourse,
                    as: 'TreatmentCourse',
                    include: [
                        { model: db.Service, as: 'Service' },
                        { model: db.User, as: 'Client' }
                    ]
                },
                {
                    model: db.Appointment,
                    as: 'Appointment',
                    required: false
                }
            ],
            order: [['sessionDate', 'DESC'], ['sessionTime', 'DESC']]
        });
        
        console.log(`📊 Found ${completedSessions.length} completed treatment sessions\n`);
        
        let withAppointment = 0;
        let withoutAppointment = 0;
        let withCompletedAppointment = 0;
        let withOtherStatusAppointment = 0;
        
        for (const session of completedSessions) {
            const course = session.TreatmentCourse;
            const appointment = session.Appointment;
            
            console.log(`\n📋 Session ${session.sessionNumber} (ID: ${session.id}):`);
            console.log(`   - Course: ${course?.serviceName || 'N/A'}`);
            console.log(`   - Client: ${course?.Client?.name || 'N/A'}`);
            console.log(`   - Date: ${session.sessionDate || 'N/A'}`);
            console.log(`   - Time: ${session.sessionTime || 'N/A'}`);
            console.log(`   - Appointment ID: ${session.appointmentId || 'NULL'}`);
            
            if (appointment) {
                withAppointment++;
                console.log(`   - Appointment Status: ${appointment.status}`);
                console.log(`   - Appointment Date: ${appointment.date}`);
                console.log(`   - Appointment Time: ${appointment.time}`);
                
                if (appointment.status === 'completed') {
                    withCompletedAppointment++;
                } else {
                    withOtherStatusAppointment++;
                    console.log(`   ⚠️  Appointment status is '${appointment.status}', not 'completed'!`);
                }
            } else {
                withoutAppointment++;
                console.log(`   ❌ No appointment found!`);
                
                if (session.sessionDate && session.sessionTime) {
                    // Check if appointment exists but not linked
                    const existingAppointment = await db.Appointment.findOne({
                        where: {
                            userId: course?.clientId,
                            date: session.sessionDate,
                            time: session.sessionTime,
                            serviceId: course?.serviceId
                        }
                    });
                    
                    if (existingAppointment) {
                        console.log(`   ⚠️  Found unlinked appointment: ${existingAppointment.id} (status: ${existingAppointment.status})`);
                    }
                }
            }
        }
        
        console.log(`\n\n📊 Summary:`);
        console.log(`   - Total completed sessions: ${completedSessions.length}`);
        console.log(`   - With appointment: ${withAppointment}`);
        console.log(`   - Without appointment: ${withoutAppointment}`);
        console.log(`   - With completed appointment: ${withCompletedAppointment}`);
        console.log(`   - With other status appointment: ${withOtherStatusAppointment}`);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    }
}

// Run the script
checkTreatmentSessionsAppointments();

