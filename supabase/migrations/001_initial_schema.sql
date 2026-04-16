-- ============================================================
-- KanFlow — Schema inicial
-- ============================================================

-- Usuarios (sincronizados desde Clerk via webhook)
CREATE TABLE IF NOT EXISTS users (
  id          uuid PRIMARY KEY,
  email       text UNIQUE NOT NULL,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz DEFAULT now()
);

-- Boards
CREATE TABLE IF NOT EXISTS boards (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  description text,
  cover_color text DEFAULT '#F5F3EE',
  owner_id    uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now()
);

-- Miembros de un board
CREATE TABLE IF NOT EXISTS board_members (
  board_id    uuid REFERENCES boards(id) ON DELETE CASCADE,
  user_id     uuid REFERENCES users(id) ON DELETE CASCADE,
  role        text DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  PRIMARY KEY (board_id, user_id)
);

-- Listas / Columnas
CREATE TABLE IF NOT EXISTS lists (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id    uuid REFERENCES boards(id) ON DELETE CASCADE,
  title       text NOT NULL,
  color       text DEFAULT '#F5F3EE',
  position    integer NOT NULL,
  created_at  timestamptz DEFAULT now()
);

-- Cards / Tareas
CREATE TABLE IF NOT EXISTS cards (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id     uuid REFERENCES lists(id) ON DELETE CASCADE,
  title       text NOT NULL,
  description text,
  due_date    date,
  position    integer NOT NULL,
  created_by  uuid REFERENCES users(id),
  created_at  timestamptz DEFAULT now()
);

-- Asignados a una card
CREATE TABLE IF NOT EXISTS card_assignees (
  card_id     uuid REFERENCES cards(id) ON DELETE CASCADE,
  user_id     uuid REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (card_id, user_id)
);

-- Etiquetas por board
CREATE TABLE IF NOT EXISTS labels (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id    uuid REFERENCES boards(id) ON DELETE CASCADE,
  name        text NOT NULL,
  color       text NOT NULL
);

-- Etiquetas en cards
CREATE TABLE IF NOT EXISTS card_labels (
  card_id     uuid REFERENCES cards(id) ON DELETE CASCADE,
  label_id    uuid REFERENCES labels(id) ON DELETE CASCADE,
  PRIMARY KEY (card_id, label_id)
);

-- Checklist items
CREATE TABLE IF NOT EXISTS checklist_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id     uuid REFERENCES cards(id) ON DELETE CASCADE,
  text        text NOT NULL,
  completed   boolean DEFAULT false,
  position    integer NOT NULL
);

-- Actividad del board
CREATE TABLE IF NOT EXISTS activity_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id    uuid REFERENCES boards(id) ON DELETE CASCADE,
  user_id     uuid REFERENCES users(id),
  action      text NOT NULL,
  metadata    jsonb,
  created_at  timestamptz DEFAULT now()
);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Boards: visible para miembros del board
CREATE POLICY "members can view boards"
  ON boards FOR SELECT
  USING (
    auth.uid() = owner_id OR
    EXISTS (
      SELECT 1 FROM board_members
      WHERE board_id = boards.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "owner can insert boards"
  ON boards FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "owner can update boards"
  ON boards FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "owner can delete boards"
  ON boards FOR DELETE
  USING (auth.uid() = owner_id);

-- Lists: accesible para miembros del board
CREATE POLICY "members can manage lists"
  ON lists FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM board_members
      WHERE board_id = lists.board_id AND user_id = auth.uid()
    )
  );

-- Cards: accesible para miembros del board via lista
CREATE POLICY "members can manage cards"
  ON cards FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM lists l
      JOIN board_members bm ON bm.board_id = l.board_id
      WHERE l.id = cards.list_id AND bm.user_id = auth.uid()
    )
  );

-- ============================================================
-- Índices
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_lists_board_id ON lists(board_id);
CREATE INDEX IF NOT EXISTS idx_cards_list_id ON cards(list_id);
CREATE INDEX IF NOT EXISTS idx_activity_board_id ON activity_log(board_id);
CREATE INDEX IF NOT EXISTS idx_board_members_user ON board_members(user_id);
