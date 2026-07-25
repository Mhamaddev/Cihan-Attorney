import pool from '../config/database.js';

// Columns returned to callers. due_date is formatted as a plain YYYY-MM-DD
// string rather than a JS Date: the pg driver converts DATE to a Date object
// in the server's local timezone, which shifts the calendar day by one when
// serialized to JSON in a non-UTC timezone.
const RETURNING_COLUMNS = `
  id, user_id, case_id, title,
  TO_CHAR(due_date, 'YYYY-MM-DD') AS due_date,
  is_completed, created_at, updated_at
`;

// Fields a client is allowed to update. Used as an allow-list when building
// the dynamic SET clause, so a key from the request body can never become SQL.
const UPDATABLE_FIELDS = ['title', 'due_date', 'case_id', 'is_completed'];

class Todo {
  static async findAllByUser(userId) {
    const query = `
      SELECT
        t.id, t.user_id, t.case_id, t.title,
        TO_CHAR(t.due_date, 'YYYY-MM-DD') AS due_date,
        t.is_completed, t.created_at, t.updated_at,
        c.request_type AS case_request_type
      FROM todos t
      LEFT JOIN cases c ON t.case_id = c.id
      WHERE t.user_id = $1
      ORDER BY t.due_date ASC NULLS LAST, t.created_at DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  static async findByIdForUser(id, userId) {
    const query = `
      SELECT ${RETURNING_COLUMNS}
      FROM todos
      WHERE id = $1 AND user_id = $2
    `;
    const result = await pool.query(query, [id, userId]);
    return result.rows[0];
  }

  static async create(userId, { title, due_date, case_id }) {
    const query = `
      INSERT INTO todos (user_id, title, due_date, case_id)
      VALUES ($1, $2, $3, $4)
      RETURNING ${RETURNING_COLUMNS}
    `;
    const result = await pool.query(query, [userId, title, due_date ?? null, case_id ?? null]);
    return result.rows[0];
  }

  static async update(id, userId, fields) {
    const setClauses = [];
    const values = [];
    let position = 1;

    for (const field of UPDATABLE_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(fields, field)) {
        setClauses.push(`${field} = $${position}`);
        values.push(fields[field]);
        position += 1;
      }
    }

    if (setClauses.length === 0) {
      return await this.findByIdForUser(id, userId);
    }

    setClauses.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id, userId);

    const query = `
      UPDATE todos
      SET ${setClauses.join(', ')}
      WHERE id = $${position} AND user_id = $${position + 1}
      RETURNING ${RETURNING_COLUMNS}
    `;
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async delete(id, userId) {
    const query = `DELETE FROM todos WHERE id = $1 AND user_id = $2 RETURNING id`;
    const result = await pool.query(query, [id, userId]);
    return result.rows[0];
  }
}

export default Todo;
