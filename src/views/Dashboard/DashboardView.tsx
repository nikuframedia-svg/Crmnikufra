import { useEffect, useState } from 'react';
import { Users, TrendingUp, Briefcase, CheckCircle, Calendar, FileText, ArrowUp, ArrowDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type Stats = {
  totalContacts: number;
  totalLeads: number;
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  upcomingEvents: number;
  totalDocuments: number;
};

export default function DashboardView() {
  const [stats, setStats] = useState<Stats>({
    totalContacts: 0,
    totalLeads: 0,
    totalProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    upcomingEvents: 0,
    totalDocuments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      const [
        { count: contactsCount },
        { count: leadsCount },
        { count: projectsCount },
        { count: tasksCount },
        { count: completedTasksCount },
        { count: eventsCount },
        { count: documentsCount },
      ] = await Promise.all([
        supabase.from('contacts').select('*', { count: 'exact', head: true }),
        supabase.from('leads').select('*', { count: 'exact', head: true }),
        supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('tasks').select('*', { count: 'exact', head: true }),
        supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'done'),
        supabase.from('calendar_events').select('*', { count: 'exact', head: true }).gte('start_time', new Date().toISOString()),
        supabase.from('documents').select('*', { count: 'exact', head: true }),
      ]);

      setStats({
        totalContacts: contactsCount || 0,
        totalLeads: leadsCount || 0,
        totalProjects: projectsCount || 0,
        totalTasks: tasksCount || 0,
        completedTasks: completedTasksCount || 0,
        upcomingEvents: eventsCount || 0,
        totalDocuments: documentsCount || 0,
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const taskCompletionRate = stats.totalTasks > 0
    ? ((stats.completedTasks / stats.totalTasks) * 100).toFixed(1)
    : 0;

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-800 p-6 shadow-sm hover:shadow-md transition">
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
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalContacts}</p>
        </div>

        <div className="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-800 p-6 shadow-sm hover:shadow-md transition">
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
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalLeads}</p>
        </div>

        <div className="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-800 p-6 shadow-sm hover:shadow-md transition">
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
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalProjects}</p>
        </div>

        <div className="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-800 p-6 shadow-sm hover:shadow-md transition">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-primary-700 dark:text-primary-500" />
            </div>
            <span className="flex items-center text-sm text-red-600 dark:text-red-500 font-medium">
              <ArrowDown className="w-4 h-4 mr-1" />
              3%
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-dark-300 mb-1">Tarefas</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalTasks}</p>
          <p className="text-xs text-gray-500 dark:text-dark-400 mt-2">
            {stats.completedTasks} concluídas ({taskCompletionRate}%)
          </p>
        </div>

        <div className="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-800 p-6 shadow-sm hover:shadow-md transition">
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
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.upcomingEvents}</p>
        </div>

        <div className="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-800 p-6 shadow-sm hover:shadow-md transition">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary-700 dark:text-primary-500" />
            </div>
            <span className="flex items-center text-sm text-gray-400 dark:text-dark-400">
              -
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-dark-300 mb-1">Documentos</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalDocuments}</p>
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
