# Spec: Drag & Drop

## Descripción
Cards se pueden mover entre columnas y reordenar dentro de la misma columna. Columnas también se pueden reordenar dentro del board.

## Librería
- `@dnd-kit/core` + `@dnd-kit/sortable`
- Sensor: `PointerSensor` (funciona en desktop y mobile)
- Animaciones: Framer Motion spring physics

## Comportamiento

### Mover una card
1. Usuario hace hold (200ms) sobre una card → activa drag
2. Card original se vuelve semitransparente (opacity 0.4)
3. Ghost card sigue el cursor (DragOverlay, opacity 0.9, rotate 2deg)
4. Al pasar por otra columna → placeholder visual aparece en la posición destino
5. Al soltar:
   - Misma columna, misma posición → no hace nada
   - Misma columna, distinta posición → actualiza `position` de cards afectadas
   - Distinta columna → actualiza `list_id` + `position`
6. Optimistic UI: la UI se actualiza inmediatamente, Supabase en background

### Reordenar columnas
- Hold sobre el header de la columna → drag de columna entera
- Placeholder entre columnas
- Actualiza `position` de todas las listas del board

## Animaciones
```
Spring config: { stiffness: 300, damping: 30 }
Card hover: scale 1.02, 100ms
DragOverlay: rotate 2deg, shadow amplificada
Drop animation: spring back 200ms
```

## Casos borde
- Drop fuera de cualquier columna → snap back
- Board con una sola columna → no se puede reordenar columnas
- Card arrastrada a columna colapsada → columna se expande automáticamente
- Scroll durante drag → funciona (dnd-kit maneja scroll automático)

## Persistencia
Después del drop, hacer `PATCH` a Supabase:
```sql
UPDATE cards SET list_id = $1, position = $2 WHERE id = $3
UPDATE lists SET position = $1 WHERE id = $2
```
Reordenar posiciones enteras del 0 en adelante (no floats).
