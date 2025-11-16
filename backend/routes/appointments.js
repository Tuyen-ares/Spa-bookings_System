
// backend/routes/appointments.js
const express = require('express');
const router = express.Router();
const db = require('../config/database'); // Sequelize models
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

// --- Helper Functions ---

// Helper function to create notification for admins
const notifyAdmins = async (type, title, message, relatedId = null) => {
    try {
        console.log(`[notifyAdmins] Starting notification creation - Type: ${type}, Title: ${title}`);
        
        // Get all admin users
        const admins = await db.User.findAll({
            where: { role: 'Admin', status: 'Active' }
        });

        console.log(`[notifyAdmins] Found ${admins.length} admin users`);

        if (admins.length === 0) {
            console.warn('[notifyAdmins] No admin users found to notify');
            return;
        }

        // Create notification for each admin
        const notifications = admins.map(admin => ({
            id: `notif-${uuidv4()}`,
            userId: admin.id,
            type,
            title,
            message,
            relatedId,
            sentVia: 'app',
            isRead: false,
            emailSent: false,
            createdAt: new Date(),
        }));

        console.log(`[notifyAdmins] Attempting to create ${notifications.length} notifications`);
        
        await db.Notification.bulkCreate(notifications);
        
        console.log(`[notifyAdmins] ✅ Successfully created ${notifications.length} admin notifications`);
    } catch (error) {
        console.error('[notifyAdmins] ❌ Error creating admin notifications:', error.message);
        console.error('[notifyAdmins] Error details:', error);
        // Don't throw error - notification failure shouldn't break main operation
    }
};

const updateUserAndWalletAfterAppointment = async (userId, appointment) => { /* ... (same as before) ... */ };

const findBestTherapist = async (serviceId, userId, date, time) => {
    // 1. Get service and its category name (use association ServiceCategory)
    const service = await db.Service.findByPk(serviceId, { include: [{ model: db.ServiceCategory }] });
    const serviceCategory = service && service.ServiceCategory ? service.ServiceCategory.name : null;
    if (!service || !serviceCategory) {
        console.warn(`Smart assignment: Service or service category not found for serviceId: ${serviceId}`);
        return null;
    }

    // 2. Get all technicians available for that time slot based on their registered availability
    // 2. Get all staff availability for that date/time and include the related User + Staff profile
    const availableStaffEntries = await db.StaffAvailability.findAll({
        where: {
            date: date,
            timeSlots: {
                [Op.like]: `%"time":"${time}"%`
            }
        },
        include: [{ 
            model: db.User, 
            where: { role: 'Staff', status: 'Active' }
        }]
    });

    // Build eligible technicians from availability entries: ensure the matching time slot explicitly allows this serviceId
    let eligibleTechnicians = [];
    for (const avail of availableStaffEntries) {
        try {
            const slots = Array.isArray(avail.timeSlots) ? avail.timeSlots : [];
            const matchingSlot = slots.find(s => s.time === time);
            if (!matchingSlot) continue;
            // If availableServiceIds exists, ensure this serviceId is included (or allow all if missing)
            if (matchingSlot.availableServiceIds && Array.isArray(matchingSlot.availableServiceIds) && matchingSlot.availableServiceIds.length > 0) {
                if (!matchingSlot.availableServiceIds.includes(serviceId)) continue;
            }
            if (avail.User) eligibleTechnicians.push(avail.User);
        } catch (e) {
            // skip malformed availability entry
            continue;
        }
    }

    // 3. Filter by specialty and ensure they are not already booked at that time
    const bookedTherapistIds = (await db.Appointment.findAll({
        where: { date, time, status: { [Op.notIn]: ['cancelled', 'completed'] } },
        attributes: ['therapistId']
    })).map(app => app.therapistId);
    
    eligibleTechnicians = eligibleTechnicians.filter(tech => {
        // Note: Staff table removed - specialty and staffRole info not available
        // For now, accept all staff with role 'Staff' and status 'Active'
        const isStaff = tech.role === 'Staff' && tech.status === 'Active';
        const isAlreadyBooked = bookedTherapistIds.includes(tech.id);
        return isStaff && !isAlreadyBooked;
    });

    if (eligibleTechnicians.length === 0) {
        console.log(`Smart assignment: No eligible technicians found for service '${service.name}' at ${date} ${time}.`);
        return null;
    }

    if (eligibleTechnicians.length === 1) {
        return eligibleTechnicians[0]; // Only one choice
    }

    // 4. Score the remaining technicians
    const scoredTechnicians = [];
    for (const tech of eligibleTechnicians) {
        let score = 0;

        // Score 1: Customer History (High weight)
        const pastAppointmentsCount = await db.Appointment.count({
            where: { userId: userId, therapistId: tech.id, status: 'completed' }
        });
        if (pastAppointmentsCount > 0) {
            score += 100 + (pastAppointmentsCount * 10); // Bonus for repeat visits
        }

        // Score 2: Workload Balancing (Medium weight, inverse)
        const dailyWorkload = await db.Appointment.count({
            where: { therapistId: tech.id, date: date, status: { [Op.not]: 'cancelled' } }
        });
        score += Math.max(0, 50 - (dailyWorkload * 10)); // Higher score for less work

    // Note: StaffTier table removed - tier scoring disabled
        
        scoredTechnicians.push({ tech, score });
    }

    // 5. Find the best one
    if (scoredTechnicians.length === 0) return null;

    scoredTechnicians.sort((a, b) => b.score - a.score);

    console.log("Smart Assignment Scoring:", scoredTechnicians.map(s => ({name: s.tech.name, score: s.score})));

    return scoredTechnicians[0].tech;
};


