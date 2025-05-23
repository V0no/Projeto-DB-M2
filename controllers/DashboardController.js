// controllers/DashboardController.js

// Importa a pool de conexões do banco de dados configurada para Supabase
const pool = require('../config/database');

/**
 * OBTER ESTATÍSTICAS GERAIS DO SISTEMA
 * Endpoint: GET /dashboard/stats
 * Retorna um resumo completo com métricas principais do sistema
 */
exports.obterEstatisticas = async (req, res) => {
  try {
    // === CONTADORES BÁSICOS ===
    
    // Query 1: Total de usuários cadastrados no sistema
    const usersQuery = 'SELECT COUNT(*) as total_users FROM Users';
    const usersResult = await pool.query(usersQuery);
    
    // Query 2: Total de salas disponíveis no sistema
    const roomsQuery = 'SELECT COUNT(*) as total_rooms FROM Rooms';
    const roomsResult = await pool.query(roomsQuery);
    
    // Query 3: Total de tipos de sala diferentes (salas de reunião, auditórios, etc.)
    const roomTypesQuery = 'SELECT COUNT(*) as total_room_types FROM Room_Types';
    const roomTypesResult = await pool.query(roomTypesQuery);
    
    // Query 4: Total de reservas já criadas (histórico completo)
    const bookingsQuery = 'SELECT COUNT(*) as total_bookings FROM Bookings';
    const bookingsResult = await pool.query(bookingsQuery);
    
    // === DISTRIBUIÇÕES POR STATUS ===
    
    // Query 5: Distribuição de reservas por status (confirmed, cancelled, pending, etc.)
    // GROUP BY agrupa registros por status e conta quantos há de cada tipo
    const bookingStatusQuery = `
      SELECT status, COUNT(*) as count 
      FROM Bookings 
      GROUP BY status`;
    const bookingStatusResult = await pool.query(bookingStatusQuery);
    
    // Query 6: Distribuição de salas por status (available, maintenance, etc.)
    const roomStatusQuery = `
      SELECT status, COUNT(*) as count 
      FROM Rooms 
      GROUP BY status`;
    const roomStatusResult = await pool.query(roomStatusQuery);
    
    // === MÉTRICAS DO DIA ATUAL ===
    
    // Query 7: Reservas confirmadas para hoje
    // DATE() extrai apenas a parte da data (sem horário) para comparação
    // CURRENT_DATE retorna a data atual do servidor
    const todayBookingsQuery = `
      SELECT COUNT(*) as today_bookings 
      FROM Bookings 
      WHERE status = 'confirmed'
      AND DATE(start_time) = CURRENT_DATE`;
    const todayBookingsResult = await pool.query(todayBookingsQuery);
    
    // === MONTAGEM DA RESPOSTA ESTRUTURADA ===
    
    // Organiza todas as estatísticas em um objeto JSON bem estruturado
    // parseInt() converte strings retornadas do banco para números inteiros
    res.status(200).json({
      users: {
        total: parseInt(usersResult.rows[0].total_users)
      },
      rooms: {
        total: parseInt(roomsResult.rows[0].total_rooms),
        by_status: roomStatusResult.rows // Array com {status, count} para cada status
      },
      room_types: {
        total: parseInt(roomTypesResult.rows[0].total_room_types)
      },
      bookings: {
        total: parseInt(bookingsResult.rows[0].total_bookings),
        by_status: bookingStatusResult.rows, // Array com distribuição por status
        today: parseInt(todayBookingsResult.rows[0].today_bookings)
      }
    });
  } catch (err) {
    // Tratamento de erro padrão para problemas de banco ou queries
    res.status(500).json({ error: err.message });
  }
};

/**
 * OBTER RESERVAS DO DIA ATUAL
 * Endpoint: GET /dashboard/today-bookings
 * Lista todas as reservas confirmadas para o dia de hoje com detalhes
 */
