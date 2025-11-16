// backend/routes/treatmentCourses.js - Enhanced Phase 1
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');

// Helper: Calculate expiry date
const calculateExpiryDate = (startDate, totalSessions, sessionsPerWeek, bufferDays = 14) => {
    const weeksNeeded = totalSessions / sessionsPerWeek;
    const daysNeeded = Math.ceil(weeksNeeded * 7);
    const expiryDate = new Date(startDate);
    expiryDate.setDate(expiryDate.getDate() + daysNeeded + bufferDays);
    return expiryDate.toISOString().split('T')[0];
};

// Helper: Update course progress
const updateCourseProgress = async (courseId) => {
    try {
        const course = await db.TreatmentCourse.findByPk(courseId);
        if (!course) return null;

        // Count completed sessions
        const completedCount = await db.TreatmentSession.count({
            where: {
                treatmentCourseId: courseId,
                status: 'completed'
            }
        });

        // Get last completed date
        const lastSession = await db.TreatmentSession.findOne({
            where: {
                treatmentCourseId: courseId,
                status: 'completed'
            },
            order: [['completedDate', 'DESC']]
        });

        // Calculate progress percentage
        const progressPercentage = course.totalSessions > 0
            ? Math.round((completedCount / course.totalSessions) * 100)
            : 0;

        // Determine status
        let newStatus = course.status;
        if (completedCount >= course.totalSessions) {
            newStatus = 'completed';
        } else if (course.expiryDate && new Date(course.expiryDate) < new Date() && course.status === 'active') {
            newStatus = 'expired';
        }

        // Update course
        await course.update({
            completedSessions: completedCount,
            progressPercentage,
            lastCompletedDate: lastSession ? lastSession.completedDate : null,
            status: newStatus
        });

        return course;
    } catch (error) {
        console.error('Error updating course progress:', error);
        throw error;
    }
};

// GET /api/treatment-courses - Get all treatment courses (with filters)
router.get('/', async (req, res) => {
    try {
        const {
            clientId,
            therapistId,
            status,
            template,
            includeExpired,
            includeCompleted
        } = req.query;

        const where = {};

        // Template courses (clientId is null)
        if (template === 'true') {
            where.clientId = null;
        } else if (clientId) {
            where.clientId = clientId;
        }

        if (therapistId) where.therapistId = therapistId;
        if (status) where.status = status;

        // Default: exclude expired and cancelled unless requested
        if (!includeExpired && !status) {
            if (where.status) {
                // If status already set, add to exclusion
                where.status = { [Op.and]: [where.status, { [Op.notIn]: ['expired', 'cancelled'] }] };
            } else {
                where.status = { [Op.notIn]: ['expired', 'cancelled'] };
            }
        }

        // Default: exclude completed unless requested
        if (!includeCompleted && !status && template !== 'true') {
            if (where.status && where.status[Op.notIn]) {
                where.status[Op.notIn].push('completed');
            } else if (!where.status) {
                where.status = { [Op.notIn]: ['expired', 'cancelled', 'completed'] };
            }
        }

        const courses = await db.TreatmentCourse.findAll({
            where,
            include: clientId || !template ? [
                {
                    model: db.User,
                    as: 'Client',
                    attributes: ['id', 'name', 'email', 'phone'],
                    required: false
                },
                {
                    model: db.Service,
                    attributes: ['id', 'name', 'price', 'duration'],
                    required: false
                }
            ] : [],
            order: [['createdAt', 'DESC']]
        });

        res.json(courses);
    } catch (error) {
        console.error('Error fetching treatment courses:', error);
        res.status(500).json({ message: 'Error fetching treatment courses', error: error.message });
    }
});

// GET /api/treatment-courses/:id - get single course with details
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const course = await db.TreatmentCourse.findByPk(id, {
            include: [
                {
                    model: db.User,
                    as: 'Client',
                    attributes: ['id', 'name', 'email', 'phone'],
                    required: false
                },
                {
                    model: db.Service,
                    attributes: ['id', 'name', 'price', 'duration', 'description'],
                    required: false
                }
            ]
        });

        if (!course) {
            return res.status(404).json({ message: 'Treatment course not found' });
        }

        // Get all sessions for this course
        const sessions = await db.TreatmentSession.findAll({
            where: { treatmentCourseId: id },
            order: [['sessionNumber', 'ASC']]
        });

        const courseData = course.toJSON();
        courseData.sessions = sessions;

        // Add expiry warning
        if (course.expiryDate) {
            const daysUntilExpiry = Math.ceil((new Date(course.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
            courseData.daysUntilExpiry = daysUntilExpiry;
            courseData.isExpiringSoon = daysUntilExpiry <= 7 && daysUntilExpiry > 0;
            courseData.isExpired = daysUntilExpiry < 0;
        }

        res.json(courseData);
    } catch (error) {
        console.error('Error fetching course details:', error);
        res.status(500).json({ message: 'Error fetching course details', error: error.message });
    }
});