// --- API Endpoints ---

// GET /api/appointments
router.get('/', async (req, res) => {
    try {
        const appointments = await db.Appointment.findAll({
            include: [
                {
                    model: db.User,
                    as: 'Client',
                    attributes: ['id', 'name', 'email', 'phone']
                },
                {
                    model: db.User,
                    as: 'Therapist',
                    attributes: ['id', 'name', 'email']
                },
                {
                    model: db.Service,
                    attributes: ['id', 'name', 'description']
                }
            ],
            order: [['date', 'DESC'], ['time', 'ASC']]
        });

        // Map appointments to ensure userName is included
        const mappedAppointments = appointments.map(apt => {
            const appointmentData = apt.toJSON();
            // Ensure userName is populated from Client association or from appointment field
            if (!appointmentData.userName && appointmentData.Client && appointmentData.Client.name) {
                appointmentData.userName = appointmentData.Client.name;
            }
            // Ensure Client association is preserved
            if (appointmentData.Client) {
                appointmentData.Client = {
                    id: appointmentData.Client.id,
                    name: appointmentData.Client.name,
                    email: appointmentData.Client.email,
                    phone: appointmentData.Client.phone
                };
            }
            return appointmentData;
        });

        console.log('Appointments API - Fetched', mappedAppointments.length, 'appointments');
        if (mappedAppointments.length > 0) {
            console.log('Sample appointment:', {
                id: mappedAppointments[0].id,
                userName: mappedAppointments[0].userName,
                hasClient: !!mappedAppointments[0].Client,
                status: mappedAppointments[0].status
            });
        }

        res.json(mappedAppointments);
    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/appointments/user/:userId
router.get('/user/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const userAppointments = await db.Appointment.findAll({ where: { userId }, include: ['Service', 'Therapist'] });
        res.json(userAppointments);
    } catch (error) {
        console.error('Error fetching user appointments:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/appointments
router.post('/', async (req, res) => {
    const newAppointmentData = req.body;
    if (!newAppointmentData.serviceId || !newAppointmentData.date || !newAppointmentData.time) {
        return res.status(400).json({ message: 'Missing required appointment data' });
    }

    try {
        let finalUserId = newAppointmentData.userId;
        let finalUserName = newAppointmentData.userName;

        // If userId is empty or not provided, create a new user
        if (!finalUserId || finalUserId === '') {
            if (!newAppointmentData.userName || !newAppointmentData.phone) {
                return res.status(400).json({ message: 'Missing customer information: name and phone are required' });
            }

            // Check if user with this phone already exists
            const existingUser = await db.User.findOne({
                where: { phone: newAppointmentData.phone, role: 'Client' }
            });

            if (existingUser) {
                finalUserId = existingUser.id;
                finalUserName = existingUser.name;
            } else {
                // Create new user
                // Generate a random password and hash it
                const tempPassword = `temp-${Date.now()}-${Math.random().toString(36).substring(7)}`;
                const hashedPassword = await bcrypt.hash(tempPassword, 10);
                
                const newUser = await db.User.create({
                    id: `user-${uuidv4()}`,
                    name: newAppointmentData.userName,
                    phone: newAppointmentData.phone,
                    email: newAppointmentData.email || `client-${Date.now()}@temp.com`,
                    password: hashedPassword, // Hashed temporary password, user should change it
                    role: 'Client',
                    status: 'Active',
                });

                // Create wallet for new user
                await db.Wallet.create({
                    id: `wallet-${uuidv4()}`,
                    userId: newUser.id,
                    points: 0,
                    totalSpent: 0,
                    tierLevel: 1,
                    pointsHistory: [],
                });

                finalUserId = newUser.id;
                finalUserName = newUser.name;
                console.log(`Created new user: ${finalUserId} for appointment`);
            }
        }

        let finalTherapistId = newAppointmentData.therapistId;
        let finalTherapistName = newAppointmentData.therapist;

        // Smart assignment logic (only if therapist not specified)
        if (!newAppointmentData.therapistId || newAppointmentData.therapistId === 'any') {
            console.log("Attempting smart assignment...");
            const bestTherapist = await findBestTherapist(
                newAppointmentData.serviceId,
                finalUserId,
                newAppointmentData.date,
                newAppointmentData.time
            );

            if (bestTherapist) {
                console.log(`Smart assignment selected: ${bestTherapist.name}`);
                finalTherapistId = bestTherapist.id;
                finalTherapistName = bestTherapist.name;
            } else {
                console.log('Smart assignment could not find an ideal therapist. Leaving unassigned.');
                finalTherapistId = null; 
                finalTherapistName = 'Sẽ được phân công';
            }
        } else {
            // Get therapist name if ID is provided
            const therapist = await db.User.findByPk(newAppointmentData.therapistId);
            if (therapist) {
                finalTherapistName = therapist.name;
            }
        }
        
        const service = await db.Service.findByPk(newAppointmentData.serviceId);
        if (!service) return res.status(404).json({ message: 'Service not found' });

        // Get user name for userName field (if not already set)
        if (!finalUserName) {
            const user = await db.User.findByPk(finalUserId);
            finalUserName = user ? user.name : newAppointmentData.userName;
        }

        // Use provided status or default to 'pending' (admin-added appointments use 'upcoming')
        const appointmentStatus = newAppointmentData.status || 'pending';

        const createdAppointment = await db.Appointment.create({
            id: `apt-${uuidv4()}`,
            serviceName: service.name,
            status: appointmentStatus,
            userId: finalUserId,
            userName: finalUserName,
            date: newAppointmentData.date,
            time: newAppointmentData.time,
            serviceId: newAppointmentData.serviceId,
            therapistId: finalTherapistId,
            therapist: finalTherapistName,
            notesForTherapist: newAppointmentData.notesForTherapist || null,
            treatmentCourseId: newAppointmentData.treatmentCourseId || null,
        });

        // If this appointment is for a treatment course, create a treatment course instance
        if (newAppointmentData.treatmentCourseId) {
            try {
                // Get the template treatment course
                const templateCourse = await db.TreatmentCourse.findByPk(newAppointmentData.treatmentCourseId);
                if (templateCourse) {
                    // Create a new treatment course instance for this client
                    const treatmentCourseInstance = await db.TreatmentCourse.create({
                        id: `tc-${uuidv4()}`,
                        serviceId: templateCourse.serviceId,
                        serviceName: templateCourse.serviceName,
                        clientId: newAppointmentData.userId,
                        totalSessions: templateCourse.totalSessions,
                        sessionsPerWeek: templateCourse.sessionsPerWeek,
                        weekDays: templateCourse.weekDays,
                        sessionDuration: templateCourse.sessionDuration,
                        sessionTime: templateCourse.sessionTime,
                        description: templateCourse.description,
                        status: 'active',
                        initialAppointmentId: createdAppointment.id,
                        expiryDate: templateCourse.expiryDate,
                        imageUrl: templateCourse.imageUrl,
                        sessions: templateCourse.sessions || [],
                        nextAppointmentDate: newAppointmentData.date,
                    });
                    console.log(`Treatment course instance created: ${treatmentCourseInstance.id} for user ${newAppointmentData.userId}`);
                }
            } catch (tcError) {
                console.error('Error creating treatment course instance:', tcError);
                // Don't fail the appointment creation if treatment course creation fails
                // The appointment is already created, so we just log the error
            }
        }

        res.status(201).json(createdAppointment);

        // Notify admins about new appointment (async, don't wait)
        notifyAdmins(
            'new_appointment',
            'Lịch hẹn mới',
            `${finalUserName} đã đặt lịch ${service.name} vào ${new Date(newAppointmentData.date).toLocaleDateString('vi-VN')} lúc ${newAppointmentData.time}`,
            createdAppointment.id
        );
    } catch (error) {
        console.error('Error creating appointment:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// PUT /api/appointments/:id
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const updatedData = req.body;

    try {
        const appointment = await db.Appointment.findByPk(id);
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }
        
        const oldStatus = appointment.status;
        await appointment.update(updatedData);
        
        // If appointment is completed and linked to a treatment session, mark session as completed
        if (updatedData.status === 'completed' && appointment.treatmentSessionId && appointment.treatmentCourseId) {
            try {
                const session = await db.TreatmentSession.findByPk(appointment.treatmentSessionId);
                if (session && session.status !== 'completed') {
                    await session.update({
                        status: 'completed',
                        completedDate: new Date()
                    });
                    
                    // Update course progress
                    const course = await db.TreatmentCourse.findByPk(appointment.treatmentCourseId);
                    if (course) {
                        const completedCount = await db.TreatmentSession.count({
                            where: {
                                treatmentCourseId: course.id,
                                status: 'completed'
                            }
                        });
                        
                        const progressPercentage = course.totalSessions > 0
                            ? Math.round((completedCount / course.totalSessions) * 100)
                            : 0;
                        
                        await course.update({
                            completedSessions: completedCount,
                            progressPercentage,
                            lastCompletedDate: new Date(),
                            status: completedCount >= course.totalSessions ? 'completed' : course.status
                        });
                        
                        console.log(`✅ Session ${session.sessionNumber} completed. Course progress: ${completedCount}/${course.totalSessions}`);
                    }
                }
            } catch (sessionError) {
                console.error('Error updating treatment session:', sessionError);
                // Don't fail the appointment update if session update fails
            }
        }
        
        // Gửi thông báo khi status thay đổi
        if (db.Notification && oldStatus !== updatedData.status) {
            let notifType = 'system';
            let notifTitle = 'Cập nhật lịch hẹn';
            let notifMessage = `Lịch hẹn ${appointment.serviceName} đã được cập nhật`;
            
            if (updatedData.status === 'confirmed' || updatedData.status === 'in-progress') {
                notifType = 'appointment_confirmed';
                notifTitle = 'Lịch hẹn đã xác nhận';
                notifMessage = `Lịch hẹn ${appointment.serviceName} vào ${appointment.date} lúc ${appointment.time} đã được xác nhận`;
            } else if (updatedData.status === 'cancelled') {
                notifType = 'appointment_cancelled';
                notifTitle = 'Lịch hẹn đã hủy';
                notifMessage = `Lịch hẹn ${appointment.serviceName} vào ${appointment.date} lúc ${appointment.time} đã bị hủy`;
            } else if (updatedData.status === 'completed') {
                notifType = 'appointment_completed';
                notifTitle = 'Hoàn thành lịch hẹn';
                notifMessage = `Lịch hẹn ${appointment.serviceName} đã hoàn thành`;
            }
            
            try {
                await db.Notification.create({
                    id: `notif-${uuidv4()}`,
                    userId: appointment.userId,
                    type: notifType,
                    title: notifTitle,
                    message: notifMessage,
                    relatedId: appointment.id,
                    sentVia: 'app',
                    isRead: false,
                    createdAt: new Date(),
                });
            } catch (notifError) {
                console.error('Error creating notification:', notifError);
            }
        }
        
        res.json(appointment);
    } catch (error) {
        console.error('Error updating appointment:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// PUT /api/appointments/:id/confirm - Admin xác nhận appointment từ pending -> scheduled
router.put('/:id/confirm', async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { id } = req.params;
        
        const appointment = await db.Appointment.findByPk(id, { transaction });
        if (!appointment) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Appointment not found' });
        }

        // Chỉ có thể xác nhận appointment đang pending
        if (appointment.status !== 'pending') {
            await transaction.rollback();
            return res.status(400).json({ message: `Cannot confirm appointment with status: ${appointment.status}` });
        }

        // Update appointment status to scheduled
        await appointment.update({
            status: 'scheduled'
        }, { transaction });

        // Nếu appointment thuộc treatment course, update session và tiến độ course
        if (appointment.treatmentSessionId && appointment.treatmentCourseId) {
            const session = await db.TreatmentSession.findByPk(appointment.treatmentSessionId, { transaction });
            if (session) {
                await session.update({
                    status: 'scheduled',
                    scheduledDate: appointment.date,
                    appointmentId: appointment.id,
                    serviceId: appointment.serviceId,
                    serviceName: appointment.serviceName,
                    staffId: appointment.therapistId || null
                }, { transaction });

                // Update course progress (increment scheduled sessions count)
                const course = await db.TreatmentCourse.findByPk(appointment.treatmentCourseId, { transaction });
                if (course) {
                    const scheduledCount = await db.TreatmentSession.count({
                        where: {
                            treatmentCourseId: course.id,
                            status: 'scheduled'
                        }
                    });

                    const completedCount = await db.TreatmentSession.count({
                        where: {
                            treatmentCourseId: course.id,
                            status: 'completed'
                        }
                    });

                    const totalScheduledOrCompleted = scheduledCount + completedCount;
                    const progressPercentage = course.totalSessions > 0
                        ? Math.round((totalScheduledOrCompleted / course.totalSessions) * 100)
                        : 0;

                    await course.update({
                        progressPercentage: progressPercentage,
                        status: totalScheduledOrCompleted >= course.totalSessions ? 'completed' : 'in-progress'
                    }, { transaction });

                    console.log(`✅ Appointment confirmed. Session ${session.sessionNumber} scheduled. Course progress: ${totalScheduledOrCompleted}/${course.totalSessions}`);
                }
            }
        }

        await transaction.commit();

        res.json({
            appointment,
            message: 'Appointment confirmed successfully'
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Error confirming appointment:', error);
        res.status(500).json({ message: 'Error confirming appointment', error: error.message });
    }
});

module.exports = router;
