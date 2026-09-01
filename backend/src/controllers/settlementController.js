const db = require('../config/db');
const balanceService = require('../services/balanceService');

exports.getSettlements = async (req, res, next) => {
    try {
        const [settlements] = await db.query(`
            SELECT s.*, 
                   f.name as from_name, 
                   t.name as to_name
            FROM settlements s
            JOIN members f ON s.from_member = f.id
            JOIN members t ON s.to_member = t.id
            WHERE s.room_id = ?
            ORDER BY s.settlement_date DESC, s.created_at DESC
        `, [req.roomId]);
        res.json({ success: true, data: settlements });
    } catch (error) {
        next(error);
    }
};

exports.getRecommendations = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        const balances = await balanceService.calculateBalances(req.roomId, startDate, endDate);
        const recommendations = await balanceService.calculateExactDebts(req.roomId, startDate, endDate);
        
        // Enrich recommendations with member names
        const enriched = recommendations.map(rec => {
            const fromMember = balances.find(b => b.memberId === rec.from);
            const toMember = balances.find(b => b.memberId === rec.to);
            return {
                ...rec,
                fromName: fromMember ? fromMember.name : 'Unknown',
                toName: toMember ? toMember.name : 'Unknown'
            };
        });

        res.json({ success: true, data: enriched });
    } catch (error) {
        next(error);
    }
};

exports.recordSettlement = async (req, res, next) => {
    try {
        const { fromMember, toMember, amount, date, note } = req.body;
        
        if (!fromMember || !toMember || !amount || !date) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }
        if (fromMember === toMember) {
            return res.status(400).json({ success: false, message: 'Cannot settle with yourself' });
        }
        if (amount <= 0) {
            return res.status(400).json({ success: false, message: 'Amount must be greater than 0' });
        }

        const [result] = await db.query(
            'INSERT INTO settlements (room_id, from_member, to_member, amount, settlement_date, note) VALUES (?, ?, ?, ?, ?, ?)',
            [req.roomId, fromMember, toMember, amount, date, note || null]
        );

        res.status(201).json({ success: true, message: 'Settlement recorded successfully', data: { id: result.insertId } });
    } catch (error) {
        next(error);
    }
};

exports.deleteSettlement = async (req, res, next) => {
    try {
        const [result] = await db.query('DELETE FROM settlements WHERE id = ? AND room_id = ?', [req.params.id, req.roomId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Settlement not found' });
        }
        res.json({ success: true, message: 'Settlement deleted successfully' });
    } catch (error) {
        next(error);
    }
};
