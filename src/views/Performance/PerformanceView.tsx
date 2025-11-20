import { useState, useMemo } from 'react';
import { usePerformance } from '../../hooks/usePerformance';
import {
  TrendingUp,
  Award,
  DollarSign,
  Target,
  BarChart3,
  Users,
  ClipboardCheck,
  Activity,
  Filter,
} from 'lucide-react';

const PERIOD_OPTIONS = [
  { label: 'Últimos 7 dias', value: 7 },
  { label: 'Últimos 30 dias', value: 30 },
  { label: 'Últimos 90 dias', value: 90 },
  { label: 'Personalizado', value: 'custom' },
];

export default function PerformanceView() {
  const [period, setPeriod] = useState<number | 'custom'>(30);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const { startISO, endISO, periodLabel } = useMemo(() => {
    if (period === 'custom' && customStart && customEnd) {
      return {
        startISO: new Date(customStart).toISOString(),
        endISO: new Date(customEnd).toISOString(),
        periodLabel: `${new Date(customStart).toLocaleDateString('pt-PT')} - ${new Date(customEnd).toLocaleDateString(
          'pt-PT'
        )}`,
      };
    }
    const end = new Date();
    const days = typeof period === 'number' ? period : 30;
    const start = new Date(end);
    start.setDate(end.getDate() - days + 1);
    return {
      startISO: start.toISOString(),
      endISO: end.toISOString(),
      periodLabel: `Últimos ${days} dias`,
    };
  }, [period, customStart, customEnd]);

  const { summary, collaboratorMetrics, loading } = usePerformance({ startDate: startISO, endDate: endISO });

  if (loading) {
    return <div className="text-center py-8">A carregar dados de performance...</div>;
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Performance & Analytics</h2>
          <p className="text-gray-600 mt-1">Rankings, KPIs e métricas de desempenho</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:space-x-4">
          <div>
            <label className="text-xs uppercase tracking-wide text-gray-500 flex items-center gap-1">
              <Filter className="w-3 h-3" />
              Período
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value === 'custom' ? 'custom' : Number(e.target.value))}
              className="mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {PERIOD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          {period === 'custom' && (
            <div className="flex space-x-3 mt-3 md:mt-0">
              <div>
                <label className="text-xs uppercase tracking-wide text-gray-500">Início</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-gray-500">Fim</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
          <div className="text-sm text-gray-600 mt-3 md:mt-0">
            <p className="font-medium text-gray-900">Período selecionado</p>
            <p>{periodLabel}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Receita Total</p>
              <p className="text-2xl font-bold text-gray-900">
                {summary.totalRevenue.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Negócios</p>
              <p className="text-2xl font-bold text-gray-900">{summary.totalDeals}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Taxa Conversão Média</p>
              <p className="text-2xl font-bold text-gray-900">{summary.conversionRate.toFixed(1)}%</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Vendedores Ativos</p>
              <p className="text-2xl font-bold text-gray-900">{summary.activeSellersCount}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-3">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-gray-900">Métricas de Leads</h3>
          </div>
          <div className="space-y-4">
            <MetricRow label="Total de Leads" value={summary.totalLeads} />
            <MetricRow label="Leads Ganhas" value={summary.leadsWon} />
            <MetricRow label="Leads Perdidas" value={summary.leadsLost} />
            <MetricRow label="Leads em Progresso" value={summary.leadsInProgress} />
            <MetricRow
              label="Valor Estimado"
              value={summary.totalLeadValue.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-3">
            <ClipboardCheck className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-bold text-gray-900">Métricas de Tarefas</h3>
          </div>
          <div className="space-y-4">
            <MetricRow label="Tarefas Criadas" value={summary.tasksCreated} />
            <MetricRow label="Tarefas Concluídas" value={summary.tasksCompleted} />
            <MetricRow label="Taxa de Conversão" value={`${summary.conversionRate.toFixed(1)}%`} />
            <MetricRow label="Vendedores Ativos" value={summary.activeSellersCount} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-3">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-bold text-gray-900">Receita & Negócios</h3>
          </div>
          <div className="space-y-4">
            <MetricRow
              label="Receita Total"
              value={summary.totalRevenue.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
            />
            <MetricRow label="Total de Negócios" value={summary.totalDeals} />
            <MetricRow label="Leads Ganhas" value={summary.leadsWon} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Award className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-bold text-gray-900">Métricas por Colaborador</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-4 py-2">Colaborador</th>
                <th className="px-4 py-2">Leads Criadas</th>
                <th className="px-4 py-2">Ganhos</th>
                <th className="px-4 py-2">Perdidos</th>
                <th className="px-4 py-2">Valor Leads</th>
                <th className="px-4 py-2">Receita</th>
                <th className="px-4 py-2">Tarefas Criadas</th>
                <th className="px-4 py-2">Tarefas Concluídas</th>
                <th className="px-4 py-2">Conversão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {collaboratorMetrics.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center text-gray-500 py-6">
                    Sem dados para o período selecionado.
                  </td>
                </tr>
              ) : (
                collaboratorMetrics.map((collab) => (
                  <tr key={collab.user_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{collab.full_name}</td>
                    <td className="px-4 py-3">{collab.leadsCreated}</td>
                    <td className="px-4 py-3">{collab.leadsWon}</td>
                    <td className="px-4 py-3">{collab.leadsLost}</td>
                    <td className="px-4 py-3">
                      {collab.totalLeadValue.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
                    </td>
                    <td className="px-4 py-3">
                      {collab.revenue.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
                    </td>
                    <td className="px-4 py-3">{collab.tasksCreated}</td>
                    <td className="px-4 py-3">{collab.tasksCompleted}</td>
                    <td className="px-4 py-3">{collab.conversionRate.toFixed(1)}%</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
      <p className="text-sm text-gray-600">{label}</p>
      <p className="text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}
