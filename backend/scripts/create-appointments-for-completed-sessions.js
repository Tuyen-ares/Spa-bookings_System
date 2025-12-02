// Script to create appointments for completed treatment sessions that don't have appointmentId
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

async function createAppointmentsForCompletedSessions() {
    try {
        console.log('🔍 Finding completed treatment sessions without appointments...');
        
        // Find all completed sessions that have date/time but no appointmentId
        const sessions = await db.TreatmentSession.findAll({
            where: {
                status: 'completed',
                sessionDate: { [db.Sequelize.Op.ne]: null },
                sessionTime: { [db.Sequelize.Op.ne]: null },
                appointmentId: null
            },
            include: [
                {
                    model: db.TreatmentCourse,
                    as: 'TreatmentCourse',
                    include: [
                        { model: db.Service, as: 'Service' },
                        { model: db.User, as: 'Client' }
                    ]
                }
            ]
        });
        
        console.log(`📊 Found ${sessions.length} completed sessions without appointments`);
        
        let created = 0;
        let errors = 0;
        
        for (const session of sessions) {
            try {
                const course = session.TreatmentCourse;
                if (!course || !course.Client || !course.Service) {
                    console.log(`⚠️ Skipping session ${session.id} - missing course/client/service data`);
                    continue;
                }

                // Check if appointment already exists for this date/time/user
                const existingAppointment = await db.Appointment.findOne({
                    where: {
                        userId: course.clientId,
                        date: session.sessionDate,
                        time: session.sessionTime,
                        serviceId: course.serviceId
                    }
                });

                if (existingAppointment) {
                    // Link existing appointment to session
                    await session.update({ appointmentId: existingAppointment.id });
                    await existingAppointment.update({ status: 'completed' });
                    console.log(`✅ Linked existing appointment ${existingAppointment.id} to session ${session.id}`);
                    created++;
                    continue;
                }

                // Create new appointment
                const appointment = await db.Appointment.create({
                    id: `apt-${uuidv4()}`,
                    serviceId: course.serviceId,
                    serviceName: course.Service.name || course.serviceName,
                    userId: course.clientId,
                    date: session.sessionDate,
                    time: session.sessionTime,
                    therapistId: session.staffId || null,
                    status: 'completed', // Already completed
                    paymentStatus: 'Unpaid', // Default
                    notesForTherapist: `Buổi ${session.sessionNumber} của liệu trình ${course.Service.name || course.serviceName}`,
                    bookingGroupId: `group-${course.id}`,
                });

                // Link appointment to session
                await session.update({ appointmentId: appointment.id });
                
                console.log(`✅ Created appointment ${appointment.id} for completed session ${session.id} (buổi ${session.sessionNumber})`);
                created++;
            } catch (error) {
                console.error(`❌ Error processing session ${session.id}:`, error.message);
                errors++;
            }
        }
        
        console.log(`\n✅ Summary:`);
        console.log(`   - Created/Linked: ${created} appointments`);
        console.log(`   - Errors: ${errors}`);
        console.log(`   - Total processed: ${sessions.length}`);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    }
}

// Run the script
createAppointmentsForCompletedSessions();

