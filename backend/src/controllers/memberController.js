const db = require('../config/db');

exports.getAllMembers = async (req, res, next) => {
    try {
        const [rows] = await db.query('SELECT m.*, u.username, u.role FROM members m LEFT JOIN users u ON u.member_id = m.id WHERE m.room_id = ? AND m.is_active = TRUE ORDER BY m.name ASC', [req.roomId]);
        res.json({ success: true, data: rows });
    } catch (error) {
        next(error);
    }
};

exports.getMemberById = async (req, res, next) => {
    try {
        const [rows] = await db.query('SELECT m.*, u.username, u.role FROM members m LEFT JOIN users u ON u.member_id = m.id WHERE m.id = ? AND m.room_id = ?', [req.params.id, req.roomId]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Member not found' });
        }
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        next(error);
    }
};

exports.createMember = async (req, res, next) => {
    // Members should join using invite codes in the roomController
    return res.status(400).json({ success: false, message: 'Members should join using the invite code' });
};

exports.updateMember = async (req, res, next) => {
    try {
        const { is_active } = req.body;
        const [result] = await db.query('UPDATE members SET is_active = COALESCE(?, is_active) WHERE id = ? AND room_id = ?', [is_active, req.params.id, req.roomId]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Member not found' });
        }
        res.json({ success: true, message: 'Member updated successfully' });
    } catch (error) {
        next(error);
    }
};

exports.deleteMember = async (req, res, next) => {
    try {
        // Soft delete
        const [result] = await db.query('UPDATE members SET is_active = FALSE WHERE id = ? AND room_id = ?', [req.params.id, req.roomId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Member not found' });
        }
        res.json({ success: true, message: 'Member deactivated successfully' });
    } catch (error) {
        next(error);
    }
};
