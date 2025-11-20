// Script to create appointments for treatment sessions that have staffId but no appointmentId
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

async function createMissingAppointments() {
    try {
        console.log('🔍 Finding treatment sessions with staffId but no appointmentId...');
        
        // Find all sessions that have staffId and sessionDate/sessionTime but no appointmentId
        const sessions = await db.TreatmentSession.findAll({
            where: {
                staffId: { [db.Sequelize.Op.ne]: null },
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
        
        console.log(`📊 Found ${sessions.length} sessions without appointments`);
        
        let created = 0;
        let errors = 0;
        
        for (const session of sessions) {
            try {
                const course = session.TreatmentCourse;
                if (!course || !course.Client || !course.Service) {
                    console.log(`⚠️ Skipping session ${session.id} - missing course/client/service data`);
                    continue;
                }
                
                // Check if appointment already exists for this date/time/staff
                const existingAppointment = await db.Appointment.findOne({
                    where: {
                        userId: course.clientId,
                        therapistId: session.staffId,
                        date: session.sessionDate,
                        time: session.sessionTime,
                        serviceId: course.serviceId
                    }
                });
                
                if (existingAppointment) {
                    // Link existing appointment to session
                    await session.update({ appointmentId: existingAppointment.id });
                    console.log(`✅ Linked existing appointment ${existingAppointment.id} to session ${session.id} (buổi ${session.sessionNumber})`);
                    created++;
                } else {
                    // Create new appointment
                    const appointment = await db.Appointment.create({
                        id: `appt-${uuidv4()}`,
                        serviceId: course.serviceId,
                        serviceName: course.Service.name || course.serviceName,
                        userId: course.clientId,
                        date: session.sessionDate,
                        time: session.sessionTime,
                        therapistId: session.staffId,
                        status: 'upcoming',
                        paymentStatus: 'Unpaid',
                        notesForTherapist: `Buổi ${session.sessionNumber} của liệu trình ${course.Service.name || course.serviceName}`,
                        bookingGroupId: `group-${course.id}`,
                    });
                    
                    await session.update({ appointmentId: appointment.id });
                    console.log(`✅ Created appointment ${appointment.id} for session ${session.id} (buổi ${session.sessionNumber})`);
                    created++;
                }
            } catch (error) {
                console.error(`❌ Error processing session ${session.id}:`, error.message);
                errors++;
            }
        }
        
        console.log(`\n✅ Completed! Created/linked ${created} appointments, ${errors} errors`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    }
}

// Run the script
createMissingAppointments();

