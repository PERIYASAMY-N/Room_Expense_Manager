const pool = require('../config/db');
const { calculateBalances } = require('../services/settlementService');

// @desc    Get room dashboard summary
// @route   GET /api/dashboard/room-summary/:roomId
// @access  Private
const getRoomSummary = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { roomId } = req.params;

        // Verify membership
        const [membership] = await pool.query(
            'SELECT id FROM members WHERE user_id = ? AND room_id = ? AND is_active = TRUE',
            [userId, roomId]
        );

        if (membership.length === 0) {
            res.status(403);
            throw new Error('Not authorized');
        }

        const [expenses] = await pool.query(
            'SELECT COUNT(*) as total_expenses, SUM(total_amount) as total_amount FROM room_expenses WHERE room_id = ?',
            [roomId]
        );

        res.json({
            totalExpenses: expenses[0].total_expenses || 0,
            totalAmount: parseFloat(expenses[0].total_amount || 0)
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get my summary in a room
// @route   GET /api/dashboard/my-summary/:roomId
// @access  Private
const getMySummary = async (req, res, next) => {
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

        const memberId = membership[0].id;

        const balances = await calculateBalances(roomId);
        const myBalance = balances.find(b => b.memberId === memberId);

        res.json(myBalance || { totalPaid: 0, totalShare: 0, netBalance: 0 });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getRoomSummary,
    getMySummary
};
