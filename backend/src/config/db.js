const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'room_expense_manager',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

// Test connection
pool.getConnection()
    .then(connection => {
        console.log('Successfully connected to the database.');
        connection.release();
    })
    .catch(err => {
        console.error('Database connection failed:', err.message);
    });

module.exports = pool;
