const db = require('../config/db');
const balanceService = require('../services/balanceService');

exports.getMySummary = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        let dateCondition = '';
        const dateParams = [];
        
        if (startDate && endDate) {
            dateCondition = ' AND e.expense_date BETWEEN ? AND ?';
            dateParams.push(startDate, endDate);
        }

        const roomId = req.roomId;
        const memberId = req.memberId;

        // 1. Total Paid (by this member across all items)
        const [paidRes] = await db.query(`
            SELECT SUM(ei.amount) as total 
            FROM expense_items ei
            JOIN expenses e ON ei.expense_id = e.id
            WHERE e.room_id = ? AND ei.paid_by = ? ${dateCondition}
        `, [roomId, memberId, ...dateParams]);
        const totalPaid = Number(paidRes[0].total || 0);

        // 2. Total Share (by this member across all items)
        const [shareRes] = await db.query(`
            SELECT SUM(eip.share_amount) as total 
            FROM expense_item_participants eip 
            JOIN expense_items ei ON eip.expense_item_id = ei.id
            JOIN expenses e ON ei.expense_id = e.id 
            WHERE e.room_id = ? AND eip.member_id = ? ${dateCondition}
        `, [roomId, memberId, ...dateParams]);
        const totalShare = Number(shareRes[0].total || 0);

        let settlementDateCondition = '';
        if (startDate && endDate) {
            settlementDateCondition = ' AND settlement_date BETWEEN ? AND ?';
        }

        // 3. Total Given (Settlements)
        const [givenRes] = await db.query(`SELECT SUM(amount) as total FROM settlements WHERE room_id = ? AND from_member = ? ${settlementDateCondition}`, [roomId, memberId, ...dateParams]);
        const totalGiven = Number(givenRes[0].total || 0);

        // 4. Total Received (Settlements)
        const [receivedRes] = await db.query(`SELECT SUM(amount) as total FROM settlements WHERE room_id = ? AND to_member = ? ${settlementDateCondition}`, [roomId, memberId, ...dateParams]);
        const totalReceived = Number(receivedRes[0].total || 0);

        // 5. Net Balance
        // Positive = others owe you (you will receive)
        // Negative = you owe others (you need to give)
        const netBalance = totalPaid - totalShare - totalGiven + totalReceived;

        // Balances and Settlements for Payables/Receivables
        const balances = await balanceService.calculateBalances(roomId, startDate, endDate);
        const recommendations = await balanceService.calculateExactDebts(roomId, startDate, endDate);
        
        // Enrich recommendations with member names
        const enrichedRecommendations = recommendations.map(rec => {
            const fromMember = balances.find(b => b.memberId === rec.from);
            const toMember = balances.find(b => b.memberId === rec.to);
            
            const enrichedBreakdown = rec.breakdown ? rec.breakdown.map(b => {
                const bFromMember = balances.find(member => member.memberId === b.from);
                const bToMember = balances.find(member => member.memberId === b.to);
                return {
                    ...b,
                    fromName: bFromMember ? bFromMember.name : 'Unknown',
                    toName: bToMember ? bToMember.name : 'Unknown'
                };
            }) : [];

            return {
                ...rec,
                fromName: fromMember ? fromMember.name : 'Unknown',
                toName: toMember ? toMember.name : 'Unknown',
                breakdown: enrichedBreakdown
            };
        });

        const payables = enrichedRecommendations.filter(rec => rec.from === memberId);
        const receivables = enrichedRecommendations.filter(rec => rec.to === memberId);

        // Recent Expenses (where member is involved either as payer or participant)
        const [recentExpenses] = await db.query(`
            SELECT e.id, e.expense_date, e.title as category, e.total_amount,
                   (
                       SELECT GROUP_CONCAT(DISTINCT m.name SEPARATOR ', ')
                       FROM expense_items ei
                       JOIN members m ON ei.paid_by = m.id
                       WHERE ei.expense_id = e.id
                   ) as payer_names,
                   (
                       SELECT GROUP_CONCAT(DISTINCT pm.name SEPARATOR ', ')
                       FROM expense_item_participants eip
                       JOIN expense_items ei2 ON eip.expense_item_id = ei2.id
                       JOIN members pm ON eip.member_id = pm.id
                       WHERE ei2.expense_id = e.id
                   ) as participants_names,
                   (SELECT SUM(ei.amount) FROM expense_items ei WHERE ei.expense_id = e.id AND ei.paid_by = ?) as my_paid,
                   (SELECT SUM(eip.share_amount) FROM expense_item_participants eip JOIN expense_items ei ON eip.expense_item_id = ei.id WHERE ei.expense_id = e.id AND eip.member_id = ?) as my_share
            FROM expenses e
            WHERE e.room_id = ? 
            AND EXISTS (
                SELECT 1 FROM expense_items ei 
                LEFT JOIN expense_item_participants eip ON ei.id = eip.expense_item_id 
                WHERE ei.expense_id = e.id AND (ei.paid_by = ? OR eip.member_id = ?)
            )
            ORDER BY e.expense_date DESC, e.created_at DESC
            LIMIT 10
        `, [memberId, memberId, roomId, memberId, memberId]);

        // Recent Settlements
        const [recentSettlements] = await db.query(`
            SELECT s.*, f.name as from_name, t.name as to_name 
            FROM settlements s
            JOIN members f ON s.from_member = f.id
            JOIN members t ON s.to_member = t.id
            WHERE s.room_id = ? AND (s.from_member = ? OR s.to_member = ?)
            ORDER BY s.settlement_date DESC, s.created_at DESC
            LIMIT 5
        `, [roomId, memberId, memberId]);

        // Category Spending (using title as category)
        const [categorySpending] = await db.query(`
            SELECT e.title as category, SUM(eip.share_amount) as amount
            FROM expense_item_participants eip
            JOIN expense_items ei ON eip.expense_item_id = ei.id
            JOIN expenses e ON ei.expense_id = e.id
            WHERE e.room_id = ? AND eip.member_id = ? ${dateCondition}
            GROUP BY e.title
            ORDER BY amount DESC
        `, [roomId, memberId, ...dateParams]);

        // Monthly Summary
        const [monthlySummary] = await db.query(`
            SELECT DATE_FORMAT(e.expense_date, '%Y-%m') as month, SUM(eip.share_amount) as amount
            FROM expense_item_participants eip
            JOIN expense_items ei ON eip.expense_item_id = ei.id
            JOIN expenses e ON ei.expense_id = e.id
            WHERE e.room_id = ? AND eip.member_id = ? ${dateCondition}
            GROUP BY month
            ORDER BY month DESC
            LIMIT 6
        `, [roomId, memberId, ...dateParams]);

        res.json({
            success: true,
            data: {
                totalPaid,
                totalShare,
                totalGiven,
                totalReceived,
                netBalance,
                payables,
                receivables,
                recentExpenses,
                recentSettlements,
                categorySpending,
                monthlySummary
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.getRoomSummary = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        let dateCondition = '';
        const dateParams = [];
        
        if (startDate && endDate) {
            dateCondition = ' AND expense_date BETWEEN ? AND ?';
            dateParams.push(startDate, endDate);
        }

        const roomId = req.roomId;

        // Room Info
        const [roomRes] = await db.query('SELECT room_name, room_code FROM rooms WHERE id = ?', [roomId]);
        
        // Active Members Count
        const [memRes] = await db.query('SELECT COUNT(*) as count FROM members WHERE room_id = ? AND is_active = TRUE', [roomId]);
        
        // Total Room Expenses
        const [expRes] = await db.query(`SELECT SUM(total_amount) as total FROM expenses WHERE room_id = ? ${dateCondition}`, [roomId, ...dateParams]);
        
        // Total Settled
        const [setRes] = await db.query(`SELECT SUM(amount) as total FROM settlements WHERE room_id = ? ${dateCondition.replace('expense_date', 'settlement_date')}`, [roomId, ...dateParams]);

        // Balances
        const balances = await balanceService.calculateBalances(roomId, startDate, endDate);
        
        // Recommended Settlements
        const recommendations = await balanceService.calculateExactDebts(roomId, startDate, endDate);
        const recommendedSettlements = recommendations.map(rec => {
            const fromMember = balances.find(b => b.memberId === rec.from);
            const toMember = balances.find(b => b.memberId === rec.to);
            
            const enrichedBreakdown = rec.breakdown ? rec.breakdown.map(b => {
                const bFromMember = balances.find(member => member.memberId === b.from);
                const bToMember = balances.find(member => member.memberId === b.to);
                return {
                    ...b,
                    fromName: bFromMember ? bFromMember.name : 'Unknown',
                    toName: bToMember ? bToMember.name : 'Unknown'
                };
            }) : [];

            return {
                ...rec,
                fromName: fromMember ? fromMember.name : 'Unknown',
                toName: toMember ? toMember.name : 'Unknown',
                breakdown: enrichedBreakdown
            };
        });

        // Expense Summary (Category, Number of Expenses, Total Amount)
        const [expenseSummary] = await db.query(`
            SELECT title as category, COUNT(id) as numberOfExpenses, SUM(total_amount) as totalAmount
            FROM expenses
            WHERE room_id = ? ${dateCondition}
            GROUP BY title
            ORDER BY totalAmount DESC
        `, [roomId, ...dateParams]);

        // Recent Expenses (simplified for dashboard)
        const [recentExpenses] = await db.query(`
            SELECT e.id, e.expense_date, e.title as category, e.total_amount,
                   (
                       SELECT GROUP_CONCAT(DISTINCT m.name SEPARATOR ', ')
                       FROM expense_items ei
                       JOIN members m ON ei.paid_by = m.id
                       WHERE ei.expense_id = e.id
                   ) as payer_names,
                   (
                       SELECT GROUP_CONCAT(DISTINCT pm.name SEPARATOR ', ')
                       FROM expense_item_participants eip
                       JOIN expense_items ei2 ON eip.expense_item_id = ei2.id
                       JOIN members pm ON eip.member_id = pm.id
                       WHERE ei2.expense_id = e.id
                   ) as participants_names
            FROM expenses e
            WHERE e.room_id = ? ${dateCondition}
            ORDER BY e.expense_date DESC, e.created_at DESC
            LIMIT 10
        `, [roomId, ...dateParams]);

        res.json({
            success: true,
            data: {
                roomInfo: roomRes[0],
                activeMembers: memRes[0].count,
                totalRoomExpenses: expRes[0].total || 0,
                totalSettled: setRes[0].total || 0,
                balances,
                recommendedSettlements,
                expenseSummary,
                recentExpenses
            }
        });
    } catch (error) {
        next(error);
    }
};
