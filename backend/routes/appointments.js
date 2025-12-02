
// backend/routes/appointments.js
const express = require('express');
const router = express.Router();
const db = require('../config/database'); // Sequelize models
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

// --- Helper Functions ---

/**
 * Helper function: Xác định paymentStatus của appointment dựa trên TreatmentCourse hoặc buổi 1
 * Logic: Nếu TreatmentCourse đã thanh toán HOẶC buổi 1 đã thanh toán → appointment = 'Paid'
 */
async function getAppointmentPaymentStatus(appointmentData) {
    try {
        console.log(`\n🔍 [getAppointmentPaymentStatus] Checking appointment ${appointmentData.id}`);
        console.log(`   Current paymentStatus: ${appointmentData.paymentStatus}`);
        console.log(`   Has TreatmentSession: ${!!appointmentData.TreatmentSession}`);
        console.log(`   Has bookingGroupId: ${!!appointmentData.bookingGroupId} (${appointmentData.bookingGroupId || 'N/A'})`);
        
        // Cách 1: Kiểm tra TreatmentCourse paymentStatus (nếu có trong query)
        if (appointmentData.TreatmentSession && appointmentData.TreatmentSession.TreatmentCourse) {
            const treatmentCourse = appointmentData.TreatmentSession.TreatmentCourse;
            console.log(`   ✅ Found TreatmentCourse in query: ${treatmentCourse.id}, paymentStatus: ${treatmentCourse.paymentStatus}`);
            if (treatmentCourse.paymentStatus === 'Paid') {
                console.log(`   ✅ TreatmentCourse is Paid → Returning 'Paid'`);
                return 'Paid';
            }
        }
        
        // Cách 2: Tìm TreatmentCourse qua TreatmentSession hoặc bookingGroupId
        let treatmentCourseId = null;
        
        // Ưu tiên lấy từ TreatmentSession.treatmentCourseId
        if (appointmentData.TreatmentSession) {
            // Kiểm tra cả treatmentCourseId và TreatmentCourse.id
            if (appointmentData.TreatmentSession.treatmentCourseId) {
                treatmentCourseId = appointmentData.TreatmentSession.treatmentCourseId;
                console.log(`   ✅ Found treatmentCourseId from TreatmentSession.treatmentCourseId: ${treatmentCourseId}`);
            } else if (appointmentData.TreatmentSession.TreatmentCourse && appointmentData.TreatmentSession.TreatmentCourse.id) {
                treatmentCourseId = appointmentData.TreatmentSession.TreatmentCourse.id;
                console.log(`   ✅ Found treatmentCourseId from TreatmentSession.TreatmentCourse.id: ${treatmentCourseId}`);
            } else {
                console.log(`   ⚠️ TreatmentSession exists but no treatmentCourseId field`);
                console.log(`   TreatmentSession keys:`, Object.keys(appointmentData.TreatmentSession || {}));
                
                // Fallback: Tìm lại TreatmentSession từ database để lấy treatmentCourseId
                try {
                    const sessionFromDb = await db.TreatmentSession.findOne({
                        where: { appointmentId: appointmentData.id },
                        attributes: ['treatmentCourseId']
                    });
                    if (sessionFromDb && sessionFromDb.treatmentCourseId) {
                        treatmentCourseId = sessionFromDb.treatmentCourseId;
                        console.log(`   ✅ Found treatmentCourseId from database lookup: ${treatmentCourseId}`);
                    }
                } catch (dbError) {
                    console.error(`   ⚠️ Error looking up TreatmentSession from database:`, dbError.message);
                }
            }
        }
        
        // Fallback: Lấy từ bookingGroupId
        if (!treatmentCourseId && appointmentData.bookingGroupId) {
            // bookingGroupId format: "group-tc-xxx" hoặc "group-xxx"
            let groupId = appointmentData.bookingGroupId;
            if (groupId.startsWith('group-')) {
                groupId = groupId.replace('group-', '');
            }
            // Giữ lại prefix 'tc-' nếu có, vì TreatmentCourse.id có format 'tc-xxx'
            if (groupId.startsWith('tc-')) {
                treatmentCourseId = groupId; // Giữ nguyên 'tc-xxx'
            } else {
                // Nếu không có prefix 'tc-', thêm prefix vào
                treatmentCourseId = `tc-${groupId}`;
            }
            console.log(`   ✅ Found treatmentCourseId from bookingGroupId: ${appointmentData.bookingGroupId} → ${treatmentCourseId}`);
        }
        
        if (treatmentCourseId) {
            // Kiểm tra TreatmentCourse paymentStatus
            const treatmentCourse = await db.TreatmentCourse.findByPk(treatmentCourseId, {
                attributes: ['id', 'paymentStatus']
            });
            
            if (treatmentCourse) {
                console.log(`   ✅ Found TreatmentCourse ${treatmentCourse.id}, paymentStatus: ${treatmentCourse.paymentStatus}`);
                if (treatmentCourse.paymentStatus === 'Paid') {
                    console.log(`   ✅ TreatmentCourse is Paid → Returning 'Paid'`);
                    return 'Paid';
                }
            } else {
                console.log(`   ⚠️ TreatmentCourse ${treatmentCourseId} not found`);
            }
            
            // Nếu TreatmentCourse chưa thanh toán, kiểm tra buổi 1
            console.log(`   🔍 Checking session 1 payment status...`);
            const session1 = await db.TreatmentSession.findOne({
                where: { 
                    treatmentCourseId: treatmentCourseId,
                    sessionNumber: 1
                },
                attributes: ['appointmentId']
            });
            
            if (session1 && session1.appointmentId) {
                console.log(`   ✅ Found session 1, appointmentId: ${session1.appointmentId}`);
                const appointment1 = await db.Appointment.findByPk(session1.appointmentId, {
                    attributes: ['paymentStatus']
                });
                
                if (appointment1) {
                    console.log(`   ✅ Session 1 appointment paymentStatus: ${appointment1.paymentStatus}`);
                    if (appointment1.paymentStatus === 'Paid') {
                        console.log(`   ✅ Session 1 is Paid → Returning 'Paid'`);
                        return 'Paid';
                    }
                } else {
                    console.log(`   ⚠️ Session 1 appointment ${session1.appointmentId} not found`);
                }
            } else {
                console.log(`   ⚠️ Session 1 not found for treatmentCourseId ${treatmentCourseId}`);
            }
        } else {
            console.log(`   ⚠️ No treatmentCourseId found`);
        }
        
        // Trả về paymentStatus hiện tại của appointment
        const finalStatus = appointmentData.paymentStatus || 'Unpaid';
        console.log(`   ⚠️ Returning current paymentStatus: ${finalStatus}\n`);
        return finalStatus;
    } catch (error) {
        console.error(`❌ [getAppointmentPaymentStatus] Error for appointment ${appointmentData.id}:`, error.message);
        console.error(`   Error stack:`, error.stack);
        return appointmentData.paymentStatus || 'Unpaid';
    }
}

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

    console.log("Smart Assignment Scoring:", scoredTechnicians.map(s => ({ name: s.tech.name, score: s.score })));

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
                    attributes: ['id', 'name', 'description', 'price', 'duration']
                },
                {
                    model: db.TreatmentSession,
                    as: 'TreatmentSession',
                    attributes: ['id', 'sessionNumber', 'adminNotes', 'customerStatusNotes', 'status', 'treatmentCourseId'],
                    required: false,
                    include: [
                        {
                            model: db.TreatmentCourse,
                            as: 'TreatmentCourse',
                            attributes: ['id', 'paymentStatus'],
                            required: false
                        }
                    ]
                }
            ],
            order: [['date', 'DESC'], ['time', 'ASC']]
        });

        // Map appointments to include client info and treatment session
        const mappedAppointments = await Promise.all(appointments.map(async (apt) => {
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
            
            // QUAN TRỌNG: Sử dụng helper function để xác định paymentStatus
            const originalPaymentStatus = appointmentData.paymentStatus;
            const finalPaymentStatus = await getAppointmentPaymentStatus(appointmentData);
            appointmentData.paymentStatus = finalPaymentStatus;
            
            // Log nếu paymentStatus thay đổi
            if (originalPaymentStatus !== finalPaymentStatus) {
                console.log(`✅ [GET /api/appointments] Appointment ${appointmentData.id} paymentStatus changed: ${originalPaymentStatus} → ${finalPaymentStatus}`);
            }
            
            return appointmentData;
        }));

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

// GET /api/appointments/:id - Get single appointment by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const appointment = await db.Appointment.findByPk(id, {
            attributes: ['id', 'serviceId', 'serviceName', 'userId', 'date', 'time', 'status', 'paymentStatus', 'therapistId', 'notesForTherapist', 'staffNotesAfterSession', 'rejectionReason', 'bookingGroupId', 'promotionId'],
            include: [
                {
                    model: db.User,
                    as: 'Client',
                    attributes: ['id', 'name', 'email', 'phone']
                },
                {
                    model: db.User,
                    as: 'Therapist',
                    attributes: ['id', 'name', 'email', 'phone']
                },
                {
                    model: db.Service,
                    attributes: ['id', 'name', 'description', 'price', 'duration']
                },
                {
                    model: db.TreatmentSession,
                    as: 'TreatmentSession',
                    attributes: ['id', 'sessionNumber', 'adminNotes', 'customerStatusNotes', 'status', 'treatmentCourseId'],
                    required: false,
                    include: [
                        {
                            model: db.TreatmentCourse,
                            as: 'TreatmentCourse',
                            attributes: ['id', 'totalSessions', 'completedSessions', 'serviceName', 'paymentStatus'],
                            required: false
                        }
                    ]
                }
            ]
        });

        if (!appointment) {
            return res.status(404).json({ message: 'Không tìm thấy lịch hẹn' });
        }

        // Map appointment to include paymentStatus from TreatmentCourse if available
        const appointmentData = appointment.toJSON();
        
        // QUAN TRỌNG: Sử dụng helper function để xác định paymentStatus
        const originalPaymentStatus = appointmentData.paymentStatus;
        const finalPaymentStatus = await getAppointmentPaymentStatus(appointmentData);
        appointmentData.paymentStatus = finalPaymentStatus;
        
        if (originalPaymentStatus !== finalPaymentStatus) {
            console.log(`✅ [GET /api/appointments/:id] Appointment ${appointmentData.id} paymentStatus changed: ${originalPaymentStatus} → ${finalPaymentStatus}`);
        } else {
            console.log(`✅ [GET /api/appointments/:id] Appointment ${appointmentData.id} paymentStatus = '${finalPaymentStatus}'`);
        }

        res.json(appointmentData);
    } catch (error) {
        console.error('Error fetching appointment:', error);
        res.status(500).json({ message: 'Lỗi khi tải thông tin lịch hẹn' });
    }
});

