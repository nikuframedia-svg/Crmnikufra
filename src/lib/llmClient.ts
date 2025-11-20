/**
 * LLM Client
 * 
 * Cliente para interagir com APIs de LLM (OpenAI, Anthropic, etc.)
 * Estrutura plug-and-play para trocar provedores facilmente.
 */

export interface LLMResponse {
  content: string;
  error?: string;
}

export interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'custom';
  apiKey: string;
  model?: string;
  baseURL?: string;
}

/**
 * Get LLM configuration from environment variables
 */
function getLLMConfig(): LLMConfig {
  // OpenAI (default)
  if (import.meta.env.VITE_OPENAI_API_KEY) {
    return {
      provider: 'openai',
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      model: import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini',
      baseURL: import.meta.env.VITE_OPENAI_BASE_URL || 'https://api.openai.com/v1',
    };
  }

  // Anthropic
  if (import.meta.env.VITE_ANTHROPIC_API_KEY) {
    return {
      provider: 'anthropic',
      apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
      model: import.meta.env.VITE_ANTHROPIC_MODEL || 'claude-3-haiku-20240307',
    };
  }

  // Custom endpoint
  if (import.meta.env.VITE_LLM_API_KEY && import.meta.env.VITE_LLM_BASE_URL) {
    return {
      provider: 'custom',
      apiKey: import.meta.env.VITE_LLM_API_KEY,
      baseURL: import.meta.env.VITE_LLM_BASE_URL,
      model: import.meta.env.VITE_LLM_MODEL || 'gpt-4o-mini',
    };
  }

  // Fallback: no API key (will return mock response)
  return {
    provider: 'openai',
    apiKey: '',
    model: 'gpt-4o-mini',
  };
}

/**
 * Call OpenAI API
 */
async function callOpenAI(prompt: string, config: LLMConfig): Promise<LLMResponse> {
  try {
    const response = await fetch(`${config.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: 'system',
            content: 'És o Assistente Nikufra, um assistente de CRM especializado em ajudar equipas de vendas e gestão de projetos. Responde sempre em português de forma clara e profissional.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
      throw new Error(error.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0]?.message?.content || 'Sem resposta do modelo.',
    };
  } catch (error: any) {
    return {
      content: '',
      error: error.message || 'Erro ao chamar OpenAI API',
    };
  }
}

/**
 * Call Anthropic API
 */
async function callAnthropic(prompt: string, config: LLMConfig): Promise<LLMResponse> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: config.model || 'claude-3-haiku-20240307',
        max_tokens: 1000,
        system: 'És o Assistente Nikufra, um assistente de CRM especializado em ajudar equipas de vendas e gestão de projetos. Responde sempre em português de forma clara e profissional.',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
      throw new Error(error.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return {
      content: data.content[0]?.text || 'Sem resposta do modelo.',
    };
  } catch (error: any) {
    return {
      content: '',
      error: error.message || 'Erro ao chamar Anthropic API',
    };
  }
}

/**
 * Call custom LLM endpoint (OpenAI-compatible)
 */
async function callCustom(prompt: string, config: LLMConfig): Promise<LLMResponse> {
  try {
    const response = await fetch(`${config.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: 'system',
            content: 'És o Assistente Nikufra, um assistente de CRM especializado em ajudar equipas de vendas e gestão de projetos. Responde sempre em português de forma clara e profissional.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0]?.message?.content || 'Sem resposta do modelo.',
    };
  } catch (error: any) {
    return {
      content: '',
      error: error.message || 'Erro ao chamar LLM API',
    };
  }
}

/**
 * Mock response for development (when no API key is configured)
 */
function getMockResponse(prompt: string): LLMResponse {
  // Simple mock that returns structured responses based on prompt keywords
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes('resumo')) {
    return {
      content: `**Resumo da Lead/Projeto:**

Esta é uma lead/projeto importante que requer atenção. Com base no histórico de atividades e estado atual, aqui está um resumo conciso:

- **Estado atual:** Em progresso ativo
- **Última atividade:** Há alguns dias
- **Próximos passos sugeridos:** Follow-up e acompanhamento

*Nota: Esta é uma resposta simulada. Configure VITE_OPENAI_API_KEY no .env para respostas reais.*`,
    };
  }
  
  if (lowerPrompt.includes('próxima ação') || lowerPrompt.includes('proxima acao')) {
    return {
      content: `**Próxima Ação Recomendada:**

1. **Contactar o cliente** - Fazer follow-up telefónico ou por email
2. **Agendar reunião** - Se apropriado, marcar uma reunião de acompanhamento
3. **Atualizar informações** - Revisar e atualizar dados relevantes no CRM

*Nota: Esta é uma resposta simulada. Configure VITE_OPENAI_API_KEY no .env para sugestões reais.*`,
    };
  }
  
  if (lowerPrompt.includes('email') || lowerPrompt.includes('follow-up')) {
    return {
      content: `**Rascunho de Email:**

Assunto: Follow-up - [Nome da Lead/Projeto]

Olá [Nome],

Espero que esteja tudo bem.

Gostaria de fazer um breve follow-up sobre [assunto]. [Contexto específico baseado na lead/projeto].

Gostaria de agendar uma breve conversa para discutirmos os próximos passos?

Fico à espera do vosso feedback.

Com os melhores cumprimentos,
[Seu Nome]

---
*Nota: Este é um rascunho simulado. Configure VITE_OPENAI_API_KEY no .env para rascunhos personalizados.*`,
    };
  }
  
  return {
    content: 'Resposta simulada. Configure uma chave de API LLM no .env para respostas reais.',
  };
}

/**
 * Main function to call LLM
 * 
 * @param prompt - The prompt to send to the LLM
 * @returns Promise with LLM response
 */
export async function callLLM(prompt: string): Promise<LLMResponse> {
  const config = getLLMConfig();

  // If no API key, return mock response
  if (!config.apiKey) {
    console.warn('⚠️ No LLM API key configured. Using mock response.');
    return getMockResponse(prompt);
  }

  // Route to appropriate provider
  switch (config.provider) {
    case 'openai':
      return await callOpenAI(prompt, config);
    case 'anthropic':
      return await callAnthropic(prompt, config);
    case 'custom':
      return await callCustom(prompt, config);
    default:
      return {
        content: '',
        error: `Provider desconhecido: ${config.provider}`,
      };
  }
}

/**
 * Helper to check if LLM is configured
 */
export function isLLMConfigured(): boolean {
  const config = getLLMConfig();
  return !!config.apiKey;
}


