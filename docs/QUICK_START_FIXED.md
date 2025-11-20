# 🚀 Iniciar o Servidor - Solução Rápida

## ⚠️ Problema: Alias não funciona

Se o comando `crm-cd` não funciona, é porque o shell ainda não carregou os aliases.

## ✅ Solução Imediata (Escolhe uma)

### Opção 1: Usa o caminho completo (MAIS RÁPIDO)

```bash
cd "/Users/martimnicolau/crm nikufra"
npm run dev
```

### Opção 2: Usa o script helper

```bash
bash "/Users/martimnicolau/crm nikufra/scripts/start-dev.sh"
```

### Opção 3: Recarrega o shell e usa o alias

```bash
# Recarrega o .zshrc:
source ~/.zshrc

# Agora o alias funciona:
crm-cd
npm run dev
```

### Opção 4: Novo alias mais simples

```bash
# Adicionei um alias que faz tudo de uma vez:
crm-dev
```

---

## 🎯 Output Esperado

Quando correres `npm run dev` no diretório correto, deves ver:

```
> crm-nikufra@0.0.0 dev
> vite

  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

**NÃO deves ver:**
- ❌ `duplius-mvp`
- ❌ `nodemon server.js`
- ❌ `Server running on port 3000`

---

## 🔧 Aliases Disponíveis (após recarregar shell)

```bash
source ~/.zshrc  # Recarrega primeiro

# Depois podes usar:
crm-cd      # Navega para o diretório
crm-dev     # Navega E inicia o servidor
crm-test    # Testa a Edge Function
crm-deploy  # Faz deploy da Edge Function
crm-status  # Ver estado das migrations
```

---

## 💡 Dica

Se estiveres sempre a esquecer, usa o **alias `crm-dev`** que faz tudo de uma vez:
```bash
crm-dev
```

