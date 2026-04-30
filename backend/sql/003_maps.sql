CREATE TABLE IF NOT EXISTS maps (
  id text PRIMARY KEY,
  name text NOT NULL,
  data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS maps_updated_at_idx ON maps (updated_at DESC);
