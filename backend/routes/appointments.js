
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
    const service = await db.Service.findByPk(serviceId, { 
        include: [{ 
            model: db.ServiceCategory,
            attributes: ['id', 'name', 'description', 'displayOrder']
        }] 
    });
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

        // Map appointments to include client info
        const mappedAppointments = appointments.map(apt => {
            const appointmentData = apt.toJSON();
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

        // If userId is empty or not provided, create a new user
        if (!finalUserId || finalUserId === '') {
            if (!newAppointmentData.customerName || !newAppointmentData.phone) {
                return res.status(400).json({ message: 'Missing customer information: name and phone are required' });
            }

            // Check if user with this phone already exists
            const existingUser = await db.User.findOne({
                where: { phone: newAppointmentData.phone, role: 'Client' }
            });

            if (existingUser) {
                finalUserId = existingUser.id;
            } else {
                // Create new user
                // Generate a random password and hash it
                const tempPassword = `temp-${Date.now()}-${Math.random().toString(36).substring(7)}`;
                const hashedPassword = await bcrypt.hash(tempPassword, 10);
                
                const newUser = await db.User.create({
                    id: `user-${uuidv4()}`,
                    name: newAppointmentData.customerName,
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
                });

                finalUserId = newUser.id;
                console.log(`Created new user: ${finalUserId} for appointment`);
            }
        }

        // Get user name for notification
        const user = await db.User.findByPk(finalUserId);
        const finalUserName = user ? user.name : newAppointmentData.customerName || 'Khách hàng';

        let finalTherapistId = newAppointmentData.therapistId;

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
            } else {
                console.log('Smart assignment could not find an ideal therapist. Leaving unassigned.');
                finalTherapistId = null; 
            }
        }
        
        const service = await db.Service.findByPk(newAppointmentData.serviceId);
        if (!service) return res.status(404).json({ message: 'Service not found' });

        // Use provided status or default to 'pending' (admin-added appointments use 'upcoming')
        const appointmentStatus = newAppointmentData.status || 'pending';

        // Check if this is a treatment course booking (quantity >= 1, meaning all bookings are treatment courses)
        const quantity = newAppointmentData.quantity || 1;
        let treatmentCourseId = null;

        if (quantity >= 1) {
            // Create treatment course
            const startDate = newAppointmentData.date;
            const durationWeeks = newAppointmentData.durationWeeks || (quantity + 1);
            const frequencyType = newAppointmentData.frequencyType || null; // 'weeks_per_session' or 'sessions_per_week'
            const frequencyValue = newAppointmentData.frequencyValue || null;

            // Calculate expiry date
            const expiryDate = new Date(startDate);
            expiryDate.setDate(expiryDate.getDate() + (durationWeeks * 7));

            const treatmentCourse = await db.TreatmentCourse.create({
                id: `tc-${uuidv4()}`,
                serviceId: newAppointmentData.serviceId,
                serviceName: service.name,
                clientId: finalUserId,
                totalSessions: quantity,
                completedSessions: 0,
                startDate: startDate,
                durationWeeks: durationWeeks,
                expiryDate: expiryDate.toISOString().split('T')[0],
                frequencyType: frequencyType,
                frequencyValue: frequencyValue,
                therapistId: finalTherapistId,
                status: 'active',
                notes: newAppointmentData.treatmentCourseNotes || null,
                createdAt: new Date(),
            });

            treatmentCourseId = treatmentCourse.id;

            // Create treatment sessions
            const sessions = [];
            const startDateObj = new Date(startDate);

            for (let i = 1; i <= quantity; i++) {
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
                    const daysBetweenSessions = Math.floor((durationWeeks * 7) / quantity);
                    sessionDate.setDate(sessionDate.getDate() + ((i - 1) * daysBetweenSessions));
                }

                sessions.push({
                    id: `ts-${uuidv4()}`,
                    treatmentCourseId: treatmentCourse.id,
                    sessionNumber: i,
                    status: i === 1 ? 'scheduled' : 'scheduled', // First session is scheduled, others can be updated later
                    sessionDate: sessionDate.toISOString().split('T')[0],
                    sessionTime: i === 1 ? newAppointmentData.time : '09:00', // First session uses appointment time
                    staffId: finalTherapistId || null,
                });
            }

            await db.TreatmentSession.bulkCreate(sessions);
            console.log(`✅ Created treatment course ${treatmentCourse.id} with ${quantity} sessions`);
        }

        // Create appointment
        const createdAppointment = await db.Appointment.create({
            id: `apt-${uuidv4()}`,
            serviceName: service.name,
            status: appointmentStatus,
            userId: finalUserId,
            date: newAppointmentData.date,
            time: newAppointmentData.time,
            serviceId: newAppointmentData.serviceId,
            therapistId: finalTherapistId,
            notesForTherapist: newAppointmentData.notesForTherapist || null,
        });

        // Link first treatment session to appointment if treatment course was created
        if (treatmentCourseId) {
            const firstSession = await db.TreatmentSession.findOne({
                where: {
                    treatmentCourseId: treatmentCourseId,
                    sessionNumber: 1,
                },
            });

            if (firstSession) {
                await firstSession.update({
                    appointmentId: createdAppointment.id,
                    sessionDate: newAppointmentData.date,
                    sessionTime: newAppointmentData.time,
                });
            }
        }

        res.status(201).json({
            ...createdAppointment.toJSON(),
            treatmentCourseId: treatmentCourseId,
        });

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

