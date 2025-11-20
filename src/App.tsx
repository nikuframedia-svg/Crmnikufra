import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { ProfileAccessProvider, useProfileAccess } from './contexts/ProfileAccessContext';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import DashboardView from './views/Dashboard/DashboardView';
import CRMView from './views/CRM/CRMView';
import ProjectsView from './views/Projects/ProjectsView';
import DocumentsView from './views/Documents/DocumentsView';
import CalendarView from './views/Calendar/CalendarView';
import PerformanceView from './views/Performance/PerformanceView';
import LeadDetailView from './views/CRM/LeadDetailView';
import ContactDetailView from './views/CRM/ContactDetailView';
import CompanyDetailView from './views/CRM/CompanyDetailView';
import ProjectDetailView from './views/Projects/ProjectDetailView';
import TodayView from './views/Today/TodayView';
import SettingsView from './views/Settings/SettingsView';
import ChatView from './views/Chat/ChatView';
import ProfileGate from './components/ProfileAccess/ProfileGate';

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useProfileAccess();

  // Determine current view from pathname
  const getCurrentView = () => {
    if (location.pathname.startsWith('/today')) return 'today';
    if (location.pathname.startsWith('/crm')) return 'crm';
    if (location.pathname.startsWith('/projects')) return 'projects';
    if (location.pathname.startsWith('/documents')) return 'documents';
    if (location.pathname.startsWith('/calendar')) return 'calendar';
    if (location.pathname.startsWith('/chat')) return 'chat';
    if (location.pathname.startsWith('/performance')) return 'performance';
    if (location.pathname.startsWith('/settings')) return 'settings';
    return 'dashboard';
  };

  const getViewTitle = () => {
    if (location.pathname.startsWith('/crm/leads/')) return 'Detalhe do Lead';
    if (location.pathname.startsWith('/crm/contacts/')) return 'Detalhe do Contacto';
    if (location.pathname.startsWith('/crm/companies/')) return 'Detalhe da Empresa';
    if (location.pathname.startsWith('/projects/')) return 'Detalhe do Projeto';
    if (location.pathname.startsWith('/today')) return 'Minha Agenda';
    if (location.pathname.startsWith('/crm')) return 'CRM & Vendas';
    if (location.pathname.startsWith('/projects')) return 'Projetos';
    if (location.pathname.startsWith('/documents')) return 'Documentação';
    if (location.pathname.startsWith('/calendar')) return 'Calendário';
    if (location.pathname.startsWith('/chat')) return 'Chat Colaborativo';
    if (location.pathname.startsWith('/performance')) return 'Performance';
    if (location.pathname.startsWith('/settings')) return 'Configurações';
    return 'Dashboard';
  };

  const handleViewChange = (view: string) => {
    const routes: Record<string, string> = {
      dashboard: '/',
      today: '/today',
      crm: '/crm',
      projects: '/projects',
      documents: '/documents',
      calendar: '/calendar',
      chat: '/chat',
      performance: '/performance',
      settings: '/settings',
    };
    navigate(routes[view] || '/');
  };

  if (!profile) {
    return <ProfileGate />;
  }

  return (
    <AuthProvider>
      <ThemeProvider>
        <div className="flex h-screen bg-gray-50 dark:bg-dark-950">
          <Sidebar currentView={getCurrentView()} onViewChange={handleViewChange} />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header title={getViewTitle()} />
            <main className="flex-1 overflow-y-auto">
              <Routes>
                <Route path="/" element={<DashboardView />} />
                <Route path="/today" element={<TodayView />} />
                <Route path="/crm" element={<CRMView />} />
                <Route path="/crm/leads/:id" element={<LeadDetailView />} />
                <Route path="/crm/contacts/:id" element={<ContactDetailView />} />
                <Route path="/crm/companies/:id" element={<CompanyDetailView />} />
                <Route path="/projects" element={<ProjectsView />} />
                <Route path="/projects/:id" element={<ProjectDetailView />} />
                <Route path="/documents" element={<DocumentsView />} />
                <Route path="/calendar" element={<CalendarView />} />
                <Route path="/chat" element={<ChatView />} />
                <Route path="/performance" element={<PerformanceView />} />
                <Route path="/settings" element={<SettingsView />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </div>
      </ThemeProvider>
    </AuthProvider>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ProfileAccessProvider>
        <AppContent />
      </ProfileAccessProvider>
    </BrowserRouter>
  );
}

export default App;
