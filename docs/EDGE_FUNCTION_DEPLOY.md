# Como Corrigir o Deploy da Edge Function

## Problema

O Supabase CLI está a procurar o ficheiro no caminho errado porque está linkado a outro projeto.

## Solução

### Passo 1: Inicializar o Supabase (se necessário)

Se ainda não tiveres inicializado o Supabase no projeto:

```bash
npx supabase init
```

### Passo 2: Linkar ao Projeto Correto

1. **Encontra o Project Reference ID:**
   - Vai ao Supabase Dashboard
   - Project Settings > General > Reference ID
   - Copia o ID (ex: `qkotmsdonlglwtrlqfja`)

2. **Linka o projeto:**
   ```bash
   npx supabase link --project-ref qkotmsdonlglwtrlqfja
   ```

   **Nota:** Se tiveres um alias no teu shell que redireciona `supabase` para outro projeto, usa `npx supabase` em vez de apenas `supabase`.

### Passo 3: Fazer Deploy da Função

```bash
npx supabase functions deploy run-automations
```

**✅ Deploy concluído com sucesso!**

### Opção 2: Deslinkar e Re-linkar

Se já estiveres linkado a outro projeto:

1. **Deslinka:**
   ```bash
   supabase unlink
   ```

2. **Linka ao projeto correto:**
   ```bash
   supabase link --project-ref SEU-PROJECT-REF
   ```

3. **Faz deploy:**
   ```bash
   supabase functions deploy run-automations
   ```

### Opção 3: Verificar o Link Atual

```bash
# Ver qual projeto está linkado
supabase projects list

# Ver detalhes do link atual
cat supabase/.temp/project-ref 2>/dev/null || echo "Not linked"
```

## Configurar Variáveis de Ambiente

Após o deploy, configura as secrets no Supabase Dashboard:

1. Vai a **Project Settings > Edge Functions > Secrets**
2. Adiciona:
   - `SUPABASE_URL`: `https://qkotmsdonlglwtrlqfja.supabase.co` (ou o teu URL)
   - `SUPABASE_SERVICE_ROLE_KEY`: A tua service role key (encontra em Project Settings > API)

## Testar a Função

```bash
# Via CLI
supabase functions invoke run-automations

# Via HTTP
curl -X POST \
  'https://qkotmsdonlglwtrlqfja.supabase.co/functions/v1/run-automations' \
  -H 'Authorization: Bearer SEU_ANON_KEY' \
  -H 'Content-Type: application/json'
```

## Troubleshooting

Se ainda der erro:

1. **Verifica que estás no diretório correto:**
   ```bash
   pwd
   # Deve mostrar: /Users/martimnicolau/crm nikufra
   ```

2. **Verifica que o ficheiro existe:**
   ```bash
   ls -la supabase/functions/run-automations/index.ts
   ```

3. **Tenta com debug:**
   ```bash
   supabase functions deploy run-automations --debug
   ```

4. **Verifica a versão do Supabase CLI:**
   ```bash
   supabase --version
   # Se for antiga, atualiza: npm install -g supabase@latest
   ```

