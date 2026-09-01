const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/verify-room', authController.verifyRoom);
router.post('/join-room', authController.joinRoom);
router.post('/login', authController.loginUser);
router.get('/me', protect, authController.getUserProfile);

module.exports = router;
