# KanFlow — Product Requirements Document

> **Versión:** v1.0 — MVP  
> **Fecha:** Abril 2026  
> **Duración estimada:** 10 semanas  
> **Estado:** En planificación

---

## Resumen ejecutivo

Doodoo es una herramienta de gestión de tareas con tableros Kanban de interfaz visual limpia y memorable. Su diferenciador es el sistema de diseño **Soft UI** con tarjetas de color semántico, tipografía expresiva y microinteracciones fluidas — inspirado en el estilo visual de dashboards como el de Salesforce Daily Operations.

El MVP cubre el flujo esencial: crear boards, listas y cards; asignar tareas a personas; mover cards entre columnas; y agregar fechas, descripciones y etiquetas de color.

---

## Métricas de éxito (KPIs)

| Métrica | Objetivo |
|---|---|
| Tiempo hasta primera card creada | < 2 minutos |
| Usuarios activos en semana 4 | 50 usuarios |
| Retención semana 2 | > 40% |
| NPS después del MVP | > 35 puntos |

---

## 1. Usuarios objetivo

### 1.1 Project Manager
> *"Quiero ver todas las tareas del equipo en un tablero visual para identificar bloqueos de un vistazo y reasignar sin fricción."*

### 1.2 Diseñador / Desarrollador
> *"Quiero ver mis tareas asignadas agrupadas por estado para saber exactamente en qué enfocarme cada día."*

### 1.3 Líder de startup
> *"Quiero crear boards por proyecto con mi equipo pequeño (2–10 personas) sin pagar licencias caras como Jira."*

### 1.4 Freelancer
> *"Quiero organizar mis proyectos personales en un tablero simple y visualmente agradable para trabajar con claridad."*

---

## 2. Features del MVP

### Must Have — Sprint 1 y 2

| Feature | Descripción |
|---|---|
| **Boards** | Crear, editar y eliminar boards. Cada board tiene nombre, descripción e imagen de fondo opcional. |
| **Listas (columnas)** | Agregar columnas con nombres y colores personalizados dentro de cada board. CRUD completo. |
| **Cards / Tareas** | Crear cards con título, descripción, fecha límite, etiquetas de color y miembro asignado. |
| **Drag & Drop** | Mover cards entre columnas con animación fluida. Reordenar dentro de la misma columna. |
| **Autenticación** | Registro e ingreso con email/contraseña y OAuth (Google) usando Clerk. Perfil con avatar. |
| **Asignación de miembros** | Invitar usuarios al board por email. Asignar uno o más miembros a cada card con avatar overlap. |
| **Etiquetas de color** | Sistema de etiquetas con paleta de colores (bug, feature, urgente, bloqueado, etc.). |

### Should Have — Sprint 3

| Feature | Descripción |
|---|---|
| **Progress indicator** | Barra de progreso en cards con checklist. Indicador visual en columnas (completados/totales). |
| **Actividad del board** | Feed de actividad reciente: quién movió qué card y cuándo. |
| **Filtros y búsqueda** | Filtrar cards por miembro, etiqueta o fecha límite. Búsqueda global dentro del board. |
| **Modo colapsado** | Colapsar columnas para ver más contenido en pantalla. Estado guardado por usuario. |

### Nice to Have — Post-MVP

| Feature | Descripción |
|---|---|
| **Notificaciones in-app** | Alertas cuando te asignan una card, se acerca la fecha límite o hay un comentario. |
| **Vista de calendario** | Vista alternativa que muestra cards por fecha límite en un calendario mensual. |
| **Comentarios en cards** | Hilo de comentarios dentro de cada card con menciones @usuario. |

---

## 3. Sistema de diseño UI

El estilo visual está inspirado en el **Soft UI / Clean Dashboard** de la referencia: tarjetas con bordes redondeados, tipografía expresiva, paleta pastel con acentos de color, avatares circulares y mucho espacio blanco. La sensación debe ser *ligera, profesional y memorable*.

### 3.1 Paleta de colores

| Rol | Color | Hex |
|---|---|---|
| Acento principal | Amarillo | `#F2E840` |
| Acento secundario | Lila | `#D4B8F0` |
| Acento terciario | Rosa | `#F0B8D0` |
| Fondo neutro | Cream | `#F5F3EE` |
| Superficies | Blanco | `#FFFFFF` |
| Texto base | Negro | `#111111` |

### 3.2 Tipografía

