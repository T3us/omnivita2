CREATE TABLE IF NOT EXISTS session_boards (
  id text PRIMARY KEY,
  name text NOT NULL,
  data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS session_boards_updated_at_idx ON session_boards (updated_at DESC);

CREATE TABLE IF NOT EXISTS custom_assets (
  id text PRIMARY KEY,
  name text NOT NULL,
  data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS custom_assets_updated_at_idx ON custom_assets (updated_at DESC);

CREATE TABLE IF NOT EXISTS tabletop_settings (
  id text PRIMARY KEY DEFAULT 'global',
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO tabletop_settings (id, data)
VALUES (
  'global',
  '{"metersPerCell":1.5,"autosaveDebounceMs":900,"backupReminder":"Antes de grandes atualizações, exporte um backup."}'::jsonb
)
ON CONFLICT (id) DO NOTHING;
