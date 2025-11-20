import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useLeads } from '../../hooks/useLeads';
import { useActivities } from '../../hooks/useActivities';
import { useNotes } from '../../hooks/useNotes';
import { useProfiles } from '../../hooks/useProfiles';
import { useTasks } from '../../hooks/useTasks';
import { useDocuments } from '../../hooks/useDocuments';
import { useCompanies } from '../../hooks/useCompanies';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Euro, Calendar, User, Plus, FileText, CheckCircle, Clock, Sparkles, Trash2 } from 'lucide-react';
import type { LeadStage } from '../../types/crm';
import AssistantDrawer from '../../components/Assistant/AssistantDrawer';

const stageLabels: Record<LeadStage, string> = {
  new: 'Novo',
  contacted: 'Contactado',
  qualified: 'Qualificado',
  proposal: 'Proposta',
  negotiation: 'Negociação',
  won: 'Ganho',
  lost: 'Perdido',
};

const stageColors: Record<LeadStage, string> = {
  new: 'bg-gray-100 text-gray-700',
  contacted: 'bg-blue-100 text-blue-700',
  qualified: 'bg-green-100 text-green-700',
  proposal: 'bg-yellow-100 text-yellow-700',
  negotiation: 'bg-orange-100 text-orange-700',
  won: 'bg-emerald-100 text-emerald-700',
  lost: 'bg-red-100 text-red-700',
};

