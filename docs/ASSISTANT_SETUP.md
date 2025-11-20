# 🤖 Assistente Nikufra - Setup e Configuração

## ✅ Status: Implementado

O Assistente Nikufra v1 está implementado e funcional!

---

## 📋 O que foi Criado

### 1. LLM Client (`src/lib/llmClient.ts`) ✅

Cliente configurável para múltiplos provedores de LLM:
- **OpenAI** (padrão)
- **Anthropic** (Claude)
- **Custom endpoint** (OpenAI-compatible)

**Funcionalidades:**
- Detecção automática do provedor baseado em variáveis de ambiente
- Respostas mock quando não há API key (para desenvolvimento)
- Estrutura plug-and-play para trocar provedores

### 2. Hook useAssistant (`src/hooks/useAssistant.ts`) ✅

Hook React para gerar insights:
- `generateLeadInsights(lead, activities, tasks)` - Gera insights para leads
- `generateProjectInsights(project, activities, tasks)` - Gera insights para projetos
- Estados: `loading`, `error`
- Parsing automático da resposta do LLM em 3 secções

### 3. Componente AssistantDrawer (`src/components/Assistant/AssistantDrawer.tsx`) ✅

Painel lateral com:
- Botão "Gerar Insights"
- 3 secções: Resumo, Próxima Ação, Rascunho de Email
- Botões de copiar para cada secção
- Textarea editável para o rascunho de email
- Estados de loading e erro

### 4. Integração nas Views ✅

- **LeadDetailView**: Botão "Assistente Nikufra" no header
- **ProjectDetailView**: Botão "Assistente Nikufra" no header
- Drawer abre ao clicar no botão

---

## 🔧 Configuração

### Variáveis de Ambiente

Adiciona ao teu `.env`:

```bash
# OpenAI (Recomendado)
VITE_OPENAI_API_KEY=sk-...

# OU Anthropic
VITE_ANTHROPIC_API_KEY=sk-ant-...

# OU Custom endpoint (OpenAI-compatible)
VITE_LLM_API_KEY=sk-...
VITE_LLM_BASE_URL=https://api.example.com/v1
VITE_LLM_MODEL=gpt-4o-mini
```

### Modelos Suportados

**OpenAI:**
- `gpt-4o-mini` (padrão, mais económico)
- `gpt-4o`
- `gpt-4-turbo`
- Qualquer modelo OpenAI

**Anthropic:**
- `claude-3-haiku-20240307` (padrão, mais económico)
- `claude-3-sonnet-20240229`
- `claude-3-opus-20240229`

---

## 🎯 Como Trocar Provedor de LLM

### Opção 1: Via Variáveis de Ambiente

1. Remove a variável do provedor atual
2. Adiciona a variável do novo provedor
3. Reinicia o servidor de desenvolvimento

### Opção 2: Modificar `llmClient.ts`

Edita `src/lib/llmClient.ts` e adiciona um novo case no `switch`:

```typescript
case 'novo_provedor':
  return await callNovoProvedor(prompt, config);
```

Depois implementa a função `callNovoProvedor()` seguindo o padrão das outras.

---

## 🚀 Como Usar

1. **Navega para uma Lead ou Projeto:**
   - Vai a `/crm/leads/:id` ou `/projects/:id`

2. **Clica no botão "Assistente Nikufra":**
   - Botão roxo/azul no topo direito da página

3. **Gera insights:**
   - Clica em "Gerar Insights"
   - Aguarda a resposta do LLM (pode demorar alguns segundos)

4. **Usa os insights:**
   - Lê o resumo
   - Segue a próxima ação recomendada
   - Copia/edita o rascunho de email

---

## 📝 Estrutura das Respostas

O LLM retorna 3 secções:

1. **Resumo** - Situação atual da lead/projeto (2-3 parágrafos)
2. **Próxima Ação** - Ações específicas e acionáveis (1-2 ações)
3. **Rascunho de Email** - Email de follow-up completo (assunto + corpo)

---

## 🔍 Modo de Desenvolvimento (Sem API Key)

Se não configurares uma API key, o sistema usa respostas mock:
- Respostas simuladas baseadas em keywords
- Mensagem clara indicando que é uma resposta simulada
- Útil para testar a UI sem custos de API

---

## 🎨 Personalização

### Alterar o Prompt do Sistema

Edita `src/lib/llmClient.ts` e modifica a mensagem do sistema:

```typescript
{
  role: 'system',
  content: 'És o Assistente Nikufra...', // Modifica aqui
}
```

### Alterar o Template do Prompt

Edita `src/hooks/useAssistant.ts` e modifica as funções `buildLeadPrompt()` ou `buildProjectPrompt()`.

### Alterar a UI do Drawer

Edita `src/components/Assistant/AssistantDrawer.tsx` para personalizar cores, layout, etc.

---

## ⚠️ Limitações Atuais (v1)

- **Apenas leitura** - Não escreve no CRM
- **Sem automações** - Apenas sugestões
- **Sem histórico** - Cada geração é independente
- **Sem cache** - Sempre chama o LLM

---

## 🔮 Próximos Passos (Futuro)

- [ ] Cache de respostas
- [ ] Histórico de insights gerados
- [ ] Integração direta (criar tarefa/nota a partir do assistente)
- [ ] Suporte para mais entidades (Contacts, Companies)
- [ ] Análise de pipeline completo
- [ ] Sugestões proativas (sem clicar no botão)

---

## 🐛 Troubleshooting

### "No LLM API key configured"
- Adiciona uma chave de API ao `.env`
- Reinicia o servidor de desenvolvimento

### Erro 401/403
- Verifica se a chave de API está correta
- Verifica se a chave tem permissões para o modelo escolhido

### Respostas vazias
- Verifica os logs do console
- Verifica se o modelo está disponível
- Tenta outro modelo

### Drawer não abre
- Verifica se o componente está importado
- Verifica se o estado `assistantOpen` está a ser gerido

---

## 📚 Ficheiros Criados

- `src/lib/llmClient.ts` - Cliente LLM
- `src/hooks/useAssistant.ts` - Hook React
- `src/components/Assistant/AssistantDrawer.tsx` - Componente UI
- `src/views/CRM/LeadDetailView.tsx` - Integração (modificado)
- `src/views/Projects/ProjectDetailView.tsx` - Integração (modificado)

---

## ✅ Checklist de Implementação

- [x] LLM Client criado
- [x] Hook useAssistant criado
- [x] Componente AssistantDrawer criado
- [x] Integração em LeadDetailView
- [x] Integração em ProjectDetailView
- [x] Suporte para múltiplos provedores
- [x] Respostas mock para desenvolvimento
- [x] Estados de loading e erro
- [x] Botões de copiar
- [x] Textarea editável para email

---

**O Assistente Nikufra v1 está pronto para uso!** 🎉

