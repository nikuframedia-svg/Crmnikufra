# 📊 Signal-to-Noise Ratio (SNR) - Implementação

## ✅ Implementado

O hook `useSignalToNoiseForUser` foi criado e integrado na vista "Minha Agenda" (`TodayView.tsx`).

---

## 🎯 O que faz

Calcula o **Signal-to-Noise Ratio (SNR)** das tarefas das próximas 24h para cada colaborador, devolvendo as **TOP N tarefas (3–5)** com maior impacto real.

### Fórmula SNR

```
SNR = (wI × Impact + wU × Urgency + wA × Alignment + wL × Leverage + wR × RoleFit) / (1 + wN × Noise)
```

Onde:
- **Impact**: Impacto da tarefa (0-1)
- **Urgency**: Urgência baseada no deadline (0-1)
- **Alignment**: Alinhamento com objetivos estratégicos (0-1)
- **Leverage**: Capacidade de desbloquear outras tarefas (0-1)
- **RoleFit**: Adequação ao perfil do colaborador (0-1)
- **Noise**: Ruído (tarefas de baixo valor) (0-1)

---

## 👥 Pesos por Colaborador

### João Milhazes
- **Foco**: Desenvolvimento e produto core
- **Max tasks/dia**: 2
- **Pesos**: Impact (35%), Urgency (20%), Alignment (20%), Leverage (15%), RoleFit (10%)

### Luis Nicolau
- **Foco**: Vendas e relacionamento com clientes
- **Max tasks/dia**: 4
- **Pesos**: Impact (40%), Urgency (20%), Alignment (20%), Leverage (10%), RoleFit (10%)

### Afonso Milheiro
- **Foco**: Estrutura interna e documentação
- **Max tasks/dia**: 3
- **Pesos**: Impact (30%), Urgency (20%), Alignment (25%), Leverage (15%), RoleFit (10%)

### Mateus Silva
- **Foco**: Outreach e follow-up
- **Max tasks/dia**: 1
- **Pesos**: Impact (25%), Urgency (25%), Alignment (20%), Leverage (10%), RoleFit (20%)

---

## 🎨 Interface

Na vista "Minha Agenda", aparece uma nova secção no topo:

**"Top Prioridades (Próximas 24h)"**

- Mostra as TOP 5 tarefas com maior SNR
- Cada tarefa mostra:
  - Posição (1, 2, 3...)
  - Título
  - Score SNR (formato: X.XX)
  - Hora (se disponível)
- Clicável → navega para lead/projeto associado

---

## 🔧 Como Usar

### No código:

```typescript
import { useSignalToNoiseForUser } from '../../hooks/useSignalToNoiseForUser';

const { topTasks, scoredTasks } = useSignalToNoiseForUser(
  {
    profile,
    allTasks,
    allLeads,
    allProjects,
    allActivities: [],
  },
  {
    horizonHours: 24,        // Próximas 24 horas
    maxHighIntensityTasks: 5 // Máximo de tarefas de alta intensidade
  }
);
```

### Ajustar Pesos

Edita `src/hooks/useSignalToNoiseForUser.ts`:

1. **Pesos por pessoa**: Função `getUserWeights()`
2. **Scoring de impacto**: Função `computeImpactScore()`
3. **Scoring de alinhamento**: Função `computeAlignmentScore()`
4. **Objetivos estratégicos**: Constante `STRATEGIC_OBJECTIVES`

---

## 📈 Objetivos Estratégicos (Atuais)

1. **3 clientes até 20 de janeiro** (foco em receita nova)
2. **3 pilotos** (imobiliária, metalúrgica, têxtil)
3. **Entrar numa incubadora** e abrir empresa para fundos públicos
4. **Preparar SaaS industrial modular** por módulos

---

## 🎯 Tipos de Tarefas Reconhecidos

- `follow_up` - Follow-up com clientes
- `call` - Chamadas telefónicas
- `meeting` - Reuniões
- `proposal` - Propostas comerciais
- `dev` - Desenvolvimento
- `documentation` - Documentação
- `admin` - Tarefas administrativas
- `outreach` - Prospecção
- `pilot` - Pilotos estratégicos
- `product_core` - Produto core
- `internal_structuring` - Estrutura interna
- `branding` - Branding/conteúdo
- `legacy_client` - Clientes legacy (baixa prioridade)

---

## 🔄 Próximos Passos (Opcional)

1. **Tabela de Settings**: Mover objetivos estratégicos e pesos para `settings` table
2. **UI de Configuração**: Permitir ajustar pesos via interface
3. **Histórico**: Guardar scores históricos para análise
4. **Notificações**: Alertar quando tarefas de alto SNR estão próximas do deadline
5. **Analytics**: Dashboard com métricas de SNR ao longo do tempo

---

## 📝 Notas Técnicas

- O hook usa `useMemo` para otimizar cálculos
- Filtra tarefas por `assignee_profile_id` e horizonte temporal
- Indexa leads e projetos por ID para lookup rápido
- Ordena por SNR descendente
- Seleciona top N dentro da capacidade diária

---

## ✅ Status

- ✅ Hook implementado
- ✅ Integrado na `TodayView`
- ✅ Ajustado ao schema do projeto
- ✅ Tipos TypeScript corretos
- ✅ Interface visual criada

