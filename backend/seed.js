require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

const seedData = async () => {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || '127.0.0.1',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'root',
            multipleStatements: true
        });

        console.log('Connecting to database...');

        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        console.log('Running schema.sql...');
        await connection.query(schema);
        await connection.query('USE room_expense_manager');

        console.log('Seeding mock data for Room A (VSB Boys Room)...');

        // 1. Create Room A
        const [roomResult] = await connection.query(`
            INSERT INTO rooms (room_code, room_name, invite_code) 
            VALUES ('RM7K4P2X', 'VSB Boys Room', '8FQ29K')
        `);
        const roomId = roomResult.insertId;

        // 2. Create Members for Room A
        const membersData = [
            ['Naveen', roomId],
            ['Kadhir', roomId],
            ['Navi', roomId],
            ['Karthik', roomId]
        ];
        
        const memberIds = {};
        for (const [name, rId] of membersData) {
            const [result] = await connection.query('INSERT INTO members (name, room_id) VALUES (?, ?)', [name, rId]);
            memberIds[name] = result.insertId;
        }

        // 3. Create Users for Room A
        const salt = await bcrypt.genSalt(10);
        
        const usersData = [
            [memberIds['Naveen'], 'naveen', 'Naveen@123', 'ADMIN'],
            [memberIds['Kadhir'], 'kadhir', 'Kadhir@123', 'MEMBER'],
            [memberIds['Navi'], 'navi', 'Navi@123', 'MEMBER'],
            [memberIds['Karthik'], 'karthik', 'Karthik@123', 'MEMBER']
        ];

        for (const [mId, username, password, role] of usersData) {
            const passwordHash = await bcrypt.hash(password, salt);
            const [result] = await connection.query('INSERT INTO users (member_id, username, password_hash, role) VALUES (?, ?, ?, ?)', [mId, username, passwordHash, role]);
            if (role === 'ADMIN') {
                await connection.query('UPDATE rooms SET created_by = ? WHERE id = ?', [result.insertId, roomId]);
            }
        }

        console.log('Seeding mock data for Room B (Isolation Test)...');
        // Create Room B
        const [roomBResult] = await connection.query(`
            INSERT INTO rooms (room_code, room_name, invite_code) 
            VALUES ('RMTEST99', 'Test Room B', '123456')
        `);
        const roomBId = roomBResult.insertId;

        const [memberBResult] = await connection.query('INSERT INTO members (name, room_id) VALUES (?, ?)', ['TestUser', roomBId]);
        const testUserPasswordHash = await bcrypt.hash('Test@123', salt);
        await connection.query('INSERT INTO users (member_id, username, password_hash, role) VALUES (?, ?, ?, ?)', [memberBResult.insertId, 'testuser', testUserPasswordHash, 'ADMIN']);
        await connection.query('UPDATE rooms SET created_by = ? WHERE id = ?', [memberBResult.insertId, roomBId]);

        // Add an expense to Room B
        const today = new Date().toISOString().split('T')[0];
        const [expB] = await connection.query(
            'INSERT INTO expenses (room_id, paid_by, category, expense_date, total_amount, note) VALUES (?, ?, ?, ?, ?, ?)',
            [roomBId, memberBResult.insertId, 'Food', today, 500, 'Room B Secret Expense']
        );
        await connection.query('INSERT INTO expense_items (expense_id, item_name, amount) VALUES (?, ?, ?)', [expB.insertId, 'Food', 500]);
        await connection.query('INSERT INTO expense_participants (expense_id, member_id, share_amount) VALUES (?, ?, ?)', [expB.insertId, memberBResult.insertId, 500]);

        console.log('Database seeded successfully with explicit demo credentials!');
    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        if (connection) await connection.end();
        process.exit();
    }
};

seedData();
