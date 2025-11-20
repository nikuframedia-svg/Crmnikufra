-- Migration: Create notifications table
-- Description: System for internal notifications linked to entities (leads, tasks, projects, etc.)

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('task_assigned', 'lead_assigned', 'status_change', 'comment')),
  message text NOT NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('lead', 'contact', 'company', 'project', 'task', 'document')),
  entity_id uuid NOT NULL,
  read_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_profile_id_created_at 
  ON notifications(user_profile_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_profile_id_read_at 
  ON notifications(user_profile_id, read_at) 
  WHERE read_at IS NULL;

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_profile_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_profile_id)
  WITH CHECK (auth.uid() = user_profile_id);

-- Allow system/service role to create notifications (for future triggers)
CREATE POLICY "Authenticated users can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);


