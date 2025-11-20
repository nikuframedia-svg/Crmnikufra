// supabase/functions/run-automations/index.ts

// ============================================================================

// EDGE FUNCTION: run-automations

// ---------------------------------------------------------------------------

// OBJETIVO:

//   Ler as regras ativas em `automation_rules` e aplicar as condições para:

//     - leads

//     - projects

//     - tasks

//   executando ações:

//     - create_task_and_notification

//     - create_notification_only

//     - escalate_task

//

// COMO USAR:

//   1) Colocar este ficheiro em supabase/functions/run-automations/index.ts

//   2) Configurar variáveis de ambiente no Supabase:

//        SUPABASE_URL

//        SUPABASE_SERVICE_ROLE_KEY

//        DEFAULT_OUTREACH_PROFILE_ID (opcional)

//   3) No Supabase, criar um cron com trigger diário (ex.: 1x/dia) a chamar

//      esta função.

// ============================================================================

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, SupabaseClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================================================

// CONFIG GERAL – AJUSTADO AO SCHEMA REAL

// ============================================================================

const CONFIG = {
  tables: {
    automationRules: "automation_rules",
    leads: "leads",
    projects: "projects",
    tasks: "tasks",
    notifications: "notifications",
    activities: "entity_activities",
    profiles: "profiles",
  },
  // ID de profile default para outreach, se não houver owner definido na lead
  DEFAULT_OUTREACH_PROFILE_ID: Deno.env.get("DEFAULT_OUTREACH_PROFILE_ID") ?? null,
  CEO_ROLES: ["CEO", "CSO", "CEO/CSO"], // usados na regra de escalation
};

// ============================================================================

// TIPOS (AJUSTADOS AO SCHEMA REAL)

// ============================================================================

type TriggerType = "daily_cron";

type EntityType = "lead" | "project" | "task";

type ActionType = "create_task_and_notification" | "create_notification_only" | "escalate_task";

interface AutomationRule {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  trigger_type: TriggerType;
  condition: any; // JSONB
  action: any; // JSONB
  created_at: string;
}

interface Lead {
  id: string;
  title: string; // schema usa 'title', não 'name'
  stage?: string | null; // schema usa 'stage', não 'status'
  value?: number | null; // schema usa 'value', não 'value_eur'
  currency?: string | null;
  owner_id?: string | null; // schema usa 'owner_id', não 'owner_profile_id'
  created_at: string;
}

interface Project {
  id: string;
  name: string;
  status?: string | null;
  value?: number | null;
  budget?: number | null;
  owner_id?: string | null; // schema usa 'owner_id'
  created_at: string;
}

interface Task {
  id: string;
  title: string;
  description?: string | null;
  status?: string | null;
  due_date?: string | null; // schema usa 'due_date', não 'date'
  assigned_to?: string | null; // schema usa 'assigned_to', não 'assignee_profile_id'
  lead_id?: string | null;
  project_id?: string | null;
  created_at: string;
}

interface Notification {
  id: string;
  user_profile_id: string;
  type: string;
  message: string;
  entity_type: EntityType | "document";
  entity_id: string;
  read_at: string | null;
  created_at: string;
}

// ============================================================================

// HELPERS

// ============================================================================

function getSupabaseClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !serviceKey) {
    throw new Error("SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não definidos");
  }

  return createClient(url, serviceKey);
}

function daysBetween(a: Date, b: Date): number {
  const diffMs = b.getTime() - a.getTime();
  return diffMs / (1000 * 60 * 60 * 24);
}

function isOlderThan(dateStr: string, days: number, now: Date): boolean {
  const d = new Date(dateStr);
  return daysBetween(d, now) > days;
}

// Última activity para uma entidade
async function getLastActivityDate(
  supabase: SupabaseClient,
  entity_type: EntityType,
  entity_id: string
): Promise<Date | null> {
  const { data, error } = await supabase
    .from(CONFIG.tables.activities)
    .select("created_at")
    .eq("entity_type", entity_type)
    .eq("entity_id", entity_id)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    console.error("Erro a obter última activity:", error);
    return null;
  }
  if (!data || data.length === 0) return null;
  return new Date(data[0].created_at);
}

function matchesSegment(segment: string | null | undefined, segmentList: string[]): boolean {
  if (!segment) return false;
  const s = segment.toLowerCase();
  return segmentList.some((seg) => s.includes(seg.toLowerCase()));
}

