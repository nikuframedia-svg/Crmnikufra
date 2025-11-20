import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Check, CheckCheck, ClipboardList, TrendingUp, MessageSquare } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useProfileAccess } from '../../contexts/ProfileAccessContext';
import { useNotifications } from '../../hooks/useNotifications';
import type { Notification } from '../../types/crm';

type HeaderProps = {
  title: string;
};

export default function Header({ title }: HeaderProps) {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { profile: accessProfile, logout } = useProfileAccess();
  const effectiveProfileId = profile?.id || accessProfile?.id || null;
  const displayName = profile?.full_name || accessProfile?.name || 'Colaborador';
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications(effectiveProfileId);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'task_assigned':
        return <ClipboardList className="w-4 h-4" />;
      case 'lead_assigned':
        return <TrendingUp className="w-4 h-4" />;
      case 'status_change':
        return <Check className="w-4 h-4" />;
      case 'comment':
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getEntityRoute = (entityType: Notification['entity_type'], entityId: string): string | null => {
    switch (entityType) {
      case 'lead':
        return `/crm/leads/${entityId}`;
      case 'contact':
        return `/crm/contacts/${entityId}`;
      case 'company':
        return `/crm/companies/${entityId}`;
      case 'project':
        return `/projects/${entityId}`;
      case 'task':
        return `/calendar`; // Tasks don't have detail pages yet
      case 'document':
        return `/documents`; // Documents don't have detail pages yet
      default:
        return null;
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    await markAsRead(notification.id);
    const route = getEntityRoute(notification.entity_type, notification.entity_id);
    if (route) {
      navigate(route);
    }
    setIsDropdownOpen(false);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'agora';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m atrás`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h atrás`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d atrás`;
    return date.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' });
  };

  const recentNotifications = notifications.slice(0, 10);

  return (
    <header className="bg-white dark:bg-dark-900 border-b border-gray-200 dark:border-dark-850 px-8 py-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 dark:text-dark-300 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Pesquisar..."
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-700 bg-white dark:bg-dark-850 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-dark-400 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent w-64"
            />
          </div>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="relative p-2 text-gray-600 dark:text-dark-200 hover:bg-gray-100 dark:hover:bg-dark-850 rounded-lg transition"
            >
              <Bell className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-dark-900 rounded-lg shadow-xl border border-gray-200 dark:border-dark-800 z-50 max-h-[600px] flex flex-col">
                <div className="p-4 border-b border-gray-200 dark:border-dark-800 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Notificações</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={async () => {
                        await markAllAsRead();
                      }}
                      className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center space-x-1"
                    >
                      <CheckCheck className="w-4 h-4" />
                      <span>Marcar todas como lidas</span>
                    </button>
                  )}
                </div>

                <div className="overflow-y-auto flex-1">
                  {loading ? (
                    <div className="p-8 text-center">
                      <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-sm text-gray-500 dark:text-dark-400">A carregar...</p>
                    </div>
                  ) : recentNotifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell className="w-12 h-12 text-gray-300 dark:text-dark-700 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 dark:text-dark-400">
                        Nenhuma notificação
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200 dark:divide-dark-800">
                      {recentNotifications.map((notification) => (
                        <button
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          className={`w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-dark-850 transition ${
                            notification.read_at === null
                              ? 'bg-blue-50 dark:bg-blue-900/10'
                              : 'bg-white dark:bg-dark-900'
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div
                              className={`mt-1 ${
                                notification.read_at === null
                                  ? 'text-blue-600 dark:text-blue-400'
                                  : 'text-gray-400 dark:text-dark-500'
                              }`}
                            >
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-sm ${
                                  notification.read_at === null
                                    ? 'font-semibold text-gray-900 dark:text-white'
                                    : 'text-gray-700 dark:text-dark-300'
                                }`}
                              >
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-dark-400 mt-1">
                                {formatTimeAgo(notification.created_at)}
                              </p>
                            </div>
                            {notification.read_at === null && (
                              <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {recentNotifications.length > 0 && notifications.length > 10 && (
                  <div className="p-3 border-t border-gray-200 dark:border-dark-800 text-center">
                    <p className="text-xs text-gray-500 dark:text-dark-400">
                      Mostrando 10 de {notifications.length} notificações
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug">{displayName}</p>
              {accessProfile?.canAccessBackend ? (
                <p className="text-xs text-green-600 dark:text-green-400">Acesso admin</p>
              ) : (
                <p className="text-xs text-gray-500 dark:text-dark-400">Acesso colaborador</p>
              )}
            </div>
            <button
              onClick={logout}
              className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-bold"
              title="Trocar de perfil"
            >
              {displayName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
