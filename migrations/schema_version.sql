-- migrations/schema_version.sql
-- Tabela para controlar versões das migrações

CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(255) PRIMARY KEY,
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  description TEXT,
  checksum VARCHAR(255)
);