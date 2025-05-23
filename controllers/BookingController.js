// controllers/BookingController.js

// Importa a pool de conexões do banco de dados configurada para Supabase
const pool = require('../config/database');

/**
 * CRIAR NOVA RESERVA
 * Endpoint: POST /bookings
 * Cria uma nova reserva no sistema com validação de dados
 */
exports.criarReserva = async (req, res) => {
  // Desestruturação dos dados enviados no corpo da requisição
  const { room_id, user_id, title, description, start_time, end_time, status } = req.body;

  // Query SQL para inserir nova reserva na tabela Bookings
  // RETURNING * retorna todos os campos do registro inserido
  const query = `
    INSERT INTO Bookings (room_id, user_id, title, description, start_time, end_time, status) 
    VALUES ($1, $2, $3, $4, $5, $6, $7) 
    RETURNING *`;
  
  // Array com os valores para substituir os placeholders ($1, $2, etc.)
  // Se status não for fornecido, usa 'confirmed' como padrão
  const values = [room_id, user_id, title, description, start_time, end_time, status || 'confirmed'];

  try {
    // Executa a query com prepared statement (proteção contra SQL injection)
    const result = await pool.query(query, values);
    
    // Obtém o primeiro (e único) registro inserido
    const reserva = result.rows[0];
    
    // Retorna a reserva criada com status 201 (Created)
    res.status(201).json(reserva);
  } catch (err) {
    // Em caso de erro, retorna status 500 com a mensagem de erro
    res.status(500).json({ error: err.message });
  }
};

/**
 * LISTAR TODAS AS RESERVAS
 * Endpoint: GET /bookings
 * Retorna todas as reservas com informações das salas e usuários
 */
exports.listarReservas = async (req, res) => {
  // Query com JOINs para obter dados relacionados de salas e usuários
  // Ordena por horário de início da reserva
  const query = `
    SELECT b.*, r.name as room_name, u.name as user_name
    FROM Bookings b
    JOIN Rooms r ON b.room_id = r.room_id
    JOIN Users u ON b.user_id = u.user_id
    ORDER BY b.start_time`;

  try {
    // Executa query sem parâmetros (não precisa de prepared statement)
    const result = await pool.query(query);
    
    // Retorna array com todas as reservas encontradas
    res.status(200).json(result.rows);
  } catch (err) {
    // Tratamento de erro padrão
    res.status(500).json({ error: err.message });
  }
};

/**
 * OBTER RESERVA ESPECÍFICA
 * Endpoint: GET /bookings/:id
 * Retorna uma reserva específica com dados de sala e usuário
 */
exports.obterReserva = async (req, res) => {
  // Extrai o ID da reserva dos parâmetros da URL
  const { id } = req.params;

  // Query similar ao listar, mas filtra por booking_id específico
  const query = `
    SELECT b.*, r.name as room_name, u.name as user_name
    FROM Bookings b
    JOIN Rooms r ON b.room_id = r.room_id
    JOIN Users u ON b.user_id = u.user_id
    WHERE b.booking_id = $1`;
  const values = [id];

  try {
    const result = await pool.query(query, values);
    
    // Verifica se a reserva foi encontrada
    if (result.rows.length === 0) {
      // Retorna erro 404 se reserva não existir
      return res.status(404).json({ message: 'Reserva não encontrada' });
    }
    
    // Retorna a reserva encontrada
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * EDITAR RESERVA EXISTENTE
 * Endpoint: PUT /bookings/:id
 * Atualiza todos os campos de uma reserva específica
 */
exports.editarReserva = async (req, res) => {
  // ID da reserva a ser editada
  const { id } = req.params;
  
  // Novos dados para atualização
  const { room_id, user_id, title, description, start_time, end_time, status } = req.body;

  // Query UPDATE com CURRENT_TIMESTAMP para updated_at automático
  // RETURNING * retorna o registro atualizado
  const query = `
    UPDATE Bookings 
    SET room_id = $1, user_id = $2, title = $3, description = $4, 
        start_time = $5, end_time = $6, status = $7, updated_at = CURRENT_TIMESTAMP
    WHERE booking_id = $8 
    RETURNING *`;
  
  // Array com todos os novos valores + ID no final
  const values = [room_id, user_id, title, description, start_time, end_time, status, id];

  try {
    const result = await pool.query(query, values);
    
    // Verifica se algum registro foi atualizado
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Reserva não encontrada' });
    }
    
    // Retorna a reserva atualizada
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * CANCELAR RESERVA
 * Endpoint: PATCH /bookings/:id/cancel
 * Altera apenas o status da reserva para 'cancelled'
 */
exports.cancelarReserva = async (req, res) => {
  const { id } = req.params;

  // Query que apenas atualiza o status e timestamp de atualização
  // Mais eficiente que UPDATE completo quando só muda o status
  const query = `
    UPDATE Bookings 
    SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
    WHERE booking_id = $1 
    RETURNING *`;
  const values = [id];

  try {
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Reserva não encontrada' });
    }
    
    // Retorna mensagem de sucesso + dados da reserva cancelada
    res.status(200).json({ 
      message: 'Reserva cancelada com sucesso', 
      booking: result.rows[0] 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * EXCLUIR RESERVA PERMANENTEMENTE
 * Endpoint: DELETE /bookings/:id
 * Remove completamente a reserva do banco de dados
 */
exports.excluirReserva = async (req, res) => {
  const { id } = req.params;

  // DELETE físico do registro (não soft delete)
  // RETURNING * para confirmar que algo foi excluído
  const query = 'DELETE FROM Bookings WHERE booking_id = $1 RETURNING *';
  const values = [id];

  try {
    const result = await pool.query(query, values);
    
    // Verifica se algum registro foi excluído
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Reserva não encontrada' });
    }
    
    // Confirma exclusão sem retornar dados da reserva excluída
    res.status(200).json({ message: 'Reserva excluída com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * VERIFICAR DISPONIBILIDADE DE SALA
 * Endpoint: POST /bookings/check-availability
 * Verifica se uma sala está disponível em um período específico
 */
exports.verificarDisponibilidade = async (req, res) => {
  // Dados necessários para verificação: sala e período desejado
  const { room_id, start_time, end_time } = req.body;

  /**
   * Query complexa para detectar conflitos de horário
   * Verifica sobreposições em 3 cenários:
   * 1. Reserva existente começa antes e termina durante o período desejado
   * 2. Reserva existente começa durante e termina após o período desejado  
   * 3. Reserva existente está completamente dentro do período desejado
   * 
   * Só considera reservas com status 'confirmed' para evitar falsos conflitos
   */
  const query = `
    SELECT * FROM Bookings
    WHERE room_id = $1
    AND status = 'confirmed'
    AND (
      (start_time <= $2 AND end_time > $2)      -- Cenário 1
      OR (start_time < $3 AND end_time >= $3)   -- Cenário 2
      OR (start_time >= $2 AND end_time <= $3)  -- Cenário 3
    )`;
  const values = [room_id, start_time, end_time];

  try {
    const result = await pool.query(query, values);
    
    // Se não há registros retornados, a sala está disponível
    const isAvailable = result.rows.length === 0;
    
    // Retorna disponibilidade + lista de reservas conflitantes (se houver)
    res.status(200).json({ 
      available: isAvailable,
      conflicting_bookings: isAvailable ? [] : result.rows 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};