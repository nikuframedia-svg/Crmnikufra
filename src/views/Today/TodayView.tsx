import { useNavigate } from 'react-router-dom';
import { useMyDay } from '../../hooks/useMyDay';
import { useAuth } from '../../contexts/AuthContext';
import { useSignalToNoiseForUser } from '../../hooks/useSignalToNoiseForUser';
import { useTasks } from '../../hooks/useTasks';
import { useLeads } from '../../hooks/useLeads';
import { useProjects } from '../../hooks/useProjects';
import { CheckCircle, Clock, AlertCircle, Calendar, TrendingUp, Activity, ArrowRight, Target } from 'lucide-react';

export default function TodayView() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const { data, loading, error } = useMyDay();
  const { tasks: allTasks } = useTasks();
  const { leads: allLeads } = useLeads();
  const { projects: allProjects } = useProjects();

  // Calcular top prioridades usando Signal-to-Noise Ratio
  const { topTasks: topPriorities } = useSignalToNoiseForUser(
    profile
      ? {
          profile,
          allTasks,
          allLeads,
          allProjects,
          allActivities: [], // Não usado diretamente no cálculo SNR, mas mantido para compatibilidade
        }
      : {
          profile: { id: '', email: '', full_name: '', role: 'user', created_at: '', updated_at: '' },
          allTasks: [],
          allLeads: [],
          allProjects: [],
          allActivities: [],
        },
    { horizonHours: 24, maxHighIntensityTasks: 5 }
  );

  if (authLoading || loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-dark-300">A carregar a tua agenda...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <p className="text-red-800 dark:text-red-400">Erro ao carregar dados: {error}</p>
        </div>
      </div>
    );
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Minha Agenda</h2>
        <p className="text-gray-600 dark:text-dark-300 mt-1">Tudo o que é crítico para ti hoje</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Esquerda */}
        <div className="lg:col-span-2 space-y-6">
          {/* Top Prioridades (Signal-to-Noise) */}
          {profile && topPriorities.length > 0 && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl shadow-sm border border-purple-200 dark:border-purple-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Top Prioridades (Próximas 24h)</h3>
                </div>
                <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-3 py-1 rounded-full text-sm font-medium">
                  {topPriorities.length}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-dark-400 mb-4">
                Tarefas com maior impacto real calculadas pelo algoritmo Signal-to-Noise Ratio
              </p>
              <div className="space-y-2">
                {topPriorities.map((task, index) => (
                  <div
                    key={task.id}
                    onClick={() => {
                      if (task.lead_id) navigate(`/crm/leads/${task.lead_id}`);
                      else if (task.project_id) navigate(`/projects/${task.project_id}`);
                      else navigate('/calendar');
                    }}
                    className="flex items-center justify-between p-4 bg-white dark:bg-dark-900 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/10 transition cursor-pointer border border-purple-100 dark:border-purple-800"
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="flex-shrink-0 w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                        <span className="text-purple-700 dark:text-purple-400 font-bold text-sm">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{task.title}</p>
                        <div className="flex items-center space-x-3 mt-1">
                          <span className="text-xs text-gray-500 dark:text-dark-400">
                            SNR: {task.snrScore.toFixed(2)}
                          </span>
                          {task.date && (
                            <span className="text-xs text-gray-500 dark:text-dark-400">
                              {formatTime(task.date)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tarefas de Hoje */}
          <div className="bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-gray-200 dark:border-dark-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Tarefas de Hoje</h3>
              </div>
              <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-full text-sm font-medium">
                {data.tasksToday.length}
              </span>
            </div>
            {data.tasksToday.length === 0 ? (
              <p className="text-gray-500 dark:text-dark-400 text-sm">Nada agendado para hoje. Bom trabalho! 🎉</p>
            ) : (
              <div className="space-y-2">
                {data.tasksToday.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => {
                      if (task.lead_id) navigate(`/crm/leads/${task.lead_id}`);
                      else if (task.project_id) navigate(`/projects/${task.project_id}`);
                      else navigate('/calendar');
                    }}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-850 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-800 transition cursor-pointer"
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <CheckCircle className="w-4 h-4 text-gray-400" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{task.title}</p>
                        {task.date && (
                          <p className="text-xs text-gray-500 dark:text-dark-400">
                            {formatTime(task.date)}
                          </p>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tarefas Atrasadas */}
          <div className="bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-red-200 dark:border-red-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Tarefas Atrasadas</h3>
              </div>
              <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-3 py-1 rounded-full text-sm font-medium">
                {data.tasksOverdue.length}
              </span>
            </div>
            {data.tasksOverdue.length === 0 ? (
              <p className="text-gray-500 dark:text-dark-400 text-sm">Nenhuma tarefa atrasada. Estás em dia! ✅</p>
            ) : (
              <div className="space-y-2">
                {data.tasksOverdue.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => {
                      if (task.lead_id) navigate(`/crm/leads/${task.lead_id}`);
                      else if (task.project_id) navigate(`/projects/${task.project_id}`);
                      else navigate('/calendar');
                    }}
                    className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/10 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition cursor-pointer"
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <Clock className="w-4 h-4 text-red-600 dark:text-red-400" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{task.title}</p>
                        {task.date && (
                          <p className="text-xs text-red-600 dark:text-red-400">
                            Atrasada desde {formatDate(task.date)}
                          </p>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reuniões / Eventos de Hoje */}
          <div className="bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-gray-200 dark:border-dark-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Reuniões / Eventos de Hoje</h3>
              </div>
              <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-3 py-1 rounded-full text-sm font-medium">
                {data.eventsToday.length}
              </span>
            </div>
            {data.eventsToday.length === 0 ? (
              <p className="text-gray-500 dark:text-dark-400 text-sm">Sem eventos agendados para hoje.</p>
            ) : (
              <div className="space-y-2">
                {data.eventsToday.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => {
                      if (event.lead_id) navigate(`/crm/leads/${event.lead_id}`);
                      else if (event.project_id) navigate(`/projects/${event.project_id}`);
                      else navigate('/calendar');
                    }}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-850 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-800 transition cursor-pointer"
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{event.title}</p>
                        {event.date && (
                          <p className="text-xs text-gray-500 dark:text-dark-400">
                            {formatTime(event.date)}
                          </p>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Coluna Direita */}
        <div className="space-y-6">
          {/* Leads que Precisam de Follow-up */}
          <div className="bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-gray-200 dark:border-dark-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Leads para Follow-up</h3>
              </div>
              <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-3 py-1 rounded-full text-sm font-medium">
                {data.leadsNeedingFollowUp.length}
              </span>
            </div>
            {data.leadsNeedingFollowUp.length === 0 ? (
              <p className="text-gray-500 dark:text-dark-400 text-sm">Todos os leads estão atualizados! 👍</p>
            ) : (
              <div className="space-y-2">
                {data.leadsNeedingFollowUp.slice(0, 5).map((lead) => (
                  <div
                    key={lead.id}
                    onClick={() => navigate(`/crm/leads/${lead.id}`)}
                    className="p-3 bg-gray-50 dark:bg-dark-850 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-800 transition cursor-pointer"
                  >
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{lead.title}</p>
                    <p className="text-xs text-gray-500 dark:text-dark-400 mt-1">
                      Sem atividade há mais de 7 dias
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Projetos em Risco */}
          <div className="bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-yellow-200 dark:border-yellow-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Projetos em Risco</h3>
              </div>
              <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-3 py-1 rounded-full text-sm font-medium">
                {data.riskProjects.length}
              </span>
            </div>
            {data.riskProjects.length === 0 ? (
              <p className="text-gray-500 dark:text-dark-400 text-sm">Nenhum projeto em risco. Tudo a correr bem! 🚀</p>
            ) : (
              <div className="space-y-2">
                {data.riskProjects.slice(0, 5).map((project) => (
                  <div
                    key={project.id}
                    onClick={() => navigate(`/projects/${project.id}`)}
                    className="p-3 bg-gray-50 dark:bg-dark-850 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-800 transition cursor-pointer"
                  >
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{project.name}</p>
                    <p className="text-xs text-gray-500 dark:text-dark-400 mt-1">
                      Sem atividade recente
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Atividade Recente para Mim */}
          <div className="bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-gray-200 dark:border-dark-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Atividade Recente</h3>
              </div>
            </div>
            {data.recentActivitiesForMe.length === 0 ? (
              <p className="text-gray-500 dark:text-dark-400 text-sm">Sem atividade recente.</p>
            ) : (
              <div className="space-y-3">
                {data.recentActivitiesForMe.slice(0, 5).map((activity) => {
                  const getActivityText = () => {
                    switch (activity.type) {
                      case 'note':
                        return `Nota adicionada`;
                      case 'status_change':
                        return `Estado alterado`;
                      case 'task_created':
                        return `Tarefa criada`;
                      case 'document_added':
                        return `Documento adicionado`;
                      default:
                        return `Atividade`;
                    }
                  };

                  const getEntityLink = () => {
                    if (activity.entity_type === 'lead') return `/crm/leads/${activity.entity_id}`;
                    if (activity.entity_type === 'project') return `/projects/${activity.entity_id}`;
                    if (activity.entity_type === 'contact') return `/crm/contacts/${activity.entity_id}`;
                    if (activity.entity_type === 'company') return `/crm/companies/${activity.entity_id}`;
                    return null;
                  };

                  const link = getEntityLink();

                  return (
                    <div
                      key={activity.id}
                      onClick={() => link && navigate(link)}
                      className={`p-2 text-xs text-gray-600 dark:text-dark-400 ${link ? 'hover:bg-gray-50 dark:hover:bg-dark-850 rounded cursor-pointer' : ''}`}
                    >
                      <p className="font-medium">{getActivityText()}</p>
                      <p className="text-gray-500 dark:text-dark-500">
                        {new Date(activity.created_at).toLocaleDateString('pt-PT', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

