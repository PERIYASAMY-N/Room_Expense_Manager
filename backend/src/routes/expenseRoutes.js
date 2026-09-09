const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { protect, requireRoom } = require('../middleware/authMiddleware');

router.use(protect);
router.use(requireRoom);

router.get('/', expenseController.getAllExpenses);
router.post('/', expenseController.createExpense);
router.get('/:id', expenseController.getExpenseById);
router.put('/:id', expenseController.updateExpense);
router.delete('/:id', expenseController.deleteExpense);

module.exports = router;
