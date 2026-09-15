const { calculateMemberBalances, calculatePairwiseSettlements } = require('../services/settlementService');
const pool = require('../config/db');

// @desc    Get room balances
// @route   GET /api/rooms/:roomId/balances
// @access  Private
const getBalances = async (req, res, next) => {
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

        const balances = await calculateMemberBalances(roomId);
        res.json(balances);
    } catch (error) {
        next(error);
    }
};

// @desc    Get settlement recommendations
// @route   GET /api/rooms/:roomId/settlements/recommendations
// @access  Private
const getRecommendations = async (req, res, next) => {
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

        const { recommendations } = await calculatePairwiseSettlements(roomId);
        res.json(recommendations);
    } catch (error) {
        next(error);
    }
};

// @desc    Record a settlement payment
// @route   POST /api/rooms/:roomId/settlements
// @access  Private
const recordSettlement = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { roomId } = req.params;
        const { paidBy, paidTo, amount, settlementDate, note } = req.body;

        const [membership] = await pool.query(
            'SELECT id FROM members WHERE user_id = ? AND room_id = ? AND is_active = TRUE',
            [userId, roomId]
        );

        if (membership.length === 0) {
            res.status(403);
            throw new Error('Not authorized');
        }

        if (!paidBy || !paidTo || !amount || !settlementDate) {
            res.status(400);
            throw new Error('Missing required fields');
        }

        await pool.query(
            'INSERT INTO settlements (room_id, paid_by, paid_to, amount, settlement_date, note) VALUES (?, ?, ?, ?, ?, ?)',
            [roomId, paidBy, paidTo, amount, settlementDate, note || null]
        );

        res.status(201).json({ message: 'Settlement recorded successfully' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getBalances,
    getRecommendations,
    recordSettlement
};
