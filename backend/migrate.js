const db = require('./src/config/db');

async function runMigration() {
    try {
        console.log("Adding phone_number column to users table...");
        await db.query('ALTER TABLE users ADD COLUMN phone_number VARCHAR(20) DEFAULT NULL');
        console.log("Migration successful!");
        process.exit(0);
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log("Column already exists. Skipping.");
            process.exit(0);
        } else {
            console.error("Migration failed:", e.message);
            process.exit(1);
        }
    }
}
runMigration();
