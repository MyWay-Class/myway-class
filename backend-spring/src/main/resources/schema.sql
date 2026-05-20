CREATE TABLE IF NOT EXISTS kv_store (
  scope VARCHAR(64) NOT NULL,
  id VARCHAR(128) NOT NULL,
  payload TEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (scope, id)
);

CREATE TABLE IF NOT EXISTS scoped_events (
  scope VARCHAR(64) NOT NULL,
  owner_id VARCHAR(128) NOT NULL,
  id VARCHAR(128) NOT NULL,
  payload TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (scope, id)
);

CREATE INDEX IF NOT EXISTS idx_scoped_events_owner ON scoped_events(scope, owner_id, created_at DESC);

CREATE TABLE IF NOT EXISTS ai_usage_daily (
  user_id VARCHAR(128) NOT NULL,
  usage_day DATE NOT NULL,
  usage_count INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, usage_day)
);

CREATE TABLE IF NOT EXISTS ai_usage_log (
  id VARCHAR(128) NOT NULL,
  user_id VARCHAR(128) NOT NULL,
  feature VARCHAR(64) NOT NULL,
  success BOOLEAN NOT NULL,
  input_text TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_log_user_created ON ai_usage_log(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS activity_event (
  id VARCHAR(128) NOT NULL,
  user_id VARCHAR(128) NOT NULL,
  type VARCHAR(64) NOT NULL,
  resource_type VARCHAR(64) NULL,
  resource_id VARCHAR(128) NULL,
  metadata TEXT NULL,
  occurred_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_activity_event_user_time ON activity_event(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_event_user_type_time ON activity_event(user_id, type, occurred_at DESC);
