// backend/routes/users.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// GET /api/users - Get all users
router.get('/', userController.getAllUsers);

// GET /api/users/:id - Get user by ID
router.get('/:id', userController.getUserById);

// GET /api/users/:id/profile - Get user profile with appointments and wallet
router.get('/:id/profile', userController.getUserProfile);

// POST /api/users - Create new user
router.post('/', userController.createUser);

// PUT /api/users/:id - Update user
router.put('/:id', userController.updateUser);

// PATCH /api/users/:id/status - Update user status
router.patch('/:id/status', userController.updateUserStatus);

// DELETE /api/users/:id - Delete user
router.delete('/:id', userController.deleteUser);

module.exports = router;
