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

// GET /api/auth/verify-email/:token - Verify email with token
router.get('/verify-email/:token', authController.verifyEmail);

// POST /api/auth/resend-verification - Resend verification email
router.post('/resend-verification', authController.resendVerificationEmail);

// POST /api/auth/forgot-password - Request password reset
router.post('/forgot-password', authController.forgotPassword);

// GET /api/auth/reset-password/:token - Verify reset password token
router.get('/reset-password/:token', authController.verifyResetToken);

// POST /api/auth/reset-password/:token - Reset password with token
router.post('/reset-password/:token', authController.resetPasswordWithToken);

module.exports = router;