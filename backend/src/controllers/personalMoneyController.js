const db = require('../config/db');

// Add personal income
exports.addIncome = async (req, res, next) => {
    try {
        const { amount, source, date, note } = req.body;
        
        if (!amount || !source || !date) {
            return res.status(400).json({ success: false, message: 'Amount, source, and date are required' });
        }

        const [result] = await db.query(
            'INSERT INTO personal_transactions (user_id, type, category, amount, transaction_date, description) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user.userId, 'INCOME', source, amount, date, note || null]
        );

        res.status(201).json({ success: true, message: 'Income added successfully', data: { id: result.insertId } });
    } catch (error) {
        next(error);
    }
};

// Add personal expense
exports.addExpense = async (req, res, next) => {
    try {
        const { amount, category, date, note } = req.body;
        
        if (!amount || !category || !date) {
            return res.status(400).json({ success: false, message: 'Amount, category, and date are required' });
        }

        const [result] = await db.query(
            'INSERT INTO personal_transactions (user_id, type, category, amount, transaction_date, description) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user.userId, 'EXPENSE', category, amount, date, note || null]
        );

        res.status(201).json({ success: true, message: 'Expense added successfully', data: { id: result.insertId } });
    } catch (error) {
        next(error);
    }
};

// Get personal summary for a specific month or all time
exports.getSummary = async (req, res, next) => {
    try {
        const { month, year } = req.query; // optional
        
        let queryCondition = 'user_id = ?';
        const queryParams = [req.user.userId];
        
        if (month && year) {
            queryCondition += ' AND MONTH(transaction_date) = ? AND YEAR(transaction_date) = ?';
            queryParams.push(month, year);
        }

        // Get total income and expenses
        const [totals] = await db.query(`
            SELECT 
                SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END) as totalIncome,
                SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END) as totalExpenses
            FROM personal_transactions
            WHERE ${queryCondition}
        `, queryParams);

        const totalIncome = totals[0].totalIncome || 0;
        const totalExpenses = totals[0].totalExpenses || 0;
        const netBalance = totalIncome - totalExpenses;

        // Get category breakdown for expenses
        const [categories] = await db.query(`
            SELECT category, SUM(amount) as total
            FROM personal_transactions
            WHERE ${queryCondition} AND type = 'EXPENSE'
            GROUP BY category
            ORDER BY total DESC
        `, queryParams);

        // Get 5 most recent transactions
        const [recentTransactions] = await db.query(`
            SELECT * FROM personal_transactions
            WHERE ${queryCondition}
            ORDER BY transaction_date DESC, created_at DESC
            LIMIT 5
        `, queryParams);

        res.json({
            success: true,
            data: {
                totalIncome: Number(totalIncome),
                totalExpenses: Number(totalExpenses),
                netBalance: Number(netBalance),
                categories,
                recentTransactions
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get paginated/filtered transactions
exports.getTransactions = async (req, res, next) => {
    try {
        const { month, year } = req.query;
        let queryCondition = 'user_id = ?';
        const queryParams = [req.user.userId];
        
        if (month && year) {
            queryCondition += ' AND MONTH(transaction_date) = ? AND YEAR(transaction_date) = ?';
            queryParams.push(month, year);
        }

        const [transactions] = await db.query(`
            SELECT * FROM personal_transactions
            WHERE ${queryCondition}
            ORDER BY transaction_date DESC, created_at DESC
        `, queryParams);

        res.json({ success: true, data: transactions });
    } catch (error) {
        next(error);
    }
};

// Edit personal transaction
exports.updateTransaction = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { amount, category, date, note } = req.body; // type cannot be changed easily, or if it can, include it
        
        // Ensure the transaction belongs to the user
        const [existing] = await db.query('SELECT * FROM personal_transactions WHERE id = ? AND user_id = ?', [id, req.user.userId]);
        
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Transaction not found or unauthorized' });
        }
        
        await db.query(
            'UPDATE personal_transactions SET amount = ?, category = ?, transaction_date = ?, description = ? WHERE id = ?',
            [amount, category, date, note || null, id]
        );

        res.json({ success: true, message: 'Transaction updated successfully' });
    } catch (error) {
        next(error);
    }
};

// Delete personal transaction
exports.deleteTransaction = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const [result] = await db.query('DELETE FROM personal_transactions WHERE id = ? AND user_id = ?', [id, req.user.userId]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Transaction not found or unauthorized' });
        }
        
        res.json({ success: true, message: 'Transaction deleted successfully' });
    } catch (error) {
        next(error);
    }
};

// Get personal categories
exports.getCategories = async (req, res, next) => {
    // Return standard categories + user's custom ones if needed in the future
    res.json({
        success: true,
        data: {
            income: ['Salary', 'Freelance', 'Gift', 'Room Settlement', 'Other'],
            expense: ['Food', 'Travel', 'Shopping', 'Entertainment', 'Education', 'Bills', 'Subscriptions', 'Personal Care', 'Other']
        }
    });
};
