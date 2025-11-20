# 🔄 Como Trocar Provedor de LLM

## Método 1: Via Variáveis de Ambiente (Recomendado)

### Trocar para OpenAI

```bash
# .env
VITE_OPENAI_API_KEY=sk-...
# Remove outras chaves LLM se existirem
```

### Trocar para Anthropic

```bash
# .env
VITE_ANTHROPIC_API_KEY=sk-ant-...
# Remove outras chaves LLM se existirem
```

### Trocar para Custom Endpoint

```bash
# .env
VITE_LLM_API_KEY=sk-...
VITE_LLM_BASE_URL=https://api.example.com/v1
VITE_LLM_MODEL=gpt-4o-mini
```

**Nota:** O sistema detecta automaticamente qual provedor usar baseado nas variáveis disponíveis.

---

## Método 2: Adicionar Novo Provedor

### 1. Adiciona o tipo em `llmClient.ts`

```typescript
export interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'custom' | 'novo_provedor'; // Adiciona aqui
  // ...
}
```

### 2. Adiciona detecção em `getLLMConfig()`

```typescript
// Novo provedor
if (import.meta.env.VITE_NOVO_PROVEDOR_API_KEY) {
  return {
    provider: 'novo_provedor',
    apiKey: import.meta.env.VITE_NOVO_PROVEDOR_API_KEY,
    // ...
  };
}
```

### 3. Implementa a função de chamada

```typescript
async function callNovoProvedor(prompt: string, config: LLMConfig): Promise<LLMResponse> {
  try {
    const response = await fetch(`${config.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        // Formato específico do novo provedor
      }),
    });

    // Processar resposta...
  } catch (error: any) {
    return {
      content: '',
      error: error.message || 'Erro ao chamar Novo Provedor API',
    };
  }
}
```

### 4. Adiciona ao switch

```typescript
switch (config.provider) {
  // ... casos existentes
  case 'novo_provedor':
    return await callNovoProvedor(prompt, config);
}
```

---

## Ordem de Prioridade

O sistema verifica as variáveis nesta ordem:

1. `VITE_OPENAI_API_KEY` → OpenAI
2. `VITE_ANTHROPIC_API_KEY` → Anthropic
3. `VITE_LLM_API_KEY` + `VITE_LLM_BASE_URL` → Custom
4. Nenhuma → Mock responses

---

## Exemplo: Trocar para Local LLM (Ollama)

```typescript
// Em llmClient.ts

// Adiciona ao getLLMConfig()
if (import.meta.env.VITE_OLLAMA_BASE_URL) {
  return {
    provider: 'ollama',
    apiKey: '', // Ollama não precisa de key
    baseURL: import.meta.env.VITE_OLLAMA_BASE_URL || 'http://localhost:11434/v1',
    model: import.meta.env.VITE_OLLAMA_MODEL || 'llama2',
  };
}

// Implementa callOllama()
async function callOllama(prompt: string, config: LLMConfig): Promise<LLMResponse> {
  try {
    const response = await fetch(`${config.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: '...' },
          { role: 'user', content: prompt },
        ],
      }),
    });

    const data = await response.json();
    return {
      content: data.choices[0]?.message?.content || '',
    };
  } catch (error: any) {
    return {
      content: '',
      error: error.message,
    };
  }
}

// Adiciona ao switch
case 'ollama':
  return await callOllama(prompt, config);
```

Depois no `.env`:
```bash
VITE_OLLAMA_BASE_URL=http://localhost:11434/v1
VITE_OLLAMA_MODEL=llama2
```

---

## ✅ Checklist para Novo Provedor

- [ ] Adicionar tipo ao `LLMConfig`
- [ ] Adicionar detecção em `getLLMConfig()`
- [ ] Implementar função de chamada
- [ ] Adicionar case ao switch
- [ ] Testar com API key válida
- [ ] Documentar variáveis de ambiente necessárias

