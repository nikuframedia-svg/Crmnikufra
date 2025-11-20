import { useState, useEffect } from 'react';
import { useSettings } from '../../hooks/useSettings';
import { useAuth } from '../../contexts/AuthContext';
import { useProfileAccess } from '../../contexts/ProfileAccessContext';
import { supabase } from '../../lib/supabase';
import { Settings, Save, AlertCircle, Zap, CheckCircle, XCircle } from 'lucide-react';

interface AutomationRule {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  trigger_type: string;
  condition: any;
  action: any;
  created_at: string;
}

export default function SettingsView() {
  const { profile } = useAuth();
  const { profile: accessProfile } = useProfileAccess();
  const { settings, loading, error, updateSetting, getSettingAsNumber } = useSettings();
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [loadingRules, setLoadingRules] = useState(true);

  // Check if user is admin or we're in dev/fallback (sem perfil carregado)
  const isAdmin = profile?.role === 'admin' || accessProfile?.canAccessBackend;
  const canAccessSettings = !!accessProfile?.canAccessBackend;

  useEffect(() => {
    if (canAccessSettings) {
      loadAutomationRules();
    }
  }, [canAccessSettings]);

  const loadAutomationRules = async () => {
    try {
      setLoadingRules(true);
      const { data, error: fetchError } = await supabase
        .from('automation_rules')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setAutomationRules(data || []);
    } catch (err: any) {
      console.error('Error loading automation rules:', err);
    } finally {
      setLoadingRules(false);
    }
  };

  const automationSettings = settings.filter((s) => s.category === 'automation');

  const handleSave = async (key: string, value: string) => {
    if (!canAccessSettings) {
      setSaveMessage({ type: 'error', text: 'Apenas administradores podem alterar configurações' });
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    try {
      await updateSetting(key, value);
      setSaveMessage({ type: 'success', text: 'Configuração guardada com sucesso!' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err: any) {
      setSaveMessage({ type: 'error', text: err.message || 'Erro ao guardar configuração' });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-dark-300">A carregar configurações...</p>
        </div>
      </div>
    );
  }

  if (!canAccessSettings) {
    return (
      <div className="p-8">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            <div>
              <h3 className="text-lg font-bold text-yellow-900 dark:text-yellow-200">Acesso restrito</h3>
              <p className="text-yellow-800 dark:text-yellow-300 mt-1">
                Apenas o perfil do Luís Nicolau pode abrir e alterar configurações de backend.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Configurações</h2>
        <p className="text-gray-600 dark:text-dark-300 mt-1">
          Gerir configurações do sistema e regras de automação
        </p>
      </div>

      {saveMessage && (
        <div
          className={`p-4 rounded-lg border ${
            saveMessage.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
          }`}
        >
          {saveMessage.text}
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <p className="text-red-800 dark:text-red-400">Erro: {error}</p>
        </div>
      )}

      {/* Automation Settings */}
      <div className="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-800 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Settings className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Regras de Automação</h3>
        </div>

        <div className="space-y-6">
          {/* Stale Lead Days */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-2">
              Dias sem atividade para leads "Contactado" serem consideradas em risco
            </label>
            <p className="text-xs text-gray-500 dark:text-dark-400 mb-3">
              Leads no estado "Contactado" sem atividade há mais de X dias serão automaticamente
              marcadas para follow-up.
            </p>
            <div className="flex items-center space-x-3">
              <input
                type="number"
                min="1"
                max="365"
                defaultValue={getSettingAsNumber('automation.stale_lead_days', 7)}
                className="px-4 py-2 border border-gray-300 dark:border-dark-700 bg-white dark:bg-dark-850 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent w-32"
                onBlur={(e) => {
                  const value = e.target.value;
                  if (value && parseInt(value, 10) > 0) {
                    handleSave('automation.stale_lead_days', value);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const value = (e.target as HTMLInputElement).value;
                    if (value && parseInt(value, 10) > 0) {
                      handleSave('automation.stale_lead_days', value);
                    }
                  }
                }}
              />
              <span className="text-sm text-gray-600 dark:text-dark-400">dias</span>
              {isSaving && (
                <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
              )}
            </div>
          </div>

          {/* Stale Project Days */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-2">
              Dias sem tarefas para projetos "Active" serem considerados em risco
            </label>
            <p className="text-xs text-gray-500 dark:text-dark-400 mb-3">
              Projetos no estado "Active" sem tarefas recentes há mais de X dias serão marcados
              como em risco no Dashboard.
            </p>
            <div className="flex items-center space-x-3">
              <input
                type="number"
                min="1"
                max="365"
                defaultValue={getSettingAsNumber('automation.stale_project_days', 14)}
                className="px-4 py-2 border border-gray-300 dark:border-dark-700 bg-white dark:bg-dark-850 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent w-32"
                onBlur={(e) => {
                  const value = e.target.value;
                  if (value && parseInt(value, 10) > 0) {
                    handleSave('automation.stale_project_days', value);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const value = (e.target as HTMLInputElement).value;
                    if (value && parseInt(value, 10) > 0) {
                      handleSave('automation.stale_project_days', value);
                    }
                  }
                }}
              />
              <span className="text-sm text-gray-600 dark:text-dark-400">dias</span>
              {isSaving && (
                <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Automation Rules List */}
      <div className="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-800 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Zap className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Regras de Automação Ativas</h3>
        </div>

        {loadingRules ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-gray-600 dark:text-dark-300">A carregar regras...</p>
          </div>
        ) : automationRules.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-dark-400">
            <Zap className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhuma regra de automação configurada</p>
          </div>
        ) : (
          <div className="space-y-4">
            {automationRules.map((rule) => (
              <div
                key={rule.id}
                className={`p-4 rounded-lg border ${
                  rule.is_active
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-gray-50 dark:bg-dark-850 border-gray-200 dark:border-dark-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {rule.is_active ? (
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-gray-400" />
                      )}
                      <h4 className="font-semibold text-gray-900 dark:text-white">{rule.name}</h4>
                      <span
                        className={`px-2 py-0.5 text-xs rounded ${
                          rule.is_active
                            ? 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200'
                            : 'bg-gray-200 dark:bg-dark-700 text-gray-600 dark:text-dark-400'
                        }`}
                      >
                        {rule.is_active ? 'Ativa' : 'Inativa'}
                      </span>
                    </div>
                    {rule.description && (
                      <p className="text-sm text-gray-600 dark:text-dark-300 mb-3">{rule.description}</p>
                    )}
                    <div className="text-xs text-gray-500 dark:text-dark-400 space-y-1">
                      <p>
                        <span className="font-medium">Trigger:</span> {rule.trigger_type}
                      </p>
                      <p>
                        <span className="font-medium">Condição:</span>{' '}
                        {JSON.stringify(rule.condition, null, 2).substring(0, 100)}...
                      </p>
                      <p>
                        <span className="font-medium">Ação:</span> {rule.action?.type || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <h4 className="text-sm font-bold text-blue-900 dark:text-blue-200 mb-2">
          Como funcionam as automações?
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-2 list-disc list-inside">
          <li>
            As automações são executadas diariamente através de uma Edge Function do Supabase ou
            via script Node.js.
          </li>
          <li>
            Quando uma lead ou projeto atinge os critérios definidos, são criadas automaticamente
            tarefas de follow-up e notificações.
          </li>
          <li>
            Os valores aqui definidos são usados tanto para o Dashboard (contadores de risco) como
            para as automações.
          </li>
        </ul>
      </div>
    </div>
  );
}

