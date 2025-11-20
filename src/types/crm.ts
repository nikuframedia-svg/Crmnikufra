/**
 * Core CRM domain types shared across the Nikufra app.
 * These mirror the Supabase schema defined in `supabase/migrations`.
 */

export type UUID = string;

// -------------------------------
// Shared helpers
// -------------------------------

export type CurrencyCode = 'EUR' | 'USD' | 'GBP';

export type Timestamp = string; // ISO string

// -------------------------------
// Profiles
// -------------------------------

export type ProfileRole = 'admin' | 'manager' | 'salesperson' | 'user';

export interface Profile {
  id: UUID;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: ProfileRole;
  department?: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// -------------------------------
// CRM (Leads / Contacts / Companies)
// -------------------------------

export type LeadStage =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'proposal'
  | 'negotiation'
  | 'won'
  | 'lost';

export interface Lead {
  id: UUID;
  title: string;
  contact_id?: UUID;
  company_id?: UUID;
  stage: LeadStage;
  value?: number;
  currency: CurrencyCode;
  probability?: number;
  expected_close_date?: string; // YYYY-MM-DD
  notes?: string;
  owner_id?: UUID;
  created_by: UUID;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Contact {
  id: UUID;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  job_title?: string;
  company_id?: UUID;
  linkedin_url?: string;
  notes?: string;
  tags?: string[];
  owner_id?: UUID;
  created_by: UUID;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Company {
  id: UUID;
  name: string;
  vat?: string;
  industry?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  country?: string;
  notes?: string;
  owner_id?: UUID;
  created_by: UUID;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// -------------------------------
// Projects & Documentation
// -------------------------------

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
export type ProjectPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Project {
  id: UUID;
  name: string;
  description?: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  start_date?: string; // YYYY-MM-DD
  end_date?: string;
  owner_id?: UUID;
  created_by: UUID;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface DocumentRecord {
  id: UUID;
  title: string;
  description?: string;
  project_id?: UUID;
  lead_id?: UUID;
  parent_id?: UUID;
  storage_path?: string;
  is_template: boolean;
  created_by: UUID;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// -------------------------------
// Tasks / Calendar
// -------------------------------

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';

export interface Task {
  id: UUID;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: ProjectPriority;
  project_id?: UUID;
  lead_id?: UUID;
  assignee_profile_id?: UUID;
  date?: string; // YYYY-MM-DD (for calendar view)
  start_time?: string; // HH:MM
  end_time?: string;
  created_by: UUID;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// -------------------------------
// Performance / Deals / KPIs
// -------------------------------

export type DealStatus = 'pending' | 'won' | 'lost';

export interface Deal {
  id: UUID;
  lead_id?: UUID;
  amount: number;
  currency: CurrencyCode;
  close_date: string;
  status: DealStatus;
  notes?: string;
  created_by: UUID;
  created_at: Timestamp;
}

export interface KpiMetric {
  id: UUID;
  name: string;
  category: string;
  value: number;
  unit?: string;
  target_value?: number;
  user_id?: UUID;
  api_connection_id?: UUID;
  metric_date: string;
  created_at: Timestamp;
}

export interface SalesPerformance {
  id: UUID;
  user_id: UUID;
  period_start: string;
  period_end: string;
  total_deals: number;
  total_revenue: number;
  won_deals: number;
  lost_deals: number;
  conversion_rate: number;
  rank?: number;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface DashboardMetrics {
  totalContacts: number;
  activeLeads: number;
  activeProjects: number;
  pendingTasks: number;
  upcomingEvents: number;
  documentsCount: number;
  staleLeadsCount: number;
  staleProjectsCount: number;
}

// -------------------------------
// Activities & Notes
// -------------------------------

export type EntityType = 'lead' | 'contact' | 'company' | 'project';

export type ActivityType = 'note' | 'status_change' | 'task_created' | 'document_added' | 'manual';

export interface Activity {
  id: UUID;
  entity_type: EntityType;
  entity_id: UUID;
  type: ActivityType;
  author_profile_id: UUID;
  metadata?: Record<string, any>;
  created_at: Timestamp;
}

export interface Note {
  id: UUID;
  entity_type: EntityType;
  entity_id: UUID;
  author_profile_id: UUID;
  content: string;
  created_at: Timestamp;
}

// -------------------------------
// Notifications
// -------------------------------

export type NotificationType = 'task_assigned' | 'lead_assigned' | 'status_change' | 'comment';

export type NotificationEntityType = 'lead' | 'contact' | 'company' | 'project' | 'task' | 'document';

export interface Notification {
  id: UUID;
  user_profile_id: UUID;
  type: NotificationType;
  message: string;
  entity_type: NotificationEntityType;
  entity_id: UUID;
  read_at: Timestamp | null;
  created_at: Timestamp;
}

// -------------------------------
// Chat
// -------------------------------

export interface ChatChannel {
  id: UUID;
  name: string;
  slug: string;
  description?: string;
  is_private: boolean;
  created_at: Timestamp;
}

export interface ChatMessage {
  id: UUID;
  channel_id: UUID;
  author_profile_id: UUID;
  content: string;
  created_at: Timestamp;
}

// -------------------------------
// Automation Rules
// -------------------------------

export type AutomationRuleTriggerType = 'daily_cron' | 'lead_status_change' | 'project_created' | 'task_completed';

/**
 * Condition configuration for automation rules
 * Structure depends on trigger_type and entity type
 * 
 * Examples:
 * - Lead condition: { entity: 'lead', status: 'contacted', days_without_activity: 7 }
 * - Project condition: { entity: 'project', status: 'active', days_without_task: 14 }
 */
export type AutomationCondition = Record<string, any>;

/**
 * Action configuration for automation rules
 * 
 * Examples:
 * - create_task_and_notification: { type: 'create_task_and_notification', task_title_template: '...', ... }
 * - create_notification_only: { type: 'create_notification_only', message_template: '...' }
 */
export type AutomationAction = Record<string, any>;

export interface AutomationRule {
  id: UUID;
  name: string;
  description?: string;
  is_active: boolean;
  trigger_type: AutomationRuleTriggerType;
  condition: AutomationCondition;
  action: AutomationAction;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface AutomationRuleLog {
  id: UUID;
  rule_id: UUID;
  run_at: Timestamp;
  result?: string;
  error?: string;
  metadata?: Record<string, any>;
}

