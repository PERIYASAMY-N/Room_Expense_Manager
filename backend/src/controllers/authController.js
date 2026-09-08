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

const verifyRoom = async (req, res) => {
    const { room_code, invite_code } = req.body;
    try {
        const [rooms] = await db.query('SELECT id, room_name, room_code FROM rooms WHERE room_code = ? AND invite_code = ? AND is_active = TRUE', [room_code, invite_code]);
        if (rooms.length === 0) {
            return res.status(404).json({ message: 'Invalid Room ID or Invite Code.' });
        }
        
        // Count active members
        const [memRes] = await db.query('SELECT COUNT(*) as count FROM members WHERE room_id = ? AND is_active = TRUE', [rooms[0].id]);
        
        res.status(200).json({ room: rooms[0], memberCount: memRes[0].count });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const joinRoom = async (req, res) => {
    const { room_code, invite_code, name, username, password, phone_number } = req.body;
    
    if (!name || !username || !password || !room_code || !invite_code) {
        return res.status(400).json({ message: 'All required fields must be provided.' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Verify room and invite code
        const [rooms] = await connection.query('SELECT * FROM rooms WHERE room_code = ? AND invite_code = ? AND is_active = TRUE', [room_code, invite_code]);
        if (rooms.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Invalid Room ID or Invite Code.' });
        }
        const room = rooms[0];

        // 2. Check if username already exists
        const [existingUser] = await connection.query('SELECT * FROM users WHERE username = ?', [username]);
        if (existingUser.length > 0) {
            await connection.rollback();
            return res.status(400).json({ message: 'Username already exists.' });
        }

        // 3. Create Member
        const [memberResult] = await connection.query('INSERT INTO members (room_id, name) VALUES (?, ?)', [room.id, name]);
        const memberId = memberResult.insertId;

        // 4. Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 5. Create User (MEMBER role)
        const [userResult] = await connection.query(
            'INSERT INTO users (member_id, username, password_hash, phone_number, role) VALUES (?, ?, ?, ?, ?)',
            [memberId, username, hashedPassword, phone_number || null, 'MEMBER']
        );
        const userId = userResult.insertId;

        await connection.commit();

        // 6. Generate JWT payload
        const payload = {
            userId: userId,
            memberId: memberId,
            roomId: room.id,
            role: 'MEMBER'
        };

        res.status(201).json({
            message: 'Joined Room successfully',
            user: {
                id: userId,
                username: username,
                role: 'MEMBER',
                memberId: memberId,
                roomId: room.id
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

const loginUser = async (req, res) => {
    const { room_code, username, password } = req.body;
    try {
        const [rooms] = await db.query('SELECT id, is_active FROM rooms WHERE room_code = ?', [room_code]);
        if (rooms.length === 0) {
            return res.status(401).json({ message: 'Invalid room or credentials.' });
        }
        const room = rooms[0];

        if (!room.is_active) {
            return res.status(403).json({ message: 'Room is inactive.' });
        }

        const [users] = await db.query(`
            SELECT u.*, m.room_id 
            FROM users u
            JOIN members m ON u.member_id = m.id
            WHERE u.username = ?
        `, [username]);
        
        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid room or credentials.' });
        }

        const user = users[0];

        if (user.room_id !== room.id) {
            return res.status(401).json({ message: 'Invalid room or credentials.' });
        }

        if (!user.is_active) {
            return res.status(403).json({ message: 'User is inactive.' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid room or credentials.' });
        }

        const payload = {
            userId: user.id,
            memberId: user.member_id,
            roomId: room.id,
            role: user.role
        };

        res.json({
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                memberId: user.member_id,
                roomId: room.id
            },
            token: generateToken(payload)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getUserProfile = async (req, res) => {
    try {
        const [users] = await db.query(`
            SELECT u.id, u.username, u.role, u.phone_number, m.name as member_name, r.room_name, r.room_code 
            FROM users u
            JOIN members m ON u.member_id = m.id
            JOIN rooms r ON m.room_id = r.id
            WHERE u.id = ?
        `, [req.user.userId]);

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(users[0]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { verifyRoom, joinRoom, loginUser, getUserProfile };
