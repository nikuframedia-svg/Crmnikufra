#!/bin/bash
# Script para testar a Edge Function run-automations

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Testing Edge Function: run-automations${NC}\n"

# Verifica se o .env existe
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found${NC}"
    echo "Please create a .env file with VITE_SUPABASE_ANON_KEY"
    exit 1
fi

# Tenta ler a chave do .env
ANON_KEY=$(grep "VITE_SUPABASE_ANON_KEY" .env | cut -d '=' -f2 | tr -d '"' | tr -d "'" | xargs)

if [ -z "$ANON_KEY" ]; then
    echo -e "${RED}Error: VITE_SUPABASE_ANON_KEY not found in .env${NC}"
    echo "Please add VITE_SUPABASE_ANON_KEY to your .env file"
    exit 1
fi

SUPABASE_URL=$(grep "VITE_SUPABASE_URL" .env | cut -d '=' -f2 | tr -d '"' | tr -d "'" | xargs)

if [ -z "$SUPABASE_URL" ]; then
    echo -e "${RED}Error: VITE_SUPABASE_URL not found in .env${NC}"
    exit 1
fi

# Extrai o project ref da URL
PROJECT_REF=$(echo "$SUPABASE_URL" | sed -E 's|https?://([^.]+)\.supabase\.co.*|\1|')

echo -e "${GREEN}Project:${NC} $PROJECT_REF"
echo -e "${GREEN}Function URL:${NC} ${SUPABASE_URL}/functions/v1/run-automations"
echo ""

# Invoca a função
echo -e "${YELLOW}Invoking function...${NC}\n"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  "${SUPABASE_URL}/functions/v1/run-automations" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo -e "${YELLOW}HTTP Status:${NC} $HTTP_CODE"
echo -e "${YELLOW}Response:${NC}"
echo "$BODY" | jq . 2>/dev/null || echo "$BODY"

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "\n${GREEN}✅ Function executed successfully!${NC}"
else
    echo -e "\n${RED}❌ Function returned error code: $HTTP_CODE${NC}"
    echo ""
    echo "Common issues:"
    echo "1. Check that VITE_SUPABASE_ANON_KEY is correct in .env"
    echo "2. Verify the function is deployed: npx supabase functions list"
    echo "3. Check function logs: npx supabase functions logs run-automations"
fi

