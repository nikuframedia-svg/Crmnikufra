# 🚀 Quick Start - Comandos Rápidos

## ⚠️ Problema Comum: Diretório Errado

Se vês erros como:
```
zsh: no such file or directory: ./scripts/test-automation-function.sh
Error: entrypoint path does not exist
```

**Solução:** Estás no diretório errado! Navega para o correto:

```bash
cd "/Users/martimnicolau/crm nikufra"
```

---

## 🎯 Aliases Úteis (Adicionar ao teu ~/.zshrc)

Adiciona estas linhas ao teu `~/.zshrc`:

```bash
# Aliases para CRM Nikufra
alias crm-cd='cd "/Users/martimnicolau/crm nikufra"'
alias crm-test='cd "/Users/martimnicolau/crm nikufra" && ./scripts/test-automation-function.sh'
alias crm-deploy='cd "/Users/martimnicolau/crm nikufra" && npx supabase functions deploy run-automations'
alias crm-status='cd "/Users/martimnicolau/crm nikufra" && pwd && echo "✅ Diretório correto!"'
```

Depois executa:
```bash
source ~/.zshrc
```

Agora podes usar:
- `crm-cd` - Navega para o projeto
- `crm-test` - Testa automações
- `crm-deploy` - Faz deploy
- `crm-status` - Verifica diretório

---

## 📝 Comandos Essenciais

### 1. Sempre começar aqui:
```bash
cd "/Users/martimnicolau/crm nikufra"
```

### 2. Testar automações:
```bash
./scripts/test-automation-function.sh
```

### 3. Fazer deploy:
```bash
npx supabase functions deploy run-automations
```

### 4. Verificar diretório:
```bash
pwd
# Deve mostrar: /Users/martimnicolau/crm nikufra
```

---

## ❌ O que NÃO fazer

```bash
# ❌ Executar SQL no terminal
SELECT * FROM automation_rules;

# ❌ Executar comandos sem estar no diretório correto
./scripts/test-automation-function.sh  # (se não estiveres no diretório correto)
```

---

## ✅ O que fazer

```bash
# ✅ Sempre navegar primeiro
cd "/Users/martimnicolau/crm nikufra"

# ✅ Depois executar comandos
./scripts/test-automation-function.sh

# ✅ Para SQL: usar Supabase Dashboard
# Vai a: https://supabase.com/dashboard/project/qkotmsdonlglwtrlqfja
# Clica em "SQL Editor"
```

---

## 🔍 Verificar se estás no diretório correto

```bash
pwd
# Deve mostrar: /Users/martimnicolau/crm nikufra

# Se mostrar outra coisa, navega:
cd "/Users/martimnicolau/crm nikufra"
```