exports.obterReservasHoje = async (req, res) => {
  try {
    // Query com JOINs para obter dados completos das reservas de hoje
    // Inclui nome da sala e nome do usuário para facilitar visualização
    const query = `
      SELECT b.*, r.name as room_name, u.name as user_name
      FROM Bookings b
      JOIN Rooms r ON b.room_id = r.room_id
      JOIN Users u ON b.user_id = u.user_id
      WHERE b.status = 'confirmed'           -- Apenas reservas confirmadas
      AND DATE(b.start_time) = CURRENT_DATE  -- Apenas hoje
      ORDER BY b.start_time`;                
    
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * OBTER OCUPAÇÃO DAS SALAS
 * Endpoint: GET /dashboard/room-occupancy?periodo=semana|mes|ano
 * Calcula o percentual de ocupação de cada sala em um período específico
 */
exports.obterOcupacaoSalas = async (req, res) => {
  // Extrai o parâmetro de período da query string
  const { periodo } = req.query; // Valores aceitos: 'semana', 'mes', 'ano'
  
  // Define o intervalo SQL baseado no período solicitado
  let intervalo;
  switch(periodo) {
    case 'semana':
      intervalo = 'INTERVAL \'7 days\'';   // Últimos 7 dias
      break;
    case 'mes':
      intervalo = 'INTERVAL \'30 days\'';  // Últimos 30 dias
      break;
    case 'ano':
      intervalo = 'INTERVAL \'365 days\''; // Últimos 365 dias
      break;
    default:
      intervalo = 'INTERVAL \'30 days\'';  // Padrão: último mês se não especificado
  }

  try {
    /**
     * QUERY COMPLEXA COM CTE (Common Table Expressions)
     * Utiliza WITH para criar "tabelas temporárias" que facilitam o cálculo
     */
    const query = `
      WITH room_hours AS (
        -- CTE 1: Calcula o total de horas disponíveis para cada sala no período
        SELECT r.room_id, r.name,
          EXTRACT(EPOCH FROM (
            CURRENT_TIMESTAMP - (CURRENT_TIMESTAMP - ${intervalo})
          ))/3600 as total_hours  -- Converte segundos para horas
        FROM Rooms r
        WHERE r.status = 'available'  -- Apenas salas disponíveis
      ),
      booking_hours AS (
        -- CTE 2: Calcula horas efetivamente reservadas por sala no período
        SELECT b.room_id,
          SUM(EXTRACT(EPOCH FROM (
            -- Calcula sobreposição entre reserva e período analisado
            LEAST(b.end_time, CURRENT_TIMESTAMP) - 
            GREATEST(b.start_time, CURRENT_TIMESTAMP - ${intervalo})
          ))/3600) as booked_hours
        FROM Bookings b
        WHERE b.status = 'confirmed'  -- Apenas reservas confirmadas
        AND b.start_time < CURRENT_TIMESTAMP  -- Reservas que já começaram
        AND b.end_time > (CURRENT_TIMESTAMP - ${intervalo})  -- Dentro do período
        GROUP BY b.room_id
      )
      -- Query principal: junta os CTEs e calcula percentual de ocupação
      SELECT r.room_id, r.name, 
        COALESCE(bh.booked_hours, 0) as booked_hours,  -- Se NULL, usa 0
        rh.total_hours,
        -- Calcula percentual: (horas reservadas / horas totais) * 100
        ROUND((COALESCE(bh.booked_hours, 0) / rh.total_hours * 100)::numeric, 2) as occupancy_percentage
      FROM room_hours rh
      LEFT JOIN booking_hours bh ON rh.room_id = bh.room_id  -- LEFT JOIN preserva salas sem reservas
      JOIN Rooms r ON rh.room_id = r.room_id
      ORDER BY occupancy_percentage DESC`; 
    
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * OBTER MAIORES USUÁRIOS DO SISTEMA
 * Endpoint: GET /dashboard/top-users
 * Lista os 10 usuários que mais utilizam o sistema de reservas
 */
exports.obterMaioresUsuarios = async (req, res) => {
  try {
    // Query com agregações para rankear usuários por uso
    const query = `
      SELECT 
        u.user_id, u.name, u.email,
        -- Conta total de reservas por usuário
        COUNT(b.booking_id) as total_bookings,
        -- Soma total de horas reservadas por usuário
        -- EXTRACT(EPOCH FROM interval) converte intervalo para segundos, /3600 para horas
        SUM(EXTRACT(EPOCH FROM (b.end_time - b.start_time))/3600) as total_hours
      FROM Users u
      -- LEFT JOIN preserva usuários mesmo sem reservas (mostra 0 reservas)
      LEFT JOIN Bookings b ON u.user_id = b.user_id
      -- GROUP BY necessário para funções de agregação (COUNT, SUM)
      GROUP BY u.user_id, u.name, u.email
      -- Ordena por número de reservas (usuários mais ativos primeiro)
      ORDER BY total_bookings DESC
      -- Limita aos top 10 usuários
      LIMIT 10`;
    
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};