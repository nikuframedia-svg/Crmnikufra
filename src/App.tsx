import { useState } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import DashboardView from './views/Dashboard/DashboardView';
import CRMView from './views/CRM/CRMView';
import ProjectsView from './views/Projects/ProjectsView';
import DocumentsView from './views/Documents/DocumentsView';
import CalendarView from './views/Calendar/CalendarView';
import PerformanceView from './views/Performance/PerformanceView';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');

  const getViewTitle = () => {
    switch (currentView) {
      case 'dashboard':
        return 'Dashboard';
      case 'crm':
        return 'CRM & Vendas';
      case 'projects':
        return 'Projetos';
      case 'documents':
        return 'Documentação';
      case 'calendar':
        return 'Calendário';
      case 'performance':
        return 'Performance';
      default:
        return 'Dashboard';
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView />;
      case 'crm':
        return <CRMView />;
      case 'projects':
        return <ProjectsView />;
      case 'documents':
        return <DocumentsView />;
      case 'calendar':
        return <CalendarView />;
      case 'performance':
        return <PerformanceView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <ThemeProvider>
      <div className="flex h-screen bg-gray-50 dark:bg-dark-950">
        <Sidebar currentView={currentView} onViewChange={setCurrentView} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title={getViewTitle()} />
          <main className="flex-1 overflow-y-auto">
            {renderView()}
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
