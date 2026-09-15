const pool = require('../config/db');
const crypto = require('crypto');

const generateCode = (length) => {
    return crypto.randomBytes(Math.ceil(length / 2))
        .toString('hex')
        .slice(0, length)
        .toUpperCase();
};

// @desc    Create new room
// @route   POST /api/rooms
// @access  Private
const createRoom = async (req, res, next) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const userId = req.user.userId;
        const { roomName } = req.body;

        if (!roomName) {
            res.status(400);
            throw new Error('Room name is required');
        }

        const roomCode = 'RM' + generateCode(6);
        const inviteCode = generateCode(6);

        // Create Room
        const [roomResult] = await connection.query(
            'INSERT INTO rooms (room_code, room_name, invite_code, created_by) VALUES (?, ?, ?, ?)',
            [roomCode, roomName, inviteCode, userId]
        );

        const roomId = roomResult.insertId;

        // Create Admin Member
        await connection.query(
            'INSERT INTO members (user_id, room_id, role) VALUES (?, ?, ?)',
            [userId, roomId, 'ADMIN']
        );

        await connection.commit();

        res.status(201).json({
            id: roomId,
            roomCode,
            roomName,
            inviteCode,
            role: 'ADMIN'
        });
    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
};

// @desc    Join an existing room
// @route   POST /api/rooms/join
// @access  Private
const joinRoom = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { code } = req.body; // Can be roomCode or inviteCode

        if (!code) {
            res.status(400);
            throw new Error('Room code or invite code is required');
        }

        const [rooms] = await pool.query(
            'SELECT id, room_name FROM rooms WHERE room_code = ? OR invite_code = ?',
            [code, code]
        );

        if (rooms.length === 0) {
            res.status(404);
            throw new Error('Room not found with provided code');
        }

        const room = rooms[0];

        // Check if already a member
        const [existing] = await pool.query(
            'SELECT * FROM members WHERE user_id = ? AND room_id = ?',
            [userId, room.id]
        );

        if (existing.length > 0) {
            if (!existing[0].is_active) {
                // Reactivate
                await pool.query('UPDATE members SET is_active = TRUE WHERE id = ?', [existing[0].id]);
                return res.json({ id: room.id, message: 'Rejoined room successfully' });
            }
            res.status(400);
            throw new Error('You are already a member of this room');
        }

        // Add as member
        await pool.query(
            'INSERT INTO members (user_id, room_id, role) VALUES (?, ?, ?)',
            [userId, room.id, 'MEMBER']
        );

        res.status(201).json({
            id: room.id,
            roomName: room.room_name,
            message: 'Joined room successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all rooms for user
// @route   GET /api/rooms
// @access  Private
const getMyRooms = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        const [rooms] = await pool.query(`
            SELECT r.id, r.room_code, r.room_name, r.invite_code, r.created_by, m.role, m.is_active,
                   (SELECT COUNT(*) FROM members WHERE room_id = r.id AND is_active = TRUE) as member_count
            FROM rooms r
            JOIN members m ON r.id = m.room_id
            WHERE m.user_id = ? AND m.is_active = TRUE
        `, [userId]);

        res.json(rooms);
    } catch (error) {
        next(error);
    }
};

// @desc    Get room details
// @route   GET /api/rooms/:id
// @access  Private
const getRoomDetails = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const roomId = req.params.id;

        // Verify membership
        const [membership] = await pool.query(
            'SELECT role, is_active FROM members WHERE user_id = ? AND room_id = ?',
            [userId, roomId]
        );

        if (membership.length === 0 || !membership[0].is_active) {
            res.status(403);
            throw new Error('Not authorized to access this room');
        }

        const [rooms] = await pool.query('SELECT * FROM rooms WHERE id = ?', [roomId]);
        
        if (rooms.length === 0) {
            res.status(404);
            throw new Error('Room not found');
        }

        const room = rooms[0];
        room.myRole = membership[0].role;

        res.json(room);
    } catch (error) {
        next(error);
    }
};

// @desc    Get room members
// @route   GET /api/rooms/:id/members
// @access  Private
const getRoomMembers = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const roomId = req.params.id;

        // Verify membership
        const [membership] = await pool.query(
            'SELECT role FROM members WHERE user_id = ? AND room_id = ? AND is_active = TRUE',
            [userId, roomId]
        );

        if (membership.length === 0) {
            res.status(403);
            throw new Error('Not authorized to access this room');
        }

        const [members] = await pool.query(`
            SELECT m.id as member_id, m.role, m.joined_at, u.id as user_id, u.full_name, u.username, m.is_active
            FROM members m
            JOIN users u ON m.user_id = u.id
            WHERE m.room_id = ?
            ORDER BY m.role ASC, m.joined_at ASC
        `, [roomId]);

        res.json(members);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createRoom,
    joinRoom,
    getMyRooms,
    getRoomDetails,
    getRoomMembers
};
