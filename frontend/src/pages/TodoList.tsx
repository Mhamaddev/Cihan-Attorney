import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTodos } from '../services/api';
import type { Todo } from '../types';
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
  const { t } = useLanguage();

  useEffect(() => {
    loadTodos();
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
                  readOnly
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
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default TodoList;