// POST /api/treatment-courses - Create new treatment course with auto-generated sessions
router.post('/', async (req, res) => {
    try {
        const {
            serviceId,
            clientId,
            totalSessions,
            sessionsPerWeek,
            treatmentGoals,
            initialSkinCondition,
            consultantId,
            consultantName,
            startDate,
            therapistId
        } = req.body;

        // Validate required fields
        if (!serviceId || !totalSessions || !sessionsPerWeek) {
            return res.status(400).json({
                message: 'Missing required fields: serviceId, totalSessions, sessionsPerWeek'
            });
        }

        // Get service info
        const service = await db.Service.findByPk(serviceId);
        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }

        // Calculate expiry date
        const courseStartDate = startDate || new Date().toISOString().split('T')[0];
        const expiryDate = calculateExpiryDate(courseStartDate, totalSessions, sessionsPerWeek);

        // Create course
        const course = await db.TreatmentCourse.create({
            id: `tc-${uuidv4()}`,
            serviceId,
            serviceName: service.name,
            clientId: clientId || null,
            therapistId: therapistId || null,
            totalSessions,
            sessionsPerWeek,
            sessionDuration: service.duration || 60,
            treatmentGoals,
            initialSkinCondition,
            consultantId,
            consultantName,
            startDate: courseStartDate,
            expiryDate,
            status: clientId ? 'active' : 'draft',
            progressPercentage: 0,
            completedSessions: 0,
            isPaused: false
        });

        // Auto-generate sessions only if not a template (has clientId)
        if (clientId) {
            const sessions = [];
            const startDateObj = new Date(courseStartDate);

            for (let i = 1; i <= totalSessions; i++) {
                const daysBetweenSessions = Math.floor(7 / sessionsPerWeek);
                const sessionDate = new Date(startDateObj);
                sessionDate.setDate(sessionDate.getDate() + ((i - 1) * daysBetweenSessions));

                sessions.push({
                    id: `ts-${uuidv4()}`,
                    treatmentCourseId: course.id,
                    sessionNumber: i,
                    scheduledDate: sessionDate.toISOString().split('T')[0],
                    status: 'pending',
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            }

            await db.TreatmentSession.bulkCreate(sessions);
            console.log(`✅ Created treatment course ${course.id} with ${sessions.length} sessions`);
        }

        res.status(201).json({
            course,
            message: clientId ? `Treatment course created with ${totalSessions} sessions` : 'Template course created'
        });
    } catch (error) {
        console.error('Error creating treatment course:', error);
        res.status(500).json({ message: 'Error creating treatment course', error: error.message });
    }
});

// PUT /api/treatment-courses/:id - update
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const course = await db.TreatmentCourse.findByPk(id);
        if (!course) {
            return res.status(404).json({ message: 'Treatment course not found' });
        }

        await course.update(updates);
        res.json({
            course,
            message: 'Treatment course updated successfully'
        });
    } catch (error) {
        console.error('Error updating treatment course:', error);
        res.status(500).json({ message: 'Error updating treatment course', error: error.message });
    }
});

// POST /api/treatment-courses/:id/pause - Pause course
router.post('/:id/pause', async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const course = await db.TreatmentCourse.findByPk(id);
        if (!course) {
            return res.status(404).json({ message: 'Treatment course not found' });
        }

        await course.update({
            status: 'paused',
            isPaused: true,
            pauseReason: reason || 'No reason provided',
            pausedDate: new Date()
        });

        res.json({
            course,
            message: 'Treatment course paused successfully'
        });
    } catch (error) {
        console.error('Error pausing course:', error);
        res.status(500).json({ message: 'Error pausing course', error: error.message });
    }
});

