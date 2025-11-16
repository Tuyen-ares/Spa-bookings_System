// backend/routes/notifications.js
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// GET /api/notifications/user/:userId - Lấy tất cả thông báo của user
router.get('/user/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const notifications = await db.Notification.findAll({
            where: { userId },
            order: [['createdAt', 'DESC']],
        });
        res.json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/notifications/unread/:userId - Lấy số lượng thông báo chưa đọc
router.get('/unread/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const count = await db.Notification.count({
            where: { userId, isRead: false },
        });
        res.json({ count });
    } catch (error) {
        console.error('Error counting unread notifications:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// PUT /api/notifications/:id/read - Đánh dấu đã đọc
router.put('/:id/read', async (req, res) => {
    const { id } = req.params;
    try {
        const notification = await db.Notification.findByPk(id);
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

// PUT /api/notifications/read-all/:userId - Đánh dấu tất cả đã đọc
router.put('/read-all/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        await db.Notification.update(
            { isRead: true },
            { where: { userId, isRead: false } }
        );
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/notifications - Tạo thông báo mới (internal use)
router.post('/', async (req, res) => {
    const { userId, type, title, message, relatedId, sentVia } = req.body;
    try {
        const notification = await db.Notification.create({
            id: `notif-${uuidv4()}`,
            userId,
            type,
            title,
            message,
            relatedId,
            sentVia: sentVia || 'app',
            isRead: false,
            emailSent: false,
            createdAt: new Date(),
        });
        res.json(notification);
    } catch (error) {
        console.error('Error creating notification:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// DELETE /api/notifications/:id - Xóa thông báo
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const notification = await db.Notification.findByPk(id);
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        await notification.destroy();
        res.json({ message: 'Notification deleted' });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
