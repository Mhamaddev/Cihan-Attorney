import pool from '../config/database.js';

class Case {
  static async create(caseData) {
    const { request_type, is_called_for_court, applicant, wanted, court_dates, expenses } = caseData;
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Insert case
      const caseResult = await client.query(
        'INSERT INTO cases (request_type, is_called_for_court) VALUES ($1, $2) RETURNING *',
        [request_type, is_called_for_court || false]
      );
      const caseId = caseResult.rows[0].id;
      
      // Insert applicant
      if (applicant) {
        await client.query(
          'INSERT INTO applicants (case_id, name, phone_number, address) VALUES ($1, $2, $3, $4)',
          [caseId, applicant.name, applicant.phone_number, applicant.address]
        );
      }
      
      // Insert wanted
      if (wanted) {
        await client.query(
          'INSERT INTO wanted (case_id, name, phone_number, address) VALUES ($1, $2, $3, $4)',
          [caseId, wanted.name, wanted.phone_number, wanted.address]
        );
      }
      
      // Insert court dates
      if (court_dates && court_dates.length > 0) {
        for (const date of court_dates) {
          await client.query(
            'INSERT INTO court_dates (case_id, interview_date, notes) VALUES ($1, $2, $3)',
            [caseId, date.interview_date, date.notes]
          );
        }
      }
      
      // Insert expenses
      if (expenses && expenses.length > 0) {
        for (const expense of expenses) {
          await client.query(
            'INSERT INTO expenses (case_id, expense_name, amount, expense_date, note) VALUES ($1, $2, $3, $4, $5)',
            [caseId, expense.expense_name, expense.amount, expense.expense_date, expense.note]
          );
        }
      }
      
      await client.query('COMMIT');
      return await this.findById(caseId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async findAll() {
    const query = `
      SELECT 
        c.*,
        json_agg(DISTINCT jsonb_build_object('id', a.id, 'name', a.name, 'phone_number', a.phone_number, 'address', a.address)) 
          FILTER (WHERE a.id IS NOT NULL) as applicants,
        json_agg(DISTINCT jsonb_build_object('id', w.id, 'name', w.name, 'phone_number', w.phone_number, 'address', w.address)) 
          FILTER (WHERE w.id IS NOT NULL) as wanted,
        json_agg(DISTINCT jsonb_build_object('id', cd.id, 'interview_date', cd.interview_date, 'notes', cd.notes)) 
          FILTER (WHERE cd.id IS NOT NULL) as court_dates,
        json_agg(DISTINCT jsonb_build_object('id', e.id, 'expense_name', e.expense_name, 'amount', e.amount, 'expense_date', e.expense_date, 'note', e.note)) 
          FILTER (WHERE e.id IS NOT NULL) as expenses,
        json_agg(DISTINCT jsonb_build_object('id', cf.id, 'file_name', cf.file_name, 'file_path', cf.file_path, 'file_type', cf.file_type, 'category', cf.category, 'uploaded_at', cf.uploaded_at)) 
          FILTER (WHERE cf.id IS NOT NULL) as files
      FROM cases c
      LEFT JOIN applicants a ON c.id = a.case_id
      LEFT JOIN wanted w ON c.id = w.case_id
      LEFT JOIN court_dates cd ON c.id = cd.case_id
      LEFT JOIN expenses e ON c.id = e.case_id
      LEFT JOIN case_files cf ON c.id = cf.case_id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `;
    
    const result = await pool.query(query);
    return result.rows;
  }

  static async findById(id) {
    const query = `
      SELECT 
        c.*,
        json_agg(DISTINCT jsonb_build_object('id', a.id, 'name', a.name, 'phone_number', a.phone_number, 'address', a.address)) 
          FILTER (WHERE a.id IS NOT NULL) as applicants,
        json_agg(DISTINCT jsonb_build_object('id', w.id, 'name', w.name, 'phone_number', w.phone_number, 'address', w.address)) 
          FILTER (WHERE w.id IS NOT NULL) as wanted,
        json_agg(DISTINCT jsonb_build_object('id', cd.id, 'interview_date', cd.interview_date, 'notes', cd.notes)) 
          FILTER (WHERE cd.id IS NOT NULL) as court_dates,
        json_agg(DISTINCT jsonb_build_object('id', e.id, 'expense_name', e.expense_name, 'amount', e.amount, 'expense_date', e.expense_date, 'note', e.note)) 
          FILTER (WHERE e.id IS NOT NULL) as expenses,
        json_agg(DISTINCT jsonb_build_object('id', cf.id, 'file_name', cf.file_name, 'file_path', cf.file_path, 'file_type', cf.file_type, 'category', cf.category, 'uploaded_at', cf.uploaded_at)) 
          FILTER (WHERE cf.id IS NOT NULL) as files
      FROM cases c
      LEFT JOIN applicants a ON c.id = a.case_id
      LEFT JOIN wanted w ON c.id = w.case_id
      LEFT JOIN court_dates cd ON c.id = cd.case_id
      LEFT JOIN expenses e ON c.id = e.case_id
      LEFT JOIN case_files cf ON c.id = cf.case_id
      WHERE c.id = $1
      GROUP BY c.id
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async update(id, caseData) {
    const { request_type, is_called_for_court, status } = caseData;
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      await client.query(
        'UPDATE cases SET request_type = $1, is_called_for_court = $2, status = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4',
        [request_type, is_called_for_court, status, id]
      );
      
      await client.query('COMMIT');
      return await this.findById(id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async delete(id) {
    await pool.query('DELETE FROM cases WHERE id = $1', [id]);
  }

  static async addCourtDate(caseId, courtDateData) {
    const { interview_date, notes } = courtDateData;
    const result = await pool.query(
      'INSERT INTO court_dates (case_id, interview_date, notes) VALUES ($1, $2, $3) RETURNING *',
      [caseId, interview_date, notes]
    );
    return result.rows[0];
  }

  static async addExpense(caseId, expenseData) {
    const { expense_name, amount, expense_date, note } = expenseData;
    const result = await pool.query(
      'INSERT INTO expenses (case_id, expense_name, amount, expense_date, note) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [caseId, expense_name, amount, expense_date, note]
    );
    return result.rows[0];
  }

  static async addFile(caseId, fileData) {
    const { file_name, file_path, file_type, category } = fileData;
    const result = await pool.query(
      'INSERT INTO case_files (case_id, file_name, file_path, file_type, category) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [caseId, file_name, file_path, file_type, category]
    );
    return result.rows[0];
  }

  static async deleteCourtDate(id) {
    await pool.query('DELETE FROM court_dates WHERE id = $1', [id]);
  }

  static async deleteExpense(id) {
    await pool.query('DELETE FROM expenses WHERE id = $1', [id]);
  }

  static async deleteFile(id) {
    const result = await pool.query('SELECT file_path FROM case_files WHERE id = $1', [id]);
    await pool.query('DELETE FROM case_files WHERE id = $1', [id]);
    return result.rows[0];
  }
}

export default Case;
