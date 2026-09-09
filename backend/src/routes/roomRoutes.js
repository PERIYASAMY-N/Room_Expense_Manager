const express = require('express');
const { createRoom, updateRoom, getRoomDetails } = require('../controllers/roomController');
const { protect, requireAdmin, requireRoom } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/', createRoom);
router.put('/:id', protect, requireRoom, requireAdmin, updateRoom);
router.get('/:id', protect, requireRoom, requireAdmin, getRoomDetails);

module.exports = router;
