// controllers/RoomTypeController.js

// Importa a pool de conexões do banco de dados configurada para Supabase
const pool = require('../config/database');

/**
 * CRIAR NOVO TIPO DE SALA
 * Endpoint: POST /room-types
 * Cadastra uma nova categoria de sala (ex: "Sala de Reunião", "Auditório", "Lab")
 */
exports.criarTipoSala = async (req, res) => {
  // Extrai dados básicos do tipo de sala da requisição
  const { name, description } = req.body;

  try {
    // Query INSERT simples - tipos de sala têm estrutura mais básica
    const query = `
      INSERT INTO Room_Types (name, description)
      VALUES ($1, $2)
      RETURNING *`;
    const values = [name, description];

    // Executa inserção com prepared statement (proteção contra SQL injection)
    const result = await pool.query(query, values);
    
    // Retorna o tipo de sala criado com status 201 (Created)
    res.status(201).json(result.rows[0]);
  } catch (err) {
    // Tratamento de erro (pode incluir nomes duplicados se há constraint UNIQUE)
    res.status(500).json({ error: err.message });
  }
};

/**
 * LISTAR TODOS OS TIPOS DE SALA COM ESTATÍSTICAS
 * Endpoint: GET /room-types
 * Retorna todos os tipos com contagem de salas de cada tipo
 */
exports.listarTiposSala = async (req, res) => {
  try {
    /**
     * Query com LEFT JOIN e GROUP BY para estatísticas:
     * - LEFT JOIN preserva tipos mesmo sem salas associadas
     * - COUNT mostra quantas salas existem de cada tipo
     * - GROUP BY necessário para agregação por tipo
     */
    const query = `
      SELECT rt.*, COUNT(r.room_id) as total_rooms
      FROM Room_Types rt
      LEFT JOIN Rooms r ON rt.room_type_id = r.room_type_id
      GROUP BY rt.room_type_id  -- Agrupa por tipo para fazer contagem
      ORDER BY rt.name`;        
    
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * OBTER TIPO DE SALA ESPECÍFICO COM ESTATÍSTICAS
 * Endpoint: GET /room-types/:id
 * Retorna detalhes de um tipo específico incluindo contagem de salas
 */
exports.obterTipoSala = async (req, res) => {
  // Extrai o ID do tipo de sala dos parâmetros da URL
  const { id } = req.params;

  try {
    // Query similar ao listar, mas filtra por room_type_id específico
    // Mantém GROUP BY mesmo para um registro para preservar a estrutura da resposta
    const query = `
      SELECT rt.*, COUNT(r.room_id) as total_rooms
      FROM Room_Types rt
      LEFT JOIN Rooms r ON rt.room_type_id = r.room_type_id
      WHERE rt.room_type_id = $1
      GROUP BY rt.room_type_id`;
    const values = [id];

    const result = await pool.query(query, values);
    
    // Verifica se o tipo de sala foi encontrado
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Tipo de sala não encontrado' });
    }
    
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * ATUALIZAR TIPO DE SALA
 * Endpoint: PUT /room-types/:id
 * Atualiza nome e descrição de um tipo de sala existente
 */
exports.atualizarTipoSala = async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  try {
    // Query UPDATE com timestamp automático para auditoria
    const query = `
      UPDATE Room_Types
      SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP
      WHERE room_type_id = $3
      RETURNING *`;
    const values = [name, description, id];

    const result = await pool.query(query, values);
    
    // Verifica se algum registro foi atualizado
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Tipo de sala não encontrado' });
    }
    
    // Retorna o tipo de sala atualizado
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * EXCLUIR TIPO DE SALA COM VALIDAÇÃO DE INTEGRIDADE
 * Endpoint: DELETE /room-types/:id
 * Remove tipo apenas se não houver salas associadas
 */
exports.excluirTipoSala = async (req, res) => {
  const { id } = req.params;

  try {
    // === VALIDAÇÃO DE INTEGRIDADE REFERENCIAL ===
    // Verifica se existem salas usando este tipo antes da exclusão
    const checkQuery = 'SELECT COUNT(*) FROM Rooms WHERE room_type_id = $1';
    const checkResult = await pool.query(checkQuery, [id]);
    
    // Impede exclusão se há salas associadas (mantém consistência dos dados)
    if (parseInt(checkResult.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Não é possível excluir o tipo de sala pois existem salas associadas a ele' 
      });
    }

    // === EXCLUSÃO SEGURA ===
    // Só executa DELETE após validação bem-sucedida
    const query = 'DELETE FROM Room_Types WHERE room_type_id = $1 RETURNING *';
    const result = await pool.query(query, [id]);

    // Verifica se o tipo existia para ser excluído
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Tipo de sala não encontrado' });
    }
    
    // Confirma exclusão bem-sucedida
    res.status(200).json({ message: 'Tipo de sala excluído com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * LISTAR SALAS DE UM TIPO ESPECÍFICO
 * Endpoint: GET /room-types/:id/rooms
 * Retorna todas as salas que pertencem a um tipo específico
 */
exports.listarSalasPorTipo = async (req, res) => {
  const { id } = req.params;

  try {
    // === STEP 1: VALIDAR EXISTÊNCIA DO TIPO ===
    // Primeiro verifica se o tipo de sala existe
    const typeQuery = 'SELECT * FROM Room_Types WHERE room_type_id = $1';
    const typeResult = await pool.query(typeQuery, [id]);
    
    if (typeResult.rows.length === 0) {
      return res.status(404).json({ message: 'Tipo de sala não encontrado' });
    }

    // === STEP 2: BUSCAR SALAS DO TIPO ===
    // Busca todas as salas que pertencem ao tipo validado
    const query = `
      SELECT * FROM Rooms
      WHERE room_type_id = $1
      ORDER BY name`;  // Ordena alfabeticamente por nome da sala
    const values = [id];

    const result = await pool.query(query, values);
    
    // === RESPOSTA ESTRUTURADA ===
    // Retorna tanto os dados do tipo quanto a lista de salas
    // Útil para exibir "Salas do tipo: Auditório" com a lista
    res.status(200).json({
      room_type: typeResult.rows[0],  // Dados do tipo (nome, descrição)
      rooms: result.rows              // Array de salas deste tipo
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};