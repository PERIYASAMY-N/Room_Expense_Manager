const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

const registerUser = async (req, res, next) => {
    try {
        const { username, fullName, password, phone } = req.body;

        if (!username || !fullName || !password) {
            res.status(400);
            throw new Error('Please add all required fields');
        }

        // Check if user exists
        const [existingUsers] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        if (existingUsers.length > 0) {
            res.status(400);
            throw new Error('Username already exists');
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const [result] = await pool.query(
            'INSERT INTO users (username, full_name, password_hash, phone) VALUES (?, ?, ?, ?)',
            [username, fullName, hashedPassword, phone || null]
        );

        if (result.insertId) {
            res.status(201).json({
                id: result.insertId,
                username,
                fullName,
                token: generateToken(result.insertId)
            });
        } else {
            res.status(400);
            throw new Error('Invalid user data');
        }
    } catch (error) {
        next(error);
    }
};

const loginUser = async (req, res, next) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            res.status(400);
            throw new Error('Please provide username and password');
        }

        // Check for user
        const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        if (users.length === 0) {
            res.status(401);
            throw new Error('Invalid credentials');
        }

        const user = users[0];

        // Check password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (isMatch) {
            res.json({
                id: user.id,
                username: user.username,
                fullName: user.full_name,
                token: generateToken(user.id)
            });
        } else {
            res.status(401);
            throw new Error('Invalid credentials');
        }
    } catch (error) {
        next(error);
    }
};

const getMe = async (req, res, next) => {
    try {
        const [users] = await pool.query(
            'SELECT id, username, full_name, phone, created_at FROM users WHERE id = ?',
            [req.user.userId]
        );

        if (users.length === 0) {
            res.status(404);
            throw new Error('User not found');
        }

        res.json(users[0]);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    registerUser,
    loginUser,
    getMe
};
