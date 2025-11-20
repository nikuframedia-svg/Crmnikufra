# 🚀 Como Iniciar o Servidor CRM Nikufra

## ✅ Verificação Rápida

Antes de iniciar, garante que estás no diretório correto:

```bash
# Usa o alias (recomendado):
crm-cd

# OU navega manualmente:
cd "/Users/martimnicolau/crm nikufra"
```

## 🎯 Iniciar o Servidor

```bash
npm run dev
```

**Output esperado:**
```
> crm-nikufra@0.0.0 dev
> vite

  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

## ⚠️ Se Vires "duplius-mvp" ou "nodemon"

**Problema:** Estás no diretório errado!

**Solução:**
1. Para o servidor (Ctrl+C)
2. Navega para o diretório correto:
   ```bash
   crm-cd
   ```
3. Inicia novamente:
   ```bash
   npm run dev
   ```

## 🔧 Verificações

### 1. Diretório Correto
```bash
pwd
# Deve mostrar: /Users/martimnicolau/crm nikufra
```

### 2. Package.json Correto
```bash
cat package.json | grep '"name"'
# Deve mostrar: "name": "crm-nikufra",
```

### 3. Script Dev Correto
```bash
cat package.json | grep '"dev"'
# Deve mostrar: "dev": "vite",
```

### 4. Ficheiro .env Existe
```bash
test -f .env && echo "✅ .env existe" || echo "❌ .env não encontrado"
```

## 📝 Variáveis de Ambiente Necessárias

O ficheiro `.env` deve conter:

```env
VITE_SUPABASE_URL=https://qkotmsdonlglwtrlqfja.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_OPENAI_API_KEY=sk-proj-...
```

## 🎉 Pronto!

Depois de iniciar, abre o browser em:
**http://localhost:5173/**

