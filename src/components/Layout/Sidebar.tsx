import { LayoutDashboard, Users, Briefcase, FileText, Calendar, BarChart3, Moon, Sun, CalendarCheck, Settings, MessageSquare } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

type MenuItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const menuItems: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'today', label: 'Minha Agenda', icon: CalendarCheck },
  { id: 'crm', label: 'CRM & Vendas', icon: Users },
  { id: 'projects', label: 'Projetos', icon: Briefcase },
  { id: 'documents', label: 'Documentação', icon: FileText },
  { id: 'calendar', label: 'Calendário', icon: Calendar },
  { id: 'chat', label: 'Chat Colaborativo', icon: MessageSquare },
  { id: 'performance', label: 'Performance', icon: BarChart3 },
  { id: 'settings', label: 'Configurações', icon: Settings },
];

type SidebarProps = {
  currentView: string;
  onViewChange: (view: string) => void;
};

export default function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="w-64 bg-primary-900 dark:bg-dark-950 text-white flex flex-col h-screen border-r border-primary-800 dark:border-dark-800">
      <div className="p-6 border-b border-primary-800 dark:border-dark-800">
        <h1 className="text-2xl font-bold text-white">Nikufra.ai</h1>
        <p className="text-sm text-primary-200 dark:text-dark-300 mt-1">Work OS + CRM</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
              currentView === item.id
                ? 'bg-primary-700 dark:bg-primary-700 text-white shadow-lg'
                : 'text-primary-100 dark:text-dark-200 hover:bg-primary-800 dark:hover:bg-dark-850'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-primary-800 dark:border-dark-800">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-primary-100 dark:text-dark-200 hover:bg-primary-800 dark:hover:bg-dark-850 transition"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          <span className="font-medium">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
      </div>
    </div>
  );
}
