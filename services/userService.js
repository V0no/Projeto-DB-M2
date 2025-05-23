// services/userService.js

const pool = require('../config/database');
const bcrypt = require('bcrypt');

// Função para obter todos os usuários
const getAllUsers = async () => {
  try {
    const query = `
      SELECT user_id, name, email, phone, role, created_at, updated_at
      FROM Users
      ORDER BY name`;
    
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    throw new Error('Erro ao obter usuários: ' + error.message);
  }
};

// Função para obter um usuário por ID
const getUserById = async (id) => {
  try {
    const query = `
      SELECT user_id, name, email, phone, role, created_at, updated_at
      FROM Users
      WHERE user_id = $1`;
    
    const result = await pool.query(query, [id]);
    return result.rows[0];
  } catch (error) {
    throw new Error('Erro ao obter usuário: ' + error.message);
  }
};

// Função para criar um novo usuário
const createUser = async (userData) => {
  const { name, email, password, phone, role } = userData;
  
  try {
    // Criptografar a senha
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    const query = `
      INSERT INTO Users (name, email, password, phone, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING user_id, name, email, phone, role, created_at, updated_at`;
    
    const values = [name, email, hashedPassword, phone, role || 'user'];
    const result = await pool.query(query, values);
    
    return result.rows[0];
  } catch (error) {
    // Verificar se é um erro de violação de unicidade no email
    if (error.code === '23505' && error.constraint === 'users_email_key') {
      throw new Error('Email já está em uso');
    }
    throw new Error('Erro ao criar usuário: ' + error.message);
  }
};

// Função para atualizar um usuário por ID
const updateUser = async (id, userData) => {
  const { name, email, phone, role } = userData;
  
  try {
    const query = `
      UPDATE Users
      SET name = $1, email = $2, phone = $3, role = $4, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $5
      RETURNING user_id, name, email, phone, role, created_at, updated_at`;
    
    const values = [name, email, phone, role, id];
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      throw new Error('Usuário não encontrado');
    }
    
    return result.rows[0];
  } catch (error) {
    // Verificar se é um erro de violação de unicidade no email
    if (error.code === '23505' && error.constraint === 'users_email_key') {
      throw new Error('Email já está em uso');
    }
    throw new Error('Erro ao atualizar usuário: ' + error.message);
  }
};

// Função para alterar a senha de um usuário
const changePassword = async (id, currentPassword, newPassword) => {
  try {
    // Verificar se o usuário existe e obter a senha atual
    const userQuery = 'SELECT password FROM Users WHERE user_id = $1';
    const userResult = await pool.query(userQuery, [id]);
    
    if (userResult.rows.length === 0) {
      throw new Error('Usuário não encontrado');
    }
    
    // Verificar se a senha atual está correta
    const isMatch = await bcrypt.compare(currentPassword, userResult.rows[0].password);
    if (!isMatch) {
      throw new Error('Senha atual incorreta');
    }
    
    // Criptografar a nova senha
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Atualizar a senha
    const updateQuery = `
      UPDATE Users
      SET password = $1, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $2
      RETURNING user_id`;
      
    await pool.query(updateQuery, [hashedPassword, id]);
    
    return { success: true, message: 'Senha alterada com sucesso' };
  } catch (error) {
    throw new Error(error.message);
  }
};

// Função para deletar um usuário por ID
const deleteUser = async (id) => {
  try {
    // Verificar se o usuário tem reservas associadas
    const checkQuery = 'SELECT COUNT(*) FROM Bookings WHERE user_id = $1';
    const checkResult = await pool.query(checkQuery, [id]);
    
    if (parseInt(checkResult.rows[0].count) > 0) {
      throw new Error('Não é possível excluir o usuário pois existem reservas associadas a ele');
    }
    
    const query = 'DELETE FROM Users WHERE user_id = $1 RETURNING user_id, name, email';
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      throw new Error('Usuário não encontrado');
    }
    
    return result.rows[0];
  } catch (error) {
    throw new Error(error.message);
  }
};

// Função para autenticar um usuário (login)
const authenticateUser = async (email, password) => {
  try {
    const query = 'SELECT user_id, name, email, password, role FROM Users WHERE email = $1';
    const result = await pool.query(query, [email]);
    
    if (result.rows.length === 0) {
      throw new Error('Email ou senha incorretos');
    }
    
    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      throw new Error('Email ou senha incorretos');
    }
    
    // Retornar usuário sem a senha
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Função para listar todas as reservas de um usuário
const getUserBookings = async (id) => {
  try {
    const query = `
      SELECT b.*, r.name as room_name
      FROM Bookings b
      JOIN Rooms r ON b.room_id = r.room_id
      WHERE b.user_id = $1
      ORDER BY b.start_time DESC`;
      
    const result = await pool.query(query, [id]);
    return result.rows;
  } catch (error) {
    throw new Error('Erro ao listar reservas do usuário: ' + error.message);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  changePassword,
  deleteUser,
  authenticateUser,
  getUserBookings
};