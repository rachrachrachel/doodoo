# Spec: Boards

## Descripción
Un board es el espacio de trabajo principal. Contiene listas (columnas) y cards (tareas). Cada board tiene un owner y puede tener múltiples miembros.

## Comportamiento esperado

### Listar boards
- El usuario ve solo los boards donde es owner o miembro
- Orden: más reciente primero
- Vista grid con `cover_color` como fondo de la tarjeta
- Estado vacío: mensaje + CTA para crear el primero

### Crear board
- Campos: título (requerido), descripción (opcional), color de fondo (selector de paleta)
- Al crear, se inserta en `boards` y en `board_members` con role `owner`
- Redirige automáticamente al board recién creado

### Editar board
- Accesible desde el board (botón de settings en header)
- Solo el owner puede editar
- Campos editables: título, descripción, cover_color

### Eliminar board
- Solo el owner puede eliminar
- Confirmación requerida ("Escribe el nombre del board para confirmar")
- Cascade: elimina listas, cards, miembros, etiquetas y actividad

## Casos borde
- Nombre vacío → no permitir submit
- Board sin listas → mostrar mensaje + botón "Agregar columna"
- Usuario removido del board → redirigir a /boards con mensaje de error

## Criterios de aceptación
- [ ] Crear board en < 5 segundos
- [ ] Grid responsive: 1 col (mobile), 2 col (tablet), 4 col (desktop)
- [ ] Cover color persiste después de reload
- [ ] Solo owner ve botones de editar/eliminar