function isWeekday(today: Date, weekday: string): boolean {
  // weekday em inglês: monday, tuesday, ...
  const map = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const todayName = map[today.getUTCDay()];
  return todayName === weekday.toLowerCase();
}

// ============================================================================

// CARREGAR REGRAS ATIVAS

// ============================================================================

async function getActiveRules(supabase: SupabaseClient): Promise<AutomationRule[]> {
  const { data, error } = await supabase
    .from(CONFIG.tables.automationRules)
    .select("*")
    .eq("is_active", true);

  if (error) {
    console.error("Erro a carregar automation_rules:", error);
    return [];
  }

  return (data || []) as AutomationRule[];
}

// ============================================================================

// EXECUÇÃO POR REGRA

// ============================================================================

async function runRule(supabase: SupabaseClient, rule: AutomationRule, now: Date) {
  const condition = rule.condition || {};
  const action = rule.action || {};
  const entity = condition.entity as EntityType;

  // Filtro por dia da semana (regra 7 – revisão semanal)
  if (condition.run_only_on_weekday) {
    if (!isWeekday(now, condition.run_only_on_weekday)) {
      console.log(
        `[RULE ${rule.name}] Ignorada hoje porque só corre em ${condition.run_only_on_weekday}`
      );
      return;
    }
  }

  switch (entity) {
    case "lead":
      await runLeadRule(supabase, rule, condition, action, now);
      break;
    case "project":
      await runProjectRule(supabase, rule, condition, action, now);
      break;
    case "task":
      await runTaskRule(supabase, rule, condition, action, now);
      break;
    default:
      console.warn(`[RULE ${rule.name}] entity desconhecida:`, entity);
  }
}

// ---------------------------------------------------------------------------

// LEADS

// ---------------------------------------------------------------------------

async function runLeadRule(
  supabase: SupabaseClient,
  rule: AutomationRule,
  condition: any,
  action: any,
  now: Date
) {
  const leadsTable = CONFIG.tables.leads;

  let query = supabase.from(leadsTable).select("*");

  // stage (schema usa 'stage', não 'status')
  if (condition.stage) {
    query = query.eq("stage", condition.stage);
  }
  if (condition.stage_in && Array.isArray(condition.stage_in)) {
    query = query.in("stage", condition.stage_in);
  }
  if (condition.stage_not_in && Array.isArray(condition.stage_not_in)) {
    query = query.not("stage", "in", `(${condition.stage_not_in.join(",")})`);
  }

  // Compatibilidade: se condition usar 'status', mapear para 'stage'
  if (condition.status) {
    query = query.eq("stage", condition.status);
  }
  if (condition.status_in && Array.isArray(condition.status_in)) {
    query = query.in("stage", condition.status_in);
  }
  if (condition.status_not_in && Array.isArray(condition.status_not_in)) {
    query = query.not("stage", "in", `(${condition.status_not_in.join(",")})`);
  }

  // valor mínimo (schema usa 'value', não 'value_eur')
  if (condition.min_value_eur || condition.min_value) {
    const minValue = condition.min_value_eur || condition.min_value;
    query = query.gte("value", minValue);
  }

  // datas – para reduzir universo se fizer sentido
  if (condition.days_since_created) {
    // leva todos; filtramos depois em JS pelo days_since_created
  }

  const { data: leads, error } = await query;

  if (error) {
    console.error(`[RULE ${rule.name}] Erro a buscar leads:`, error);
    return;
  }

  if (!leads || leads.length === 0) {
    console.log(`[RULE ${rule.name}] 0 leads encontradas`);
    return;
  }

  const segmentList: string[] = condition.segment_in || [];
  const daysWithoutActivity = condition.days_without_activity as number | undefined;
  const daysSinceCreated = condition.days_since_created as number | undefined;
  const noActivity = condition.no_activity === true;

  for (const row of leads as any as Lead[]) {
    const lead = row;

    // filtro por segmento (imobiliária, metalúrgica, têxtil, industrial, etc.)
    // Nota: schema não tem campo 'segment' ou 'industry' direto em leads
    // Se precisares, podes buscar via company_id -> companies.segment
    if (segmentList.length > 0) {
      // Por agora, skip se houver filtro de segmento (não implementado no schema)
      continue;
    }

    // filtro: days_since_created
    if (typeof daysSinceCreated === "number") {
      if (!isOlderThan(lead.created_at, daysSinceCreated, now)) continue;
    }

    // filtro: activity
    if (typeof daysWithoutActivity === "number" || noActivity) {
      const lastActivity = await getLastActivityDate(supabase, "lead", lead.id);
      if (noActivity && lastActivity) continue; // pedimos "no_activity" e esta lead tem activity
      if (typeof daysWithoutActivity === "number" && lastActivity) {
        if (!isOlderThan(lastActivity.toISOString(), daysWithoutActivity, now)) continue;
      }
      if (typeof daysWithoutActivity === "number" && !lastActivity) {
        // sem activity nenhuma → considera como > daysWithoutActivity
      }
    }

    await executeLeadAction(supabase, rule, lead, action, now);
  }
}

