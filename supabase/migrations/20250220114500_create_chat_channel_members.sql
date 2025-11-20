-- Create membership table for private chat channels and seed default memberships
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'chat_channel_members'
  ) THEN
    CREATE TABLE public.chat_channel_members (
      id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      channel_id uuid NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
      profile_id uuid NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE UNIQUE INDEX chat_channel_members_channel_profile_idx
      ON public.chat_channel_members (channel_id, profile_id);
  END IF;
END $$;

-- Seed memberships for default channels if they exist
INSERT INTO public.chat_channel_members (channel_id, profile_id)
VALUES
  ('11111111-2222-4333-8444-aaaaaaaaaaa0', 'd0d54648-1001-4001-a001-000000000001'),
  ('11111111-2222-4333-8444-aaaaaaaaaaa0', 'd0d54648-1002-4002-a002-000000000002'),
  ('11111111-2222-4333-8444-aaaaaaaaaaa0', 'd0d54648-1003-4003-a003-000000000003'),
  ('11111111-2222-4333-8444-aaaaaaaaaaa0', 'd0d54648-1004-4004-a004-000000000004'),
  ('11111111-2222-4333-8444-aaaaaaaaaaa1', 'd0d54648-1001-4001-a001-000000000001'),
  ('11111111-2222-4333-8444-aaaaaaaaaaa1', 'd0d54648-1002-4002-a002-000000000002'),
  ('11111111-2222-4333-8444-aaaaaaaaaaa2', 'd0d54648-1001-4001-a001-000000000001'),
  ('11111111-2222-4333-8444-aaaaaaaaaaa2', 'd0d54648-1002-4002-a002-000000000002'),
  ('11111111-2222-4333-8444-aaaaaaaaaaa2', 'd0d54648-1003-4003-a003-000000000003')
ON CONFLICT DO NOTHING;