export default function LeadDetailView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getLeadById, deleteLead } = useLeads();
  const { activities, loading: activitiesLoading } = useActivities('lead', id || '');
  const { notes, addNote, loading: notesLoading } = useNotes('lead', id || '');
  const { collaborators } = useProfiles();
  const { companies } = useCompanies();
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      loadLead();
      loadTasks();
      loadDocuments();
    }
  }, [id]);

  const loadLead = async () => {
    if (!id) return;
    setLoading(true);
    const data = await getLeadById(id);
    setLead(data);
    setLoading(false);
  };

  const loadTasks = async () => {
    if (!id) return;
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('lead_id', id)
      .order('created_at', { ascending: false });
    setTasks(data || []);
  };

  const loadDocuments = async () => {
    if (!id) return;
    const { data } = await supabase
      .from('documents')
      .select('*')
      .eq('lead_id', id)
      .order('created_at', { ascending: false });
    setDocuments(data || []);
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !id) return;
    setSubmittingNote(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      const userId = user.user?.id || '00000000-0000-0000-0000-000000000000';
      await addNote(newNote, userId);
      setNewNote('');
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Erro ao adicionar nota');
    } finally {
      setSubmittingNote(false);
    }
  };

  const getAuthorName = (authorId: string) => {
    const profile = collaborators.find((c) => c.id === authorId);
    return profile?.name || 'Desconhecido';
  };

  const getCompanyName = (companyId?: string) => {
    if (!companyId) return null;
    const company = companies.find((c) => c.id === companyId);
    return company?.name || null;
  };

  const handleDeleteLead = async () => {
    if (!id || !lead) return;
    const confirmed = window.confirm(`Eliminar definitivamente a lead "${lead.title}"?`);
    if (!confirmed) return;
    try {
      setDeleting(true);
      await deleteLead(id);
      navigate('/crm');
    } catch (error) {
      console.error('Error deleting lead:', error);
      alert('Erro ao eliminar lead.');
    } finally {
      setDeleting(false);
    }
  };

  const formatActivity = (activity: any) => {
    const author = getAuthorName(activity.author_profile_id);
    const date = new Date(activity.created_at).toLocaleString('pt-PT');

    switch (activity.type) {
      case 'note':
        const preview = activity.metadata?.content_preview || '';
        return { icon: '📝', text: `Nota adicionada por ${author}: ${preview}`, date };
      case 'status_change':
        const from = activity.metadata?.fromStatus || '';
        const to = activity.metadata?.toStatus || '';
        return { icon: '🔄', text: `Estado alterado de "${stageLabels[from as LeadStage] || from}" para "${stageLabels[to as LeadStage] || to}" por ${author}`, date };
      case 'task_created':
        const taskTitle = activity.metadata?.task_title || '';
        return { icon: '✅', text: `Tarefa criada: ${taskTitle} por ${author}`, date };
      case 'document_added':
        const docTitle = activity.metadata?.document_title || '';
        return { icon: '📄', text: `Documento adicionado: "${docTitle}" por ${author}`, date };
      case 'manual':
        const desc = activity.metadata?.description || '';
        return { icon: '📌', text: `Atividade registada: ${desc} por ${author}`, date };
      default:
        return { icon: '•', text: `Atividade por ${author}`, date };
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">A carregar lead...</p>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Lead não encontrado</h2>
          <p className="text-gray-600 mb-4">O lead que procura não existe ou foi removido.</p>
          <button
            onClick={() => navigate('/crm')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Voltar ao CRM
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <button
          onClick={() => navigate('/crm')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao CRM</span>
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{lead.title}</h1>
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${stageColors[lead.stage]}`}>
                {stageLabels[lead.stage]}
              </span>
              {lead.value && (
                <div className="flex items-center text-gray-600">
                  <Euro className="w-4 h-4 mr-1" />
                  <span className="font-semibold">
                    {lead.value.toLocaleString('pt-PT', { style: 'currency', currency: lead.currency })}
                  </span>
                </div>
              )}
              {lead.company_id && getCompanyName(lead.company_id) && (
                <Link
                  to={`/crm/companies/${lead.company_id}`}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  {getCompanyName(lead.company_id)}
                </Link>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end space-y-3">
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-gray-400">Precisas de um insight rápido?</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setAssistantOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
              >
                <Sparkles className="w-4 h-4" />
                <span>Falar com o Assistente</span>
              </button>
              <button
                onClick={handleDeleteLead}
                disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                <span>{deleting ? 'A eliminar...' : 'Eliminar Lead'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Esquerda */}
        <div className="lg:col-span-2 space-y-6">
          {/* Resumo */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Resumo</h2>
            <div className="space-y-3">
              {lead.expected_close_date && (
                <div className="flex items-center text-sm">
                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                  <span className="text-gray-600">Data de fecho esperada: </span>
                  <span className="font-medium ml-1">
                    {new Date(lead.expected_close_date).toLocaleDateString('pt-PT')}
                  </span>
                </div>
              )}
              {lead.probability !== undefined && (
                <div className="flex items-center text-sm">
                  <span className="text-gray-600">Probabilidade: </span>
                  <span className="font-medium ml-1">{lead.probability}%</span>
                </div>
              )}
              {lead.owner_id && (
                <div className="flex items-center text-sm">
                  <User className="w-4 h-4 mr-2 text-gray-400" />
                  <span className="text-gray-600">Proprietário: </span>
                  <span className="font-medium ml-1">{getAuthorName(lead.owner_id)}</span>
                </div>
              )}
              <div className="flex items-center text-sm">
                <Clock className="w-4 h-4 mr-2 text-gray-400" />
                <span className="text-gray-600">Criado em: </span>
                <span className="font-medium ml-1">
                  {new Date(lead.created_at).toLocaleDateString('pt-PT')}
                </span>
              </div>
            </div>
          </div>

          {/* Tarefas */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Tarefas</h2>
              <button className="flex items-center space-x-2 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Plus className="w-4 h-4" />
                <span>Nova Tarefa</span>
              </button>
            </div>
            {tasks.length === 0 ? (
              <p className="text-gray-500 text-sm">Sem tarefas associadas</p>
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                    <CheckCircle className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{task.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Documentos */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Documentos</h2>
            {documents.length === 0 ? (
              <p className="text-gray-500 text-sm">Sem documentos associados</p>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{doc.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Coluna Direita - Timeline */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Timeline de Atividades</h2>
            {activitiesLoading ? (
              <p className="text-gray-500 text-sm">A carregar...</p>
            ) : activities.length === 0 ? (
              <p className="text-gray-500 text-sm">Sem atividades registadas</p>
            ) : (
              <div className="space-y-4">
                {activities.map((activity) => {
                  const formatted = formatActivity(activity);
                  return (
                    <div key={activity.id} className="border-l-2 border-gray-200 pl-4 pb-4">
                      <div className="flex items-start space-x-2">
                        <span className="text-lg">{formatted.icon}</span>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">{formatted.text}</p>
                          <p className="text-xs text-gray-500 mt-1">{formatted.date}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Nova Nota */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Adicionar Nota</h2>
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Escreva uma nota..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-3"
            />
            <button
              onClick={handleAddNote}
              disabled={submittingNote || !newNote.trim()}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {submittingNote ? 'A adicionar...' : 'Adicionar Nota'}
            </button>
          </div>
        </div>
      </div>

      {/* Assistant Drawer */}
      <AssistantDrawer
        isOpen={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        entity={lead}
        activities={activities}
        tasks={tasks}
        documents={documents}
        entityType="lead"
      />
    </div>
  );
}

