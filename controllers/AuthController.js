// controllers/AuthController.js - Versão com debug detalhado

const pool = require('../config/database');
const bcrypt = require('bcrypt');

/**
 * LOGIN DE USUÁRIO - VERSÃO COM DEBUG
 * Endpoint: POST /auth/login
 * Autentica usuário com email e senha
 */
const login = async (req, res) => {
  const { email, password } = req.body;

  console.log('🔐 === INÍCIO DO LOGIN ===');
  console.log('📧 Email recebido:', email);
  console.log('🔑 Senha recebida:', password ? '[FORNECIDA]' : '[NÃO FORNECIDA]');

  try {
    // === VALIDAÇÃO DOS DADOS ===
    if (!email || !password) {
      console.log('❌ Validação falhou: email ou senha não fornecidos');
      return res.status(400).json({ 
        error: 'Email e senha são obrigatórios' 
      });
    }

    const emailLower = email.toLowerCase().trim();
    console.log('📧 Email processado:', emailLower);

    // === BUSCAR USUÁRIO NO BANCO ===
    console.log('🔍 Buscando usuário no banco...');
    const userQuery = `
      SELECT user_id, name, email, phone, role, password, status, created_at
      FROM Users 
      WHERE email = $1`;
    
    const userResult = await pool.query(userQuery, [emailLower]);
    console.log('📊 Resultado da busca:', {
      rows_found: userResult.rows.length,
      query_executed: 'SELECT user WHERE email = ' + emailLower
    });

    // Verificar se usuário existe
    if (userResult.rows.length === 0) {
      console.log('❌ Usuário não encontrado no banco');
      return res.status(401).json({ 
        error: 'Email ou senha incorretos' 
      });
    }

    const user = userResult.rows[0];
    console.log('✅ Usuário encontrado:', {
      id: user.user_id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      has_password: !!user.password,
      password_length: user.password ? user.password.length : 0
    });

    // === VERIFICAR STATUS DO USUÁRIO ===
    if (user.status === 'inactive') {
      console.log('❌ Usuário inativo');
      return res.status(401).json({ 
        error: 'Conta desativada. Entre em contato com o administrador.' 
      });
    }

    // === VERIFICAR SENHA ===
    console.log('🔐 Verificando senha...');
    console.log('🔐 Hash no banco:', user.password ? user.password.substring(0, 20) + '...' : 'SEM HASH');
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('🔐 Resultado da verificação:', isPasswordValid ? 'SENHA CORRETA' : 'SENHA INCORRETA');
    
    if (!isPasswordValid) {
      console.log('❌ Senha incorreta');
      return res.status(401).json({ 
        error: 'Email ou senha incorretos' 
      });
    }

    // === RESPOSTA DE SUCESSO (SEM A SENHA) ===
    const userData = {
      id: user.user_id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      created_at: user.created_at
    };

    console.log('✅ Login bem-sucedido para:', user.email);
    console.log('👤 Dados do usuário retornados:', userData);
    
    res.status(200).json({
      message: 'Login realizado com sucesso',
      user: userData
    });

  } catch (error) {
    console.error('💥 ERRO NO LOGIN:', {
      message: error.message,
      stack: error.stack,
      email: email
    });
    res.status(500).json({ 
      error: 'Erro interno do servidor' 
    });
  } finally {
    console.log('🔐 === FIM DO LOGIN ===\n');
  }
};

/**
 * VERIFICAR TOKEN/SESSÃO
 * Endpoint: GET /auth/me
 */
const verificarSessao = async (req, res) => {
  try {
    res.status(200).json({ 
      message: 'Sessão válida' 
    });
  } catch (error) {
    res.status(401).json({ 
      error: 'Sessão inválida' 
    });
  }
};

/**
 * LOGOUT
 * Endpoint: POST /auth/logout
 */
const logout = async (req, res) => {
  try {
    res.status(200).json({ 
      message: 'Logout realizado com sucesso' 
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Erro no logout' 
    });
  }
};

/**
 * CRIAR USUÁRIOS PADRÃO (DESENVOLVIMENTO)
 * Endpoint: POST /auth/seed
 */
const criarUsuariosPadrao = async (req, res) => {
  console.log('🌱 === CRIANDO USUÁRIOS PADRÃO ===');
  
  try {
    // Verificar se já existem usuários
    console.log('🔍 Verificando usuários existentes...');
    const existingUsers = await pool.query('SELECT COUNT(*) FROM Users');
    const userCount = parseInt(existingUsers.rows[0].count);
    console.log('📊 Usuários existentes:', userCount);

    if (userCount > 0) {
      console.log('ℹ️ Usuários já existem, não criando novos');
      return res.status(400).json({ 
        error: 'Usuários já existem no sistema' 
      });
    }

    // Hash das senhas padrão
    console.log('🔐 Gerando hashes das senhas...');
    const adminPasswordHash = await bcrypt.hash('admin123', 12);
    const userPasswordHash = await bcrypt.hash('user123', 12);
    
    console.log('🔐 Hash admin gerado:', adminPasswordHash.substring(0, 20) + '...');
    console.log('🔐 Hash user gerado:', userPasswordHash.substring(0, 20) + '...');

    // Criar usuário admin
    console.log('👨‍💼 Criando usuário administrador...');
    const adminQuery = `
      INSERT INTO Users (name, email, phone, role, password, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING user_id, name, email, role`;
    
    const adminValues = [
      'Administrador Sistema',
      'admin@sistema.com',
      '(11) 99999-0001',
      'admin',
      adminPasswordHash,
      'active'
    ];

    const adminResult = await pool.query(adminQuery, adminValues);
    console.log('✅ Admin criado:', adminResult.rows[0]);

    // Criar usuário normal
    console.log('👤 Criando usuário padrão...');
    const userQuery = `
      INSERT INTO Users (name, email, phone, role, password, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING user_id, name, email, role`;
    
    const userValues = [
      'João Silva',
      'user@sistema.com',
      '(11) 99999-0002',
      'user',
      userPasswordHash,
      'active'
    ];

    const userResult = await pool.query(userQuery, userValues);
    console.log('✅ User criado:', userResult.rows[0]);

    console.log('🎉 Usuários padrão criados com sucesso!');

    res.status(201).json({
      message: 'Usuários padrão criados com sucesso',
      users: [
        {
          ...adminResult.rows[0],
          login: 'admin@sistema.com / admin123'
        },
        {
          ...userResult.rows[0],
          login: 'user@sistema.com / user123'
        }
      ]
    });

  } catch (error) {
    console.error('💥 ERRO ao criar usuários padrão:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Erro ao criar usuários padrão: ' + error.message 
    });
  } finally {
    console.log('🌱 === FIM DA CRIAÇÃO ===\n');
  }
};

