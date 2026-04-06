# Supabase Database Setup

## 1. Install Supabase Package

Open PowerShell as Administrator and run:
```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then install the package:
```bash
npm install @supabase/supabase-js
```

## 2. Create Supabase Account

1. Go to https://supabase.com and sign up (free tier)
2. Click "New Project"
3. Enter project name: "furnace-production"
4. Set database password (save this!)
5. Choose region closest to you
6. Wait for project creation (~2 minutes)

## 3. Get API Keys

In your Supabase dashboard:
1. Go to Project Settings → API
2. Copy "Project URL" → paste in `.env.local` as `NEXT_PUBLIC_SUPABASE_URL`
3. Copy "anon public" key → paste in `.env.local` as `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 4. Create Database Tables

1. In Supabase dashboard, go to SQL Editor
2. Click "New Query"
3. Copy contents from `supabase_schema.sql`
4. Run the SQL

## 5. Setup Environment Variables

Copy `.env.local.example` to `.env.local`:
```bash
copy .env.local.example .env.local
```

Fill in your actual values:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## Tables Created

- `production_records` - Stores all batch records with costs and calculations
- `fuel_entries` - Stores fuel usage linked to each record

## Free Tier Limits

- 500MB database storage
- 2GB bandwidth/month
- Unlimited API requests
- 50,000 realtime connections
