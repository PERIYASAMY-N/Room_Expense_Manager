const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// In production (Aiven), SSL is required.
// The CA cert can be supplied as a file path (local/Render) or as a raw string (env var).
let ssl = undefined;

if (process.env.DB_SSL === 'true') {
    if (process.env.DB_SSL_CA) {
        // Render: CA cert stored as an environment variable (raw PEM string)
        ssl = { ca: process.env.DB_SSL_CA };
    } else {
        // Local: CA cert stored as a file
        const certPath = path.join(__dirname, '../../certs/aiven-ca.crt');
        if (fs.existsSync(certPath)) {
            ssl = { ca: fs.readFileSync(certPath) };
        }
    }
}

const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'room_expense_manager',
    port: process.env.DB_PORT || 3306,
    ssl,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool;
