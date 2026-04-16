# KanFlow

Herramienta de gestión de tareas con tableros Kanban. Interfaz Soft UI con tarjetas de color semántico, tipografía expresiva y microinteracciones fluidas.

## Stack

- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS
- **Animaciones:** Framer Motion + dnd-kit (drag & drop)
- **Estado:** Zustand
- **Auth:** Clerk (email/password + Google OAuth)
- **Base de datos:** Supabase (PostgreSQL + Realtime + Storage)
- **Deploy:** Vercel

## Requisitos previos

- Node.js 18+
- Cuenta en [Clerk](https://clerk.com)
- Proyecto en [Supabase](https://supabase.com)

## Instalación

```bash
npm install
```

## Variables de entorno

Copia `.env.example` a `.env` y completa los valores:

```bash
cp .env.example .env
```

| Variable | Descripción |
|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | Clave pública de Clerk |
| `CLERK_SECRET_KEY` | Clave secreta de Clerk (solo Edge Functions) |
| `VITE_SUPABASE_URL` | URL de tu proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Anon key de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (solo Edge Functions) |

## Base de datos

Ejecuta la migración inicial en Supabase:

```bash
# Desde el dashboard de Supabase > SQL Editor
# O usando Supabase CLI:
supabase db push
```

El schema está en `supabase/migrations/001_initial_schema.sql`.

## Desarrollo

```bash
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173).

## Estructura

```
src/
  components/
    ui/        → Button, Card, Avatar, Badge
    layout/    → Shell, Sidebar, Navbar
    boards/    → BoardCard, BoardModal
    cards/     → KanbanCard, CardModal
    lists/     → KanbanColumn, ListHeader
    auth/      → componentes de auth
  hooks/       → useAuth, useBoard, useCards
  stores/      → boardStore, cardStore, uiStore
  lib/         → supabase.ts, clerk.ts
  types/       → database.ts, index.ts
  utils/       → cn.ts
  pages/       → BoardsPage, BoardPage
  styles/      → tokens.css
```

## Build

```bash
npm run build
```
