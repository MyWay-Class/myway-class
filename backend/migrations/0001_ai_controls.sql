CREATE TABLE IF NOT EXISTS ai_daily_usage (
  usage_date TEXT NOT NULL,
  user_id TEXT NOT NULL,
  feature TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (usage_date, user_id, feature)
);

CREATE TABLE IF NOT EXISTS ai_total_usage (
  usage_date TEXT NOT NULL,
  user_id TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (usage_date, user_id)
);

CREATE TABLE IF NOT EXISTS ai_global_usage (
  usage_date TEXT NOT NULL,
  feature TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (usage_date, feature)
);

CREATE TABLE IF NOT EXISTS ai_rate_limits (
  bucket_key TEXT PRIMARY KEY,
  bucket_type TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
