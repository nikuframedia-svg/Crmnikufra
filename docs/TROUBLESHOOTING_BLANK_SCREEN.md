# 🔧 Troubleshooting: Tela Preta (Blank Screen)

## Problema
A aplicação mostra uma tela completamente preta no browser.

## Soluções

### 1. Verificar Console do Browser
**Abre o DevTools (F12 ou Cmd+Option+I) e verifica:**
- Aba "Console" - procura por erros em vermelho
- Aba "Network" - verifica se há requests falhando

### 2. Verificar Variáveis de Ambiente
```bash
# Verifica se o .env existe e tem as variáveis corretas:
cat .env | grep VITE_SUPABASE
```

**Deve mostrar:**
```
VITE_SUPABASE_URL=https://qkotmsdonlglwtrlqfja.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Reiniciar o Servidor
```bash
# Para o servidor (Ctrl+C) e reinicia:
npm run dev
```

### 4. Limpar Cache do Browser
- **Chrome/Edge**: Cmd+Shift+R (Mac) ou Ctrl+Shift+R (Windows)
- **Firefox**: Cmd+Shift+R (Mac) ou Ctrl+F5 (Windows)

### 5. Verificar Erros Comuns

#### Erro: "Missing Supabase environment variables"
**Solução:** Verifica se o `.env` está na raiz do projeto e tem as variáveis corretas.

#### Erro: "useAuth must be used within an AuthProvider"
**Solução:** Já corrigido - o `AuthProvider` está no `App.tsx`.

#### Erro: "Cannot read property 'X' of undefined"
**Solução:** Pode ser um hook a tentar aceder a dados antes de carregarem. Verifica os hooks.

### 6. Verificar se o Servidor Está a Correr
```bash
# Deve mostrar:
> crm-nikufra@0.0.0 dev
> vite

  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5174/
```

### 7. Testar URL Direta
Tenta aceder diretamente a:
- `http://localhost:5174/` (Dashboard)
- `http://localhost:5174/today` (Minha Agenda)
- `http://localhost:5174/crm` (CRM)

### 8. Verificar Imports
Se houver erros de import, verifica:
- Todos os ficheiros existem
- Todos os imports estão corretos
- Não há erros de TypeScript

### 9. Verificar Supabase Connection
```bash
# Testa a conexão:
node -e "console.log(process.env.VITE_SUPABASE_URL)"
```

### 10. Reinstalar Dependências (Último Recurso)
```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

## Erros Mais Comuns

### "supabaseUrl is required"
- **Causa:** `.env` não está a ser carregado
- **Solução:** Verifica se o `.env` está na raiz e reinicia o servidor

### "Cannot read properties of null"
- **Causa:** Hook a tentar aceder a dados antes de carregarem
- **Solução:** Adiciona verificações `if (!data) return null;` nos componentes

### Tela preta sem erros
- **Causa:** Erro silencioso ou CSS
- **Solução:** Verifica o console e tenta desativar dark mode temporariamente

---

## Debug Rápido

1. **Abre o Console (F12)**
2. **Procura por erros em vermelho**
3. **Copia o erro e procura aqui ou no Google**
4. **Verifica se o `.env` está correto**
5. **Reinicia o servidor**

---

## Se Nada Funcionar

Partilha:
1. O erro exato do console (screenshot ou texto)
2. O output do terminal onde corre `npm run dev`
3. O conteúdo do `.env` (sem mostrar as chaves completas)

