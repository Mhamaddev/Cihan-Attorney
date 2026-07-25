import pool from '../config/database.js';
import Todo from '../models/Todo.js';

const MAX_TITLE_LENGTH = 255;

// Route params arrive as strings. Postgres raises a type error on a
// non-numeric id, so reject it here and let the caller return 404 —
// a malformed id is indistinguishable from a missing row to a client.
const parseId = (raw) => {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const parseTitle = (raw) => {
  if (typeof raw !== 'string') {
    return { error: 'Title is required' };
  }
  const title = raw.trim();
  if (!title) {
    return { error: 'Title is required' };
  }
  if (title.length > MAX_TITLE_LENGTH) {
    return { error: `Title must be ${MAX_TITLE_LENGTH} characters or fewer` };
  }
  return { value: title };
};

// null is valid and clears the field; that is how a user removes a due date.
const parseDueDate = (raw) => {
  if (raw === null || raw === '') {
    return { value: null };
  }
  if (typeof raw !== 'string' || Number.isNaN(Date.parse(raw))) {
    return { error: 'Due date must be a valid date' };
  }
  return { value: raw };
};

// null is valid and unlinks the case.
const parseCaseId = async (raw) => {
  if (raw === null || raw === '') {
    return { value: null };
  }
  const caseId = Number(raw);
  if (!Number.isInteger(caseId) || caseId <= 0) {
    return { error: 'Case id must be a positive integer' };
  }
  const result = await pool.query('SELECT id FROM cases WHERE id = $1', [caseId]);
  if (result.rows.length === 0) {
    return { error: 'Case not found' };
  }
  return { value: caseId };
};

const parseIsCompleted = (raw) => {
  if (typeof raw !== 'boolean') {
    return { error: 'is_completed must be a boolean' };
  }
  return { value: raw };
};

export const getTodos = async (req, res) => {
  try {
    const todos = await Todo.findAllByUser(req.user.id);
    res.json(todos);
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ message: 'Error fetching todos', error: error.message });
  }
};

export const createTodo = async (req, res) => {
  try {
    const title = parseTitle(req.body.title);
    if (title.error) {
      return res.status(400).json({ message: title.error });
    }

    const payload = { title: title.value, due_date: null, case_id: null };

    if (req.body.due_date !== undefined) {
      const dueDate = parseDueDate(req.body.due_date);
      if (dueDate.error) {
        return res.status(400).json({ message: dueDate.error });
      }
      payload.due_date = dueDate.value;
    }

    if (req.body.case_id !== undefined) {
      const caseId = await parseCaseId(req.body.case_id);
      if (caseId.error) {
        return res.status(400).json({ message: caseId.error });
      }
      payload.case_id = caseId.value;
    }

    // Owner always comes from the verified token, never from the body.
    const todo = await Todo.create(req.user.id, payload);
    res.status(201).json(todo);
  } catch (error) {
    console.error('Error creating todo:', error);
    res.status(500).json({ message: 'Error creating todo', error: error.message });
  }
};

export const updateTodo = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    // Scoped by owner: another user's todo reads as missing, not forbidden.
    const existing = await Todo.findByIdForUser(id, req.user.id);
    if (!existing) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    const fields = {};

    if (req.body.title !== undefined) {
      const title = parseTitle(req.body.title);
      if (title.error) {
        return res.status(400).json({ message: title.error });
      }
      fields.title = title.value;
    }

    if (req.body.due_date !== undefined) {
      const dueDate = parseDueDate(req.body.due_date);
      if (dueDate.error) {
        return res.status(400).json({ message: dueDate.error });
      }
      fields.due_date = dueDate.value;
    }

    if (req.body.case_id !== undefined) {
      const caseId = await parseCaseId(req.body.case_id);
      if (caseId.error) {
        return res.status(400).json({ message: caseId.error });
      }
      fields.case_id = caseId.value;
    }

    if (req.body.is_completed !== undefined) {
      const isCompleted = parseIsCompleted(req.body.is_completed);
      if (isCompleted.error) {
        return res.status(400).json({ message: isCompleted.error });
      }
      fields.is_completed = isCompleted.value;
    }

    const todo = await Todo.update(id, req.user.id, fields);
    res.json(todo);
  } catch (error) {
    console.error('Error updating todo:', error);
    res.status(500).json({ message: 'Error updating todo', error: error.message });
  }
};

export const deleteTodo = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    const deleted = await Todo.delete(id, req.user.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    res.json({ message: 'Todo deleted successfully' });
  } catch (error) {
    console.error('Error deleting todo:', error);
    res.status(500).json({ message: 'Error deleting todo', error: error.message });
  }
};
