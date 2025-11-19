import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { TrendingUp, Award, DollarSign, Target, BarChart3 } from 'lucide-react';

type SalesPerformance = {
  id: string;
  user_id: string;
  total_deals: number;
  total_revenue: number;
  won_deals: number;
  lost_deals: number;
  conversion_rate: number;
  rank: number;
  period_start: string;
  period_end: string;
};

type KPIMetric = {
  id: string;
  name: string;
  category: string;
  value: number;
  unit: string;
  target_value: number;
  metric_date: string;
};

export default function PerformanceView() {
  const [salesPerformance, setSalesPerformance] = useState<SalesPerformance[]>([]);
  const [kpiMetrics, setKpiMetrics] = useState<KPIMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [salesResult, kpiResult] = await Promise.all([
        supabase
          .from('sales_performance')
          .select('*')
          .order('rank', { ascending: true }),
        supabase
          .from('kpi_metrics')
          .select('*')
          .order('metric_date', { ascending: false })
          .limit(10),
      ]);

      if (salesResult.error) throw salesResult.error;
      if (kpiResult.error) throw kpiResult.error;

      setSalesPerformance(salesResult.data || []);
      setKpiMetrics(kpiResult.data || []);
    } catch (error) {
      console.error('Error loading performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">A carregar dados de performance...</div>;
  }

  const totalRevenue = salesPerformance.reduce((sum, perf) => sum + perf.total_revenue, 0);
  const totalDeals = salesPerformance.reduce((sum, perf) => sum + perf.total_deals, 0);
  const avgConversion =
    salesPerformance.length > 0
      ? salesPerformance.reduce((sum, perf) => sum + perf.conversion_rate, 0) / salesPerformance.length
      : 0;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Performance & Analytics</h2>
        <p className="text-gray-600 mt-1">Rankings, KPIs e métricas de desempenho</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Receita Total</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalRevenue.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
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
              <p className="text-2xl font-bold text-gray-900">{totalDeals}</p>
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
              <p className="text-2xl font-bold text-gray-900">{avgConversion.toFixed(1)}%</p>
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
              <p className="text-2xl font-bold text-gray-900">{salesPerformance.length}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Award className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-gray-900">Ranking de Vendedores</h3>
          </div>

          <div className="space-y-4">
            {salesPerformance.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Sem dados de performance</p>
            ) : (
              salesPerformance.map((perf, index) => (
                <div
                  key={perf.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                        index === 0
                          ? 'bg-yellow-500'
                          : index === 1
                          ? 'bg-gray-400'
                          : index === 2
                          ? 'bg-orange-600'
                          : 'bg-blue-600'
                      }`}
                    >
                      {perf.rank || index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Vendedor #{perf.user_id.substring(0, 8)}</p>
                      <p className="text-sm text-gray-600">
                        {perf.won_deals} ganhos / {perf.total_deals} total
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      {perf.total_revenue.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
                    </p>
                    <p className="text-sm text-gray-600">{perf.conversion_rate.toFixed(1)}% conversão</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-gray-900">KPIs Recentes</h3>
          </div>

          <div className="space-y-4">
            {kpiMetrics.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Sem métricas KPI</p>
            ) : (
              kpiMetrics.map((kpi) => {
                const percentage = kpi.target_value
                  ? (kpi.value / kpi.target_value) * 100
                  : 0;

                return (
                  <div key={kpi.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">{kpi.name}</p>
                        <p className="text-xs text-gray-600">{kpi.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">
                          {kpi.value} {kpi.unit}
                        </p>
                        {kpi.target_value > 0 && (
                          <p className="text-xs text-gray-600">Meta: {kpi.target_value}</p>
                        )}
                      </div>
                    </div>
                    {kpi.target_value > 0 && (
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div
                          className={`h-2 rounded-full ${
                            percentage >= 100
                              ? 'bg-green-500'
                              : percentage >= 75
                              ? 'bg-blue-500'
                              : 'bg-orange-500'
                          }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
