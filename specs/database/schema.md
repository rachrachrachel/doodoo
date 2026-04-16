# Database Schema — KanFlow

## Stack
- PostgreSQL 17 via Supabase
- Row Level Security (RLS) activo en todas las tablas
- Realtime habilitado en: `cards`, `lists`, `board_members`

## Tablas

### `users`
Sincronizados desde Clerk via webhook. El `id` es el `clerk_user_id`.
```sql
id          uuid PRIMARY KEY       -- = clerk_user_id
email       text UNIQUE NOT NULL
full_name   text
avatar_url  text
created_at  timestamptz DEFAULT now()
```
**RLS:** SELECT público, UPDATE solo propio, INSERT via service role (webhook).

---

### `boards`
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
title       text NOT NULL
description text
cover_color text DEFAULT '#F5F3EE'
owner_id    uuid REFERENCES users(id) ON DELETE CASCADE
created_at  timestamptz DEFAULT now()
```
**RLS:** visible para owner y miembros. CRUD solo para owner.

---

### `board_members`
```sql
board_id    uuid REFERENCES boards(id) ON DELETE CASCADE
user_id     uuid REFERENCES users(id) ON DELETE CASCADE
role        text DEFAULT 'member' CHECK (role IN ('owner', 'member'))
PRIMARY KEY (board_id, user_id)
```

---

### `lists`
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
board_id    uuid REFERENCES boards(id) ON DELETE CASCADE
title       text NOT NULL
color       text DEFAULT '#F5F3EE'
position    integer NOT NULL
created_at  timestamptz DEFAULT now()
```
**Posiciones:** enteros desde 0. Al reordenar, recalcular todas las posiciones.

---

### `cards`
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
list_id     uuid REFERENCES lists(id) ON DELETE CASCADE
title       text NOT NULL
description text
due_date    date
position    integer NOT NULL
created_by  uuid REFERENCES users(id)
created_at  timestamptz DEFAULT now()
```

---

### `card_assignees`
```sql
card_id     uuid REFERENCES cards(id) ON DELETE CASCADE
user_id     uuid REFERENCES users(id) ON DELETE CASCADE
PRIMARY KEY (card_id, user_id)
```

---

### `labels`
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
board_id    uuid REFERENCES boards(id) ON DELETE CASCADE
name        text NOT NULL
color       text NOT NULL   -- hex color
```

---

### `card_labels`
```sql
card_id     uuid REFERENCES cards(id) ON DELETE CASCADE
label_id    uuid REFERENCES labels(id) ON DELETE CASCADE
PRIMARY KEY (card_id, label_id)
```

---

### `checklist_items`
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
card_id     uuid REFERENCES cards(id) ON DELETE CASCADE
text        text NOT NULL
completed   boolean DEFAULT false
position    integer NOT NULL
```

---

### `activity_log`
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
board_id    uuid REFERENCES boards(id) ON DELETE CASCADE
user_id     uuid REFERENCES users(id)
action      text NOT NULL   -- 'card_moved' | 'card_created' | 'member_added' | ...
metadata    jsonb           -- { cardTitle, fromList, toList, memberName, etc. }
created_at  timestamptz DEFAULT now()
```

## Índices
```sql
idx_lists_board_id      ON lists(board_id)
idx_cards_list_id       ON cards(list_id)
idx_activity_board_id   ON activity_log(board_id)
idx_board_members_user  ON board_members(user_id)
```

## Queries frecuentes

### Board completo con listas y cards
```sql
SELECT b.*, 
  json_agg(l.* ORDER BY l.position) as lists
FROM boards b
LEFT JOIN lists l ON l.board_id = b.id
WHERE b.id = $1
GROUP BY b.id
```

### Cards de una lista con relaciones
```sql
SELECT c.*,
  json_agg(DISTINCT ca.user_id) as assignee_ids,
  json_agg(DISTINCT cl.label_id) as label_ids,
  COUNT(ci.id) as checklist_total,
  COUNT(ci.id) FILTER (WHERE ci.completed) as checklist_done
FROM cards c
LEFT JOIN card_assignees ca ON ca.card_id = c.id
LEFT JOIN card_labels cl ON cl.card_id = c.id
LEFT JOIN checklist_items ci ON ci.card_id = c.id
WHERE c.list_id = $1
GROUP BY c.id
ORDER BY c.position
```