- **Display / Títulos:** Syne 800 — números grandes, nombres de board, headings principales.
- **Body / UI:** DM Sans 400/500 — texto corriente, labels, descripciones.
- No usar Inter, Roboto ni fuentes genéricas del sistema.

### 3.3 Componentes clave

**Cards (Tarjetas)**
- `border-radius: 16px`
- Fondo blanco o pastel según categoría de la columna
- Sombra suave: `box-shadow: 0 2px 12px rgba(0,0,0,0.06)`
- Progress bar interna cuando hay checklist
- Hasta 3 avatares en overlap (assignees)

**Columnas**
- Header con nombre editable y color de acento
- Contador de cards visibles
- Botón "+" para agregar card al fondo
- Opción de colapsar

**Avatares**
- Círculos de 32–40px con foto del usuario
- Iniciales como fallback con fondo de color
- Overlap de 2–3 avatares cuando hay múltiples asignados

**Animaciones**
- Drag & drop con spring physics (Framer Motion)
- Hover states sutiles (100ms)
- Transiciones de tarjetas: 200ms ease-out
- Sin efectos pesados ni glassmorphism

---

## 4. Stack tecnológico

### 4.1 Frontend

| Capa | Tecnología | Justificación |
|---|---|---|
| Framework | **React 18** | Ecosistema maduro, compatible con todo el stack |
| Bundler | **Vite** | Dev server rápido, HMR instantáneo |
| Lenguaje | **TypeScript** | Type-safety desde el inicio, menos bugs |
| Estilos | **Tailwind CSS** | Utility-first, consistente con el design system |
| Animaciones | **Framer Motion** | Spring physics para drag & drop y transiciones |
| Drag & Drop | **dnd-kit** | Accesible, performante, funciona en mobile |
| Estado global | **Zustand** | Liviano, simple, sin boilerplate de Redux |
| Íconos | **Lucide React** | Set consistente y limpio |
| Router | **React Router v6** | Navegación client-side estándar |

### 4.2 Autenticación

| Capa | Tecnología | Justificación |
|---|---|---|
| Auth | **Clerk** | UI preconstruida, OAuth (Google, GitHub), gestión de sesiones, webhooks para sincronizar users con Supabase |

**Flujo de autenticación:**
1. Usuario se registra/ingresa en Clerk (email o OAuth)
2. Clerk emite JWT con `userId`
3. El JWT se usa en Supabase RLS (Row Level Security) para proteger datos
4. Hook `useUser()` de Clerk disponible en toda la app

### 4.3 Base de datos y backend

| Capa | Tecnología | Justificación |
|---|---|---|
| Base de datos | **Supabase (PostgreSQL)** | Relacional, RLS nativo, Realtime built-in |
| API | **Supabase SDK (supabase-js)** | Llamadas directas desde React, sin backend intermedio |
| Realtime | **Supabase Realtime Channels** | Sincronización en vivo cuando múltiples usuarios editan |
| Storage | **Supabase Storage** | Para avatares y fondos de boards |
| Edge Functions | **Supabase Edge Functions** | Para lógica server-side si se necesita (ej: envío de emails) |

> **Nota de arquitectura:** React actúa como frontend Y como capa de acceso a datos a través del SDK de Supabase directamente. No hay servidor Express/Node intermedio. La seguridad se maneja con Row Level Security (RLS) en Supabase usando el JWT de Clerk.

### 4.4 Deploy e infraestructura

| Servicio | Uso |
|---|---|
| **Vercel** | Deploy del frontend React, CI/CD automático desde GitHub |
| **Supabase Cloud** | Base de datos PostgreSQL + Auth helper + Storage |
| **Clerk Dashboard** | Gestión de usuarios, configuración OAuth |

---

## 5. Esquema de base de datos

