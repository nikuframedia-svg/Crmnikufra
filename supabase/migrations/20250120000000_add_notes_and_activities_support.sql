-- Migration: Add notes table and update activities table structure
-- Date: 2025-01-XX

-- Ensure activities table has the correct structure
-- (If it already exists with different structure, this will need manual adjustment)

-- Create notes table
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type text NOT NULL CHECK (entity_type IN ('lead', 'contact', 'company', 'project')),
  entity_id uuid NOT NULL,
  author_profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notes_entity ON notes(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);

-- Enable RLS
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notes
CREATE POLICY "Authenticated users can view notes"
  ON notes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create notes"
  ON notes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_profile_id);

CREATE POLICY "Users can update own notes"
  ON notes FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_profile_id)
  WITH CHECK (auth.uid() = author_profile_id);

CREATE POLICY "Users can delete own notes"
  ON notes FOR DELETE
  TO authenticated
  USING (auth.uid() = author_profile_id);

-- Create entity_activities table for timeline/history tracking
-- This is separate from the existing 'activities' table which is for contact/lead specific activities
CREATE TABLE IF NOT EXISTS entity_activities (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type text NOT NULL CHECK (entity_type IN ('lead', 'contact', 'company', 'project')),
  entity_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('note', 'status_change', 'task_created', 'document_added', 'manual')),
  author_profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for entity_activities
CREATE INDEX IF NOT EXISTS idx_entity_activities_entity ON entity_activities(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_activities_created_at ON entity_activities(created_at DESC);

-- Enable RLS
ALTER TABLE entity_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for entity_activities
CREATE POLICY "Authenticated users can view entity_activities"
  ON entity_activities FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create entity_activities"
  ON entity_activities FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_profile_id);

-- Add lead_id to tasks if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'lead_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN lead_id uuid REFERENCES leads(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add lead_id to documents if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documents' AND column_name = 'lead_id'
  ) THEN
    ALTER TABLE documents ADD COLUMN lead_id uuid REFERENCES leads(id) ON DELETE SET NULL;
  END IF;
END $$;

