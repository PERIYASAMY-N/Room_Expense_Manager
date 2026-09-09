const db = require('./src/config/db');

async function runMigration() {
    try {
        console.log("Starting personal accounts migration...");
        
        // 1. Make username nullable
        console.log("Modifying username column to be nullable...");
        try {
            await db.query('ALTER TABLE users MODIFY username VARCHAR(100) NULL');
        } catch (e) {
            console.log("Error modifying username, it might already be correct:", e.message);
        }

        // 2. Add email
        console.log("Adding email column...");
        try {
            await db.query('ALTER TABLE users ADD COLUMN email VARCHAR(255) UNIQUE NULL');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log("email column already exists.");
            else throw e;
        }

        // 3. Add full_name
        console.log("Adding full_name column...");
        try {
            await db.query('ALTER TABLE users ADD COLUMN full_name VARCHAR(100) NULL');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log("full_name column already exists.");
            else throw e;
        }

        // 4. Add account_type
        console.log("Adding account_type column...");
        try {
            await db.query("ALTER TABLE users ADD COLUMN account_type VARCHAR(20) DEFAULT 'ROOM'");
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log("account_type column already exists.");
            else throw e;
        }

        console.log("Migration successful!");
        process.exit(0);
    } catch (e) {
        console.error("Migration failed:", e.message);
        process.exit(1);
    }
}

runMigration();
