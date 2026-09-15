const express = require('express');
const router = express.Router();
const { getPersonalReports, getRoomReports } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/personal', getPersonalReports);
router.get('/room/:roomId', getRoomReports);

module.exports = router;