```sql
-- Usuarios (sincronizados desde Clerk via webhook)
users (
  id          uuid PRIMARY KEY,          -- clerk_user_id
  email       text UNIQUE NOT NULL,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz DEFAULT now()
)

-- Boards
boards (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  description text,
  cover_color text DEFAULT '#F5F3EE',
  owner_id    uuid REFERENCES users(id),
  created_at  timestamptz DEFAULT now()
)

-- Miembros de un board
board_members (
  board_id    uuid REFERENCES boards(id) ON DELETE CASCADE,
  user_id     uuid REFERENCES users(id) ON DELETE CASCADE,
  role        text DEFAULT 'member',    -- 'owner' | 'member'
  PRIMARY KEY (board_id, user_id)
)

-- Listas / Columnas
lists (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id    uuid REFERENCES boards(id) ON DELETE CASCADE,
  title       text NOT NULL,
  color       text DEFAULT '#F5F3EE',
  position    integer NOT NULL,
  created_at  timestamptz DEFAULT now()
)

-- Cards / Tareas
cards (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id     uuid REFERENCES lists(id) ON DELETE CASCADE,
  title       text NOT NULL,
  description text,
  due_date    date,
  position    integer NOT NULL,
  created_by  uuid REFERENCES users(id),
  created_at  timestamptz DEFAULT now()
)

-- Asignados a una card
card_assignees (
  card_id     uuid REFERENCES cards(id) ON DELETE CASCADE,
  user_id     uuid REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (card_id, user_id)
)

-- Etiquetas
labels (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id    uuid REFERENCES boards(id) ON DELETE CASCADE,
  name        text NOT NULL,
  color       text NOT NULL
)

-- Etiquetas en cards
card_labels (
  card_id     uuid REFERENCES cards(id) ON DELETE CASCADE,
  label_id    uuid REFERENCES labels(id) ON DELETE CASCADE,
  PRIMARY KEY (card_id, label_id)
)

-- Checklist items
checklist_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id     uuid REFERENCES cards(id) ON DELETE CASCADE,
  text        text NOT NULL,
  completed   boolean DEFAULT false,
  position    integer NOT NULL
)

-- Actividad
activity_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id    uuid REFERENCES boards(id) ON DELETE CASCADE,
  user_id     uuid REFERENCES users(id),
  action      text NOT NULL,   -- 'card_moved', 'card_created', 'member_added', etc.
  metadata    jsonb,
  created_at  timestamptz DEFAULT now()
)
```

---

## 6. Plan de sprints

### Sprint 1 — Semanas 1–3: Base y autenticación

- Configuración del proyecto (Vite + React + TypeScript + Tailwind)
- Setup de Clerk (email/password + Google OAuth)
- Setup de Supabase (schema completo + RLS policies)
- Webhook Clerk → Supabase para sincronizar usuarios
- Design system base: tokens de color, tipografía, componentes básicos
- Layout principal: sidebar, navbar, área de contenido
- CRUD de boards (crear, editar, eliminar, listar)

### Sprint 2 — Semanas 4–7: Kanban core

- CRUD de listas (columnas) con colores y reordenamiento
- CRUD de cards con modal de detalle (título, descripción, fecha, etiquetas)
- Drag & Drop entre columnas y dentro de columnas (dnd-kit)
- Asignación de miembros a boards (invitación por email)
- Asignación de miembros a cards con avatares
- Sistema de etiquetas de color por board
- Progress bar en cards con checklist
- UI de tarjetas fiel al sistema de diseño (Soft UI)

### Sprint 3 — Semanas 8–10: Pulido y lanzamiento

- Filtros por miembro, etiqueta y fecha límite
- Búsqueda dentro del board
- Feed de actividad reciente
- Realtime con Supabase Channels (actualizaciones en vivo)
- Modo colapsado de columnas
- Onboarding para usuarios nuevos (board de ejemplo)
- QA, corrección de bugs, optimización de performance
- Deploy en Vercel + configuración de dominio

---

## 7. Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Complejidad del drag & drop en mobile | Alta | Alto | Probar con pointer sensor de dnd-kit en semana 1 antes de continuar |
| Sincronización Clerk ↔ Supabase de usuarios | Media | Alto | Implementar webhook robusto con retry lógic en Edge Function |
| Conflictos en realtime (múltiples editores) | Media | Medio | Optimistic UI + Supabase Realtime + última escritura gana |
| Performance con boards de 100+ cards | Baja | Medio | Virtualización con react-virtual, carga lazy por columna |
| Costos de Supabase al escalar | Baja | Bajo | Plan gratuito alcanza hasta ~500 MAU, monitorear dashboard |

---

## 8. Out of scope para el MVP

Los siguientes features quedan explícitamente fuera del alcance del MVP para mantener el foco:

- Aplicación mobile nativa (iOS / Android)
- Integraciones con terceros (Slack, GitHub, Jira)
- Vista de timeline / Gantt
- Reportes y analytics
- Permisos granulares por columna
- Automatizaciones (reglas tipo "si card llega a Done → notificar")
- Exportación a PDF o CSV

---

## Apéndice: Variables de entorno requeridas

```env
# Clerk
VITE_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# Supabase
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# Supabase (server-side / Edge Functions)
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

*KanFlow PRD v1.0 — Abril 2026 — Ready para desarrollo*