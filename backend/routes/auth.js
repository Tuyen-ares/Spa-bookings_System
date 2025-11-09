// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /api/auth/login
router.post('/login', authController.login);

// POST /api/auth/register
router.post('/register', authController.register);

// POST /api/auth/change-password
router.post('/change-password', authController.changePassword);

// GET /api/auth/verify - Verify JWT token
router.get('/verify', authController.verifyToken);

module.exports = router;