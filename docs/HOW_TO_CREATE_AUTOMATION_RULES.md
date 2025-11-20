# 📝 Como Criar Novas Regras de Automação via BD

## Guia Rápido

Podes criar novas regras de automação diretamente na base de dados, sem precisar de alterar código!

---

## 📋 Estrutura Básica

```sql
INSERT INTO automation_rules (
  name,                    -- Nome da regra
  description,             -- Descrição (opcional)
  is_active,              -- true/false
  trigger_type,           -- 'daily_cron', 'lead_status_change', etc.
  condition,              -- JSONB com condições
  action                  -- JSONB com ações
) VALUES (
  'Nome da Regra',
  'Descrição da regra',
  true,
  'daily_cron',
  '{"entity": "...", ...}'::jsonb,
  '{"type": "...", ...}'::jsonb
);
```

---

## 🎯 Exemplos Práticos

### Exemplo 1: Follow-up para Leads "Qualificado"

```sql
INSERT INTO automation_rules (
  name,
  description,
  is_active,
  trigger_type,
  condition,
  action
) VALUES (
  'Follow-up leads Qualificado > 5 dias',
  'Cria tarefa para leads em estado "Qualificado" sem atividade há 5 dias',
  true,
  'daily_cron',
  '{
    "entity": "lead",
    "status": "qualified",
    "days_without_activity": 5
  }'::jsonb,
  '{
    "type": "create_task_and_notification",
    "task_title_template": "Follow-up lead qualificada: {{lead.title}}",
    "task_description_template": "Lead qualificada precisa de follow-up urgente",
    "notification_message_template": "Nova tarefa de follow-up para lead qualificada: {{lead.title}}"
  }'::jsonb
);
```

### Exemplo 2: Notificação para Projetos em Pausa

```sql
INSERT INTO automation_rules (
  name,
  description,
  is_active,
  trigger_type,
  condition,
  action
) VALUES (
  'Notificar projetos em pausa há 30 dias',
  'Notifica o owner de projetos em pausa há mais de 30 dias',
  true,
  'daily_cron',
  '{
    "entity": "project",
    "status": "on_hold",
    "days_without_update": 30
  }'::jsonb,
  '{
    "type": "create_notification_only",
    "message_template": "Projeto em pausa há {{days}} dias: {{project.name}}"
  }'::jsonb
);
```

### Exemplo 3: Follow-up para Leads "Proposta"

```sql
INSERT INTO automation_rules (
  name,
  description,
  is_active,
  trigger_type,
  condition,
  action
) VALUES (
  'Follow-up leads Proposta > 3 dias',
  'Cria tarefa urgente para leads em estado "Proposta" sem atividade há 3 dias',
  true,
  'daily_cron',
  '{
    "entity": "lead",
    "status": "proposal",
    "days_without_activity": 3
  }'::jsonb,
  '{
    "type": "create_task_and_notification",
    "task_title_template": "URGENTE: Follow-up proposta {{lead.title}}",
    "task_description_template": "Lead em proposta precisa de resposta urgente",
    "notification_message_template": "⚠️ Tarefa urgente: Follow-up proposta {{lead.title}}"
  }'::jsonb
);
```

---

## 🔧 Condition Patterns

### Para Leads
```json
{
  "entity": "lead",
  "status": "contacted" | "qualified" | "proposal" | "negotiation",
  "days_without_activity": 7
}
```

### Para Projetos
```json
{
  "entity": "project",
  "status": "active" | "on_hold" | "planning",
  "days_without_task": 14
}
```

---

## ⚡ Action Patterns

### create_task_and_notification
```json
{
  "type": "create_task_and_notification",
  "task_title_template": "Título: {{lead.title}}",
  "task_description_template": "Descrição...",
  "notification_message_template": "Notificação: {{lead.title}}"
}
```

### create_notification_only
```json
{
  "type": "create_notification_only",
  "message_template": "Mensagem: {{project.name}}"
}
```

---

## 📝 Templates Disponíveis

### Variáveis para Leads
- `{{lead.title}}` - Título da lead
- `{{lead.name}}` - Nome da lead (alias)
- `{{days}}` - Número de dias (do condition)

### Variáveis para Projetos
- `{{project.name}}` - Nome do projeto
- `{{days}}` - Número de dias (do condition)

---

## 🛠️ Gerir Regras Existentes

### Ver todas as regras
```sql
SELECT id, name, is_active, trigger_type 
FROM automation_rules 
ORDER BY created_at;
```

### Desativar regra
```sql
UPDATE automation_rules 
SET is_active = false 
WHERE name = 'Nome da Regra';
```

### Ativar regra
```sql
UPDATE automation_rules 
SET is_active = true 
WHERE name = 'Nome da Regra';
```

### Editar condition de uma regra
```sql
UPDATE automation_rules 
SET condition = '{"entity": "lead", "status": "contacted", "days_without_activity": 10}'::jsonb
WHERE name = 'Nome da Regra';
```

### Editar action de uma regra
```sql
UPDATE automation_rules 
SET action = '{"type": "create_task_and_notification", "task_title_template": "Novo título: {{lead.title}}"}'::jsonb
WHERE name = 'Nome da Regra';
```

### Eliminar regra
```sql
DELETE FROM automation_rules 
WHERE name = 'Nome da Regra';
```

---

## 📊 Ver Logs de Execução

### Últimas execuções
```sql
SELECT 
  arl.run_at,
  ar.name as rule_name,
  arl.result,
  arl.error,
  arl.metadata
FROM automation_rule_logs arl
JOIN automation_rules ar ON ar.id = arl.rule_id
ORDER BY arl.run_at DESC
LIMIT 20;
```

### Estatísticas por regra
```sql
SELECT 
  ar.name,
  COUNT(*) as total_runs,
  COUNT(*) FILTER (WHERE arl.result = 'success') as successful_runs,
  COUNT(*) FILTER (WHERE arl.result = 'error') as failed_runs
FROM automation_rules ar
LEFT JOIN automation_rule_logs arl ON arl.rule_id = ar.id
GROUP BY ar.id, ar.name
ORDER BY ar.name;
```

---

## ✅ Checklist ao Criar Nova Regra

1. ✅ Nome descritivo e único
2. ✅ `trigger_type` correto (geralmente `'daily_cron'`)
3. ✅ `condition` com `entity` e critérios corretos
4. ✅ `action` com `type` suportado
5. ✅ Templates com variáveis válidas
6. ✅ `is_active = true` para ativar imediatamente

---

## 🚨 Troubleshooting

### Regra não executa
1. Verifica `is_active = true`
2. Verifica `trigger_type = 'daily_cron'`
3. Verifica logs: `SELECT * FROM automation_rule_logs WHERE rule_id = '...'`

### Erro na execução
1. Verifica estrutura do JSON (condition e action)
2. Verifica que as entidades existem (leads/projects)
3. Verifica que os campos referenciados existem

### Templates não funcionam
1. Verifica sintaxe: `{{variable.path}}`
2. Verifica que as variáveis existem no contexto
3. Testa com valores simples primeiro

---

## 🎉 Pronto!

Agora podes criar e gerir automações diretamente na base de dados, sem precisar de alterar código!

