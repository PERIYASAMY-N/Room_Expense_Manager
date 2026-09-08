const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const generateToken = (payload) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET environment variable is not set');
    }
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

const generateRoomCode = () => {
    return 'RM' + Math.random().toString(36).substring(2, 8).toUpperCase();
};

const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// POST /api/rooms
// Create a room, admin member, and user account all at once
const createRoom = async (req, res) => {
    const { room_name, name, username, password, phone_number } = req.body;
    
    if (!room_name || !name || !username || !password) {
        return res.status(400).json({ message: 'All required fields must be provided.' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Check if username already exists globally
        const [existingUser] = await connection.query('SELECT * FROM users WHERE username = ?', [username]);
        if (existingUser.length > 0) {
            await connection.rollback();
            return res.status(400).json({ message: 'Username already exists.' });
        }

        // 2. Generate codes
        const roomCode = generateRoomCode();
        const inviteCode = generateInviteCode();

        // 3. Create Room
        const [roomResult] = await connection.query(
            'INSERT INTO rooms (room_code, room_name, invite_code) VALUES (?, ?, ?)', 
            [roomCode, room_name, inviteCode]
        );
        const roomId = roomResult.insertId;

        // 4. Create Member (Admin)
        const [memberResult] = await connection.query('INSERT INTO members (room_id, name) VALUES (?, ?)', [roomId, name]);
        const memberId = memberResult.insertId;

        // 5. Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 6. Create User (ADMIN role)
        const [userResult] = await connection.query(
            'INSERT INTO users (member_id, username, password_hash, phone_number, role) VALUES (?, ?, ?, ?, ?)',
            [memberId, username, hashedPassword, phone_number || null, 'ADMIN']
        );
        const userId = userResult.insertId;

        // 7. Set created_by on Room
        await connection.query('UPDATE rooms SET created_by = ? WHERE id = ?', [userId, roomId]);

        await connection.commit();

        // 8. Generate JWT
        const payload = {
            userId: userId,
            memberId: memberId,
            roomId: roomId,
            role: 'ADMIN'
        };

        res.status(201).json({ 
            message: 'Room created successfully',
            room_code: roomCode, 
            invite_code: inviteCode,
            user: {
                id: userId,
                username: username,
                role: 'ADMIN',
                memberId: memberId,
                roomId: roomId
            },
            token: generateToken(payload)
        });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: error.message });
    } finally {
        connection.release();
    }
};

// Admin only room update
const updateRoom = async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    try {
        await db.query('UPDATE rooms SET room_name = ? WHERE id = ?', [name, id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/rooms/:id
const getRoomDetails = async (req, res) => {
    try {
        const [rooms] = await db.query('SELECT * FROM rooms WHERE id = ?', [req.user.roomId]);
        res.json(rooms[0]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createRoom, updateRoom, getRoomDetails };
