const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/monthly-trend', reportController.getMonthlyTrend);
router.get('/category-breakdown', reportController.getCategoryBreakdown);
router.get('/member-spending', reportController.getMemberSpending);

module.exports = router;
