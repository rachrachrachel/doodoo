# Security Audit Report — DooDoo

**Date:** 2026-04-15  
**Auditor:** Claude Code (claude-sonnet-4-6)  
**Scope:** Full repository audit — source code, migrations, config files, environment files  
**Total issues found:** 29

---

## Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 2 |
| HIGH | 5 |
| MEDIUM | 8 |
| LOW | 7 |
| INFO (good practices) | 4 |

---

## Immediate Action Items

> Do these before anything else.

1. **HOY MISMO** — Revocar todas las claves expuestas en `.env.local`: Clerk, Supabase y Anthropic
2. **HOY MISMO** — Eliminar `.env.local` del historial de git con `git filter-repo` o `BFG Repo Cleaner`
3. **ESTA SEMANA** — Implementar políticas RLS para `board_members`, `labels`, `card_assignees`, `checklist_items`, `activity_log`
4. **ESTA SEMANA** — Añadir validación de input en todos los campos de texto del usuario
5. **ESTA SEMANA** — Configurar CORS y security headers
6. **PRÓXIMO SPRINT** — Rate limiting en todas las operaciones de API

---

## CRITICAL

### C1 — Secrets reales comprometidos en el repositorio

**Archivo:** `.env.local`  
**Impacto:** Acceso no autorizado a Clerk, Supabase y Anthropic API

El archivo `.env.local` contiene credenciales reales y fue rastreado por git:

```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...          ← clave secreta expuesta
VITE_SUPABASE_URL=https://rngfuxmltvqanopohlqa.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...  ← JWT completo expuesto
ANTHROPIC_API_KEY=sk-ant-api03-...    ← clave API expuesta
```

**Pasos para remediar:**

```bash
# 1. Revocar TODAS las claves en sus dashboards respectivos primero
# 2. Eliminar del historial
git filter-repo --path .env.local --invert-paths
# 3. Force push (coordinado con el equipo)
git push --force-with-lease
```

**Prevención futura:** `.env.local` ya está en `.gitignore` — verificar que nunca fue staged con `git check-ignore -v .env.local`.

---

### C2 — `.env.local` rastreado a pesar de estar en `.gitignore`

**Archivo:** `.gitignore`  
**Impacto:** Las reglas de `.gitignore` no aplican a archivos ya rastreados por git

Si el archivo fue añadido al repo antes de la regla de `.gitignore`, git seguirá rastreándolo.

**Fix:**

```bash
git rm --cached .env.local
git commit -m "stop tracking .env.local"
```

---

## HIGH

### H1 — Sin políticas RLS en tablas críticas

**Archivo:** `supabase/migrations/001_initial_schema.sql`  
**Impacto:** Escalada de privilegios — cualquier usuario autenticado puede leer/modificar datos de otros

Las siguientes tablas tienen RLS habilitado pero **ninguna policy definida**, lo que en Supabase significa acceso denegado por defecto para todos — pero deja la puerta abierta a errores si se cambia el comportamiento por defecto:

- `board_members`
- `labels`
- `card_assignees`
- `checklist_items`
- `activity_log`

**Fix recomendado:**

```sql
-- board_members: solo el dueño del board puede gestionar miembros
CREATE POLICY "owner can manage board_members"
  ON board_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = board_members.board_id
        AND boards.owner_id = auth.uid()
    )
  );

CREATE POLICY "members can view board_members"
  ON board_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM board_members bm
      WHERE bm.board_id = board_members.board_id
        AND bm.user_id = auth.uid()
    )
  );

-- activity_log: solo miembros del board pueden ver el log
CREATE POLICY "members can view board activity"
  ON activity_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = activity_log.board_id
        AND (
          boards.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM board_members
            WHERE board_id = boards.id AND user_id = auth.uid()
          )
        )
    )
  );
```

Aplicar políticas equivalentes para `labels`, `card_assignees` y `checklist_items`.

---

### H2 — Operaciones de board sin validación de ownership

**Archivo:** `src/stores/boardStore.ts` líneas 84–108  
**Impacto:** Con una llamada directa a la API, un usuario puede actualizar o eliminar boards ajenos

Las funciones `updateBoard` y `deleteBoard` no verifican que el usuario sea el dueño antes de ejecutar.

**Fix:** Agregar una política RLS de UPDATE/DELETE en la tabla `boards`:

```sql
CREATE POLICY "only owner can update board"
  ON boards FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "only owner can delete board"
  ON boards FOR DELETE
  USING (owner_id = auth.uid());
```

---

### H3 — Input de email no validado en invitaciones

**Archivo:** `src/stores/memberStore.ts` líneas 12–40  
**Impacto:** Queries malformadas, posible enumeración de usuarios

El email se pasa directamente a la query sin validación de formato ni normalización.

**Fix:**

```typescript
inviteMember: async (boardId, email) => {
  const normalized = email.toLowerCase().trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new Error('Formato de email inválido')
  }
  // usar normalized en la query
}
```

---

### H4 — `as any` oculta errores de tipo y posibles vulnerabilidades

**Archivos:**
- `src/stores/boardStore.ts` líneas 62–78
- `src/stores/activityStore.ts` línea 57
- `src/components/lists/KanbanColumn.tsx` línea 54

**Impacto:** Los casteos `as any` desactivan las verificaciones de TypeScript, permitiendo que datos malformados lleguen a la base de datos sin ser validados.

**Fix:** Definir interfaces explícitas para las respuestas de Supabase en lugar de castear a `any`.

---

### H5 — Integración Clerk→Supabase sin manejo de errores

**Archivo:** `src/App.tsx` líneas 10–28  
**Impacto:** Si el upsert de usuario falla silenciosamente, el usuario puede operar sin estar correctamente registrado en Supabase

