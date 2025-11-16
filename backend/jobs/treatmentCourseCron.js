// backend/jobs/treatmentCourseCron.js
// Cron job to check and update expired treatment courses

const db = require('../config/database');
const { Op} = require('sequelize');

// Check and update expired courses
const checkExpiredCourses = async () => {
    try {
        console.log('[CRON] Checking for expired treatment courses...');
        
        const today = new Date().toISOString().split('T')[0];
        
        // Find active courses that have expired
        const expiredCourses = await db.TreatmentCourse.findAll({
            where: {
                status: 'active',
                expiryDate: {
                    [Op.lt]: today
                },
                completedSessions: {
                    [Op.lt]: db.Sequelize.col('totalSessions')
                }
            }
        });

        if (expiredCourses.length > 0) {
            console.log(`[CRON] Found ${expiredCourses.length} expired courses`);
            
            // Update status to expired
            for (const course of expiredCourses) {
                await course.update({ status: 'expired' });
                
                // Create notification for client
                if (course.clientId) {
                    try {
                        const notification = {
                            id: `notif-${require('uuid').v4()}`,
                            userId: course.clientId,
                            type: 'treatment_course_reminder',
                            title: 'Liệu trình đã hết hạn',
                            message: `Liệu trình "${course.serviceName}" của bạn đã hết hạn. Vui lòng liên hệ spa để gia hạn hoặc hoàn thành các buổi còn lại.`,
                            relatedId: course.id,
                            sentVia: 'app',
                            isRead: false,
                            emailSent: false,
                            createdAt: new Date()
                        };
                        
                        await db.Notification.create(notification);
                        console.log(`[CRON] Created expiry notification for course ${course.id}`);
                    } catch (notifError) {
                        console.error('[CRON] Error creating notification:', notifError);
                    }
                }
            }
            
            console.log(`[CRON] Updated ${expiredCourses.length} courses to expired status`);
        } else {
            console.log('[CRON] No expired courses found');
        }
        
    } catch (error) {
        console.error('[CRON] Error checking expired courses:', error);
    }
};

// Check for courses expiring soon (7 days warning)
const checkExpiringSoonCourses = async () => {
    try {
        console.log('[CRON] Checking for courses expiring soon...');
        
        const today = new Date();
        const sevenDaysLater = new Date(today);
        sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
        
        const todayStr = today.toISOString().split('T')[0];
        const sevenDaysStr = sevenDaysLater.toISOString().split('T')[0];
        
        // Find active courses expiring in next 7 days
        const expiringSoonCourses = await db.TreatmentCourse.findAll({
            where: {
                status: 'active',
                expiryDate: {
                    [Op.between]: [todayStr, sevenDaysStr]
                },
                completedSessions: {
                    [Op.lt]: db.Sequelize.col('totalSessions')
                }
            }
        });

        if (expiringSoonCourses.length > 0) {
            console.log(`[CRON] Found ${expiringSoonCourses.length} courses expiring soon`);
            
            for (const course of expiringSoonCourses) {
                // Check if reminder already sent today
                const remindersSent = course.remindersSent || [];
                const alreadySentToday = remindersSent.some(r => 
                    r.type === 'expiry_warning' && 
                    r.date === todayStr
                );
                
                if (!alreadySentToday && course.clientId) {
                    try {
                        const daysLeft = Math.ceil((new Date(course.expiryDate) - today) / (1000 * 60 * 60 * 24));
                        
                        const notification = {
                            id: `notif-${require('uuid').v4()}`,
                            userId: course.clientId,
                            type: 'treatment_course_reminder',
                            title: 'Liệu trình sắp hết hạn',
                            message: `Liệu trình "${course.serviceName}" của bạn sẽ hết hạn trong ${daysLeft} ngày (${new Date(course.expiryDate).toLocaleDateString('vi-VN')}). Còn ${course.totalSessions - course.completedSessions} buổi chưa hoàn thành. Hãy đặt lịch sớm!`,
                            relatedId: course.id,
                            sentVia: 'app',
                            isRead: false,
                            emailSent: false,
                            createdAt: new Date()
                        };
                        
                        await db.Notification.create(notification);
                        
                        // Update reminders sent history
                        remindersSent.push({
                            type: 'expiry_warning',
                            date: todayStr,
                            status: 'sent',
                            daysLeft
                        });
                        
                        await course.update({ remindersSent });
                        
                        console.log(`[CRON] Sent expiry warning for course ${course.id} (${daysLeft} days left)`);
                    } catch (notifError) {
                        console.error('[CRON] Error creating notification:', notifError);
                    }
                }
            }
        } else {
            console.log('[CRON] No courses expiring soon');
        }
        
    } catch (error) {
        console.error('[CRON] Error checking expiring soon courses:', error);
    }
};

