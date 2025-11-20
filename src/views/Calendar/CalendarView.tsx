import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, User, X, Trash2, Loader2 } from 'lucide-react';
import { useTasks } from '../../hooks/useTasks';
import { useProfiles } from '../../hooks/useProfiles';
import type { TaskStatus, ProjectPriority } from '../../types/crm';

const getDaysInMonth = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  return { daysInMonth, startingDayOfWeek, year, month };
};

const COLOR_HEX_MAP: Record<string, string> = {
  'bg-blue-600': '#2563eb',
  'bg-green-600': '#16a34a',
  'bg-purple-600': '#9333ea',
  'bg-orange-600': '#ea580c',
  'bg-red-500': '#ef4444',
};

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCollaborator, setSelectedCollaborator] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const { collaborators } = useProfiles();
  const { tasks, loading, fetchTasks, addTask, deleteTask } = useTasks();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo' as TaskStatus,
    priority: 'medium' as ProjectPriority,
    date: '',
    start_time: '',
    end_time: '',
    assignee_profile_id: '',
    assignee_profile_ids: [] as string[],
  });
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  useEffect(() => {
    fetchTasks({ month, year, assignee_profile_id: selectedCollaborator || undefined });
  }, [month, year, selectedCollaborator]);

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getCollaboratorColorHex = (collaboratorId: string) => {
    const collab = collaborators.find((c) => c.id === collaboratorId);
    if (!collab) return '#475569';
    return COLOR_HEX_MAP[collab.color] || '#475569';
  };

  const getTaskBackgroundStyle = (assigneeIds: string[]) => {
    if (assigneeIds.length <= 1) {
      const colorHex = assigneeIds.length === 1 ? getCollaboratorColorHex(assigneeIds[0]) : '#475569';
      return { backgroundColor: colorHex };
    }

    const segments = assigneeIds.map((id, index) => {
      const start = (index / assigneeIds.length) * 100;
      const end = ((index + 1) / assigneeIds.length) * 100;
      return `${getCollaboratorColorHex(id)} ${start}% ${end}%`;
    });

    return {
      backgroundImage: `linear-gradient(90deg, ${segments.join(', ')})`,
    };
  };

  const getTasksForDay = (day: number) => {
    const dayDate = new Date(year, month, day);
    return tasks.filter((task) => {
      const taskDateStr = task.due_date || task.date;
      if (!taskDateStr) return false;
      const taskDate = new Date(taskDateStr);
      const assigneeIds =
        task.assignee_profile_ids && task.assignee_profile_ids.length > 0
          ? task.assignee_profile_ids
          : task.assignee_profile_id
            ? [task.assignee_profile_id]
            : task.assigned_to
              ? [task.assigned_to]
              : [];
      return (
        taskDate.getDate() === day &&
        taskDate.getMonth() === month &&
        taskDate.getFullYear() === year &&
        (!selectedCollaborator ||
          assigneeIds.includes(selectedCollaborator) ||
          task.assigned_to === selectedCollaborator)
      );
    });
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addTask({
        title: formData.title,
        description: formData.description || undefined,
        status: formData.status,
        priority: formData.priority,
        date: formData.date || undefined, // useTasks will map this to due_date
        start_time: formData.start_time || undefined,
        end_time: formData.end_time || undefined,
        assignee_profile_id: formData.assignee_profile_ids[0] || formData.assignee_profile_id || undefined,
        assignee_profile_ids: formData.assignee_profile_ids,
      });
      setShowModal(false);
      setFormData({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        date: '',
        start_time: '',
        end_time: '',
        assignee_profile_id: '',
        assignee_profile_ids: [],
      });
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Erro ao criar tarefa. Verifica a consola.');
    }
  };

  const toggleAssignee = (collaboratorId: string) => {
    setFormData((prev) => {
      const exists = prev.assignee_profile_ids.includes(collaboratorId);
      const next = exists
        ? prev.assignee_profile_ids.filter((id) => id !== collaboratorId)
        : [...prev.assignee_profile_ids, collaboratorId];
      return {
        ...prev,
        assignee_profile_ids: next,
        assignee_profile_id: next[0] || '',
      };
    });
  };

  const handleDeleteTask = async (taskId: string, title: string) => {
    const confirmed = window.confirm(`Queres eliminar a tarefa "${title}"?`);
    if (!confirmed) return;
    try {
      setDeletingTaskId(taskId);
      await deleteTask(taskId);
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Erro ao eliminar tarefa.');
    } finally {
      setDeletingTaskId(null);
    }
  };

  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} className="min-h-[120px] bg-gray-50 dark:bg-dark-950"></div>);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dayTasks = getTasksForDay(day);
    const today = isToday(day);

    days.push(
      <div
        key={day}
        className={`min-h-[120px] border border-gray-200 dark:border-dark-800 p-2 ${
          today ? 'bg-primary-50 dark:bg-primary-900/20' : 'bg-white dark:bg-dark-900'
        } hover:bg-gray-50 dark:hover:bg-dark-850 transition cursor-pointer`}
      >
        <div className={`text-sm font-medium mb-2 ${
          today
            ? 'text-primary-700 dark:text-primary-400 font-bold'
            : 'text-gray-700 dark:text-dark-200'
        }`}>
          {day}
        </div>
        <div className="space-y-1">
          {dayTasks.map((task) => {
            const assigneeIds =
              task.assignee_profile_ids && task.assignee_profile_ids.length > 0
                ? task.assignee_profile_ids
                : task.assignee_profile_id
                  ? [task.assignee_profile_id]
                  : task.assigned_to
                    ? [task.assigned_to]
                    : [];
            const timeDisplay = task.start_time ? `${task.start_time} ` : '';
            return (
              <div
                key={task.id}
                className="text-white text-xs px-2 py-1 rounded flex items-center justify-between gap-2"
                style={getTaskBackgroundStyle(assigneeIds)}
                title={`${task.title}${task.start_time ? ` - ${task.start_time}` : ''}`}
              >
                <span className="truncate">
                  {timeDisplay}
                  {task.title}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteTask(task.id, task.title);
                  }}
                  className="text-white/80 hover:text-white"
                  title="Eliminar tarefa"
                >
                  {deletingTaskId === task.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-8">A carregar calendário...</div>;
  }

  return (
    <>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Calendário & Tarefas</h2>
            <p className="text-gray-600 dark:text-dark-300 mt-1">Gestão de eventos e atribuição de tarefas por colaborador</p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-700 dark:bg-primary-700 text-white rounded-lg hover:bg-primary-800 dark:hover:bg-primary-800 transition shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Tarefa</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-800 shadow-sm">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-800">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {monthNames[month]} {year}
                </h3>
                <div className="flex space-x-2">
                  <button
                    onClick={previousMonth}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-dark-850 rounded-lg transition"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-dark-200" />
                  </button>
                  <button
                    onClick={() => setCurrentDate(new Date())}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-dark-200 hover:bg-gray-100 dark:hover:bg-dark-850 rounded-lg transition"
                  >
                    Hoje
                  </button>
                  <button
                    onClick={nextMonth}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-dark-850 rounded-lg transition"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-700 dark:text-dark-200" />
                  </button>
                </div>
              </div>

              <div className="p-4">
                <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-dark-800">
                  {weekDays.map((day) => (
                    <div
                      key={day}
                      className="bg-gray-50 dark:bg-dark-850 p-3 text-center text-sm font-semibold text-gray-700 dark:text-dark-200"
                    >
                      {day}
                    </div>
                  ))}
                  {days}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-800 shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Colaboradores</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedCollaborator(null)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                    selectedCollaborator === null
                      ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                      : 'hover:bg-gray-50 dark:hover:bg-dark-850 text-gray-700 dark:text-dark-200'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span className="font-medium">Todos</span>
                </button>
                {collaborators.map((collaborator) => (
                  <button
                    key={collaborator.id}
                    onClick={() => setSelectedCollaborator(collaborator.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                      selectedCollaborator === collaborator.id
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                        : 'hover:bg-gray-50 dark:hover:bg-dark-850 text-gray-700 dark:text-dark-200'
                    }`}
                  >
                    <div className={`w-3 h-3 ${collaborator.color} rounded-full`}></div>
                    <span className="font-medium">{collaborator.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-800 shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Legenda</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-700 dark:border-primary-500 rounded"></div>
                  <span className="text-gray-700 dark:text-dark-200">Dia atual</span>
                </div>
                {collaborators.map((collaborator) => (
                  <div key={collaborator.id} className="flex items-center space-x-2">
                    <div className={`w-4 h-4 ${collaborator.color} rounded`}></div>
                    <span className="text-gray-700 dark:text-dark-200">{collaborator.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-800 shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Estatísticas</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-dark-300">Total de tarefas</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">{tasks.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-dark-300">Este mês</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {tasks.filter((t) => {
                      if (!t.date) return false;
                      const taskDate = new Date(t.date);
                      return taskDate.getMonth() === month && taskDate.getFullYear() === year;
                    }).length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-900 rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Nova Tarefa</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-1">Título *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-800 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-dark-900 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-1">Descrição</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-800 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-dark-900 text-gray-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-1">Estado</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-dark-800 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-dark-900 text-gray-900 dark:text-white"
                  >
                    <option value="todo">Por Fazer</option>
                    <option value="in_progress">Em Progresso</option>
                    <option value="review">Em Revisão</option>
                    <option value="done">Concluído</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-1">Prioridade</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as ProjectPriority })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-dark-800 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-dark-900 text-gray-900 dark:text-white"
                  >
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-1">Data</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-800 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-dark-900 text-gray-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-1">Hora Início</label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-dark-800 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-dark-900 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-1">Hora Fim</label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-dark-800 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-dark-900 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-2">Atribuir a</label>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 dark:border-dark-800 rounded-lg p-3">
                  {collaborators.map((collab) => (
                    <label key={collab.id} className="flex items-center space-x-3 text-sm text-gray-700 dark:text-dark-200">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        checked={formData.assignee_profile_ids.includes(collab.id)}
                        onChange={() => toggleAssignee(collab.id)}
                      />
                      <span>{collab.name}</span>
                    </label>
                  ))}
                  {collaborators.length === 0 && <p className="text-sm text-gray-500">Sem colaboradores disponíveis.</p>}
                </div>
                <p className="text-xs text-gray-500 dark:text-dark-400 mt-1">Podes selecionar vários responsáveis.</p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-dark-800 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-850 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Criar Tarefa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
