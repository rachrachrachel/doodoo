/**
 * KanFlow Orchestrator
 * Agente Opus que lee el PRD y el estado actual del proyecto,
 * y spawna sub-agentes para construir cada feature del MVP.
 *
 * Uso: npx tsx orchestrator.ts
 */

import { query } from '@anthropic-ai/claude-agent-sdk'

const CWD = process.cwd()

const ORCHESTRATOR_PROMPT = `
Eres el arquitecto principal de KanFlow — una app Kanban con Soft UI construida con React 18, Vite, TypeScript, Tailwind, Zustand, Clerk y Supabase.

Tu trabajo es:
1. Leer el PRD en prd.md para entender los requerimientos completos
2. Auditar el estado actual del proyecto (qué archivos existen, qué está incompleto)
3. Decidir qué features construir y en qué orden (respeta el orden de sprints del PRD)
4. Delegar cada feature a un sub-agente especializado usando la herramienta Agent
5. Verificar que cada feature funcione antes de pasar al siguiente
6. Reportar el progreso al terminar cada tarea

Reglas que DEBES seguir:
- Usa la herramienta Agent para delegar trabajo concreto de implementación
- No implementes código tú mismo — delega a sub-agentes
- Antes de delegar, lee el estado actual del código para dar contexto preciso al sub-agente
- Verifica cada resultado: lee los archivos que el sub-agente creó/modificó
- Si un sub-agente falla, inténtalo de nuevo con instrucciones más específicas
- Sigue el orden de sprints: Sprint 1 → Sprint 2 → Sprint 3
- Prioriza Must Have sobre Should Have

Sub-agentes disponibles:
- "setup-agent": Configuración base, configs, design tokens
- "auth-agent": Integración de Clerk, rutas protegidas, sync con Supabase
- "db-agent": Schema SQL, RLS policies, tipos TypeScript, cliente Supabase
- "boards-agent": CRUD de boards, BoardsPage, boardStore conectado a Supabase
- "lists-agent": CRUD de columnas con colores, reordenamiento, KanbanColumn component
- "cards-agent": CRUD de cards, CardModal con todos los campos, cardStore conectado a Supabase
- "dnd-agent": Drag & Drop con dnd-kit, animaciones Framer Motion, actualización de posición en DB
- "members-agent": Invitación de miembros por email, asignación a cards con AvatarGroup
- "labels-agent": Sistema de etiquetas por board, badge en cards
- "checklist-agent": Checklist items en cards, ProgressBar
- "filters-agent": Filtros por miembro/etiqueta/fecha, búsqueda global
- "realtime-agent": Supabase Realtime Channels para sincronización en vivo
- "activity-agent": Feed de actividad, activity_log, panel lateral

Ya están completados: Fix TypeScript, Lists CRUD (KanbanColumn, AddListButton), Cards CRUD (KanbanCard, CardModal).
Empieza directamente desde **Drag & Drop** (dnd-agent) y continúa con el resto en orden.
`

