
// backend/routes/missions.js
const express = require('express');
const router = express.Router();
const db = require('../config/database'); // Sequelize models
const { v4: uuidv4 } = require('uuid');

// GET /api/missions/user/:userId - Get missions for a specific user
router.get('/user/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const missions = await db.Mission.findAll({ where: { userId } });
        res.json(missions);
    } catch (error) {
        console.error('Error fetching user missions:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/missions - Create a new mission (Admin/System only)
router.post('/', async (req, res) => {
    const { userId, title, description, points, type, required, serviceCategory } = req.body;
    if (!userId || !title || points === undefined) {
        return res.status(400).json({ message: 'Missing required mission data: userId, title, points' });
    }

    try {
        const newMission = await db.Mission.create({
            id: `mission-${uuidv4()}`,
            userId,
            title,
            description,
            points,
            isCompleted: false, // New missions are not completed by default
            type,
            required,
            serviceCategory
        });
        res.status(201).json(newMission);
    } catch (error) {
        console.error('Error creating mission:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// PUT /api/missions/:id - Update a mission (e.g., mark as completed)
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { isCompleted } = req.body;

    // Only allow updating isCompleted status for simplicity
    if (isCompleted === undefined) {
        return res.status(400).json({ message: 'Only `isCompleted` status can be updated.' });
    }

    try {
        const mission = await db.Mission.findByPk(id);
        if (!mission) {
            return res.status(404).json({ message: 'Mission not found' });
        }

        await mission.update({ isCompleted });
        res.json(mission);
    } catch (error) {
        console.error('Error updating mission:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// DELETE /api/missions/:id - Delete a mission (Admin only)
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.Mission.destroy({ where: { id } });
        if (result > 0) {
            res.status(204).send(); // No content
        } else {
            res.status(404).json({ message: 'Mission not found' });
        }
    } catch (error) {
        console.error('Error deleting mission:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;