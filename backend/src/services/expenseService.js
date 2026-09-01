const db = require('../config/db');
const { calculateShares } = require('../utils/shareCalculator');

exports.createExpense = async (expenseData) => {
    const { roomId, title, date, totalAmount, note, items } = expenseData;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Insert into expenses
        const [expenseResult] = await connection.query(
            'INSERT INTO expenses (room_id, title, expense_date, total_amount, note) VALUES (?, ?, ?, ?, ?)',
            [roomId, title, date, totalAmount, note || null]
        );
        const expenseId = expenseResult.insertId;

        // 2. Insert items and participants
        if (items && items.length > 0) {
            for (const item of items) {
                const [itemResult] = await connection.query(
                    'INSERT INTO expense_items (expense_id, item_name, amount, paid_by) VALUES (?, ?, ?, ?)',
                    [expenseId, item.name, item.amount, item.paidBy]
                );
                const itemId = itemResult.insertId;
                
                if (item.participants && item.participants.length > 0) {
                    const shares = calculateShares(item.amount, item.participants.length);
                    const participantValues = item.participants.map((memberId, index) => [itemId, memberId, shares[index]]);
                    
                    await connection.query(
                        'INSERT INTO expense_item_participants (expense_item_id, member_id, share_amount) VALUES ?',
                        [participantValues]
                    );
                }
            }
        }

        await connection.commit();
        return expenseId;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

exports.deleteExpense = async (id, roomId) => {
    // Note: CASCADE constraints will handle deleting from expense_items and expense_item_participants
    const [result] = await db.query('DELETE FROM expenses WHERE id = ? AND room_id = ?', [id, roomId]);
    return result.affectedRows > 0;
};
