import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  TrendingUp,
  Briefcase,
  CheckCircle,
  Calendar,
  FileText,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  Sparkles,
  Send,
  Upload,
  Loader2,
} from 'lucide-react';
import { useDashboardMetrics } from '../../hooks/useDashboardMetrics';
import { useDocuments } from '../../hooks/useDocuments';
import { callLLM } from '../../lib/llmClient';

export default function DashboardView() {
  const { metrics, loading } = useDashboardMetrics();
  const { documents } = useDocuments();
  const navigate = useNavigate();

  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const llmSuggestions = [
    'Resumo rápido da performance desta semana',
    'Quais são os sinais de risco que devo atacar hoje?',
    'Ajuda-me a priorizar leads e projetos mais críticos',
    'Sugere ações para melhorar conversão no funil',
  ];

  const buildDashboardContext = (extraContext?: string) => {
    const base = `Contexto das métricas atuais:
- Total contactos: ${metrics.totalContacts}
- Leads ativas: ${metrics.activeLeads}
- Projetos ativos: ${metrics.activeProjects}
- Tarefas pendentes: ${metrics.pendingTasks}
- Eventos futuros: ${metrics.upcomingEvents}
- Documentos: ${metrics.documentsCount}
- Leads em risco: ${metrics.staleLeadsCount}
- Projetos em risco: ${metrics.staleProjectsCount}

Usa este contexto para responder em português com foco executivo.`;
    return extraContext ? `${base}\n\nContexto adicional:\n${extraContext}` : base;
  };

  const handleSendChat = async (prompt?: string, extraContext?: string) => {
    const message = prompt ?? chatInput.trim();
    if (!message || chatLoading) return;

    setChatError(null);
    setChatInput('');
    setChatMessages((prev) => [...prev, { role: 'user', content: message }]);
    setChatLoading(true);
    try {
      const response = await callLLM(`${buildDashboardContext(extraContext)}\n\nPergunta: ${message}`);
      if (response.error) {
        setChatError(response.error);
        setChatMessages((prev) => prev.slice(0, -1));
        return;
      }
      setChatMessages((prev) => [...prev, { role: 'assistant', content: response.content }]);
    } catch (err: any) {
      setChatError(err.message || 'Erro ao falar com o assistente.');
      setChatMessages((prev) => prev.slice(0, -1));
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-dark-300">A carregar dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard Executivo</h2>
        <p className="text-gray-600 dark:text-dark-300 mt-1">Visão geral de métricas e indicadores de performance</p>
      </div>

      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="space-y-5">
          <div>
            <div className="flex items-center gap-2 text-sm uppercase tracking-wide opacity-80">
              <Sparkles className="w-4 h-4" />
              Assistente Nikufra
            </div>
            <h3 className="text-2xl font-bold mt-1">Fala com o Assistente diretamente do Dashboard</h3>
            <p className="text-white/80">
              Usa o chat expandido para perguntas abertas, dispara sugestões rápidas ou envia documentos para ter respostas
              com contexto executivo imediato.
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-xl p-4 space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wide opacity-80 block mb-2">Sugestões rápidas</label>
                <div className="flex flex-wrap gap-2">
                  {llmSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleSendChat(suggestion)}
                      className="text-xs bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-full transition"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs uppercase tracking-wide opacity-80 block mb-2">Documentos rápidos</label>
                <div className="flex flex-wrap gap-2">
                  {documents.slice(0, 8).map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() =>
                        handleSendChat(
                          `Analisa o documento "${doc.title}" e partilha insights aplicáveis para o executivo.`,
                          `Documento selecionado: ${doc.title} (${doc.description ?? 'sem descrição'})`
                        )
                      }
                      className="text-xs bg-white/15 hover:bg-white/30 text-white px-3 py-1 rounded-full transition inline-flex items-center gap-1"
                    >
                      <Upload className="w-3 h-3" />
                      {doc.title}
                    </button>
                  ))}
                  {documents.length === 0 && <p className="text-xs text-white/70">Ainda não existem documentos.</p>}
                </div>
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-4 flex flex-col">
              <label className="text-xs uppercase tracking-wide opacity-80 block mb-2">Chat com o Assistente</label>
              <div className="flex-1 min-h-[320px] max-h-[520px] overflow-y-auto space-y-3 pr-1 bg-white/10 rounded-lg p-3">
                {chatMessages.length === 0 && (
                  <p className="text-sm text-white/70">
                    Ainda não fizeste perguntas. Usa as sugestões, seleciona um documento ou escreve a tua questão para obter
                    um insight imediato.
                  </p>
                )}
                {chatMessages.map((msg, index) => (
                  <div
                    key={index}
                    className={`text-sm px-3 py-2 rounded-lg leading-relaxed ${
                      msg.role === 'user' ? 'bg-white/30 text-white' : 'bg-white text-purple-700'
                    }`}
                  >
                    {msg.content}
                  </div>
                ))}
              </div>
              <div className="flex items-end gap-2 mt-3">
                <textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendChat();
                    }
                  }}
                  placeholder="Escreve a tua pergunta..."
                  rows={chatInput.length > 140 ? 4 : 3}
                  className="flex-1 text-sm text-purple-900 rounded-lg px-3 py-2 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white bg-white text-left"
                />
                <button
                  onClick={() => handleSendChat()}
                  disabled={!chatInput.trim() || chatLoading}
                  className="p-3 bg-white text-purple-700 rounded-lg hover:bg-purple-50 disabled:opacity-50 flex items-center justify-center min-w-[48px] min-h-[48px]"
                >
                  {chatLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
              {chatError && <p className="text-xs text-red-200 mt-2">{chatError}</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          className="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-800 p-6 shadow-sm hover:shadow-md transition cursor-pointer"
          onClick={() => navigate('/crm?tab=contacts')}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-primary-700 dark:text-primary-500" />
            </div>
            <span className="flex items-center text-sm text-primary-600 dark:text-primary-500 font-medium">
              <ArrowUp className="w-4 h-4 mr-1" />
              12%
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-dark-300 mb-1">Total Contactos</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{metrics.totalContacts}</p>
        </div>

        <div
          className="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-800 p-6 shadow-sm hover:shadow-md transition cursor-pointer"
          onClick={() => navigate('/crm?tab=leads')}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary-700 dark:text-primary-500" />
            </div>
            <span className="flex items-center text-sm text-primary-600 dark:text-primary-500 font-medium">
              <ArrowUp className="w-4 h-4 mr-1" />
              8%
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-dark-300 mb-1">Leads Ativos</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{metrics.activeLeads}</p>
        </div>

        <div
          className="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-800 p-6 shadow-sm hover:shadow-md transition cursor-pointer"
          onClick={() => navigate('/projects')}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-primary-700 dark:text-primary-500" />
            </div>
            <span className="flex items-center text-sm text-primary-600 dark:text-primary-500 font-medium">
              <ArrowUp className="w-4 h-4 mr-1" />
              5%
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-dark-300 mb-1">Projetos Ativos</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{metrics.activeProjects}</p>
        </div>

        <div
          className="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-800 p-6 shadow-sm hover:shadow-md transition cursor-pointer"
          onClick={() => navigate('/calendar')}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-primary-700 dark:text-primary-500" />
            </div>
            <span className="flex items-center text-sm text-red-600 dark:text-red-500 font-medium">
              <ArrowDown className="w-4 h-4 mr-1" />
              3%
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-dark-300 mb-1">Tarefas Pendentes</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{metrics.pendingTasks}</p>
        </div>

        <div
          className="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-800 p-6 shadow-sm hover:shadow-md transition cursor-pointer"
          onClick={() => navigate('/calendar')}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary-700 dark:text-primary-500" />
            </div>
            <span className="flex items-center text-sm text-primary-600 dark:text-primary-500 font-medium">
              <ArrowUp className="w-4 h-4 mr-1" />
              15%
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-dark-300 mb-1">Próximos Eventos</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{metrics.upcomingEvents}</p>
        </div>

        <div
          className="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-800 p-6 shadow-sm hover:shadow-md transition cursor-pointer"
          onClick={() => navigate('/documents')}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary-700 dark:text-primary-500" />
            </div>
            <span className="flex items-center text-sm text-gray-400 dark:text-dark-400">
              -
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-dark-300 mb-1">Documentos</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{metrics.documentsCount}</p>
        </div>

        {/* Risk Indicators */}
        <div
          className="bg-white dark:bg-dark-900 rounded-xl border border-yellow-200 dark:border-yellow-800 p-6 shadow-sm hover:shadow-md transition cursor-pointer"
          onClick={() => navigate('/crm?tab=leads')}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-yellow-700 dark:text-yellow-500" />
            </div>
            {metrics.staleLeadsCount > 0 && (
              <span className="flex items-center text-sm text-yellow-600 dark:text-yellow-500 font-medium">
                Atenção
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-dark-300 mb-1">Leads em Risco</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{metrics.staleLeadsCount}</p>
          <p className="text-xs text-gray-500 dark:text-dark-400 mt-1">
            Sem atividade há mais de 7 dias
          </p>
        </div>

        <div
          className="bg-white dark:bg-dark-900 rounded-xl border border-orange-200 dark:border-orange-800 p-6 shadow-sm hover:shadow-md transition cursor-pointer"
          onClick={() => navigate('/projects')}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-orange-700 dark:text-orange-500" />
            </div>
            {metrics.staleProjectsCount > 0 && (
              <span className="flex items-center text-sm text-orange-600 dark:text-orange-500 font-medium">
                Atenção
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-dark-300 mb-1">Projetos em Risco</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{metrics.staleProjectsCount}</p>
          <p className="text-xs text-gray-500 dark:text-dark-400 mt-1">
            Sem tarefas recentes há mais de 14 dias
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-800 p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Atividade Recente</h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-4 pb-4 border-b border-gray-100 dark:border-dark-800">
              <div className="w-2 h-2 bg-primary-600 dark:bg-primary-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Sistema inicializado</p>
                <p className="text-xs text-gray-500 dark:text-dark-300 mt-1">Plataforma pronta para utilização</p>
              </div>
              <span className="text-xs text-gray-400 dark:text-dark-400">Agora</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-800 p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Próximas Ações</h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-dark-850 rounded-lg border border-gray-100 dark:border-dark-800">
              <CheckCircle className="w-5 h-5 text-primary-600 dark:text-primary-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-700 dark:text-dark-200">Configurar primeiro contacto no CRM</p>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-dark-850 rounded-lg border border-gray-100 dark:border-dark-800">
              <CheckCircle className="w-5 h-5 text-primary-600 dark:text-primary-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-700 dark:text-dark-200">Criar primeiro projeto ou MVP</p>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-dark-850 rounded-lg border border-gray-100 dark:border-dark-800">
              <CheckCircle className="w-5 h-5 text-primary-600 dark:text-primary-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-700 dark:text-dark-200">Agendar primeira reunião de equipa</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
