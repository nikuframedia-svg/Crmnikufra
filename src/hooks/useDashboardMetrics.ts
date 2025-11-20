import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { DashboardMetrics } from '../types/crm';
import { getStaleContactedLeads, getStaleProjects } from '../lib/automationRules';

export function useDashboardMetrics() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalContacts: 0,
    activeLeads: 0,
    activeProjects: 0,
    pendingTasks: 0,
    upcomingEvents: 0,
    documentsCount: 0,
    staleLeadsCount: 0,
    staleProjectsCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);

      // Fetch all metrics in parallel
      const [contactsRes, leadsRes, projectsRes, tasksRes, documentsRes] = await Promise.all([
        supabase.from('contacts').select('id', { count: 'exact', head: true }),
        supabase
          .from('leads')
          .select('id', { count: 'exact', head: true })
          .not('stage', 'in', '(won,lost)'),
        supabase
          .from('projects')
          .select('id', { count: 'exact', head: true })
          .neq('status', 'completed'),
        supabase
          .from('tasks')
          .select('id', { count: 'exact', head: true })
          .in('status', ['todo', 'in_progress', 'review']),
        supabase.from('documents').select('id', { count: 'exact', head: true }),
      ]);

      // Count upcoming events (tasks with due_date > today)
      const today = new Date().toISOString().split('T')[0];
      const eventsRes = await supabase
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .gte('due_date', today);

      // Get stale leads and projects counts
      const [staleLeads, staleProjects] = await Promise.all([
        getStaleContactedLeads({ staleLeadDays: 7 }),
        getStaleProjects({ staleProjectDays: 14 }),
      ]);

      setMetrics({
        totalContacts: contactsRes.count || 0,
        activeLeads: leadsRes.count || 0,
        activeProjects: projectsRes.count || 0,
        pendingTasks: tasksRes.count || 0,
        upcomingEvents: eventsRes.count || 0,
        documentsCount: documentsRes.count || 0,
        staleLeadsCount: staleLeads.length,
        staleProjectsCount: staleProjects.length,
      });

      setError(null);
    } catch (err: any) {
      console.error('Error fetching dashboard metrics:', err);
      setError(err.message || 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  return {
    metrics,
    loading,
    error,
    refetch: fetchMetrics,
  };
}
