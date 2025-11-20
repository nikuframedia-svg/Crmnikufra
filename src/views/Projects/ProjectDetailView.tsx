import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjects } from '../../hooks/useProjects';
import { useActivities } from '../../hooks/useActivities';
import { useNotes } from '../../hooks/useNotes';
import { useProfiles } from '../../hooks/useProfiles';
import { useTasks } from '../../hooks/useTasks';
import { useDocuments } from '../../hooks/useDocuments';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Folder, Calendar, User, Plus, FileText, CheckCircle, Clock, Sparkles, Trash2 } from 'lucide-react';
import AssistantDrawer from '../../components/Assistant/AssistantDrawer';

const statusLabels: Record<string, string> = {
  planning: 'Planeado',
  active: 'Em Curso',
  on_hold: 'Em Pausa',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

const statusColors: Record<string, string> = {
  planning: 'bg-gray-100 text-gray-700',
  active: 'bg-blue-100 text-blue-700',
  on_hold: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function ProjectDetailView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getProjectById, deleteProject } = useProjects();
  const { activities, loading: activitiesLoading } = useActivities('project', id || '');
  const { notes, addNote } = useNotes('project', id || '');
  const { collaborators } = useProfiles();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      loadProject();
      loadTasks();
      loadDocuments();
    }
  }, [id]);

  const loadProject = async () => {
    if (!id) return;
    setLoading(true);
    const data = await getProjectById(id);
    setProject(data);
    setLoading(false);
  };

  const loadTasks = async () => {
    if (!id) return;
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: false });
    setTasks(data || []);
  };

  const loadDocuments = async () => {
    if (!id) return;
    const { data } = await supabase
      .from('documents')
      .select('*')
      .eq('project_id', id)
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

  const handleDeleteProject = async () => {
    if (!id || !project) return;
    const confirmed = window.confirm(`Eliminar o projeto "${project.name}"?`);
    if (!confirmed) return;
    try {
      setDeleting(true);
      await deleteProject(id);
      navigate('/projects');
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Erro ao eliminar projeto.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">A carregar projeto...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Projeto não encontrado</h2>
          <button
            onClick={() => navigate('/projects')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Voltar aos Projetos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar aos Projetos</span>
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.name}</h1>
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[project.status]}`}>
                {statusLabels[project.status]}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end space-y-3">
            <p className="text-xs uppercase tracking-wide text-gray-400 dark:text-dark-400">
              Gerar resumo / próximos passos
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setAssistantOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
              >
                <Sparkles className="w-4 h-4" />
                <span>Falar com o Assistente</span>
              </button>
              <button
                onClick={handleDeleteProject}
                disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                <span>{deleting ? 'A eliminar...' : 'Eliminar Projeto'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {project.description && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Descrição</h2>
              <p className="text-gray-600">{project.description}</p>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Informações</h2>
            <div className="space-y-3">
              {project.start_date && (
                <div className="flex items-center text-sm">
                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                  <span className="text-gray-600">Início: </span>
                  <span className="font-medium ml-1">
                    {new Date(project.start_date).toLocaleDateString('pt-PT')}
                  </span>
                </div>
              )}
              {project.end_date && (
                <div className="flex items-center text-sm">
                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                  <span className="text-gray-600">Fim: </span>
                  <span className="font-medium ml-1">
                    {new Date(project.end_date).toLocaleDateString('pt-PT')}
                  </span>
                </div>
              )}
              <div className="flex items-center text-sm">
                <Clock className="w-4 h-4 mr-2 text-gray-400" />
                <span className="text-gray-600">Criado em: </span>
                <span className="font-medium ml-1">
                  {new Date(project.created_at).toLocaleDateString('pt-PT')}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Tarefas</h2>
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

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Timeline</h2>
            {activitiesLoading ? (
              <p className="text-gray-500 text-sm">A carregar...</p>
            ) : activities.length === 0 ? (
              <p className="text-gray-500 text-sm">Sem atividades</p>
            ) : (
              <div className="space-y-4">
                {activities.map((activity) => {
                  const author = getAuthorName(activity.author_profile_id);
                  const date = new Date(activity.created_at).toLocaleString('pt-PT');
                  
                  let activityText = '';
                  let icon = '📝';
                  
                  switch (activity.type) {
                    case 'note':
                      const preview = activity.metadata?.content_preview || '';
                      activityText = `Nota adicionada por ${author}: ${preview}`;
                      break;
                    case 'task_created':
                      const taskTitle = activity.metadata?.task_title || '';
                      activityText = `Tarefa criada: "${taskTitle}" por ${author}`;
                      icon = '✅';
                      break;
                    case 'document_added':
                      const docTitle = activity.metadata?.document_title || '';
                      activityText = `Documento adicionado: "${docTitle}" por ${author}`;
                      icon = '📄';
                      break;
                    default:
                      activityText = `Atividade por ${author}`;
                  }
                  
                  return (
                    <div key={activity.id} className="border-l-2 border-gray-200 pl-4 pb-4">
                      <div className="flex items-start space-x-2">
                        <span className="text-lg">{icon}</span>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">{activityText}</p>
                          <p className="text-xs text-gray-500 mt-1">{date}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

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
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
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
        entity={project}
        activities={activities}
        tasks={tasks}
        documents={documents}
        entityType="project"
      />
    </div>
  );
}