// GET /api/appointments/user/:userId
// Returns appointments where user is either the client (userId) OR the therapist (therapistId)
router.get('/user/:userId', async (req, res) => {
    const { userId } = req.params;
    const { Op } = require('sequelize');
    try {
        // Get appointments where user is the client OR the therapist
        const userAppointments = await db.Appointment.findAll({
            where: {
                [Op.or]: [
                    { userId: userId },
                    { therapistId: userId }
                ]
            },
            include: [
                {
                    model: db.User,
                    as: 'Client',
                    attributes: ['id', 'name', 'email', 'phone']
                },
                {
                    model: db.User,
                    as: 'Therapist',
                    attributes: ['id', 'name', 'email', 'phone']
                },
                {
                    model: db.Service,
                    attributes: ['id', 'name', 'description', 'price', 'duration']
                },
                {
                    model: db.TreatmentSession,
                    as: 'TreatmentSession',
                    attributes: ['id', 'sessionNumber', 'adminNotes', 'customerStatusNotes', 'status', 'sessionDate', 'sessionTime', 'treatmentCourseId'],
                    required: false,
                    include: [
                        {
                            model: db.TreatmentCourse,
                            as: 'TreatmentCourse',
                            attributes: ['id', 'paymentStatus'],
                            required: false
                        }
                    ]
                }
            ],
            order: [['date', 'DESC'], ['time', 'ASC']]
        });

        // Map appointments to include client, therapist info, and treatment session
        const mappedAppointments = await Promise.all(userAppointments.map(async (apt) => {
            const appointmentData = apt.toJSON();

            // Map price from Service to top level for mobile app
            if (appointmentData.Service && appointmentData.Service.price) {
                appointmentData.price = appointmentData.Service.price;
            }

            if (appointmentData.Client) {
                appointmentData.Client = {
                    id: appointmentData.Client.id,
                    name: appointmentData.Client.name,
                    email: appointmentData.Client.email,
                    phone: appointmentData.Client.phone
                };
            }
            if (appointmentData.Therapist) {
                appointmentData.Therapist = {
                    id: appointmentData.Therapist.id,
                    name: appointmentData.Therapist.name,
                    email: appointmentData.Therapist.email,
                    phone: appointmentData.Therapist.phone
                };
            }
            // QUAN TRỌNG: Đồng bộ paymentStatus - Logic đơn giản: Nếu buổi 1 đã thanh toán, tất cả buổi khác cũng đã thanh toán
            let treatmentCourse = null;
            let sessionNumber = null;
            
            if (appointmentData.TreatmentSession && appointmentData.TreatmentSession.TreatmentCourse) {
                // Nếu có TreatmentSession và TreatmentCourse trong query
                treatmentCourse = appointmentData.TreatmentSession.TreatmentCourse;
                sessionNumber = appointmentData.TreatmentSession.sessionNumber;
                appointmentData.TreatmentSession = {
                    id: appointmentData.TreatmentSession.id,
                    sessionNumber: appointmentData.TreatmentSession.sessionNumber,
                    adminNotes: appointmentData.TreatmentSession.adminNotes,
                    customerStatusNotes: appointmentData.TreatmentSession.customerStatusNotes,
                    status: appointmentData.TreatmentSession.status,
                    sessionDate: appointmentData.TreatmentSession.sessionDate,
                    sessionTime: appointmentData.TreatmentSession.sessionTime,
                    TreatmentCourse: treatmentCourse
                };
            } else {
                // Fallback: Tìm TreatmentSession qua appointmentId
                try {
                    const treatmentSession = await db.TreatmentSession.findOne({
                        where: { appointmentId: appointmentData.id },
                        include: [{
                            model: db.TreatmentCourse,
                            as: 'TreatmentCourse',
                            attributes: ['id', 'paymentStatus']
                        }]
                    });
                    
                    if (treatmentSession && treatmentSession.TreatmentCourse) {
                        treatmentCourse = treatmentSession.TreatmentCourse.toJSON();
                        sessionNumber = treatmentSession.sessionNumber;
                        appointmentData.TreatmentSession = {
                            id: treatmentSession.id,
                            sessionNumber: treatmentSession.sessionNumber,
                            adminNotes: treatmentSession.adminNotes,
                            customerStatusNotes: treatmentSession.customerStatusNotes,
                            status: treatmentSession.status,
                            sessionDate: treatmentSession.sessionDate,
                            sessionTime: treatmentSession.sessionTime,
                            TreatmentCourse: treatmentCourse
                        };
                    }
                } catch (fallbackError) {
                    console.error(`⚠️ [GET /api/appointments/user/:userId] Error finding TreatmentSession:`, fallbackError.message);
                }
                
                // Fallback: Tìm TreatmentCourse qua bookingGroupId
                if (!treatmentCourse && appointmentData.bookingGroupId) {
                    try {
                        const courseId = appointmentData.bookingGroupId.replace('group-', '');
                        const foundCourse = await db.TreatmentCourse.findByPk(courseId, {
                            attributes: ['id', 'paymentStatus']
                        });
                        if (foundCourse) {
                            treatmentCourse = foundCourse.toJSON();
                        }
                    } catch (bookingGroupError) {
                        // Ignore error
                    }
                }
            }
            
            // QUAN TRỌNG: Sử dụng helper function để xác định paymentStatus
            const originalPaymentStatus = appointmentData.paymentStatus;
            const finalPaymentStatus = await getAppointmentPaymentStatus(appointmentData);
            appointmentData.paymentStatus = finalPaymentStatus;
            
            // Log nếu paymentStatus thay đổi
            if (originalPaymentStatus !== finalPaymentStatus) {
                console.log(`✅ [GET /api/appointments/user/:userId] Appointment ${appointmentData.id} paymentStatus changed: ${originalPaymentStatus} → ${finalPaymentStatus}`);
            }
            
            // Format date to YYYY-MM-DD string to avoid timezone issues
            if (appointmentData.date) {
                const dateValue = apt.getDataValue('date');
                if (dateValue) {
                    const date = new Date(dateValue);
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    appointmentData.date = `${year}-${month}-${day}`;
                }
            }
            
            return appointmentData;
        }));

        console.log(`✅ Fetched ${mappedAppointments.length} appointments for user ${userId} (as client or therapist)`);

        res.json(mappedAppointments);
    } catch (error) {
        console.error('Error fetching user appointments:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/appointments
router.post('/', async (req, res) => {
    const newAppointmentData = req.body;

    // LOG REQUEST BODY để debug - QUAN TRỌNG: Log toàn bộ request body
    console.log(`\n📝 [POST /api/appointments] ==========================================`);
    console.log(`   Request body (full):`, JSON.stringify(newAppointmentData, null, 2));
    console.log(`   Request body (parsed):`, {
        id: newAppointmentData.id,
        userId: newAppointmentData.userId,
        serviceId: newAppointmentData.serviceId,
        promotionId: newAppointmentData.promotionId,
        date: newAppointmentData.date,
        time: newAppointmentData.time,
        paymentStatus: newAppointmentData.paymentStatus,
        totalAmount: newAppointmentData.totalAmount, // Log totalAmount để debug
        totalAmountType: typeof newAppointmentData.totalAmount,
        quantity: newAppointmentData.quantity,
        quantityType: typeof newAppointmentData.quantity,
        durationWeeks: newAppointmentData.durationWeeks,
        frequencyType: newAppointmentData.frequencyType,
        frequencyValue: newAppointmentData.frequencyValue,
        treatmentCourseNotes: newAppointmentData.treatmentCourseNotes,
        allKeys: Object.keys(newAppointmentData) // Log tất cả các keys
    });
    console.log(`📝 [POST /api/appointments] ==========================================\n`);

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

        // ==========================================
        // VALIDATION: Kiểm tra overlap (không cho phép trùng lịch)
        // ==========================================
        if (finalUserId && newAppointmentData.date && newAppointmentData.time) {
            // Lấy tất cả appointments của user trong ngày đó (cùng ngày, status != cancelled)
            const existingAppointments = await db.Appointment.findAll({
                where: {
                    userId: finalUserId,
                    date: newAppointmentData.date,
                    status: { [Op.ne]: 'cancelled' }
                },
                include: [{
                    model: db.Service,
                    attributes: ['id', 'duration']
                }]
            });

            if (existingAppointments.length > 0) {
                // Convert time to minutes for comparison
                const [newHours, newMinutes] = newAppointmentData.time.split(':').map(Number);
                const newStartMinutes = newHours * 60 + newMinutes;
                const newDuration = service.duration || 60;
                const newEndMinutes = newStartMinutes + newDuration;

                // Kiểm tra overlap và logic đặt lịch với từng appointment đã đặt
                // Logic từ promp.txt:
                // - Nếu đặt SAU dịch vụ B: phải đặt sau khi dịch vụ B kết thúc (newStart >= existingEnd)
                // - Nếu đặt TRƯỚC dịch vụ B: phải đặt trước C - duration của dịch vụ D (newEnd <= existingStart và newStart <= existingStart - newDuration)
                for (const existingApt of existingAppointments) {
                    const existingService = existingApt.Service;
                    if (!existingService || !existingService.duration) continue;

                    const [existingHours, existingMinutes] = existingApt.time.split(':').map(Number);
                    const existingStartMinutes = existingHours * 60 + existingMinutes;
                    const existingDuration = existingService.duration;
                    const existingEndMinutes = existingStartMinutes + existingDuration;

                    // Kiểm tra overlap: Hai khoảng thời gian overlap nếu:
                    // newStart < existingEnd && newEnd > existingStart
                    const hasOverlap = newStartMinutes < existingEndMinutes && 
                                       newEndMinutes > existingStartMinutes;

                    if (hasOverlap) {
                        return res.status(400).json({ 
                            message: `Khung giờ này trùng với lịch hẹn đã đặt (${existingApt.time} - ${existingService.name}). Vui lòng chọn giờ khác.` 
                        });
                    }

                    // Kiểm tra logic đặt lịch:
                    // Nếu đặt SAU dịch vụ đã đặt: newStart >= existingEnd (cho phép)
                    // Nếu đặt TRƯỚC dịch vụ đã đặt: newEnd <= existingStart VÀ newStart <= existingStart - newDuration (cho phép)
                    // Nếu không thỏa mãn một trong hai điều kiện trên → không hợp lệ
                    const isAfterExisting = newStartMinutes >= existingEndMinutes;
                    const isBeforeExisting = newEndMinutes <= existingStartMinutes && 
                                            newStartMinutes <= existingStartMinutes - newDuration;

                    if (!isAfterExisting && !isBeforeExisting) {
                        // Tính toán thông báo lỗi chi tiết
                        let errorMessage = '';
                        if (newStartMinutes < existingStartMinutes) {
                            // Đang cố đặt trước nhưng không đủ khoảng cách
                            const requiredStart = existingStartMinutes - newDuration;
                            const requiredHours = Math.floor(requiredStart / 60);
                            const requiredMins = requiredStart % 60;
                            const requiredTime = `${String(requiredHours).padStart(2, '0')}:${String(requiredMins).padStart(2, '0')}`;
                            errorMessage = `Nếu đặt trước lịch hẹn ${existingApt.time} (${existingService.name}), bạn phải đặt trước ${requiredTime} để dịch vụ kết thúc trước khi lịch hẹn bắt đầu.`;
                        } else {
                            // Đang cố đặt sau nhưng vẫn còn overlap hoặc quá sớm
                            const requiredStart = existingEndMinutes;
                            const requiredHours = Math.floor(requiredStart / 60);
                            const requiredMins = requiredStart % 60;
                            const requiredTime = `${String(requiredHours).padStart(2, '0')}:${String(requiredMins).padStart(2, '0')}`;
                            errorMessage = `Nếu đặt sau lịch hẹn ${existingApt.time} (${existingService.name}), bạn phải đặt từ ${requiredTime} trở đi.`;
                        }
                        return res.status(400).json({ 
                            message: errorMessage
                        });
                    }
                }
            }
        }

        // Validate promotion if provided
        if (newAppointmentData.promotionId) {
            const promotion = await db.Promotion.findByPk(newAppointmentData.promotionId);
            if (!promotion) {
                return res.status(400).json({ message: 'Mã khuyến mãi không hợp lệ' });
            }

            // Normalize isActive to boolean (database may store 0/1)
            const isActive = promotion.isActive === true || promotion.isActive === 1 || promotion.isActive === '1';

            // Check if promotion is active
            if (!isActive) {
                return res.status(400).json({ message: 'Mã khuyến mãi này không còn hoạt động' });
            }

            // Check expiry
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const expiryDate = new Date(promotion.expiryDate);
            expiryDate.setHours(0, 0, 0, 0);
            if (today > expiryDate) {
                return res.status(400).json({ message: 'Mã khuyến mãi đã hết hạn' });
            }

            // Normalize isPublic to boolean
            const isPublic = promotion.isPublic === true || promotion.isPublic === 1 || promotion.isPublic === '1';

            // For public promotions, check stock
            if (isPublic && promotion.stock !== null && promotion.stock <= 0) {
                return res.status(400).json({ message: 'Mã khuyến mãi đã hết lượt sử dụng' });
            }

            // For redeemed vouchers (private vouchers), check if user has available vouchers
            if (!isPublic && finalUserId) {
                const unusedRedeemedVouchers = await db.PromotionUsage.findAll({
                    where: {
                        userId: finalUserId,
                        promotionId: promotion.id,
                        appointmentId: { [Op.is]: null }
                    }
                });

                if (unusedRedeemedVouchers.length === 0) {
                    return res.status(400).json({ message: 'Bạn không còn voucher này để sử dụng. Vui lòng đổi điểm để lấy thêm voucher.' });
                }
            }

            // Validate "New Clients" promotion: chỉ được dùng 1 lần cho 1 dịch vụ mà khách chưa đặt lịch dịch vụ đó lần nào
            if (promotion.targetAudience === 'New Clients' && finalUserId) {
                console.log(`\n🔍 [NEW CLIENTS VALIDATION] ==========================================`);
                console.log(`   Checking if user can use New Clients voucher for this service`);
                console.log(`   userId: ${finalUserId}`);
                console.log(`   serviceId: ${newAppointmentData.serviceId}`);
                console.log(`   promotionId: ${promotion.id}`);

                // Kiểm tra xem user đã từng đặt lịch dịch vụ này chưa (bất kỳ status nào, trừ cancelled)
                const hasBookedService = await db.Appointment.findOne({
                    where: {
                        userId: finalUserId,
                        serviceId: newAppointmentData.serviceId,
                        status: { [Op.ne]: 'cancelled' } // Bất kỳ status nào trừ cancelled
                    }
                });

                if (hasBookedService) {
                    console.log(`   ❌ [NEW CLIENTS] User has already booked this service before`);
                    console.log(`   - Existing appointment ID: ${hasBookedService.id}`);
                    console.log(`   - Status: ${hasBookedService.status}`);
                    console.log(`🔍 [NEW CLIENTS VALIDATION] ==========================================\n`);
                    return res.status(400).json({
                        message: 'Voucher "Khách hàng mới" chỉ áp dụng cho dịch vụ mà bạn chưa từng đặt lịch. Bạn đã đặt lịch dịch vụ này trước đó.'
                    });
                }

                // Kiểm tra xem user đã dùng voucher "Khách hàng mới" cho dịch vụ này chưa
                const hasUsedNewClientVoucherForService = await db.PromotionUsage.findOne({
                    where: {
                        userId: finalUserId,
                        serviceId: newAppointmentData.serviceId,
                        appointmentId: { [Op.ne]: null } // Đã được dùng (có appointmentId)
                    },
                    include: [{
                        model: db.Promotion,
                        where: {
                            targetAudience: 'New Clients'
                        },
                        required: true
                    }]
                });

                if (hasUsedNewClientVoucherForService) {
                    console.log(`   ❌ [NEW CLIENTS] User has already used New Clients voucher for this service`);
                    console.log(`   - PromotionUsage ID: ${hasUsedNewClientVoucherForService.id}`);
                    console.log(`   - Appointment ID: ${hasUsedNewClientVoucherForService.appointmentId}`);
                    console.log(`🔍 [NEW CLIENTS VALIDATION] ==========================================\n`);
                    return res.status(400).json({
                        message: 'Bạn đã sử dụng voucher "Khách hàng mới" cho dịch vụ này rồi. Mỗi dịch vụ chỉ được dùng voucher này 1 lần.'
                    });
                }

                console.log(`   ✅ [NEW CLIENTS] User can use New Clients voucher for this service`);
                console.log(`🔍 [NEW CLIENTS VALIDATION] ==========================================\n`);
            }

            // Validate "Birthday" promotion: chỉ được dùng đúng ngày sinh nhật và chỉ 1 lần
            if (promotion.targetAudience === 'Birthday' && finalUserId) {
                console.log(`\n🔍 [BIRTHDAY VALIDATION] ==========================================`);
                console.log(`   Checking if user can use Birthday voucher`);
                console.log(`   userId: ${finalUserId}`);
                console.log(`   promotionId: ${promotion.id}`);

                // Lấy thông tin user để kiểm tra ngày sinh nhật
                const user = await db.User.findByPk(finalUserId);
                if (!user || !user.birthday) {
                    console.log(`   ❌ [BIRTHDAY] User not found or has no birthday`);
                    console.log(`🔍 [BIRTHDAY VALIDATION] ==========================================\n`);
                    return res.status(400).json({
                        message: 'Voucher sinh nhật chỉ áp dụng cho khách hàng có thông tin ngày sinh. Vui lòng cập nhật thông tin ngày sinh trong hồ sơ.'
                    });
                }

                // Kiểm tra xem hôm nay có phải là ngày sinh nhật không
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const birthday = new Date(user.birthday);
                birthday.setHours(0, 0, 0, 0);
                const isBirthdayToday = birthday.getMonth() === today.getMonth() && 
                                       birthday.getDate() === today.getDate();

                if (!isBirthdayToday) {
                    console.log(`   ❌ [BIRTHDAY] Today is not user's birthday`);
                    console.log(`   - User birthday: ${birthday.toLocaleDateString('vi-VN')}`);
                    console.log(`   - Today: ${today.toLocaleDateString('vi-VN')}`);
                    console.log(`🔍 [BIRTHDAY VALIDATION] ==========================================\n`);
                    return res.status(400).json({
                        message: 'Voucher sinh nhật chỉ có thể sử dụng đúng ngày sinh nhật của bạn.'
                    });
                }

                // Kiểm tra xem user đã dùng voucher sinh nhật chưa (chỉ 1 lần)
                const hasUsedBirthdayVoucher = await db.PromotionUsage.findOne({
                    where: {
                        userId: finalUserId,
                        appointmentId: { [Op.ne]: null } // Đã được dùng (có appointmentId)
                    },
                    include: [{
                        model: db.Promotion,
                        where: {
                            targetAudience: 'Birthday'
                        },
                        required: true
                    }]
                });

                if (hasUsedBirthdayVoucher) {
                    console.log(`   ❌ [BIRTHDAY] User has already used Birthday voucher`);
                    console.log(`   - PromotionUsage ID: ${hasUsedBirthdayVoucher.id}`);
                    console.log(`   - Appointment ID: ${hasUsedBirthdayVoucher.appointmentId}`);
                    console.log(`🔍 [BIRTHDAY VALIDATION] ==========================================\n`);
                    return res.status(400).json({
                        message: 'Bạn đã sử dụng voucher sinh nhật rồi. Voucher sinh nhật chỉ được dùng 1 lần.'
                    });
                }

                console.log(`   ✅ [BIRTHDAY] User can use Birthday voucher (today is birthday and not used yet)`);
                console.log(`🔍 [BIRTHDAY VALIDATION] ==========================================\n`);
            }
        }

        // Validate minimum sessions (số buổi tối thiểu) - parse from termsAndConditions
        if (promotion.termsAndConditions) {
            try {
                const termsObj = JSON.parse(promotion.termsAndConditions);
                if (termsObj && typeof termsObj.minSessions === 'number' && termsObj.minSessions > 0) {
                    const quantity = newAppointmentData.quantity || 1;
                    
                    // Check if promotion applies to this service
                    let shouldCheckQuantity = false;
                    if (promotion.applicableServiceIds && promotion.applicableServiceIds.length > 0) {
                        // Voucher chỉ áp dụng cho các services cụ thể
                        const applicableServiceIdsArray = Array.isArray(promotion.applicableServiceIds) 
                            ? promotion.applicableServiceIds 
                            : (typeof promotion.applicableServiceIds === 'string' ? JSON.parse(promotion.applicableServiceIds) : []);
                        if (applicableServiceIdsArray.includes(newAppointmentData.serviceId)) {
                            shouldCheckQuantity = true;
                        }
                    } else {
                        // Voucher áp dụng cho tất cả services
                        shouldCheckQuantity = true;
                    }
                    
                    if (shouldCheckQuantity && quantity < termsObj.minSessions) {
                        return res.status(400).json({ 
                            message: `Voucher chỉ áp dụng khi đặt từ ${termsObj.minSessions} buổi trở lên. Bạn đang đặt ${quantity} buổi.` 
                        });
                    }
                }
            } catch (e) {
                // Not JSON or parse error, ignore (treat as regular text)
            }
        }

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

            // Lấy số tiền thực tế (sau giảm giá/voucher) từ request, nếu không có thì tính từ service price
            const totalAmount = newAppointmentData.totalAmount 
                ? parseFloat(newAppointmentData.totalAmount) 
                : (parseFloat(service.price) * quantity);

            console.log(`💰 [TREATMENT COURSE] Creating with totalAmount:`, {
                receivedTotalAmount: newAppointmentData.totalAmount,
                parsedTotalAmount: totalAmount,
                servicePrice: parseFloat(service.price),
                quantity: quantity,
                calculatedFallback: parseFloat(service.price) * quantity
            });

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
                status: 'active', // Active when created
                paymentStatus: 'Unpaid', // Mặc định chưa thanh toán
                totalAmount: totalAmount, // Lưu số tiền thực tế khi đặt lịch (sau giảm giá/voucher)
                notes: newAppointmentData.treatmentCourseNotes || null,
                createdAt: new Date(),
            });

            console.log(`✅ [TREATMENT COURSE] Created:`, {
                id: treatmentCourse.id,
                totalAmount: treatmentCourse.totalAmount
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
            promotionId: newAppointmentData.promotionId || null, // Save promotion ID if provided
            bookingGroupId: newAppointmentData.bookingGroupId || null,
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

        // ==========================================
        // TRỪ VOUCHER NGAY KHI ĐẶT LỊCH
        // Logic: Khi đặt lịch và áp dụng voucher đã đổi điểm, voucher bị trừ ngay lập tức
        // KHÔNG phụ thuộc vào thanh toán (thanh toán tại quầy hay VNPay đều trừ ngay)
        // ==========================================
        console.log(`\n🔍 [VOUCHER DEDUCTION CHECK] ==========================================`);
        console.log(`   Checking conditions for voucher deduction:`);
        console.log(`   - promotionId: ${newAppointmentData.promotionId || 'null/undefined'}`);
        console.log(`   - finalUserId: ${finalUserId || 'null/undefined'}`);
        console.log(`   - Condition: ${newAppointmentData.promotionId && finalUserId ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`🔍 [VOUCHER DEDUCTION CHECK] ==========================================\n`);

        if (newAppointmentData.promotionId && finalUserId) {
            try {
                console.log(`\n🔍 [VOUCHER DEDUCTION] ==========================================`);
                console.log(`   ⚡ TRỪ VOUCHER NGAY KHI ĐẶT LỊCH (không phụ thuộc thanh toán)`);
                console.log(`   userId: ${finalUserId}`);
                console.log(`   promotionId: ${newAppointmentData.promotionId}`);
                console.log(`   appointmentId (new): ${createdAppointment.id}`);

                // Kiểm tra xem promotion này có phải là redeemed voucher không (isPublic = false)
                const promotion = await db.Promotion.findByPk(newAppointmentData.promotionId);

                if (!promotion) {
                    console.log(`   ⚠️ [WARNING] Promotion not found: ${newAppointmentData.promotionId}`);
                    throw new Error(`Promotion not found: ${newAppointmentData.promotionId}`);
                }

                // Normalize isPublic: có thể là boolean, 0/1, hoặc '0'/'1'
                const promoData = promotion.toJSON ? promotion.toJSON() : promotion;
                const normalizedIsPublic = promoData.isPublic === true || promoData.isPublic === 1 || promoData.isPublic === '1';
                const isRedeemedVoucher = !normalizedIsPublic; // isPublic = false nghĩa là redeemed voucher

                console.log(`   Promotion check:`, {
                    promotionId: promotion.id,
                    code: promotion.code,
                    title: promotion.title,
                    isPublic_raw: promoData.isPublic,
                    isPublic_type: typeof promoData.isPublic,
                    normalizedIsPublic: normalizedIsPublic,
                    isRedeemedVoucher: isRedeemedVoucher
                });

                if (isRedeemedVoucher) {
                    console.log(`   ✅ This is a redeemed voucher (isPublic: ${promotion.isPublic})`);

                    // Query tất cả PromotionUsage cho promotion này để debug
                    const allUsages = await db.PromotionUsage.findAll({
                        where: {
                            userId: finalUserId,
                            promotionId: newAppointmentData.promotionId
                        }
                    });
                    console.log(`   Total PromotionUsage records: ${allUsages.length}`);
                    allUsages.forEach((u, idx) => {
                        const uData = u.toJSON ? u.toJSON() : u;
                        console.log(`     [${idx + 1}] id: ${uData.id}, appointmentId: ${uData.appointmentId || 'NULL'}, usedAt: ${uData.usedAt}`);
                    });

                    // Query trực tiếp để tìm voucher chưa dùng (appointmentId IS NULL)
                    // Sử dụng raw SQL query để đảm bảo chính xác
                    const { QueryTypes } = require('sequelize');
                    const unusedRedeemedUsages = await db.sequelize.query(
                        `SELECT * FROM promotion_usage 
                         WHERE userId = :userId 
                         AND promotionId = :promotionId 
                         AND appointmentId IS NULL 
                         ORDER BY usedAt ASC 
                         LIMIT 1`,
                        {
                            replacements: {
                                userId: finalUserId,
                                promotionId: newAppointmentData.promotionId
                            },
                            type: QueryTypes.SELECT
                        }
                    );

                    console.log(`   Found ${unusedRedeemedUsages.length} unused PromotionUsage records (raw SQL)`);

                    if (unusedRedeemedUsages.length > 0) {
                        const unusedRedeemed = unusedRedeemedUsages[0];
                        console.log(`   ✅ Found unused voucher: ${unusedRedeemed.id}`);
                        console.log(`   - Current appointmentId: ${unusedRedeemed.appointmentId || 'NULL'}`);

                        // Tìm PromotionUsage record bằng Sequelize để update
                        const promotionUsageToUpdate = await db.PromotionUsage.findByPk(unusedRedeemed.id);
                        
                        if (!promotionUsageToUpdate) {
                            console.log(`   ⚠️ [WARNING] PromotionUsage not found by ID: ${unusedRedeemed.id}`);
                        } else {
                            // Đảm bảo appointmentId hiện tại là NULL (tránh race condition)
                            if (promotionUsageToUpdate.appointmentId !== null) {
                                console.log(`   ⚠️ [WARNING] PromotionUsage already has appointmentId: ${promotionUsageToUpdate.appointmentId}`);
                                console.log(`   - This voucher may have been used already`);
                            } else {
                                // Đánh dấu voucher đã được dùng cho appointment này (trừ voucher)
                                // Sử dụng Sequelize update để đảm bảo transaction được xử lý đúng
                                // Sử dụng raw SQL với WHERE clause để đảm bảo atomicity
                                const { QueryTypes } = require('sequelize');
                                const [updateResult, updateMetadata] = await db.sequelize.query(
                                    `UPDATE promotion_usage 
                                     SET appointmentId = :appointmentId, serviceId = :serviceId 
                                     WHERE id = :id AND appointmentId IS NULL`,
                                    {
                                        replacements: {
                                            id: unusedRedeemed.id,
                                            appointmentId: createdAppointment.id,
                                            serviceId: newAppointmentData.serviceId
                                        },
                                        type: QueryTypes.UPDATE
                                    }
                                );

                                console.log(`   Update result (affected rows):`, updateResult);
                                
                                // Verify update - Reload from database to ensure we get the latest data
                                await promotionUsageToUpdate.reload();
                                
                                if (promotionUsageToUpdate.appointmentId === createdAppointment.id) {
                                    console.log(`   ✅ [SUCCESS] Voucher deducted successfully!`);
                                    console.log(`   - Before update: appointmentId = NULL`);
                                    console.log(`   - After update: appointmentId = ${promotionUsageToUpdate.appointmentId}`);
                                    console.log(`   - Linked to appointment: ${createdAppointment.id}`);
                                    console.log(`   - Voucher redeemedCount will decrease when querying /my-redeemed API`);
                                    console.log(`   - When querying /my-redeemed, this voucher will not appear (appointmentId is no longer NULL)`);
                                } else if (updateResult === 0) {
                                    console.log(`   ⚠️ [WARNING] Update failed - no rows affected (voucher may have been used by another request)`);
                                    console.log(`   - Current appointmentId: ${promotionUsageToUpdate.appointmentId || 'NULL'}`);
                                } else {
                                    console.log(`   ⚠️ [WARNING] Update verification failed - appointmentId mismatch`);
                                    console.log(`   - Expected: ${createdAppointment.id}`);
                                    console.log(`   - Actual: ${promotionUsageToUpdate.appointmentId || 'NULL'}`);
                                    console.log(`   - Update result: ${updateResult}`);
                                }
                            }
                        }
                    } else {
                        console.log(`   ⚠️ [WARNING] No unused redeemed voucher found!`);
                        console.log(`   - This may be a public voucher (not redeemed with points)`);
                        console.log(`   - Or all vouchers have been used`);
                    }
                } else {
                    // Public voucher (isPublic = true): Tạo PromotionUsage ngay khi đặt lịch
                    // QUAN TRỌNG: Đối với voucher sinh nhật, cần tạo PromotionUsage ngay để voucher biến mất
                    console.log(`   ℹ️ [INFO] This is a public voucher (isPublic: ${promotion ? promotion.isPublic : 'N/A'})`);
                    console.log(`   - Promotion ID: ${promotion.id}`);
                    console.log(`   - Promotion code: ${promotion.code}`);
                    console.log(`   - Promotion targetAudience: ${promotion.targetAudience}`);
                    console.log(`   - Creating PromotionUsage immediately to mark voucher as used`);
                    
                    // Kiểm tra xem đã có PromotionUsage chưa (tránh tạo 2 lần)
                    const existingUsage = await db.PromotionUsage.findOne({
                        where: {
                            userId: finalUserId,
                            promotionId: newAppointmentData.promotionId,
                            appointmentId: createdAppointment.id
                        }
                    });
                    
                    if (!existingUsage) {
                        // Tạo PromotionUsage ngay lập tức
                        const newUsage = await db.PromotionUsage.create({
                            id: `promo-usage-${uuidv4()}`,
                            userId: finalUserId,
                            promotionId: newAppointmentData.promotionId,
                            appointmentId: createdAppointment.id,
                            serviceId: newAppointmentData.serviceId,
                        });
                        
                        console.log(`   ✅ [SUCCESS] Public voucher PromotionUsage created!`);
                        console.log(`   - PromotionUsage ID: ${newUsage.id}`);
                        console.log(`   - User ID: ${finalUserId}`);
                        console.log(`   - Promotion ID: ${newAppointmentData.promotionId}`);
                        console.log(`   - Appointment ID: ${createdAppointment.id}`);
                        console.log(`   - Service ID: ${newAppointmentData.serviceId}`);
                        console.log(`   - Voucher will now be hidden from user's available vouchers`);
                        
                        // Trừ stock (nếu có) - trừ khi appointment được tạo thành công
                        if (promotion.stock !== null) {
                            await promotion.decrement('stock', { by: 1 });
                            const updatedPromo = await db.Promotion.findByPk(newAppointmentData.promotionId);
                            console.log(`   ✅ Stock decremented: ${promotion.stock} -> ${updatedPromo.stock}`);
                        }
                    } else {
                        console.log(`   ℹ️ [INFO] PromotionUsage already exists for this appointment`);
                        console.log(`   - Existing PromotionUsage ID: ${existingUsage.id}`);
                    }
                }
                console.log(`🔍 [VOUCHER DEDUCTION] ==========================================\n`);
            } catch (voucherError) {
                console.error('❌ [VOUCHER DEDUCTION] Error deducting voucher when creating appointment:', voucherError);
                console.error('   Error stack:', voucherError.stack);
                // Don't fail appointment creation if voucher deduction fails
            }
        } else {
            console.log(`\n🔍 [VOUCHER DEDUCTION] Skipped:`);
            console.log(`   - promotionId: ${newAppointmentData.promotionId || 'null/undefined'}`);
            console.log(`   - finalUserId: ${finalUserId || 'null/undefined'}`);
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

        // Check for schedule conflict when assigning therapist
        if (updatedData.therapistId && (updatedData.status === 'upcoming' || updatedData.status === 'scheduled')) {
            const therapistId = updatedData.therapistId;
            const appointmentDate = updatedData.date || appointment.date;
            const appointmentTime = updatedData.time || appointment.time;

            // Find conflicting appointments (same therapist, same date, same time, different appointment)
            const conflictingAppointment = await db.Appointment.findOne({
                where: {
                    therapistId: therapistId,
                    date: appointmentDate,
                    time: appointmentTime,
                    id: { [Op.ne]: id }, // Exclude current appointment
                    status: { [Op.in]: ['pending', 'upcoming', 'scheduled', 'in-progress'] } // Only check active appointments
                },
                include: [{
                    model: db.User,
                    as: 'Client',
                    attributes: ['id', 'name', 'email']
                }]
            });

            if (conflictingAppointment) {
                const clientName = conflictingAppointment.Client?.name || 'khách hàng';
                const conflictDate = new Date(conflictingAppointment.date).toLocaleDateString('vi-VN');
                return res.status(400).json({
                    message: `Nhân viên đã được phân công cho lịch hẹn khác vào ${conflictDate} lúc ${conflictingAppointment.time} (khách hàng: ${clientName}). Vui lòng chọn nhân viên khác hoặc thay đổi thời gian.`,
                    conflict: {
                        appointmentId: conflictingAppointment.id,
                        clientName: clientName,
                        date: conflictDate,
                        time: conflictingAppointment.time
                    }
                });
            }
        }
        
        const oldStatus = appointment.status;
        const oldPaymentStatus = appointment.paymentStatus;
        const oldDate = appointment.date;
        const oldTime = appointment.time;
        
        // Lưu promotionId trước khi update để đảm bảo hoàn trả voucher hoạt động
        const promotionIdBeforeUpdate = appointment.promotionId;
        const userIdBeforeUpdate = appointment.userId;
        const oldRejectionReason = appointment.rejectionReason;
        
        // Update appointment
        await appointment.update(updatedData);
        
        // Reload appointment để có dữ liệu mới nhất (bao gồm rejectionReason)
        await appointment.reload();
        
        // Debug: Log để kiểm tra
        console.log(`\n📝 [APPOINTMENT UPDATE] ==========================================`);
        console.log(`   Appointment ID: ${id}`);
        console.log(`   Status: ${oldStatus} -> ${appointment.status}`);
        console.log(`   RejectionReason (old): ${oldRejectionReason || 'null'}`);
        console.log(`   RejectionReason (new in updatedData): ${updatedData.rejectionReason || 'null'}`);
        console.log(`   RejectionReason (new after reload): ${appointment.rejectionReason || 'null'}`);
        console.log(`   PromotionId (before): ${promotionIdBeforeUpdate || 'null'}`);
        console.log(`   PromotionId (after): ${appointment.promotionId || 'null'}`);
        console.log(`   UserId (before): ${userIdBeforeUpdate || 'null'}`);
        console.log(`   UserId (after): ${appointment.userId || 'null'}`);
        console.log(`📝 [APPOINTMENT UPDATE] ==========================================\n`);
        
        // If date or time is being updated, also update linked treatment session
        if ((updatedData.date || updatedData.time) && (updatedData.date !== oldDate || updatedData.time !== oldTime)) {
            try {
                const treatmentSession = await db.TreatmentSession.findOne({
                    where: { appointmentId: id }
                });
                
                if (treatmentSession) {
                    const sessionUpdateData = {};
                    if (updatedData.date) {
                        sessionUpdateData.sessionDate = updatedData.date;
                    }
                    if (updatedData.time) {
                        sessionUpdateData.sessionTime = updatedData.time;
                    }
                    
                    await treatmentSession.update(sessionUpdateData);
                    console.log(`✅ Updated treatment session ${treatmentSession.id} date/time to match appointment ${id}`);
                    
                    // Reload treatment session to ensure we have latest data
                    await treatmentSession.reload();
                }
            } catch (sessionError) {
                console.error('Error updating treatment session date/time:', sessionError);
                // Don't fail appointment update if session update fails
            }
        }
        
        // Mark that we need to reload appointment before returning
        let needsReload = (updatedData.date || updatedData.time) && (updatedData.date !== oldDate || updatedData.time !== oldTime);
        
        // ==========================================
        // TRỪ VOUCHER THƯỜNG KHI ADMIN CHẤP NHẬN LỊCH HẸN
        // Logic: Khi admin chấp nhận lịch hẹn (status từ pending -> upcoming/scheduled), trừ stock của voucher thường
        // ==========================================
        const isBeingAccepted = (oldStatus === 'pending' && (updatedData.status === 'upcoming' || updatedData.status === 'scheduled'));

        if (isBeingAccepted && appointment.promotionId && appointment.userId) {
            try {
                console.log(`\n🔍 [PUBLIC VOUCHER DEDUCTION] ==========================================`);
                console.log(`   Admin accepted appointment - checking if public voucher needs stock deduction`);
                console.log(`   Appointment ID: ${id}`);
                console.log(`   User ID: ${appointment.userId}`);
                console.log(`   Promotion ID: ${appointment.promotionId}`);
                console.log(`   Status change: ${oldStatus} -> ${updatedData.status}`);

                const promotion = await db.Promotion.findByPk(appointment.promotionId);
                if (promotion) {
                    const promoData = promotion.toJSON ? promotion.toJSON() : promotion;
                    const normalizedIsPublic = promoData.isPublic === true || promoData.isPublic === 1 || promoData.isPublic === '1';

                    // Chỉ trừ stock cho voucher thường (isPublic = true)
                    if (normalizedIsPublic && promotion.stock !== null) {
                        // Kiểm tra xem đã có PromotionUsage chưa (tránh trừ 2 lần)
                        const existingUsage = await db.PromotionUsage.findOne({
                            where: {
                                userId: appointment.userId,
                                promotionId: appointment.promotionId,
                                appointmentId: id
                            }
                        });

                        if (!existingUsage) {
                            // Tạo PromotionUsage record
                            await db.PromotionUsage.create({
                                id: `promo-usage-${uuidv4()}`,
                                userId: appointment.userId,
                                promotionId: appointment.promotionId,
                                appointmentId: id,
                                serviceId: appointment.serviceId,
                            });

                            // Trừ stock
                            await promotion.decrement('stock', { by: 1 });
                            const updatedPromo = await db.Promotion.findByPk(appointment.promotionId);
                            console.log(`   ✅ [SUCCESS] Public voucher stock deducted!`);
                            console.log(`   - Before: stock = ${promotion.stock}`);
                            console.log(`   - After: stock = ${updatedPromo.stock}`);
                        } else {
                            console.log(`   ℹ️ [INFO] PromotionUsage already exists, skipping stock deduction`);
                        }
                    } else {
                        console.log(`   ℹ️ [INFO] This is not a public voucher or has unlimited stock`);
                        console.log(`   - isPublic: ${normalizedIsPublic}`);
                        console.log(`   - stock: ${promotion.stock}`);
                    }
                }
                console.log(`🔍 [PUBLIC VOUCHER DEDUCTION] ==========================================\n`);
            } catch (voucherError) {
                console.error('❌ [PUBLIC VOUCHER DEDUCTION] Error deducting public voucher stock:', voucherError);
                // Don't fail appointment update if voucher deduction fails
            }
        }

        // ==========================================
        // TẠO PAYMENT RECORD VÀ CẬP NHẬT WALLET KHI XÁC NHẬN THANH TOÁN
        // Logic: Khi admin xác nhận thanh toán (paymentStatus: Unpaid -> Paid), tạo Payment record và cập nhật wallet
        // Đồng bộ payment status với treatment course nếu có
        // ==========================================
        if (oldPaymentStatus !== 'Paid' && updatedData.paymentStatus === 'Paid' && appointment.userId) {
            // Đồng bộ payment status với treatment course nếu appointment này thuộc về treatment course
            try {
                const session = await db.TreatmentSession.findOne({
                    where: { appointmentId: appointment.id }
                });
                
                if (session && session.treatmentCourseId) {
                    await db.TreatmentCourse.update(
                        { paymentStatus: 'Paid' },
                        { where: { id: session.treatmentCourseId } }
                    );
                    console.log(`✅ Synchronized payment status to 'Paid' for treatment course ${session.treatmentCourseId}`);
                }
            } catch (syncError) {
                console.error('Error synchronizing payment status to treatment course:', syncError);
                // Don't fail appointment update if sync fails
            }
            try {
                // Kiểm tra xem đã có Payment record chưa (có thể đã được tạo khi đặt lịch với số tiền thực tế)
                let payment = await db.Payment.findOne({
                    where: { appointmentId: appointment.id }
                });

                // Lấy service để tính số tiền (fallback nếu chưa có Payment record)
                const service = await db.Service.findByPk(appointment.serviceId);
                const servicePrice = service ? parseFloat(service.price) : 0;

                // QUAN TRỌNG: Lưu oldPaymentStatus trước khi update để kiểm tra xem có tạo thông báo không
                // Điều này đảm bảo chỉ tạo thông báo khi payment status thực sự chuyển từ 'Pending' sang 'Completed'
                const oldPaymentStatus = payment ? payment.status : null;
                console.log(`🔍 [APPOINTMENT PAYMENT] Checking payment notification:`, {
                    appointmentId: appointment.id,
                    hasPayment: !!payment,
                    oldPaymentStatus: oldPaymentStatus || 'null',
                    willCreateNewPayment: !payment
                });

                if (!payment) {
                    // Tạo Payment record mới nếu chưa có
                    // Số tiền = Service.price (giá gốc, vì chưa có Payment record với số tiền thực tế)
                    payment = await db.Payment.create({
                        id: `pay-${uuidv4()}`,
                        appointmentId: appointment.id,
                        userId: appointment.userId,
                        serviceName: appointment.serviceName,
                        amount: servicePrice,
                        method: 'Cash', // Mặc định là Cash khi admin xác nhận
                        status: 'Completed', // Đã thanh toán - để cập nhật TỔNG DOANH THU
                        date: new Date().toISOString(),
                        transactionId: `APT-${appointment.id}-${Date.now()}`
                    });
                    console.log(`✅ Created Payment record for appointment ${appointment.id}, amount: ${servicePrice}`);
                } else if (payment.status !== 'Completed') {
                    // Nếu đã có Payment record nhưng chưa Completed, cập nhật status
                    // Dùng số tiền từ Payment record (đây là số tiền thực tế đã thanh toán, có thể đã có giảm giá/voucher)
                    await payment.update({ 
                        status: 'Completed',
                        date: new Date().toISOString()
                    });
                    console.log(`✅ Updated Payment record ${payment.id} to Completed for appointment ${appointment.id}, amount: ${payment.amount}`);
                } else {
                    // Payment đã Completed rồi, không cần làm gì
                    console.log(`⚠️ Payment record ${payment.id} already completed for appointment ${appointment.id}`);
                }

                // Cập nhật wallet: thêm points và totalSpent (chỉ khi payment status chuyển sang Completed)
                // Kiểm tra lại payment status sau khi update
                const updatedPayment = await db.Payment.findByPk(payment.id);
                if (updatedPayment && updatedPayment.status === 'Completed') {
                    const wallet = await db.Wallet.findOne({ where: { userId: appointment.userId } });
                    if (wallet) {
                        // Dùng số tiền từ Payment record (đây là số tiền thực tế đã thanh toán, có thể đã có giảm giá/voucher)
                        const amount = parseFloat(updatedPayment.amount) || servicePrice;
                        const pointsEarned = Math.floor(amount / 1000);
                        const currentPoints = wallet.points || 0;
                        const currentTotalSpent = parseFloat(wallet.totalSpent?.toString() || '0');
                        
                        // Chỉ cập nhật nếu payment chưa được tính vào wallet (tránh cộng 2 lần)
                        // Kiểm tra xem payment này đã được tính chưa bằng cách kiểm tra oldStatus
                        const oldPaymentStatus = payment.status || 'Pending';
                        if (oldPaymentStatus !== 'Completed') {
                            await wallet.update({
                                points: currentPoints + pointsEarned,
                                totalSpent: currentTotalSpent + amount,
                                lastUpdated: new Date()
                            });

                            // Note: Points history is derived from Payment records, not stored separately
                            console.log(`✅ User ${appointment.userId} earned ${pointsEarned} points from payment`);

                            // Lưu tierLevel cũ để kiểm tra lên hạng
                            const oldTierLevel = wallet.tierLevel;
                            
                            // Cập nhật tier level dựa trên totalSpent mới
                            const { calculateTierInfo } = require('../utils/tierUtils');
                            const newTotalSpent = currentTotalSpent + amount;
                            const tierInfo = calculateTierInfo(newTotalSpent);
                            const newTierLevel = tierInfo.currentTier.level;
                            
                            await wallet.update({ tierLevel: newTierLevel });

                            console.log(`✅ [APPOINTMENT PAYMENT] Wallet updated: +${pointsEarned} points, total: ${currentPoints + pointsEarned} points, totalSpent: ${newTotalSpent}, tierLevel: ${oldTierLevel} → ${newTierLevel}`);
                            
                            // Gửi voucher tự động nếu lên hạng (logic này sẽ được xử lý trong Wallet model hook)
                        } else {
                            console.log(`⚠️ [APPOINTMENT PAYMENT] Payment ${payment.id} already completed, skipping wallet update`);
                        }
                    }
                }

                // Notify admins about completed payment (async, don't wait)
                // QUAN TRỌNG: Chỉ tạo thông báo khi payment status thực sự chuyển từ 'Pending' sang 'Completed'
                // KHÔNG tạo thông báo nếu payment đã là 'Completed' từ trước hoặc vừa được tạo mới với status = 'Completed'
                if (updatedPayment && updatedPayment.status === 'Completed' && oldPaymentStatus === 'Pending') {
                    try {
                        const user = await db.User.findByPk(appointment.userId);
                        const userName = user ? user.name : 'Khách hàng';
                        const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
                        const amount = parseFloat(updatedPayment.amount) || servicePrice;
                        
                        console.log(`🔔 [APPOINTMENT PAYMENT] Creating notification - Payment status changed from 'Pending' to 'Completed'`);
                        notifyAdmins(
                            'payment_received',
                            'Thanh toán tiền mặt',
                            `${userName} đã thanh toán ${formatPrice(amount)} bằng tiền mặt cho ${appointment.serviceName}`,
                            updatedPayment.id
                        );
                    } catch (notifError) {
                        console.error('Error creating payment notification:', notifError);
                        // Don't fail payment if notification fails
                    }
                } else {
                    console.log(`ℹ️ [APPOINTMENT PAYMENT] Skipped notification - Payment oldStatus: ${oldPaymentStatus || 'null'}, currentStatus: ${updatedPayment?.status || 'null'}`);
                }
            } catch (paymentError) {
                console.error('Error creating/updating payment for appointment:', paymentError);
                // Don't fail appointment update if payment creation fails
            }
        }

        // Record promotion usage when payment status changes to Paid (for tracking purposes)
        if (oldPaymentStatus !== 'Paid' && updatedData.paymentStatus === 'Paid' && appointment.promotionId && appointment.userId) {
            try {
                const existingUsage = await db.PromotionUsage.findOne({
                            where: {
                        userId: appointment.userId,
                        promotionId: appointment.promotionId,
                        appointmentId: appointment.id
                    }
                });

                if (!existingUsage) {
                    // Chỉ tạo PromotionUsage nếu chưa có (có thể đã được tạo ở trên)
                    await db.PromotionUsage.create({
                        id: `promo-usage-${uuidv4()}`,
                        userId: appointment.userId,
                        promotionId: appointment.promotionId,
                        appointmentId: appointment.id,
                        serviceId: appointment.serviceId,
                    });
                    console.log(`✅ Recorded promotion usage for promotion ${appointment.promotionId} when payment confirmed`);
                }
            } catch (promoError) {
                console.error('Error recording promotion usage:', promoError);
                // Don't fail the appointment update if promotion usage recording fails
            }
        }

        // ==========================================
        // HOÀN LẠI VOUCHER KHI APPOINTMENT BỊ HỦY HOẶC BỊ TỪ CHỐI
        // Logic: Khi admin từ chối lịch hẹn (bất kỳ lý do gì), voucher được hoàn lại
        // - Voucher public: hoàn lại stock + xóa PromotionUsage
        // - Voucher đổi điểm: hoàn lại bằng cách set appointmentId = null
        // ==========================================
        // Sử dụng promotionId trước khi update (đảm bảo có thông tin voucher)
        const promotionIdToUse = promotionIdBeforeUpdate || appointment.promotionId;
        const userIdToUse = userIdBeforeUpdate || appointment.userId;
        
        // QUAN TRỌNG: Kiểm tra xem appointment có đang bị hủy/từ chối không
        // - Status thay đổi thành 'cancelled' → hoàn trả voucher
        // - Có rejectionReason được set → hoàn trả voucher
        const isBeingCancelled = (updatedData.status === 'cancelled');
        const hasRejectionReasonInUpdatedData = (updatedData.rejectionReason && updatedData.rejectionReason.trim() !== '');
        const hasRejectionReasonAfterReload = (appointment.rejectionReason && appointment.rejectionReason.trim() !== '');
        const hasRejectionReason = hasRejectionReasonInUpdatedData || hasRejectionReasonAfterReload;
        const isBeingCancelledOrRejected = (isBeingCancelled || hasRejectionReason);
        
        // Debug: Log trạng thái để kiểm tra
        console.log(`\n🔍 [VOUCHER REFUND CHECK] ==========================================`);
        console.log(`   Appointment ID: ${id}`);
        console.log(`   Old status: ${oldStatus}`);
        console.log(`   New status (in updatedData): ${updatedData.status || 'not set'}`);
        console.log(`   New status (after reload): ${appointment.status || 'not set'}`);
        console.log(`   RejectionReason (in updatedData): ${updatedData.rejectionReason || 'null/empty'}`);
        console.log(`   RejectionReason (after reload): ${appointment.rejectionReason || 'null/empty'}`);
        console.log(`   Promotion ID (before update): ${promotionIdBeforeUpdate || 'null/undefined'}`);
        console.log(`   Promotion ID (after reload): ${appointment.promotionId || 'null/undefined'}`);
        console.log(`   User ID: ${userIdToUse || 'null/undefined'}`);
        console.log(`   - isBeingCancelled (status = 'cancelled'): ${isBeingCancelled}`);
        console.log(`   - hasRejectionReasonInUpdatedData: ${hasRejectionReasonInUpdatedData}`);
        console.log(`   - hasRejectionReasonAfterReload: ${hasRejectionReasonAfterReload}`);
        console.log(`   - hasRejectionReason (combined): ${hasRejectionReason}`);
        console.log(`   - isBeingCancelledOrRejected: ${isBeingCancelledOrRejected}`);
        console.log(`   - Has promotionId: ${!!promotionIdToUse}`);
        console.log(`   - Has userId: ${!!userIdToUse}`);
        console.log(`   - Will refund voucher: ${isBeingCancelledOrRejected && promotionIdToUse && userIdToUse}`);
        console.log(`🔍 [VOUCHER REFUND CHECK] ==========================================\n`);

        if (isBeingCancelledOrRejected && promotionIdToUse && userIdToUse) {
            try {
                console.log(`\n🔄 [VOUCHER REFUND] ==========================================`);
                console.log(`   Appointment ID: ${id}`);
                console.log(`   User ID: ${userIdToUse}`);
                console.log(`   Promotion ID: ${promotionIdToUse}`);
                console.log(`   Service ID: ${appointment.serviceId}`);
                console.log(`   Status change: ${oldStatus} -> ${updatedData.status || oldStatus}`);
                console.log(`   Rejection reason: ${updatedData.rejectionReason || 'N/A'}`);
                console.log(`   Action: Admin từ chối/hủy lịch hẹn -> Hoàn trả voucher`);

                const promotion = await db.Promotion.findByPk(promotionIdToUse);
                if (!promotion) {
                    console.log(`   ⚠️ [WARNING] Promotion not found: ${promotionIdToUse}`);
                } else {
                    // Tìm PromotionUsage record được link với appointment này
                    // QUAN TRỌNG: Tìm bằng appointmentId trước, sau đó verify userId và promotionId
                    let usedVoucher = await db.PromotionUsage.findOne({
                        where: {
                            appointmentId: id
                        }
                    });

                    // Nếu không tìm được bằng appointmentId, thử tìm bằng userId + promotionId + appointmentId
                    if (!usedVoucher) {
                        usedVoucher = await db.PromotionUsage.findOne({
                            where: {
                                userId: userIdToUse,
                                promotionId: promotionIdToUse,
                                appointmentId: id
                            }
                        });
                    }

                    // Nếu vẫn không tìm được, log để debug
                    if (!usedVoucher) {
                        console.log(`   ⚠️ [WARNING] PromotionUsage not found for appointment ${id}`);
                        console.log(`   - Searching by appointmentId only...`);
                        const allUsagesForAppointment = await db.PromotionUsage.findAll({
                            where: {
                                appointmentId: id
                            }
                        });
                        console.log(`   - Found ${allUsagesForAppointment.length} PromotionUsage records with appointmentId = ${id}`);
                        
                        console.log(`   - Searching by userId + promotionId...`);
                        const allUsagesForUserAndPromo = await db.PromotionUsage.findAll({
                            where: {
                                userId: userIdToUse,
                                promotionId: promotionIdToUse
                            }
                        });
                        console.log(`   - Found ${allUsagesForUserAndPromo.length} PromotionUsage records for user ${userIdToUse} and promotion ${promotionIdToUse}`);
                        allUsagesForUserAndPromo.forEach((u, idx) => {
                            const uData = u.toJSON ? u.toJSON() : u;
                            console.log(`     [${idx + 1}] id: ${uData.id}, appointmentId: ${uData.appointmentId || 'NULL'}, serviceId: ${uData.serviceId || 'NULL'}`);
                        });

                        // Fallback: Tìm PromotionUsage có appointmentId khớp với appointment này
                        if (allUsagesForUserAndPromo.length > 0) {
                            const matchingUsage = allUsagesForUserAndPromo.find(u => u.appointmentId === id);
                            if (matchingUsage) {
                                usedVoucher = matchingUsage;
                                console.log(`   ✅ Found PromotionUsage via fallback search: ${usedVoucher.id}`);
                            }
                        }
                    }

                    if (usedVoucher) {
                    const promoData = promotion.toJSON ? promotion.toJSON() : promotion;
                    const normalizedIsPublic = promoData.isPublic === true || promoData.isPublic === 1 || promoData.isPublic === '1';
                    
                    // Kiểm tra loại voucher để quyết định có hoàn trả không
                    const isNewClientVoucher = promotion.targetAudience === 'New Clients';
                    const isBirthdayVoucher = promotion.targetAudience === 'Birthday';
                    const isBeingRejectedFromPending = (oldStatus === 'pending' && (isBeingCancelled || isBeingRejected));

                    console.log(`   ✅ Found used voucher: ${usedVoucher.id}`);
                    console.log(`   - Voucher code: ${promotion.code}`);
                    console.log(`   - Is public voucher: ${normalizedIsPublic}`);
                    console.log(`   - Target audience: ${promotion.targetAudience}`);
                    console.log(`   - Current appointmentId: ${usedVoucher.appointmentId}`);
                    console.log(`   - Is rejected from pending: ${isBeingRejectedFromPending}`);

                    // QUAN TRỌNG: Logic hoàn trả voucher
                    // - Tất cả redeemed vouchers (đổi điểm, isPublic = false) LUÔN được hoàn trả khi appointment bị hủy/từ chối
                    // - Voucher "New Clients" và "Birthday" (public) luôn được hoàn trả khi appointment bị hủy/từ chối
                    // - Voucher public thường khác chỉ hoàn trả nếu bị từ chối từ pending (chưa được accept)
                    const isRedeemedVoucher = !normalizedIsPublic;
                    const isSpecialPublicVoucher = (isNewClientVoucher || isBirthdayVoucher) && normalizedIsPublic;
                    const shouldRefundRedeemed = isRedeemedVoucher && isBeingCancelledOrRejected;
                    const shouldRefundSpecialPublic = isSpecialPublicVoucher && isBeingCancelledOrRejected;
                    const shouldRefundNormalPublic = normalizedIsPublic && isBeingRejectedFromPending;

                    console.log(`   - Is redeemed voucher (đổi điểm): ${isRedeemedVoucher}`);
                    console.log(`   - Is special public voucher (New Clients/Birthday): ${isSpecialPublicVoucher}`);
                    console.log(`   - Should refund redeemed voucher: ${shouldRefundRedeemed}`);
                    console.log(`   - Should refund special public voucher: ${shouldRefundSpecialPublic}`);
                    console.log(`   - Should refund normal public voucher: ${shouldRefundNormalPublic}`);

                    // Xử lý hoàn trả voucher
                    if (shouldRefundRedeemed || shouldRefundSpecialPublic || shouldRefundNormalPublic) {
                        if (normalizedIsPublic) {
                            // Public voucher: Hoàn lại stock + xóa PromotionUsage
                            console.log(`   🔄 Refunding PUBLIC voucher - restoring stock and removing PromotionUsage`);
                            console.log(`   - Voucher type: ${isNewClientVoucher ? 'New Clients' : isBirthdayVoucher ? 'Birthday' : 'Other'}`);

                            // Hoàn lại stock (nếu có)
                            if (promotion.stock !== null) {
                                await promotion.increment('stock', { by: 1 });
                                const updatedPromo = await db.Promotion.findByPk(appointment.promotionId);
                                console.log(`   ✅ Stock restored: ${promotion.stock} -> ${updatedPromo?.stock}`);
                            }

                            // Xóa PromotionUsage để voucher có thể dùng lại
                            await usedVoucher.destroy();
                            console.log(`   ✅ PromotionUsage deleted - voucher can be used again`);
                            if (isNewClientVoucher) {
                                console.log(`   ✅ [NEW CLIENTS] Voucher refunded - user can now use this voucher for service ${appointment.serviceId} again`);
                            } else if (isBirthdayVoucher) {
                                console.log(`   ✅ [BIRTHDAY] Voucher refunded - user can now use this birthday voucher again`);
                            }
                        } else {
                            // Redeemed voucher (đổi điểm): Set appointmentId = null để voucher có thể dùng lại
                            // QUAN TRỌNG: Tất cả redeemed vouchers (SILVER10, BRONZE50K, SECRET40, GOLD150K, VIP200K, ...) 
                            // đều được hoàn trả khi appointment bị hủy/từ chối
                            console.log(`   🔄 Refunding REDEEMED voucher (đổi điểm) - setting appointmentId to null`);
                            console.log(`   - Voucher code: ${promotion.code}`);
                            console.log(`   - Current appointmentId: ${usedVoucher.appointmentId}`);
                            console.log(`   - Setting appointmentId to NULL to refund voucher`);

                            await usedVoucher.update({
                                appointmentId: null,
                                serviceId: null
                            });

                            // Reload để verify
                            await usedVoucher.reload();

                            console.log(`   ✅ Voucher refunded successfully!`);
                            console.log(`   - After update: appointmentId = ${usedVoucher.appointmentId || 'NULL'}`);
                            console.log(`   - Voucher will now appear in user's "Ưu đãi của tôi" again`);
                            console.log(`   - redeemedCount will increase when querying /my-redeemed API`);
                        }

                        console.log(`   ✅ [SUCCESS] Voucher "${promotion.code}" hoàn trả thành công cho user ${userIdToUse}`);
                    } else {
                        console.log(`   ℹ️ [INFO] Voucher will not be refunded`);
                        console.log(`   - This is a normal public voucher that was already accepted (not rejected from pending)`);
                        console.log(`   - Only redeemed vouchers (đổi điểm) and special vouchers (New Clients/Birthday) are refunded when cancelled/rejected from any status`);
                    }
                    } else {
                        console.log(`   ⚠️ [WARNING] No PromotionUsage found for this appointment after all fallback searches`);
                        console.log(`   - Voucher may not have been linked to this appointment during booking`);
                        console.log(`   - Promotion ID: ${appointment.promotionId}`);
                        console.log(`   - User ID: ${appointment.userId}`);
                        console.log(`   - Appointment ID: ${id}`);
                    }
                }
                console.log(`🔄 [VOUCHER REFUND] ==========================================\n`);
            } catch (voucherRefundError) {
                console.error('❌ [VOUCHER REFUND] Error refunding voucher:', voucherRefundError);
                console.error('   Error stack:', voucherRefundError.stack);
                // Don't fail appointment update if voucher refund fails
            }
        }

        // Sync treatment course status with appointment status
        // When appointment is accepted (pending -> upcoming/scheduled), update course from pending -> active
        // When appointment is cancelled/reverted (upcoming/scheduled -> cancelled/pending), update course from active -> pending
        const isBeingAcceptedForCourse = (oldStatus === 'pending' && (updatedData.status === 'upcoming' || updatedData.status === 'scheduled'));
        const isBeingCancelledForCourse = ((oldStatus === 'upcoming' || oldStatus === 'scheduled') && updatedData.status === 'cancelled');
        const isBackToPending = ((oldStatus === 'upcoming' || oldStatus === 'scheduled') && updatedData.status === 'pending');

        if (isBeingAcceptedForCourse || isBeingCancelledForCourse || isBackToPending) {
            try {
                // Find treatment session linked to this appointment
                const linkedSession = await db.TreatmentSession.findOne({
                    where: { appointmentId: id }
                });

                if (linkedSession) {
                    const treatmentCourse = await db.TreatmentCourse.findByPk(linkedSession.treatmentCourseId);
                    if (treatmentCourse) {
                        if (isBeingCancelledForCourse) {
                            // Appointment is being cancelled, update course to cancelled
                            if (treatmentCourse.status === 'active') {
                                await treatmentCourse.update({ status: 'cancelled' });
                                console.log(`✅ Updated treatment course ${treatmentCourse.id} status from 'active' to 'cancelled' after appointment cancellation`);
                            }
                        }
                    }
                } else {
                    // If no session linked, try to find treatment course by serviceId and userId
                    const treatmentCourse = await db.TreatmentCourse.findOne({
                        where: {
                            serviceId: appointment.serviceId,
                            clientId: appointment.userId,
                            status: 'active'
                        },
                        order: [['createdAt', 'DESC']]
                    });

                    if (treatmentCourse && isBeingCancelled) {
                        await treatmentCourse.update({ status: 'cancelled' });
                        console.log(`✅ Updated treatment course ${treatmentCourse.id} status from 'active' to 'cancelled' after appointment cancellation (no linked session)`);
                    }
                }
            } catch (syncError) {
                console.error('Error syncing treatment course status:', syncError);
                // Don't fail the appointment update if sync fails
            }
        }

        // Auto-create staff shift if therapist is assigned and status is 'upcoming'
        if (updatedData.therapistId && updatedData.status === 'upcoming') {
            const therapistId = updatedData.therapistId;
            const appointmentDate = appointment.date;
            const appointmentTime = appointment.time;

            // Gửi thông báo cho staff khi được phân công lịch hẹn
            try {
                const therapist = await db.User.findByPk(therapistId);
                if (therapist && db.Notification) {
                    await db.Notification.create({
                        id: `notif-${uuidv4()}`,
                        userId: therapistId,
                        type: 'appointment_assigned',
                        title: 'Phân công lịch hẹn mới',
                        message: `Bạn được phân công lịch hẹn ${appointment.serviceName} vào ${new Date(appointmentDate).toLocaleDateString('vi-VN')} lúc ${appointmentTime}`,
                        relatedId: appointment.id,
                        sentVia: 'app',
                        isRead: false,
                        createdAt: new Date(),
                    });
                    console.log(`✅ Notification sent to staff ${therapist.name} for appointment assignment`);
                }
            } catch (notifError) {
                console.error('Error sending notification to staff:', notifError);
            }

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

                    // Get treatment course
                    const treatmentCourse = await db.TreatmentCourse.findByPk(linkedSession.treatmentCourseId);
                    if (treatmentCourse) {
                        // Update treatment course therapistId
                        await treatmentCourse.update({
                            therapistId: updatedData.therapistId
                        });
                        console.log(`✅ Updated treatment course ${treatmentCourse.id} with therapistId: ${updatedData.therapistId}`);

                        // Khi admin xác nhận lịch (status thay đổi từ pending -> upcoming/scheduled) và chọn staff,
                        // tự động gán staff đó cho TẤT CẢ các buổi trong liệu trình và tạo appointments
                        if (isBeingAcceptedForCourse && (updatedData.status === 'upcoming' || updatedData.status === 'scheduled')) {
                            const allSessions = await db.TreatmentSession.findAll({
                                where: { treatmentCourseId: treatmentCourse.id },
                                order: [['sessionNumber', 'ASC']]
                            });

                            const service = await db.Service.findByPk(treatmentCourse.serviceId);
                            const serviceName = service ? service.name : treatmentCourse.serviceName;

                            console.log(`🔄 Auto-assigning staff ${updatedData.therapistId} to all ${allSessions.length} sessions in treatment course ${treatmentCourse.id}`);

                            for (const session of allSessions) {
                                // Gán staff cho TẤT CẢ các buổi trong liệu trình
                                await session.update({ staffId: updatedData.therapistId });
                                console.log(`✅ Assigned staff ${updatedData.therapistId} to session ${session.id} (buổi ${session.sessionNumber})`);

                                if (!session.appointmentId) {
                                    // Tạo appointment mới cho buổi này nếu chưa có
                                    const newAppointment = await db.Appointment.create({
                                        id: `apt-${uuidv4()}`,
                                        serviceId: treatmentCourse.serviceId,
                                        serviceName: serviceName,
                                        userId: treatmentCourse.clientId,
                                        date: session.sessionDate,
                                        time: session.sessionTime,
                                        therapistId: updatedData.therapistId,
                                        status: 'upcoming',
                                        paymentStatus: 'Unpaid',
                                        notesForTherapist: `Buổi ${session.sessionNumber} của liệu trình ${serviceName}`,
                                        bookingGroupId: `group-${treatmentCourse.id}`,
                                    });
                                    await session.update({ appointmentId: newAppointment.id });
                                    console.log(`✅ Created appointment ${newAppointment.id} for session ${session.id} (buổi ${session.sessionNumber})`);
                                } else {
                                    // Nếu appointment đã tồn tại, cập nhật therapistId và đảm bảo status là 'upcoming'
                                    const existingAppointment = await db.Appointment.findByPk(session.appointmentId);
                                    if (existingAppointment) {
                                        await existingAppointment.update({
                                            date: session.sessionDate,
                                            time: session.sessionTime,
                                            therapistId: updatedData.therapistId,
                                            status: 'upcoming'
                                        });
                                        console.log(`✅ Updated existing appointment ${existingAppointment.id} for session ${session.id} (buổi ${session.sessionNumber})`);
                                    }
                                }
                            }

                            console.log(`✅ Completed: Assigned staff ${updatedData.therapistId} to all ${allSessions.length} sessions in treatment course ${treatmentCourse.id}`);
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
                            order: [
                                ['createdAt', 'DESC']
                            ]
                        });

                        if (treatmentCourse) {
                            // Update treatment course therapistId
                            await treatmentCourse.update({
                                therapistId: updatedData.therapistId
                            });

                            // If appointment is being accepted, auto-assign staff to all sessions and create appointments
                            if (isBeingAcceptedForCourse && (updatedData.status === 'upcoming' || updatedData.status === 'scheduled')) {
                                const allSessions = await db.TreatmentSession.findAll({
                                    where: { treatmentCourseId: treatmentCourse.id },
                                    order: [['sessionNumber', 'ASC']]
                                });

                                const service = await db.Service.findByPk(treatmentCourse.serviceId);
                                const serviceName = service ? service.name : treatmentCourse.serviceName;

                                for (const session of allSessions) {
                                    // Update staffId for all sessions
                                    await session.update({ staffId: updatedData.therapistId });

                                    if (!session.appointmentId) {
                                        // Create new appointment for this session
                                        const newAppointment = await db.Appointment.create({
                                            id: `apt-${uuidv4()}`,
                                            serviceId: treatmentCourse.serviceId,
                                            serviceName: serviceName,
                                            userId: treatmentCourse.clientId,
                                            date: session.sessionDate,
                                            time: session.sessionTime,
                                            therapistId: updatedData.therapistId,
                                            status: 'upcoming',
                                            paymentStatus: 'Unpaid',
                                            notesForTherapist: `Buổi ${session.sessionNumber} của liệu trình ${serviceName}`,
                                            bookingGroupId: `group-${treatmentCourse.id}`,
                                        });
                                        await session.update({ appointmentId: newAppointment.id });
                                        console.log(`✅ Created appointment ${newAppointment.id} for session ${session.id} (buổi ${session.sessionNumber}) - no linked session case`);
                                    } else {
                                        // If appointment exists, update its date/time/therapist to match session
                                        const existingAppointment = await db.Appointment.findByPk(session.appointmentId);
                                        if (existingAppointment) {
                                            await existingAppointment.update({
                                                date: session.sessionDate,
                                                time: session.sessionTime,
                                                therapistId: updatedData.therapistId,
                                                status: 'upcoming'
                                            });
                                            console.log(`✅ Updated existing appointment ${existingAppointment.id} for session ${session.id} - no linked session case`);
                                        }
                                    }
                                }
                            } else {
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
                }
            } catch (sessionError) {
                console.error('Error updating treatment session staffId:', sessionError);
                // Don't fail the appointment update if session update fails
            }
        }
        
        // Gửi thông báo khi status thay đổi
        if (db.Notification && oldStatus !== updatedData.status) {
            // QUAN TRỌNG: Reload lại appointment một lần nữa trước khi tạo notification để đảm bảo có dữ liệu mới nhất (đặc biệt là rejectionReason)
            await appointment.reload();
            
            console.log('🔔 Creating notification:', { oldStatus, newStatus: updatedData.status, userId: appointment.userId });
            
            let notifType = 'system';
            let notifTitle = 'Cập nhật lịch hẹn';
            let notifMessage = `Lịch hẹn ${appointment.serviceName} đã được cập nhật`;
            
            // Khi admin xác nhận lịch: pending -> upcoming/scheduled
            if (oldStatus === 'pending' && (updatedData.status === 'upcoming' || updatedData.status === 'scheduled')) {
                notifType = 'appointment_confirmed';
                notifTitle = 'Lịch hẹn đã được xác nhận';
                notifMessage = `Lịch hẹn ${appointment.serviceName} vào ${appointment.date} lúc ${appointment.time} đã được xác nhận`;
                console.log('✅ Appointment confirmed notification:', { notifType, userId: appointment.userId });
            } else if (updatedData.status === 'in-progress') {
                notifType = 'appointment_confirmed';
                notifTitle = 'Lịch hẹn đang thực hiện';
                notifMessage = `Lịch hẹn ${appointment.serviceName} vào ${appointment.date} lúc ${appointment.time} đang được thực hiện`;
            } else if (updatedData.status === 'cancelled') {
                notifType = 'appointment_cancelled';
                notifTitle = 'Lịch hẹn đã hủy';
                // Thêm ghi chú của admin (rejectionReason) vào message nếu có
                // QUAN TRỌNG: Lấy rejectionReason từ appointment đã reload (sau khi update) để đảm bảo có giá trị mới nhất
                // Ưu tiên lấy từ appointment.rejectionReason (sau khi reload), nếu không có thì lấy từ updatedData
                let rejectionReason = appointment.rejectionReason;
                if (!rejectionReason || rejectionReason.trim() === '') {
                    rejectionReason = updatedData.rejectionReason;
                }
                console.log(`📝 [CANCELLED NOTIFICATION] Creating notification:`, {
                    appointmentId: appointment.id,
                    rejectionReasonFromUpdatedData: updatedData.rejectionReason || 'null/empty',
                    rejectionReasonFromAppointment: appointment.rejectionReason || 'null/empty',
                    finalRejectionReason: rejectionReason || 'null/empty'
                });
                if (rejectionReason && rejectionReason.trim() !== '') {
                    notifMessage = `Lịch hẹn ${appointment.serviceName} vào ${appointment.date} lúc ${appointment.time} đã bị hủy.\n\nLý do: ${rejectionReason.trim()}`;
                } else {
                    notifMessage = `Lịch hẹn ${appointment.serviceName} vào ${appointment.date} lúc ${appointment.time} đã bị hủy`;
                }
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
                const notification = await db.Notification.create({
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
                console.log('✅ Notification created successfully:', notification.id);
            } catch (notifError) {
                console.error('❌ Error creating notification:', notifError);
            }
        }
        
        // Reload appointment with all associations to return fresh data
        // Always reload to ensure we have the latest data, especially after date/time updates
        await appointment.reload({
            include: [
                {
                    model: db.User,
                    as: 'Client',
                    attributes: ['id', 'name', 'email', 'phone']
                },
                {
                    model: db.User,
                    as: 'Therapist',
                    attributes: ['id', 'name', 'email', 'phone']
                },
                {
                    model: db.Service,
                    attributes: ['id', 'name', 'description', 'price', 'duration']
                },
                {
                    model: db.TreatmentSession,
                    as: 'TreatmentSession',
                    attributes: ['id', 'sessionNumber', 'adminNotes', 'customerStatusNotes', 'status', 'treatmentCourseId', 'sessionDate', 'sessionTime'],
                    required: false
                }
            ]
        });
        
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
