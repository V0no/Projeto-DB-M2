// models/User.js
const db = require('../config/database'); // Ajustei para usar database.js conforme configurado

class User {
  // Obter todos os usuários
  static async getAll() {
    const query = `
      SELECT user_id, name, email, phone, role, created_at, updated_at
      FROM Users
      ORDER BY name`;
    
    const result = await db.query(query);
    return result.rows;
  }

  // Obter usuário por ID
  static async getById(id) {
    const query = `
      SELECT user_id, name, email, phone, role, created_at, updated_at
      FROM Users
      WHERE user_id = $1`;
    
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  // Obter usuário por e-mail
  static async getByEmail(email) {
    const query = `
      SELECT user_id, name, email, password, phone, role, created_at, updated_at
      FROM Users
      WHERE email = $1`;
    
    const result = await db.query(query, [email]);
    return result.rows[0];
  }

  // Criar novo usuário
  static async create(data) {
    const { name, email, password, phone, role } = data;
    
    const query = `
      INSERT INTO Users (name, email, password, phone, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING user_id, name, email, phone, role, created_at, updated_at`;
    
    const values = [name, email, password, phone, role || 'user'];
    const result = await db.query(query, values);
    
    return result.rows[0];
  }

  // Atualizar usuário
  static async update(id, data) {
    const { name, email, phone, role } = data;
    
    const query = `
      UPDATE Users
      SET name = $1, email = $2, phone = $3, role = $4, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $5
      RETURNING user_id, name, email, phone, role, created_at, updated_at`;
    
    const values = [name, email, phone, role, id];
    const result = await db.query(query, values);
    
    return result.rows[0];
  }

  // Atualizar senha do usuário
  static async updatePassword(id, password) {
    const query = `
      UPDATE Users
      SET password = $1, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $2
      RETURNING user_id`;
    
    const result = await db.query(query, [password, id]);
    return result.rows[0];
  }

  // Excluir usuário
  static async delete(id) {
    // Primeiro verificamos se o usuário tem reservas associadas
    const checkQuery = 'SELECT COUNT(*) FROM Bookings WHERE user_id = $1';
    const checkResult = await db.query(checkQuery, [id]);
    
    if (parseInt(checkResult.rows[0].count) > 0) {
      throw new Error('Não é possível excluir o usuário pois existem reservas associadas a ele');
    }
    
    const query = 'DELETE FROM Users WHERE user_id = $1 RETURNING user_id';
    const result = await db.query(query, [id]);
    
    return result.rows[0];
  }

  // Obter todas as reservas de um usuário
  static async getBookings(id) {
    const query = `
      SELECT b.*, r.name as room_name, r.capacity, r.location
      FROM Bookings b
      JOIN Rooms r ON b.room_id = r.room_id
      WHERE b.user_id = $1
      ORDER BY b.start_time DESC`;
    
    const result = await db.query(query, [id]);
    return result.rows;
  }

  // Verificar credenciais para autenticação (login)
  static async checkCredentials(email, password) {
    const user = await this.getByEmail(email);
    
    // Se o usuário não existe ou a senha está incorreta
    if (!user || user.password !== password) {
      return null;
    }
    
    // Remover a senha do objeto antes de retornar
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

module.exports = User;