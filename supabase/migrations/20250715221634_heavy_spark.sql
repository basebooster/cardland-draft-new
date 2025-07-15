/*
  # Complete Cardland Draft Database Schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text, not null)
      - `name` (text, nullable)
      - `role` (text, default 'user', check constraint for 'admin'/'user')
      - `created_at` (timestamp with time zone, default now())
    
    - `drafts`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `description` (text, nullable)
      - `start_time` (timestamp with time zone, not null)
      - `created_by` (uuid, references users.id)
      - `auto_pick_order` (text array, nullable)
      - `status` (text, default 'pending', check constraint)
      - `timer_minutes` (integer, default 5)
      - `created_at` (timestamp with time zone, default now())
    
    - `participants`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users.id)
      - `draft_id` (uuid, references drafts.id)
      - `pick_order` (integer, not null)
      - `status` (text, default 'waiting', check constraint)
      - `created_at` (timestamp with time zone, default now())
    
    - `selections`
      - `id` (uuid, primary key)
      - `draft_id` (uuid, references drafts.id)
      - `name` (text, not null)
      - `image_url` (text, nullable)
      - `is_taken` (boolean, default false)
      - `fallback_order` (integer, nullable)
      - `created_at` (timestamp with time zone, default now())
    
    - `picks`
      - `id` (uuid, primary key)
      - `draft_id` (uuid, references drafts.id)
      - `user_id` (uuid, references users.id)
      - `selection_id` (uuid, references selections.id)
      - `round` (integer, not null)
      - `timestamp` (timestamp with time zone, default now())
      - `is_auto_pick` (boolean, default false)

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for each table
    - Users can read/write their own data
    - Authenticated users can read drafts and participate
    - Only admins can create/modify drafts
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text,
  role text DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at timestamptz DEFAULT now()
);

-- Create drafts table
CREATE TABLE IF NOT EXISTS drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  start_time timestamptz NOT NULL,
  created_by uuid REFERENCES users(id) ON DELETE CASCADE,
  auto_pick_order text[],
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed')),
  timer_minutes integer DEFAULT 5,
  created_at timestamptz DEFAULT now()
);

-- Create participants table
CREATE TABLE IF NOT EXISTS participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  draft_id uuid REFERENCES drafts(id) ON DELETE CASCADE,
  pick_order integer NOT NULL,
  status text DEFAULT 'waiting' CHECK (status IN ('waiting', 'picking', 'completed')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, draft_id),
  UNIQUE(draft_id, pick_order)
);

-- Create selections table
CREATE TABLE IF NOT EXISTS selections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id uuid REFERENCES drafts(id) ON DELETE CASCADE,
  name text NOT NULL,
  image_url text,
  is_taken boolean DEFAULT false,
  fallback_order integer,
  created_at timestamptz DEFAULT now()
);

-- Create picks table
CREATE TABLE IF NOT EXISTS picks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id uuid REFERENCES drafts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  selection_id uuid REFERENCES selections(id) ON DELETE CASCADE,
  round integer NOT NULL,
  timestamp timestamptz DEFAULT now(),
  is_auto_pick boolean DEFAULT false,
  UNIQUE(draft_id, selection_id)
);

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE picks ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can insert own data"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Drafts table policies
CREATE POLICY "Anyone can read drafts"
  ON drafts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can create drafts"
  ON drafts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update drafts"
  ON drafts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete drafts"
  ON drafts
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Participants table policies
CREATE POLICY "Anyone can read participants"
  ON participants
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage participants"
  ON participants
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can update own participant status"
  ON participants
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Selections table policies
CREATE POLICY "Anyone can read selections"
  ON selections
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage selections"
  ON selections
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Participants can update selections during draft"
  ON selections
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM participants p
      JOIN drafts d ON p.draft_id = d.id
      WHERE p.user_id = auth.uid() 
      AND p.draft_id = draft_id
      AND d.status = 'active'
    )
  );

-- Picks table policies
CREATE POLICY "Anyone can read picks"
  ON picks
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Participants can create picks"
  ON picks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM participants p
      WHERE p.user_id = auth.uid() AND p.draft_id = draft_id
    )
  );

CREATE POLICY "Admins can manage picks"
  ON picks
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_drafts_status ON drafts(status);
CREATE INDEX IF NOT EXISTS idx_drafts_created_by ON drafts(created_by);
CREATE INDEX IF NOT EXISTS idx_participants_draft_id ON participants(draft_id);
CREATE INDEX IF NOT EXISTS idx_participants_user_id ON participants(user_id);
CREATE INDEX IF NOT EXISTS idx_selections_draft_id ON selections(draft_id);
CREATE INDEX IF NOT EXISTS idx_picks_draft_id ON picks(draft_id);
CREATE INDEX IF NOT EXISTS idx_picks_user_id ON picks(user_id);