const express = require('express');
const router = express.Router();
const { getRoomSummary, getMySummary } = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/room-summary/:roomId', getRoomSummary);
router.get('/my-summary/:roomId', getMySummary);

module.exports = router;
