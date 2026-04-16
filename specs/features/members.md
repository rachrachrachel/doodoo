# Spec: Miembros

## Descripción
El owner puede invitar personas al board por email. Los miembros pueden ser asignados a cards.

## Flujo de invitación
1. Owner abre panel de miembros (botón en header del board)
2. Input de email → busca usuario en tabla `users`
3. Si existe → insertar en `board_members` con role `member`
4. Si no existe → mostrar error "Usuario no encontrado. Debe registrarse primero."
5. Notificación visual de éxito/error

## Asignación a cards
- En CardModal → sección "Asignados"
- Dropdown con lista de miembros del board
- Click en miembro → toggle asignación (INSERT/DELETE en `card_assignees`)
- AvatarGroup en la card muestra hasta 3 avatares, "+N" si hay más

## Roles
| Rol | Puede |
|---|---|
| `owner` | Todo: editar board, invitar, remover miembros, eliminar board |
| `member` | Crear/editar/mover cards, crear/editar listas |

## Casos borde
- Invitar a alguien que ya es miembro → mostrar error "Ya es miembro"
- Owner no puede ser removido del board
- Si el owner se va (edge case futuro) → transferir ownership al miembro más antiguo
- Board sin miembros extra → AssigneePicker solo muestra al owner
