/**
 * Hook: useSignalToNoiseForUser
 * 
 * OBJETIVO:
 *   Calcular, para cada colaborador (João Milhazes, Luis Nicolau, Afonso
 *   Milheiro, Mateus Silva), o "Signal-to-Noise Ratio" (SNR) das tarefas
 *   das próximas 24h e devolver as TOP N tarefas (3–5) com maior impacto real.
 * 
 * COMO USAR (exemplo):
 *   const { topTasks, scoredTasks } = useSignalToNoiseForUser({
 *     profile,
 *     allTasks,
 *     allLeads,
 *     allProjects,
 *     allActivities: [],
 *   });
 * 
 *   Depois ligas isto à tua vista "Hoje / Minha Agenda".
 */

import { useMemo } from "react";
import type {
  Task,
  Lead,
  Project,
  Activity,
} from "../types/crm";
import type { Profile } from "../lib/supabase";

// ============================================================================
// TIPOS DE APOIO
// ============================================================================

export interface ScoredTask extends Task {
  snrScore: number;
  rawScore: number;
  impact: number;
  urgency: number;
  alignment: number;
  leverage: number;
  roleFit: number;
  noise: number;
}

export interface UseSignalToNoiseOptions {
  /** Número máximo de tarefas de alta intensidade por dia (se não vier, usamos defaults por pessoa) */
  maxHighIntensityTasks?: number;
  /** Horizonte temporal em horas (default 24h) */
  horizonHours?: number;
}

export interface UseSignalToNoiseInput {
  profile: Profile;
  allTasks: Task[];
  allLeads: Lead[];
  allProjects: Project[];
  allActivities: Activity[];
}

export interface UseSignalToNoiseResult {
  topTasks: ScoredTask[];
  scoredTasks: ScoredTask[];
}

// ============================================================================
// CONFIG GLOBAL – OBJETIVOS E PESOS
// ============================================================================

// Cursor: podes puxar isto de uma tabela de settings no futuro.
// Por agora, codificamos diretamente os objetivos dos próximos 30 dias.
const STRATEGIC_OBJECTIVES = {
  // Objetivo 1: 3 clientes até 20 de janeiro (foco em receita nova)
  targetNewClients: 3,
  // Objetivo 2: 3 pilotos (imobiliária, metalúrgica, têxtil)
  pilotsTarget: 3,
  // Objetivo 3: entrar numa incubadora e abrir empresa para fundos públicos
  incubatorAndCompanySetup: true,
  // Objetivo 4: preparar SaaS industrial modular por módulos
  modularIndustrialSaaS: true,
};

// Cursor: se tens enums de tipo de tarefa no Task, mapeia aqui.
// Caso contrário, usa strings simples.
type TaskType =
  | "follow_up"
  | "call"
  | "meeting"
  | "proposal"
  | "dev"
  | "documentation"
  | "admin"
  | "outreach"
  | "pilot"
  | "product_core"
  | "internal_structuring"
  | "branding"
  | "legacy_client"
  | string;

// Helper: extrair tipo de tarefa a partir do Task
function getTaskType(task: Task): TaskType {
  // Cursor: ajusta esta função ao schema real do Task.
  // Se tiveres um campo "type" ou "category", usa-o diretamente.
  // Aqui usamos heurística básica como fallback.
  const t = (task as any).type as string | undefined;

  if (t) return t as TaskType;

  const title = (task.title || "").toLowerCase();

  if (title.includes("follow") || title.includes("follow-up")) return "follow_up";
  if (title.includes("call") || title.includes("ligar")) return "call";
  if (title.includes("reuni") || title.includes("meeting")) return "meeting";
  if (title.includes("proposta") || title.includes("proposal")) return "proposal";
  if (title.includes("dev") || title.includes("feature") || title.includes("backend") || title.includes("frontend"))
    return "dev";
  if (title.includes("doc") || title.includes("documenta")) return "documentation";
  if (title.includes("marketing") || title.includes("post") || title.includes("conteúdo")) return "branding";
  if (title.includes("pilot") || title.includes("piloto")) return "pilot";
  if (title.includes("core") || title.includes("produto")) return "product_core";
  if (title.includes("crm") || title.includes("estrutura") || title.includes("processo"))
    return "internal_structuring";

  return "admin";
}

// ============================================================================
// FUNÇÕES DE SCORING – IMPACTO, URGÊNCIA, ALINHAMENTO, LEVERAGE, FIT, RUÍDO
// ============================================================================

