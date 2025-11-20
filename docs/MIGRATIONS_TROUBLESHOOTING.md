# Como Resolver Problemas de Migrations

## Problema

Há uma migration remota (`20250929103049`) que não existe localmente, causando conflito.

## Solução

### Opção 1: Marcar a Migration Remota como Revertida (Recomendado)

Se a migration remota não é importante ou já foi substituída por outras:

```bash
cd "/Users/martimnicolau/crm nikufra"
npx supabase migration repair --status reverted 20250929103049
```

Depois, aplica as migrations locais que faltam:

```bash
npx supabase db push
```

### Opção 2: Fazer Pull da Migration Remota

Se quiseres manter a migration remota:

1. **Faz pull da migration:**
   ```bash
   npx supabase db pull
   ```

2. **Isto vai criar um ficheiro** `supabase/migrations/20250929103049_*.sql`

3. **Depois aplica as migrations locais:**
   ```bash
   npx supabase db push
   ```

### Opção 3: Aplicar Manualmente via Dashboard

Se preferires aplicar manualmente:

1. Vai ao Supabase Dashboard > SQL Editor
2. Copia o conteúdo de cada migration local que falta:
   - `20250120000000_add_notes_and_activities_support.sql`
   - `20251115150951_create_unified_platform_schema.sql`
   - `20251119153933_disable_rls_for_public_access.sql`
   - `20251120145228_create_notifications.sql`
   - `20251120150000_create_settings.sql`
3. Executa cada uma no SQL Editor
4. Depois marca a migration remota como revertida:
   ```bash
   npx supabase migration repair --status reverted 20250929103049
   ```

## Verificar Estado das Migrations

```bash
npx supabase migration list
```

Isto mostra quais migrations estão aplicadas localmente vs remotamente.

## Comandos Úteis

- **Ver migrations:** `npx supabase migration list`
- **Aplicar migrations locais:** `npx supabase db push`
- **Fazer pull de migrations remotas:** `npx supabase db pull`
- **Reparar migration:** `npx supabase migration repair --status <status> <version>`

## Status Possíveis

- `applied` - Migration foi aplicada
- `reverted` - Migration foi revertida/removida
- `superseded` - Migration foi substituída por outra


