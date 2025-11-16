// backend/services/paymentService.js
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const vnpayConfig = require('../config/vnpay');

class PaymentService {
    /**
     * Get all payments with user details
     */
    async getAllPayments() {
        try {
            const payments = await db.Payment.findAll({
                order: [['date', 'DESC']],
                include: [{
                    model: db.User,
                    as: 'ClientForPayment',
                    attributes: ['id', 'name', 'email', 'phone', 'profilePictureUrl'],
                    required: false
                }]
            });

            return payments.map(payment => {
                const paymentData = payment.toJSON();
                if (paymentData.ClientForPayment) {
                    paymentData.userName = paymentData.ClientForPayment.name;
                    if (!paymentData.userId && paymentData.ClientForPayment.id) {
                        paymentData.userId = paymentData.ClientForPayment.id;
                    }
                }
                if (!paymentData.transactionId) {
                    paymentData.transactionId = `TXN-${paymentData.id}`;
                }
                if (!paymentData.status) {
                    paymentData.status = 'Pending';
                }
                if (!paymentData.method) {
                    paymentData.method = 'Pay at Counter';
                }
                return paymentData;
            });
        } catch (error) {
            console.warn('Error including User association:', error.message);
            // Fallback without association
            const payments = await db.Payment.findAll({
                order: [['date', 'DESC']]
            });
            return payments.map(p => p.toJSON());
        }
    }

    /**
     * Get payment by ID
     */
    async getPaymentById(id) {
        const payment = await db.Payment.findByPk(id, {
            include: [{
                model: db.User,
                as: 'ClientForPayment',
                attributes: ['id', 'name', 'email', 'phone'],
                required: false
            }]
        });

        if (!payment) {
            throw new Error('Payment not found');
        }

        return payment;
    }

    /**
     * Get payments by user ID
     */
    async getPaymentsByUserId(userId) {
        const payments = await db.Payment.findAll({
            where: { userId },
            order: [['date', 'DESC']],
            include: [{
                model: db.Appointment,
                as: 'appointment',
                attributes: ['id', 'serviceName', 'date', 'time'],
                required: false
            }]
        });

        return payments;
    }

    /**
     * Create VNPay payment URL
     */
    createVNPayUrl(paymentData) {
        const { amount, orderId, orderInfo, returnUrl } = paymentData;

        const vnp_Params = {
            vnp_Version: '2.1.0',
            vnp_Command: 'pay',
            vnp_TmnCode: vnpayConfig.vnp_TmnCode,
            vnp_Amount: amount * 100, // VNPay yêu cầu số tiền nhân 100
            vnp_CurrCode: 'VND',
            vnp_TxnRef: orderId,
            vnp_OrderInfo: orderInfo,
            vnp_OrderType: 'billpayment',
            vnp_Locale: 'vn',
            vnp_ReturnUrl: returnUrl || vnpayConfig.vnp_ReturnUrl,
            vnp_IpAddr: '127.0.0.1',
            vnp_CreateDate: this.formatDate(new Date())
        };

        const sortedParams = this.sortObject(vnp_Params);
        const signData = new URLSearchParams(sortedParams).toString();
        const crypto = require('crypto');
        const hmac = crypto.createHmac('sha512', vnpayConfig.vnp_HashSecret);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
        
        sortedParams.vnp_SecureHash = signed;
        const paymentUrl = vnpayConfig.vnp_Url + '?' + new URLSearchParams(sortedParams).toString();

        return paymentUrl;
    }

    /**
     * Process payment (create payment record)
     */
    async processPayment(paymentData) {
        const { appointmentId, amount, method, userId } = paymentData;

        // Validate appointment exists
        const appointment = await db.Appointment.findByPk(appointmentId);
        if (!appointment) {
            throw new Error('Appointment not found');
        }

        // Get userId from appointment if not provided
        const finalUserId = userId || appointment.userId;
        if (!finalUserId) {
            throw new Error('User ID is required');
        }

        // Create payment record
        const payment = await db.Payment.create({
            id: uuidv4(),
            appointmentId: appointmentId,
            bookingId: appointmentId, // For backward compatibility
            userId: finalUserId,
            serviceName: appointment.serviceName,
            amount: amount,
            method: method || 'Pay at Counter',
            status: 'Pending', // All payments start as Pending (Cash requires admin confirmation, VNPay requires callback)
            date: new Date(),
            transactionId: `TXN-${Date.now()}`,
            therapistId: appointment.therapistId
        });

        // Update appointment payment status
        await appointment.update({
            paymentStatus: 'Unpaid' // Will be updated to 'Paid' after confirmation
        });

        return payment;
    }

    /**
     * Verify VNPay callback
     */
    verifyVNPayCallback(vnpParams) {
        const secureHash = vnpParams.vnp_SecureHash;
        delete vnpParams.vnp_SecureHash;
        delete vnpParams.vnp_SecureHashType;

        const sortedParams = this.sortObject(vnpParams);
        const signData = new URLSearchParams(sortedParams).toString();
        
        const crypto = require('crypto');
        const hmac = crypto.createHmac('sha512', vnpayConfig.vnp_HashSecret);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

        return secureHash === signed;
    }

    /**
     * Update payment status after VNPay callback
     */
    async updatePaymentStatus(transactionId, status) {
        const payment = await db.Payment.findOne({
            where: { transactionId }
        });

        if (!payment) {
            throw new Error('Payment not found');
        }

        await payment.update({ status });

        // Update appointment payment status
        if (payment.appointmentId) {
            const appointment = await db.Appointment.findByPk(payment.appointmentId);
            if (appointment) {
                await appointment.update({
                    paymentStatus: status === 'Completed' ? 'Paid' : 'Unpaid'
                });
            }
        }

        return payment;
    }

    /**
     * Create payment for appointment
     */
    async createPayment(data) {
        const payment = await db.Payment.create({
            id: uuidv4(),
            ...data,
            date: data.date || new Date(),
            status: data.status || 'Pending',
            transactionId: data.transactionId || `TXN-${Date.now()}`
        });

        return payment;
    }

    /**
     * Update payment
     */
    async updatePayment(id, data) {
        const payment = await db.Payment.findByPk(id);
        if (!payment) {
            throw new Error('Payment not found');
        }

        await payment.update(data);
        return payment;
    }

    /**
     * Delete payment
     */
    async deletePayment(id) {
        const payment = await db.Payment.findByPk(id);
        if (!payment) {
            throw new Error('Payment not found');
        }

        await payment.destroy();
        return { message: 'Payment deleted successfully' };
    }

    // Helper methods
    sortObject(obj) {
        const sorted = {};
        const keys = Object.keys(obj).sort();
        keys.forEach(key => {
            sorted[key] = obj[key];
        });
        return sorted;
    }

    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}${month}${day}${hours}${minutes}${seconds}`;
    }
}

module.exports = new PaymentService();
