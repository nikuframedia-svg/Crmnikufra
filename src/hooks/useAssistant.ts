/**
 * useAssistant Hook
 * 
 * Hook para interagir com o Assistente Nikufra (LLM)
 */

import { useState } from 'react';
import { callLLM } from '../lib/llmClient';
import type { Lead, Project, Activity, Task, DocumentRecord } from '../types/crm';

export interface AssistantResponse {
  summary: string;
  nextAction: string;
  emailDraft: string;
}

export interface UseAssistantReturn {
  loading: boolean;
  error: string | null;
  generateLeadInsights: (
    lead: Lead,
    activities: Activity[],
    tasks: Task[],
    documents: DocumentRecord[]
  ) => Promise<AssistantResponse | null>;
  generateProjectInsights: (
    project: Project,
    activities: Activity[],
    tasks: Task[],
    documents: DocumentRecord[]
  ) => Promise<AssistantResponse | null>;
  generateDocumentInsights: (document: DocumentRecord) => Promise<AssistantResponse | null>;
}

export function useAssistant(): UseAssistantReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Build context prompt for lead
   */
  function buildLeadPrompt(lead: Lead, activities: Activity[], tasks: Task[], documents: DocumentRecord[]): string {
    // Get related tasks
    const leadTasks = tasks.filter(t => t.lead_id === lead.id);
    const upcomingTasks = leadTasks
      .filter(t => t.status !== 'done')
      .sort((a, b) => {
        const dateA = a.due_date ? new Date(a.due_date).getTime() : 0;
        const dateB = b.due_date ? new Date(b.due_date).getTime() : 0;
        return dateA - dateB;
      })
      .slice(0, 5);

    // Build prompt
    const latestDocuments = documents
      .filter((doc) => doc.lead_id === lead.id)
      .slice(0, 5)
      .map((doc) => `- ${doc.title} (${new Date(doc.created_at).toLocaleDateString('pt-PT')}) - ${doc.description || 'Sem descrição'}`)
      .join('\n');

    const prompt = `Analisa esta lead do CRM e fornece:

1. **Resumo conciso** (2-3 parágrafos) da situação atual da lead
2. **Próxima ação recomendada** (1-2 ações específicas e acionáveis)
3. **Rascunho de email de follow-up** (assunto + corpo do email)

**Dados da Lead:**
- Nome/Título: ${lead.title}
- Estado: ${lead.stage}
- Valor: ${lead.value ? `${lead.value} ${lead.currency || 'EUR'}` : 'Não definido'}
- Criada em: ${new Date(lead.created_at).toLocaleDateString('pt-PT')}

**Últimas Atividades (${activities.length}):**
${activities.slice(-5).map(a => {
  const date = new Date(a.created_at).toLocaleDateString('pt-PT');
  return `- ${date}: ${a.type} - ${a.metadata?.note || a.metadata?.task_title || 'Atividade'}`;
}).join('\n') || 'Nenhuma atividade registada'}

**Próximas Tarefas:**
${upcomingTasks.map(t => `- ${t.title} (${t.due_date ? new Date(t.due_date).toLocaleDateString('pt-PT') : 'sem data'})`).join('\n') || 'Nenhuma tarefa pendente'}

**Documentos Relevantes:**
${latestDocuments || 'Ainda não existem documentos associados'} 

Responde em português, de forma profissional e acionável.`;

    return prompt;
  }

  /**
   * Build context prompt for project
   */
  function buildProjectPrompt(project: Project, activities: Activity[], tasks: Task[], documents: DocumentRecord[]): string {
    // Get related tasks
    const projectTasks = tasks.filter(t => t.project_id === project.id);
    const upcomingTasks = projectTasks
      .filter(t => t.status !== 'done')
      .sort((a, b) => {
        const dateA = a.due_date ? new Date(a.due_date).getTime() : 0;
        const dateB = b.due_date ? new Date(b.due_date).getTime() : 0;
        return dateA - dateB;
      })
      .slice(0, 5);

    // Build prompt
    const latestDocuments = documents
      .filter((doc) => doc.project_id === project.id)
      .slice(0, 5)
      .map((doc) => `- ${doc.title} (${new Date(doc.created_at).toLocaleDateString('pt-PT')}) - ${doc.description || 'Sem descrição'}`)
      .join('\n');

    const prompt = `Analisa este projeto do CRM e fornece:

1. **Resumo conciso** (2-3 parágrafos) da situação atual do projeto
2. **Próxima ação recomendada** (1-2 ações específicas e acionáveis)
3. **Rascunho de email de follow-up** (assunto + corpo do email)

**Dados do Projeto:**
- Nome: ${project.name}
- Estado: ${project.status}
- Criado em: ${new Date(project.created_at).toLocaleDateString('pt-PT')}
${project.description ? `- Descrição: ${project.description}` : ''}

**Últimas Atividades (${activities.length}):**
${activities.slice(-5).map(a => {
  const date = new Date(a.created_at).toLocaleDateString('pt-PT');
  return `- ${date}: ${a.type} - ${a.metadata?.note || a.metadata?.task_title || 'Atividade'}`;
}).join('\n') || 'Nenhuma atividade registada'}

**Próximas Tarefas:**
${upcomingTasks.map(t => `- ${t.title} (${t.due_date ? new Date(t.due_date).toLocaleDateString('pt-PT') : 'sem data'})`).join('\n') || 'Nenhuma tarefa pendente'}

**Documentos Relevantes:**
${latestDocuments || 'Ainda não existem documentos associados'}

Responde em português, de forma profissional e acionável.`;

    return prompt;
  }

  /**
   * Build context prompt for document
   */
  function buildDocumentPrompt(document: DocumentRecord): string {
    return `Analisa este documento interno e produz:

1. **Resumo conciso** (1-2 parágrafos) com os principais pontos.
2. **Sugestão de utilização / próximas ações** para a equipa.
3. **Rascunho de comunicação** (assunto + corpo) para partilhar o documento com stakeholders.

**Dados do Documento**
- Título: ${document.title}
- É template?: ${document.is_template ? 'Sim' : 'Não'}
- Criado em: ${new Date(document.created_at).toLocaleDateString('pt-PT')}
- Atualizado em: ${new Date(document.updated_at).toLocaleDateString('pt-PT')}
- Descrição/conteúdo: ${document.description || 'Não existe descrição registada.'}

Se não existirem detalhes suficientes, indica claramente o que falta. Responde sempre em português.`;
  }

  /**
   * Parse LLM response into structured format
   */
  function parseLLMResponse(content: string): AssistantResponse {
    // Try to extract sections from markdown or structured text
    const summaryMatch = content.match(/(?:1[\.\)]?\s*\*\*Resumo[^:]*:\*\*|Resumo[^:]*:)\s*([\s\S]*?)(?=\d+[\.\)]?\s*\*\*|Próxima|Rascunho|$)/i);
    const nextActionMatch = content.match(/(?:2[\.\)]?\s*\*\*Próxima[^:]*:\*\*|Próxima[^:]*:)\s*([\s\S]*?)(?=\d+[\.\)]?\s*\*\*|Rascunho|Email|$)/i);
    const emailMatch = content.match(/(?:3[\.\)]?\s*\*\*Rascunho[^:]*:\*\*|Rascunho[^:]*:)\s*([\s\S]*?)$/i);

    return {
      summary: summaryMatch?.[1]?.trim() || content.split('\n\n')[0] || content,
      nextAction: nextActionMatch?.[1]?.trim() || content.split('\n\n')[1] || 'Analisar contexto e definir próximos passos.',
      emailDraft: emailMatch?.[1]?.trim() || content.split('\n\n').slice(2).join('\n\n') || 'Assunto: Follow-up\n\nOlá,\n\nGostaria de fazer um breve follow-up...',
    };
  }

  /**
   * Generate insights for a lead
   */
  async function generateLeadInsights(lead: Lead, activities: Activity[], tasks: Task[], documents: DocumentRecord[]): Promise<AssistantResponse | null> {
    setLoading(true);
    setError(null);

    try {
      const prompt = buildLeadPrompt(lead, activities, tasks, documents);
      const response = await callLLM(prompt);

      if (response.error) {
        setError(response.error);
        return null;
      }

      return parseLLMResponse(response.content);
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar insights');
      return null;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Generate insights for a project
   */
  async function generateProjectInsights(project: Project, activities: Activity[], tasks: Task[], documents: DocumentRecord[]): Promise<AssistantResponse | null> {
    setLoading(true);
    setError(null);

    try {
      const prompt = buildProjectPrompt(project, activities, tasks, documents);
      const response = await callLLM(prompt);

      if (response.error) {
        setError(response.error);
        return null;
      }

      return parseLLMResponse(response.content);
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar insights');
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function generateDocumentInsights(document: DocumentRecord): Promise<AssistantResponse | null> {
    setLoading(true);
    setError(null);

    try {
      const prompt = buildDocumentPrompt(document);
      const response = await callLLM(prompt);

      if (response.error) {
        setError(response.error);
        return null;
      }

      return parseLLMResponse(response.content);
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar insights');
      return null;
    } finally {
      setLoading(false);
    }
  }

  return {
    loading,
    error,
    generateLeadInsights,
    generateProjectInsights,
    generateDocumentInsights,
  };
}