async function executeLeadAction(
  supabase: SupabaseClient,
  rule: AutomationRule,
  lead: Lead,
  action: any,
  now: Date
) {
  const type = action.type as ActionType;

  switch (type) {
    case "create_task_and_notification":
      await createTaskAndNotificationForLead(supabase, rule, lead, action, now);
      break;
    case "create_notification_only":
      await createNotificationForLead(supabase, rule, lead, action, now);
      break;
    case "escalate_task":
      console.warn(
        `[RULE ${rule.name}] type 'escalate_task' não faz sentido diretamente em lead (ignorado)`
      );
      break;
    default:
      console.warn(`[RULE ${rule.name}] action type desconhecido:`, type);
  }
}

async function createTaskAndNotificationForLead(
  supabase: SupabaseClient,
  rule: AutomationRule,
  lead: Lead,
  action: any,
  now: Date
) {
  const tasksTable = CONFIG.tables.tasks;
  const notificationsTable = CONFIG.tables.notifications;

  const taskTitleTemplate =
    action.task_title_template || "Tarefa automática para lead: {{lead.name}}";
  const taskDescriptionTemplate =
    action.task_description_template || "Tarefa criada automaticamente pela regra {{rule.name}}.";
  const notificationTemplate =
    action.notification_message_template ||
    "Nova tarefa automática para lead {{lead.name}} criada pela regra {{rule.name}}.";

  const assignStrategy = action.assign_to || "lead_owner";

  let assigneeId: string | null = null;
  if (assignStrategy === "lead_owner") {
    assigneeId = lead.owner_id ?? null; // schema usa 'owner_id'
  } else if (assignStrategy === "lead_owner_or_outreach_default") {
    assigneeId = lead.owner_id ?? CONFIG.DEFAULT_OUTREACH_PROFILE_ID;
  } else {
    // fallback: tenta usar campo directo
    assigneeId = action.assignee_profile_id ?? lead.owner_id ?? null;
  }

  if (!assigneeId) {
    console.warn(`[RULE ${rule.name}] Não foi possível determinar assignee para lead ${lead.id}`);
    return;
  }

  // Usar 'title' em vez de 'name' (schema real)
  const title = taskTitleTemplate
    .replace("{{lead.name}}", lead.title)
    .replace("{{lead.title}}", lead.title)
    .replace("{{rule.name}}", rule.name);

  const description = taskDescriptionTemplate
    .replace("{{lead.name}}", lead.title)
    .replace("{{lead.title}}", lead.title)
    .replace("{{rule.name}}", rule.name);

  // Criar tarefa (schema usa 'assigned_to' e 'due_date')
  const { data: taskData, error: taskError } = await supabase
    .from(tasksTable)
    .insert({
      title,
      description,
      status: "todo", // schema usa 'todo', não 'por fazer'
      due_date: now.toISOString(), // schema usa timestamptz
      assigned_to: assigneeId, // schema usa 'assigned_to'
      lead_id: lead.id,
      created_by: assigneeId, // necessário no schema
    })
    .select()
    .single();

  if (taskError) {
    console.error(`[RULE ${rule.name}] Erro a criar task para lead ${lead.id}:`, taskError);
    return;
  }

  // Criar notificação
  const message = notificationTemplate
    .replace("{{lead.name}}", lead.title)
    .replace("{{lead.title}}", lead.title)
    .replace("{{rule.name}}", rule.name);

  const { error: notifError } = await supabase.from(notificationsTable).insert({
    user_profile_id: assigneeId,
    type: "task_assigned",
    message,
    entity_type: "lead",
    entity_id: lead.id,
  });

  if (notifError) {
    console.error(`[RULE ${rule.name}] Erro a criar notificação para lead ${lead.id}:`, notifError);
  } else {
    console.log(
      `[RULE ${rule.name}] Task + notificação criadas para lead ${lead.id} (${lead.title})`
    );
  }

  // Criar activity
  await supabase.from(CONFIG.tables.activities).insert({
    entity_type: "lead",
    entity_id: lead.id,
    type: "task_created",
    author_profile_id: assigneeId,
    metadata: {
      task_id: taskData.id,
      task_title: taskData.title,
      automated: true,
      rule_id: rule.id,
    },
  });
}

