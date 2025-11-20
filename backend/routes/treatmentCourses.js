// backend/routes/treatmentCourses.js - Updated to match db.txt schema
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');

// Helper: Calculate expiry date based on startDate and durationWeeks
const calculateExpiryDate = (startDate, durationWeeks) => {
    const expiryDate = new Date(startDate);
    expiryDate.setDate(expiryDate.getDate() + (durationWeeks * 7));
    return expiryDate.toISOString().split('T')[0];
};

// Helper: Calculate default durationWeeks (totalSessions + 1)
const calculateDefaultDurationWeeks = (totalSessions) => {
    return totalSessions + 1;
};

// GET /api/treatment-courses - Get all treatment courses
router.get('/', async (req, res) => {
    try {
        const { clientId, status, serviceId } = req.query;
        const where = {};
        
        if (clientId) where.clientId = clientId;
        if (status) where.status = status;
        if (serviceId) where.serviceId = serviceId;

        const courses = await db.TreatmentCourse.findAll({
            where,
            include: [
                { 
                    model: db.Service,
                    attributes: ['id', 'name', 'description', 'price', 'duration']
                },
                { 
                    model: db.User, 
                    as: 'Client',
                    attributes: ['id', 'name', 'email', 'phone']
                },
                { 
                    model: db.User, 
                    as: 'Therapist',
                    attributes: ['id', 'name', 'email', 'phone'],
                    required: false
                },
            ],
            order: [['createdAt', 'DESC']],
        });

        res.json(courses);
    } catch (error) {
        console.error('Error fetching treatment courses:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/treatment-courses/:id - Get treatment course details with sessions
router.get('/:id', async (req, res) => {
    try {
        const course = await db.TreatmentCourse.findByPk(req.params.id, {
            include: [
                { model: db.Service, as: 'Service' },
                { model: db.User, as: 'Client' },
                { model: db.User, as: 'Therapist' },
                {
                    model: db.TreatmentSession,
                    as: 'TreatmentSessions',
                    include: [
                        { 
                            model: db.Appointment, 
                            as: 'Appointment',
                            include: [
                                {
                                    model: db.User,
                                    as: 'Therapist',
                                    attributes: ['id', 'name', 'email', 'phone']
                                }
                            ]
                        },
                        { 
                            model: db.User, 
                            as: 'Staff',
                            attributes: ['id', 'name', 'email', 'phone'],
                            required: false
                        },
                    ],
                    order: [['sessionNumber', 'ASC']],
                },
            ],
        });

        if (!course) {
            return res.status(404).json({ message: 'Treatment course not found' });
        }

        res.json(course);
    } catch (error) {
        console.error('Error fetching course details:', error);
        res.status(500).json({ message: 'Error fetching course details', error: error.message });
    }
});

// POST /api/treatment-courses - Create new treatment course
router.post('/', async (req, res) => {
    try {
        const {
            serviceId,
            clientId,
            totalSessions,
            startDate,
            durationWeeks, // Optional, defaults to totalSessions + 1
            frequencyType, // 'weeks_per_session' or 'sessions_per_week'
            frequencyValue, // e.g., 2 (weeks per session or sessions per week)
            therapistId,
            notes,
        } = req.body;

        // Validate required fields
        if (!serviceId || !clientId || !totalSessions) {
            return res.status(400).json({
                message: 'Missing required fields: serviceId, clientId, totalSessions'
            });
        }

        // Get service info
        const service = await db.Service.findByPk(serviceId);
        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }

        // Calculate dates
        const courseStartDate = startDate || new Date().toISOString().split('T')[0];
        const finalDurationWeeks = durationWeeks || calculateDefaultDurationWeeks(totalSessions);
        const expiryDate = calculateExpiryDate(courseStartDate, finalDurationWeeks);

        // Create course
        const course = await db.TreatmentCourse.create({
            id: `tc-${uuidv4()}`,
            serviceId,
            serviceName: service.name,
            clientId,
            totalSessions,
            completedSessions: 0,
            startDate: courseStartDate,
            durationWeeks: finalDurationWeeks,
            expiryDate,
            frequencyType: frequencyType || null,
            frequencyValue: frequencyValue || null,
            therapistId: therapistId || null,
            status: 'active',
            notes: notes || null,
            createdAt: new Date(),
        });

        // Auto-generate treatment sessions
        const sessions = [];
        const startDateObj = new Date(courseStartDate);

        for (let i = 1; i <= totalSessions; i++) {
            let sessionDate = new Date(startDateObj);
            
            // Calculate session date based on frequency
            if (frequencyType === 'sessions_per_week' && frequencyValue) {
                // e.g., 2 sessions per week = every 3-4 days
                const daysBetweenSessions = Math.floor(7 / frequencyValue);
                sessionDate.setDate(sessionDate.getDate() + ((i - 1) * daysBetweenSessions));
            } else if (frequencyType === 'weeks_per_session' && frequencyValue) {
                // e.g., 2 weeks per session = every 14 days
                sessionDate.setDate(sessionDate.getDate() + ((i - 1) * frequencyValue * 7));
            } else {
                // Default: spread evenly over durationWeeks
                const daysBetweenSessions = Math.floor((finalDurationWeeks * 7) / totalSessions);
                sessionDate.setDate(sessionDate.getDate() + ((i - 1) * daysBetweenSessions));
            }

            sessions.push({
                id: `ts-${uuidv4()}`,
                treatmentCourseId: course.id,
                sessionNumber: i,
                status: 'scheduled',
                sessionDate: sessionDate.toISOString().split('T')[0],
                sessionTime: '09:00', // Default time, can be updated when appointment is created
                staffId: therapistId || null,
            });
        }

        await db.TreatmentSession.bulkCreate(sessions);
        console.log(`✅ Created treatment course ${course.id} with ${sessions.length} sessions`);

        res.status(201).json({
            course,
            message: `Treatment course created with ${totalSessions} sessions`
        });
    } catch (error) {
        console.error('Error creating treatment course:', error);
        res.status(500).json({ message: 'Error creating treatment course', error: error.message });
    }
});

// PUT /api/treatment-courses/:id - Update treatment course
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const course = await db.TreatmentCourse.findByPk(id);
        if (!course) {
            return res.status(404).json({ message: 'Treatment course not found' });
        }

        // If durationWeeks is updated, recalculate expiryDate
        if (updates.durationWeeks !== undefined) {
            updates.expiryDate = calculateExpiryDate(
                updates.startDate || course.startDate,
                updates.durationWeeks
            );
        }

        await course.update(updates);
        res.json(course);
    } catch (error) {
        console.error('Error updating treatment course:', error);
        res.status(500).json({ message: 'Error updating treatment course', error: error.message });
    }
});

