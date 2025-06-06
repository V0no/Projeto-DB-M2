// controllers/UserController.js

// Importa a pool de conexões do banco de dados configurada para Supabase
const pool = require('../config/database');
const bcrypt = require('bcrypt'); // Para hash de senhas (npm install bcrypt)

/**
 * CRIAR NOVO USUÁRIO
 * Endpoint: POST /users
 * Cadastra um novo usuário no sistema com senha criptografada
 */
const criarUsuario = async (req, res) => {
  const { name, email, phone, role, password } = req.body;

  try {
    // === VALIDAÇÃO DE EMAIL ÚNICO ===
    const emailCheckQuery = 'SELECT user_id FROM Users WHERE email = $1';
    const emailCheck = await pool.query(emailCheckQuery, [email]);
    
    if (emailCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Email já está em uso' });
    }

    // === CRIPTOGRAFIA DA SENHA ===
    // Hash da senha com salt rounds = 12 (boa prática de segurança)
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // === INSERÇÃO DO USUÁRIO ===
    const query = `
      INSERT INTO Users (name, email, phone, role, password)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING user_id, name, email, phone, role, created_at`;
    
    const values = [name, email, phone, role || 'user', hashedPassword];
    const result = await pool.query(query, values);

    console.log('Novo usuário criado:', result.rows[0].email);
    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json(createErrorResponse(error));
  }
};

/**
 * LISTAR TODOS OS USUÁRIOS
 * Endpoint: GET /users
 * Retorna lista completa de usuários com informações básicas (sem senha)
 */
const listarUsuarios = async (req, res) => {
  try {
    // Log apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log('Listando usuários do banco...');
    }
    
    // === QUERY PRINCIPAL DE USUÁRIOS ===
    /**
     * Query que busca usuários sem informações sensíveis:
     * - Exclui password por segurança
     * - Ordena alfabeticamente por nome para UX consistente
     * - Inclui timestamps para auditoria se necessário
     */
    const query = `
      SELECT user_id, name, email, phone, role, created_at, updated_at
      FROM Users
      ORDER BY name`;
    
    const result = await pool.query(query);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Usuários encontrados:', result.rows.length);
    }
    
    // Retorna array de usuários com status 200 (OK)
    res.status(200).json(result.rows);
    
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json(createErrorResponse(error));
  }
};

/**
 * OBTER USUÁRIO ESPECÍFICO
 * Endpoint: GET /users/:id
 * Retorna detalhes de um usuário específico pelo ID
 */
const obterUsuario = async (req, res) => {
  try {
    // Extrai ID do usuário dos parâmetros da URL
    const { id } = req.params;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Obtendo usuário ID:', id);
    }
    
    // === QUERY PARA USUÁRIO ESPECÍFICO ===
    /**
     * Busca usuário por ID com as mesmas colunas da listagem
     * - Utiliza prepared statement ($1) para segurança
     * - Exclui informações sensíveis como senha
     */
    const query = `
      SELECT user_id, name, email, phone, role, created_at, updated_at
      FROM Users
      WHERE user_id = $1`;
    
    // Executa query com prepared statement (proteção contra SQL injection)
    const result = await pool.query(query, [id]);
    
    // === VALIDAÇÃO DE EXISTÊNCIA ===
    // Verifica se o usuário foi encontrado
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    // Retorna dados do usuário encontrado
    res.status(200).json(result.rows[0]);
    
  } catch (error) {
    console.error('Erro ao obter usuário:', error);
    res.status(500).json(createErrorResponse(error));
  }
};

/**
 * ATUALIZAR USUÁRIO
 * Endpoint: PUT /users/:id
 * Atualiza informações básicas do usuário (exceto senha)
 */
const atualizarUsuario = async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, role } = req.body;

  try {
    // === VALIDAÇÃO BÁSICA ===
    if (!name || !email) {
      return res.status(400).json({ error: 'Nome e email são obrigatórios' });
    }

    // === VALIDAÇÃO DE EMAIL ÚNICO (se alterado) ===
    const emailCheckQuery = 'SELECT user_id FROM Users WHERE email = $1 AND user_id != $2';
    const emailCheck = await pool.query(emailCheckQuery, [email, id]);
    
    if (emailCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Email já está em uso por outro usuário' });
    }

    // === BUSCAR USUÁRIO ATUAL PARA PRESERVAR ROLE SE NÃO FORNECIDO ===
    const currentUserQuery = 'SELECT role FROM Users WHERE user_id = $1';
    const currentUserResult = await pool.query(currentUserQuery, [id]);
    
    if (currentUserResult.rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Usar role atual se não fornecido ou se for null/undefined
    const finalRole = role || currentUserResult.rows[0].role;

    // === ATUALIZAÇÃO DO USUÁRIO ===
    const query = `
      UPDATE Users
      SET name = $1, email = $2, phone = $3, role = $4, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $5
      RETURNING user_id, name, email, phone, role, created_at, updated_at`;
    
    const values = [name, email, phone, finalRole, id];
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    console.log('Usuário atualizado:', result.rows[0].email);
    res.status(200).json(result.rows[0]);

  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json(createErrorResponse(error));
  }
};

/**
 * ALTERAR SENHA DO USUÁRIO
 * Endpoint: PUT /users/:id/password
 * Permite alterar senha verificando a senha atual
 */