async function createNotificationForLead(
  supabase: SupabaseClient,
  rule: AutomationRule,
  lead: Lead,
  action: any,
  now: Date
) {
  const notificationsTable = CONFIG.tables.notifications;
  const template =
    action.notification_message_template || "Aviso automático para lead {{lead.name}}.";

  const notifyStrategy = action.notify || "lead_owner";
  let userId: string | null = null;

  if (notifyStrategy === "lead_owner") {
    userId = lead.owner_id ?? null; // schema usa 'owner_id'
  }

  if (!userId) {
    console.warn(`[RULE ${rule.name}] Sem user para notificar na lead ${lead.id}`);
    return;
  }

  const message = template
    .replace("{{lead.name}}", lead.title)
    .replace("{{lead.title}}", lead.title)
    .replace("{{rule.name}}", rule.name);

  const { error } = await supabase.from(notificationsTable).insert({
    user_profile_id: userId,
    type: "info",
    message,
    entity_type: "lead",
    entity_id: lead.id,
  });

  if (error) {
    console.error(`[RULE ${rule.name}] Erro a criar notificação (lead ${lead.id}):`, error);
  } else {
    console.log(`[RULE ${rule.name}] Notificação criada para lead ${lead.id} (${lead.title})`);
  }
}

// ---------------------------------------------------------------------------

// PROJECTS

// ---------------------------------------------------------------------------

