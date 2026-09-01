const express = require('express');
const { createRoom, updateRoom, getRoomDetails } = require('../controllers/roomController');
const { protect, requireAdmin } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/', createRoom);
router.put('/:id', protect, requireAdmin, updateRoom);
router.get('/:id', protect, requireAdmin, getRoomDetails);

module.exports = router;
