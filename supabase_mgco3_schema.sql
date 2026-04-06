-- MGCO3 Stock Management Table
-- Run this in Supabase SQL Editor

-- Create mgco3_stock table
CREATE TABLE IF NOT EXISTS mgco3_stock (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    stock_added DECIMAL(10,2) NOT NULL DEFAULT 0,
    stock_consumed DECIMAL(10,2) NOT NULL DEFAULT 0,
    balance DECIMAL(10,2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_mgco3_stock_date ON mgco3_stock(date);
CREATE INDEX IF NOT EXISTS idx_mgco3_stock_created_at ON mgco3_stock(created_at);

-- Enable Row Level Security
ALTER TABLE mgco3_stock ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (for demo purposes)
CREATE POLICY "Allow all operations on mgco3_stock"
    ON mgco3_stock FOR ALL
    USING (true)
    WITH CHECK (true);

-- Create function to auto-consume stock when production record is inserted
CREATE OR REPLACE FUNCTION auto_consume_mgco3_stock()
RETURNS TRIGGER AS $$
DECLARE
    current_balance DECIMAL(10,2);
BEGIN
    -- Calculate current balance
    SELECT COALESCE(SUM(stock_added) - SUM(stock_consumed), 0)
    INTO current_balance
    FROM mgco3_stock;
    
    -- Only insert consumption record if there's stock available
    IF current_balance >= NEW.material_input THEN
        INSERT INTO mgco3_stock (date, stock_added, stock_consumed, balance, notes)
        VALUES (
            NEW.date,
            0,
            NEW.material_input,
            current_balance - NEW.material_input,
            'Auto-consumed for Batch ' || NEW.batch_no
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-consume stock
DROP TRIGGER IF EXISTS trg_auto_consume_mgco3 ON production_records;
CREATE TRIGGER trg_auto_consume_mgco3
    AFTER INSERT ON production_records
    FOR EACH ROW
    EXECUTE FUNCTION auto_consume_mgco3_stock();
