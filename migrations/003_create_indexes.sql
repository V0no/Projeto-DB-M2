-- migrations/003_create_indexes.sql
-- Criação de índices para otimização

-- Índices para otimização de consultas
CREATE INDEX IF NOT EXISTS idx_bookings_room_time ON Bookings(room_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON Bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_start_time ON Bookings(start_time);
CREATE INDEX IF NOT EXISTS idx_users_email ON Users(email);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON Rooms(status);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON Bookings(status);