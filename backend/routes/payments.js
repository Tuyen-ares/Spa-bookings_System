// backend/routes/payments.js
const express = require('express');
const router = express.Router();
const db = require('../config/database'); // Sequelize models
const { v4: uuidv4 } = require('uuid');
const vnpayConfig = require('../config/vnpay');
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

// Helper function to sync TreatmentCourse payment status and totalAmount from Payment
// Sử dụng transaction để đảm bảo tính nhất quán dữ liệu (best practice từ StackOverflow)
const syncTreatmentCourseFromPayment = async (appointmentId, paymentAmount) => {
    const transaction = await db.sequelize.transaction();
    try {
        console.log(`\n🔄 [SYNC TREATMENT COURSE] Starting sync for appointment ${appointmentId}, paymentAmount: ${paymentAmount}`);
        
        // Tìm TreatmentSession có appointmentId này
        const treatmentSession = await db.TreatmentSession.findOne({
            where: { appointmentId: appointmentId },
            transaction: transaction
        });
        
        if (!treatmentSession || !treatmentSession.treatmentCourseId) {
            console.log(`ℹ️ [SYNC TREATMENT COURSE] No treatment session found for appointment ${appointmentId} - appointment may not be part of a treatment course`);
            await transaction.rollback();
            return;
        }
        
        console.log(`✅ [SYNC TREATMENT COURSE] Found treatment session: ${treatmentSession.id}, treatmentCourseId: ${treatmentSession.treatmentCourseId}`);
        
        const treatmentCourse = await db.TreatmentCourse.findByPk(treatmentSession.treatmentCourseId, {
            transaction: transaction
        });
        
        if (!treatmentCourse) {
            console.log(`⚠️ [SYNC TREATMENT COURSE] Treatment course ${treatmentSession.treatmentCourseId} not found`);
            await transaction.rollback();
            return;
        }
        
        const amount = parseFloat(paymentAmount) || 0;
        const currentTotalAmount = treatmentCourse.totalAmount ? parseFloat(treatmentCourse.totalAmount) : null;
        const currentPaymentStatus = treatmentCourse.paymentStatus;
        
        console.log(`📊 [SYNC TREATMENT COURSE] Current state:`, {
            treatmentCourseId: treatmentCourse.id,
            currentTotalAmount: currentTotalAmount,
            currentPaymentStatus: currentPaymentStatus,
            newTotalAmount: amount,
            newPaymentStatus: 'Paid'
        });
        
        // Cập nhật payment status và totalAmount của treatment course
        const updateData = {
            paymentStatus: 'Paid'
        };
        
        // Cập nhật totalAmount từ payment amount (số tiền thực tế đã thanh toán)
        if (amount > 0) {
            // Luôn cập nhật totalAmount từ payment amount để đảm bảo đồng bộ
            updateData.totalAmount = amount;
            console.log(`💰 [SYNC TREATMENT COURSE] Will update: paymentStatus='Paid', totalAmount=${amount} VND (was: ${currentTotalAmount || 'null'})`);
        } else {
            console.log(`⚠️ [SYNC TREATMENT COURSE] Payment amount is 0 or invalid, skipping totalAmount update`);
        }
        
        // Cập nhật với transaction
        await treatmentCourse.update(updateData, { transaction: transaction });
        
        // QUAN TRỌNG: Đồng bộ paymentStatus cho TẤT CẢ appointments liên quan đến treatment course này
        // Cách tiếp cận: Tìm TẤT CẢ appointments bằng nhiều cách và cập nhật chúng
        try {
            const allAppointmentIds = new Set();
            
            // Cách 1: Tìm appointments qua TreatmentSession (chính xác nhất)
            const allSessions = await db.TreatmentSession.findAll({
                where: { treatmentCourseId: treatmentCourse.id },
                attributes: ['id', 'appointmentId', 'sessionNumber'],
                transaction: transaction
            });
            
            console.log(`📋 [SYNC TREATMENT COURSE] Found ${allSessions.length} sessions for treatment course ${treatmentCourse.id}`);
            
            allSessions.forEach(session => {
                if (session.appointmentId) {
                    allAppointmentIds.add(session.appointmentId);
                    console.log(`   - Session ${session.sessionNumber}: appointmentId = ${session.appointmentId}`);
                } else {
                    console.log(`   ⚠️ Session ${session.sessionNumber}: no appointmentId`);
                }
            });
            
            // Cách 2: Tìm appointments qua bookingGroupId (fallback - đảm bảo không bỏ sót)
            // bookingGroupId có thể có format: "group-xxx" hoặc "group-tc-xxx"
            const bookingGroupId1 = `group-${treatmentCourse.id}`;
            const bookingGroupId2 = `group-tc-${treatmentCourse.id}`;
            
            const appointmentsFromGroup = await db.Appointment.findAll({
                where: { 
                    bookingGroupId: { [Op.in]: [bookingGroupId1, bookingGroupId2] }
                },
                attributes: ['id'],
                transaction: transaction
            });
            
            console.log(`📋 [SYNC TREATMENT COURSE] Found ${appointmentsFromGroup.length} appointments via bookingGroupId (tried: ${bookingGroupId1}, ${bookingGroupId2})`);
            
            appointmentsFromGroup.forEach(apt => {
                allAppointmentIds.add(apt.id);
                console.log(`   - Appointment from bookingGroup: ${apt.id}`);
            });
            
            // Cách 3: Tìm appointments qua TreatmentCourse.userId và serviceName (fallback cuối cùng)
            // Nếu có appointments cùng userId, serviceName và date gần nhau, có thể cùng TreatmentCourse
            if (allAppointmentIds.size === 0) {
                console.log(`⚠️ [SYNC TREATMENT COURSE] No appointments found via sessions or bookingGroup, trying alternative method...`);
                
                // Lấy thông tin từ appointment đầu tiên (appointmentId được truyền vào)
                const firstAppointment = await db.Appointment.findByPk(appointmentId, {
                    attributes: ['userId', 'serviceName', 'bookingGroupId'],
                    transaction: transaction
                });
                
                if (firstAppointment && firstAppointment.bookingGroupId) {
                    // Nếu có bookingGroupId nhưng chưa tìm thấy, thử lại với điều kiện khác
                    // Có thể bookingGroupId có format khác, thử tìm với LIKE
                    const alternativeAppointments = await db.Appointment.findAll({
                        where: { 
                            bookingGroupId: { [Op.like]: `%${treatmentCourse.id}%` },
                            userId: firstAppointment.userId
                        },
                        attributes: ['id'],
                        transaction: transaction
                    });
                    
                    alternativeAppointments.forEach(apt => {
                        allAppointmentIds.add(apt.id);
                        console.log(`   - Alternative method found: ${apt.id}`);
                    });
                }
            }
            
            // Cập nhật TẤT CẢ appointments tìm được
            if (allAppointmentIds.size > 0) {
                const appointmentIdsArray = Array.from(allAppointmentIds);
                console.log(`🔄 [SYNC TREATMENT COURSE] Updating ${appointmentIdsArray.length} appointments to paymentStatus='Paid'`);
                console.log(`   Appointment IDs: ${appointmentIdsArray.join(', ')}`);
                
                const [updatedCount] = await db.Appointment.update(
                    { paymentStatus: 'Paid' },
                    { 
                        where: { id: { [Op.in]: appointmentIdsArray } },
                        transaction: transaction
                    }
                );
                
                console.log(`✅ [SYNC TREATMENT COURSE] Successfully updated ${updatedCount} appointments to paymentStatus='Paid'`);
                
                // Verify: Kiểm tra lại sau khi update
                const verifyAppointments = await db.Appointment.findAll({
                    where: { id: { [Op.in]: appointmentIdsArray } },
                    attributes: ['id', 'paymentStatus'],
                    transaction: transaction
                });
                
                verifyAppointments.forEach(apt => {
                    if (apt.paymentStatus !== 'Paid') {
                        console.error(`❌ [SYNC TREATMENT COURSE] VERIFY FAILED: Appointment ${apt.id} still has paymentStatus='${apt.paymentStatus}'`);
                    } else {
                        console.log(`✅ [SYNC TREATMENT COURSE] VERIFY OK: Appointment ${apt.id} has paymentStatus='Paid'`);
                    }
                });
            } else {
                console.log(`⚠️ [SYNC TREATMENT COURSE] No appointments found to sync for treatment course ${treatmentCourse.id}`);
            }
        } catch (syncError) {
            console.error('❌ [SYNC TREATMENT COURSE] Error synchronizing payment status to appointments:', syncError);
            console.error('   Error stack:', syncError.stack);
            // Rollback transaction nếu sync appointments thất bại
            await transaction.rollback();
            throw syncError;
        }
        
        // Commit transaction
        await transaction.commit();
        
        // Verify update
        await treatmentCourse.reload();
        console.log(`✅ [SYNC TREATMENT COURSE] Treatment course ${treatmentCourse.id} updated successfully:`, {
            paymentStatus: treatmentCourse.paymentStatus,
            totalAmount: treatmentCourse.totalAmount
        });
    } catch (error) {
        await transaction.rollback();
        console.error('❌ [SYNC TREATMENT COURSE] Error syncing treatment course from payment:', error);
        console.error('Error stack:', error.stack);
        // Không throw error - không fail payment nếu sync treatment course thất bại
    }
};

