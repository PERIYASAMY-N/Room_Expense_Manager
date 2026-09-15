const pool = require('../config/db');

// @desc    Get personal dashboard summary
// @route   GET /api/personal/dashboard
// @access  Private
const getPersonalDashboard = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        const [expenses] = await pool.query(
            'SELECT amount FROM personal_expenses WHERE user_id = ?',
            [userId]
        );

        const totalExpenses = expenses.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
        
        // Let's assume income isn't explicitly tracked in personal_expenses but could be added later.
        // For now, if income was added, we'd query it. Let's stick to expense totals.
        
        // Get category breakdown
        const [categoryData] = await pool.query(
            'SELECT category, SUM(amount) as total FROM personal_expenses WHERE user_id = ? GROUP BY category',
            [userId]
        );

        res.json({
            totalExpenses,
            categories: categoryData
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all personal expenses
// @route   GET /api/personal/expenses
// @access  Private
const getPersonalExpenses = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        const [expenses] = await pool.query(
            'SELECT * FROM personal_expenses WHERE user_id = ? ORDER BY expense_date DESC, created_at DESC',
            [userId]
        );

        res.json(expenses);
    } catch (error) {
        next(error);
    }
};

// @desc    Add a personal expense
// @route   POST /api/personal/expenses
// @access  Private
const addPersonalExpense = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { title, amount, category, expense_date, description } = req.body;

        if (!title || !amount || !category || !expense_date) {
            res.status(400);
            throw new Error('Please add all required fields');
        }

        const [result] = await pool.query(
            'INSERT INTO personal_expenses (user_id, title, amount, category, expense_date, description) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, title, amount, category, expense_date, description || null]
        );

        res.status(201).json({
            id: result.insertId,
            title,
            amount,
            category,
            expense_date,
            description
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update a personal expense
// @route   PUT /api/personal/expenses/:id
// @access  Private
const updatePersonalExpense = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { title, amount, category, expense_date, description } = req.body;

        // Check ownership
        const [existing] = await pool.query('SELECT * FROM personal_expenses WHERE id = ?', [req.params.id]);
        if (existing.length === 0) {
            res.status(404);
            throw new Error('Expense not found');
        }
        if (existing[0].user_id !== userId) {
            res.status(403);
            throw new Error('Not authorized to update this expense');
        }

        await pool.query(
            'UPDATE personal_expenses SET title=?, amount=?, category=?, expense_date=?, description=? WHERE id=?',
            [title, amount, category, expense_date, description || null, req.params.id]
        );

        res.json({ message: 'Expense updated successfully' });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a personal expense
// @route   DELETE /api/personal/expenses/:id
// @access  Private
const deletePersonalExpense = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        // Check ownership
        const [existing] = await pool.query('SELECT * FROM personal_expenses WHERE id = ?', [req.params.id]);
        if (existing.length === 0) {
            res.status(404);
            throw new Error('Expense not found');
        }
        if (existing[0].user_id !== userId) {
            res.status(403);
            throw new Error('Not authorized to delete this expense');
        }

        await pool.query('DELETE FROM personal_expenses WHERE id = ?', [req.params.id]);

        res.json({ id: req.params.id, message: 'Expense deleted' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getPersonalDashboard,
    getPersonalExpenses,
    addPersonalExpense,
    updatePersonalExpense,
    deletePersonalExpense
};
