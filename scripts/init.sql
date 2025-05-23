-- sample_data.sql - Script para inserir dados de exemplo no sistema de reserva de salas

-- Limpando dados existentes (opcional - remova estas linhas se quiser preservar dados)
TRUNCATE TABLE Bookings CASCADE;
TRUNCATE TABLE Rooms CASCADE;
TRUNCATE TABLE Room_Types CASCADE;
TRUNCATE TABLE Users CASCADE;

-- Reiniciar as sequências de IDs
ALTER SEQUENCE Users_user_id_seq RESTART WITH 1;
ALTER SEQUENCE Room_Types_room_type_id_seq RESTART WITH 1;
ALTER SEQUENCE Rooms_room_id_seq RESTART WITH 1;
ALTER SEQUENCE Bookings_booking_id_seq RESTART WITH 1;

-- Inserir usuários
INSERT INTO Users (name, email, password, phone, role, created_at, updated_at) VALUES
('Admin do Sistema', 'admin@sistema.com', 'admin123', '(11) 99999-9999', 'admin', NOW(), NOW()),
('João Silva', 'joao.silva@example.com', 'senha123', '(11) 98888-8888', 'user', NOW(), NOW()),
('Maria Souza', 'maria.souza@example.com', 'senha456', '(11) 97777-7777', 'user', NOW(), NOW()),
('Carlos Oliveira', 'carlos.oliveira@example.com', 'senha789', '(11) 96666-6666', 'user', NOW(), NOW()),
('Ana Ferreira', 'ana.ferreira@example.com', 'senha101', '(11) 95555-5555', 'user', NOW(), NOW());

-- Inserir tipos de sala
INSERT INTO Room_Types (name, description, created_at, updated_at) VALUES
('Sala de Reunião', 'Salas equipadas para reuniões de negócios com quadro branco, projetor e mesa de conferência', NOW(), NOW()),
('Auditório', 'Espaços amplos para apresentações e eventos com sistema de som e palco', NOW(), NOW()),
('Sala de Treinamento', 'Ambientes para workshops e treinamentos com computadores e equipamentos didáticos', NOW(), NOW()),
('Escritório Privado', 'Espaços individuais para trabalho concentrado e reuniões privadas', NOW(), NOW());

-- Inserir salas
INSERT INTO Rooms (name, capacity, location, room_type_id, status, created_at, updated_at) VALUES
('Sala Executiva A', 10, 'Andar 1, Bloco A', 1, 'available', NOW(), NOW()),
('Sala Executiva B', 8, 'Andar 1, Bloco B', 1, 'available', NOW(), NOW()),
('Auditório Principal', 100, 'Térreo, Bloco Central', 2, 'available', NOW(), NOW()),
('Auditório Secundário', 50, 'Andar 2, Bloco Central', 2, 'maintenance', NOW(), NOW()),
('Sala de Treinamento 1', 20, 'Andar 2, Bloco A', 3, 'available', NOW(), NOW()),
('Sala de Treinamento 2', 15, 'Andar 2, Bloco B', 3, 'available', NOW(), NOW()),
('Escritório 101', 1, 'Andar 3, Bloco A', 4, 'available', NOW(), NOW()),
('Escritório 102', 1, 'Andar 3, Bloco A', 4, 'available', NOW(), NOW()),
('Escritório 103', 2, 'Andar 3, Bloco B', 4, 'maintenance', NOW(), NOW());

-- Inserir reservas (algumas passadas, algumas futuras)
-- Reservas passadas
INSERT INTO Bookings (room_id, user_id, title, description, start_time, end_time, status, created_at, updated_at) VALUES
(1, 2, 'Reunião de Planejamento Q1', 'Discussão sobre metas do primeiro trimestre', NOW() - INTERVAL '7 days' + INTERVAL '9 hours', NOW() - INTERVAL '7 days' + INTERVAL '11 hours', 'confirmed', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),
(3, 1, 'Apresentação da Empresa', 'Evento de apresentação para novos colaboradores', NOW() - INTERVAL '5 days' + INTERVAL '13 hours', NOW() - INTERVAL '5 days' + INTERVAL '17 hours', 'confirmed', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
(5, 3, 'Treinamento de Excel', 'Treinamento básico e avançado de Excel para equipe de finanças', NOW() - INTERVAL '3 days' + INTERVAL '9 hours', NOW() - INTERVAL '3 days' + INTERVAL '17 hours', 'confirmed', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
(2, 4, 'Reunião com Cliente XYZ', 'Apresentação de proposta comercial', NOW() - INTERVAL '2 days' + INTERVAL '14 hours', NOW() - INTERVAL '2 days' + INTERVAL '16 hours', 'cancelled', NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 day'),
(7, 5, 'Entrevista de Emprego', 'Entrevista para vaga de desenvolvedor', NOW() - INTERVAL '1 day' + INTERVAL '10 hours', NOW() - INTERVAL '1 day' + INTERVAL '11 hours', 'confirmed', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days');

-- Reservas para hoje
INSERT INTO Bookings (room_id, user_id, title, description, start_time, end_time, status, created_at, updated_at) VALUES
(1, 3, 'Reunião de Equipe', 'Discussão sobre andamento dos projetos atuais', NOW() + INTERVAL '2 hours', NOW() + INTERVAL '4 hours', 'confirmed', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
(6, 2, 'Workshop Design Thinking', 'Aplicação da metodologia para resolução de problemas', NOW() + INTERVAL '3 hours', NOW() + INTERVAL '8 hours', 'confirmed', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
(8, 4, 'Entrevista de Feedback', 'Avaliação de desempenho trimestral', NOW() + INTERVAL '6 hours', NOW() + INTERVAL '7 hours', 'in_progress', NOW() - INTERVAL '4 days', NOW());

-- Reservas futuras
INSERT INTO Bookings (room_id, user_id, title, description, start_time, end_time, status, created_at, updated_at) VALUES
(2, 5, 'Reunião de Alinhamento', 'Discussão sobre novos projetos', NOW() + INTERVAL '1 day' + INTERVAL '9 hours', NOW() + INTERVAL '1 day' + INTERVAL '11 hours', 'confirmed', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
(3, 1, 'Evento de Lançamento', 'Apresentação do novo produto para toda a empresa', NOW() + INTERVAL '3 days' + INTERVAL '13 hours', NOW() + INTERVAL '3 days' + INTERVAL '18 hours', 'confirmed', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
(5, 3, 'Treinamento de Liderança', 'Desenvolvimento de habilidades de liderança para gestores', NOW() + INTERVAL '5 days' + INTERVAL '9 hours', NOW() + INTERVAL '5 days' + INTERVAL '17 hours', 'confirmed', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
(1, 2, 'Planejamento Estratégico', 'Definição de metas para o próximo ano', NOW() + INTERVAL '7 days' + INTERVAL '9 hours', NOW() + INTERVAL '7 days' + INTERVAL '16 hours', 'confirmed', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
(6, 4, 'Workshop de Inovação', 'Brainstorming para novos produtos e serviços', NOW() + INTERVAL '10 days' + INTERVAL '13 hours', NOW() + INTERVAL '10 days' + INTERVAL '17 hours', 'confirmed', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days');