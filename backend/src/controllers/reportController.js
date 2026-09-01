const db = require('../config/db');

exports.getMonthlyTrend = async (req, res, next) => {
    try {
        const [results] = await db.query(`
            SELECT DATE_FORMAT(expense_date, '%Y-%m') as month, SUM(total_amount) as total
            FROM expenses
            WHERE room_id = ?
            GROUP BY month
            ORDER BY month ASC
        `, [req.roomId]);
        res.json({ success: true, data: results });
    } catch (error) {
        next(error);
    }
};

exports.getCategoryBreakdown = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        let dateCondition = 'WHERE room_id = ?';
        const params = [req.roomId];
        
        if (startDate && endDate) {
            dateCondition += ' AND expense_date BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }

        const [results] = await db.query(`
            SELECT category, SUM(total_amount) as total
            FROM expenses
            ${dateCondition}
            GROUP BY category
            ORDER BY total DESC
        `, params);
        
        res.json({ success: true, data: results });
    } catch (error) {
        next(error);
    }
};

exports.getMemberSpending = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        let dateCondition = 'WHERE e.room_id = ?';
        const params = [req.roomId];
        
        if (startDate && endDate) {
            dateCondition += ' AND e.expense_date BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }

        const [results] = await db.query(`
            SELECT m.name, SUM(ep.share_amount) as total_share
            FROM expense_participants ep
            JOIN members m ON ep.member_id = m.id
            JOIN expenses e ON ep.expense_id = e.id
            ${dateCondition}
            GROUP BY m.id, m.name
            ORDER BY total_share DESC
        `, params);
        
        res.json({ success: true, data: results });
    } catch (error) {
        next(error);
    }
};
