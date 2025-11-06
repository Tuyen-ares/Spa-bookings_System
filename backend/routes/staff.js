// backend/routes/staff.js
const express = require('express');
const router = express.Router();
const db = require('../config/database'); // Sequelize models
const { v4: uuidv4 } = require('uuid');
const { MOCK_STAFF_TIERS } = require('../constants.js');

// GET /api/staff/availability/:staffId - Get staff's daily availability
router.get('/availability/:staffId', async (req, res) => {
    const { staffId } = req.params;
    try {
        const staffAvailability = await db.StaffAvailability.findAll({ where: { staffId } });
        res.json(staffAvailability);
    } catch (error) {
        console.error('Error fetching staff availability:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// PUT /api/staff/availability/:staffId/:date - Update staff's availability for a specific date
router.put('/availability/:staffId/:date', async (req, res) => {
    const { staffId, date } = req.params;
    const { timeSlots } = req.body; // Array of { time: string, availableServiceIds: string[] }

    try {
        let availability = await db.StaffAvailability.findOne({ where: { staffId, date } });

        if (availability) {
            await availability.update({ timeSlots });
            res.json(availability);
        } else {
            const newAvailability = await db.StaffAvailability.create({
                id: `avail-${uuidv4()}`,
                staffId,
                date,
                timeSlots,
            });
            res.status(201).json(newAvailability);
        }
    } catch (error) {
        console.error('Error updating staff availability:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// DELETE /api/staff/availability/:staffId/:date - Delete staff's availability for a specific date
router.delete('/availability/:staffId/:date', async (req, res) => {
    const { staffId, date } = req.params;
    try {
        const result = await db.StaffAvailability.destroy({ where: { staffId, date } });
        if (result > 0) {
            res.status(204).send();
        } else {
            res.status(404).json({ message: 'Staff availability not found for this date' });
        }
    } catch (error) {
        console.error('Error deleting staff availability:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/staff/shifts/:staffId - Get staff's individual shifts/leave requests
router.get('/shifts/:staffId', async (req, res) => {
    const { staffId } = req.params;
    try {
        const staffShifts = await db.StaffShift.findAll({ where: { staffId } });
        res.json(staffShifts);
    } catch (error) {
        console.error('Error fetching staff shifts:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/staff/shifts - Get all staff shifts (list) - useful for admin pages
router.get('/shifts', async (req, res) => {
    try {
        const staffShifts = await db.StaffShift.findAll();
        res.json(staffShifts);
    } catch (error) {
        console.error('Error fetching all staff shifts:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/staff/shifts - Add a new shift/leave request
router.post('/shifts', async (req, res) => {
    const newShiftData = req.body;
    if (!newShiftData.staffId || !newShiftData.date || !newShiftData.shiftType) {
        return res.status(400).json({ message: 'Missing required shift data' });
    }
    try {
        const createdShift = await db.StaffShift.create({
            id: `shift-${uuidv4()}`,
            status: 'pending',
            ...newShiftData,
        });
        res.status(201).json(createdShift);
    } catch (error) {
        console.error('Error creating staff shift:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// PUT /api/staff/shifts/:id - Update a shift/leave request
router.put('/shifts/:id', async (req, res) => {
    const { id } = req.params;
    const updatedShiftData = req.body;
    try {
        const shift = await db.StaffShift.findByPk(id);
        if (!shift) {
            return res.status(404).json({ message: 'Shift not found' });
        }
        await shift.update(updatedShiftData);
        res.json(shift);
    } catch (error) {
        console.error('Error updating staff shift:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// DELETE /api/staff/shifts/:id - Delete a shift/leave request
router.delete('/shifts/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.StaffShift.destroy({ where: { id } });
        if (result > 0) {
            res.status(204).send();
        } else {
            res.status(404).json({ message: 'Shift not found' });
        }
    } catch (error) {
        console.error('Error deleting staff shift:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/staff/tiers - Get all staff tiers (from constants for now, or a model if needed)
router.get('/tiers', async (req, res) => {
    // Staff tiers are not a separate model with full CRUD usually,
    // they are often defined in constants or derived.
    // If you need them to be dynamic, create a StaffTier model.
    res.json(MOCK_STAFF_TIERS);
});

// GET /api/staff/products - Get all products
router.get('/products', async (req, res) => {
    try {
        const products = await db.Product.findAll();
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/staff/sales - Get all sales
router.get('/sales', async (req, res) => {
    try {
        const sales = await db.Sale.findAll();
        res.json(sales);
    } catch (error) {
        console.error('Error fetching sales:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/staff/sales - Record a new sale
router.post('/sales', async (req, res) => {
    const newSaleData = req.body;
    if (!newSaleData.staffId || !newSaleData.productId || newSaleData.quantity === undefined || newSaleData.totalAmount === undefined) {
        return res.status(400).json({ message: 'Missing required sale data' });
    }
    try {
        const createdSale = await db.Sale.create({
            id: uuidv4(),
            date: new Date().toISOString(),
            status: 'completed',
            ...newSaleData,
        });
        // Optionally update product stock
        const product = await db.Product.findByPk(newSaleData.productId);
        if (product) {
            await product.update({ stock: product.stock - newSaleData.quantity });
        }
        res.status(201).json(createdSale);
    } catch (error) {
        console.error('Error creating sale:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/staff/notifications/:userId - Get internal notifications for current user/all
router.get('/notifications/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const userNotifications = await db.InternalNotification.findAll({
            where: db.Sequelize.or(
                { recipientId: userId },
                { recipientType: 'all' }
            )
        });
        res.json(userNotifications);
    } catch (error) {
        console.error('Error fetching internal notifications:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// PUT /api/staff/notifications/:id/read - Mark notification as read
router.put('/notifications/:id/read', async (req, res) => {
    const { id } = req.params;
    try {
        const notification = await db.InternalNotification.findByPk(id);
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        await notification.update({ isRead: true });
        res.status(200).json({ message: 'Notification marked as read' });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/staff/news - Get internal news
router.get('/news', async (req, res) => {
    try {
        const internalNews = await db.InternalNews.findAll();
        res.json(internalNews);
    } catch (error) {
        console.error('Error fetching internal news:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;