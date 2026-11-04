CREATE TABLE IF NOT EXISTS sessions (
 id TEXT PRIMARY KEY,
 profile_json TEXT NOT NULL,
 used INTEGER NOT NULL DEFAULT 0,
 reserved INTEGER NOT NULL DEFAULT 0,
 created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_created ON sessions(created_at);
CREATE TABLE IF NOT EXISTS daily_limits (
 day TEXT NOT NULL,
 ip_hash TEXT NOT NULL,
 starts INTEGER NOT NULL DEFAULT 0,
 PRIMARY KEY(day, ip_hash)
);
