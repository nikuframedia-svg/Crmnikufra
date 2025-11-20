# ✅ Erros Corrigidos e Como Evitá-los

## ❌ Erros que NÃO vão mais aparecer

### 1. **Erro de diretório errado** (linhas 782-790)
```
Error: entrypoint path does not exist (supabase/functions/run-automations/index.ts)
zsh: no such file or directory: ./scripts/test-automation-function.sh
```

**Causa:** Estavas no diretório `duplius-mvp` em vez de `crm nikufra`

**Solução:** Sempre que precisares de executar comandos, certifica-te de estar no diretório correto:
```bash
cd "/Users/martimnicolau/crm nikufra"
```

**Status:** ✅ Resolvido - desde que estejas no diretório correto

---

## ⚠️ Erros que AINDA podem aparecer (e como evitar)

### 2. **Tentar executar SQL diretamente no terminal** (linhas 791-802)
```
zsh: command not found: SELECT
zsh: command not found: ORDER
zsh: command not found: LIMIT
```

**Causa:** SQL não pode ser executado diretamente no terminal bash/zsh

**Soluções:**

#### Opção A: Usar Supabase Dashboard (Recomendado)
1. Vai a: https://supabase.com/dashboard/project/qkotmsdonlglwtrlqfja
2. Clica em "SQL Editor"
3. Cola a query SQL
4. Clica em "Run"

#### Opção B: Usar o script helper (se criarmos)
```bash
# Exemplo de script que podemos criar
./scripts/run-sql.sh "SELECT * FROM automation_rules"
```

#### Opção C: Usar MCP Supabase (via AI)
- Podes pedir-me para executar queries SQL
- Eu uso o MCP Supabase para executar diretamente

**Status:** ⚠️ Vai continuar a acontecer se tentares executar SQL no terminal

---

## 📝 Resumo de Comandos Corretos

### ✅ Comandos que FUNCIONAM no terminal:

```bash
# 1. Navegar para o diretório correto
cd "/Users/martimnicolau/crm nikufra"

# 2. Testar a Edge Function
./scripts/test-automation-function.sh

# 3. Fazer deploy da Edge Function
npx supabase functions deploy run-automations

# 4. Executar script de automações local
npm run automations

# 5. Ver logs (se criarmos script)
./scripts/check-automation-status.sh
```

### ❌ Comandos que NÃO funcionam no terminal:

```bash
# ❌ SQL direto no terminal
SELECT * FROM automation_rules;

# ❌ Comandos SQL
INSERT INTO leads ...;

# ❌ Comentários SQL
-- Criar uma lead de teste
```

---

## 🎯 Quick Reference

| O que queres fazer | Como fazer |
|-------------------|------------|
| Executar SQL | Supabase Dashboard → SQL Editor OU pedir-me para executar |
| Testar automações | `./scripts/test-automation-function.sh` |
| Fazer deploy | `npx supabase functions deploy run-automations` |
| Ver regras | Pedir-me para executar: `SELECT * FROM automation_rules` |
| Criar regra | Supabase Dashboard → SQL Editor OU pedir-me para criar |

---

## 💡 Dica Final

**Sempre que tiveres dúvidas:**
1. Verifica se estás no diretório correto: `pwd`
2. Para SQL: usa Supabase Dashboard ou pede-me para executar
3. Para scripts: certifica-te que estás no diretório do projeto

