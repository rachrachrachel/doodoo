# Spec: Cards

## Descripción
Una card representa una tarea dentro de una lista. Tiene título, descripción, fecha límite, etiquetas, assignees y checklist.

## Comportamiento esperado

### Card en el tablero (vista compacta)
- Muestra: título, badges de etiquetas (máx 3), AvatarGroup de assignees (máx 3), fecha límite, ProgressBar si hay checklist
- Click → abre CardModal
- Hover → sombra más pronunciada (200ms)
- Draggable (ver spec drag-and-drop)

### CardModal (vista detalle)
- Título editable inline (click para editar)
- Descripción: textarea expandible
- Fecha límite: date picker, muestra "Vence hoy", "Vence en 2 días", "Vencida" según contexto
- Etiquetas: LabelPicker (multi-select)
- Assignees: AssigneePicker (multi-select de miembros del board)
- Checklist: lista de items con checkbox, input para agregar, drag para reordenar
- Botón eliminar (con confirmación)

### Crear card
- Botón "+" al fondo de cada columna
- Click → aparece input inline (no modal)
- Enter → crea card + limpia input
- Escape → cancela
- Position: al fondo de la lista (max position + 1)

### Drag & drop
- Ver `drag-and-drop.md`

## Casos borde
- Título vacío → no crear
- Due date pasada → mostrar en rojo
- Card sin assignees → no mostrar AvatarGroup
- Card sin checklist → no mostrar ProgressBar
- Más de 3 etiquetas → mostrar "+N más" tooltip

## Criterios de aceptación
- [ ] Modal abre en < 100ms
- [ ] Ediciones se guardan al blur (sin botón "Guardar")
- [ ] Checklist progress se actualiza en tiempo real
- [ ] Drag funciona en mobile (pointer events)
