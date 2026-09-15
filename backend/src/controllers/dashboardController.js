const pool = require('../config/db');
const { calculateMemberBalances, calculatePairwiseSettlements } = require('../services/settlementService');

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

        // Top summary values
        const [expenses] = await pool.query(
            'SELECT COUNT(*) as total_expenses, SUM(total_amount) as total_amount FROM room_expenses WHERE room_id = ?',
            [roomId]
        );

        const [membersCount] = await pool.query(
            'SELECT COUNT(*) as count FROM members WHERE room_id = ? AND is_active = TRUE',
            [roomId]
        );

        const [categories] = await pool.query(
            'SELECT category, COUNT(*) as count, SUM(total_amount) as total FROM room_expenses WHERE room_id = ? GROUP BY category ORDER BY total DESC',
            [roomId]
        );

        res.json({
            activeMembers: membersCount[0].count,
            totalExpensesCount: expenses[0].total_expenses || 0,
            totalAmount: parseFloat(expenses[0].total_amount || 0),
            categories: categories.map(c => ({
                category: c.category,
                count: c.count,
                total: parseFloat(c.total)
            }))
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

        const memberBalances = await calculateMemberBalances(roomId);
        const myBalance = memberBalances.find(b => b.memberId === memberId);
        
        const { recommendations } = await calculatePairwiseSettlements(roomId);
        const myRecommendations = recommendations.filter(r => r.from === memberId || r.to === memberId);
        
        let amountToPay = 0;
        let amountToReceive = 0;
        myRecommendations.forEach(r => {
            if (r.from === memberId) amountToPay += r.amount;
            if (r.to === memberId) amountToReceive += r.amount;
        });

        // My Expenses (where I paid or participated)
        const [myExpenses] = await pool.query(`
            SELECT DISTINCT e.id, e.title, e.category, e.expense_date, e.total_amount, u.full_name as paid_by_name,
            (SELECT SUM(amount_owed) FROM room_expense_participants WHERE expense_id = e.id AND member_id = ?) as my_share
            FROM room_expenses e
            LEFT JOIN room_expense_payers payer ON e.id = payer.expense_id
            JOIN members m ON payer.member_id = m.id
            JOIN users u ON m.user_id = u.id
            LEFT JOIN room_expense_participants part ON e.id = part.expense_id
            WHERE e.room_id = ? AND (payer.member_id = ? OR part.member_id = ?)
            ORDER BY e.expense_date DESC LIMIT 10
        `, [memberId, roomId, memberId, memberId]);

        // My Settlement History
        const [mySettlements] = await pool.query(`
            SELECT s.id, s.amount, s.settlement_date, s.note, s.paid_by, s.paid_to,
            uby.full_name as paid_by_name, uto.full_name as paid_to_name
            FROM settlements s
            JOIN members mby ON s.paid_by = mby.id
            JOIN users uby ON mby.user_id = uby.id
            JOIN members mto ON s.paid_to = mto.id
            JOIN users uto ON mto.user_id = uto.id
            WHERE s.room_id = ? AND (s.paid_by = ? OR s.paid_to = ?)
            ORDER BY s.settlement_date DESC
        `, [roomId, memberId, memberId]);

        res.json({
            financialSummary: {
                totalPaid: myBalance ? myBalance.totalPaid : 0,
                totalShare: myBalance ? myBalance.totalShare : 0,
                netBalance: myBalance ? myBalance.netBalance : 0,
                amountToPay,
                amountToReceive
            },
            myExpenses: myExpenses.map(e => ({
                id: e.id,
                date: e.expense_date,
                category: e.category,
                paidBy: e.paid_by_name,
                total: parseFloat(e.total_amount),
                myShare: parseFloat(e.my_share || 0)
            })),
            mySettlements: mySettlements.map(s => ({
                id: s.id,
                date: s.settlement_date,
                type: s.paid_by === memberId ? 'PAID' : 'RECEIVED',
                member: s.paid_by === memberId ? s.paid_to_name : s.paid_by_name,
                amount: parseFloat(s.amount),
                note: s.note
            }))
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getRoomSummary,
    getMySummary
};
