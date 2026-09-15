const express = require('express');
const router = express.Router();
const { 
    createRoom, 
    joinRoom, 
    getMyRooms, 
    getRoomDetails, 
    getRoomMembers 
} = require('../controllers/roomController');
const { protect } = require('../middleware/authMiddleware');

// Add expenses sub-router later if needed, or keep separate

router.use(protect);

router.route('/')
    .get(getMyRooms)
    .post(createRoom);

router.post('/join', joinRoom);

router.route('/:id')
    .get(getRoomDetails);

router.get('/:id/members', getRoomMembers);

module.exports = router;
