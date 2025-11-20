# Automações - Documentação

Este documento explica como configurar e usar o sistema de automações do CRM Nikufra.

## 1. Tabela de Settings

A tabela `settings` armazena configurações do sistema, incluindo parâmetros de automação.

### Estrutura

- `key`: Chave única da configuração (ex: `automation.stale_lead_days`)
- `value`: Valor da configuração (string)
- `description`: Descrição da configuração
- `category`: Categoria (ex: `automation`)

### Configurações Padrão

- `automation.stale_lead_days`: 7 dias
- `automation.stale_project_days`: 14 dias

### Acesso

- **Leitura**: Todos os utilizadores autenticados
- **Escrita**: Apenas administradores (role = 'admin')

## 2. Edge Function

A Edge Function `run-automations` executa as automações serverless no Supabase.

### Deploy

```bash
# Instalar Supabase CLI (se ainda não tiveres)
npm install -g supabase

# Login no Supabase
supabase login

# Link ao projeto
supabase link --project-ref seu-project-ref

# Deploy da função
supabase functions deploy run-automations
```

### Variáveis de Ambiente

A Edge Function precisa das seguintes variáveis no Supabase Dashboard:

1. Vai a **Project Settings > Edge Functions > Secrets**
2. Adiciona:
   - `SUPABASE_URL`: URL do teu projeto Supabase
   - `SUPABASE_SERVICE_ROLE_KEY`: Service Role Key (encontra em Project Settings > API)

### Executar Manualmente

```bash
# Via Supabase CLI
supabase functions invoke run-automations

# Via HTTP (com autenticação)
curl -X POST \
  'https://seu-project-ref.supabase.co/functions/v1/run-automations' \
  -H 'Authorization: Bearer SEU_ANON_KEY' \
  -H 'Content-Type: application/json'
```

### Agendamento Automático

#### Opção 1: Supabase Cron Jobs (Recomendado)

1. Vai ao Supabase Dashboard > Database > Cron Jobs
2. Cria um novo cron job:
   - **Schedule**: `0 9 * * *` (diariamente às 9:00 AM)
   - **Command**: 
     ```sql
     SELECT net.http_post(
       url := 'https://seu-project-ref.supabase.co/functions/v1/run-automations',
       headers := '{"Authorization": "Bearer SEU_ANON_KEY", "Content-Type": "application/json"}'::jsonb
     );
     ```

#### Opção 2: Cron Externo (VPS/Server)

```bash
# Adiciona ao crontab
0 9 * * * curl -X POST 'https://seu-project-ref.supabase.co/functions/v1/run-automations' -H 'Authorization: Bearer SEU_ANON_KEY'
```

## 3. Webhooks

Os webhooks permitem executar automações quando eventos específicos ocorrem no Supabase.

### Configuração no Supabase Dashboard

1. Vai a **Database > Webhooks**
2. Cria um novo webhook:

#### Webhook 1: Lead Status Changed

- **Table**: `leads`
- **Events**: `UPDATE`
- **HTTP Request**:
  - **URL**: `https://seu-project-ref.supabase.co/functions/v1/run-automations`
  - **Method**: `POST`
  - **Headers**: 
    ```json
    {
      "Authorization": "Bearer SEU_ANON_KEY",
      "Content-Type": "application/json"
    }
    ```

#### Webhook 2: New Activity Created

- **Table**: `entity_activities`
- **Events**: `INSERT`
- **HTTP Request**: Similar ao acima

**Atenção**: Evita loops infinitos! Se a automação criar atividades, não configures webhooks que disparam em `entity_activities` INSERT, a menos que filtres adequadamente.

## 4. UI de Configuração

A página de Configurações (`/settings`) permite:

- Ver configurações atuais
- Alterar parâmetros de automação (apenas admins)
- Ver descrições e explicações

### Acesso

- **Rota**: `/settings`
- **Menu**: Item "Configurações" na Sidebar
- **Permissões**: Apenas utilizadores com `role = 'admin'`

## 5. Script Node.js (Alternativa)

O script `scripts/run_automations.mjs` ainda está disponível como alternativa:

```bash
npm run automations
```

Este script:
- Lê variáveis de ambiente do `.env`
- Usa `SUPABASE_SERVICE_ROLE_KEY` para operações admin
- Pode ser executado via cron externo

## Resumo de Opções de Execução

| Método | Quando Usar | Vantagens |
|--------|-------------|-----------|
| **Edge Function + Cron** | Produção (recomendado) | Serverless, escalável, gerido pelo Supabase |
| **Edge Function + Webhooks** | Eventos específicos | Reativo, executa apenas quando necessário |
| **Script Node.js + Cron** | Desenvolvimento ou se preferires controlo total | Mais controlo, fácil debug local |

