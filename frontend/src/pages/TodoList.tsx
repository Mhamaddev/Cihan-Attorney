import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrashIcon } from '@heroicons/react/24/outline';
import { getTodos, createTodo, updateTodo, deleteTodo, getAllCases } from '../services/api';
import type { Todo, Case } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

// Local calendar day as YYYY-MM-DD. Built from local date parts rather than
// toISOString(), which converts to UTC and can report yesterday or tomorrow
// depending on the viewer's timezone.
const todayKey = (): string => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
};

// due_date arrives as a plain YYYY-MM-DD string, so lexical comparison is
// also chronological. A completed item is never styled as overdue.
const isOverdue = (todo: Todo): boolean =>
  !todo.is_completed && !!todo.due_date && todo.due_date < todayKey();

function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cases, setCases] = useState<Case[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newCaseId, setNewCaseId] = useState('');
  const [saving, setSaving] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    loadTodos();
    loadCases();
  }, []);

  const loadTodos = async () => {
    try {
      setLoading(true);
      const data = await getTodos();
      setTodos(data);
      setError('');
    } catch (err) {
      setError(t.todos.loadError);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadCases = async () => {
    try {
      const data = await getAllCases();
      setCases(data);
    } catch (err) {
      // The case dropdown is optional; failing to load cases must not block
      // the todo list itself, so this is logged rather than surfaced.
      console.error(err);
    }
  };

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newTitle.trim()) return;

    try {
      setSaving(true);
      await createTodo({
        title: newTitle.trim(),
        due_date: newDueDate || null,
        case_id: newCaseId ? Number(newCaseId) : null,
      });
      setNewTitle('');
      setNewDueDate('');
      setNewCaseId('');
      setError('');
      // Refetch so the new item lands in its correct sorted position and
      // picks up the joined case name.
      await loadTodos();
    } catch (err) {
      setError(t.todos.saveError);
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (todo: Todo) => {
    try {
      const updated = await updateTodo(todo.id, { is_completed: !todo.is_completed });
      // Patch in place rather than refetching: the row keeps its exact
      // position, which is what "stay in place, struck through" means.
      // Spreading over the existing item preserves case_request_type, which
      // the update response does not include.
      setTodos((prev) => prev.map((item) => (item.id === todo.id ? { ...item, ...updated } : item)));
      setError('');
    } catch (err) {
      setError(t.todos.saveError);
      console.error(err);
    }
  };

  const handleDelete = async (todo: Todo) => {
    if (!window.confirm(t.todos.confirmDelete)) return;

    try {
      await deleteTodo(todo.id);
      setTodos((prev) => prev.filter((item) => item.id !== todo.id));
      setError('');
    } catch (err) {
      setError(t.todos.deleteError);
      console.error(err);
    }
  };

  const openCount = todos.filter((todo) => !todo.is_completed).length;

  if (loading) {
    return <div className="card">{t.todos.loading}</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
          {t.todos.title}
        </h2>
        <p style={{ color: 'var(--text-tertiary)' }}>
          {t.todos.subtitle} &middot; {t.todos.openCount.replace('{count}', String(openCount))}
        </p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleAdd} className="card" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          className="form-control"
          style={{ flex: '2 1 220px', width: 'auto' }}
          placeholder={t.todos.addPlaceholder}
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          maxLength={255}
        />
        <input
          type="date"
          className="form-control"
          style={{ flex: '1 1 150px', width: 'auto' }}
          aria-label={t.todos.dueDate}
          value={newDueDate}
          onChange={(e) => setNewDueDate(e.target.value)}
        />
        <select
          className="form-control"
          style={{ flex: '1 1 170px', width: 'auto' }}
          aria-label={t.todos.noCase}
          value={newCaseId}
          onChange={(e) => setNewCaseId(e.target.value)}
        >
          <option value="">{t.todos.noCase}</option>
          {cases.map((caseItem) => (
            <option key={caseItem.id} value={caseItem.id}>
              #{caseItem.id} — {caseItem.request_type}
            </option>
          ))}
        </select>
        <button type="submit" className="btn btn-primary" disabled={saving || !newTitle.trim()}>
          {saving ? t.todos.adding : t.todos.add}
        </button>
      </form>

      <div className="card">
        {todos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
              {t.todos.empty}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>
              {t.todos.emptyHint}
            </div>
          </div>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {todos.map((todo) => (
              <li
                key={todo.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 0',
                  borderBottom: '1px solid var(--border-color)',
                }}
              >
                <input
                  type="checkbox"
                  checked={todo.is_completed}
                  onChange={() => handleToggle(todo)}
                  style={{ width: '18px', height: '18px', flexShrink: 0, cursor: 'pointer' }}
                />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      color: 'var(--text-primary)',
                      fontWeight: 500,
                      textDecoration: todo.is_completed ? 'line-through' : 'none',
                      opacity: todo.is_completed ? 0.55 : 1,
                    }}
                  >
                    {todo.title}
                  </div>

                  {todo.case_id && (
                    <Link
                      to={`/cases/${todo.case_id}`}
                      style={{ fontSize: '13px', color: 'var(--primary-color)', textDecoration: 'none' }}
                    >
                      #{todo.case_id}
                      {todo.case_request_type ? ` — ${todo.case_request_type}` : ''}
                    </Link>
                  )}
                </div>

                {todo.due_date && (
                  <span
                    className="badge"
                    style={{
                      flexShrink: 0,
                      backgroundColor: isOverdue(todo) ? 'var(--danger-tint)' : 'var(--bg-tertiary)',
                      color: isOverdue(todo) ? 'var(--danger-color)' : 'var(--text-secondary)',
                    }}
                    title={isOverdue(todo) ? t.todos.overdue : ''}
                  >
                    {todo.due_date}
                  </span>
                )}

                <button
                  type="button"
                  className="btn-icon btn-icon-delete"
                  onClick={() => handleDelete(todo)}
                  title={t.todos.delete}
                  style={{ flexShrink: 0 }}
                >
                  <TrashIcon style={{ width: '16px', height: '16px' }} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default TodoList;
