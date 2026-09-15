const pool = require('../config/db');

// @desc    Add a room expense
// @route   POST /api/rooms/:roomId/expenses
// @access  Private
const addRoomExpense = async (req, res, next) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const userId = req.user.userId;
        const { roomId } = req.params;
        const { title, totalAmount, expenseDate, description, payers, participants } = req.body;

        if (!title || !totalAmount || !expenseDate || !payers || !participants || payers.length === 0 || participants.length === 0) {
            res.status(400);
            throw new Error('Missing required fields');
        }

        // Verify membership
        const [membership] = await connection.query(
            'SELECT id FROM members WHERE user_id = ? AND room_id = ? AND is_active = TRUE',
            [userId, roomId]
        );

        if (membership.length === 0) {
            res.status(403);
            throw new Error('Not authorized to add expense to this room');
        }

        // Verify all participants and payers are members of the room
        const memberUserIds = new Set([...payers.map(p => p.userId), ...participants]);
        const [roomMembers] = await connection.query(
            'SELECT user_id FROM members WHERE room_id = ? AND is_active = TRUE AND user_id IN (?)',
            [roomId, Array.from(memberUserIds)]
        );

        if (roomMembers.length !== memberUserIds.size) {
            res.status(400);
            throw new Error('One or more participants/payers are not active members of this room');
        }

        // Validate total amount matches payers sum
        const payersTotal = payers.reduce((acc, p) => acc + parseFloat(p.amount), 0);
        if (Math.abs(payersTotal - parseFloat(totalAmount)) > 0.01) {
            res.status(400);
            throw new Error('Total amount does not match sum of payers');
        }

        // Insert Expense
        const [expenseResult] = await connection.query(
            'INSERT INTO room_expenses (room_id, created_by, title, total_amount, expense_date, split_method, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [roomId, userId, title, totalAmount, expenseDate, 'EQUAL', description || null]
        );
        const expenseId = expenseResult.insertId;

        // Insert Payers (Map userId to memberId)
        const [allRoomMembers] = await connection.query('SELECT id, user_id FROM members WHERE room_id = ?', [roomId]);
        const memberMap = new Map(allRoomMembers.map(m => [m.user_id, m.id]));

        for (const payer of payers) {
            await connection.query(
                'INSERT INTO room_expense_payers (expense_id, member_id, amount_paid) VALUES (?, ?, ?)',
                [expenseId, memberMap.get(payer.userId), payer.amount]
            );
        }

        // Calculate split (Equal Split with deterministic rounding)
        const total = parseFloat(totalAmount);
        const numParticipants = participants.length;
        const baseShare = Math.floor((total / numParticipants) * 100) / 100;
        let remainder = Math.round((total - baseShare * numParticipants) * 100);

        for (let i = 0; i < numParticipants; i++) {
            let amountOwed = baseShare;
            if (remainder > 0) {
                amountOwed += 0.01;
                remainder -= 1;
            }
            // amountOwed needs to be 2 decimals max
            amountOwed = parseFloat(amountOwed.toFixed(2));

            await connection.query(
                'INSERT INTO room_expense_participants (expense_id, member_id, amount_owed) VALUES (?, ?, ?)',
                [expenseId, memberMap.get(participants[i]), amountOwed]
            );
        }

        await connection.commit();
        res.status(201).json({ message: 'Expense added successfully', expenseId });
    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
};

// @desc    Get room expenses
// @route   GET /api/rooms/:roomId/expenses
// @access  Private
const getRoomExpenses = async (req, res, next) => {
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
            'SELECT e.*, u.full_name as creator_name FROM room_expenses e JOIN users u ON e.created_by = u.id WHERE e.room_id = ? ORDER BY e.expense_date DESC, e.created_at DESC',
            [roomId]
        );

        res.json(expenses);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    addRoomExpense,
    getRoomExpenses
};