/**
 * DEBUG - VERIFICAR DADOS DO USUÁRIO
 * Endpoint: POST /auth/debug
 */
const debugUser = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ 
        error: 'Email é obrigatório' 
      });
    }

    const emailLower = email.toLowerCase().trim();
    const userQuery = `
      SELECT user_id, name, email, phone, role, status, created_at, updated_at
      FROM Users 
      WHERE email = $1`;
    
    const userResult = await pool.query(userQuery, [emailLower]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Usuário não encontrado',
        searched_email: emailLower
      });
    }

    const user = userResult.rows[0];

    res.status(200).json({
      found: true,
      user: {
        id: user.user_id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    });

  } catch (error) {
    console.error('Erro no debug:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
};

/**
 * DEBUG - VERIFICAR SE SENHA ESTÁ CORRETA
 * Endpoint: POST /auth/verify-password
 */
const verifyPassword = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email e senha são obrigatórios' 
      });
    }

    const emailLower = email.toLowerCase().trim();
    const userQuery = `
      SELECT user_id, name, email, password, status
      FROM Users 
      WHERE email = $1`;
    
    const userResult = await pool.query(userQuery, [emailLower]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Usuário não encontrado' 
      });
    }

    const user = userResult.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    res.status(200).json({
      email: user.email,
      password_correct: isPasswordValid,
      user_status: user.status,
      hash_exists: !!user.password,
      hash_length: user.password ? user.password.length : 0,
      hash_preview: user.password ? user.password.substring(0, 20) + '...' : null
    });

  } catch (error) {
    console.error('Erro na verificação de senha:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
};

/**
 * CORRIGIR SENHAS EM TEXTO PLANO
 * Endpoint: POST /auth/fix-passwords
 * Converte senhas em texto plano para hash bcrypt
 */
const corrigirSenhas = async (req, res) => {
  console.log('🔧 === CORRIGINDO SENHAS ===');
  
  try {
    // Buscar todos os usuários
    const usersQuery = 'SELECT user_id, email, password FROM Users';
    const usersResult = await pool.query(usersQuery);
    
    console.log(`📊 Encontrados ${usersResult.rows.length} usuários`);
    
    const fixes = [];
    
    for (const user of usersResult.rows) {
      console.log(`🔍 Verificando usuário: ${user.email}`);
      console.log(`🔐 Senha atual: ${user.password}`);
      
      // Verificar se a senha já é um hash bcrypt
      const isBcryptHash = user.password && user.password.startsWith('$2b$');
      
      if (!isBcryptHash) {
        console.log(`⚠️ Senha em texto plano detectada para: ${user.email}`);
        
        // Gerar hash da senha atual (assumindo que está em texto plano)
        const hashedPassword = await bcrypt.hash(user.password, 12);
        console.log(`🔐 Novo hash gerado: ${hashedPassword.substring(0, 20)}...`);
        
        // Atualizar no banco
        const updateQuery = 'UPDATE Users SET password = $1 WHERE user_id = $2';
        await pool.query(updateQuery, [hashedPassword, user.user_id]);
        
        fixes.push({
          user_id: user.user_id,
          email: user.email,
          old_password: user.password,
          new_hash_preview: hashedPassword.substring(0, 20) + '...'
        });
        
        console.log(`✅ Senha corrigida para: ${user.email}`);
      } else {
        console.log(`✅ Senha já está hashada para: ${user.email}`);
      }
    }
    
    console.log(`🎉 Correção concluída! ${fixes.length} senha(s) corrigida(s)`);
    
    res.status(200).json({
      message: 'Senhas corrigidas com sucesso',
      fixes_applied: fixes.length,
      fixed_users: fixes
    });
    
  } catch (error) {
    console.error('💥 Erro ao corrigir senhas:', error);
    res.status(500).json({
      error: 'Erro ao corrigir senhas: ' + error.message
    });
  } finally {
    console.log('🔧 === FIM DA CORREÇÃO ===\n');
  }
};

module.exports = {
  login,
  verificarSessao,
  logout,
  criarUsuariosPadrao,
  debugUser,
  verifyPassword,
  corrigirSenhas
};