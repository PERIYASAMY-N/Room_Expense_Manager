const db = require('../config/db');
const expenseService = require('../services/expenseService');

exports.getAllExpenses = async (req, res, next) => {
    try {
        const { startDate, endDate, memberId } = req.query;
        let query = `
            SELECT e.* 
            FROM expenses e
            WHERE e.room_id = ?
        `;
        const queryParams = [req.roomId];

        if (startDate && endDate) {
            query += ' AND e.expense_date BETWEEN ? AND ?';
            queryParams.push(startDate, endDate);
        }
        
        // If filtering by memberId, we need to check if they paid for any item OR participated in any item
        if (memberId) {
            query += ` AND EXISTS (
                SELECT 1 FROM expense_items ei 
                LEFT JOIN expense_item_participants eip ON ei.id = eip.expense_item_id 
                WHERE ei.expense_id = e.id AND (ei.paid_by = ? OR eip.member_id = ?)
            )`;
            queryParams.push(memberId, memberId);
        }
        
        query += ' ORDER BY e.expense_date DESC, e.created_at DESC';
        
        const [expenses] = await db.query(query, queryParams);
        
        // Fetch items and participants for each expense to show in the list
        if (expenses.length > 0) {
            const expenseIds = expenses.map(e => e.id);
            
            // Get all items for these expenses
            const [items] = await db.query(`
                SELECT ei.id, ei.expense_id, ei.item_name, ei.amount, ei.paid_by, m.name as paid_by_name
                FROM expense_items ei
                JOIN members m ON ei.paid_by = m.id
                WHERE ei.expense_id IN (?)
            `, [expenseIds]);
            
            // Get all participants for these items
            const itemIds = items.map(i => i.id);
            let participants = [];
            if (itemIds.length > 0) {
                [participants] = await db.query(`
                    SELECT eip.expense_item_id, eip.member_id, eip.share_amount, m.name 
                    FROM expense_item_participants eip
                    JOIN members m ON eip.member_id = m.id
                    WHERE eip.expense_item_id IN (?)
                `, [itemIds]);
            }
            
            // Reconstruct the nested structure
            expenses.forEach(e => {
                e.items = items.filter(i => i.expense_id === e.id).map(item => {
                    item.participants = participants.filter(p => p.expense_item_id === item.id);
                    return item;
                });
                
                // For the list view, we need a flat list of unique participants across all items
                const uniqueParticipantsMap = new Map();
                let myShare = 0;
                
                e.items.forEach(item => {
                    item.participants.forEach(p => {
                        if (req.memberId && p.member_id === req.memberId) {
                            myShare += Number(p.share_amount);
                        }
                        if (!uniqueParticipantsMap.has(p.member_id)) {
                            uniqueParticipantsMap.set(p.member_id, {
                                member_id: p.member_id,
                                name: p.name,
                                share_amount: Number(p.share_amount)
                            });
                        } else {
                            const existing = uniqueParticipantsMap.get(p.member_id);
                            existing.share_amount += Number(p.share_amount);
                        }
                    });
                });
                
                e.participants = Array.from(uniqueParticipantsMap.values());
                
                // Also get a list of unique payers
                const uniquePayersMap = new Map();
                e.items.forEach(item => {
                    if (!uniquePayersMap.has(item.paid_by)) {
                        uniquePayersMap.set(item.paid_by, item.paid_by_name);
                    }
                });
                e.payers = Array.from(uniquePayersMap.values());
            });
        }

        res.json({ success: true, data: expenses });
    } catch (error) {
        next(error);
    }
};

