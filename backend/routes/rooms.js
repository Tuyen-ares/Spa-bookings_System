// backend/routes/rooms.js
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// GET /api/rooms - Get all rooms
router.get('/', async (req, res) => {
    try {
        // Check if Room model exists
        if (!db.Room) {
            console.error('Room model not found in database');
            return res.status(500).json({ message: 'Room model not initialized' });
        }
        
        const rooms = await db.Room.findAll({
            order: [['name', 'ASC']]
        });
        console.log(`Found ${rooms.length} rooms`);
        res.json(rooms);
    } catch (error) {
        console.error('Error fetching rooms:', error);
        res.status(500).json({ message: error.message || 'Internal server error', error: error.toString() });
    }
});

// GET /api/rooms/:id - Get room by ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const room = await db.Room.findByPk(id);
        if (room) {
            res.json(room);
        } else {
            res.status(404).json({ message: 'Room not found' });
        }
    } catch (error) {
        console.error('Error fetching room by ID:', error);
        res.status(500).json({ message: error.message || 'Internal server error', error: error.toString() });
    }
});

// POST /api/rooms - Create a new room
router.post('/', async (req, res) => {
    const { name, capacity, equipmentIds, isActive } = req.body;
    
    if (!name || !name.trim()) {
        return res.status(400).json({ message: 'Room name is required' });
    }
    
    if (!capacity || capacity < 1) {
        return res.status(400).json({ message: 'Capacity must be at least 1' });
    }
    
    try {
        const newRoom = await db.Room.create({
            id: `room-${uuidv4()}`,
            name: name.trim(),
            capacity: parseInt(capacity) || 1,
            equipmentIds: equipmentIds || null,
            isActive: isActive !== undefined ? isActive : true,
        });
        
        res.status(201).json(newRoom);
    } catch (error) {
        console.error('Error creating room:', error);
        res.status(500).json({ message: error.message || 'Internal server error', error: error.toString() });
    }
});

// PUT /api/rooms/:id - Update a room
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, capacity, equipmentIds, isActive } = req.body;
    
    try {
        const room = await db.Room.findByPk(id);
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }
        
        const updateData = {};
        if (name !== undefined) updateData.name = name.trim();
        if (capacity !== undefined) {
            if (capacity < 1) {
                return res.status(400).json({ message: 'Capacity must be at least 1' });
            }
            updateData.capacity = parseInt(capacity);
        }
        if (equipmentIds !== undefined) updateData.equipmentIds = equipmentIds;
        if (isActive !== undefined) updateData.isActive = isActive;
        
        await room.update(updateData);
        res.json(room);
    } catch (error) {
        console.error('Error updating room:', error);
        res.status(500).json({ message: error.message || 'Internal server error', error: error.toString() });
    }
});

// DELETE /api/rooms/:id - Delete a room (soft delete by setting isActive = false)
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const room = await db.Room.findByPk(id);
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }
        
        // Soft delete: set isActive = false
        await room.update({ isActive: false });
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting room:', error);
        res.status(500).json({ message: error.message || 'Internal server error', error: error.toString() });
    }
});

module.exports = router;

