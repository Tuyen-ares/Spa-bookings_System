// backend/routes/treatmentCourses.js - Updated to match db.txt schema
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');

// Helper function to create notification for admins
const notifyAdmins = async (type, title, message, relatedId = null) => {
    try {
        // Get all admin users
        const admins = await db.User.findAll({
            where: { role: 'Admin', status: 'Active' }
        });

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

        if (notifications.length > 0) {
            await db.Notification.bulkCreate(notifications);
            console.log(`Created ${notifications.length} admin notifications for type: ${type}`);
        }
    } catch (error) {
        console.error('Error creating admin notifications:', error);
        // Don't throw error - notification failure shouldn't break main operation
    }
};

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
                {
                    model: db.TreatmentSession,
                    as: 'TreatmentSessions',
                    attributes: ['id', 'sessionNumber', 'status', 'sessionDate', 'sessionTime', 'adminNotes', 'customerStatusNotes', 'staffId', 'appointmentId'],
                    required: false,
                    include: [
                        {
                            model: db.User,
                            as: 'Staff',
                            attributes: ['id', 'name', 'email', 'phone'],
                            required: false
                        }
                    ],
                    order: [['sessionNumber', 'ASC']],
                },
            ],
            order: [['createdAt', 'DESC']],
        });

        // Đồng bộ totalAmount từ Payment cho từng course
        const mappedCourses = await Promise.all(courses.map(async (course) => {
            const courseData = course.toJSON();
            if (courseData.TreatmentSessions) {
                courseData.sessions = courseData.TreatmentSessions;
                delete courseData.TreatmentSessions;
            }

            // Đồng bộ totalAmount từ Payment nếu có
            try {
                const appointmentIds = courseData.sessions
                    ?.map(s => s.appointmentId)
                    .filter(id => id !== null) || [];
                
                if (appointmentIds.length > 0) {
                    const payment = await db.Payment.findOne({
                        where: {
                            appointmentId: { [Op.in]: appointmentIds }
                        },
                        order: [['date', 'DESC']]
                    });
                    
                    if (payment && payment.amount) {
                        const paymentAmount = parseFloat(payment.amount);
                        const currentTotalAmount = courseData.totalAmount ? parseFloat(courseData.totalAmount) : null;
                        
                        if (!currentTotalAmount || currentTotalAmount === 0 || currentTotalAmount !== paymentAmount) {
                            await course.update({ 
                                totalAmount: paymentAmount,
                                paymentStatus: payment.status === 'Completed' ? 'Paid' : 'Unpaid'
                            });
                            courseData.totalAmount = paymentAmount;
                            courseData.paymentStatus = 'Paid';
                            console.log(`✅ [TREATMENT COURSE LIST] Updated totalAmount from Payment: ${paymentAmount} VND for course ${course.id}`);
                        }
                    }
                }
            } catch (syncError) {
                console.error(`Error syncing totalAmount for course ${course.id}:`, syncError);
            }

            // Đảm bảo totalAmount được trả về đúng định dạng
            if (courseData.totalAmount !== null && courseData.totalAmount !== undefined) {
                courseData.totalAmount = parseFloat(courseData.totalAmount);
            }

            return courseData;
        }));

        res.json(mappedCourses);
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

        // Nếu totalAmount chưa có hoặc paymentStatus chưa đúng, thử lấy từ Payment record
        // Best practice: Kiểm tra và đồng bộ từ Payment để đảm bảo data chính xác
        try {
            // Tìm Payment record liên quan đến treatment course này
            const sessions = await db.TreatmentSession.findAll({
                where: { treatmentCourseId: course.id },
                attributes: ['appointmentId']
            });
            
            const appointmentIds = sessions
                .map(s => s.appointmentId)
                .filter(id => id !== null);
            
            if (appointmentIds.length > 0) {
                // Tìm Payment record với appointmentId trong danh sách (bất kỳ status nào)
                const payment = await db.Payment.findOne({
                    where: {
                        appointmentId: { [Op.in]: appointmentIds }
                    },
                    order: [['date', 'DESC']] // Lấy payment mới nhất
                });
                
                if (payment && payment.amount) {
                    const paymentAmount = parseFloat(payment.amount);
                    const currentTotalAmount = course.totalAmount ? parseFloat(course.totalAmount) : null;
                    
                    // Nếu totalAmount chưa có hoặc khác với payment amount, cập nhật
                    if (!currentTotalAmount || currentTotalAmount === 0 || currentTotalAmount !== paymentAmount) {
                        await course.update({ 
                            totalAmount: paymentAmount,
                            paymentStatus: payment.status === 'Completed' ? 'Paid' : 'Unpaid'
                        });
                        // Reload để có data mới nhất
                        await course.reload();
                        console.log(`✅ [TREATMENT COURSE GET] Updated totalAmount from Payment: ${paymentAmount} VND (was: ${currentTotalAmount || 'null'}) for course ${course.id}`);
                    }
                }
            }
        } catch (updateError) {
            console.error('Error updating totalAmount from Payment:', updateError);
            // Không fail request nếu update thất bại
        }

        // Đảm bảo totalAmount được trả về đúng định dạng
        const courseData = course.toJSON();
        if (courseData.totalAmount !== null && courseData.totalAmount !== undefined) {
            courseData.totalAmount = parseFloat(courseData.totalAmount);
        }
        
        // Ensure TreatmentSessions have sessionDate and sessionTime properly formatted
        if (courseData.TreatmentSessions && Array.isArray(courseData.TreatmentSessions)) {
            courseData.TreatmentSessions = courseData.TreatmentSessions.map((session) => {
                // Ensure sessionDate is in YYYY-MM-DD format
                if (session.sessionDate) {
                    const date = new Date(session.sessionDate);
                    if (!isNaN(date.getTime())) {
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        session.sessionDate = `${year}-${month}-${day}`;
                    }
                }
                return session;
            });
        }

        res.json(courseData);
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

        // Update or create Appointment for this treatment session
        try {
            if (session.appointmentId) {
                // Update existing appointment status to 'completed'
                const appointment = await db.Appointment.findByPk(session.appointmentId);
                if (appointment) {
                    await appointment.update({
                        status: 'completed',
                    });
                    console.log(`✅ Updated appointment ${appointment.id} to completed status`);
                }
            } else if (session.sessionDate && session.sessionTime) {
                // Create appointment if session has date/time but no appointmentId
                // This handles cases where appointment was not created when session was scheduled
                const service = await db.Service.findByPk(course.serviceId);
                if (service && course.clientId) {
                    const appointment = await db.Appointment.create({
                        id: `apt-${uuidv4()}`,
                        serviceId: course.serviceId,
                        serviceName: service.name || course.serviceName,
                        userId: course.clientId,
                        date: session.sessionDate,
                        time: session.sessionTime,
                        therapistId: session.staffId || null,
                        status: 'completed', // Already completed
                        paymentStatus: 'Unpaid', // Default, can be updated later
                        notesForTherapist: `Buổi ${session.sessionNumber} của liệu trình ${service.name || course.serviceName}`,
                        bookingGroupId: `group-${course.id}`,
                    });
                    
                    // Link appointment to session
                    await session.update({ appointmentId: appointment.id });
                    console.log(`✅ Created and linked appointment ${appointment.id} for completed treatment session ${session.id}`);
                }
            }
        } catch (appointmentError) {
            console.error('Error updating/creating appointment for treatment session:', appointmentError);
            // Don't fail the whole operation if appointment update/create fails
        }

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

