// backend/controllers/paymentController.js
const paymentService = require('../services/paymentService');

class PaymentController {
    /**
     * GET /api/payments - Get all payments
     */
    async getAllPayments(req, res) {
        try {
            const payments = await paymentService.getAllPayments();
            res.json(payments);
        } catch (error) {
            console.error('Error fetching payments:', error);
            res.status(500).json({ 
                error: 'Failed to fetch payments',
                message: error.message 
            });
        }
    }

    /**
     * GET /api/payments/:id - Get payment by ID
     */
    async getPaymentById(req, res) {
        try {
            const { id } = req.params;
            const payment = await paymentService.getPaymentById(id);
            res.json(payment);
        } catch (error) {
            console.error('Error fetching payment:', error);
            if (error.message === 'Payment not found') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(500).json({ 
                    error: 'Failed to fetch payment',
                    message: error.message 
                });
            }
        }
    }

    /**
     * GET /api/payments/user/:userId - Get payments by user ID
     */
    async getPaymentsByUserId(req, res) {
        try {
            const { userId } = req.params;
            const payments = await paymentService.getPaymentsByUserId(userId);
            res.json(payments);
        } catch (error) {
            console.error('Error fetching user payments:', error);
            res.status(500).json({ 
                error: 'Failed to fetch user payments',
                message: error.message 
            });
        }
    }

    /**
     * POST /api/payments/create-vnpay-url - Create VNPay payment URL
     */
    async createVNPayUrl(req, res) {
        try {
            const paymentUrl = paymentService.createVNPayUrl(req.body);
            res.json({ paymentUrl });
        } catch (error) {
            console.error('Error creating VNPay URL:', error);
            res.status(500).json({ 
                error: 'Failed to create VNPay URL',
                message: error.message 
            });
        }
    }

    /**
     * POST /api/payments/process - Process payment
     */
    async processPayment(req, res) {
        try {
            const payment = await paymentService.processPayment(req.body);
            res.status(201).json({ 
                success: true, 
                payment 
            });
        } catch (error) {
            console.error('Error processing payment:', error);
            res.status(500).json({ 
                error: 'Failed to process payment',
                message: error.message 
            });
        }
    }

    /**
     * GET /api/payments/vnpay-callback - VNPay callback handler
     */
    async handleVNPayCallback(req, res) {
        try {
            const vnpParams = req.query;
            
            // Verify signature
            const isValid = paymentService.verifyVNPayCallback(vnpParams);
            
            if (!isValid) {
                return res.status(400).json({ 
                    error: 'Invalid signature' 
                });
            }

            // Get payment info
            const { vnp_TxnRef, vnp_ResponseCode, vnp_TransactionNo } = vnpParams;
            
            // Update payment status
            const status = vnp_ResponseCode === '00' ? 'Completed' : 'Failed';
            const payment = await paymentService.updatePaymentStatus(vnp_TxnRef, status);

            // Redirect to frontend with result
            const redirectUrl = `${process.env.FRONTEND_URL}/payment-result?success=${vnp_ResponseCode === '00'}&transactionNo=${vnp_TransactionNo}`;
            res.redirect(redirectUrl);
        } catch (error) {
            console.error('Error handling VNPay callback:', error);
            res.redirect(`${process.env.FRONTEND_URL}/payment-result?success=false&error=${encodeURIComponent(error.message)}`);
        }
    }

    /**
     * POST /api/payments - Create new payment
     */
    async createPayment(req, res) {
        try {
            const payment = await paymentService.createPayment(req.body);
            res.status(201).json(payment);
        } catch (error) {
            console.error('Error creating payment:', error);
            res.status(500).json({ 
                error: 'Failed to create payment',
                message: error.message 
            });
        }
    }

    /**
     * PUT /api/payments/:id - Update payment
     */
    async updatePayment(req, res) {
        try {
            const { id } = req.params;
            const payment = await paymentService.updatePayment(id, req.body);
            res.json(payment);
        } catch (error) {
            console.error('Error updating payment:', error);
            if (error.message === 'Payment not found') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(500).json({ 
                    error: 'Failed to update payment',
                    message: error.message 
                });
            }
        }
    }

    /**
     * DELETE /api/payments/:id - Delete payment
     */
    async deletePayment(req, res) {
        try {
            const { id } = req.params;
            const result = await paymentService.deletePayment(id);
            res.json(result);
        } catch (error) {
            console.error('Error deleting payment:', error);
            if (error.message === 'Payment not found') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(500).json({ 
                    error: 'Failed to delete payment',
                    message: error.message 
                });
            }
        }
    }
}

module.exports = new PaymentController();
