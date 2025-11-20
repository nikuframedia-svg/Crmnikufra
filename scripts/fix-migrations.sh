#!/bin/bash
# Script para resolver problemas de migrations do Supabase

set -e

cd "/Users/martimnicolau/crm nikufra"

echo "🔍 Verificando estado das migrations..."

# Verifica se está linkado
if [ ! -f "supabase/.temp/project-ref" ]; then
    echo "❌ Projeto não está linkado. A linkar..."
    npx supabase link --project-ref qkotmsdonlglwtrlqfja
fi

echo ""
echo "📋 Estado atual das migrations:"
echo ""

# Tenta listar migrations com timeout
timeout 15 npx supabase migration list 2>&1 || {
    echo ""
    echo "⚠️  O comando está a demorar muito. Vamos resolver o problema:"
    echo ""
    echo "A migration remota 20250929103049 não existe localmente."
    echo ""
    echo "Opções:"
    echo "1. Marcar como revertida (recomendado se não for importante)"
    echo "2. Fazer pull da migration remota"
    echo ""
    read -p "Escolhe uma opção (1 ou 2): " choice
    
    case $choice in
        1)
            echo "Marcando migration remota como revertida..."
            npx supabase migration repair --status reverted 20250929103049
            echo "✅ Migration marcada como revertida"
            echo ""
            echo "Agora podes aplicar as migrations locais:"
            echo "  npx supabase db push"
            ;;
        2)
            echo "Fazendo pull da migration remota..."
            npx supabase db pull
            echo "✅ Pull concluído"
            ;;
        *)
            echo "Opção inválida"
            exit 1
            ;;
    esac
}

