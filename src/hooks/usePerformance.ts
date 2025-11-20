import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface PerformanceSummary {
  totalRevenue: number;
  totalDeals: number;
  conversionRate: number;
  activeSellersCount: number;
  totalLeads: number;
  leadsWon: number;
  leadsLost: number;
  leadsInProgress: number;
  totalLeadValue: number;
  tasksCreated: number;
  tasksCompleted: number;
}

export interface CollaboratorMetrics {
  user_id: string;
  full_name: string;
  leadsCreated: number;
  leadsWon: number;
  leadsLost: number;
  totalLeadValue: number;
  revenue: number;
  tasksCreated: number;
  tasksCompleted: number;
  conversionRate: number;
}

export interface PerformanceFilters {
  startDate?: string;
  endDate?: string;
}

const DEFAULT_PERIOD_DAYS = 30;

export function usePerformance(filters?: PerformanceFilters) {
  const [summary, setSummary] = useState<PerformanceSummary>({
    totalRevenue: 0,
    totalDeals: 0,
    conversionRate: 0,
    activeSellersCount: 0,
    totalLeads: 0,
    leadsWon: 0,
    leadsLost: 0,
    leadsInProgress: 0,
    totalLeadValue: 0,
    tasksCreated: 0,
    tasksCompleted: 0,
  });
  const [collaboratorMetrics, setCollaboratorMetrics] = useState<CollaboratorMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const resolveDateRange = () => {
    const end = filters?.endDate ? new Date(filters.endDate) : new Date();
    const start = filters?.startDate ? new Date(filters.startDate) : new Date(end);
    if (!filters?.startDate) {
      start.setDate(end.getDate() - DEFAULT_PERIOD_DAYS + 1);
    }
    return { start: start.toISOString(), end: end.toISOString() };
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const { start, end } = resolveDateRange();

      const [{ data: leads, error: leadsError }, { data: deals, error: dealsError }] = await Promise.all([
        supabase
          .from('leads')
          .select('id, stage, owner_id, value, created_at')
          .gte('created_at', start)
          .lte('created_at', end),
        supabase
          .from('deals')
          .select('id, amount, status, created_by, created_at')
          .gte('created_at', start)
          .lte('created_at', end),
      ]);

      if (leadsError) throw leadsError;
      if (dealsError) throw dealsError;

      const leadsData = leads || [];
      const dealsData = deals || [];

      const { data: tasksCreatedData } = await supabase
        .from('tasks')
        .select('id, status, assigned_to, created_at')
        .gte('created_at', start)
        .lte('created_at', end);

      const { data: tasksCompletedData } = await supabase
        .from('tasks')
        .select('id, status, assigned_to, completed_at')
        .not('completed_at', 'is', null)
        .gte('completed_at', start)
        .lte('completed_at', end);

      const tasksCreated = tasksCreatedData || [];
      const tasksCompleted = tasksCompletedData || [];

      const totalLeadValue = leadsData.reduce((sum, lead) => sum + (lead.value || 0), 0);
      const leadsWon = leadsData.filter((lead) => lead.stage === 'won').length;
      const leadsLost = leadsData.filter((lead) => lead.stage === 'lost').length;
      const totalLeads = leadsData.length;
      const leadsInProgress = totalLeads - leadsWon - leadsLost;
      const conversionRate = totalLeads > 0 ? (leadsWon / totalLeads) * 100 : 0;

      const wonDeals = dealsData.filter((deal) => deal.status === 'won');
      const totalRevenue = wonDeals.reduce((sum, deal) => sum + (deal.amount || 0), 0);

      const collaboratorStats = new Map<
        string,
        {
          leadsCreated: number;
          leadsWon: number;
          leadsLost: number;
          totalLeadValue: number;
          revenue: number;
          tasksCreated: number;
          tasksCompleted: number;
        }
      >();

      const ensureStats = (userId?: string | null) => {
        if (!userId) return null;
        if (!collaboratorStats.has(userId)) {
          collaboratorStats.set(userId, {
            leadsCreated: 0,
            leadsWon: 0,
            leadsLost: 0,
            totalLeadValue: 0,
            revenue: 0,
            tasksCreated: 0,
            tasksCompleted: 0,
          });
        }
        return collaboratorStats.get(userId)!;
      };

      leadsData.forEach((lead) => {
        const stats = ensureStats(lead.owner_id);
        if (!stats) return;
        stats.leadsCreated += 1;
        if (lead.stage === 'won') stats.leadsWon += 1;
        if (lead.stage === 'lost') stats.leadsLost += 1;
        stats.totalLeadValue += lead.value || 0;
      });

      tasksCreated.forEach((task) => {
        const stats = ensureStats(task.assigned_to);
        if (!stats) return;
        stats.tasksCreated += 1;
      });

      tasksCompleted.forEach((task) => {
        const stats = ensureStats(task.assigned_to);
        if (!stats) return;
        stats.tasksCompleted += 1;
      });

      wonDeals.forEach((deal) => {
        const stats = ensureStats(deal.created_by);
        if (!stats) return;
        stats.revenue += deal.amount || 0;
      });

      const collaboratorIds = Array.from(collaboratorStats.keys());
      const { data: profiles } = collaboratorIds.length
        ? await supabase.from('profiles').select('id, full_name').in('id', collaboratorIds)
        : { data: [] };

      const collaboratorMetricsArray: CollaboratorMetrics[] = Array.from(collaboratorStats.entries()).map(
        ([user_id, stats]) => {
          const profile = profiles?.find((p) => p.id === user_id);
          const conversion =
            stats.leadsCreated > 0 ? (stats.leadsWon / stats.leadsCreated) * 100 : 0;
          return {
            user_id,
            full_name: profile?.full_name || 'Sem nome',
            conversionRate: conversion,
            ...stats,
          };
        }
      );

      collaboratorMetricsArray.sort((a, b) => b.revenue - a.revenue);

      const activeSellersCount = collaboratorMetricsArray.length;
      const tasksCreatedCount = tasksCreated.length;
      const tasksCompletedCount = tasksCompleted.length;

      setSummary({
        totalRevenue,
        totalDeals: totalLeads,
        conversionRate,
        activeSellersCount,
        totalLeads,
        leadsWon,
        leadsLost,
        leadsInProgress,
        totalLeadValue,
        tasksCreated: tasksCreatedCount,
        tasksCompleted: tasksCompletedCount,
      });
      setCollaboratorMetrics(collaboratorMetricsArray);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching performance data:', err);
      setError(err.message || 'Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters?.startDate, filters?.endDate]);

  return {
    summary,
    collaboratorMetrics,
    loading,
    error,
    refetch: fetchData,
  };
}
