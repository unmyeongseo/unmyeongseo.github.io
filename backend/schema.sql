CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY NOT NULL,
  free_used INTEGER NOT NULL DEFAULT 0 CHECK(free_used IN (0,1)),
  status TEXT NOT NULL DEFAULT 'ready' CHECK(status IN ('ready','processing','finished')),
  created_at INTEGER NOT NULL,
  question TEXT,
  answer TEXT
);
CREATE INDEX IF NOT EXISTS idx_sessions_created ON sessions(created_at);
CREATE TABLE IF NOT EXISTS entitlements (
  id TEXT PRIMARY KEY NOT NULL,
  session_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  credit_total INTEGER NOT NULL DEFAULT 0,
  credit_used INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  provider_ref TEXT UNIQUE,
  created_at INTEGER NOT NULL,
  FOREIGN KEY(session_id) REFERENCES sessions(id)
);
CREATE INDEX IF NOT EXISTS idx_entitlements_session ON entitlements(session_id);
-- Planned product identifiers (no prices defined):
-- consultation_extra, reading_full, reading_money, reading_career,
-- reading_love, reading_family, reading_monthly, reading_pastlife.