async function runOrchestrator() {
  console.log('🚀 KanFlow Orchestrator iniciando...\n')

  for await (const message of query({
    prompt: ORCHESTRATOR_PROMPT,
    options: {
      model: 'claude-sonnet-4-6',
      cwd: CWD,
      allowedTools: ['Read', 'Glob', 'Grep', 'Bash', 'Agent'],
      permissionMode: 'acceptEdits',
      maxTurns: 100,
      agents: {
        'setup-agent': {
          description: 'Configura el proyecto base: vite.config, tailwind tokens, index.html, postcss, tsconfig. Verifica que npm run dev funcione.',
          prompt: `Eres un experto en configuración de proyectos React + Vite + TypeScript + Tailwind.
Tu tarea es verificar y completar la configuración base del proyecto KanFlow.

Verifica y corrige:
1. package.json — todas las dependencias del PRD están presentes con versiones correctas
2. vite.config.ts — plugin React, path alias @/ configurado
3. tailwind.config.ts — colores (#F2E840, #D4B8F0, #F0B8D0, #F5F3EE), fuentes Syne/DM Sans, borderRadius card, boxShadow card
4. tsconfig.json — strict mode, paths configurados
5. postcss.config.js — tailwindcss + autoprefixer
6. index.html — Google Fonts con Syne 800 y DM Sans 400/500
7. src/styles/tokens.css — CSS custom properties y @tailwind directives

Si algo falta o está mal, corrígelo. Al final confirma qué archivos revisaste/modificaste.`,
          tools: ['Read', 'Write', 'Edit', 'Glob', 'Bash'],
        },

        'auth-agent': {
          description: 'Integra Clerk: ClerkProvider, rutas protegidas, hook useAuth, webhook para sincronizar usuarios con Supabase.',
          prompt: `Eres un experto en autenticación con Clerk y Supabase.
Stack: React 18 + TypeScript + Clerk + Supabase.

Tu tarea para KanFlow:
1. Verifica src/main.tsx — ClerkProvider con VITE_CLERK_PUBLISHABLE_KEY
2. Verifica src/App.tsx — rutas protegidas con SignedIn/SignedOut/RedirectToSignIn
3. Verifica src/hooks/useAuth.ts — wrapper de useUser y useAuth de Clerk que retorna perfil tipado
4. Crea supabase/functions/sync-user/index.ts — Edge Function que recibe webhook de Clerk (user.created, user.updated, user.deleted) y sincroniza en tabla users de Supabase
   - Verifica la firma del webhook con CLERK_WEBHOOK_SECRET
   - Maneja los eventos correctamente
   - Retorna 200 en éxito
5. Crea src/components/auth/ con SignInPage y SignUpPage si no existen

Usa TypeScript estricto. Implementa todo lo que falte.`,
          tools: ['Read', 'Write', 'Edit', 'Glob'],
        },

        'db-agent': {
          description: 'Schema SQL completo, RLS policies, tipos TypeScript del dominio, cliente Supabase tipado.',
          prompt: `Eres un experto en Supabase (PostgreSQL) y TypeScript.
Stack: Supabase + TypeScript.

Tu tarea para KanFlow:
1. Verifica supabase/migrations/001_initial_schema.sql — todas las tablas del PRD con FK, índices y RLS policies
2. Verifica src/types/database.ts — tipos TypeScript generados del schema (Row, Insert, Update por tabla)
3. Verifica src/types/index.ts — tipos de dominio extendidos con relaciones (CardWithRelations, ListWithCards, BoardWithLists)
4. Verifica src/lib/supabase.ts — cliente Supabase tipado con Database
5. Agrega función helper src/lib/supabase.ts para actualizar el JWT de Clerk en el cliente Supabase:
   - Hook o helper que llama supabase.auth.setSession() con el token de Clerk

Completa cualquier cosa que falte.`,
          tools: ['Read', 'Write', 'Edit', 'Glob'],
        },

        'boards-agent': {
          description: 'CRUD completo de boards: BoardsPage con grid, modal crear/editar, boardStore conectado a Supabase.',
          prompt: `Eres un experto en React + TypeScript + Zustand + Supabase.
Stack: React 18 + TypeScript + Tailwind + Zustand + Supabase SDK.

Tu tarea para KanFlow — feature: Boards:
1. Verifica/completa src/stores/boardStore.ts — fetchBoards, fetchBoard, createBoard, updateBoard, deleteBoard conectados a Supabase real
2. Verifica/completa src/hooks/useBoard.ts — hooks useBoards y useBoard
3. Implementa src/components/boards/BoardCard.tsx — card visual de un board con cover_color, título, descripción, acciones (editar/eliminar)
4. Implementa src/components/boards/BoardModal.tsx — modal para crear/editar board (título, descripción, selector de color)
5. Completa src/pages/BoardsPage.tsx — grid de boards con BoardCard, botón crear, BoardModal, estado vacío

Diseño: Soft UI, border-radius 16px, sombra suave, paleta del PRD. Usa los componentes de src/components/ui/.
TypeScript estricto. Sin any.`,
          tools: ['Read', 'Write', 'Edit', 'Glob'],
        },

        'lists-agent': {
          description: 'CRUD de columnas Kanban con colores, header editable, contador, botón + agregar card, modo colapsado.',
          prompt: `Eres un experto en React + TypeScript + Tailwind.

Tu tarea para KanFlow — feature: Listas/Columnas:
1. Crea src/stores/listStore.ts — fetchLists, createList, updateList, deleteList, reorderLists (Zustand + Supabase)
2. Crea src/components/lists/KanbanColumn.tsx — columna con:
   - Header editable (click para editar título)
   - Color de acento en el borde superior (desde list.color)
   - Contador de cards "3 cards"
   - Botón "+" para agregar card al fondo
   - Botón para colapsar (usa uiStore.toggleListCollapse)
   - Modo colapsado: solo header vertical
3. Crea src/components/lists/AddListButton.tsx — botón al final del board para agregar nueva columna
4. Actualiza src/pages/BoardPage.tsx — usa KanbanColumn para cada lista, AddListButton al final

Usa Framer Motion para la animación de colapsar. Diseño Soft UI consistente.`,
          tools: ['Read', 'Write', 'Edit', 'Glob'],
        },

        'cards-agent': {
          description: 'CRUD de cards: KanbanCard component, CardModal con todos los campos, cardStore conectado a Supabase.',
          prompt: `Eres un experto en React + TypeScript + Tailwind + Zustand.

Tu tarea para KanFlow — feature: Cards/Tareas:
1. Verifica/completa src/stores/cardStore.ts — createCard, updateCard, deleteCard conectados a Supabase
2. Crea src/components/cards/KanbanCard.tsx:
   - Título
   - Badges de etiquetas (máx 3 visibles)
   - AvatarGroup de assignees (máx 3)
   - Fecha límite formateada con icono
   - ProgressBar si hay checklist_items
   - Hover con sombra más pronunciada
3. Crea src/components/cards/CardModal.tsx — modal de detalle:
   - Edición de título (inline)
   - Edición de descripción (textarea)
   - Selector de fecha límite
   - Sección de asignados
   - Sección de etiquetas
   - Sección de checklist
   - Botón eliminar card
4. Actualiza KanbanColumn para mostrar KanbanCard y botón para agregar card

Diseño Soft UI. Usa Framer Motion para la animación del modal (overlay + slide up).`,
          tools: ['Read', 'Write', 'Edit', 'Glob'],
        },

        'dnd-agent': {
          description: 'Drag & Drop con dnd-kit: mover cards entre columnas y dentro de ellas, reordenar columnas, animación spring.',
          prompt: `Eres un experto en dnd-kit, Framer Motion y React.

Tu tarea para KanFlow — feature: Drag & Drop:
1. Crea src/components/boards/KanbanBoard.tsx — wrapper con DndContext:
   - DragOverlay para el ghost card mientras se arrastra
   - Sensors: PointerSensor (funciona en mobile y desktop)
   - onDragEnd: detecta si cambió de columna o de posición, llama cardStore.moveCard
   - Anulación si se suelta en el mismo lugar
2. Actualiza KanbanColumn para usar SortableContext con items de cards
3. Actualiza KanbanCard para usar useSortable
4. Usa Framer Motion spring physics para las transiciones de posición
5. Actualiza BoardPage para usar KanbanBoard en lugar del layout estático

Configuración recomendada:
- strategy: verticalListSortingStrategy para cards
- Transition spring: stiffness: 300, damping: 30
- DragOverlay con opacity 0.8 y rotate-1`,
          tools: ['Read', 'Write', 'Edit', 'Glob'],
        },

        'members-agent': {
          description: 'Invitación de miembros al board por email, asignación a cards con avatares en overlap.',
          prompt: `Eres un experto en React + TypeScript + Supabase.

Tu tarea para KanFlow — feature: Miembros:
1. Crea src/components/boards/MembersPanel.tsx:
   - Input de email para invitar
   - Lista de miembros actuales con rol y opción de remover
   - Llama a Supabase para insertar en board_members
2. Crea src/components/cards/AssigneePicker.tsx:
   - Dropdown con miembros del board
   - Click para asignar/desasignar
   - Muestra AvatarGroup de asignados actuales
3. Integra AssigneePicker en CardModal
4. Integra MembersPanel en BoardPage (botón "Miembros" en header)
5. Actualiza boardStore para fetchBoardMembers

TypeScript estricto. Maneja el caso de invitar a alguien que ya es miembro.`,
          tools: ['Read', 'Write', 'Edit', 'Glob'],
        },

        'labels-agent': {
          description: 'Sistema de etiquetas por board con paleta de colores, badge en cards, selector en CardModal.',
          prompt: `Eres un experto en React + TypeScript + Supabase.

Tu tarea para KanFlow — feature: Etiquetas:
1. Crea src/stores/labelStore.ts — fetchLabels, createLabel, updateLabel, deleteLabel, assignLabelToCard, removeLabelFromCard
2. Crea src/components/labels/LabelManager.tsx:
   - CRUD de etiquetas con selector de color (paleta de 8 colores predefinidos)
   - Lista de etiquetas del board
3. Crea src/components/labels/LabelPicker.tsx:
   - Dropdown para seleccionar etiquetas en una card
   - Muestra etiquetas ya asignadas con tick
4. Integra LabelPicker en CardModal
5. Verifica que KanbanCard muestre los badges de etiquetas correctamente

Colores predefinidos: #F2E840, #D4B8F0, #F0B8D0, #86EFAC, #93C5FD, #FCA5A5, #FCD34D, #A5F3FC`,
          tools: ['Read', 'Write', 'Edit', 'Glob'],
        },

        'checklist-agent': {
          description: 'Checklist items en cards con CRUD, ProgressBar animada, persistencia en Supabase.',
          prompt: `Eres un experto en React + TypeScript + Supabase.

Tu tarea para KanFlow — feature: Checklist:
1. Crea src/stores/checklistStore.ts — fetchItems, createItem, updateItem (completado), deleteItem, reorderItems
2. Crea src/components/cards/ChecklistSection.tsx:
   - Lista de items con checkbox
   - Input para agregar nuevo item
   - Click en item para marcar como completado (tachado + opacity)
   - Botón eliminar item
   - ProgressBar encima del listado (usa componente de src/components/ui/Card.tsx)
3. Integra ChecklistSection en CardModal
4. Verifica que KanbanCard muestre ProgressBar cuando hay checklist_items

Animación en checkbox: 150ms ease-out. Framer Motion para el tachado del texto.`,
          tools: ['Read', 'Write', 'Edit', 'Glob'],
        },

        'filters-agent': {
          description: 'Filtros por miembro/etiqueta/fecha y búsqueda global en el board.',
          prompt: `Eres un experto en React + TypeScript + Zustand.

Tu tarea para KanFlow — feature: Filtros y Búsqueda:
1. Amplía uiStore con: activeFilters { memberIds: string[], labelIds: string[], hasDueDate: boolean }, searchQuery: string
2. Crea src/components/boards/FilterToolbar.tsx:
   - Input de búsqueda (filtra por título y descripción)
   - Dropdown de miembros (multi-select con avatares)
   - Dropdown de etiquetas (multi-select con badges)
   - Toggle "Solo con fecha límite"
   - Botón "Limpiar filtros"
3. Implementa lógica de filtrado: las cards se filtran visualmente (no se ocultan columnas)
   - Crea hook useFilteredCards(listId) que aplica los filtros del uiStore
4. Integra FilterToolbar en BoardPage (debajo del header del board)
5. Actualiza KanbanColumn para usar useFilteredCards

El filtrado debe ser en memoria (no re-queries a Supabase).`,
          tools: ['Read', 'Write', 'Edit', 'Glob'],
        },

        'realtime-agent': {
          description: 'Supabase Realtime Channels para sincronización en vivo de cards, listas y miembros.',
          prompt: `Eres un experto en Supabase Realtime y React.

Tu tarea para KanFlow — feature: Realtime:
1. Crea src/hooks/useRealtimeBoard.ts:
   - Suscribe al canal "board:{boardId}" con Supabase Realtime
   - Escucha cambios en: cards (INSERT, UPDATE, DELETE), lists (INSERT, UPDATE, DELETE), board_members (INSERT, DELETE)
   - En cada evento: actualiza el store correspondiente (cardStore, listStore, boardStore)
   - Cleanup en unmount (supabase.removeChannel)
2. Estrategia de conflictos: última escritura gana (replace en store)
3. Optimistic UI: las acciones locales se reflejan inmediatamente, el realtime confirma
4. Integra useRealtimeBoard en BoardPage

Considera el caso donde el usuario que hizo el cambio no debe procesar su propio evento (usa filter en el canal si es posible).`,
          tools: ['Read', 'Write', 'Edit', 'Glob'],
        },

        'activity-agent': {
          description: 'Feed de actividad reciente del board con activity_log, fechas relativas, panel lateral.',
          prompt: `Eres un experto en React + TypeScript + Supabase.

Tu tarea para KanFlow — feature: Actividad:
1. Crea src/hooks/useActivity.ts — fetch de activity_log del board (últimas 50 acciones)
2. Crea src/components/boards/ActivityFeed.tsx:
   - Lista de eventos con avatar del usuario, acción y tiempo relativo ("hace 2 min")
   - Tipos de acción: card_created, card_moved, card_assigned, member_added, etc.
   - Formato legible: "Juan movió 'Fix bug' a Done"
   - Scroll infinito o "ver más"
3. Crea src/utils/activityLogger.ts — helper para insertar en activity_log desde los stores:
   - logCardMoved(boardId, userId, cardTitle, fromList, toList)
   - logCardCreated(boardId, userId, cardTitle)
   - logMemberAdded(boardId, userId, memberName)
4. Integra ActivityFeed como panel lateral en BoardPage (toggle con botón)
5. Llama a activityLogger en las acciones de cardStore y boardStore

Fechas relativas con Intl.RelativeTimeFormat (sin dependencias extra).`,
          tools: ['Read', 'Write', 'Edit', 'Glob'],
        },
      },
    },
  })) {
    if ('result' in message) {
      console.log('\n✅ Orquestador terminó:\n')
      console.log(message.result)
    } else if (message.type === 'assistant') {
      const text = message.message?.content
        ?.filter((b: { type: string }) => b.type === 'text')
        .map((b: { type: string; text?: string }) => (b as { type: string; text: string }).text)
        .join('')
      if (text) process.stdout.write(text)
    } else if (message.type === 'system' && message.subtype === 'init') {
      console.log(`📋 Sesión: ${message.session_id}\n`)
    }
  }
}

runOrchestrator().catch(console.error)
