CREATE TABLE IF NOT EXISTS kv_store (
  scope VARCHAR(64) NOT NULL,
  id VARCHAR(128) NOT NULL,
  payload CLOB NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (scope, id)
);

CREATE TABLE IF NOT EXISTS scoped_events (
  scope VARCHAR(64) NOT NULL,
  owner_id VARCHAR(128) NOT NULL,
  id VARCHAR(128) NOT NULL,
  payload CLOB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (scope, id)
);

CREATE INDEX IF NOT EXISTS idx_scoped_events_owner ON scoped_events(scope, owner_id, created_at DESC);
