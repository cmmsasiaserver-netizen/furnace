import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for database tables
export interface ProductionRecord {
  id: string
  date: string
  batch_no: string
  start_time: string
  end_time: string
  total_hours: number
  material_input: number
  output_after_cooking: number
  yield_percentage: number
  labour_hours: number
  number_of_labour: number
  labour_cost: number
  shifting_cost: number
  total_cost: number
  cost_per_kg: number
  created_at?: string
}

export interface FuelEntry {
  id: string
  record_id: string
  fuel_type: 'wood' | 'pellet' | 'fibre' | 'wood-husk'
  fuel_weight: number
  fuel_cost: number
  created_at?: string
}
