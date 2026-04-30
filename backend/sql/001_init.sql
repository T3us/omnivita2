CREATE TABLE IF NOT EXISTS schema_migrations (
  filename text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY,
  email text NOT NULL UNIQUE,
  username text NOT NULL UNIQUE,
  role text NOT NULL CHECK (role IN ('master', 'player')),
  password_hash text NULL,
  must_reset_password boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS characters (
  id text PRIMARY KEY,
  owner_user_id uuid UNIQUE NULL REFERENCES users(id) ON DELETE SET NULL,
  name text NOT NULL,
  age text NULL,
  character_class text NOT NULL,
  level integer NOT NULL,
  status text NOT NULL DEFAULT '',
  profile_image_url text NOT NULL DEFAULT '',
  sheet jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS combat_state (
  id text PRIMARY KEY DEFAULT 'global',
  state jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO combat_state (id, state)
VALUES (
  'global',
  '{"active":false,"round":1,"currentInstanceId":"","updatedAt":"","combatants":[]}'::jsonb
)
ON CONFLICT (id) DO NOTHING;