**Fix:**

```typescript
useEffect(() => {
  if (!isSignedIn || !user) return
  getToken()
    .then(token => {
      if (!token) throw new Error('No token')
      return supabase.from('users').upsert({ ... })
    })
    .catch(err => {
      console.error('Auth sync failed:', err)
      signOut() // forzar re-autenticación
    })
}, [isSignedIn, user?.id])
```

---

## MEDIUM

### M1 — Mensajes de error del sistema expuestos al usuario

**Archivos:** `src/stores/cardStore.ts`, `src/stores/memberStore.ts`  
**Impacto:** Los mensajes de error de Supabase pueden revelar nombres de tablas, columnas o estructura interna

**Fix:**

```typescript
// Antes:
throw new Error(error.message)

// Después:
console.error('[internal]', error.message)
throw new Error('No se pudo completar la operación. Intenta de nuevo.')
```

---

### M2 — Sin rate limiting en operaciones de API

**Impacto:** DoS mediante creación masiva de tarjetas, invitaciones, etc.

**Fix:** Añadir debouncing del lado del cliente y, a largo plazo, rate limiting en Supabase Edge Functions.

---

### M3 — Subscripciones Realtime sin filtro por permisos

**Archivo:** `src/hooks/useRealtimeBoard.ts` líneas 26–84  
**Impacto:** Cambios de boards a los que el usuario no tiene acceso podrían llegar por el canal realtime

**Fix:** Filtrar subscripciones por los IDs de boards a los que el usuario pertenece.

---

### M4 — Sin CORS ni security headers en Vite

**Archivo:** `vite.config.ts`  
**Impacto:** Ausencia de protección contra clickjacking y MIME sniffing en desarrollo

**Fix:**

```typescript
export default defineConfig({
  server: {
    headers: {
      'X-Frame-Options': 'SAMEORIGIN',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  },
})
```

---

### M5 — Color de label sin validación

**Archivo:** `src/stores/labelStore.ts` línea 23  
**Impacto:** Se puede almacenar cualquier string como color; riesgo de CSS injection si se aplica sin sanitizar

**Fix:**

```typescript
const validateColor = (color: string): string => {
  if (!/^#[0-9A-F]{6}$/i.test(color)) throw new Error('Color inválido')
  return color
}
```

---

### M6 — Sin validación de longitud en campos de texto

**Archivos:** `src/pages/BoardPage.tsx`, `src/components/cards/CardModal.tsx`  
**Impacto:** Strings de longitud arbitraria pueden llegar a la base de datos

**Fix:** Validar longitud máxima (ej. 255 chars para títulos, 10 000 para descripciones) antes de enviar.

---

### M7 — Sin verificación de membresía en operaciones de cards

**Archivo:** `src/stores/cardStore.ts`  
**Impacto:** Un usuario podría crear/editar cards en boards a los que no pertenece si no hay RLS

**Fix:** Asegurar que las políticas RLS de `cards` verifiquen membresía en `board_members`.

---

### M8 — Sin meta tags de seguridad en HTML

**Archivo:** `index.html`  
**Fix:**

```html
<meta name="referrer" content="strict-origin-when-cross-origin" />
<meta http-equiv="permissions-policy" content="camera=(), microphone=(), geolocation=()" />
```

---

## LOW

### L1 — `console.error` con mensajes técnicos en producción

**Archivos:** `src/components/cards/AssigneePicker.tsx`, `src/components/members/BoardMembersPanel.tsx`

Mensajes de error técnicos visibles en la consola del navegador en producción.

**Fix:** Usar un logger que desactive logs en producción, o sanitizar mensajes antes de mostrarlos.

---

### L2 — Mensajes de UI revelan existencia de usuarios

**Archivo:** `src/components/members/BoardMembersPanel.tsx` líneas 160, 168  
**Impacto:** "Usuario no encontrado" / "Ya es miembro" permite enumerar si un email existe

**Fix:** Usar mensajes genéricos como "No se pudo completar la invitación."

---

### L3 — Sin verificación previa de existencia del usuario invitado

**Archivo:** `src/stores/memberStore.ts`  
**Impacto:** Se puede invitar emails inexistentes sin validación en el sistema de auth

---

### L4 — Dependencias no auditadas

**Archivo:** `package.json`  
**Issue:** `@anthropic-ai/claude-agent-sdk` usa `latest` (versión no fijada)

**Fix:**

```bash
npm audit
npm audit fix
# Fijar versiones exactas de dependencias críticas
```

---

### L5 — Sin log de actividad para operaciones destructivas

Eliminación de boards y remoción de miembros no quedan registradas en `activity_log`.

---

### L6 — Sin política de almacenamiento en localStorage

No se detectó uso de localStorage con datos sensibles, pero tampoco existe una política documentada.

---

### L7 — Sin gestión de sesión expirada

Si el token de Clerk expira durante una sesión activa, las operaciones fallan silenciosamente sin redirigir al login.

---

## INFO — Buenas prácticas detectadas

| # | Práctica |
|---|----------|
| I1 | `"strict": true` en `tsconfig.json` — activo y correcto |
| I2 | Sin uso de `dangerouslySetInnerHTML` en ningún componente |
| I3 | Sin uso de `eval()` ni `Function()` constructor |
| I4 | Uso de variables de entorno para configuración — no hardcoded en código fuente |

---

## Notas finales

Este proyecto tiene una base sólida (TypeScript strict, sin patrones XSS obvios, uso de Supabase RLS). Los problemas más críticos son la exposición de secretos en `.env.local` y la ausencia de políticas RLS completas. Resolverlos debería ser la prioridad número uno antes de cualquier despliegue a producción.

---

*Generado por Claude Code — claude-sonnet-4-6*
