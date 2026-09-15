const express = require('express');
const router = express.Router();
const { 
    getPersonalDashboard, 
    getPersonalExpenses, 
    addPersonalExpense, 
    updatePersonalExpense, 
    deletePersonalExpense 
} = require('../controllers/personalController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/dashboard', getPersonalDashboard);
router.route('/expenses')
    .get(getPersonalExpenses)
    .post(addPersonalExpense);

router.route('/expenses/:id')
    .put(updatePersonalExpense)
    .delete(deletePersonalExpense);

module.exports = router;
