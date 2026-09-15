const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getPersonalDashboard,
    getTransactions,
    addTransaction,
    deleteTransaction
} = require('../controllers/personalController');

router.use(protect);

router.get('/dashboard', getPersonalDashboard);
router.get('/transactions', getTransactions);
router.post('/transactions', addTransaction);
router.delete('/transactions/:id', deleteTransaction);

module.exports = router;
