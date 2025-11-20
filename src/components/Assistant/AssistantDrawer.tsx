/**
 * AssistantDrawer Component
 * 
 * Painel lateral para o Assistente Nikufra
 */

import { useState } from 'react';
import { X, Sparkles, Loader2, AlertCircle, Copy, Check } from 'lucide-react';
import { useAssistant, type AssistantResponse } from '../../hooks/useAssistant';
import type { Lead, Project, Activity, Task, DocumentRecord } from '../../types/crm';

interface AssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  entity: Lead | Project | DocumentRecord | null;
  activities: Activity[];
  tasks: Task[];
  documents: DocumentRecord[];
  entityType: 'lead' | 'project' | 'document';
}

export default function AssistantDrawer({
  isOpen,
  onClose,
  entity,
  activities,
  tasks,
  documents,
  entityType,
}: AssistantDrawerProps) {
  const { loading, error, generateLeadInsights, generateProjectInsights, generateDocumentInsights } = useAssistant();
  const [insights, setInsights] = useState<AssistantResponse | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!entity) return;

    let result: AssistantResponse | null = null;

    if (entityType === 'lead') {
      result = await generateLeadInsights(entity as Lead, activities, tasks, documents);
    } else if (entityType === 'project') {
      result = await generateProjectInsights(entity as Project, activities, tasks, documents);
    } else {
      result = await generateDocumentInsights(entity as DocumentRecord);
    }

    if (result) {
      setInsights(result);
    }
  };

  const handleCopy = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopied(section);
    setTimeout(() => setCopied(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-900">Assistente Nikufra</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!insights && !loading && (
            <div className="text-center py-12">
              <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Gerar Insights com IA
              </h3>
              <p className="text-gray-600 mb-6">
                {entityType === 'document'
                  ? 'O Assistente Nikufra vai analisar este documento e fornecer:'
                  : `O Assistente Nikufra vai analisar ${entityType === 'lead' ? 'esta lead' : 'este projeto'} e fornecer:`}
              </p>
              <ul className="text-left max-w-md mx-auto space-y-2 text-gray-600 mb-6">
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">•</span>
                  <span>Resumo da situação atual</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">•</span>
                  <span>Próxima ação recomendada</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">•</span>
                  <span>Rascunho de email de follow-up</span>
                </li>
              </ul>
              <button
                onClick={handleGenerate}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center gap-2 mx-auto"
              >
                <Sparkles className="w-4 h-4" />
                Gerar Insights
              </button>
            </div>
          )}

          {loading && (
            <div className="text-center py-12">
              <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">A gerar insights com IA...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-900 mb-1">Erro</h4>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          {insights && !loading && (
            <div className="space-y-6">
              {/* Resumo */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">Resumo</h3>
                  <button
                    onClick={() => handleCopy(insights.summary, 'summary')}
                    className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                    title="Copiar"
                  >
                    {copied === 'summary' ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-gray-700 whitespace-pre-wrap">
                  {insights.summary}
                </div>
              </section>

              {/* Próxima Ação */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">Próxima Ação Recomendada</h3>
                  <button
                    onClick={() => handleCopy(insights.nextAction, 'action')}
                    className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                    title="Copiar"
                  >
                    {copied === 'action' ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-gray-700 whitespace-pre-wrap">
                  {insights.nextAction}
                </div>
              </section>

              {/* Rascunho de Email */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {entityType === 'document' ? 'Rascunho de Comunicação' : 'Rascunho de Email'}
                  </h3>
                  <button
                    onClick={() => handleCopy(insights.emailDraft, 'email')}
                    className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                    title="Copiar"
                  >
                    {copied === 'email' ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                </div>
                <textarea
                  value={insights.emailDraft}
                  onChange={(e) => setInsights({ ...insights, emailDraft: e.target.value })}
                  className="w-full h-48 p-4 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Rascunho de email..."
                />
                <p className="text-xs text-gray-500 mt-2">
                  Podes editar o rascunho antes de copiar
                </p>
              </section>

              {/* Regenerar */}
              <div className="pt-4 border-t">
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Regenerar Insights
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

