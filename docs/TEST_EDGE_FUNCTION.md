# Como Testar a Edge Function

## Problema: Erro 401 "Invalid JWT"

O erro 401 significa que a chave de autorização está incorreta ou em falta.

## Solução

### Opção 1: Usar o Script de Teste (Recomendado)

```bash
cd "/Users/martimnicolau/crm nikufra"
./scripts/test-automation-function.sh
```

Este script:
- Lê automaticamente as chaves do `.env`
- Testa a função com a chave correta
- Mostra o resultado formatado

### Opção 2: Testar Manualmente

1. **Obter a ANON_KEY do .env:**
   ```bash
   grep VITE_SUPABASE_ANON_KEY .env
   ```

2. **Testar a função:**
   ```bash
   curl -X POST \
     'https://qkotmsdonlglwtrlqfja.supabase.co/functions/v1/run-automations' \
     -H 'Authorization: Bearer TUA_ANON_KEY_AQUI' \
     -H 'Content-Type: application/json'
   ```

   **Substitui `TUA_ANON_KEY_AQUI`** pela chave do passo 1.

### Opção 3: Via Supabase CLI

```bash
cd "/Users/martimnicolau/crm nikufra"
npx supabase functions invoke run-automations
```

**Nota:** Este método pode não funcionar se não tiveres as variáveis de ambiente configuradas localmente.

## Obter as Chaves

### ANON_KEY (para testar via HTTP)

1. Vai ao Supabase Dashboard
2. Project Settings > API
3. Copia a chave **"anon"** ou **"public"**

### SERVICE_ROLE_KEY (para a Edge Function)

1. Vai ao Supabase Dashboard
2. Project Settings > API
3. Copia a chave **"service_role"** (⚠️ NUNCA exponhas esta chave no frontend!)

## Configurar Secrets na Edge Function

A Edge Function precisa das seguintes secrets configuradas:

1. Vai ao Supabase Dashboard
2. Project Settings > Edge Functions > Secrets
3. Adiciona:
   - `SUPABASE_URL`: `https://qkotmsdonlglwtrlqfja.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY`: A tua service_role key

## Ver Logs da Função

```bash
npx supabase functions logs run-automations
```

## Verificar se a Função Está Deployada

```bash
npx supabase functions list
```

Deves ver `run-automations` na lista.

## Troubleshooting

### Erro 401 (Invalid JWT)
- ✅ Verifica que estás a usar a **ANON_KEY** (não a SERVICE_ROLE_KEY)
- ✅ Verifica que a chave está correta (sem espaços, aspas, etc.)
- ✅ Verifica que o header está correto: `Authorization: Bearer KEY`

### Erro 500 (Internal Server Error)
- ✅ Verifica que as secrets estão configuradas na Edge Function
- ✅ Verifica os logs: `npx supabase functions logs run-automations`
- ✅ Verifica que a tabela `settings` existe e tem dados

### Função não encontrada
- ✅ Verifica que a função está deployada: `npx supabase functions list`
- ✅ Faz deploy novamente: `npx supabase functions deploy run-automations`

