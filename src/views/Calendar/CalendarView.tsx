import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, User } from 'lucide-react';

type Task = {
  id: string;
  title: string;
  assignedTo: string;
  date: Date;
  time: string;
  color: string;
};

const collaborators = [
  { id: '1', name: 'João Silva', color: 'bg-blue-500' },
  { id: '2', name: 'Maria Costa', color: 'bg-green-500' },
  { id: '3', name: 'Pedro Santos', color: 'bg-purple-500' },
  { id: '4', name: 'Ana Oliveira', color: 'bg-orange-500' },
  { id: '5', name: 'Carlos Pereira', color: 'bg-pink-500' },
];

const getDaysInMonth = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  return { daysInMonth, startingDayOfWeek, year, month };
};

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks] = useState<Task[]>([]);
  const [selectedCollaborator, setSelectedCollaborator] = useState<string | null>(null);

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getTasksForDay = (day: number) => {
    const dayDate = new Date(year, month, day);
    return tasks.filter(task => {
      const taskDate = new Date(task.date);
      return (
        taskDate.getDate() === day &&
        taskDate.getMonth() === month &&
        taskDate.getFullYear() === year &&
        (!selectedCollaborator || task.assignedTo === selectedCollaborator)
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
          {dayTasks.map((task) => (
            <div
              key={task.id}
              className={`${task.color} text-white text-xs px-2 py-1 rounded truncate`}
              title={`${task.title} - ${task.time}`}
            >
              {task.time} {task.title}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Calendário & Tarefas</h2>
          <p className="text-gray-600 dark:text-dark-300 mt-1">Gestão de eventos e atribuição de tarefas por colaborador</p>
        </div>

        <button className="flex items-center space-x-2 px-4 py-2 bg-primary-700 dark:bg-primary-700 text-white rounded-lg hover:bg-primary-800 dark:hover:bg-primary-800 transition shadow-lg">
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
                <span className="text-lg font-bold text-gray-900 dark:text-white">0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
