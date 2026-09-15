const pool = require('../config/db');

// @desc    Get personal dashboard summary (Balance, Income, Expenses)
// @route   GET /api/personal/dashboard
// @access  Private
const getPersonalDashboard = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        const [results] = await pool.query(
            'SELECT type, SUM(amount) as total FROM personal_transactions WHERE user_id = ? GROUP BY type',
            [userId]
        );

        let totalIncome = 0;
        let totalExpense = 0;

        results.forEach(row => {
            if (row.type === 'INCOME') totalIncome = parseFloat(row.total);
            if (row.type === 'EXPENSE') totalExpense = parseFloat(row.total);
        });

        const currentBalance = totalIncome - totalExpense;

        res.json({
            currentBalance,
            totalIncome,
            totalExpense,
            saved: currentBalance > 0 ? currentBalance : 0
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get personal transactions
// @route   GET /api/personal/transactions
// @access  Private
const getTransactions = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        const [transactions] = await pool.query(
            'SELECT * FROM personal_transactions WHERE user_id = ? ORDER BY transaction_date DESC, created_at DESC',
            [userId]
        );

        res.json(transactions);
    } catch (error) {
        next(error);
    }
};

// @desc    Add a personal transaction
// @route   POST /api/personal/transactions
// @access  Private
const addTransaction = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { type, category, amount, transactionDate, description } = req.body;

        if (!type || !category || !amount || !transactionDate) {
            res.status(400);
            throw new Error('Missing required fields');
        }

        if (type !== 'INCOME' && type !== 'EXPENSE') {
            res.status(400);
            throw new Error('Type must be INCOME or EXPENSE');
        }

        const [result] = await pool.query(
            'INSERT INTO personal_transactions (user_id, type, category, amount, transaction_date, description) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, type, category, amount, transactionDate, description || null]
        );

        res.status(201).json({ message: 'Transaction added', transactionId: result.insertId });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a personal transaction
// @route   DELETE /api/personal/transactions/:id
// @access  Private
const deleteTransaction = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;

        const [result] = await pool.query(
            'DELETE FROM personal_transactions WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (result.affectedRows === 0) {
            res.status(404);
            throw new Error('Transaction not found or not authorized');
        }

        res.json({ message: 'Transaction deleted' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getPersonalDashboard,
    getTransactions,
    addTransaction,
    deleteTransaction
};
