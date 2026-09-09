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

const register = async (req, res) => {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'All required fields must be provided.' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Check if email already exists
        const [existingUser] = await connection.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            await connection.rollback();
            return res.status(400).json({ message: 'Email already exists.' });
        }

        // Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create User (account_type = PERSONAL)
        const [userResult] = await connection.query(
            'INSERT INTO users (full_name, email, password_hash, account_type) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, 'PERSONAL']
        );
        const userId = userResult.insertId;

        await connection.commit();

        // Generate JWT payload (no roomId or memberId needed)
        const payload = {
            userId: userId,
            accountType: 'PERSONAL'
        };

        res.status(201).json({
            message: 'Personal Account created successfully',
            user: {
                id: userId,
                full_name: name,
                email: email,
                accountType: 'PERSONAL'
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

const login = async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ message: 'All required fields must be provided.' });
    }

    try {
        // Find user by email and personal account type
        const [users] = await db.query('SELECT * FROM users WHERE email = ? AND account_type = ?', [email, 'PERSONAL']);
        
        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials or not a personal account.' });
        }

        const user = users[0];

        if (!user.is_active) {
            return res.status(403).json({ message: 'User is inactive.' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const payload = {
            userId: user.id,
            accountType: 'PERSONAL'
        };

        res.json({
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                accountType: 'PERSONAL'
            },
            token: generateToken(payload)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { register, login };
