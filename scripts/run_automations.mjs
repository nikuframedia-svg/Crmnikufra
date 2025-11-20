#!/usr/bin/env node

/**
 * Automation Script
 * 
 * This script runs automation rules to:
 * 1. Create follow-up tasks for stale contacted leads
 * 2. (Future) Create tasks/notifications for stale projects
 * 
 * NOTE: This script is now an alternative to the Edge Function.
 * For production, consider using the Supabase Edge Function instead.
 * See AUTOMATIONS.md for details.
 * 
 * Usage:
 *   node scripts/run_automations.mjs
 * 
 * For cron scheduling (daily at 9 AM):
 *   0 9 * * * cd /path/to/project && node scripts/run_automations.mjs
 * 
 * Or via npm:
 *   npm run automations
 */

import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Try to load .env file
config({ path: join(projectRoot, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - VITE_SUPABASE_URL or SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Use service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Import automation rules (we'll need to adapt them for Node.js)
// For now, we'll inline the logic since we can't easily import TypeScript from .mjs

async function getStaleContactedLeads(staleLeadDays = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - staleLeadDays);
  const cutoffISO = cutoffDate.toISOString();

  const { data: contactedLeads, error: leadsError } = await supabase
    .from('leads')
    .select('*')
    .eq('stage', 'contacted')
    .not('owner_id', 'is', null);

  if (leadsError) throw leadsError;
  if (!contactedLeads || contactedLeads.length === 0) return [];

  const staleLeads = [];

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

  return staleLeads;
}

async function createFollowUpTask(lead) {
  const today = new Date().toISOString().split('T')[0];

  // Create task
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .insert({
      title: `Follow-up lead: ${lead.title}`,
      description: `Tarefa automática de follow-up para a lead "${lead.title}" que não tem atividade há mais de 7 dias.`,
      status: 'todo',
      priority: 'medium',
      lead_id: lead.id,
      assigned_to: lead.owner_id,
      due_date: new Date().toISOString(),
      created_by: lead.owner_id, // Use owner as creator for now
    })
    .select()
    .single();

  if (taskError) {
    console.error(`❌ Error creating task for lead ${lead.id}:`, taskError);
    return null;
  }

  // Create notification
  const { error: notifError } = await supabase.from('notifications').insert({
    user_profile_id: lead.owner_id,
    type: 'task_assigned',
    message: `Nova tarefa de follow-up para a lead "${lead.title}"`,
    entity_type: 'lead',
    entity_id: lead.id,
  });

  if (notifError) {
    console.warn(`⚠️  Error creating notification for lead ${lead.id}:`, notifError);
    // Don't fail the whole process if notification fails
  }

  // Create activity
  try {
    await supabase.from('entity_activities').insert({
      entity_type: 'lead',
      entity_id: lead.id,
      type: 'task_created',
      author_profile_id: lead.owner_id,
      metadata: {
        task_id: task.id,
        task_title: task.title,
        automated: true,
      },
    });
  } catch (activityError) {
    console.warn(`⚠️  Error creating activity for lead ${lead.id}:`, activityError);
  }

  return task;
}

async function runDailyAutomations() {
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
      console.log(`\n📋 Executing rule: "${rule.name}"`);
      const result = await executeRule(rule);
      tasksCreated += result.tasksCreated || 0;
      notificationsCreated += result.notificationsCreated || 0;
      console.log(`  ✅ Rule executed successfully`);
    } catch (error) {
      errors++;
      console.error(`  ❌ Error executing rule:`, error.message);
    }
  }

  return {
    rulesExecuted: rules.length,
    tasksCreated,
    notificationsCreated,
    errors,
  };
}

async function executeRule(rule) {
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

async function executeLeadFollowUpRule(ruleId, condition, action) {
  const daysWithoutActivity = condition.days_without_activity || 7;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysWithoutActivity);
  const cutoffISO = cutoffDate.toISOString();

  const { data: contactedLeads, error: leadsError } = await supabase
    .from('leads')
    .select('*')
    .eq('stage', 'contacted')
    .not('owner_id', 'is', null);

  if (leadsError) throw leadsError;
  if (!contactedLeads || contactedLeads.length === 0) {
    return { tasksCreated: 0, notificationsCreated: 0 };
  }

  const staleLeads = [];
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

  for (const lead of staleLeads) {
    if (!lead.owner_id) continue;

    const taskTitle = replaceTemplate(action.task_title_template || 'Follow-up lead: {{lead.title}}', {
      lead: { title: lead.title, name: lead.title },
      days: daysWithoutActivity.toString(),
    });

    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert({
        title: taskTitle,
        description: action.task_description_template || `Tarefa automática de follow-up para a lead "${lead.title}"`,
        status: 'todo',
        priority: 'medium',
        lead_id: lead.id,
        assigned_to: lead.owner_id,
        due_date: new Date().toISOString(),
        created_by: lead.owner_id,
      })
      .select()
      .single();

    if (taskError) continue;
    tasksCreated++;

    const notificationMessage = replaceTemplate(
      action.notification_message_template || `Nova tarefa de follow-up para a lead "${lead.title}"`,
      { lead: { title: lead.title }, days: daysWithoutActivity.toString() }
    );

    await supabase.from('notifications').insert({
      user_profile_id: lead.owner_id,
      type: 'task_assigned',
      message: notificationMessage,
      entity_type: 'lead',
      entity_id: lead.id,
    });
    notificationsCreated++;
  }

  return { tasksCreated, notificationsCreated };
}

async function executeProjectRiskRule(condition, action) {
  const daysWithoutTask = condition.days_without_task || 14;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysWithoutTask);
  const cutoffISO = cutoffDate.toISOString();

  const { data: activeProjects, error: projectsError } = await supabase
    .from('projects')
    .select('*')
    .eq('status', 'active');

  if (projectsError) throw projectsError;
  if (!activeProjects || activeProjects.length === 0) {
    return { notificationsCreated: 0 };
  }

  const staleProjects = [];
  for (const project of activeProjects) {
    const { data: recentTasks } = await supabase
      .from('tasks')
      .select('id')
      .eq('project_id', project.id)
      .or(`created_at.gte.${cutoffISO},updated_at.gte.${cutoffISO}`)
      .limit(1);

    if (!recentTasks || recentTasks.length === 0) {
      staleProjects.push(project);
    }
  }

  let notificationsCreated = 0;
  for (const project of staleProjects) {
    if (!project.owner_id) continue;

    const notificationMessage = replaceTemplate(
      action.message_template || `Projeto em risco: ${project.name}`,
      { project: { name: project.name }, days: daysWithoutTask.toString() }
    );

    await supabase.from('notifications').insert({
      user_profile_id: project.owner_id,
      type: 'status_change',
      message: notificationMessage,
      entity_type: 'project',
      entity_id: project.id,
    });
    notificationsCreated++;
  }

  return { notificationsCreated };
}

function replaceTemplate(template, data) {
  return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
    const keys = path.split('.');
    let value = data;
    for (const key of keys) {
      value = value?.[key];
      if (value === undefined) return match;
    }
    return String(value);
  });
}

async function main() {
  console.log('🚀 Starting automation script (rule-based)...\n');

  try {
    const result = await runDailyAutomations();

    console.log('\n✨ Automation script completed!');
    console.log(`   Rules executed: ${result.rulesExecuted}`);
    console.log(`   Tasks created: ${result.tasksCreated}`);
    console.log(`   Notifications created: ${result.notificationsCreated}`);
    if (result.errors > 0) {
      console.log(`   Errors: ${result.errors}`);
    }
  } catch (error) {
    console.error('❌ Error running automation script:', error);
    process.exit(1);
  }
}

// Run the script
main();

