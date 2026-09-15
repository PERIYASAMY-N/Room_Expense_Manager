const express = require('express');
const router = express.Router({ mergeParams: true });
const { addRoomExpense, getRoomExpenses } = require('../controllers/expenseController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
    .get(getRoomExpenses)
    .post(addRoomExpense);

module.exports = router;