// PUT /api/treatment-courses/:id/confirm-payment - Xác nhận thanh toán cho liệu trình
router.put('/:id/confirm-payment', async (req, res) => {
    try {
        const { id } = req.params;
        const course = await db.TreatmentCourse.findByPk(id, {
            include: [{
                model: db.Service,
                required: false
            }]
        });
        
        if (!course) {
            return res.status(404).json({ message: 'Treatment course not found' });
        }

        // Dùng số tiền thực tế đã lưu khi đặt lịch (sau giảm giá/voucher), nếu không có thì tính từ service price
        const totalAmount = course.totalAmount 
            ? parseFloat(course.totalAmount.toString()) 
            : (course.Service ? parseFloat(course.Service.price) * course.totalSessions : 0);

        // Update payment status to Paid
        await course.update({ paymentStatus: 'Paid' });

        // Đồng bộ payment status cho tất cả appointments liên quan đến treatment course này
        try {
            // Cách 1: Tìm appointments qua TreatmentSession
            const sessions = await db.TreatmentSession.findAll({
                where: { treatmentCourseId: course.id },
                attributes: ['appointmentId']
            });
            
            const appointmentIdsFromSessions = sessions
                .map(s => s.appointmentId)
                .filter(id => id !== null);
            
            // Cách 2: Tìm appointments qua bookingGroupId (fallback)
            const bookingGroupId = `group-${course.id}`;
            const appointmentsFromGroup = await db.Appointment.findAll({
                where: { bookingGroupId: bookingGroupId },
                attributes: ['id']
            });
            
            const appointmentIdsFromGroup = appointmentsFromGroup.map(apt => apt.id);
            
            // Kết hợp cả 2 cách và loại bỏ duplicates
            const allAppointmentIds = [...new Set([...appointmentIdsFromSessions, ...appointmentIdsFromGroup])];
            
            if (allAppointmentIds.length > 0) {
                await db.Appointment.update(
                    { paymentStatus: 'Paid' },
                    { where: { id: { [Op.in]: allAppointmentIds } } }
                );
                console.log(`✅ Synchronized payment status to 'Paid' for ${allAppointmentIds.length} appointments (${appointmentIdsFromSessions.length} from sessions, ${appointmentIdsFromGroup.length} from bookingGroup)`);
            } else {
                console.log(`⚠️ No appointments found to sync for treatment course ${course.id}`);
            }
        } catch (syncError) {
            console.error('Error synchronizing payment status to appointments:', syncError);
            // Don't fail payment confirmation if sync fails
        }

        // Kiểm tra xem đã có Payment record Completed cho treatment course này chưa (tránh tạo duplicate)
        const existingPayment = await db.Payment.findOne({
            where: {
                userId: course.clientId,
                serviceName: course.serviceName,
                amount: totalAmount,
                status: 'Completed',
                transactionId: { [Op.like]: `TC-${id}-%` } // Tìm payment có transactionId bắt đầu bằng TC-{id}-
            },
            order: [['date', 'DESC']]
        });

        let payment;
        if (existingPayment) {
            console.log(`⚠️ [TREATMENT COURSE PAYMENT] Payment already exists for this course, using existing payment: ${existingPayment.id}`);
            payment = existingPayment;
        } else {
            // Tạo Payment record mới để cập nhật doanh thu và wallet
            // Lấy appointmentId đầu tiên từ TreatmentSession (nếu có) để link payment với appointment
            const firstSession = await db.TreatmentSession.findOne({
                where: { treatmentCourseId: course.id },
                attributes: ['appointmentId'],
                order: [['sessionNumber', 'ASC']]
            });
            
            payment = await db.Payment.create({
                id: `pay-${uuidv4()}`,
                appointmentId: firstSession?.appointmentId || null, // Link với appointment đầu tiên nếu có
                userId: course.clientId,
                serviceName: course.serviceName,
                amount: totalAmount,
                method: 'Cash', // Mặc định là Cash khi admin xác nhận
                status: 'Completed', // Đã thanh toán - để cập nhật TỔNG DOANH THU
                date: new Date().toISOString(),
                transactionId: `TC-${id}-${Date.now()}`
            });
            
            console.log(`✅ [TREATMENT COURSE PAYMENT] Created new Payment record:`, {
                paymentId: payment.id,
                amount: totalAmount,
                userId: course.clientId,
                appointmentId: payment.appointmentId,
                status: 'Completed'
            });
        }

        // Cập nhật wallet: thêm points và totalSpent (chỉ nếu payment mới được tạo)
        if (!existingPayment) {
            try {
                const wallet = await db.Wallet.findOne({ where: { userId: course.clientId } });
                if (wallet) {
                    const pointsEarned = Math.floor(totalAmount / 1000);
                    const currentPoints = wallet.points || 0;
                    const currentTotalSpent = parseFloat(wallet.totalSpent?.toString() || '0');
                    const newTotalSpent = currentTotalSpent + totalAmount;
                    
                    // Cập nhật wallet với points và totalSpent mới
                    await wallet.update({
                        points: currentPoints + pointsEarned,
                        totalSpent: newTotalSpent,
                        lastUpdated: new Date()
                    });

                    // Lưu tierLevel cũ để kiểm tra lên hạng
                    const oldTierLevel = wallet.tierLevel;
                    
                    // Cập nhật tier level dựa trên totalSpent mới
                    const { calculateTierInfo } = require('../utils/tierUtils');
                    const tierInfo = calculateTierInfo(newTotalSpent);
                    const newTierLevel = tierInfo.currentTier.level;
                    
                    await wallet.update({ tierLevel: newTierLevel });

                    console.log(`✅ [TREATMENT COURSE PAYMENT] Wallet updated:`, {
                        pointsEarned: pointsEarned,
                        oldPoints: currentPoints,
                        newPoints: currentPoints + pointsEarned,
                        oldTotalSpent: currentTotalSpent,
                        newTotalSpent: newTotalSpent,
                        oldTierLevel: oldTierLevel,
                        newTierLevel: newTierLevel
                    });
                    
                    // Gửi voucher tự động nếu lên hạng (logic này sẽ được xử lý trong Wallet model hook)
                } else {
                    console.log(`⚠️ [TREATMENT COURSE PAYMENT] Wallet not found for user ${course.clientId}`);
                }
            } catch (walletError) {
                console.error('❌ [TREATMENT COURSE PAYMENT] Error updating wallet:', walletError);
                // Don't fail payment if wallet update fails
            }
        } else {
            console.log(`⚠️ [TREATMENT COURSE PAYMENT] Payment already exists, skipping wallet update to avoid double counting`);
        }
        
        console.log(`✅ [TREATMENT COURSE PAYMENT] Confirmed payment for treatment course ${id}:`, {
            courseId: id,
            totalAmount: totalAmount,
            paymentId: payment.id,
            paymentStatus: payment.status,
            paymentAmount: payment.amount
        });

        // Notify admins about completed payment (async, don't wait)
        try {
            const client = await db.User.findByPk(course.clientId);
            const clientName = client ? client.name : 'Khách hàng';
            const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
            
            notifyAdmins(
                'payment_received',
                'Thanh toán tiền mặt',
                `${clientName} đã thanh toán ${formatPrice(totalAmount)} bằng tiền mặt cho ${course.serviceName || 'liệu trình'}`,
                payment.id
            );
        } catch (notifError) {
            console.error('Error creating payment notification:', notifError);
            // Don't fail payment if notification fails
        }
        
        res.json({ course, payment, message: 'Payment confirmed successfully' });
    } catch (error) {
        console.error('Error confirming payment:', error);
        res.status(500).json({ message: 'Error confirming payment', error: error.message });
    }
});