// Helper: Determine shift type based on time
// Sáng: 9h-16h, Chiều: 16h-22h
const getShiftTypeFromTime = (time) => {
    const [hours] = time.split(':').map(Number);
    if (hours >= 9 && hours < 16) return 'morning';  // Sáng: 9h-16h
    if (hours >= 16 && hours < 22) return 'afternoon'; // Chiều: 16h-22h
    if (hours >= 22 || hours < 9) return 'evening'; // Tối: 22h-9h (hoặc custom)
    return 'custom'; // Fallback for other times
};

// Helper: Calculate shift hours based on time
// Sáng: 9h-16h, Chiều: 16h-22h
const getShiftHoursFromTime = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    let startHour = 9;
    let endHour = 16;
    
    // Determine shift based on time
    if (hours >= 9 && hours < 16) {
        // Morning shift: 9:00 - 16:00
        startHour = 9;
        endHour = 16;
    } else if (hours >= 16 && hours < 22) {
        // Afternoon shift: 16:00 - 22:00
        startHour = 16;
        endHour = 22;
    } else {
        // Evening or custom: use appointment time as reference
        startHour = Math.max(9, Math.min(hours, 22));
        endHour = Math.min(22, startHour + 4);
    }
    
    return {
        start: `${String(startHour).padStart(2, '0')}:00`,
        end: `${String(endHour).padStart(2, '0')}:00`
    };
};

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
        
        // Auto-create staff shift if therapist is assigned and status is 'upcoming'
        if (updatedData.therapistId && updatedData.status === 'upcoming') {
            const therapistId = updatedData.therapistId;
            const appointmentDate = appointment.date;
            const appointmentTime = appointment.time;
            
            // Check if staff already has a shift for this date
            const existingShift = await db.StaffShift.findOne({
                where: {
                    staffId: therapistId,
                    date: appointmentDate,
                    status: { [Op.in]: ['approved', 'pending'] }
                }
            });
            
            if (!existingShift) {
                // Auto-create shift for the staff
                const shiftType = getShiftTypeFromTime(appointmentTime);
                const shiftHours = getShiftHoursFromTime(appointmentTime);
                
                try {
                    await db.StaffShift.create({
                        id: `shift-${uuidv4()}`,
                        staffId: therapistId,
                        date: appointmentDate,
                        shiftType: shiftType,
                        status: 'approved', // Auto-approved since admin assigned
                        shiftHours: shiftHours,
                        notes: `Tự động tạo khi phân công lịch hẹn ${appointment.serviceName}`
                    });
                    console.log(`✅ Auto-created shift for staff ${therapistId} on ${appointmentDate} (${shiftType})`);
                } catch (shiftError) {
                    console.error('Error auto-creating staff shift:', shiftError);
                    // Don't fail the appointment update if shift creation fails
                }
            } else {
                // Staff already has a shift, check if we need to update it
                const existingShiftType = existingShift.shiftType;
                const requiredShiftType = getShiftTypeFromTime(appointmentTime);
                const requiredHours = getShiftHoursFromTime(appointmentTime);
                
                // If appointment time doesn't match existing shift type, update shift
                if (existingShiftType !== requiredShiftType) {
                    // Check if existing shift hours cover the appointment time
                    const existingHours = existingShift.shiftHours || {};
                    const appointmentHour = parseInt(appointmentTime.split(':')[0]);
                    const existingStart = existingHours.start ? parseInt(existingHours.start.split(':')[0]) : 9;
                    const existingEnd = existingHours.end ? parseInt(existingHours.end.split(':')[0]) : 16;
                    
                    // If appointment time is outside existing shift hours, update shift
                    if (appointmentHour < existingStart || appointmentHour >= existingEnd) {
                        // Merge hours to cover both shifts
                        const mergedHours = {
                            start: Math.min(existingStart, parseInt(requiredHours.start.split(':')[0])),
                            end: Math.max(existingEnd, parseInt(requiredHours.end.split(':')[0]))
                        };
                        
                        try {
                            await existingShift.update({
                                shiftType: 'custom',
                                shiftHours: {
                                    start: `${String(mergedHours.start).padStart(2, '0')}:00`,
                                    end: `${String(mergedHours.end).padStart(2, '0')}:00`
                                },
                                notes: existingShift.notes ? 
                                    `${existingShift.notes}; Cập nhật để bao gồm lịch hẹn ${appointment.serviceName}` :
                                    `Cập nhật để bao gồm lịch hẹn ${appointment.serviceName}`
                            });
                            console.log(`✅ Updated shift for staff ${therapistId} to include appointment time`);
                        } catch (updateError) {
                            console.error('Error updating staff shift:', updateError);
                        }
                    }
                }
            }
        }
        
        // Update treatment session staffId when therapist is assigned
        if (updatedData.therapistId) {
            try {
                // Find treatment session linked to this appointment
                const linkedSession = await db.TreatmentSession.findOne({
                    where: { appointmentId: id }
                });
                
                if (linkedSession) {
                    // Update the linked session's staffId
                    await linkedSession.update({
                        staffId: updatedData.therapistId
                    });
                    console.log(`✅ Updated treatment session ${linkedSession.id} with staffId: ${updatedData.therapistId}`);
                    
                    // Also update the treatment course's therapistId if this is the first session
                    if (linkedSession.sessionNumber === 1) {
                        const treatmentCourse = await db.TreatmentCourse.findByPk(linkedSession.treatmentCourseId);
                        if (treatmentCourse && !treatmentCourse.therapistId) {
                            await treatmentCourse.update({
                                therapistId: updatedData.therapistId
                            });
                            console.log(`✅ Updated treatment course ${treatmentCourse.id} with therapistId: ${updatedData.therapistId}`);
                        }
                    }
                } else {
                    // If no session linked, try to find treatment course from appointment
                    // and update all sessions in that course
                    const appointment = await db.Appointment.findByPk(id);
                    if (appointment) {
                        // Find treatment course by serviceId and userId
                        const treatmentCourse = await db.TreatmentCourse.findOne({
                            where: {
                                serviceId: appointment.serviceId,
                                clientId: appointment.userId,
                                status: 'active'
                            },
                            order: [['createdAt', 'DESC']] // Get the most recent one
                        });
                        
                        if (treatmentCourse) {
                            // Update treatment course therapistId
                            await treatmentCourse.update({
                                therapistId: updatedData.therapistId
                            });
                            
                            // Update all sessions in the course that don't have staffId yet
                            await db.TreatmentSession.update(
                                { staffId: updatedData.therapistId },
                                {
                                    where: {
                                        treatmentCourseId: treatmentCourse.id,
                                        staffId: null
                                    }
                                }
                            );
                            console.log(`✅ Updated treatment course ${treatmentCourse.id} and sessions with therapistId: ${updatedData.therapistId}`);
                        }
                    }
                }
            } catch (sessionError) {
                console.error('Error updating treatment session staffId:', sessionError);
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
                
                // Update treatment session when appointment is completed
                try {
                    // Find treatment session linked to this appointment
                    const linkedSession = await db.TreatmentSession.findOne({
                        where: { appointmentId: id }
                    });
                    
                    if (linkedSession) {
                        // Update the session status to completed
                        await linkedSession.update({
                            status: 'completed',
                            completedAt: new Date(),
                        });
                        console.log(`✅ Updated treatment session ${linkedSession.id} to completed`);
                        
                        // Update course progress
                        const treatmentCourse = await db.TreatmentCourse.findByPk(linkedSession.treatmentCourseId);
                        if (treatmentCourse) {
                            // Count completed sessions
                            const completedCount = await db.TreatmentSession.count({
                                where: {
                                    treatmentCourseId: treatmentCourse.id,
                                    status: 'completed',
                                },
                            });
                            
                            // Update course completedSessions
                            await treatmentCourse.update({
                                completedSessions: completedCount,
                            });
                            
                            // Only mark course as completed if all sessions are completed
                            if (completedCount >= treatmentCourse.totalSessions) {
                                await treatmentCourse.update({
                                    status: 'completed',
                                });
                                console.log(`✅ Treatment course ${treatmentCourse.id} marked as completed`);
                            }
                            
                            console.log(`✅ Updated treatment course ${treatmentCourse.id} progress: ${completedCount}/${treatmentCourse.totalSessions}`);
                        }
                    }
                } catch (sessionError) {
                    console.error('Error updating treatment session when appointment completed:', sessionError);
                    // Don't fail the appointment update if session update fails
                }
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

        // Treatment course functionality removed

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
