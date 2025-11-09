// backend/routes/staff.js
const express = require('express');
const router = express.Router();
const db = require('../config/database'); // Sequelize models
const { v4: uuidv4 } = require('uuid');
const { STAFF_TIERS } = require('../constants.js');

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
    // Staff tiers are configuration constants (not stored in database)
    // They define business rules for staff tier levels
    res.json(STAFF_TIERS);
});

// GET /api/staff/products - Get all products
// Note: Product table removed - returning empty array
router.get('/products', async (req, res) => {
    res.json([]);
});

// GET /api/staff/sales - Get all sales
// Note: Sale table removed - returning empty array
router.get('/sales', async (req, res) => {
    res.json([]);
});

// POST /api/staff/sales - Record a new sale
// Note: Sale table removed - returning error
router.post('/sales', async (req, res) => {
    res.status(404).json({ message: 'Product and Sale functionality has been removed' });
});

// Note: InternalNotification and InternalNews tables have been removed

// =====================================================
// STAFF TASKS ROUTES
// =====================================================

// GET /api/staff/tasks - Get all staff tasks
router.get('/tasks', async (req, res) => {
    try {
        const tasks = await db.StaffTask.findAll({
            include: [
                { model: db.User, as: 'AssignedTo', attributes: ['id', 'name', 'email'] },
                { model: db.User, as: 'AssignedBy', attributes: ['id', 'name', 'email'] }
            ]
        });
        res.json(tasks);
    } catch (error) {
        console.error('Error fetching staff tasks:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/staff/tasks/:id - Get a specific task
router.get('/tasks/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const task = await db.StaffTask.findByPk(id, {
            include: [
                { model: db.User, as: 'AssignedTo', attributes: ['id', 'name', 'email'] },
                { model: db.User, as: 'AssignedBy', attributes: ['id', 'name', 'email'] }
            ]
        });
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }
        res.json(task);
    } catch (error) {
        console.error('Error fetching staff task:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/staff/tasks/assigned-to/:staffId - Get tasks assigned to a specific staff
router.get('/tasks/assigned-to/:staffId', async (req, res) => {
    const { staffId } = req.params;
    try {
        const tasks = await db.StaffTask.findAll({
            where: { assignedToId: staffId },
            include: [
                { model: db.User, as: 'AssignedTo', attributes: ['id', 'name', 'email'] },
                { model: db.User, as: 'AssignedBy', attributes: ['id', 'name', 'email'] }
            ],
            order: [['dueDate', 'ASC']]
        });
        res.json(tasks);
    } catch (error) {
        console.error('Error fetching staff tasks:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/staff/tasks - Create a new task
router.post('/tasks', async (req, res) => {
    const { title, description, assignedToId, assignedById, dueDate, status } = req.body;
    if (!title || !assignedToId || !assignedById || !dueDate) {
        return res.status(400).json({ message: 'Missing required task data' });
    }
    try {
        const newTask = await db.StaffTask.create({
            id: `task-${uuidv4()}`,
            title,
            description,
            assignedToId,
            assignedById,
            dueDate,
            status: status || 'pending',
            createdAt: new Date(),
        });
        const taskWithRelations = await db.StaffTask.findByPk(newTask.id, {
            include: [
                { model: db.User, as: 'AssignedTo', attributes: ['id', 'name', 'email'] },
                { model: db.User, as: 'AssignedBy', attributes: ['id', 'name', 'email'] }
            ]
        });
        res.status(201).json(taskWithRelations);
    } catch (error) {
        console.error('Error creating staff task:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// PUT /api/staff/tasks/:id - Update a task
router.put('/tasks/:id', async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    try {
        const task = await db.StaffTask.findByPk(id);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }
        
        // If status is being updated to 'completed', set completedAt
        if (updateData.status === 'completed' && task.status !== 'completed') {
            updateData.completedAt = new Date();
        } else if (updateData.status !== 'completed' && task.status === 'completed') {
            updateData.completedAt = null;
        }
        
        await task.update(updateData);
        const updatedTask = await db.StaffTask.findByPk(id, {
            include: [
                { model: db.User, as: 'AssignedTo', attributes: ['id', 'name', 'email'] },
                { model: db.User, as: 'AssignedBy', attributes: ['id', 'name', 'email'] }
            ]
        });
        res.json(updatedTask);
    } catch (error) {
        console.error('Error updating staff task:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// DELETE /api/staff/tasks/:id - Delete a task
router.delete('/tasks/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.StaffTask.destroy({ where: { id } });
        if (result > 0) {
            res.status(204).send();
        } else {
            res.status(404).json({ message: 'Task not found' });
        }
    } catch (error) {
        console.error('Error deleting staff task:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/staff/notifications/:userId - Get internal notifications
// userId can be 'all' to get all notifications or a specific user ID
router.get('/notifications/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        if (!db.InternalNotification) {
            return res.json([]); // Return empty array if model doesn't exist
        }
        
        const where = userId === 'all' ? {} : { userId };
        const notifications = await db.InternalNotification.findAll({
            where,
            order: [['createdAt', 'DESC']]
        });
        res.json(notifications);
    } catch (error) {
        console.error('Error fetching internal notifications:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// PUT /api/staff/notifications/:id/read - Mark notification as read
router.put('/notifications/:id/read', async (req, res) => {
    const { id } = req.params;
    try {
        if (!db.InternalNotification) {
            return res.status(404).json({ message: 'Notification model not found' });
        }
        
        const notification = await db.InternalNotification.findByPk(id);
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        
        await notification.update({ isRead: true });
        res.json(notification);
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/staff/news - Get internal news
router.get('/news', async (req, res) => {
    try {
        if (!db.InternalNews) {
            return res.json([]); // Return empty array if model doesn't exist
        }
        
        const news = await db.InternalNews.findAll({
            order: [['publishDate', 'DESC']]
        });
        res.json(news);
    } catch (error) {
        console.error('Error fetching internal news:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;