// DELETE /api/treatment-courses/:id - Delete treatment course
router.delete('/:id', async (req, res) => {
    try {
        const course = await db.TreatmentCourse.findByPk(req.params.id);
        if (!course) {
            return res.status(404).json({ message: 'Treatment course not found' });
        }

        await course.destroy();
        res.json({ message: 'Treatment course deleted successfully' });
    } catch (error) {
        console.error('Error deleting treatment course:', error);
        res.status(500).json({ message: 'Error deleting treatment course', error: error.message });
    }
});

// PUT /api/treatment-courses/:id/complete-session - Mark a session as completed
router.put('/:id/complete-session', async (req, res) => {
    try {
        const { id } = req.params;
        const { sessionNumber, customerStatusNotes, adminNotes } = req.body;

        const course = await db.TreatmentCourse.findByPk(id);
        if (!course) {
            return res.status(404).json({ message: 'Treatment course not found' });
        }

        const session = await db.TreatmentSession.findOne({
            where: {
                treatmentCourseId: id,
                sessionNumber: sessionNumber,
            },
        });

        if (!session) {
            return res.status(404).json({ message: 'Treatment session not found' });
        }

        await session.update({
            status: 'completed',
            customerStatusNotes: customerStatusNotes || null,
            adminNotes: adminNotes || null,
            completedAt: new Date(),
        });

        // Update course completedSessions
        const completedCount = await db.TreatmentSession.count({
            where: {
                treatmentCourseId: id,
                status: 'completed',
            },
        });

        let newStatus = course.status;
        if (completedCount >= course.totalSessions) {
            newStatus = 'completed';
        }

        await course.update({
            completedSessions: completedCount,
            status: newStatus,
        });

        res.json({ course, session });
    } catch (error) {
        console.error('Error completing session:', error);
        res.status(500).json({ message: 'Error completing session', error: error.message });
    }
});

module.exports = router;
