// backend/routes/treatmentSessions.js
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Helper: Tạo thông báo
async function createNotification(userId, type, title, message, relatedId) {
    try {
        await db.Notification.create({
            id: `notif-${uuidv4()}`,
            userId,
            type,
            title,
            message,
            relatedId,
            sentVia: 'app',
            isRead: false,
            createdAt: new Date(),
        });
    } catch (error) {
        console.error('Error creating notification:', error);
    }
}

// GET /api/treatment-sessions/course/:courseId - Lấy tất cả sessions của một course
router.get('/course/:courseId', async (req, res) => {
    const { courseId } = req.params;
    try {
        const sessions = await db.TreatmentSession.findAll({
            where: { treatmentCourseId: courseId },
            order: [['sessionNumber', 'ASC']],
        });
        res.json(sessions);
    } catch (error) {
        console.error('Error fetching treatment sessions:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/treatment-sessions/:id - Lấy chi tiết một session
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const session = await db.TreatmentSession.findByPk(id);
        if (!session) {
            return res.status(404).json({ message: 'Treatment session not found' });
        }
        res.json(session);
    } catch (error) {
        console.error('Error fetching treatment session:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/treatment-sessions - Tạo session mới
router.post('/', async (req, res) => {
    const {
        treatmentCourseId,
        sessionNumber,
        scheduledDate,
        scheduledTime,
        therapistId,
        therapistName,
        notes,
    } = req.body;

    try {
        const session = await db.TreatmentSession.create({
            id: `session-${uuidv4()}`,
            treatmentCourseId,
            sessionNumber,
            scheduledDate,
            scheduledTime,
            therapistId,
            therapistName,
            notes,
            status: scheduledDate ? 'scheduled' : 'pending',
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        // Tạo thông báo nếu đã đặt lịch
        if (scheduledDate) {
            const course = await db.TreatmentCourse.findByPk(treatmentCourseId);
            if (course && course.clientId) {
                await createNotification(
                    course.clientId,
                    'appointment_confirmed',
                    'Đã đặt lịch buổi liệu trình',
                    `Buổi ${sessionNumber} của liệu trình ${course.serviceName} đã được đặt vào ${scheduledDate} lúc ${scheduledTime}`,
                    session.id
                );
            }
        }

        res.json(session);
    } catch (error) {
        console.error('Error creating treatment session:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// PUT /api/treatment-sessions/:id - Cập nhật session
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const { Op } = require('sequelize');
    const { v4: uuidv4 } = require('uuid');

    try {
        const session = await db.TreatmentSession.findByPk(id);
        
        if (!session) {
            return res.status(404).json({ message: 'Treatment session not found' });
        }

        // Load treatment course with associations
        const course = await db.TreatmentCourse.findByPk(session.treatmentCourseId, {
            include: [
                { model: db.Service, as: 'Service' },
                { model: db.User, as: 'Client' }
            ]
        });
        
        const oldStaffId = session.staffId;
        
        // Nếu phân công staff và session có ngày/giờ, tạo/cập nhật appointment và staff shift
        // Cần xử lý trước khi update session để có thể kiểm tra appointmentId cũ
        if (updates.staffId && session.sessionDate && session.sessionTime) {
            try {
                if (!course || !course.Client) {
                    throw new Error('Treatment course or client not found');
                }

                const service = course.Service;
                if (!service) {
                    throw new Error('Service not found');
                }

                let appointment;
                
                // Nếu session đã có appointment, cập nhật appointment hiện có
                if (session.appointmentId) {
                    appointment = await db.Appointment.findByPk(session.appointmentId);
                    if (appointment) {
                        await appointment.update({
                            therapistId: updates.staffId,
                            status: 'scheduled',
                            date: session.sessionDate,
                            time: session.sessionTime,
                            notesForTherapist: `Buổi ${session.sessionNumber} của liệu trình ${course.serviceName || service.name}`,
                        });
                        console.log(`✅ Updated appointment ${appointment.id} for treatment session ${session.id}`);
                    } else {
                        // Appointment không tồn tại, tạo mới
                        appointment = await db.Appointment.create({
                            id: `appt-${uuidv4()}`,
                            serviceId: course.serviceId,
                            serviceName: service.name || course.serviceName,
                            userId: course.clientId,
                            date: session.sessionDate,
                            time: session.sessionTime,
                            therapistId: updates.staffId,
                            status: 'scheduled',
                            paymentStatus: 'Unpaid',
                            notesForTherapist: `Buổi ${session.sessionNumber} của liệu trình ${course.serviceName || service.name}`,
                            bookingGroupId: `group-${course.id}`,
                        });
                        await session.update({ appointmentId: appointment.id });
                        console.log(`✅ Created appointment ${appointment.id} for treatment session ${session.id}`);
                    }
                } else {
                    // Session chưa có appointment, tạo mới
                    appointment = await db.Appointment.create({
                        id: `appt-${uuidv4()}`,
                        serviceId: course.serviceId,
                        serviceName: service.name || course.serviceName,
                        userId: course.clientId,
                        date: session.sessionDate,
                        time: session.sessionTime,
                        therapistId: updates.staffId,
                        status: 'scheduled',
                        paymentStatus: 'Unpaid',
                        notesForTherapist: `Buổi ${session.sessionNumber} của liệu trình ${course.serviceName || service.name}`,
                        bookingGroupId: `group-${course.id}`,
                    });

                    // Link appointment với session
                    await session.update({
                        appointmentId: appointment.id
                    });

                    console.log(`✅ Created appointment ${appointment.id} for treatment session ${session.id}`);
                }

                // Tạo/update staff shift
                const appointmentDate = session.sessionDate;
                const appointmentTime = session.sessionTime;
                
                // Helper functions from appointments.js
                const getShiftTypeFromTime = (time) => {
                    const [hours] = time.split(':').map(Number);
                    if (hours >= 9 && hours < 16) return 'morning';
                    if (hours >= 16 && hours < 22) return 'afternoon';
                    if (hours >= 22 || hours < 9) return 'evening';
                    return 'custom';
                };

                const getShiftHoursFromTime = (time) => {
                    const [hours] = time.split(':').map(Number);
                    let startHour = 9;
                    let endHour = 16;
                    
                    if (hours >= 9 && hours < 16) {
                        startHour = 9;
                        endHour = 16;
                    } else if (hours >= 16 && hours < 22) {
                        startHour = 16;
                        endHour = 22;
                    } else {
                        startHour = Math.max(9, Math.min(hours, 22));
                        endHour = Math.min(22, startHour + 4);
                    }
                    
                    return {
                        start: `${String(startHour).padStart(2, '0')}:00`,
                        end: `${String(endHour).padStart(2, '0')}:00`
                    };
                };

                // Check if staff already has a shift for this date
                const existingShift = await db.StaffShift.findOne({
                    where: {
                        staffId: updates.staffId,
                        date: appointmentDate,
                        status: { [Op.in]: ['approved', 'pending'] }
                    }
                });

                if (!existingShift) {
                    // Auto-create shift for the staff
                    const shiftType = getShiftTypeFromTime(appointmentTime);
                    const shiftHours = getShiftHoursFromTime(appointmentTime);
                    
                    await db.StaffShift.create({
                        id: `shift-${uuidv4()}`,
                        staffId: updates.staffId,
                        date: appointmentDate,
                        shiftType: shiftType,
                        status: 'approved',
                        shiftHours: shiftHours,
                        notes: `Tự động tạo khi phân công buổi ${session.sessionNumber} liệu trình ${course.serviceName || service.name}`
                    });
                    console.log(`✅ Auto-created shift for staff ${updates.staffId} on ${appointmentDate} (${shiftType})`);
                } else {
                    // Staff already has a shift, check if we need to update it
                    const existingShiftType = existingShift.shiftType;
                    const requiredShiftType = getShiftTypeFromTime(appointmentTime);
                    const requiredHours = getShiftHoursFromTime(appointmentTime);
                    
                    if (existingShiftType !== requiredShiftType) {
                        const existingHours = existingShift.shiftHours || {};
                        const appointmentHour = parseInt(appointmentTime.split(':')[0]);
                        const existingStart = existingHours.start ? parseInt(existingHours.start.split(':')[0]) : 9;
                        const existingEnd = existingHours.end ? parseInt(existingHours.end.split(':')[0]) : 16;
                        
                        if (appointmentHour < existingStart || appointmentHour >= existingEnd) {
                            const mergedHours = {
                                start: Math.min(existingStart, parseInt(requiredHours.start.split(':')[0])),
                                end: Math.max(existingEnd, parseInt(requiredHours.end.split(':')[0]))
                            };
                            
                            await existingShift.update({
                                shiftType: 'custom',
                                shiftHours: {
                                    start: `${String(mergedHours.start).padStart(2, '0')}:00`,
                                    end: `${String(mergedHours.end).padStart(2, '0')}:00`
                                },
                                notes: existingShift.notes ? 
                                    `${existingShift.notes}; Cập nhật để bao gồm buổi ${session.sessionNumber} liệu trình` :
                                    `Cập nhật để bao gồm buổi ${session.sessionNumber} liệu trình`
                            });
                            console.log(`✅ Updated shift for staff ${updates.staffId} to include appointment time`);
                        }
                    }
                }

                // Tạo thông báo cho khách hàng
                await createNotification(
                    course.clientId,
                    'appointment_confirmed',
                    'Đã phân công nhân viên cho buổi liệu trình',
                    `Buổi ${session.sessionNumber} của liệu trình ${course.serviceName || service.name} đã được phân công nhân viên vào ${session.sessionDate} lúc ${session.sessionTime}`,
                    appointment.id
                );

                console.log(`✅ Created notification for client ${course.clientId}`);
            } catch (appointmentError) {
                console.error('Error creating appointment/staff shift for treatment session:', appointmentError);
                // Don't fail the session update if appointment creation fails
            }
        }
        
        // Update session sau khi đã xử lý appointment
        await session.update({
            ...updates,
        });

        // Nếu hoàn thành session, tạo thông báo nhắc buổi tiếp theo
        if (updates.status === 'completed') {
            const course = await db.TreatmentCourse.findByPk(session.treatmentCourseId);
            const nextSession = await db.TreatmentSession.findOne({
                where: {
                    treatmentCourseId: session.treatmentCourseId,
                    sessionNumber: session.sessionNumber + 1,
                },
            });

            if (course && course.clientId && nextSession) {
                await createNotification(
                    course.clientId,
                    'treatment_course_reminder',
                    'Nhắc nhở liệu trình',
                    `Bạn đã hoàn thành buổi ${session.sessionNumber}. Hãy đặt lịch cho buổi ${nextSession.sessionNumber} tiếp theo!`,
                    course.id
                );
            }
        }

        res.json(session);
    } catch (error) {
        console.error('Error updating treatment session:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// PUT /api/treatment-sessions/:id/complete - Hoàn thành session
router.put('/:id/complete', async (req, res) => {
    const { id } = req.params;
    const {
        therapistNotes,
        skinCondition,
        productsUsed,
        nextSessionRecommendation,
        rating,
    } = req.body;

    try {
        const session = await db.TreatmentSession.findByPk(id);
        if (!session) {
            return res.status(404).json({ message: 'Treatment session not found' });
        }

        await session.update({
            status: 'completed',
            completedDate: new Date(),
            therapistNotes,
            skinCondition,
            productsUsed,
            nextSessionRecommendation,
            rating,
            updatedAt: new Date(),
        });

        // Cập nhật nextAppointmentDate của course nếu có buổi tiếp theo
        const course = await db.TreatmentCourse.findByPk(session.treatmentCourseId);
        const nextSession = await db.TreatmentSession.findOne({
            where: {
                treatmentCourseId: session.treatmentCourseId,
                sessionNumber: session.sessionNumber + 1,
            },
        });

        if (course) {
            if (nextSession && nextSession.scheduledDate) {
                await course.update({ nextAppointmentDate: nextSession.scheduledDate });
            } else {
                await course.update({ nextAppointmentDate: null });
            }

            // Kiểm tra xem đã hoàn thành tất cả buổi chưa
            const totalCompleted = await db.TreatmentSession.count({
                where: {
                    treatmentCourseId: session.treatmentCourseId,
                    status: 'completed',
                },
            });

            if (totalCompleted >= course.totalSessions) {
                await course.update({ status: 'completed' });
                
                // Thông báo hoàn thành liệu trình
                if (course.clientId) {
                    await createNotification(
                        course.clientId,
                        'system',
                        'Hoàn thành liệu trình',
                        `Chúc mừng! Bạn đã hoàn thành liệu trình ${course.serviceName}`,
                        course.id
                    );
                }
            }
        }

        res.json(session);
    } catch (error) {
        console.error('Error completing treatment session:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// DELETE /api/treatment-sessions/:id - Xóa session
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const session = await db.TreatmentSession.findByPk(id);
        if (!session) {
            return res.status(404).json({ message: 'Treatment session not found' });
        }
        await session.destroy();
        res.json({ message: 'Treatment session deleted' });
    } catch (error) {
        console.error('Error deleting treatment session:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
