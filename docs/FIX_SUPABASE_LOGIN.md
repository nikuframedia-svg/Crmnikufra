# Resolver Problema de Login do Supabase CLI

## O Problema

O comando `npx supabase migration repair` está a travar na fase "Initialising login role...", indicando um problema de autenticação.

## Solução Rápida: Aplicar Migrations Manualmente

**Recomendado:** Aplica as migrations diretamente no Dashboard (ver `docs/APPLY_MIGRATIONS_MANUAL.md`)

## Ou Resolver o Login do CLI

### Opção 1: Re-autenticar

```bash
# Fazer logout
npx supabase logout

# Fazer login novamente (vai abrir browser)
npx supabase login
```

### Opção 2: Usar Access Token

1. **Gera um access token:**
   - Vai a https://supabase.com/dashboard/account/tokens
   - Cria um novo token
   - Copia o token

2. **Login com token:**
   ```bash
   npx supabase login --token "seu-token-aqui"
   ```

### Opção 3: Limpar Cache e Re-linkar

```bash
# Remove cache
rm -rf ~/.supabase

# Re-linka
cd "/Users/martimnicolau/crm nikufra"
npx supabase link --project-ref qkotmsdonlglwtrlqfja
```

## Nota Importante

Se o CLI continuar a ter problemas, **aplica as migrations manualmente via Dashboard** - é mais confiável e não depende do CLI funcionar perfeitamente.

Ver `docs/APPLY_MIGRATIONS_MANUAL.md` para instruções detalhadas.
