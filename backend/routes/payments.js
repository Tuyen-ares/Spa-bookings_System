// backend/routes/payments.js
const express = require('express');
const router = express.Router();
const db = require('../config/database'); // Sequelize models
const { v4: uuidv4 } = require('uuid');
const vnpayConfig = require('../config/vnpay');

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
            status: 'Completed', // Default to completed for new payments via this API
            date: new Date().toISOString(),
            ...newPaymentData,
        });
        res.status(201).json(createdPayment);
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

        await payment.update(updatedPaymentData);
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

        await payment.update({ status: 'Completed', date: new Date().toISOString() });
        res.json(payment);
    } catch (error) {
        console.error('Error completing payment:', error);
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
                    bookingId: appointmentId,
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
                const paymentUrl = await vnpayConfig.createPaymentUrl(
                    orderId,
                    amount,
                    serviceName,
                    vnpayConfig.ProductCode.Other, // Use ProductCode from library
                    clientIp
                );
                
                console.log('VNPay Payment URL created for order:', orderId);
                console.log('Amount sent to VNPay:', amount, 'VND');
                console.log('Payment URL (first 200 chars):', paymentUrl.substring(0, 200) + '...');
                
                if (!paymentUrl || paymentUrl.length === 0) {
                    throw new Error('Failed to create VNPay payment URL');
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
                    bookingId: appointmentId,
                    appointmentId: appointmentId,
                    userId: appointment.userId,
                    serviceName: appointment.serviceName,
                    amount: amount,
                    method: 'Cash',
                    status: 'Completed',
                    date: new Date().toISOString(),
                    transactionId: `CASH-${uuidv4().substring(0, 8).toUpperCase()}`,
                });

                console.log('Cash payment created:', payment.id);

                // Update appointment payment status and set status to 'pending' (awaiting admin confirmation)
                // Also update all appointments in the same booking group
                await appointment.update({ 
                    paymentStatus: 'Paid',
                    status: 'pending' // Set to pending to await admin confirmation
                });

                console.log('Appointment payment status updated to Paid, status set to pending (awaiting confirmation)');
                
                // If this appointment has a bookingGroupId, update all appointments in the same group
                if (appointment.bookingGroupId) {
                    await db.Appointment.update(
                        { 
                            paymentStatus: 'Paid',
                            status: 'pending' // Set to pending to await admin confirmation
                        },
                        { 
                            where: { bookingGroupId: appointment.bookingGroupId }
                        }
                    );
                    console.log(`Updated all appointments in booking group ${appointment.bookingGroupId} to Paid and pending status`);
                }

                res.json({ payment, success: true });
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
            
            await payment.update({ 
                status: 'Completed',
                transactionId: transactionId || orderId
            });

            console.log('Payment updated to Completed');

            // Update appointment payment status and set status to 'pending' (awaiting admin confirmation)
            // Also update all appointments in the same booking group
            if (payment.appointmentId) {
                const appointment = await db.Appointment.findByPk(payment.appointmentId);
                if (appointment) {
                    // Update the appointment that has this payment
                    await appointment.update({ 
                        paymentStatus: 'Paid',
                        status: 'pending' // Set to pending to await admin confirmation
                    });
                    console.log('Appointment payment status updated to Paid, status set to pending (awaiting confirmation)');
                    
                    // If this appointment has a bookingGroupId, update all appointments in the same group
                    if (appointment.bookingGroupId) {
                        await db.Appointment.update(
                            { 
                                paymentStatus: 'Paid',
                                status: 'pending' // Set to pending to await admin confirmation
                            },
                            { 
                                where: { bookingGroupId: appointment.bookingGroupId }
                            }
                        );
                        console.log(`Updated all appointments in booking group ${appointment.bookingGroupId} to Paid and pending status`);
                    }
                }
            }

            // Note: Frontend uses HashRouter, so URL needs # prefix
            const successUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/#/payment/success?paymentId=${payment.id}`;
            console.log('Payment successful! Redirecting to:', successUrl);
            return res.redirect(successUrl);
        } else {
            // Payment failed
            console.log('Payment failed with response code:', responseCode);
            await payment.update({ status: 'Pending' });
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
            await payment.update({ 
                status: 'Completed',
                transactionId: transactionId || orderId
            });

            // Update appointment payment status and set status to 'pending' (awaiting admin confirmation)
            // Also update all appointments in the same booking group
            if (payment.appointmentId) {
                const appointment = await db.Appointment.findByPk(payment.appointmentId);
                if (appointment) {
                    // Update the appointment that has this payment
                    await appointment.update({ 
                        paymentStatus: 'Paid',
                        status: 'pending' // Set to pending to await admin confirmation
                    });
                    console.log('IPN: Appointment payment status updated to Paid, status set to pending (awaiting confirmation)');
                    
                    // If this appointment has a bookingGroupId, update all appointments in the same group
                    if (appointment.bookingGroupId) {
                        await db.Appointment.update(
                            { 
                                paymentStatus: 'Paid',
                                status: 'pending' // Set to pending to await admin confirmation
                            },
                            { 
                                where: { bookingGroupId: appointment.bookingGroupId }
                            }
                        );
                        console.log(`IPN: Updated all appointments in booking group ${appointment.bookingGroupId} to Paid and pending status`);
                    }
                }
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