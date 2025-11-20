# Aplicar Migrations Manualmente (Solução Alternativa)

Como o Supabase CLI está com problemas de login, podes aplicar as migrations diretamente no Dashboard.

## Passo 1: Aceder ao SQL Editor

1. Vai a: https://supabase.com/dashboard/project/qkotmsdonlglwtrlqfja
2. Clica em **SQL Editor** no menu lateral
3. Clica em **New Query**

## Passo 2: Aplicar Migration de Notifications

Copia e executa este SQL:

```sql
-- Migration: Create notifications table
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

CREATE INDEX IF NOT EXISTS idx_notifications_user_profile_id_created_at 
  ON notifications(user_profile_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_profile_id_read_at 
  ON notifications(user_profile_id, read_at) 
  WHERE read_at IS NULL;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_profile_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_profile_id)
  WITH CHECK (auth.uid() = user_profile_id);

CREATE POLICY "Authenticated users can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);
```

## Passo 3: Aplicar Migration de Settings

Copia e executa este SQL:

```sql
-- Migration: Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  description text,
  category text DEFAULT 'automation',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

INSERT INTO settings (key, value, description, category) VALUES
  ('automation.stale_lead_days', '7', 'Number of days without activity before a contacted lead is considered stale', 'automation'),
  ('automation.stale_project_days', '14', 'Number of days without tasks before an active project is considered stale', 'automation')
ON CONFLICT (key) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
CREATE INDEX IF NOT EXISTS idx_settings_category ON settings(category);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view settings"
  ON settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can update settings"
  ON settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert settings"
  ON settings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE OR REPLACE FUNCTION update_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_settings_updated_at();
```

## Passo 4: Marcar Migration Remota como Revertida (Opcional)

Se quiseres sincronizar o histórico de migrations, executa:

```sql
-- Marcar migration remota como revertida no histórico
INSERT INTO supabase_migrations.schema_migrations (version, name, inserted_at)
VALUES ('20250929103049', 'reverted_remote_migration', now())
ON CONFLICT (version) DO UPDATE 
SET name = 'reverted_remote_migration';
```

## Verificar se Funcionou

Depois de executar os SQLs, verifica:

1. **Verifica que as tabelas foram criadas:**
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('notifications', 'settings');
   ```

2. **Verifica que os dados foram inseridos:**
   ```sql
   SELECT * FROM settings;
   ```

## Vantagens desta Abordagem

- ✅ Não depende do CLI
- ✅ Mais rápido e direto
- ✅ Podes ver erros imediatamente
- ✅ Funciona mesmo com problemas de autenticação

## Depois de Aplicar

As migrations estão aplicadas! Podes continuar a usar a aplicação normalmente. O problema do CLI pode ser resolvido depois quando necessário.


