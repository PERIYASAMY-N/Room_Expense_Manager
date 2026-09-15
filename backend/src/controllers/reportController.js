const pool = require('../config/db');

// @desc    Get personal reports (monthly/category breakdown)
// @route   GET /api/reports/personal
// @access  Private
const getPersonalReports = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        const [monthlySpending] = await pool.query(
            `SELECT DATE_FORMAT(expense_date, '%Y-%m') as month, SUM(amount) as total 
             FROM personal_expenses 
             WHERE user_id = ? 
             GROUP BY month 
             ORDER BY month DESC LIMIT 12`,
            [userId]
        );

        const [categorySpending] = await pool.query(
            `SELECT category, SUM(amount) as total 
             FROM personal_expenses 
             WHERE user_id = ? 
             GROUP BY category 
             ORDER BY total DESC`,
            [userId]
        );

        res.json({
            monthlySpending,
            categorySpending
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get room reports
// @route   GET /api/reports/room/:roomId
// @access  Private
const getRoomReports = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { roomId } = req.params;

        const [membership] = await pool.query(
            'SELECT id FROM members WHERE user_id = ? AND room_id = ? AND is_active = TRUE',
            [userId, roomId]
        );

        if (membership.length === 0) {
            res.status(403);
            throw new Error('Not authorized');
        }

        const [monthlySpending] = await pool.query(
            `SELECT DATE_FORMAT(expense_date, '%Y-%m') as month, SUM(total_amount) as total 
             FROM room_expenses 
             WHERE room_id = ? 
             GROUP BY month 
             ORDER BY month DESC LIMIT 12`,
            [roomId]
        );

        res.json({
            monthlySpending
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getPersonalReports,
    getRoomReports
};
