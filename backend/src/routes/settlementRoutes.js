const express = require('express');
const router = express.Router();
const settlementController = require('../controllers/settlementController');
const { protect, requireRoom } = require('../middleware/authMiddleware');

router.use(protect);
router.use(requireRoom);

router.get('/', settlementController.getSettlements);
router.get('/recommendations', settlementController.getRecommendations);
router.post('/', settlementController.recordSettlement);
router.delete('/:id', settlementController.deleteSettlement);

module.exports = router;