async function runProjectRule(
  supabase: SupabaseClient,
  rule: AutomationRule,
  condition: any,
  action: any,
  now: Date
) {
  const projectsTable = CONFIG.tables.projects;
  let query = supabase.from(projectsTable).select("*");

  if (condition.status) {
    query = query.eq("status", condition.status);
  }
  if (condition.status_in && Array.isArray(condition.status_in)) {
    query = query.in("status", condition.status_in);
  }

  const { data: projects, error } = await query;

  if (error) {
    console.error(`[RULE ${rule.name}] Erro a buscar projects:`, error);
    return;
  }

  if (!projects || projects.length === 0) {
    console.log(`[RULE ${rule.name}] 0 projects encontrados`);
    return;
  }

  const daysWithoutTask = condition.days_without_task as number | undefined;
  const daysWithoutActivity = condition.days_without_activity as number | undefined;

  for (const row of projects as any as Project[]) {
    const project = row;

    // days_without_task
    if (typeof daysWithoutTask === "number") {
      // pegar última task do projeto
      const { data: lastTasks, error: taskErr } = await supabase
        .from(CONFIG.tables.tasks)
        .select("created_at")
        .eq("project_id", project.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (taskErr) {
        console.error(`[RULE ${rule.name}] Erro a buscar tasks do projeto ${project.id}:`, taskErr);
        continue;
      }

      if (lastTasks && lastTasks.length > 0) {
        const lastTaskDate = new Date(lastTasks[0].created_at);
        if (!isOlderThan(lastTaskDate.toISOString(), daysWithoutTask, now)) continue;
      } else {
        // sem tasks → considera como em risco
      }
    }

    // days_without_activity (se algum dia quiseres usar)
    if (typeof daysWithoutActivity === "number") {
      const lastActivity = await getLastActivityDate(supabase, "project", project.id);
      if (lastActivity && !isOlderThan(lastActivity.toISOString(), daysWithoutActivity, now)) {
        continue;
      }
    }

    await executeProjectAction(supabase, rule, project, action, now);
  }
}

async function executeProjectAction(
  supabase: SupabaseClient,
  rule: AutomationRule,
  project: Project,
  action: any,
  now: Date
) {
  const type = action.type as ActionType;

  switch (type) {
    case "create_notification_only":
      await createNotificationForProject(supabase, rule, project, action);
      break;
    case "create_task_and_notification":
      await createTaskAndNotificationForProject(supabase, rule, project, action, now);
      break;
    case "escalate_task":
      console.warn(
        `[RULE ${rule.name}] type 'escalate_task' para project não implementado (normalmente é para tasks)`
      );
      break;
    default:
      console.warn(`[RULE ${rule.name}] action type desconhecido:`, type);
  }
}

async function createNotificationForProject(
  supabase: SupabaseClient,
  rule: AutomationRule,
  project: Project,
  action: any
) {
  const notificationsTable = CONFIG.tables.notifications;
  const template =
    action.notification_message_template || "Aviso automático para projeto {{project.name}}.";

  const notifyStrategy = action.notify || "project_owner";
  let userId: string | null = null;

  if (notifyStrategy === "project_owner") {
    userId = project.owner_id ?? null; // schema usa 'owner_id'
  }

  if (!userId) {
    console.warn(`[RULE ${rule.name}] Sem user para notificar no projeto ${project.id}`);
    return;
  }

  const message = template
    .replace("{{project.name}}", project.name)
    .replace("{{rule.name}}", rule.name);

  const { error } = await supabase.from(notificationsTable).insert({
    user_profile_id: userId,
    type: "risk",
    message,
    entity_type: "project",
    entity_id: project.id,
  });

  if (error) {
    console.error(`[RULE ${rule.name}] Erro a criar notificação (project ${project.id}):`, error);
  } else {
    console.log(`[RULE ${rule.name}] Notificação criada para projeto ${project.id} (${project.name})`);
  }
}

async function createTaskAndNotificationForProject(
  supabase: SupabaseClient,
  rule: AutomationRule,
  project: Project,
  action: any,
  now: Date
) {
  const tasksTable = CONFIG.tables.tasks;
  const notificationsTable = CONFIG.tables.notifications;

  const titleTemplate =
    action.task_title_template || "Tarefa automática para projeto: {{project.name}}";
  const descTemplate =
    action.task_description_template || "Tarefa criada automaticamente pela regra {{rule.name}}.";
  const notifTemplate =
    action.notification_message_template ||
    "Nova tarefa automática para projeto {{project.name}}.";

  const ownerId = project.owner_id ?? null; // schema usa 'owner_id'
  if (!ownerId) {
    console.warn(`[RULE ${rule.name}] Projeto ${project.id} sem owner_id`);
    return;
  }

  const title = titleTemplate
    .replace("{{project.name}}", project.name)
    .replace("{{rule.name}}", rule.name);

  const description = descTemplate
    .replace("{{project.name}}", project.name)
    .replace("{{rule.name}}", rule.name);

  const { data: taskData, error: taskErr } = await supabase
    .from(tasksTable)
    .insert({
      title,
      description,
      status: "todo", // schema usa 'todo'
      due_date: now.toISOString(), // schema usa timestamptz
      assigned_to: ownerId, // schema usa 'assigned_to'
      project_id: project.id,
      created_by: ownerId, // necessário no schema
    })
    .select()
    .single();

  if (taskErr) {
    console.error(`[RULE ${rule.name}] Erro ao criar task em projeto ${project.id}:`, taskErr);
    return;
  }

  const message = notifTemplate
    .replace("{{project.name}}", project.name)
    .replace("{{rule.name}}", rule.name);

  const { error: notifErr } = await supabase.from(notificationsTable).insert({
    user_profile_id: ownerId,
    type: "task_assigned",
    message,
    entity_type: "project",
    entity_id: project.id,
  });

  if (notifErr) {
    console.error(`[RULE ${rule.name}] Erro a criar notificação (project ${project.id}):`, notifErr);
  } else {
    console.log(`[RULE ${rule.name}] Task + notificação criadas para projeto ${project.id}`);
  }

  // Criar activity
  await supabase.from(CONFIG.tables.activities).insert({
    entity_type: "project",
    entity_id: project.id,
    type: "task_created",
    author_profile_id: ownerId,
    metadata: {
      task_id: taskData.id,
      task_title: taskData.title,
      automated: true,
      rule_id: rule.id,
    },
  });
}

// ---------------------------------------------------------------------------

// TASKS (para regra de escalation de tarefas atrasadas)

// ---------------------------------------------------------------------------

async function runTaskRule(
  supabase: SupabaseClient,
  rule: AutomationRule,
  condition: any,
  action: any,
  now: Date
) {
  const tasksTable = CONFIG.tables.tasks;
  let query = supabase.from(tasksTable).select("*");

  if (condition.status_not_in && Array.isArray(condition.status_not_in)) {
    query = query.not("status", "in", `(${condition.status_not_in.join(",")})`);
  }

  const { data: tasks, error } = await query;

  if (error) {
    console.error(`[RULE ${rule.name}] Erro a buscar tasks:`, error);
    return;
  }

  if (!tasks || tasks.length === 0) {
    console.log(`[RULE ${rule.name}] 0 tasks encontradas`);
    return;
  }

  const daysOverdue = condition.days_overdue as number | undefined;

  for (const row of tasks as any as Task[]) {
    const task = row;
    const dateStr = task.due_date; // schema usa 'due_date'
    if (!dateStr || !daysOverdue) continue;

    const due = new Date(dateStr);
    const diffDays = daysBetween(due, now);
    if (diffDays < daysOverdue) continue;

    await executeTaskAction(supabase, rule, task, action);
  }
}

async function executeTaskAction(
  supabase: SupabaseClient,
  rule: AutomationRule,
  task: Task,
  action: any
) {
  const type = action.type as ActionType;
  switch (type) {
    case "escalate_task":
      await escalateTask(supabase, rule, task, action);
      break;
    case "create_task_and_notification":
    case "create_notification_only":
      console.warn(
        `[RULE ${rule.name}] action ${type} em entity=task não está implementado (normalmente é para leads/projetos)`
      );
      break;
    default:
      console.warn(`[RULE ${rule.name}] action type desconhecido:`, type);
  }
}

async function escalateTask(
  supabase: SupabaseClient,
  rule: AutomationRule,
  task: Task,
  action: any
) {
  const notificationsTable = CONFIG.tables.notifications;
  const profilesTable = CONFIG.tables.profiles;

  const messageTemplate =
    action.notification_message_template ||
    "Tarefa atrasada: {{task.title}} (responsável: {{assignee.name}})";

  // Ir buscar responsável original (schema usa 'assigned_to')
  let assigneeName = "desconhecido";
  if (task.assigned_to) {
    const { data: assignee, error: assErr } = await supabase
      .from(profilesTable)
      .select("full_name") // schema usa 'full_name', não 'name'
      .eq("id", task.assigned_to)
      .single();
    if (!assErr && assignee) assigneeName = (assignee as any).full_name || assigneeName;
  }

  // Encontrar quem é CEO/CSO (schema usa 'role' em profiles)
  const { data: ceos, error: ceoErr } = await supabase
    .from(profilesTable)
    .select("id, role, full_name") // schema usa 'full_name'
    .in("role", CONFIG.CEO_ROLES);

  if (ceoErr || !ceos || ceos.length === 0) {
    console.error(
      `[RULE ${rule.name}] Não encontrei perfis com roles ${CONFIG.CEO_ROLES.join(",")}`
    );
    return;
  }

  const msg = messageTemplate
    .replace("{{task.title}}", task.title)
    .replace("{{assignee.name}}", assigneeName)
    .replace("{{rule.name}}", rule.name);

  const rows = ceos.map((ceo) => ({
    user_profile_id: (ceo as any).id,
    type: "escalation",
    message: msg,
    entity_type: "task" as const,
    entity_id: task.id,
  }));

  const { error: notifErr } = await supabase.from(notificationsTable).insert(rows);

  if (notifErr) {
    console.error(`[RULE ${rule.name}] Erro a criar notificações de escalation:`, notifErr);
  } else {
    console.log(
      `[RULE ${rule.name}] Escalation criada para tarefa ${task.id} (${task.title}) para ${rows.length} perfis`
    );
  }
}

// ============================================================================

// FUNÇÃO PRINCIPAL: correr todas as regras ativas

// ============================================================================

async function runDailyAutomations() {
  const supabase = getSupabaseClient();
  const now = new Date();

  const rules = await getActiveRules(supabase);
  if (rules.length === 0) {
    console.log("Sem automation_rules ativas");
    return new Response(
      JSON.stringify({ ok: true, message: "No active rules" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  console.log(`A correr ${rules.length} regras de automação às ${now.toISOString()}`);

  for (const rule of rules) {
    if (rule.trigger_type !== "daily_cron") {
      console.log(
        `[RULE ${rule.name}] trigger_type diferente de daily_cron, ignorado por agora.`
      );
      continue;
    }

    try {
      await runRule(supabase, rule, now);
    } catch (err) {
      console.error(`[RULE ${rule.name}] Erro na execução:`, err);
    }
  }

  return new Response(
    JSON.stringify({ ok: true, rules: rules.length }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

// ============================================================================

// ENTRYPOINT DA EDGE FUNCTION

// ============================================================================

Deno.serve(async (_req) => {
  // Handle CORS preflight
  if (_req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    return await runDailyAutomations();
  } catch (err) {
    console.error("Erro inesperado em runDailyAutomations:", err);
    return new Response(
      JSON.stringify({ ok: false, error: String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
