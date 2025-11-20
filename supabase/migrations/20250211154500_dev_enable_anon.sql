-- Allow anonymous role to interact with core tables in local/dev environment
-- NOTE: remove or tighten these policies before production!

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tasks' AND policyname='Dev anon select tasks') THEN
    EXECUTE 'CREATE POLICY "Dev anon select tasks" ON public.tasks FOR SELECT TO anon USING (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tasks' AND policyname='Dev anon insert tasks') THEN
    EXECUTE 'CREATE POLICY "Dev anon insert tasks" ON public.tasks FOR INSERT TO anon WITH CHECK (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tasks' AND policyname='Dev anon update tasks') THEN
    EXECUTE 'CREATE POLICY "Dev anon update tasks" ON public.tasks FOR UPDATE TO anon USING (true) WITH CHECK (true)';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='projects' AND policyname='Dev anon select projects') THEN
    EXECUTE 'CREATE POLICY "Dev anon select projects" ON public.projects FOR SELECT TO anon USING (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='projects' AND policyname='Dev anon insert projects') THEN
    EXECUTE 'CREATE POLICY "Dev anon insert projects" ON public.projects FOR INSERT TO anon WITH CHECK (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='projects' AND policyname='Dev anon update projects') THEN
    EXECUTE 'CREATE POLICY "Dev anon update projects" ON public.projects FOR UPDATE TO anon USING (true) WITH CHECK (true)';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='leads' AND policyname='Dev anon select leads') THEN
    EXECUTE 'CREATE POLICY "Dev anon select leads" ON public.leads FOR SELECT TO anon USING (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='leads' AND policyname='Dev anon insert leads') THEN
    EXECUTE 'CREATE POLICY "Dev anon insert leads" ON public.leads FOR INSERT TO anon WITH CHECK (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='leads' AND policyname='Dev anon update leads') THEN
    EXECUTE 'CREATE POLICY "Dev anon update leads" ON public.leads FOR UPDATE TO anon USING (true) WITH CHECK (true)';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='contacts' AND policyname='Dev anon select contacts') THEN
    EXECUTE 'CREATE POLICY "Dev anon select contacts" ON public.contacts FOR SELECT TO anon USING (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='contacts' AND policyname='Dev anon insert contacts') THEN
    EXECUTE 'CREATE POLICY "Dev anon insert contacts" ON public.contacts FOR INSERT TO anon WITH CHECK (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='contacts' AND policyname='Dev anon update contacts') THEN
    EXECUTE 'CREATE POLICY "Dev anon update contacts" ON public.contacts FOR UPDATE TO anon USING (true) WITH CHECK (true)';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='companies' AND policyname='Dev anon select companies') THEN
    EXECUTE 'CREATE POLICY "Dev anon select companies" ON public.companies FOR SELECT TO anon USING (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='companies' AND policyname='Dev anon insert companies') THEN
    EXECUTE 'CREATE POLICY "Dev anon insert companies" ON public.companies FOR INSERT TO anon WITH CHECK (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='companies' AND policyname='Dev anon update companies') THEN
    EXECUTE 'CREATE POLICY "Dev anon update companies" ON public.companies FOR UPDATE TO anon USING (true) WITH CHECK (true)';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='documents' AND policyname='Dev anon select documents') THEN
    EXECUTE 'CREATE POLICY "Dev anon select documents" ON public.documents FOR SELECT TO anon USING (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='documents' AND policyname='Dev anon insert documents') THEN
    EXECUTE 'CREATE POLICY "Dev anon insert documents" ON public.documents FOR INSERT TO anon WITH CHECK (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='documents' AND policyname='Dev anon update documents') THEN
    EXECUTE 'CREATE POLICY "Dev anon update documents" ON public.documents FOR UPDATE TO anon USING (true) WITH CHECK (true)';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='entity_activities' AND policyname='Dev anon select entity activities') THEN
    EXECUTE 'CREATE POLICY "Dev anon select entity activities" ON public.entity_activities FOR SELECT TO anon USING (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='entity_activities' AND policyname='Dev anon insert entity activities') THEN
    EXECUTE 'CREATE POLICY "Dev anon insert entity activities" ON public.entity_activities FOR INSERT TO anon WITH CHECK (true)';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='notes' AND policyname='Dev anon select notes') THEN
    EXECUTE 'CREATE POLICY "Dev anon select notes" ON public.notes FOR SELECT TO anon USING (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='notes' AND policyname='Dev anon insert notes') THEN
    EXECUTE 'CREATE POLICY "Dev anon insert notes" ON public.notes FOR INSERT TO anon WITH CHECK (true)';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='chat_channels' AND policyname='Dev anon select chat channels') THEN
    EXECUTE 'CREATE POLICY "Dev anon select chat channels" ON public.chat_channels FOR SELECT TO anon USING (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='chat_channels' AND policyname='Dev anon insert chat channels') THEN
    EXECUTE 'CREATE POLICY "Dev anon insert chat channels" ON public.chat_channels FOR INSERT TO anon WITH CHECK (true)';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='chat_messages' AND policyname='Dev anon select chat messages') THEN
    EXECUTE 'CREATE POLICY "Dev anon select chat messages" ON public.chat_messages FOR SELECT TO anon USING (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='chat_messages' AND policyname='Dev anon insert chat messages') THEN
    EXECUTE 'CREATE POLICY "Dev anon insert chat messages" ON public.chat_messages FOR INSERT TO anon WITH CHECK (true)';
  END IF;
END $$;


