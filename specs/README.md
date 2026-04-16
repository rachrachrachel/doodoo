# KanFlow — Specs

Documentación de especificaciones del proyecto. Cada carpeta cubre un dominio:

| Carpeta | Contenido |
|---|---|
| `features/` | Spec funcional de cada feature (comportamiento, casos borde, criterios de aceptación) |
| `design/` | Design system: paleta, tipografía, componentes, animaciones |
| `database/` | Schema, RLS policies, relaciones, índices |
| `integrations/` | Clerk, Supabase, Vercel — flujos y configuración |

## Stack

- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS
- **Animaciones:** Framer Motion + dnd-kit
- **Estado:** Zustand
- **Auth:** Clerk (email/password + Google OAuth)
- **DB:** Supabase (PostgreSQL + Realtime + Storage)
- **Deploy:** Vercel

## Prioridad de features

```
Must Have (Sprint 1-2)
├── Boards CRUD
├── Listas CRUD + reordenamiento
├── Cards CRUD + drag & drop
├── Auth (Clerk)
├── Asignación de miembros
└── Etiquetas de color

Should Have (Sprint 3)
├── Filtros y búsqueda
├── Feed de actividad
├── Realtime (Supabase Channels)
└── Modo colapsado de columnas

Nice to Have (Post-MVP)
├── Notificaciones in-app
├── Vista calendario
└── Comentarios en cards
```
