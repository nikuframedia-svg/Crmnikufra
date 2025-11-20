/**
 * Automation Engine
 * 
 * Executes automation rules stored in the database.
 * Supports configurable triggers, conditions, and actions.
 */

import { supabase } from './supabase';
import type { AutomationRule, AutomationCondition, AutomationAction } from '../types/crm';
import type { Lead, Project } from '../types/crm';

/**
 * Execute all daily cron automation rules
 */
export async function runDailyAutomations(): Promise<{
  rulesExecuted: number;
  tasksCreated: number;
  notificationsCreated: number;
  errors: number;
}> {
  try {
    // Get all active daily cron rules
    const { data: rules, error: rulesError } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('trigger_type', 'daily_cron')
      .eq('is_active', true);

    if (rulesError) throw rulesError;
    if (!rules || rules.length === 0) {
      return { rulesExecuted: 0, tasksCreated: 0, notificationsCreated: 0, errors: 0 };
    }

    let tasksCreated = 0;
    let notificationsCreated = 0;
    let errors = 0;

    // Execute each rule
    for (const rule of rules) {
      try {
        const result = await executeRule(rule);
        tasksCreated += result.tasksCreated || 0;
        notificationsCreated += result.notificationsCreated || 0;

        // Log success
        await logRuleExecution(rule.id, {
          success: true,
          tasksCreated: result.tasksCreated || 0,
          notificationsCreated: result.notificationsCreated || 0,
        });
      } catch (error: any) {
        errors++;
        console.error(`Error executing rule ${rule.id} (${rule.name}):`, error);

        // Log error
        await logRuleExecution(rule.id, {
          success: false,
          error: error.message || 'Unknown error',
        });
      }
    }

    return {
      rulesExecuted: rules.length,
      tasksCreated,
      notificationsCreated,
      errors,
    };
  } catch (error: any) {
    console.error('Error running daily automations:', error);
    throw error;
  }
}

/**
 * Execute a single automation rule
 */
export async function executeRule(rule: AutomationRule): Promise<{
  tasksCreated?: number;
  notificationsCreated?: number;
}> {
  const condition = rule.condition;
  const action = rule.action;

  // Handle lead-based automations
  if (condition.entity === 'lead' && action.type === 'create_task_and_notification') {
    return await executeLeadFollowUpRule(rule.id, condition, action);
  }

  // Handle project-based automations
  if (condition.entity === 'project' && action.type === 'create_notification_only') {
    return await executeProjectRiskRule(condition, action);
  }

  throw new Error(`Unsupported rule combination: entity=${condition.entity}, action=${action.type}`);
}

/**
 * Execute lead follow-up automation
 */
async function executeLeadFollowUpRule(
  ruleId: string,
  condition: AutomationCondition,
  action: AutomationAction
): Promise<{ tasksCreated: number; notificationsCreated: number }> {
  const daysWithoutActivity = condition.days_without_activity || 7;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysWithoutActivity);
  const cutoffISO = cutoffDate.toISOString();

  // Get stale contacted leads
  const { data: contactedLeads, error: leadsError } = await supabase
    .from('leads')
    .select('*')
    .eq('stage', 'contacted')
    .not('owner_id', 'is', null);

  if (leadsError) throw leadsError;
  if (!contactedLeads || contactedLeads.length === 0) {
    return { tasksCreated: 0, notificationsCreated: 0 };
  }

  const staleLeads: Lead[] = [];

  for (const lead of contactedLeads) {
    const { data: recentActivity } = await supabase
      .from('entity_activities')
      .select('created_at')
      .eq('entity_type', 'lead')
      .eq('entity_id', lead.id)
      .gte('created_at', cutoffISO)
      .limit(1);

    if (!recentActivity || recentActivity.length === 0) {
      staleLeads.push(lead);
    }
  }

  let tasksCreated = 0;
  let notificationsCreated = 0;

  // Process each stale lead
  for (const lead of staleLeads) {
    if (!lead.owner_id) continue;

    // Create task
    const taskTitle = replaceTemplate(action.task_title_template || 'Follow-up lead: {{lead.title}}', {
      lead: { title: lead.title, name: lead.title },
      days: daysWithoutActivity.toString(),
    });

    const taskDescription = replaceTemplate(
      action.task_description_template ||
        `Tarefa automática de follow-up para a lead "${lead.title}" que não tem atividade há mais de ${daysWithoutActivity} dias.`,
      {
        lead: { title: lead.title, name: lead.title },
        days: daysWithoutActivity.toString(),
      }
    );

    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert({
        title: taskTitle,
        description: taskDescription,
        status: 'todo',
        priority: 'medium',
        lead_id: lead.id,
        assigned_to: lead.owner_id,
        due_date: new Date().toISOString(),
        created_by: lead.owner_id,
      })
      .select()
      .single();

    if (taskError) {
      console.error(`Error creating task for lead ${lead.id}:`, taskError);
      continue;
    }

    tasksCreated++;

    // Create notification
    const notificationMessage = replaceTemplate(
      action.notification_message_template || `Nova tarefa de follow-up para a lead "${lead.title}"`,
      {
        lead: { title: lead.title, name: lead.title },
        days: daysWithoutActivity.toString(),
      }
    );

    const { error: notifError } = await supabase.from('notifications').insert({
      user_profile_id: lead.owner_id,
      type: 'task_assigned',
      message: notificationMessage,
      entity_type: 'lead',
      entity_id: lead.id,
    });

    if (!notifError) {
      notificationsCreated++;
    }

    // Create activity
    await supabase.from('entity_activities').insert({
      entity_type: 'lead',
      entity_id: lead.id,
      type: 'task_created',
      author_profile_id: lead.owner_id,
      metadata: {
        task_id: task.id,
        task_title: task.title,
        automated: true,
        rule_id: ruleId,
      },
    });
  }

  return { tasksCreated, notificationsCreated };
}

