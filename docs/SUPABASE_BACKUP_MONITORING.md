# Supabase Backups & Monitoring

Este guia resume como manter a base de dados estável em produção e como acompanhar o estado dos serviços.

## 1. Backups automáticos

1. Acede ao painel do projeto Supabase → **Database** → **Backups**.
2. Garante que o *Point-in-time Recovery* (PITR) está ativo. Caso não esteja, ativa o plano `Pro` ou superior.
3. Mantém pelo menos 7 dias de retenção. Regista a data atual no dashboard.
4. Exporta um backup completo semanalmente:
   ```bash
   npx supabase db dump --project-ref <project-id> --schema public --file backups/<data>.sql
   ```
5. Guarda os ficheiros `backups/*.sql` num bucket privado (ex.: Supabase Storage → bucket `infra/backups`).

## 2. Restore rápido (runbook)

1. Identifica o backup mais recente.
2. Cria uma base de dados temporária (`Database → Branches → New branch`).
3. Restaura o ficheiro SQL:
   ```bash
   npx supabase db restore backups/<data>.sql --project-ref <branch-project-id>
   ```
4. Testa a aplicação apontando `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` para o branch.
5. Quando estiver validado, promove o branch a produção ou aponta o frontend para ele.

## 3. Monitorização & alertas

### Logs
- Supabase → **Logs** → filtra por `Edge Functions`, `Postgres`, `Auth`.
- Exporta logs críticos semanalmente (`Download JSON`).
- Configura alertas automáticos com [Logflare](https://logflare.app/) ou envio para um webhook via **Settings → Logging → Webhook**.

### Health-check do frontend
- Vercel já expõe cada deploy com status. Liga as integrações de Slack/Email em **Project → Settings → Notifications**.
- Adiciona uma rota `/health` (futuro) para validar acesso ao Supabase e às chaves LLM.

### Métricas Supabase
- Em **Settings → Database → Usage**, ativa limites para conexões simultâneas.
- Usa o painel de **Reports** para acompanhar QPS e latências.

## 4. Checklist pós-deploy

| Item | Passo |
| --- | --- |
| Backup diário | Confirmar em "Database → Backups" que o snapshot mais recente tem <24h. |
| Logs limpos | Rever **Logs** procurando erros ≥ nível warning. |
| Alertas ativos | Slack / Email configurados em Vercel e Supabase. |
| Scripts | `npm run lint`, `npm run typecheck`, `npm run build` passam localmente antes de `git push`. |

Mantém este ficheiro atualizado sempre que mudares o processo de backup ou alerta.