function computeImpactScore(task: Task, lead: Lead | undefined, project: Project | undefined): number {
  const type = getTaskType(task);

  // Impacto base por tipo (0–1)
  let base = 0.3;

  switch (type) {
    // 1) Fechar receita nova
    case "proposal":
    case "meeting":
    case "call":
    case "follow_up":
      // Se estiver ligado a lead avançada, sobe mais abaixo.
      base = 0.8;
      break;
    // 2) Avançar pilotos estratégicos
    case "pilot":
      base = 0.9;
      break;
    // 3) Desenvolvimento produto core
    case "product_core":
    case "dev":
      base = 0.8;
      break;
    // 4) Tarefas internas (estrutura, CRM, processos)
    case "internal_structuring":
      base = 0.6;
      break;
    // 5) Branding / conteúdo
    case "branding":
      base = 0.4;
      break;
    // 6) Clientes legacy que não interessam para o futuro
    case "legacy_client":
      base = 0.2;
      break;
    default:
      base = 0.3;
  }

  // Ajuste pelo valor da lead/projeto (se existir)
  let valueFactor = 1.0;
  const leadValue = (lead?.value || 0) || 0;

  if (leadValue >= 50000) valueFactor = 1.3;
  else if (leadValue >= 20000) valueFactor = 1.2;
  else if (leadValue >= 10000) valueFactor = 1.1;
  else valueFactor = 1.0;

  // Ajuste pelo estado da lead (se existir)
  let stageFactor = 1.0;
  const stage = lead?.stage;
  if (stage) {
    const s = stage.toLowerCase();
    if (s.includes("negoci") || s.includes("proposal") || s.includes("proposta")) stageFactor = 1.2;
    else if (s.includes("qualif") || s.includes("contact")) stageFactor = 1.1;
  }

  const impact = Math.min(1, base * valueFactor * stageFactor);
  return impact;
}

function computeUrgencyScore(task: Task, now: Date, horizonHours: number): number {
  // Cursor: ajusta campos 'date'/'deadline' conforme o teu Task.
  const dateStr = task.date;
  if (!dateStr) {
    // Sem deadline explícito → baixa urgência por default
    return 0.3;
  }

  const due = new Date(dateStr);
  const diffMs = due.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours <= 0) return 1.0; // já passou → extremamente urgente
  if (diffHours <= 24) return 1.0;
  if (diffHours <= 72) return 0.7;
  if (diffHours <= 24 * 7) return 0.4;

  // Fora da janela de 7 dias
  return 0.2;
}

function computeAlignmentScore(task: Task, lead: Lead | undefined, project: Project | undefined): number {
  const type = getTaskType(task);
  const title = (task.title || "").toLowerCase();

  // Se estiver explicitamente ligado a segmentos-alvo (imobiliária, metalúrgica, têxtil)
  // Nota: Lead não tem segment diretamente, mas pode ter via Company
  // Project também não tem segment diretamente
  // Por agora, usamos heurística do título
  const segmentTags = title;

  let base = 0.3;

  // Pilotos estratégicos nestes setores
  if (
    type === "pilot" ||
    segmentTags.includes("imobili") ||
    segmentTags.includes("metal") ||
    segmentTags.includes("têxt") ||
    segmentTags.includes("textil")
  ) {
    base = 0.9;
  }

  // Tarefas ligadas a incubadoras, abrir empresa, preparar fundos públicos
  if (
    title.includes("incubadora") ||
    title.includes("incubator") ||
    title.includes("candidatura") ||
    title.includes("fundos") ||
    title.includes("abrir empresa") ||
    title.includes("constituição")
  ) {
    base = Math.max(base, 0.8);
  }

  // Tarefas de produto core para SaaS industrial modular
  if (type === "product_core" || title.includes("módulo") || title.includes("module") || title.includes("saas")) {
    base = Math.max(base, 0.8);
  }

  // Tarefas ligadas a clientes "legacy" que não interessam para o futuro
  if (type === "legacy_client") {
    base = 0.2;
  }

  return Math.min(1, base);
}

function computeLeverageScore(task: Task): number {
  // Cursor: idealmente tens um campo explícito 'blocker_level' ou 'is_blocker'.
  // Aqui usamos heurística: se a descrição/título indicar que desbloqueia outros, sobe.
  const title = (task.title || "").toLowerCase();
  const description = (task.description || "").toLowerCase();
  const isBlocker =
    (task as any).is_blocker === true ||
    title.includes("desbloquear") ||
    title.includes("unblock") ||
    title.includes("dependência") ||
    title.includes("dependencia") ||
    description.includes("desbloquear") ||
    description.includes("unblock");

  if (isBlocker) return 1.0;

  // Reuniões com decisores e envios de proposta normalmente são bloqueadores
  const type = getTaskType(task);
  if (type === "meeting" || type === "proposal") return 0.8;

  return 0.3;
}