// POST /api/treatment-courses/:id/resume - Resume course
router.post('/:id/resume', async (req, res) => {
    try {
        const { id } = req.params;
        const { extendExpiryDays } = req.body;

        const course = await db.TreatmentCourse.findByPk(id);
        if (!course) {
            return res.status(404).json({ message: 'Treatment course not found' });
        }

        // Calculate days paused
        const daysPaused = course.pausedDate
            ? Math.ceil((new Date() - new Date(course.pausedDate)) / (1000 * 60 * 60 * 24))
            : 0;

        // Extend expiry date
        let newExpiryDate = course.expiryDate;
        if (extendExpiryDays || daysPaused) {
            const daysToAdd = extendExpiryDays || daysPaused;
            const expiryDateObj = new Date(course.expiryDate);
            expiryDateObj.setDate(expiryDateObj.getDate() + daysToAdd);
            newExpiryDate = expiryDateObj.toISOString().split('T')[0];
        }

        await course.update({
            status: 'active',
            isPaused: false,
            resumedDate: new Date(),
            expiryDate: newExpiryDate
        });

        res.json({
            course,
            daysPaused,
            daysExtended: extendExpiryDays || daysPaused,
            message: `Treatment course resumed. Expiry extended by ${extendExpiryDays || daysPaused} days.`
        });
    } catch (error) {
        console.error('Error resuming course:', error);
        res.status(500).json({ message: 'Error resuming course', error: error.message });
    }
});

// GET /api/treatment-courses/:id/progress - Get detailed progress
router.get('/:id/progress', async (req, res) => {
    try {
        const { id } = req.params;

        const course = await db.TreatmentCourse.findByPk(id);
        if (!course) {
            return res.status(404).json({ message: 'Treatment course not found' });
        }

        const sessions = await db.TreatmentSession.findAll({
            where: { treatmentCourseId: id },
            order: [['sessionNumber', 'ASC']]
        });

        const completedSessions = sessions.filter(s => s.status === 'completed');
        const pendingSessions = sessions.filter(s => s.status === 'pending');
        const scheduledSessions = sessions.filter(s => s.status === 'scheduled');
        const missedSessions = sessions.filter(s => s.status === 'missed');

        const progress = {
            courseId: id,
            totalSessions: course.totalSessions,
            completedSessions: completedSessions.length,
            pendingSessions: pendingSessions.length,
            scheduledSessions: scheduledSessions.length,
            missedSessions: missedSessions.length,
            progressPercentage: course.progressPercentage,
            startDate: course.startDate,
            expiryDate: course.expiryDate,
            lastCompletedDate: course.lastCompletedDate,
            nextScheduledSession: scheduledSessions[0] || pendingSessions[0] || null,
            status: course.status,
            isPaused: course.isPaused,
            timeline: sessions.map(s => ({
                sessionNumber: s.sessionNumber,
                status: s.status,
                scheduledDate: s.scheduledDate,
                completedDate: s.completedDate,
                therapistName: s.therapistName
            }))
        };

        // Calculate days until expiry
        if (course.expiryDate) {
            const daysUntilExpiry = Math.ceil((new Date(course.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
            progress.daysUntilExpiry = daysUntilExpiry;
            progress.isExpiringSoon = daysUntilExpiry <= 7 && daysUntilExpiry > 0;
            progress.isExpired = daysUntilExpiry < 0;
        }

        res.json(progress);
    } catch (error) {
        console.error('Error getting course progress:', error);
        res.status(500).json({ message: 'Error getting course progress', error: error.message });
    }
});

// POST /api/treatment-courses/:courseId/complete-session/:sessionId - Complete a session
router.post('/:courseId/complete-session/:sessionId', async (req, res) => {
    try {
        const { courseId, sessionId } = req.params;
        const sessionData = req.body;

        const session = await db.TreatmentSession.findByPk(sessionId);
        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        // Update session
        await session.update({
            status: 'completed',
            completedDate: new Date(),
            ...sessionData
        });

        // Update course progress
        await updateCourseProgress(courseId);

        res.json({
            session,
            message: 'Session completed successfully'
        });
    } catch (error) {
        console.error('Error completing session:', error);
        res.status(500).json({ message: 'Error completing session', error: error.message });
    }
});

// DELETE /api/treatment-courses/:id - delete
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.TreatmentCourse.destroy({ where: { id } });
    if (result > 0) return res.status(204).send();
    res.status(404).json({ message: 'Treatment course not found' });
  } catch (error) {
    console.error('Error deleting treatment course:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
