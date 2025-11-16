// backend/routes/treatment-courses.js
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

        // Update course
        await course.update({
            completedSessions: completedCount,
            progressPercentage,
            lastCompletedDate: lastSession ? lastSession.completedDate : null,
            status: completedCount >= course.totalSessions ? 'completed' : course.status
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
            includeExpired,
            includeCompleted,
            templatesOnly
        } = req.query;

        const where = {};

        // Nếu yêu cầu chỉ lấy templates
        if (templatesOnly === 'true') {
            where.clientId = null;
        } else {
            if (clientId) where.clientId = clientId;
        }
        
        if (therapistId) where.therapistId = therapistId;
        if (status) where.status = status;

        // Default: exclude expired and cancelled
        if (!includeExpired) {
            if (!where.status) {
                where.status = { [Op.notIn]: ['expired', 'cancelled'] };
            }
        }

        // Default: include completed only if requested
        if (!includeCompleted && !status) {
            where.status = { [Op.notIn]: ['expired', 'cancelled', 'completed'] };
        }

        const courses = await db.TreatmentCourse.findAll({
            where,
            include: [
                {
                    model: db.User,
                    as: 'Client',
                    attributes: ['id', 'name', 'email', 'phone']
                },
                {
                    model: db.Service,
                    as: 'CourseServices',
                    through: {
                        attributes: ['serviceName', 'order']
                    },
                    attributes: ['id', 'name', 'price', 'duration']
                },
                // Keep backward compatibility
                {
                    model: db.Service,
                    attributes: ['id', 'name', 'price', 'duration']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        // Format response to include services array
        const formattedCourses = courses.map(course => {
            const courseData = course.toJSON();
            if (courseData.CourseServices && courseData.CourseServices.length > 0) {
                courseData.services = courseData.CourseServices.map(service => ({
                    serviceId: service.id,
                    serviceName: service.TreatmentCourseService?.serviceName || service.name,
                    order: service.TreatmentCourseService?.order || 0
                }));
            }
            return courseData;
        });

        res.json(formattedCourses);
    } catch (error) {
        console.error('Error fetching treatment courses:', error);
        res.status(500).json({ message: 'Error fetching treatment courses', error: error.message });
    }
});

// GET /api/treatment-courses/:id - Get course details with sessions and services
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const course = await db.TreatmentCourse.findByPk(id, {
            include: [
                {
                    model: db.User,
                    as: 'Client',
                    attributes: ['id', 'name', 'email', 'phone']
                },
                {
                    model: db.Service,
                    as: 'CourseServices',
                    through: {
                        attributes: ['serviceName', 'order']
                    },
                    attributes: ['id', 'name', 'price', 'duration', 'description']
                },
                // Keep backward compatibility
                {
                    model: db.Service,
                    attributes: ['id', 'name', 'price', 'duration', 'description']
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

        // Format services array
        if (courseData.CourseServices && courseData.CourseServices.length > 0) {
            courseData.services = courseData.CourseServices.map(service => ({
                serviceId: service.id,
                serviceName: service.TreatmentCourseService?.serviceName || service.name,
                order: service.TreatmentCourseService?.order || 0,
                price: service.price,
                duration: service.duration,
                description: service.description
            }));
        }

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

// POST /api/treatment-courses - Create new treatment course (package-based)
router.post('/', async (req, res) => {
    const transaction = await db.sequelize.transaction();
    
    try {
        const {
            name,
            description,
            price,
            serviceIds, // Array of service IDs
            services, // Array of {serviceId, serviceName, order}
            serviceId, // DEPRECATED: backward compatibility
            clientId,
            totalSessions,
            sessionsPerWeek,
            treatmentGoals,
            initialSkinCondition,
            consultantId,
            consultantName,
            startDate
        } = req.body;

        console.log('📝 POST /api/treatment-courses - Received data:', {
            name, price, totalSessions, sessionsPerWeek, consultantId,
            servicesCount: services?.length, 
            serviceIdsCount: serviceIds?.length
        });

        // Validate required fields (clientId is optional - for package templates)
        if (!name || price === undefined || price === null || 
            totalSessions === undefined || totalSessions === null || 
            sessionsPerWeek === undefined || sessionsPerWeek === null ||
            !consultantId) {
            await transaction.rollback();
            console.log('❌ Validation failed:', { name, price, totalSessions, sessionsPerWeek, consultantId });
            return res.status(400).json({
                message: 'Missing required fields: name, price, totalSessions, sessionsPerWeek, consultantId',
                received: { name, price, totalSessions, sessionsPerWeek, consultantId }
            });
        }

        // Validate services
        let serviceList = [];
        if (services && Array.isArray(services)) {
            serviceList = services;
        } else if (serviceIds && Array.isArray(serviceIds)) {
            serviceList = serviceIds.map(id => ({ serviceId: id }));
        } else if (serviceId) {
            serviceList = [{ serviceId }];
        }
        
        if (serviceList.length === 0) {
            await transaction.rollback();
            return res.status(400).json({
                message: 'At least one service must be specified'
            });
        }

        // Calculate expiry date
        const courseStartDate = startDate || new Date().toISOString().split('T')[0];
        const expiryDate = calculateExpiryDate(courseStartDate, totalSessions, sessionsPerWeek);

        // Get first service for backward compatibility fields
        const firstService = await db.Service.findByPk(serviceList[0].serviceId);
        if (!firstService) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Service not found' });
        }

        // Create course (can be package template or actual course)
        const course = await db.TreatmentCourse.create({
            id: `tc-${uuidv4()}`,
            name,
            description,
            price,
            serviceId: firstService.id, // DEPRECATED: backward compatibility
            serviceName: firstService.name, // DEPRECATED: backward compatibility
            clientId: clientId || null, // Optional - null for package templates
            totalSessions,
            sessionsPerWeek,
            sessionDuration: firstService.duration || 60,
            treatmentGoals,
            initialSkinCondition,
            consultantId: consultantId || null,
            consultantName,
            startDate: courseStartDate,
            expiryDate,
            status: 'active', // All templates are active by default
            progressPercentage: 0,
            completedSessions: 0,
            isPaused: false
        }, { transaction });

        // Create service associations
        const serviceAssociations = [];
        for (let i = 0; i < serviceList.length; i++) {
            const { serviceId: svcId, serviceName: svcName, order } = serviceList[i];
            const service = await db.Service.findByPk(svcId);
            
            if (service) {
                serviceAssociations.push({
                    treatmentCourseId: course.id,
                    serviceId: svcId,
                    serviceName: svcName || service.name,
                    order: order !== undefined ? order : i + 1
                });
            }
        }

        await db.TreatmentCourseService.bulkCreate(serviceAssociations, { transaction });

        // Auto-generate sessions only if this is for a specific client (not a template)
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

        await db.TreatmentSession.bulkCreate(sessions, { transaction });
        
        console.log(`✅ Created treatment course ${course.id} with ${serviceAssociations.length} services and ${sessions.length} sessions`);

        await transaction.commit();

        res.status(201).json({
            course,
            services: serviceAssociations,
            sessions,
            message: `Treatment course created with ${serviceAssociations.length} services and ${sessions.length} sessions`
        });
        } else {
            // Package template - no sessions generated
            await transaction.commit();
            
            console.log(`✅ Created treatment package template ${course.id} with ${serviceAssociations.length} services`);

            res.status(201).json({
                course,
                services: serviceAssociations,
                message: `Treatment package template created with ${serviceAssociations.length} services`
            });
        }
    } catch (error) {
        await transaction.rollback();
        console.error('Error creating treatment course:', error);
        res.status(500).json({ message: 'Error creating treatment course', error: error.message });
    }
});

// PUT /api/treatment-courses/:id - Update course and services
router.put('/:id', async (req, res) => {
    const transaction = await db.sequelize.transaction();
    
    try {
        const { id } = req.params;
        const { services, ...updates } = req.body;

        const course = await db.TreatmentCourse.findByPk(id);
        if (!course) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Treatment course not found' });
        }

        // Update course basic info
        await course.update(updates, { transaction });

        // Update services if provided
        if (services && Array.isArray(services)) {
            // Delete existing service associations
            await db.TreatmentCourseService.destroy({
                where: { treatmentCourseId: id },
                transaction
            });

            // Create new associations
            const serviceAssociations = [];
            for (let i = 0; i < services.length; i++) {
                const { serviceId, serviceName, order } = services[i];
                const service = await db.Service.findByPk(serviceId);
                
                if (service) {
                    serviceAssociations.push({
                        treatmentCourseId: id,
                        serviceId,
                        serviceName: serviceName || service.name,
                        order: order !== undefined ? order : i + 1
                    });
                }
            }

            if (serviceAssociations.length > 0) {
                await db.TreatmentCourseService.bulkCreate(serviceAssociations, { transaction });
            }
        }

        await transaction.commit();

        // Reload course with services
        const updatedCourse = await db.TreatmentCourse.findByPk(id, {
            include: [{
                model: db.Service,
                as: 'CourseServices',
                through: { attributes: ['serviceName', 'order'] }
            }]
        });

        res.json({
            course: updatedCourse,
            message: 'Treatment course updated successfully'
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Error updating treatment course:', error);
        res.status(500).json({ message: 'Error updating treatment course', error: error.message });
    }
});

// POST /api/treatment-courses/:id/register - Client registers for a treatment course template
router.post('/:id/register', async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;
        const { clientId } = req.body;

        if (!clientId) {
            await transaction.rollback();
            return res.status(400).json({ message: 'clientId is required' });
        }

        // Get the template course
        const template = await db.TreatmentCourse.findByPk(id, { transaction });
        if (!template) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Treatment course template not found' });
        }

        // Template must not have clientId (it should be a template)
        if (template.clientId) {
            await transaction.rollback();
            return res.status(400).json({ message: 'This is not a template course' });
        }

        // Check if client already registered for this template
        const existingRegistration = await db.TreatmentCourse.findOne({
            where: {
                templateId: id,
                clientId: clientId
            },
            transaction
        });

        if (existingRegistration) {
            await transaction.rollback();
            return res.status(400).json({ 
                message: 'Bạn đã đăng ký liệu trình này rồi',
                existingCourse: existingRegistration
            });
        }

        // Create new course for this client based on template
        const startDateObj = new Date();
        const expiryDateStr = calculateExpiryDate(startDateObj, template.totalSessions, template.sessionsPerWeek);

        const clientCourse = await db.TreatmentCourse.create({
            id: `tc-${uuidv4()}`,
            templateId: id, // Link back to template
            name: template.name,
            description: template.description,
            price: template.price,
            clientId: clientId,
            totalSessions: template.totalSessions,
            sessionsPerWeek: template.sessionsPerWeek,
            treatmentGoals: template.treatmentGoals,
            initialSkinCondition: template.initialSkinCondition || 'Chưa đánh giá',
            consultantId: template.consultantId,
            consultantName: template.consultantName,
            startDate: startDateObj.toISOString().split('T')[0],
            expiryDate: expiryDateStr,
            status: 'active',
            completedSessions: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        }, { transaction });

        // Copy services from template
        const templateServices = await db.TreatmentCourseService.findAll({
            where: { treatmentCourseId: id },
            transaction
        });

        if (templateServices.length > 0) {
            const serviceAssociations = templateServices.map(ts => ({
                treatmentCourseId: clientCourse.id,
                serviceId: ts.serviceId,
                serviceName: ts.serviceName,
                order: ts.order
            }));
            await db.TreatmentCourseService.bulkCreate(serviceAssociations, { transaction });
        }

        // Generate sessions for client
        const sessions = [];
        for (let i = 1; i <= template.totalSessions; i++) {
            sessions.push({
                id: `ts-${uuidv4()}`,
                treatmentCourseId: clientCourse.id,
                sessionNumber: i,
                status: 'pending',
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }
        await db.TreatmentSession.bulkCreate(sessions, { transaction });

        await transaction.commit();

        // Reload with full data
        const fullCourse = await db.TreatmentCourse.findByPk(clientCourse.id, {
            include: [
                {
                    model: db.Service,
                    as: 'CourseServices',
                    through: { attributes: ['serviceName', 'order'] }
                },
                {
                    model: db.TreatmentSession,
                    as: 'sessions'
                }
            ]
        });

        res.status(201).json({
            course: fullCourse,
            message: 'Đăng ký liệu trình thành công!'
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Error registering for treatment course:', error);
        res.status(500).json({ message: 'Error registering for treatment course', error: error.message });
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
            pauseReason: reason,
            pausedDate: new Date()
        });

        res.json({
            course,
            message: 'Treatment course paused'
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
            message: `Treatment course resumed. Expiry extended by ${daysPaused} days.`
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

        const progress = {
            courseId: id,
            totalSessions: course.totalSessions,
            completedSessions: completedSessions.length,
            pendingSessions: pendingSessions.length,
            scheduledSessions: scheduledSessions.length,
            progressPercentage: course.progressPercentage,
            startDate: course.startDate,
            expiryDate: course.expiryDate,
            lastCompletedDate: course.lastCompletedDate,
            nextScheduledSession: scheduledSessions[0] || null,
            status: course.status,
            timeline: sessions.map(s => ({
                sessionNumber: s.sessionNumber,
                status: s.status,
                scheduledDate: s.scheduledDate,
                completedDate: s.completedDate,
                therapistName: s.therapistName
            }))
        };

        res.json(progress);
    } catch (error) {
        console.error('Error getting course progress:', error);
        res.status(500).json({ message: 'Error getting course progress', error: error.message });
    }
});

// POST /api/treatment-courses/:courseId/sessions/:sessionId/schedule - Schedule appointment for a session
router.post('/:courseId/sessions/:sessionId/schedule', async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { courseId, sessionId } = req.params;
        const { appointmentDate, appointmentTime, serviceId, staffId, notes } = req.body;

        // Get session
        const session = await db.TreatmentSession.findByPk(sessionId);
        if (!session) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Session not found' });
        }

        // Get course with client info
        const course = await db.TreatmentCourse.findByPk(courseId);
        if (!course) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Treatment course not found' });
        }

        if (!course.clientId) {
            await transaction.rollback();
            return res.status(400).json({ message: 'Cannot schedule session for template course' });
        }

        // Get service info
        const service = await db.Service.findByPk(serviceId);
        if (!service) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Service not found' });
        }

        // Create appointment
        const appointment = await db.Appointment.create({
            id: `apt-${uuidv4()}`,
            userId: course.clientId,
            serviceId: serviceId,
            serviceName: service.name,
            therapistId: staffId || null,
            date: appointmentDate,
            time: appointmentTime,
            status: 'upcoming',
            notesForTherapist: notes || `Buổi ${session.sessionNumber}/${course.totalSessions} - ${course.name}`,
            treatmentCourseId: courseId,
            treatmentSessionId: sessionId
        }, { transaction });

        // Update session status to 'scheduled' and link appointment
        await session.update({
            status: 'scheduled',
            scheduledDate: appointmentDate,
            appointmentId: appointment.id,
            serviceId: serviceId,
            serviceName: service.name,
            staffId: staffId || null,
            updatedAt: new Date()
        }, { transaction });

        await transaction.commit();

        res.status(201).json({
            appointment,
            session,
            message: 'Session scheduled successfully'
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Error scheduling session:', error);
        res.status(500).json({ message: 'Error scheduling session', error: error.message });
    }
});

// POST /api/treatment-courses/:courseId/sessions/:sessionId/complete - Complete a session
router.post('/:courseId/sessions/:sessionId/complete', async (req, res) => {
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

// DELETE /api/treatment-courses/:id - Delete a treatment course
router.delete('/:id', async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;

        const course = await db.TreatmentCourse.findByPk(id);
        if (!course) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Treatment course not found' });
        }

        // Delete associated service records
        await db.TreatmentCourseService.destroy({
            where: { treatmentCourseId: id },
            transaction
        });

        // Delete the course
        await course.destroy({ transaction });

        await transaction.commit();
        res.json({ 
            message: 'Treatment course deleted successfully',
            deletedId: id
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Error deleting treatment course:', error);
        res.status(500).json({ message: 'Error deleting treatment course', error: error.message });
    }
});

module.exports = router;
