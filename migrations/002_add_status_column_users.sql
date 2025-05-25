-- migrations/002_add_status_column_users.sql
-- Adiciona coluna de status para usuários

-- Criar tipo ENUM para status de usuário
DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Adicionar coluna status à tabela Users
ALTER TABLE Users 
ADD COLUMN IF NOT EXISTS status user_status DEFAULT 'active';

-- Atualizar usuários existentes para status 'active'
UPDATE Users SET status = 'active' WHERE status IS NULL;