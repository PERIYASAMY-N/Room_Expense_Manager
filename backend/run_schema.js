const fs = require('fs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function runSchema() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'root',
        multipleStatements: true
    });

    try {
        const schema = fs.readFileSync('schema.sql', 'utf8');
        await connection.query(schema);
        console.log('Schema executed successfully.');
    } catch (err) {
        console.error('Error executing schema:', err);
    } finally {
        await connection.end();
    }
}

runSchema();
