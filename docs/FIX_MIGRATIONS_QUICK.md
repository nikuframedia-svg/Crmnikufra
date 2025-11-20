# Solução Rápida para Problema de Migrations

## O Problema

O comando `npx supabase migration list` está a travar porque há uma migration remota (`20250929103049`) que não existe localmente, causando conflito de sincronização.

## Solução Rápida (Recomendada)

### Opção 1: Usar o Script Automático

```bash
cd "/Users/martimnicolau/crm nikufra"
./scripts/fix-migrations.sh
```

Este script vai:
- Verificar o estado
- Oferecer opções para resolver
- Aplicar a correção automaticamente

### Opção 2: Resolver Manualmente

**Passo 1: Marcar a migration remota como revertida**

```bash
cd "/Users/martimnicolau/crm nikufra"
npx supabase migration repair --status reverted 20250929103049
```

**Passo 2: Aplicar as migrations locais que faltam**

```bash
npx supabase db push
```

### Opção 3: Aplicar via Dashboard (Mais Seguro)

Se os comandos continuarem a travar:

1. **Vai ao Supabase Dashboard > SQL Editor**

2. **Aplica manualmente as migrations que faltam:**

   - Abre `supabase/migrations/20250120000000_add_notes_and_activities_support.sql`
   - Copia o conteúdo e executa no SQL Editor
   
   - Repete para:
     - `20251115150951_create_unified_platform_schema.sql` (se ainda não aplicada)
     - `20251119153933_disable_rls_for_public_access.sql` (se ainda não aplicada)
     - `20251120145228_create_notifications.sql`
     - `20251120150000_create_settings.sql`

3. **Depois, marca a migration remota como revertida:**

   ```bash
   npx supabase migration repair --status reverted 20250929103049
   ```

## Verificar se Funcionou

Depois de resolver, testa:

```bash
npx supabase migration list
```

Deve mostrar todas as migrations sincronizadas.

## Se Continuar a Travar

Se o comando continuar a travar, pode ser um problema de conexão:

1. **Verifica a conexão:**
   ```bash
   npx supabase projects list
   ```

2. **Tenta com debug:**
   ```bash
   npx supabase migration list --debug
   ```

3. **Ou usa o Dashboard:**
   - Vai a Supabase Dashboard > Database > Migrations
   - Vê o estado visualmente lá