const alterarSenha = async (req, res) => {
  const { id } = req.params;
  const { currentPassword, newPassword } = req.body;

  try {
    // === BUSCAR SENHA ATUAL DO USUÁRIO ===
    const userQuery = 'SELECT password FROM Users WHERE user_id = $1';
    const userResult = await pool.query(userQuery, [id]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // === VERIFICAR SENHA ATUAL ===
    const currentHashedPassword = userResult.rows[0].password;
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, currentHashedPassword);

    if (!isCurrentPasswordValid) {
      return res.status(401).json({ error: 'Senha atual incorreta' });
    }

    // === CRIPTOGRAFAR NOVA SENHA ===
    const saltRounds = 12;
    const newHashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // === ATUALIZAR SENHA ===
    const updateQuery = `
      UPDATE Users 
      SET password = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE user_id = $2`;
    
    await pool.query(updateQuery, [newHashedPassword, id]);

    console.log('Senha alterada para usuário ID:', id);
    res.status(200).json({ message: 'Senha alterada com sucesso' });

  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json(createErrorResponse(error));
  }
};

/**
 * DESATIVAR USUÁRIO (SOFT DELETE)
 * Endpoint: PATCH /users/:id/deactivate
 * Desativa usuário ao invés de excluir (preserva histórico)
 */
const desativarUsuario = async (req, res) => {
  const { id } = req.params;

  try {
    // === SOFT DELETE - ALTERA STATUS AO INVÉS DE EXCLUIR ===
    const query = `
      UPDATE Users 
      SET status = 'inactive', updated_at = CURRENT_TIMESTAMP 
      WHERE user_id = $1 AND status = 'active'
      RETURNING user_id, name, email, status`;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado ou já inativo' });
    }

    console.log('Usuário desativado:', result.rows[0].email);
    res.status(200).json({ 
      message: 'Usuário desativado com sucesso',
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Erro ao desativar usuário:', error);
    res.status(500).json(createErrorResponse(error));
  }
};

/**
 * REATIVAR USUÁRIO
 * Endpoint: PATCH /users/:id/activate
 * Reativa um usuário previamente desativado
 */
const reativarUsuario = async (req, res) => {
  const { id } = req.params;

  try {
    const query = `
      UPDATE Users 
      SET status = 'active', updated_at = CURRENT_TIMESTAMP 
      WHERE user_id = $1 AND status = 'inactive'
      RETURNING user_id, name, email, status`;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado ou já ativo' });
    }

    console.log('Usuário reativado:', result.rows[0].email);
    res.status(200).json({ 
      message: 'Usuário reativado com sucesso',
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Erro ao reativar usuário:', error);
    res.status(500).json(createErrorResponse(error));
  }
};

/**
 * LISTAR RESERVAS DO USUÁRIO
 * Endpoint: GET /users/:id/bookings
 * Retorna histórico de reservas de um usuário específico
 */
const listarReservasUsuario = async (req, res) => {
  const { id } = req.params;
  const { status, limit = 50 } = req.query; // Parâmetros opcionais

  try {
    // === VERIFICAR SE USUÁRIO EXISTE ===
    const userCheck = await pool.query('SELECT user_id FROM Users WHERE user_id = $1', [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // === CONSTRUIR QUERY DINÂMICA ===
    let query = `
      SELECT b.*, r.name as room_name, rt.name as room_type_name
      FROM Bookings b
      JOIN Rooms r ON b.room_id = r.room_id
      LEFT JOIN Room_Types rt ON r.room_type_id = rt.room_type_id
      WHERE b.user_id = $1`;
    
    let values = [id];
    let paramCount = 1;

    // Filtro por status se fornecido
    if (status) {
      paramCount++;
      query += ` AND b.status = $${paramCount}`;
      values.push(status);
    }

    query += ` ORDER BY b.start_time DESC LIMIT $${paramCount + 1}`;
    values.push(parseInt(limit));

    const result = await pool.query(query, values);
    res.status(200).json(result.rows);

  } catch (error) {
    console.error('Erro ao listar reservas do usuário:', error);
    res.status(500).json(createErrorResponse(error));
  }
};

const atualizarPerfilProprio = async (req, res) => {
  const { id } = req.params;
  const { name, email, phone } = req.body;

  try {
    // === VALIDAÇÃO BÁSICA ===
    if (!name || !email) {
      return res.status(400).json({ error: 'Nome e email são obrigatórios' });
    }

    // === VALIDAÇÃO DE EMAIL ÚNICO (se alterado) ===
    const emailCheckQuery = 'SELECT user_id FROM Users WHERE email = $1 AND user_id != $2';
    const emailCheck = await pool.query(emailCheckQuery, [email, id]);
    
    if (emailCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Email já está em uso por outro usuário' });
    }

    // === ATUALIZAÇÃO APENAS DE DADOS BÁSICOS (SEM ROLE) ===
    const query = `
      UPDATE Users
      SET name = $1, email = $2, phone = $3, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $4
      RETURNING user_id, name, email, phone, role, created_at, updated_at`;
    
    const values = [name, email, phone, id];
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    console.log('Perfil atualizado pelo usuário:', result.rows[0].email);
    res.status(200).json(result.rows[0]);

  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json(createErrorResponse(error));
  }
};

/**
 * FUNÇÃO AUXILIAR PARA PADRONIZAR RESPOSTAS DE ERRO
 * Centraliza a formatação de erros para consistência
 */
const createErrorResponse = (error) => {
  // Em desenvolvimento, retorna detalhes completos
  if (process.env.NODE_ENV === 'development') {
    return {
      error: error.message,
      code: error.code,
      detail: error.detail
    };
  }
  
  // Em produção, retorna apenas mensagem básica por segurança
  return {
    error: 'Erro interno do servidor'
  };
};

// === EXPORTAÇÃO DAS FUNÇÕES ===
module.exports = {
  criarUsuario,
  listarUsuarios,
  obterUsuario,
  atualizarUsuario,
  alterarSenha,
  desativarUsuario,
  reativarUsuario,
  listarReservasUsuario,
  atualizarPerfilProprio
};