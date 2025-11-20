#!/bin/bash
# Script para iniciar o servidor de desenvolvimento do CRM Nikufra

cd "/Users/martimnicolau/crm nikufra" || {
  echo "❌ Erro: Não foi possível navegar para o diretório do projeto"
  exit 1
}

echo "✅ Diretório: $(pwd)"
echo "🚀 A iniciar servidor de desenvolvimento..."
echo ""

npm run dev


