
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
                    attributes: ['id', 'sessionNumber', 'adminNotes', 'customerStatusNotes', 'status'],
                    required: false
                }
            ],
            order: [['date', 'DESC'], ['time', 'ASC']]
        });

        // Map appointments to include client info and treatment session
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
            // Ensure TreatmentSession is preserved
            if (appointmentData.TreatmentSession) {
                appointmentData.TreatmentSession = {
                    id: appointmentData.TreatmentSession.id,
                    sessionNumber: appointmentData.TreatmentSession.sessionNumber,
                    adminNotes: appointmentData.TreatmentSession.adminNotes,
                    customerStatusNotes: appointmentData.TreatmentSession.customerStatusNotes,
                    status: appointmentData.TreatmentSession.status
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

// GET /api/appointments/:id - Get single appointment by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const appointment = await db.Appointment.findByPk(id, {
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
                            attributes: ['id', 'totalSessions', 'completedSessions', 'serviceName']
                        }
                    ]
                }
            ]
        });

        if (!appointment) {
            return res.status(404).json({ message: 'Không tìm thấy lịch hẹn' });
        }

        res.json(appointment);
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
                    attributes: ['id', 'sessionNumber', 'adminNotes', 'customerStatusNotes', 'status'],
                    required: false
                }
            ],
            order: [['date', 'DESC'], ['time', 'ASC']]
        });

        // Map appointments to include client, therapist info, and treatment session
        const mappedAppointments = userAppointments.map(apt => {
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
            // Ensure TreatmentSession is preserved
            if (appointmentData.TreatmentSession) {
                appointmentData.TreatmentSession = {
                    id: appointmentData.TreatmentSession.id,
                    sessionNumber: appointmentData.TreatmentSession.sessionNumber,
                    adminNotes: appointmentData.TreatmentSession.adminNotes,
                    customerStatusNotes: appointmentData.TreatmentSession.customerStatusNotes,
                    status: appointmentData.TreatmentSession.status
                };
            }
            return appointmentData;
        });

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

                        // Đánh dấu voucher đã được dùng cho appointment này (trừ voucher)
                        // Sử dụng raw SQL update để đảm bảo update được commit
                        const [updateResult, metadata] = await db.sequelize.query(
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

                        console.log(`   Update result:`, updateResult);
                        console.log(`   Metadata:`, metadata);

                        // Verify update
                        const [updated] = await db.sequelize.query(
                            `SELECT * FROM promotion_usage WHERE id = :id`,
                            {
                                replacements: { id: unusedRedeemed.id },
                                type: QueryTypes.SELECT
                            }
                        );

                        if (updated && updated.appointmentId === createdAppointment.id) {
                            console.log(`   ✅ [SUCCESS] Voucher deducted successfully!`);
                            console.log(`   - Before update: appointmentId = NULL`);
                            console.log(`   - After update: appointmentId = ${updated.appointmentId}`);
                            console.log(`   - Linked to appointment: ${createdAppointment.id}`);
                        } else {
                            console.log(`   ⚠️ [WARNING] Update verification failed`);
                            console.log(`   - Updated record:`, updated);
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
                        // Tạo PromotionUsage ngay lập tức bằng raw SQL để đảm bảo commit
                        const { QueryTypes } = require('sequelize');
                        const newUsageId = `promo-usage-${uuidv4()}`;
                        
                        await db.sequelize.query(
                            `INSERT INTO promotion_usage (id, userId, promotionId, appointmentId, serviceId, usedAt, createdAt, updatedAt) 
                             VALUES (:id, :userId, :promotionId, :appointmentId, :serviceId, NOW(), NOW(), NOW())`,
                            {
                                replacements: {
                                    id: newUsageId,
                                    userId: finalUserId,
                                    promotionId: newAppointmentData.promotionId,
                                    appointmentId: createdAppointment.id,
                                    serviceId: newAppointmentData.serviceId
                                },
                                type: QueryTypes.INSERT
                            }
                        );
                        
                        console.log(`   ✅ [SUCCESS] Public voucher PromotionUsage created!`);
                        console.log(`   - PromotionUsage ID: ${newUsageId}`);
                        console.log(`   - User ID: ${finalUserId}`);
                        console.log(`   - Promotion ID: ${newAppointmentData.promotionId}`);
                        console.log(`   - Appointment ID: ${createdAppointment.id}`);
                        console.log(`   - Service ID: ${newAppointmentData.serviceId}`);
                        console.log(`   - Voucher will now be hidden from user's available vouchers`);
                        
                        // Trừ stock (nếu có)
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
        await appointment.update(updatedData);
        
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

                            // Cập nhật tier level dựa trên totalSpent mới
                            const { calculateTierInfo } = require('../utils/tierUtils');
                            const newTotalSpent = currentTotalSpent + amount;
                            const tierInfo = calculateTierInfo(newTotalSpent);
                            await wallet.update({ tierLevel: tierInfo.currentTier.level });

                            console.log(`✅ [APPOINTMENT PAYMENT] Wallet updated: +${pointsEarned} points, total: ${currentPoints + pointsEarned} points, totalSpent: ${newTotalSpent}, tierLevel: ${tierInfo.currentTier.level}`);
                        } else {
                            console.log(`⚠️ [APPOINTMENT PAYMENT] Payment ${payment.id} already completed, skipping wallet update`);
                        }
                    }
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
        const isBeingCancelled = (updatedData.status === 'cancelled');
        const isBeingRejected = (updatedData.rejectionReason && updatedData.rejectionReason.trim() !== '');
        const isBeingCancelledOrRejected = (isBeingCancelled || isBeingRejected);

        if (isBeingCancelledOrRejected && appointment.promotionId && appointment.userId) {
            try {
                console.log(`\n🔄 [VOUCHER REFUND] ==========================================`);
                console.log(`   Appointment ID: ${id}`);
                console.log(`   User ID: ${appointment.userId}`);
                console.log(`   Promotion ID: ${appointment.promotionId}`);
                console.log(`   Service ID: ${appointment.serviceId}`);
                console.log(`   Status change: ${oldStatus} -> ${updatedData.status || oldStatus}`);
                console.log(`   Rejection reason: ${updatedData.rejectionReason || 'N/A'}`);
                console.log(`   Action: Admin từ chối/hủy lịch hẹn -> Hoàn trả voucher`);

                // Tìm PromotionUsage record được link với appointment này
                const usedVoucher = await db.PromotionUsage.findOne({
                    where: {
                        userId: appointment.userId,
                        promotionId: appointment.promotionId,
                        appointmentId: id
                    }
                });

                const promotion = await db.Promotion.findByPk(appointment.promotionId);
                if (!promotion) {
                    console.log(`   ⚠️ [WARNING] Promotion not found: ${appointment.promotionId}`);
                } else if (usedVoucher) {
                    const promoData = promotion.toJSON ? promotion.toJSON() : promotion;
                    const normalizedIsPublic = promoData.isPublic === true || promoData.isPublic === 1 || promoData.isPublic === '1';

                    console.log(`   ✅ Found used voucher: ${usedVoucher.id}`);
                    console.log(`   - Voucher code: ${promotion.code}`);
                    console.log(`   - Is public voucher: ${normalizedIsPublic}`);
                    console.log(`   - Target audience: ${promotion.targetAudience}`);

                    if (normalizedIsPublic) {
                        // Public voucher: Hoàn lại stock + xóa PromotionUsage
                        console.log(`   🔄 Refunding PUBLIC voucher...`);

                        // Hoàn lại stock (nếu có)
                        if (promotion.stock !== null) {
                            await promotion.increment('stock', { by: 1 });
                            const updatedPromo = await db.Promotion.findByPk(appointment.promotionId);
                            console.log(`   ✅ Stock restored: ${promotion.stock} -> ${updatedPromo?.stock}`);
                        }

                        // Xóa PromotionUsage để voucher xuất hiện lại trong danh sách
                        await usedVoucher.destroy();
                        console.log(`   ✅ PromotionUsage deleted - voucher will reappear for user`);
                    } else {
                        // Redeemed voucher (đổi điểm): Set appointmentId = null để voucher có thể dùng lại
                        console.log(`   🔄 Refunding REDEEMED voucher (đổi điểm)...`);

                        await usedVoucher.update({
                            appointmentId: null,
                            serviceId: null
                        });

                        console.log(`   ✅ Voucher refunded - appointmentId set to null`);
                        console.log(`   ✅ User can now use this voucher again for service: ${appointment.serviceId}`);
                    }

                    console.log(`   ✅ [SUCCESS] Voucher "${promotion.code}" hoàn trả thành công cho user ${appointment.userId}`);
                } else {
                    console.log(`   ℹ️ [INFO] No PromotionUsage found for this appointment - voucher may not have been used`);
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
                const rejectionReason = updatedData.rejectionReason || appointment.rejectionReason;
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