// POST /api/treatment-courses/sync-payment-status - Đồng bộ paymentStatus từ TreatmentCourse sang tất cả appointments liên quan
router.post('/sync-payment-status', async (req, res) => {
    try {
        console.log('🔄 [SYNC PAYMENT STATUS] Starting sync for all treatment courses...');
        
        // Lấy tất cả treatment courses đã thanh toán
        const paidCourses = await db.TreatmentCourse.findAll({
            where: { paymentStatus: 'Paid' }
        });
        
        console.log(`📊 [SYNC PAYMENT STATUS] Found ${paidCourses.length} paid treatment courses`);
        
        let totalUpdated = 0;
        
        for (const course of paidCourses) {
            // Cách 1: Lấy appointments qua TreatmentSession
            const sessions = await db.TreatmentSession.findAll({
                where: { treatmentCourseId: course.id },
                attributes: ['appointmentId']
            });
            
            const appointmentIdsFromSessions = sessions
                .map(s => s.appointmentId)
                .filter(id => id !== null);
            
            // Cách 2: Lấy appointments qua bookingGroupId (fallback)
            const bookingGroupId = `group-${course.id}`;
            const appointmentsFromGroup = await db.Appointment.findAll({
                where: { bookingGroupId: bookingGroupId },
                attributes: ['id']
            });
            
            const appointmentIdsFromGroup = appointmentsFromGroup.map(apt => apt.id);
            
            // Kết hợp cả 2 cách và loại bỏ duplicates
            const allAppointmentIds = [...new Set([...appointmentIdsFromSessions, ...appointmentIdsFromGroup])];
            
            if (allAppointmentIds.length > 0) {
                // Cập nhật paymentStatus cho tất cả appointments liên quan
                const [updatedCount] = await db.Appointment.update(
                    { paymentStatus: 'Paid' },
                    { 
                        where: { 
                            id: { [Op.in]: allAppointmentIds },
                            paymentStatus: { [Op.ne]: 'Paid' } // Chỉ cập nhật những cái chưa Paid
                        }
                    }
                );
                
                if (updatedCount > 0) {
                    totalUpdated += updatedCount;
                    console.log(`✅ [SYNC PAYMENT STATUS] Updated ${updatedCount} appointments for treatment course ${course.id} (${appointmentIdsFromSessions.length} from sessions, ${appointmentIdsFromGroup.length} from bookingGroup)`);
                }
            }
        }
        
        console.log(`✅ [SYNC PAYMENT STATUS] Total appointments updated: ${totalUpdated}`);
        
        res.json({ 
            success: true, 
            message: `Đã đồng bộ paymentStatus cho ${totalUpdated} appointments`,
            totalUpdated 
        });
    } catch (error) {
        console.error('❌ [SYNC PAYMENT STATUS] Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Lỗi khi đồng bộ paymentStatus',
            error: error.message 
        });
    }
});

module.exports = router;