// Check for courses with long gaps between sessions
const checkInactiveCourses = async () => {
    try {
        console.log('[CRON] Checking for inactive courses...');
        
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
        
        // Find active courses with last session completed > 14 days ago
        const inactiveCourses = await db.TreatmentCourse.findAll({
            where: {
                status: 'active',
                lastCompletedDate: {
                    [Op.lt]: fourteenDaysAgo.toISOString().split('T')[0]
                },
                completedSessions: {
                    [Op.lt]: db.Sequelize.col('totalSessions')
                }
            }
        });

        if (inactiveCourses.length > 0) {
            console.log(`[CRON] Found ${inactiveCourses.length} inactive courses`);
            
            for (const course of inactiveCourses) {
                const remindersSent = course.remindersSent || [];
                const todayStr = new Date().toISOString().split('T')[0];
                
                // Check if reminder sent in last 7 days
                const recentReminder = remindersSent.find(r =>
                    r.type === 'inactivity_warning' &&
                    new Date(r.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                );
                
                if (!recentReminder && course.clientId) {
                    try {
                        const daysSinceLastSession = Math.ceil((new Date() - new Date(course.lastCompletedDate)) / (1000 * 60 * 60 * 24));
                        
                        const notification = {
                            id: `notif-${require('uuid').v4()}`,
                            userId: course.clientId,
                            type: 'treatment_course_reminder',
                            title: 'Nhắc nhở tiếp tục liệu trình',
                            message: `Bạn chưa thực hiện buổi điều trị nào trong ${daysSinceLastSession} ngày. Liệu trình "${course.serviceName}" còn ${course.totalSessions - course.completedSessions} buổi chưa hoàn thành. Hãy đặt lịch để đảm bảo hiệu quả điều trị!`,
                            relatedId: course.id,
                            sentVia: 'app',
                            isRead: false,
                            emailSent: false,
                            createdAt: new Date()
                        };
                        
                        await db.Notification.create(notification);
                        
                        remindersSent.push({
                            type: 'inactivity_warning',
                            date: todayStr,
                            status: 'sent',
                            daysSinceLastSession
                        });
                        
                        await course.update({ remindersSent });
                        
                        console.log(`[CRON] Sent inactivity warning for course ${course.id}`);
                    } catch (notifError) {
                        console.error('[CRON] Error creating notification:', notifError);
                    }
                }
            }
        } else {
            console.log('[CRON] No inactive courses found');
        }
        
    } catch (error) {
        console.error('[CRON] Error checking inactive courses:', error);
    }
};

// Main cron job function
const runTreatmentCourseCron = async () => {
    console.log('\n========================================');
    console.log(`[CRON] Running treatment course checks at ${new Date().toLocaleString('vi-VN')}`);
    console.log('========================================\n');
    
    await checkExpiredCourses();
    await checkExpiringSoonCourses();
    await checkInactiveCourses();
    
    console.log('\n========================================');
    console.log('[CRON] Treatment course checks completed');
    console.log('========================================\n');
};

module.exports = {
    runTreatmentCourseCron,
    checkExpiredCourses,
    checkExpiringSoonCourses,
    checkInactiveCourses
};
