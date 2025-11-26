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
                                paymentStatus: payment.status === 'Completed' ? 'Paid' : 'Pending'
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
                            paymentStatus: payment.status === 'Completed' ? 'Paid' : 'Pending'
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
            const sessions = await db.TreatmentSession.findAll({
                where: { treatmentCourseId: course.id },
                attributes: ['appointmentId']
            });
            
            const appointmentIds = sessions
                .map(s => s.appointmentId)
                .filter(id => id !== null);
            
            if (appointmentIds.length > 0) {
                await db.Appointment.update(
                    { paymentStatus: 'Paid' },
                    { where: { id: { [Op.in]: appointmentIds } } }
                );
                console.log(`✅ Synchronized payment status to 'Paid' for ${appointmentIds.length} appointments`);
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

                    // Cập nhật tier level dựa trên totalSpent mới
                    const { calculateTierInfo } = require('../utils/tierUtils');
                    const tierInfo = calculateTierInfo(newTotalSpent);
                    await wallet.update({ tierLevel: tierInfo.currentTier.level });

                    console.log(`✅ [TREATMENT COURSE PAYMENT] Wallet updated:`, {
                        pointsEarned: pointsEarned,
                        oldPoints: currentPoints,
                        newPoints: currentPoints + pointsEarned,
                        oldTotalSpent: currentTotalSpent,
                        newTotalSpent: newTotalSpent,
                        oldTierLevel: wallet.tierLevel,
                        newTierLevel: tierInfo.currentTier.level
                    });
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
        
        res.json({ course, payment, message: 'Payment confirmed successfully' });
    } catch (error) {
        console.error('Error confirming payment:', error);
        res.status(500).json({ message: 'Error confirming payment', error: error.message });
    }
});

module.exports = router;
