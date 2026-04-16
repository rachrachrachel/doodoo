# Integración: Supabase

## Proyecto
- ID: `rngfuxmltvqanopohlqa`
- URL: `https://rngfuxmltvqanopohlqa.supabase.co`
- Region: `us-east-1`
- DB: PostgreSQL 17

## Variables de entorno
```
VITE_SUPABASE_URL=https://rngfuxmltvqanopohlqa.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...     # frontend (expuesta, segura gracias a RLS)
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # solo server-side, NUNCA en frontend
```

## Cliente
```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

## Realtime

Tablas con Realtime habilitado:
- `cards` — para sincronizar movimientos y ediciones
- `lists` — para sincronizar creación y reorden
- `board_members` — para sincronizar invitaciones

```typescript
const channel = supabase
  .channel(`board:${boardId}`)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'cards' }, handler)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'lists' }, handler)
  .subscribe()

// Cleanup
return () => supabase.removeChannel(channel)
```

## Storage

Bucket: `avatars` (público)
- Usado para fotos de perfil subidas manualmente
- Clerk ya provee avatarUrl para auth con Google

## Edge Functions

| Función | Trigger | Descripción |
|---|---|---|
| `sync-user` | Webhook Clerk | Sincroniza usuarios en tabla `users` |

## RLS por tabla

| Tabla | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `users` | todos | service role | propio | — |
| `boards` | owner + miembros | owner | owner | owner |
| `lists` | miembros | miembros | miembros | miembros |
| `cards` | miembros | miembros | miembros | miembros |
| `board_members` | miembros | owner | owner | owner |
| `labels` | miembros | miembros | miembros | miembros |
| `card_assignees` | miembros | miembros | — | miembros |
| `checklist_items` | miembros | miembros | miembros | miembros |
| `activity_log` | miembros | miembros | — | — |
