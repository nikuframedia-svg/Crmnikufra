#!/bin/bash

# Script para verificar o status das automações
# Verifica regras, logs, e dados que correspondem às condições

echo "🔍 Verificando status das automações..."
echo ""

# Carregar variáveis do .env
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

SUPABASE_URL="${VITE_SUPABASE_URL}"
ANON_KEY="${VITE_SUPABASE_ANON_KEY}"

if [ -z "$SUPABASE_URL" ] || [ -z "$ANON_KEY" ]; then
  echo "❌ Erro: VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não encontrados no .env"
  exit 1
fi

echo "📋 Regras ativas:"
curl -s -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "SELECT name, is_active, trigger_type FROM automation_rules WHERE is_active = true"
  }' 2>/dev/null || echo "  (Usa o Supabase Dashboard para ver as regras)"

echo ""
echo "📊 Logs de execução (últimos 5):"
echo "  (Verifica no Supabase Dashboard: SQL Editor)"
echo "  SELECT * FROM automation_rule_logs ORDER BY run_at DESC LIMIT 5;"

echo ""
echo "✅ Para executar a função manualmente:"
echo "   ./scripts/test-automation-function.sh"

echo ""
echo "💡 Dica: Para verificar se há dados que correspondem às condições:"
echo "   - Leads 'contacted' com owner: SELECT * FROM leads WHERE stage = 'contacted' AND owner_id IS NOT NULL;"
echo "   - Projetos 'active': SELECT * FROM projects WHERE status = 'active';"

