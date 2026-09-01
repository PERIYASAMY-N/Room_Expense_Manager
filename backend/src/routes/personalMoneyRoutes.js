const express = require('express');
const router = express.Router();
const personalMoneyController = require('../controllers/personalMoneyController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/summary', personalMoneyController.getSummary);
router.get('/transactions', personalMoneyController.getTransactions);
router.post('/income', personalMoneyController.addIncome);
router.post('/expense', personalMoneyController.addExpense);
router.get('/categories', personalMoneyController.getCategories);
router.put('/transactions/:id', personalMoneyController.updateTransaction);
router.delete('/transactions/:id', personalMoneyController.deleteTransaction);

module.exports = router;
