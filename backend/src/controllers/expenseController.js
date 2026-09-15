const pool = require('../config/db');

// @desc    Add a room expense (with items)
// @route   POST /api/rooms/:roomId/expenses
// @access  Private
const addRoomExpense = async (req, res, next) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const userId = req.user.userId;
        const { roomId } = req.params;
        const { title, category, expenseDate, description, payers, participants, items } = req.body;

        if (!title || !expenseDate || !payers || !participants || payers.length === 0 || participants.length === 0) {
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

        // Calculate total amount from items if provided, or from payers
        let totalAmount = 0;
        if (items && items.length > 0) {
            totalAmount = items.reduce((sum, item) => sum + parseFloat(item.amount), 0);
        } else {
            // Fallback if no items provided
            totalAmount = payers.reduce((sum, p) => sum + parseFloat(p.amount), 0);
        }

        // Validate total amount matches payers sum
        const payersTotal = payers.reduce((acc, p) => acc + parseFloat(p.amount), 0);
        if (Math.abs(payersTotal - parseFloat(totalAmount)) > 0.01) {
            res.status(400);
            throw new Error('Total amount of items does not match sum of payers');
        }

        // Insert Expense
        const [expenseResult] = await connection.query(
            'INSERT INTO room_expenses (room_id, created_by, category, title, total_amount, expense_date, split_method, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [roomId, userId, category || 'Other', title, totalAmount, expenseDate, 'EQUAL', description || null]
        );
        const expenseId = expenseResult.insertId;

        // Insert Items
        if (items && items.length > 0) {
            for (const item of items) {
                await connection.query(
                    'INSERT INTO room_expense_items (expense_id, item_name, amount) VALUES (?, ?, ?)',
                    [expenseId, item.name, item.amount]
                );
            }
        }

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

// @desc    Get room expenses (with items and participants)
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

        // Get basic expenses
        const [expenses] = await pool.query(
            'SELECT e.*, u.full_name as creator_name FROM room_expenses e JOIN users u ON e.created_by = u.id WHERE e.room_id = ? ORDER BY e.expense_date DESC, e.created_at DESC',
            [roomId]
        );

        // Enhance with participants and payers
        if (expenses.length > 0) {
            const expenseIds = expenses.map(e => e.id);
            
            const [participants] = await pool.query(
                'SELECT p.expense_id, u.full_name, p.amount_owed FROM room_expense_participants p JOIN members m ON p.member_id = m.id JOIN users u ON m.user_id = u.id WHERE p.expense_id IN (?)',
                [expenseIds]
            );

            const [payers] = await pool.query(
                'SELECT p.expense_id, u.full_name, p.amount_paid FROM room_expense_payers p JOIN members m ON p.member_id = m.id JOIN users u ON m.user_id = u.id WHERE p.expense_id IN (?)',
                [expenseIds]
            );

            const [items] = await pool.query(
                'SELECT expense_id, item_name, amount FROM room_expense_items WHERE expense_id IN (?)',
                [expenseIds]
            );

            expenses.forEach(expense => {
                expense.participants = participants.filter(p => p.expense_id === expense.id);
                expense.payers = payers.filter(p => p.expense_id === expense.id);
                expense.items = items.filter(i => i.expense_id === expense.id);
            });
        }

        res.json(expenses);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    addRoomExpense,
    getRoomExpenses
};
