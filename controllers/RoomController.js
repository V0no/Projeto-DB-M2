// controllers/RoomController.js

// Importa a pool de conexões do banco de dados configurada para Supabase
const pool = require('../config/database');

/**
 * CRIAR NOVA SALA
 * Endpoint: POST /rooms
 * Cadastra uma nova sala no sistema com todas as suas informações
 */
exports.criarSala = async (req, res) => {
  // Desestruturação dos dados da requisição
  const { name, capacity, location, room_type_id, status } = req.body;

  try {
    // Query INSERT com RETURNING * para obter o registro criado
    const query = `
      INSERT INTO Rooms (name, capacity, location, room_type_id, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *`;
    
    // Array de valores com status padrão 'available' se não fornecido
    const values = [name, capacity, location, room_type_id, status || 'available'];

    // Executa a inserção com prepared statement (proteção contra SQL injection)
    const result = await pool.query(query, values);
    
    // Retorna a sala criada com status 201 (Created)
    res.status(201).json(result.rows[0]);
  } catch (err) {
    // Tratamento de erro (pode incluir violações de constraint, dados inválidos, etc.)
    res.status(500).json({ error: err.message });
  }
};

/**
 * LISTAR TODAS AS SALAS
 * Endpoint: GET /rooms
 * Retorna todas as salas do sistema com informações do tipo de sala
 */
