# Integración: Clerk

## Configuración
- Provider: `<ClerkProvider publishableKey={VITE_CLERK_PUBLISHABLE_KEY}>`
- Auth methods habilitados: Email/Password, Google OAuth
- Redirect after sign-in: `/`
- Redirect after sign-up: `/`

## Variables de entorno
```
VITE_CLERK_PUBLISHABLE_KEY=pk_...   # frontend (expuesta)
CLERK_SECRET_KEY=sk_...             # solo Edge Functions (nunca en frontend)
CLERK_WEBHOOK_SECRET=whsec_...      # para verificar webhook signature
```

## Hooks usados
```typescript
useUser()      // perfil del usuario actual
useAuth()      // getToken(), signOut(), isSignedIn
```

## Flujo JWT → Supabase
1. Usuario logeado en Clerk
2. `getToken({ template: 'supabase' })` → JWT con claims de Supabase
3. `supabase.auth.setSession({ access_token: token })` en cada request
4. Supabase RLS usa `auth.uid()` para filtrar datos

## Webhook sync → Supabase
Endpoint: `POST /functions/v1/sync-user`

| Evento Clerk | Acción Supabase |
|---|---|
| `user.created` | INSERT INTO users |
| `user.updated` | UPDATE users SET email, full_name, avatar_url |
| `user.deleted` | DELETE FROM users (cascade a boards si owner) |

### Verificación de firma
```typescript
import { Webhook } from 'svix'
const wh = new Webhook(CLERK_WEBHOOK_SECRET)
wh.verify(rawBody, headers) // lanza si firma inválida
```
