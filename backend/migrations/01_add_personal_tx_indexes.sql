-- Add indexes for user_id, transaction_date, type on personal_transactions table
CREATE INDEX idx_user_id ON personal_transactions(user_id);
CREATE INDEX idx_transaction_date ON personal_transactions(transaction_date);
CREATE INDEX idx_type ON personal_transactions(type);
