#!/bin/bash
# Script para fazer deploy da Edge Function
# Usa este script em vez do comando direto para evitar problemas com aliases

cd "$(dirname "$0")/.." || exit 1

# Usa npx diretamente para evitar aliases
npx supabase functions deploy run-automations "$@"