// Fit por papel/pessoa
function computeRoleFitScore(profile: Profile, task: Task): number {
  const name = (profile.full_name || "").toLowerCase();
  const role = (profile.role || "").toLowerCase();
  const type = getTaskType(task);

  // João Milhazes
  if (name.includes("joao") || name.includes("joão") || name.includes("milhazes")) {
    if (["dev", "product_core"].includes(type)) return 1.0;
    if (["outreach", "follow_up", "proposal", "call"].includes(type)) return 0.9;
    if (["meeting"].includes(type)) return 0.7;
    if (["internal_structuring", "documentation", "admin"].includes(type)) return 0.4;
    return 0.5;
  }

  // Luis Nicolau
  if (name.includes("luis") || name.includes("luís") || name.includes("nicolau")) {
    if (["call", "meeting", "proposal", "follow_up", "outreach"].includes(type)) return 1.0;
    if (["internal_structuring", "product_core"].includes(type)) return 0.8;
    if (["documentation"].includes(type)) return 0.5;
    if (["dev"].includes(type)) return 0.3;
    return 0.5;
  }

  // Afonso Milheiro
  if (name.includes("afonso") || name.includes("milheiro")) {
    if (["internal_structuring", "documentation"].includes(type)) return 1.0;
    if (
      ["pilot", "product_core"].includes(type) ||
      type === "meeting" ||
      type === "call" ||
      type === "follow_up"
    )
      return 0.8;
    if (["outreach"].includes(type)) return 0.6;
    if (["dev"].includes(type)) return 0.4;
    return 0.5;
  }

  // Mateus Silva
  if (name.includes("mateus") || name.includes("mateus silva")) {
    if (["outreach", "follow_up"].includes(type)) return 0.8;
    if (["call"].includes(type)) return 0.6;
    if (["meeting", "proposal", "product_core", "dev", "internal_structuring"].includes(type)) return 0.2;
    return 0.4;
  }

  // Default para outros perfis futuros
  return 0.5;
}

function computeNoiseScore(impact: number, alignment: number, roleFit: number): number {
  // Ruído alto quando impacto/alinhamento/fit são baixos.
  // Fórmula: combinação dos "1 - valor".
  const noise =
    0.5 * (1 - impact) + // impacto baixo aumenta ruído
    0.3 * (1 - alignment) +
    0.2 * (1 - roleFit);

  // Clamp 0–1
  return Math.min(1, Math.max(0, noise));
}

// ============================================================================
// PESOS POR COLABORADOR
// ============================================================================

interface UserWeights {
  wI: number;
  wU: number;
  wA: number;
  wL: number;
  wR: number;
  wN: number; // peso que multiplica o ruído no denominador
  maxHighIntensityTasks: number;
}

function getUserWeights(profile: Profile, defaultMax: number | undefined): UserWeights {
  const name = (profile.full_name || "").toLowerCase();

  // João Milhazes
  if (name.includes("joao") || name.includes("joão") || name.includes("milhazes")) {
    return {
      wI: 0.35,
      wU: 0.2,
      wA: 0.2,
      wL: 0.15,
      wR: 0.1,
      wN: 0.7,
      maxHighIntensityTasks: defaultMax ?? 2,
    };
  }

  // Luis Nicolau
  if (name.includes("luis") || name.includes("luís") || name.includes("nicolau")) {
    return {
      wI: 0.4,
      wU: 0.2,
      wA: 0.2,
      wL: 0.1,
      wR: 0.1,
      wN: 0.9,
      maxHighIntensityTasks: defaultMax ?? 4,
    };
  }

  // Afonso Milheiro
  if (name.includes("afonso") || name.includes("milheiro")) {
    return {
      wI: 0.3,
      wU: 0.2,
      wA: 0.25,
      wL: 0.15,
      wR: 0.1,
      wN: 0.6,
      maxHighIntensityTasks: defaultMax ?? 3,
    };
  }

  // Mateus Silva
  if (name.includes("mateus") || name.includes("mateus silva")) {
    return {
      wI: 0.25,
      wU: 0.25,
      wA: 0.2,
      wL: 0.1,
      wR: 0.2,
      wN: 1.2,
      maxHighIntensityTasks: defaultMax ?? 1,
    };
  }

  // Default para futuros colaboradores
  return {
    wI: 0.3,
    wU: 0.2,
    wA: 0.2,
    wL: 0.15,
    wR: 0.15,
    wN: 0.7,
    maxHighIntensityTasks: defaultMax ?? 3,
  };
}

