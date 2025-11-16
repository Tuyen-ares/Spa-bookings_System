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

    try {
        const session = await db.TreatmentSession.findByPk(id);
        if (!session) {
            return res.status(404).json({ message: 'Treatment session not found' });
        }

        await session.update({
            ...updates,
            updatedAt: new Date(),
        });

        // Nếu hoàn thành session, tạo thông báo nhắc buổi tiếp theo
        if (updates.status === 'completed' && session.completedDate) {
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
