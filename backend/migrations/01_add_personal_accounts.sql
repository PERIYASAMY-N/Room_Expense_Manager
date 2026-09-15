-- Add email and account_type to users table
ALTER TABLE users ADD COLUMN email VARCHAR(255) UNIQUE NULL AFTER username;
ALTER TABLE users ADD COLUMN account_type VARCHAR(20) DEFAULT 'ROOM' AFTER role;
ALTER TABLE users MODIFY username VARCHAR(100) NULL UNIQUE; -- Personal users might not have a username, just an email

-- Add indexes for personal_transactions
CREATE INDEX idx_user_id ON personal_transactions(user_id);
CREATE INDEX idx_transaction_date ON personal_transactions(transaction_date);
CREATE INDEX idx_type ON personal_transactions(type);