exports.getExpenseById = async (req, res, next) => {
    try {
        const [expenses] = await db.query(`
            SELECT e.*
            FROM expenses e 
            WHERE e.id = ? AND e.room_id = ?
        `, [req.params.id, req.roomId]);
        
        if (expenses.length === 0) {
            return res.status(404).json({ success: false, message: 'Expense not found' });
        }
        
        const expense = expenses[0];
        
        const [items] = await db.query(`
            SELECT ei.id, ei.item_name, ei.amount, ei.paid_by, m.name as paid_by_name 
            FROM expense_items ei
            JOIN members m ON ei.paid_by = m.id
            WHERE ei.expense_id = ?
        `, [req.params.id]);
        
        if (items.length > 0) {
            const itemIds = items.map(i => i.id);
            const [participants] = await db.query(`
                SELECT eip.expense_item_id, eip.member_id, m.name, eip.share_amount 
                FROM expense_item_participants eip
                JOIN members m ON eip.member_id = m.id
                WHERE eip.expense_item_id IN (?)
            `, [itemIds]);
            
            items.forEach(item => {
                item.participants = participants.filter(p => p.expense_item_id === item.id);
            });
        }
        
        expense.items = items;
        
        // Aggregate participants and shares for the whole expense
        const uniqueParticipantsMap = new Map();
        expense.items.forEach(item => {
            item.participants.forEach(p => {
                if (!uniqueParticipantsMap.has(p.member_id)) {
                    uniqueParticipantsMap.set(p.member_id, {
                        member_id: p.member_id,
                        name: p.name,
                        share_amount: Number(p.share_amount)
                    });
                } else {
                    const existing = uniqueParticipantsMap.get(p.member_id);
                    existing.share_amount += Number(p.share_amount);
                }
            });
        });
        expense.participants = Array.from(uniqueParticipantsMap.values());
        
        res.json({ success: true, data: expense });
    } catch (error) {
        next(error);
    }
};

exports.createExpense = async (req, res, next) => {
    try {
        const { title, date, items, note } = req.body;

        // Validations
        if (!title || !date || !items) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }
        if (items.length === 0) {
            return res.status(400).json({ success: false, message: 'At least one item is required' });
        }

        const totalAmount = items.reduce((sum, item) => sum + Number(item.amount), 0);
        
        if (totalAmount <= 0) {
            return res.status(400).json({ success: false, message: 'Total amount must be greater than 0' });
        }

        // Validate each item
        for (let item of items) {
            if (!item.name || !item.amount || !item.paidBy || !item.participants || item.participants.length === 0) {
                return res.status(400).json({ success: false, message: 'Each item must have a name, amount, paidBy, and at least one participant.' });
            }
        }

        const expenseId = await expenseService.createExpense({
            roomId: req.roomId, title, date, totalAmount, note, items
        });

        res.status(201).json({ success: true, message: 'Expense created successfully', data: { id: expenseId } });
    } catch (error) {
        next(error);
    }
};

exports.updateExpense = async (req, res, next) => {
    try {
        const id = req.params.id;
        
        const [existing] = await db.query('SELECT id FROM expenses WHERE id = ? AND room_id = ?', [id, req.roomId]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Expense not found in this room' });
        }

        const { title, date, items, note } = req.body;
        
        // Validate items
        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: 'At least one item is required' });
        }

        for (let item of items) {
            if (!item.name || !item.amount || !item.paidBy || !item.participants || item.participants.length === 0) {
                return res.status(400).json({ success: false, message: 'Each item must have a name, amount, paidBy, and at least one participant.' });
            }
        }

        const totalAmount = items.reduce((sum, item) => sum + Number(item.amount), 0);

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            
            // Delete old data (items and participants cascade)
            await connection.query('DELETE FROM expenses WHERE id = ?', [id]);
            
            // Create new data
            const [expenseResult] = await connection.query(
                'INSERT INTO expenses (id, room_id, title, expense_date, total_amount, note) VALUES (?, ?, ?, ?, ?, ?)',
                [id, req.roomId, title, date, totalAmount, note || null]
            );
            
            const { calculateShares } = require('../utils/shareCalculator');
            
            for (const item of items) {
                const [itemResult] = await connection.query(
                    'INSERT INTO expense_items (expense_id, item_name, amount, paid_by) VALUES (?, ?, ?, ?)',
                    [id, item.name, item.amount, item.paidBy]
                );
                const itemId = itemResult.insertId;
                
                const shares = calculateShares(item.amount, item.participants.length);
                const participantValues = item.participants.map((memberId, index) => [itemId, memberId, shares[index]]);
                
                await connection.query(
                    'INSERT INTO expense_item_participants (expense_item_id, member_id, share_amount) VALUES ?',
                    [participantValues]
                );
            }
            
            await connection.commit();
            res.json({ success: true, message: 'Expense updated successfully' });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        next(error);
    }
};

exports.deleteExpense = async (req, res, next) => {
    try {
        const deleted = await expenseService.deleteExpense(req.params.id, req.roomId);
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Expense not found in this room' });
        }
        res.json({ success: true, message: 'Expense deleted successfully' });
    } catch (error) {
        next(error);
    }
};
