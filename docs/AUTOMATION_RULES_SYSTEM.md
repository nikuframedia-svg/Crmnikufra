# 🤖 Sistema de Automações Configurável (Tipo Lindy)

## ✅ Status: Implementado e Funcional

Sistema de automações baseado em regras configuráveis via base de dados, sem necessidade de alterar código.

---

## 📋 O que foi Implementado

### 1. Schema Supabase ✅

**Tabelas criadas:**
- `automation_rules` - Regras de automação configuráveis
- `automation_rule_logs` - Logs de execução das regras

**Regras padrão inseridas:**
1. **Follow-up leads Contactado > 7 dias**
   - Trigger: `daily_cron`
   - Condition: Leads em estado "Contactado" sem atividade há 7 dias
   - Action: Cria tarefa + notificação

2. **Projetos ativos sem tarefas > 14 dias**
   - Trigger: `daily_cron`
   - Condition: Projetos "Active" sem tarefas há 14 dias
   - Action: Cria apenas notificação

### 2. Tipos TypeScript ✅

Adicionados em `src/types/crm.ts`:
- `AutomationRuleTriggerType`
- `AutomationCondition`
- `AutomationAction`
- `AutomationRule`
- `AutomationRuleLog`

### 3. Automation Engine ✅

**`src/lib/automationEngine.ts`:**
- `runDailyAutomations()` - Executa todas as regras diárias
- `executeRule(rule)` - Executa uma regra específica
- Suporte para templates com variáveis `{{variable}}`

### 4. Integração ✅

- Edge Function atualizada para usar o novo sistema
- Script Node.js atualizado para usar o novo sistema
- Logs de execução automáticos

---

## 🎯 Como Criar Novas Regras via BD

### Exemplo 1: Nova Regra de Follow-up

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
  '{"entity": "lead", "status": "qualified", "days_without_activity": 5}'::jsonb,
  '{
    "type": "create_task_and_notification",
    "task_title_template": "Follow-up lead qualificada: {{lead.title}}",
    "task_description_template": "Lead qualificada precisa de follow-up",
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
  '{"entity": "project", "status": "on_hold", "days_without_update": 30}'::jsonb,
  '{
    "type": "create_notification_only",
    "message_template": "Projeto em pausa há {{days}} dias: {{project.name}}"
  }'::jsonb
);
```

### Exemplo 3: Regra com Trigger de Evento (Futuro)

```sql
INSERT INTO automation_rules (
  name,
  description,
  is_active,
  trigger_type,
  condition,
  action
) VALUES (
  'Notificar quando lead muda para "Negociação"',
  'Envia notificação quando uma lead muda para estado "Negociação"',
  true,
  'lead_status_change',
  '{"new_status": "negotiation"}'::jsonb,
  '{
    "type": "create_notification_only",
    "message_template": "Lead {{lead.title}} entrou em negociação!"
  }'::jsonb
);
```

---

## 📊 Estrutura das Regras

### Condition (JSONB)

**Para leads:**
```json
{
  "entity": "lead",
  "status": "contacted",
  "days_without_activity": 7
}
```

**Para projetos:**
```json
{
  "entity": "project",
  "status": "active",
  "days_without_task": 14
}
```

### Action (JSONB)

**create_task_and_notification:**
```json
{
  "type": "create_task_and_notification",
  "task_title_template": "Follow-up lead: {{lead.title}}",
  "task_description_template": "Descrição da tarefa...",
  "notification_message_template": "Nova tarefa: {{lead.title}}"
}
```

**create_notification_only:**
```json
{
  "type": "create_notification_only",
  "message_template": "Projeto em risco: {{project.name}}"
}
```

### Templates

Suporta variáveis com sintaxe `{{variable.path}}`:
- `{{lead.title}}` - Título da lead
- `{{lead.name}}` - Nome da lead (alias de title)
- `{{project.name}}` - Nome do projeto
- `{{days}}` - Número de dias (do condition)

---

## 🔧 Gerir Regras

### Ver todas as regras
```sql
SELECT id, name, is_active, trigger_type, condition, action 
FROM automation_rules 
ORDER BY created_at;
```

### Ativar/Desativar regra
```sql
UPDATE automation_rules 
SET is_active = false 
WHERE id = 'rule-id-here';
```

### Editar regra
```sql
UPDATE automation_rules 
SET 
  condition = '{"entity": "lead", "status": "contacted", "days_without_activity": 10}'::jsonb,
  action = '{"type": "create_task_and_notification", ...}'::jsonb
WHERE id = 'rule-id-here';
```

### Ver logs de execução
```sql
SELECT 
  arl.*,
  ar.name as rule_name
FROM automation_rule_logs arl
JOIN automation_rules ar ON ar.id = arl.rule_id
ORDER BY arl.run_at DESC
LIMIT 50;
```

---

## 🚀 Executar Automações

### Via Edge Function (Recomendado)
```bash
./scripts/test-automation-function.sh
```

### Via Script Node.js
```bash
npm run automations
```

### Via SQL (Direto)
```sql
-- Nota: Isto não executa as regras, apenas mostra o que seria executado
SELECT * FROM automation_rules 
WHERE trigger_type = 'daily_cron' 
AND is_active = true;
```

---

## 📝 Estrutura dos Ficheiros

```
src/
├── lib/
│   └── automationEngine.ts    # Motor de execução de regras
├── types/
│   └── crm.ts                 # Tipos AutomationRule, etc.

supabase/
├── functions/
│   └── run-automations/
│       └── index.ts           # Edge Function (atualizada)
└── migrations/
    └── [timestamp]_create_automation_rules_system.sql

scripts/
└── run_automations.mjs        # Script Node.js (atualizado)
```

---

## 🎨 Tipos de Triggers Suportados

Atualmente implementado:
- ✅ `daily_cron` - Executa diariamente

Preparado para futuro:
- ⏳ `lead_status_change` - Quando estado de lead muda
- ⏳ `project_created` - Quando projeto é criado
- ⏳ `task_completed` - Quando tarefa é concluída

---

## 🔮 Extensibilidade

### Adicionar Novo Tipo de Action

1. Adiciona o tipo em `automationEngine.ts`:
```typescript
if (action.type === 'novo_tipo') {
  return await executeNovoTipo(condition, action);
}
```

2. Implementa a função:
```typescript
async function executeNovoTipo(condition, action) {
  // Lógica aqui
}
```

### Adicionar Novo Tipo de Condition

1. Adiciona verificação em `executeRule()`:
```typescript
if (condition.entity === 'nova_entidade') {
  return await executeNovaEntidade(condition, action);
}
```

---

## ✅ Checklist de Implementação

- [x] Migration criada e aplicada
- [x] 2 regras padrão inseridas
- [x] Tipos TypeScript criados
- [x] `automationEngine.ts` implementado
- [x] Edge Function atualizada
- [x] Script Node.js atualizado
- [x] Sistema de logs implementado
- [x] Templates com variáveis funcionando
- [x] RLS policies configuradas
- [x] Indexes criados

---

## 🎉 Conclusão

O sistema de automações configurável está **100% funcional**!

**Vantagens:**
- ✅ Criar novas regras sem tocar em código
- ✅ Ativar/desativar regras facilmente
- ✅ Ver logs de execução
- ✅ Templates flexíveis
- ✅ Base sólida para extensões futuras

**Próximos passos sugeridos:**
- Criar UI para gerir regras (futuro)
- Adicionar mais tipos de triggers
- Adicionar mais tipos de actions
- Suporte para condições mais complexas

