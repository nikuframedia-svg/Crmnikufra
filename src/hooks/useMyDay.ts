import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Task, Lead, Project, Activity } from '../types/crm';
import { useAuth } from '../contexts/AuthContext';
import { getEffectiveProfileId } from '../lib/devFallback';

export interface MyDayData {
  tasksToday: Task[];
  tasksOverdue: Task[];
  leadsNeedingFollowUp: Lead[];
  eventsToday: Task[];
  riskProjects: Project[];
  recentActivitiesForMe: Activity[];
}

export function useMyDay() {
  const { user, profile } = useAuth();
  const [data, setData] = useState<MyDayData>({
    tasksToday: [],
    tasksOverdue: [],
    leadsNeedingFollowUp: [],
    eventsToday: [],
    riskProjects: [],
    recentActivitiesForMe: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);

  // ============================================
  // CONFIGURAÇÕES AJUSTÁVEIS
  // ============================================
  // Para ajustar as regras de negócio, modifica estas constantes:
  // 
  // FOLLOW_UP_DAYS: Número de dias sem atividade para considerar um lead como
  //                 "precisa de follow-up". Padrão: 7 dias.
  //                 Exemplo: Se mudares para 14, apenas leads sem atividade há
  //                 mais de 14 dias aparecerão na secção "Leads para Follow-up".
  //
  // RISK_DAYS: Número de dias sem tasks recentes para considerar um projeto
  //            como "em risco". Padrão: 14 dias.
  //            Exemplo: Se mudares para 7, projetos sem tasks nos últimos 7 dias
  //            aparecerão como "em risco".
  //
  // Para ajustar o período de "Atividade Recente", procura por "activitiesCutoff"
  // e modifica o número de dias (atualmente 7).
  // ============================================
  const FOLLOW_UP_DAYS = 7; // Leads sem atividade nos últimos 7 dias precisam follow-up
  const RISK_DAYS = 14; // Projetos sem tasks nos últimos 14 dias estão em risco

  useEffect(() => {
    async function resolveProfileId() {
      if (profile?.id) {
        setProfileId(profile.id);
      } else {
        const fallbackId = await getEffectiveProfileId();
        setProfileId(fallbackId);
      }
    }
    resolveProfileId();
  }, [profile?.id]);

  useEffect(() => {
    if (profileId) {
      fetchMyDayData(profileId);
    }
  }, [profileId]);

  const fetchMyDayData = async (currentProfileId: string) => {
    if (!currentProfileId) return;

    try {
      setLoading(true);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStart = today.toISOString();
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);
      const todayEndISO = todayEnd.toISOString();

      // Tarefas de hoje
      const { data: tasksTodayRaw } = await supabase
        .from('tasks')
        .select('*')
        .eq('assigned_to', currentProfileId)
        .gte('due_date', todayStart)
        .lte('due_date', todayEndISO)
        .neq('status', 'done')
        .order('due_date', { ascending: true });

      // Mapear tasks para o formato esperado (assigned_to -> assignee_profile_id, due_date -> date)
      const tasksTodayData = (tasksTodayRaw || []).map((task: any) => ({
        ...task,
        assignee_profile_id: task.assigned_to,
        date: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : undefined,
      }));

      // Tarefas atrasadas
      const { data: tasksOverdueRaw } = await supabase
        .from('tasks')
        .select('*')
        .eq('assigned_to', currentProfileId)
        .lt('due_date', todayStart)
        .neq('status', 'done')
        .order('due_date', { ascending: true });

      // Mapear tasks atrasadas
      const tasksOverdueData = (tasksOverdueRaw || []).map((task: any) => ({
        ...task,
        assignee_profile_id: task.assigned_to,
        date: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : undefined,
      }));

      // Leads do utilizador
      const { data: myLeads } = await supabase
        .from('leads')
        .select('*')
        .eq('owner_id', currentProfileId)
        .in('stage', ['contacted', 'qualified', 'proposal', 'negotiation'])
        .order('updated_at', { ascending: false });

      // Verificar atividades recentes para leads
      const leadsNeedingFollowUp: Lead[] = [];
      if (myLeads) {
        for (const lead of myLeads) {
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - FOLLOW_UP_DAYS);
          
          const { data: recentActivity } = await supabase
            .from('entity_activities')
            .select('created_at')
            .eq('entity_type', 'lead')
            .eq('entity_id', lead.id)
            .gte('created_at', cutoffDate.toISOString())
            .limit(1);

          if (!recentActivity || recentActivity.length === 0) {
            leadsNeedingFollowUp.push(lead);
          }
        }
      }

      // Eventos de hoje (tasks com hora definida)
      const { data: eventsTodayRaw } = await supabase
        .from('tasks')
        .select('*')
        .eq('assigned_to', currentProfileId)
        .gte('due_date', todayStart)
        .lte('due_date', todayEndISO)
        .not('due_date', 'is', null)
        .order('due_date', { ascending: true });

      // Mapear eventos
      const eventsTodayData = (eventsTodayRaw || []).map((task: any) => ({
        ...task,
        assignee_profile_id: task.assigned_to,
        date: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : undefined,
      }));

      // Projetos do utilizador
      const { data: myProjects } = await supabase
        .from('projects')
        .select('*')
        .eq('owner_id', currentProfileId)
        .eq('status', 'active')
        .order('updated_at', { ascending: false });

      // Verificar projetos em risco
      const riskProjects: Project[] = [];
      if (myProjects) {
        for (const project of myProjects) {
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - RISK_DAYS);

          const { data: recentTasks } = await supabase
            .from('tasks')
            .select('id, status')
            .eq('project_id', project.id)
            .gte('created_at', cutoffDate.toISOString())
            .limit(1);

          // Se não há tasks recentes OU todas as tasks recentes estão concluídas
          if (!recentTasks || recentTasks.length === 0) {
            // Verificar se há tasks não concluídas
            const { data: activeTasks } = await supabase
              .from('tasks')
              .select('id')
              .eq('project_id', project.id)
              .neq('status', 'done')
              .limit(1);

            if (!activeTasks || activeTasks.length === 0) {
              riskProjects.push(project);
            }
          }
        }
      }

      // Atividades recentes para mim (últimos 7 dias)
      const activitiesCutoff = new Date();
      activitiesCutoff.setDate(activitiesCutoff.getDate() - 7);

      // Construir query de atividades: autor OU entidades do utilizador
      const myEntityIds = [
        ...(myLeads?.map(l => l.id) || []),
        ...(myProjects?.map(p => p.id) || [])
      ];

      let activitiesQuery = supabase
        .from('entity_activities')
        .select('*')
        .gte('created_at', activitiesCutoff.toISOString());

      if (myEntityIds.length > 0) {
        // Se houver entidades, fazer OR com entity_id
        activitiesQuery = activitiesQuery.or(
          `author_profile_id.eq.${currentProfileId},entity_id.in.(${myEntityIds.join(',')})`
        );
      } else {
        // Se não houver entidades, apenas filtrar por autor
        activitiesQuery = activitiesQuery.eq('author_profile_id', currentProfileId);
      }

      const { data: myActivities } = await activitiesQuery
        .order('created_at', { ascending: false })
        .limit(20);

      setData({
        tasksToday: tasksTodayData || [],
        tasksOverdue: tasksOverdueData || [],
        leadsNeedingFollowUp,
        eventsToday: eventsTodayData || [],
        riskProjects,
        recentActivitiesForMe: myActivities || [],
      });

      setError(null);
    } catch (err: any) {
      console.error('Error fetching my day data:', err);
      setError(err.message || 'Failed to load my day data');
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    error,
    refetch: () => profileId && fetchMyDayData(profileId),
  };
}

