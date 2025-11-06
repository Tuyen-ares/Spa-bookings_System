// backend/routes/payments.js
const express = require('express');
const router = express.Router();
const db = require('../config/database'); // Sequelize models
const { v4: uuidv4 } = require('uuid');

// GET /api/payments - Get all payments (Admin)
router.get('/', async (req, res) => {
    try {
        const payments = await db.Payment.findAll();
        res.json(payments);
    } catch (error) {
        console.error('Error fetching payments:', error);
        res.status(500).json({ message: 'Internal server error' });
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


module.exports = router;