// ============================================================================
// FUNÇÃO PRINCIPAL: COMPUTAR SNR DE UMA TAREFA
// ============================================================================

function computeSnrForTask(
  task: Task,
  profile: Profile,
  leadsById: Map<string, Lead>,
  projectsById: Map<string, Project>,
  now: Date,
  horizonHours: number
): ScoredTask {
  const weights = getUserWeights(profile, undefined);

  const leadId = task.lead_id;
  const projectId = task.project_id;

  const lead = leadId ? leadsById.get(leadId) : undefined;
  const project = projectId ? projectsById.get(projectId) : undefined;

  const impact = computeImpactScore(task, lead, project);
  const urgency = computeUrgencyScore(task, now, horizonHours);
  const alignment = computeAlignmentScore(task, lead, project);
  const leverage = computeLeverageScore(task);
  const roleFit = computeRoleFitScore(profile, task);
  const noise = computeNoiseScore(impact, alignment, roleFit);

  const rawScore =
    weights.wI * impact +
    weights.wU * urgency +
    weights.wA * alignment +
    weights.wL * leverage +
    weights.wR * roleFit;

  const snrScore = rawScore / (1 + weights.wN * noise);

  return {
    ...task,
    snrScore,
    rawScore,
    impact,
    urgency,
    alignment,
    leverage,
    roleFit,
    noise,
  } as ScoredTask;
}

// ============================================================================
// HOOK: useSignalToNoiseForUser
// ============================================================================

export function useSignalToNoiseForUser(
  input: UseSignalToNoiseInput,
  options?: UseSignalToNoiseOptions
): UseSignalToNoiseResult {
  const { profile, allTasks, allLeads, allProjects } = input;
  const now = useMemo(() => new Date(), []);
  const horizonHours = options?.horizonHours ?? 24;

  const result = useMemo<UseSignalToNoiseResult>(() => {
    const weights = getUserWeights(profile, options?.maxHighIntensityTasks);
    const profileId = profile.id;

    // 1) Filtrar tasks para este utilizador e para o horizonte temporal (próximas 24h, por omissão)
    const relevantTasks = allTasks.filter((task) => {
      const assigneeId = task.assignee_profile_id;
      if (!assigneeId || assigneeId !== profileId) return false;

      // Se tiver data/due date, filtramos pelo horizonte temporal
      const dateStr = task.date;
      if (!dateStr) return true; // sem data explícita, deixamos passar (será score mais baixo por urgência)

      const due = new Date(dateStr);
      const diffHours = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
      return diffHours <= horizonHours; // "próximas N horas"
    });

    // 2) Indexar leads e projetos por id para lookup rápido
    const leadsById = new Map<string, Lead>();
    for (const lead of allLeads) {
      if (lead.id) leadsById.set(lead.id, lead);
    }

    const projectsById = new Map<string, Project>();
    for (const project of allProjects) {
      if (project.id) projectsById.set(project.id, project);
    }

    // 3) Calcular SNR para cada tarefa
    const scoredTasks: ScoredTask[] = relevantTasks.map((task) =>
      computeSnrForTask(task, profile, leadsById, projectsById, now, horizonHours)
    );

    // 4) Ordenar por SNR desc
    scoredTasks.sort((a, b) => b.snrScore - a.snrScore);

    // 5) Selecionar top N dentro da capacidade diária (maxHighIntensityTasks)
    const topTasks: ScoredTask[] = [];
    let highIntensityCount = 0;

    for (const t of scoredTasks) {
      // Cursor: se tiveres um campo 'estimated_minutes', podes usar isso para filtrar melhor.
      const estMinutes = ((t as any).estimated_minutes as number | undefined) ?? 60;

      // Consideramos todas como "alta intensidade" para já. Poderias marcar algumas como low-intensity.
      if (highIntensityCount < weights.maxHighIntensityTasks) {
        topTasks.push(t);
        highIntensityCount++;
      }
      // Se quiseres permitir mais tasks pequenas, podes adicionar lógica aqui.
    }

    return { topTasks, scoredTasks };
  }, [profile, allTasks, allLeads, allProjects, options?.maxHighIntensityTasks, horizonHours, now]);

  return result;
}

