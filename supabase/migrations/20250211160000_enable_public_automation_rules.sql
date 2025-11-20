-- Allow anon (public) read access to automation rules so dashboard/config UI can list them
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'automation_rules'
      AND policyname = 'Dev anon select automation_rules'
  ) THEN
    EXECUTE 'CREATE POLICY "Dev anon select automation_rules" ON public.automation_rules FOR SELECT TO anon USING (true)';
  END IF;
END $$;


