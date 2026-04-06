-- Supabase Database Schema for Production Report
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql/new

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Production Records Table
CREATE TABLE IF NOT EXISTS production_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    batch_no TEXT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    total_hours DECIMAL(10,2) NOT NULL DEFAULT 0,
    material_input DECIMAL(10,2) NOT NULL DEFAULT 0,
    output_after_cooking DECIMAL(10,2) NOT NULL DEFAULT 0,
    yield_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
    labour_hours DECIMAL(5,2) NOT NULL DEFAULT 0,
    number_of_labour INTEGER NOT NULL DEFAULT 1,
    labour_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    shifting_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    cost_per_kg DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fuel Entries Table
CREATE TABLE IF NOT EXISTS fuel_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    record_id UUID REFERENCES production_records(id) ON DELETE CASCADE,
    fuel_type TEXT CHECK (fuel_type IN ('wood', 'pellet', 'fibre', 'wood-husk')),
    fuel_weight DECIMAL(10,2) NOT NULL DEFAULT 0,
    fuel_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_production_records_date ON production_records(date);
CREATE INDEX IF NOT EXISTS idx_production_records_batch_no ON production_records(batch_no);
CREATE INDEX IF NOT EXISTS idx_fuel_entries_record_id ON fuel_entries(record_id);

-- Enable Row Level Security (RLS)
ALTER TABLE production_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (for demo purposes)
-- In production, you should restrict this to authenticated users
CREATE POLICY "Allow all operations on production_records" 
    ON production_records FOR ALL 
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "Allow all operations on fuel_entries" 
    ON fuel_entries FOR ALL 
    USING (true) 
    WITH CHECK (true);
