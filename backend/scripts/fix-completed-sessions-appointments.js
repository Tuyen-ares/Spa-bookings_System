// Script to update appointment status to 'completed' for all completed treatment sessions
const db = require('../config/database');

async function fixCompletedSessionsAppointments() {
    try {
        console.log('🔍 Finding completed treatment sessions with appointments...\n');
        
        // Find all completed sessions with appointments
        const completedSessions = await db.TreatmentSession.findAll({
            where: {
                status: 'completed',
                appointmentId: { [db.Sequelize.Op.ne]: null }
            },
            include: [
                {
                    model: db.Appointment,
                    as: 'Appointment',
                    required: true
                },
                {
                    model: db.TreatmentCourse,
                    as: 'TreatmentCourse',
                    include: [
                        { model: db.User, as: 'Client' }
                    ]
                }
            ]
        });
        
        console.log(`📊 Found ${completedSessions.length} completed sessions with appointments\n`);
        
        let updated = 0;
        let alreadyCompleted = 0;
        let errors = 0;
        
        for (const session of completedSessions) {
            try {
                const appointment = session.Appointment;
                const course = session.TreatmentCourse;
                
                if (appointment.status === 'completed') {
                    alreadyCompleted++;
                    console.log(`✓ Session ${session.sessionNumber} (${course?.Client?.name || 'N/A'}): Appointment ${appointment.id} already completed`);
                    continue;
                }
                
                // Update appointment status to completed
                await appointment.update({
                    status: 'completed'
                });
                
                updated++;
                console.log(`✅ Session ${session.sessionNumber} (${course?.Client?.name || 'N/A'}): Updated appointment ${appointment.id} from '${appointment.status}' to 'completed'`);
                console.log(`   - Date: ${session.sessionDate} ${session.sessionTime}`);
                
            } catch (error) {
                console.error(`❌ Error updating appointment for session ${session.id}:`, error.message);
                errors++;
            }
        }
        
        console.log(`\n\n📊 Summary:`);
        console.log(`   - Total completed sessions with appointments: ${completedSessions.length}`);
        console.log(`   - Updated to 'completed': ${updated}`);
        console.log(`   - Already completed: ${alreadyCompleted}`);
        console.log(`   - Errors: ${errors}`);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    }
}

// Run the script
fixCompletedSessionsAppointments();