/**
 * Execute project risk automation
 */
async function executeProjectRiskRule(
  condition: AutomationCondition,
  action: AutomationAction
): Promise<{ notificationsCreated: number }> {
  const daysWithoutTask = condition.days_without_task || 14;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysWithoutTask);
  const cutoffISO = cutoffDate.toISOString();

  // Get active projects
  const { data: activeProjects, error: projectsError } = await supabase
    .from('projects')
    .select('*')
    .eq('status', 'active');

  if (projectsError) throw projectsError;
  if (!activeProjects || activeProjects.length === 0) {
    return { notificationsCreated: 0 };
  }

  const staleProjects: Project[] = [];

  for (const project of activeProjects) {
    // Check for recent tasks
    const { data: recentTasks } = await supabase
      .from('tasks')
      .select('id, created_at, updated_at')
      .eq('project_id', project.id)
      .or(`created_at.gte.${cutoffISO},updated_at.gte.${cutoffISO}`)
      .limit(1);

    if (!recentTasks || recentTasks.length === 0) {
      // Check if there are any active tasks
      const { data: activeTasks } = await supabase
        .from('tasks')
        .select('id')
        .eq('project_id', project.id)
        .neq('status', 'done')
        .limit(1);

      if (!activeTasks || activeTasks.length === 0) {
        staleProjects.push(project);
      }
    }
  }

  let notificationsCreated = 0;

  // Process each stale project
  for (const project of staleProjects) {
    if (!project.owner_id) continue;

    const notificationMessage = replaceTemplate(
      action.message_template || `Projeto em risco: ${project.name} - sem tarefas há mais de ${daysWithoutTask} dias`,
      {
        project: { name: project.name },
        days: daysWithoutTask.toString(),
      }
    );

    const { error: notifError } = await supabase.from('notifications').insert({
      user_profile_id: project.owner_id,
      type: 'status_change',
      message: notificationMessage,
      entity_type: 'project',
      entity_id: project.id,
    });

    if (!notifError) {
      notificationsCreated++;
    }
  }

  return { notificationsCreated };
}

/**
 * Replace template variables in strings
 * Example: "Hello {{user.name}}" with { user: { name: "John" } } -> "Hello John"
 */
function replaceTemplate(template: string, data: Record<string, any>): string {
  return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
    const keys = path.split('.');
    let value: any = data;
    for (const key of keys) {
      value = value?.[key];
      if (value === undefined) return match;
    }
    return String(value);
  });
}

/**
 * Log rule execution
 */
async function logRuleExecution(
  ruleId: string,
  result: { success: boolean; error?: string; tasksCreated?: number; notificationsCreated?: number }
): Promise<void> {
  try {
    await supabase.from('automation_rule_logs').insert({
      rule_id: ruleId,
      result: result.success ? 'success' : 'error',
      error: result.error || null,
      metadata: {
        tasksCreated: result.tasksCreated || 0,
        notificationsCreated: result.notificationsCreated || 0,
      },
    });
  } catch (error) {
    console.error('Error logging rule execution:', error);
    // Don't throw - logging errors shouldn't break the automation
  }
}

