/**
 * Automation Rules
 * 
 * Pure functions for detecting stale leads and projects that need attention.
 * These functions can be used by:
 * - React hooks (for dashboard metrics)
 * - Node scripts (for scheduled automations)
 * - Supabase Edge Functions (for server-side automations)
 */

import { supabase } from './supabase';
import type { Lead, Project } from '../types/crm';

/**
 * Helper function to get a setting value from the database
 * Falls back to default if setting doesn't exist or can't be read
 */
async function getSetting(key: string, defaultValue: number): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', key)
      .single();

    if (error || !data) return defaultValue;
    const parsed = parseInt(data.value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  } catch (error) {
    console.warn(`Failed to read setting ${key}, using default:`, defaultValue);
    return defaultValue;
  }
}

export interface AutomationParams {
  staleLeadDays?: number; // Default: 7 days
  staleProjectDays?: number; // Default: 14 days
}

export interface StaleLead extends Lead {
  daysSinceLastActivity: number;
}

export interface StaleProject extends Project {
  daysSinceLastTask: number;
}

/**
 * Get leads in "contacted" stage without activity in the last X days
 * 
 * TODO: In the future, read staleLeadDays from a settings table instead of hardcoding
 * Example: SELECT value FROM settings WHERE key = 'automation.stale_lead_days'
 */
export async function getStaleContactedLeads(
  params: AutomationParams = {}
): Promise<StaleLead[]> {
  // Read from settings table, fallback to param or default
  const staleLeadDays =
    params.staleLeadDays ?? (await getSetting('automation.stale_lead_days', 7));

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - staleLeadDays);
  const cutoffISO = cutoffDate.toISOString();

  try {
    // Get all leads in "contacted" stage with owner
    const { data: contactedLeads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .eq('stage', 'contacted')
      .not('owner_id', 'is', null);

    if (leadsError) throw leadsError;
    if (!contactedLeads || contactedLeads.length === 0) return [];

    // Check each lead for recent activity
    const staleLeads: StaleLead[] = [];

    for (const lead of contactedLeads) {
      // Get the most recent activity for this lead
      const { data: recentActivity } = await supabase
        .from('entity_activities')
        .select('created_at')
        .eq('entity_type', 'lead')
        .eq('entity_id', lead.id)
        .gte('created_at', cutoffISO)
        .order('created_at', { ascending: false })
        .limit(1);

      // If no recent activity, this lead is stale
      if (!recentActivity || recentActivity.length === 0) {
        // Calculate days since last activity (or since lead creation if no activities)
        const { data: lastActivity } = await supabase
          .from('entity_activities')
          .select('created_at')
          .eq('entity_type', 'lead')
          .eq('entity_id', lead.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        const lastActivityDate = lastActivity?.created_at
          ? new Date(lastActivity.created_at)
          : new Date(lead.created_at);
        const daysSince = Math.floor(
          (new Date().getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        staleLeads.push({
          ...lead,
          daysSinceLastActivity: daysSince,
        });
      }
    }

    return staleLeads;
  } catch (error) {
    console.error('Error getting stale contacted leads:', error);
    throw error;
  }
}

/**
 * Get active projects without recent tasks in the last Y days
 * 
 * TODO: In the future, read staleProjectDays from a settings table instead of hardcoding
 * Example: SELECT value FROM settings WHERE key = 'automation.stale_project_days'
 */
export async function getStaleProjects(
  params: AutomationParams = {}
): Promise<StaleProject[]> {
  // Read from settings table, fallback to param or default
  const staleProjectDays =
    params.staleProjectDays ?? (await getSetting('automation.stale_project_days', 14));

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - staleProjectDays);
  const cutoffISO = cutoffDate.toISOString();

  try {
    // Get all active projects
    const { data: activeProjects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .eq('status', 'active');

    if (projectsError) throw projectsError;
    if (!activeProjects || activeProjects.length === 0) return [];

    const staleProjects: StaleProject[] = [];

    for (const project of activeProjects) {
      // Check for recent tasks (created or updated in the last Y days)
      const { data: recentTasks } = await supabase
        .from('tasks')
        .select('id, created_at, updated_at')
        .eq('project_id', project.id)
        .or(`created_at.gte.${cutoffISO},updated_at.gte.${cutoffISO}`)
        .limit(1);

      // If no recent tasks, check if there are any active (non-done) tasks
      if (!recentTasks || recentTasks.length === 0) {
        const { data: activeTasks } = await supabase
          .from('tasks')
          .select('id')
          .eq('project_id', project.id)
          .neq('status', 'done')
          .limit(1);

        // If no active tasks either, this project is stale
        if (!activeTasks || activeTasks.length === 0) {
          // Calculate days since last task (or since project creation if no tasks)
          const { data: lastTask } = await supabase
            .from('tasks')
            .select('updated_at, created_at')
            .eq('project_id', project.id)
            .order('updated_at', { ascending: false })
            .limit(1)
            .single();

          const lastTaskDate = lastTask
            ? new Date(lastTask.updated_at || lastTask.created_at)
            : new Date(project.created_at);
          const daysSince = Math.floor(
            (new Date().getTime() - lastTaskDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          staleProjects.push({
            ...project,
            daysSinceLastTask: daysSince,
          });
        }
      }
    }

    return staleProjects;
  } catch (error) {
    console.error('Error getting stale projects:', error);
    throw error;
  }
}

