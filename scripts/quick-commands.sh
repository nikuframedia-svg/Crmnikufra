#!/bin/bash

# Script de comandos rápidos para o projeto CRM Nikufra
# Uso: source scripts/quick-commands.sh (ou . scripts/quick-commands.sh)

PROJECT_DIR="/Users/martimnicolau/crm nikufra"

# Função para navegar para o diretório do projeto
cdproject() {
  cd "$PROJECT_DIR" && pwd && echo "✅ Agora estás no diretório correto!"
}

# Função para testar automações
test-automations() {
  cd "$PROJECT_DIR" && ./scripts/test-automation-function.sh
}

# Função para fazer deploy
deploy-automations() {
  cd "$PROJECT_DIR" && npx supabase functions deploy run-automations
}

# Função para verificar status
check-status() {
  cd "$PROJECT_DIR" && echo "📊 Status do projeto:" && pwd && echo "" && echo "📋 Regras de automação:" && echo "   (Usa Supabase Dashboard para ver SQL)" && echo "" && echo "✅ Para testar: ./scripts/test-automation-function.sh"
}

# Mostrar ajuda
show-help() {
  echo "🚀 Comandos rápidos disponíveis:"
  echo ""
  echo "  cdproject          - Navega para o diretório do projeto"
  echo "  test-automations   - Testa a Edge Function de automações"
  echo "  deploy-automations - Faz deploy da Edge Function"
  echo "  check-status       - Verifica status do projeto"
  echo ""
  echo "💡 Para usar:"
  echo "  1. source scripts/quick-commands.sh"
  echo "  2. cdproject"
  echo "  3. test-automations"
}

# Se executado diretamente, mostrar ajuda
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
  show-help
fi