// GET /api/payments - Get all payments (Admin)
router.get('/', async (req, res) => {
    try {
        // Try to include User association, but handle errors gracefully
        let payments;
        try {
            payments = await db.Payment.findAll({
                order: [['date', 'DESC']],
                // Include User association to get user name
                include: [{
                    model: db.User,
                    as: 'ClientForPayment',
                    attributes: ['id', 'name', 'email', 'phone', 'profilePictureUrl'],
                    required: false
                }]
            });
        } catch (includeError) {
            console.warn('Error including User association, fetching without association:', includeError.message);
            // Fallback: fetch without association
            payments = await db.Payment.findAll({
                order: [['date', 'DESC']]
            });
        }
        
        // Format payments to ensure userId is included
        const formattedPayments = payments.map(payment => {
            const paymentData = payment.toJSON();
            // If User association exists, add userName
            if (paymentData.ClientForPayment) {
                paymentData.userName = paymentData.ClientForPayment.name;
                // Ensure userId is set from association if missing
                if (!paymentData.userId && paymentData.ClientForPayment.id) {
                    paymentData.userId = paymentData.ClientForPayment.id;
                }
            }
            // Ensure all required fields have default values
            if (!paymentData.transactionId) {
                paymentData.transactionId = `TXN-${paymentData.id}`;
            }
            if (!paymentData.status) {
                paymentData.status = 'Pending';
            }
            if (!paymentData.method) {
                paymentData.method = 'Cash';
            }
            // Log warning if userId is still missing
            if (!paymentData.userId) {
                console.warn('Payment missing userId:', paymentData.id);
            }
            return paymentData;
        });
        
        res.json(formattedPayments);
    } catch (error) {
        console.error('Error fetching payments:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

// GET /api/payments/user/:userId - Get payments for a specific user
router.get('/user/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const userPayments = await db.Payment.findAll({ where: { userId } });
        res.json(userPayments);
    } catch (error) {
        console.error('Error fetching user payments:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/payments - Create a new payment
router.post('/', async (req, res) => {
    const newPaymentData = req.body;
    if (!newPaymentData.userId || !newPaymentData.amount || !newPaymentData.method) {
        return res.status(400).json({ message: 'Missing required payment data' });
    }

    try {
        const createdPayment = await db.Payment.create({
            id: `pay-${uuidv4()}`,
            transactionId: `TXN-${uuidv4().substring(0, 8).toUpperCase()}`, // Generate a mock transaction ID
            status: newPaymentData.status || 'Pending', // Default to Pending, only Completed when payment is confirmed
            date: new Date().toISOString(),
            ...newPaymentData,
        });
        
        // NOTE: Không cộng điểm ở đây vì đây là khi tạo payment (đặt lịch), chưa thanh toán
        // Điểm chỉ được cộng khi:
        // 1. VNPay payment thành công (IPN/return handler)
        // 2. Admin xác nhận thanh toán (PUT /api/payments/:id/complete)
        
        res.status(201).json(createdPayment);

        // KHÔNG tạo thông báo ở đây vì đây chỉ là tạo payment record (đặt lịch), chưa thanh toán
        // Thông báo chỉ được tạo khi:
        // 1. Admin xác nhận thanh toán (PUT /api/payments/:id/complete hoặc PUT /api/treatment-courses/:id/confirm-payment)
        // 2. VNPay payment thành công (VNPay return/IPN handler)
        // 3. Payment status = 'Completed'
    } catch (error) {
        console.error('Error creating payment:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// PUT /api/payments/:id - Update a payment (e.g., status to refunded)
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const updatedPaymentData = req.body;
    try {
        const payment = await db.Payment.findByPk(id);
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        // Lưu oldStatus trước khi update để kiểm tra xem có tạo thông báo không
        const oldStatus = payment.status;

        await payment.update(updatedPaymentData);

        // CHỈ tạo thông báo khi status thực sự chuyển từ 'Pending' sang 'Completed'
        // KHÔNG tạo thông báo nếu payment status vẫn là 'Pending' hoặc đã là 'Completed' từ trước
        if (oldStatus === 'Pending' && updatedPaymentData.status === 'Completed' && payment.status === 'Completed') {
            try {
                const user = await db.User.findByPk(payment.userId);
                const userName = user ? user.name : 'Khách hàng';
                const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
                const serviceName = payment.serviceName || 'dịch vụ';
                
                console.log(`🔔 [UPDATE PAYMENT] Creating notification - Payment status changed from 'Pending' to 'Completed'`);
                notifyAdmins(
                    'payment_received',
                    'Thanh toán tiền mặt',
                    `${userName} đã thanh toán ${formatPrice(payment.amount)} bằng tiền mặt cho ${serviceName}`,
                    payment.id
                );
            } catch (notifError) {
                console.error('Error creating payment notification:', notifError);
                // Don't fail payment if notification fails
            }
        } else {
            console.log(`ℹ️ [UPDATE PAYMENT] Skipped notification - Payment oldStatus: ${oldStatus || 'null'}, currentStatus: ${payment.status || 'null'}`);
        }

        res.json(payment);
    } catch (error) {
        console.error('Error updating payment:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// PUT /api/payments/:id/complete - Mark a payment as complete
router.put('/:id/complete', async (req, res) => {
    const { id } = req.params;
    try {
        const payment = await db.Payment.findByPk(id);
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }
        if (payment.status === 'Completed') {
            return res.status(400).json({ message: 'Payment has already been completed.' });
        }

        const oldStatus = payment.status;
        await payment.update({ status: 'Completed', date: new Date().toISOString() });
        
        // Update wallet: add points (1000 VND = 1 point) and update totalSpent
        // CHỈ cộng điểm khi status chuyển từ Pending/Unpaid sang Completed (tránh cộng điểm 2 lần)
        if (oldStatus !== 'Completed' && payment.userId) {
            try {
                const wallet = await db.Wallet.findOne({ where: { userId: payment.userId } });
                if (wallet) {
                    const amount = parseFloat(payment.amount) || 0;
                    const pointsEarned = Math.floor(amount / 1000);
                    const currentPoints = wallet.points || 0;
                    const currentTotalSpent = parseFloat(wallet.totalSpent?.toString() || '0');
                    
                    await wallet.update({
                        points: currentPoints + pointsEarned,
                        totalSpent: currentTotalSpent + amount,
                        lastUpdated: new Date()
                    });

                    // Note: Points history is derived from Payment records, not stored separately
                    console.log(`✅ User ${payment.userId} earned ${pointsEarned} points from payment`);

                    // Lưu tierLevel cũ để kiểm tra lên hạng
                    const oldTierLevel = wallet.tierLevel;
                    
                    // Cập nhật tier level dựa trên totalSpent mới
                    const { calculateTierInfo } = require('../utils/tierUtils');
                    const newTotalSpent = currentTotalSpent + amount;
                    const tierInfo = calculateTierInfo(newTotalSpent);
                    const newTierLevel = tierInfo.currentTier.level;
                    
                    await wallet.update({ tierLevel: newTierLevel });

                    console.log(`✅ [COMPLETE PAYMENT] Wallet updated: +${pointsEarned} points, total: ${currentPoints + pointsEarned} points, totalSpent: ${newTotalSpent}, tierLevel: ${oldTierLevel} → ${newTierLevel}`);
                    console.log(`   Payment ID: ${payment.id}, Amount: ${amount} VND, Old Status: ${oldStatus}`);
                    
                    // Gửi voucher tự động nếu lên hạng (logic này sẽ được xử lý trong Wallet model hook)
                }
            } catch (walletError) {
                console.error('Error updating wallet:', walletError);
                // Don't fail payment if wallet update fails
            }
        } else if (oldStatus === 'Completed') {
            console.log(`⚠️ [COMPLETE PAYMENT] Payment ${payment.id} already completed, skipping wallet update`);
        }

        // Notify admins about completed payment (async, don't wait)
        // QUAN TRỌNG: Chỉ tạo thông báo khi payment status thực sự chuyển từ 'Pending' sang 'Completed'
        // KHÔNG tạo thông báo nếu payment đã là 'Completed' từ trước
        if (oldStatus === 'Pending' && payment.status === 'Completed') {
            try {
                const user = await db.User.findByPk(payment.userId);
                const userName = user ? user.name : 'Khách hàng';
                const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
                const serviceName = payment.serviceName || 'dịch vụ';
                
                console.log(`🔔 [COMPLETE PAYMENT] Creating notification - Payment status changed from 'Pending' to 'Completed'`);
                notifyAdmins(
                    'payment_received',
                    'Thanh toán tiền mặt',
                    `${userName} đã thanh toán ${formatPrice(payment.amount)} bằng tiền mặt cho ${serviceName}`,
                    payment.id
                );
            } catch (notifError) {
                console.error('Error creating payment notification:', notifError);
                // Don't fail payment if notification fails
            }
        } else {
            console.log(`ℹ️ [COMPLETE PAYMENT] Skipped notification - Payment oldStatus: ${oldStatus || 'null'}, currentStatus: ${payment.status || 'null'}`);
        }
        
        res.json(payment);
    } catch (error) {
        console.error('Error completing payment:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// DELETE /api/payments/:id - Delete a payment (Admin only, for Cash payments or Failed payments)
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const payment = await db.Payment.findByPk(id);
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }
        
        // Only allow deletion of Cash payments or Failed payments
        if (payment.method !== 'Cash' && payment.status !== 'Failed') {
            return res.status(400).json({ message: 'Only Cash payments or Failed payments can be deleted' });
        }

        await payment.destroy();
        res.json({ message: 'Payment deleted successfully' });
    } catch (error) {
        console.error('Error deleting payment:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/payments/process - Process payment (for VNPay, redirect to payment URL)
router.post('/process', async (req, res) => {
    const { appointmentId, method, amount } = req.body;
    
    if (!appointmentId || !method || !amount) {
        return res.status(400).json({ message: 'Missing required payment data' });
    }

    try {
        // Find appointment
        const appointment = await db.Appointment.findByPk(appointmentId);
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

    if (method === 'VNPay') {
            try {
                // Create payment record with Pending status
                const paymentId = `pay-${uuidv4()}`;
                const orderId = `ORDER-${Date.now()}-${paymentId.substring(0, 8).toUpperCase()}`;
                
                const payment = await db.Payment.create({
                    id: paymentId,
                    appointmentId: appointmentId,
                    userId: appointment.userId,
                    serviceName: appointment.serviceName,
                    amount: amount,
                    method: 'VNPay',
                    status: 'Pending',
                    date: new Date().toISOString(),
                    transactionId: orderId,
                });

                // Get client IP address
                const clientIp = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || '127.0.0.1';
                
                // Clean service name for OrderInfo
                const serviceName = (appointment.serviceName || 'Dich vu').substring(0, 50);
                
                // Debug: Log amount received from frontend
                console.log('=== Payment Process Debug ===');
                console.log('Amount received from frontend:', amount);
                console.log('Amount type:', typeof amount);
                console.log('Appointment ID:', appointmentId);
                console.log('Service Name:', serviceName);
                console.log('=== End Payment Process Debug ===');
                
                // Create VNPay payment URL using vnpay library
                console.log('=== Creating VNPay Payment URL ===');
                console.log('Order ID:', orderId);
                console.log('Amount:', amount, 'VND');
                console.log('Service Name:', serviceName);
                console.log('Client IP:', clientIp);
                console.log('Return URL:', vnpayConfig.vnp_ReturnUrl);
                console.log('IPN URL:', vnpayConfig.vnp_IpnUrl);
                
                let paymentUrl;
                try {
                    paymentUrl = vnpayConfig.createPaymentUrl(
                        orderId,
                        amount,
                        serviceName,
                        vnpayConfig.ProductCode.Other, // Use ProductCode from library
                        clientIp
                    );
                    
                    console.log('✅ VNPay Payment URL created successfully');
                    console.log('Payment URL length:', paymentUrl ? paymentUrl.length : 0);
                    console.log('Payment URL (first 200 chars):', paymentUrl ? paymentUrl.substring(0, 200) + '...' : 'NULL');
                } catch (createUrlError) {
                    console.error('❌ Error creating VNPay payment URL:', createUrlError);
                    console.error('Error message:', createUrlError.message);
                    console.error('Error stack:', createUrlError.stack);
                    throw new Error(`Failed to create VNPay payment URL: ${createUrlError.message}`);
                }
                
                if (!paymentUrl || paymentUrl.length === 0) {
                    console.error('❌ Payment URL is empty or null');
                    throw new Error('Failed to create VNPay payment URL: URL is empty');
                }

                // Return payment URL for frontend to redirect
                // IMPORTANT: Only return paymentUrl for VNPay, NOT success flag
                res.json({ 
                    paymentUrl: paymentUrl,
                    paymentId: payment.id,
                    orderId: orderId
                });
            } catch (error) {
                console.error('Error creating VNPay payment:', error);
                console.error('Error stack:', error.stack);
                res.status(500).json({ 
                    message: 'Failed to create VNPay payment URL',
                    error: error.message,
                    details: process.env.NODE_ENV === 'development' ? error.stack : undefined
                });
            }
    } else if (method === 'Cash') {
            // Cash payment - just mark as completed
            try {
                const payment = await db.Payment.create({
                    id: `pay-${uuidv4()}`,
                    appointmentId: appointmentId,
                    userId: appointment.userId,
                    serviceName: appointment.serviceName,
                    amount: amount,
                    method: 'Cash',
                    status: 'Pending', // Cash payments start as Pending, require admin confirmation
                    date: new Date().toISOString(),
                    transactionId: `CASH-${uuidv4().substring(0, 8).toUpperCase()}`,
                });

                console.log('Cash payment created:', payment.id);

                // Update appointment - keep payment status as Unpaid until admin confirms payment
                await appointment.update({ 
                    paymentStatus: 'Unpaid', // Will be updated to 'Paid' after admin confirms
                    status: 'pending' // Set to pending to await admin confirmation
                });

                console.log('Appointment payment status updated to Unpaid, status set to pending (awaiting admin confirmation)');
                
                // If this appointment has a bookingGroupId, update all appointments in the same group
                if (appointment.bookingGroupId) {
                    await db.Appointment.update(
                        { 
                            paymentStatus: 'Unpaid', // Will be updated to 'Paid' after admin confirms
                            status: 'pending'
                        },
                        { 
                            where: { bookingGroupId: appointment.bookingGroupId }
                        }
                    );
                    console.log(`Updated all appointments in booking group ${appointment.bookingGroupId} to Unpaid and pending status`);
                }

                res.json({ payment, success: true });

                // KHÔNG tạo thông báo ở đây vì payment status là 'Pending', chưa thanh toán
                // Thông báo chỉ được tạo khi admin xác nhận thanh toán (PUT /api/payments/:id/complete)
                // hoặc khi payment status chuyển sang 'Completed'
            } catch (cashError) {
                console.error('Error processing cash payment:', cashError);
                console.error('Error stack:', cashError.stack);
                throw cashError; // Re-throw to be caught by outer catch
            }
        } else {
            return res.status(400).json({ message: 'Unsupported payment method' });
        }
    } catch (error) {
        console.error('Error processing payment:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/payments/vnpay-return - VNPay return URL (user returns from VNPay)
router.get('/vnpay-return', async (req, res) => {
    const vnp_Params = req.query;
    
    console.log('=== VNPay Return URL Called ===');
    console.log('VNPay Params:', JSON.stringify(vnp_Params, null, 2));
    
    try {
        // Verify payment response using vnpay library
        const verifyResult = vnpayConfig.verifyPaymentResponse(vnp_Params);
        
        console.log('Verify Result:', verifyResult);
        
        if (!verifyResult || !verifyResult.isSuccess) {
            console.error('VNPay signature verification failed:', verifyResult);
            
            // Try to find payment by orderId if available
            const orderId = vnp_Params['vnp_TxnRef'];
            if (orderId) {
                const payment = await db.Payment.findOne({ 
                    where: { transactionId: orderId } 
                });
                
                if (payment) {
                    await payment.update({ status: 'Failed' });
                    
                    // Update appointment status to 'cancelled'
                    if (payment.appointmentId) {
                        const appointment = await db.Appointment.findByPk(payment.appointmentId);
                        if (appointment) {
                            await appointment.update({ 
                                status: 'cancelled',
                                paymentStatus: 'Unpaid'
                            });
                            
                            // Update booking group if exists
                            if (appointment.bookingGroupId) {
                                await db.Appointment.update(
                                    { 
                                        status: 'cancelled',
                                        paymentStatus: 'Unpaid'
                                    },
                                    { 
                                        where: { bookingGroupId: appointment.bookingGroupId }
                                    }
                                );
                            }
                        }
                    }
                }
            }
            
            // Note: Frontend uses HashRouter, so URL needs # prefix
            const failedUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/#/payment/failed?message=Invalid signature`;
            console.log('Redirecting to:', failedUrl);
            return res.redirect(failedUrl);
        }

        const orderId = vnp_Params['vnp_TxnRef'];
        const responseCode = vnp_Params['vnp_ResponseCode'];
        const transactionId = vnp_Params['vnp_TransactionNo'];
        // Note: If vnpay library doesn't multiply by 100, then vnp_Amount is already in VND
        // Otherwise, divide by 100 to convert from cents to VND
        const vnp_Amount = vnp_Params['vnp_Amount'];
        const amount = parseInt(vnp_Amount);
        
        console.log('Order ID:', orderId);
        console.log('Response Code:', responseCode);
        console.log('Transaction ID:', transactionId);
        console.log('Amount from VNPay:', vnp_Amount);
        console.log('Amount parsed:', amount);

        // Find payment by transactionId (orderId)
        const payment = await db.Payment.findOne({ 
            where: { transactionId: orderId } 
        });

        console.log('Payment found:', payment ? payment.id : 'NOT FOUND');

        if (!payment) {
            console.error('Payment not found for orderId:', orderId);
            // Note: Frontend uses HashRouter, so URL needs # prefix
            const failedUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/#/payment/failed?message=Payment not found`;
            console.log('Redirecting to:', failedUrl);
            return res.redirect(failedUrl);
        }

        if (responseCode === '00') {
            // Payment successful
            console.log('Payment successful! Updating payment status...');
            
            const oldStatus = payment.status;
            await payment.update({ 
                status: 'Completed',
                transactionId: transactionId || orderId
            });

            console.log('Payment updated to Completed');

            // Update wallet: add points (1000 VND = 1 point) and update totalSpent
            // CHỈ cộng điểm khi status chuyển từ Pending/Unpaid sang Completed (tránh cộng điểm 2 lần)
            if (oldStatus !== 'Completed' && payment.userId) {
                try {
                    const wallet = await db.Wallet.findOne({ where: { userId: payment.userId } });
                    if (wallet) {
                        const amount = parseFloat(payment.amount) || 0;
                        const pointsEarned = Math.floor(amount / 1000);
                        const currentPoints = wallet.points || 0;
                        const currentTotalSpent = parseFloat(wallet.totalSpent?.toString() || '0');
                        
                        await wallet.update({
                            points: currentPoints + pointsEarned,
                            totalSpent: currentTotalSpent + amount,
                            lastUpdated: new Date()
                        });

                        // Note: Points history is derived from Payment records, not stored separately
                        console.log(`✅ User ${payment.userId} earned ${pointsEarned} points from payment`);

                        console.log(`✅ [VNPay RETURN] Wallet updated: +${pointsEarned} points, total: ${currentPoints + pointsEarned} points`);
                        console.log(`   Payment ID: ${payment.id}, Amount: ${amount} VND, Old Status: ${oldStatus}`);
                    }
                } catch (walletError) {
                    console.error('Error updating wallet:', walletError);
                    // Don't fail payment if wallet update fails
                }
            } else if (oldStatus === 'Completed') {
                console.log(`⚠️ [VNPay RETURN] Payment ${payment.id} already completed, skipping wallet update`);
            }

            // Update appointment payment status and set status to 'pending' (awaiting admin confirmation)
            // Also update all appointments in the same booking group
            if (payment.appointmentId) {
                console.log(`\n🔄 [VNPay RETURN] Processing appointment ${payment.appointmentId} for payment ${payment.id}`);
                console.log(`   Payment amount: ${payment.amount} VND`);
                
                const appointment = await db.Appointment.findByPk(payment.appointmentId);
                if (appointment) {
                    // Update the appointment that has this payment
                    await appointment.update({ 
                        paymentStatus: 'Paid',
                        status: 'pending' // Set to pending to await admin confirmation
                    });
                    console.log('✅ [VNPay RETURN] Appointment payment status updated to Paid, status set to pending (awaiting confirmation)');
                    
                    // QUAN TRỌNG: Đồng bộ payment status và totalAmount với TreatmentCourse TRƯỚC
                    // Điều này sẽ cập nhật TreatmentCourse và tất cả appointments liên quan
                    console.log(`\n🔄 [VNPay RETURN] Calling syncTreatmentCourseFromPayment for appointment ${appointment.id}, payment amount: ${payment.amount}`);
                    await syncTreatmentCourseFromPayment(appointment.id, payment.amount);
                    console.log(`✅ [VNPay RETURN] Completed syncTreatmentCourseFromPayment\n`);
                    
                    // Nếu appointment có bookingGroupId, đảm bảo tất cả appointments trong group được cập nhật
                    // (syncTreatmentCourseFromPayment đã cập nhật rồi, nhưng đảm bảo chắc chắn)
                    if (appointment.bookingGroupId) {
                        const updatedCount = await db.Appointment.update(
                            { 
                                paymentStatus: 'Paid'
                            },
                            { 
                                where: { bookingGroupId: appointment.bookingGroupId }
                            }
                        );
                        console.log(`✅ [VNPay RETURN] Double-check: Updated ${updatedCount[0]} appointments in booking group ${appointment.bookingGroupId} to Paid status`);
                    }
                    
                    // Record promotion usage if appointment has promotionId
                    // NOTE: For redeemed vouchers, the PromotionUsage is already created and linked when appointment is created
                    // This logic is only for public vouchers that haven't been tracked yet
                    if (appointment.promotionId && payment.userId) {
                        const existingUsage = await db.PromotionUsage.findOne({
                            where: {
                                userId: payment.userId,
                                promotionId: appointment.promotionId,
                                appointmentId: appointment.id
                            }
                        });
                        
                        if (!existingUsage) {
                            // Check if this is a public voucher (not a redeemed voucher)
                            // Redeemed vouchers already have PromotionUsage created when appointment is created
                            const promotion = await db.Promotion.findByPk(appointment.promotionId);
                            const isPublic = promotion && (promotion.isPublic === true || promotion.isPublic === 1 || promotion.isPublic === '1');
                            
                            if (isPublic) {
                                // Only create PromotionUsage for public vouchers
                                await db.PromotionUsage.create({
                                    id: `promo-usage-${uuidv4()}`,
                                    userId: payment.userId,
                                    promotionId: appointment.promotionId,
                                    appointmentId: appointment.id,
                                    serviceId: appointment.serviceId,
                                });
                                console.log(`✅ [VNPay RETURN] Recorded promotion usage for public promotion ${appointment.promotionId}`);
                            } else {
                                console.log(`ℹ️ [VNPay RETURN] Skipping PromotionUsage creation for redeemed voucher ${appointment.promotionId} - already handled during appointment creation`);
                            }
                        } else {
                            console.log(`ℹ️ [VNPay RETURN] PromotionUsage already exists for promotion ${appointment.promotionId} and appointment ${appointment.id}`);
                        }
                    }
                } else {
                    console.error(`❌ [VNPay RETURN] Appointment ${payment.appointmentId} not found!`);
                }
            } else {
                console.log(`ℹ️ [VNPay RETURN] Payment ${payment.id} has no appointmentId, skipping appointment and treatment course sync`);
            }

            // Note: Frontend uses HashRouter, so URL needs # prefix
            const successUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/#/payment/success?paymentId=${payment.id}`;
            console.log('Payment successful! Redirecting to:', successUrl);
            
            // Notify admins about VNPay payment (async, don't wait)
            if (payment.appointmentId) {
                const appointment = await db.Appointment.findByPk(payment.appointmentId);
                if (appointment) {
                    const user = await db.User.findByPk(appointment.userId);
                    const userName = user ? user.name : 'Khách hàng';
                    const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
                    notifyAdmins(
                        'payment_received',
                        'Thanh toán VNPay thành công',
                        `${userName} đã thanh toán ${formatPrice(amount)} qua VNPay cho ${appointment.serviceName}`,
                        payment.id
                    );
                }
            }
            
            return res.redirect(successUrl);
        } else {
            // Payment failed or cancelled by user
            console.log('Payment failed or cancelled with response code:', responseCode);
            await payment.update({ status: 'Failed' });
            
            // Update appointment status to 'cancelled' when payment fails
            if (payment.appointmentId) {
                const appointment = await db.Appointment.findByPk(payment.appointmentId);
                if (appointment) {
                    // Update the appointment that has this payment
                    await appointment.update({ 
                        status: 'cancelled',
                        paymentStatus: 'Unpaid'
                    });
                    console.log('Appointment status updated to cancelled due to payment failure');
                    
                    // If this appointment has a bookingGroupId, update all appointments in the same group
                    if (appointment.bookingGroupId) {
                        await db.Appointment.update(
                            { 
                                status: 'cancelled',
                                paymentStatus: 'Unpaid'
                            },
                            { 
                                where: { bookingGroupId: appointment.bookingGroupId }
                            }
                        );
                        console.log(`Updated all appointments in booking group ${appointment.bookingGroupId} to cancelled status`);
                    }
                }
            }
            
            // Note: Frontend uses HashRouter, so URL needs # prefix
            const failedUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/#/payment/failed?message=Payment failed&paymentId=${payment.id}`;
            console.log('Redirecting to:', failedUrl);
            return res.redirect(failedUrl);
        }
    } catch (error) {
        console.error('Error processing VNPay return:', error);
        console.error('Error stack:', error.stack);
        // Note: Frontend uses HashRouter, so URL needs # prefix
        const failedUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/#/payment/failed?message=Server error`;
        console.log('Redirecting to:', failedUrl);
        return res.redirect(failedUrl);
    }
});

// POST /api/payments/vnpay-ipn - VNPay IPN (Instant Payment Notification)
router.post('/vnpay-ipn', async (req, res) => {
    // VNPay sends IPN via POST with form data or query string
    const vnp_Params = req.method === 'POST' ? (req.body || req.query) : req.query;
    
    try {
        // Verify IPN using vnpay library
        const verifyResult = vnpayConfig.verifyIpn(vnp_Params);
        
        if (!verifyResult || !verifyResult.isSuccess) {
            console.error('VNPay IPN signature verification failed:', verifyResult);
            return res.status(400).json({ RspCode: '97', Message: 'Invalid signature' });
        }

        const orderId = vnp_Params['vnp_TxnRef'];
        const responseCode = vnp_Params['vnp_ResponseCode'];
        const transactionId = vnp_Params['vnp_TransactionNo'];

        // Find payment by transactionId (orderId)
        const payment = await db.Payment.findOne({ 
            where: { transactionId: orderId } 
        });

        if (!payment) {
            return res.status(400).json({ RspCode: '01', Message: 'Payment not found' });
        }

        if (payment.status === 'Completed') {
            return res.json({ RspCode: '00', Message: 'Payment already processed' });
        }

        if (responseCode === '00') {
            // Payment successful
            const oldStatus = payment.status;
            await payment.update({ 
                status: 'Completed',
                transactionId: transactionId || orderId
            });

            // Update wallet: add points (1000 VND = 1 point) and update totalSpent
            // CHỈ cộng điểm khi status chuyển từ Pending/Unpaid sang Completed (tránh cộng điểm 2 lần)
            if (oldStatus !== 'Completed' && payment.userId) {
                try {
                    const wallet = await db.Wallet.findOne({ where: { userId: payment.userId } });
                    if (wallet) {
                        const amount = parseFloat(payment.amount) || 0;
                        const pointsEarned = Math.floor(amount / 1000);
                        const currentPoints = wallet.points || 0;
                        const currentTotalSpent = parseFloat(wallet.totalSpent?.toString() || '0');
                        
                        const newTotalSpent = currentTotalSpent + amount;
                        await wallet.update({
                            points: currentPoints + pointsEarned,
                            totalSpent: newTotalSpent,
                            lastUpdated: new Date()
                        });

                        // Cập nhật tier level dựa trên totalSpent mới (hook sẽ tự động sync, nhưng đảm bảo chắc chắn)
                        const { calculateTierInfo } = require('../utils/tierUtils');
                        const tierInfo = calculateTierInfo(newTotalSpent);
                        await wallet.update({ tierLevel: tierInfo.currentTier.level });

                        console.log(`✅ [VNPay IPN] Wallet updated: +${pointsEarned} points, total: ${currentPoints + pointsEarned} points, totalSpent: ${newTotalSpent}, tierLevel: ${tierInfo.currentTier.level}`);
                        console.log(`   Payment ID: ${payment.id}, Amount: ${amount} VND, Old Status: ${oldStatus}`);
                    }
                } catch (walletError) {
                    console.error('IPN: Error updating wallet:', walletError);
                    // Don't fail payment if wallet update fails
                }
            } else if (oldStatus === 'Completed') {
                console.log(`⚠️ [VNPay IPN] Payment ${payment.id} already completed, skipping wallet update`);
            }

            // Update appointment payment status and set status to 'pending' (awaiting admin confirmation)
            // Also update all appointments in the same booking group
            if (payment.appointmentId) {
                console.log(`\n🔄 [VNPay IPN] Processing appointment ${payment.appointmentId} for payment ${payment.id}`);
                console.log(`   Payment amount: ${payment.amount} VND`);
                
                const appointment = await db.Appointment.findByPk(payment.appointmentId);
                if (appointment) {
                    // Update the appointment that has this payment
                    await appointment.update({ 
                        paymentStatus: 'Paid',
                        status: 'pending' // Set to pending to await admin confirmation
                    });
                    console.log('✅ [VNPay IPN] Appointment payment status updated to Paid, status set to pending (awaiting confirmation)');
                    
                    // QUAN TRỌNG: Đồng bộ payment status và totalAmount với TreatmentCourse TRƯỚC
                    // Điều này sẽ cập nhật TreatmentCourse và tất cả appointments liên quan
                    console.log(`\n🔄 [VNPay IPN] Calling syncTreatmentCourseFromPayment for appointment ${appointment.id}, payment amount: ${payment.amount}`);
                    await syncTreatmentCourseFromPayment(appointment.id, payment.amount);
                    console.log(`✅ [VNPay IPN] Completed syncTreatmentCourseFromPayment\n`);
                    
                    // Nếu appointment có bookingGroupId, đảm bảo tất cả appointments trong group được cập nhật
                    // (syncTreatmentCourseFromPayment đã cập nhật rồi, nhưng đảm bảo chắc chắn)
                    if (appointment.bookingGroupId) {
                        const updatedCount = await db.Appointment.update(
                            { 
                                paymentStatus: 'Paid'
                            },
                            { 
                                where: { bookingGroupId: appointment.bookingGroupId }
                            }
                        );
                        console.log(`✅ [VNPay IPN] Double-check: Updated ${updatedCount[0]} appointments in booking group ${appointment.bookingGroupId} to Paid status`);
                    }
                } else {
                    console.error(`❌ [VNPay IPN] Appointment ${payment.appointmentId} not found!`);
                }
            } else {
                console.log(`ℹ️ [VNPay IPN] Payment ${payment.id} has no appointmentId, skipping appointment and treatment course sync`);
            }

            return res.json({ RspCode: '00', Message: 'Success' });
        } else {
            return res.json({ RspCode: responseCode, Message: 'Payment failed' });
        }
    } catch (error) {
        console.error('Error processing VNPay IPN:', error);
        return res.status(500).json({ RspCode: '99', Message: 'Server error' });
    }
});


module.exports = router;