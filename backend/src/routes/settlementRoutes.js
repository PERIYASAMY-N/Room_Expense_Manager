const express = require('express');
const router = express.Router({ mergeParams: true });
const { getBalances, getRecommendations, recordSettlement } = require('../controllers/settlementController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/balances', getBalances);
router.get('/settlements/recommendations', getRecommendations);
router.post('/settlements', recordSettlement);

module.exports = router;