exports.listarSalas = async (req, res) => {
  try {
    // Query com LEFT JOIN para incluir o nome do tipo de sala
    // LEFT JOIN preserva salas mesmo sem tipo definido (room_type_id = NULL)
    const query = `
      SELECT r.*, rt.name as room_type_name
      FROM Rooms r
      LEFT JOIN Room_Types rt ON r.room_type_id = rt.room_type_id
      ORDER BY r.name`;  // Ordena alfabeticamente por nome da sala
    
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * OBTER SALA ESPECÍFICA
 * Endpoint: GET /rooms/:id
 * Retorna os detalhes de uma sala específica incluindo tipo
 */
exports.obterSala = async (req, res) => {
  // Extrai o ID da sala dos parâmetros da URL
  const { id } = req.params;

  try {
    // Query similar ao listar, mas filtra por room_id específico
    const query = `
      SELECT r.*, rt.name as room_type_name
      FROM Rooms r
      LEFT JOIN Room_Types rt ON r.room_type_id = rt.room_type_id
      WHERE r.room_id = $1`;
    const values = [id];

    const result = await pool.query(query, values);
    
    // Verifica se a sala foi encontrada
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Sala não encontrada' });
    }
    
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * ATUALIZAR SALA COMPLETA
 * Endpoint: PUT /rooms/:id
 * Atualiza todos os campos de uma sala específica
 */
exports.atualizarSala = async (req, res) => {
  const { id } = req.params;
  const { name, capacity, location, room_type_id, status } = req.body;

  try {
    // Query UPDATE com timestamp automático e RETURNING para confirmar alterações
    const query = `
      UPDATE Rooms
      SET name = $1, capacity = $2, location = $3, room_type_id = $4, 
          status = $5, updated_at = CURRENT_TIMESTAMP
      WHERE room_id = $6
      RETURNING *`;
    const values = [name, capacity, location, room_type_id, status, id];

    const result = await pool.query(query, values);
    
    // Verifica se algum registro foi atualizado
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Sala não encontrada' });
    }
    
    // Retorna a sala atualizada
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * ALTERAR APENAS STATUS DA SALA
 * Endpoint: PATCH /rooms/:id/status
 * Operação mais específica para mudanças de status (available, maintenance, etc.)
 */
exports.alterarStatusSala = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    // Query focada apenas no status - mais eficiente que UPDATE completo
    const query = `
      UPDATE Rooms
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE room_id = $2
      RETURNING *`;
    const values = [status, id];

    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Sala não encontrada' });
    }
    
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * EXCLUIR SALA COM VALIDAÇÃO
 * Endpoint: DELETE /rooms/:id
 * Remove sala apenas se não houver reservas associadas (integridade referencial)
 */
exports.excluirSala = async (req, res) => {
  const { id } = req.params;

  try {
    // === VALIDAÇÃO DE INTEGRIDADE ===
    // Primeiro verifica se existem reservas vinculadas à sala
    const checkQuery = 'SELECT COUNT(*) FROM Bookings WHERE room_id = $1';
    const checkResult = await pool.query(checkQuery, [id]);
    
    // Se há reservas associadas, impede a exclusão para manter integridade dos dados
    if (parseInt(checkResult.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Não é possível excluir a sala pois existem reservas associadas a ela' 
      });
    }

    // === EXCLUSÃO SEGURA ===
    // Só executa DELETE se passou na validação acima
    const query = 'DELETE FROM Rooms WHERE room_id = $1 RETURNING *';
    const result = await pool.query(query, [id]);

    // Verifica se a sala existia para ser excluída
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Sala não encontrada' });
    }
    
    // Confirma exclusão bem-sucedida
    res.status(200).json({ message: 'Sala excluída com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * LISTAR RESERVAS FUTURAS DA SALA
 * Endpoint: GET /rooms/:id/bookings
 * Mostra próximas reservas confirmadas para uma sala específica
 */
exports.listarReservasSala = async (req, res) => {
  const { id } = req.params;

  try {
    // Query que busca apenas reservas futuras e confirmadas
    const query = `
      SELECT b.*, u.name as user_name
      FROM Bookings b
      JOIN Users u ON b.user_id = u.user_id
      WHERE b.room_id = $1 
      AND b.status = 'confirmed'                    -- Apenas confirmadas
      AND b.end_time >= CURRENT_TIMESTAMP           -- Ainda não terminaram
      ORDER BY b.start_time`;                       
    const values = [id];

    const result = await pool.query(query, values);
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * VERIFICAR DISPONIBILIDADE ESPECÍFICA DA SALA
 * Endpoint: GET /rooms/:id/availability?start_time=...&end_time=...
 * Verifica se uma sala específica está disponível em um período
 */
exports.verificarDisponibilidadeSala = async (req, res) => {
  const { id } = req.params;
  const { start_time, end_time } = req.query;  // Parâmetros via query string

  try {
    // === STEP 1: VERIFICAR EXISTÊNCIA DA SALA ===
    const roomQuery = 'SELECT * FROM Rooms WHERE room_id = $1';
    const roomResult = await pool.query(roomQuery, [id]);
    
    if (roomResult.rows.length === 0) {
      return res.status(404).json({ message: 'Sala não encontrada' });
    }

    // === STEP 2: VERIFICAR STATUS DA SALA ===
    // Sala pode existir mas estar em manutenção, reforma, etc.
    if (roomResult.rows[0].status !== 'available') {
      return res.status(200).json({ 
        available: false, 
        reason: 'A sala está em manutenção',  // Mensagem específica do motivo
        room: roomResult.rows[0] 
      });
    }

    // === STEP 3: VERIFICAR CONFLITOS DE AGENDAMENTO ===
    /**
     * Lógica de detecção de sobreposição de horários:
     * Verifica 3 cenários de conflito:
     * 1. Reserva existente começa antes e termina durante o período
     * 2. Reserva existente começa durante e termina depois do período
     * 3. Reserva existente está completamente dentro do período
     */
    const bookingsQuery = `
      SELECT * FROM Bookings
      WHERE room_id = $1
      AND status = 'confirmed'
      AND (
        (start_time <= $2 AND end_time > $2)      -- Cenário 1
        OR (start_time < $3 AND end_time >= $3)   -- Cenário 2  
        OR (start_time >= $2 AND end_time <= $3)  -- Cenário 3
      )`;
    const bookingsResult = await pool.query(bookingsQuery, [id, start_time, end_time]);

    // Se não há conflitos, sala está disponível no período
    const isAvailable = bookingsResult.rows.length === 0;
    
    // === RESPOSTA ESTRUTURADA ===
    res.status(200).json({
      available: isAvailable,
      room: roomResult.rows[0],                    // Dados da sala
      conflicting_bookings: isAvailable ? [] : bookingsResult.rows  // Conflitos se houver
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};