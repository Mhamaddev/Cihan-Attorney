import pool from '../config/database.js';

class User {
  static async findAll() {
    const query = `
      SELECT id, username, email, full_name, role, is_active, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async findById(id) {
    const query = `
      SELECT id, username, email, full_name, role, is_active, created_at, updated_at
      FROM users
      WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findByUsername(username) {
    const query = `
      SELECT id, username, email, password_hash, full_name, role, is_active, created_at, updated_at
      FROM users
      WHERE username = $1
    `;
    const result = await pool.query(query, [username]);
    return result.rows[0];
  }

  static async findByEmail(email) {
    const query = `
      SELECT id, username, email, password_hash, full_name, role, is_active, created_at, updated_at
      FROM users
      WHERE email = $1
    `;
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  static async create(username, email, passwordHash, fullName, role = 'lawyer') {
    const query = `
      INSERT INTO users (username, email, password_hash, full_name, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, username, email, full_name, role, is_active, created_at, updated_at
    `;
    const result = await pool.query(query, [username, email, passwordHash, fullName, role]);
    return result.rows[0];
  }

  static async update(id, { username, email, fullName, role, isActive }) {
    const query = `
      UPDATE users
      SET 
        username = COALESCE($1, username),
        email = COALESCE($2, email),
        full_name = COALESCE($3, full_name),
        role = COALESCE($4, role),
        is_active = COALESCE($5, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING id, username, email, full_name, role, is_active, created_at, updated_at
    `;
    const result = await pool.query(query, [username, email, fullName, role, isActive, id]);
    return result.rows[0];
  }

  static async updatePassword(id, passwordHash) {
    const query = `
      UPDATE users
      SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, username, email, full_name, role
    `;
    const result = await pool.query(query, [passwordHash, id]);
    return result.rows[0];
  }

  static async delete(id) {
    const query = `DELETE FROM users WHERE id = $1 RETURNING id`;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async toggleActive(id, isActive) {
    const query = `
      UPDATE users
      SET is_active = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, username, is_active
    `;
    const result = await pool.query(query, [isActive, id]);
    return result.rows[0];
  }
}

export default User;
