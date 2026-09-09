const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect, requireRoom } = require('../middleware/authMiddleware');

router.use(protect);
router.use(requireRoom);

router.get('/my-summary', dashboardController.getMySummary);
router.get('/room-summary', dashboardController.getRoomSummary);

module.exports = router;
