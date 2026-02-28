import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScaleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        login(data.token, data.user);
        navigate('/');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-secondary)',
        padding: '20px',
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: '420px',
          width: '100%',
          padding: '40px',
        }}
      >
        {/* Logo & Title */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              marginBottom: '16px',
            }}
          >
            <ScaleIcon
              style={{
                width: '48px',
                height: '48px',
                color: 'var(--primary-color)',
              }}
            />
            <h1
              style={{
                margin: 0,
                fontSize: '32px',
                fontWeight: '700',
                color: 'var(--text-primary)',
              }}
            >
              {t.system?.name || 'Cihan Attorney'}
            </h1>
          </div>
          <p
            style={{
              margin: 0,
              fontSize: '16px',
              color: 'var(--text-tertiary)',
            }}
          >
            {t.login?.subtitle || 'Sign in to your account'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div
            className="alert alert-error"
            style={{
              marginBottom: '20px',
              padding: '12px 16px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.1)',
              color: 'var(--danger-color)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
            }}
          >
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">{t.login?.username || 'Username'}</label>
            <input
              type="text"
              id="username"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t.login?.usernamePlaceholder || 'Enter your username'}
              required
              autoComplete="username"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">{t.login?.password || 'Password'}</label>
            <input
              type="password"
              id="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t.login?.passwordPlaceholder || 'Enter your password'}
              required
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              fontWeight: '600',
              marginTop: '8px',
            }}
          >
            {loading ? (t.login?.signingIn || 'Signing in...') : (t.login?.signIn || 'Sign In')}
          </button>
        </form>

        {/* Demo Credentials */}
        <div
          style={{
            marginTop: '24px',
            padding: '16px',
            background: 'var(--bg-tertiary)',
            borderRadius: '8px',
            fontSize: '14px',
          }}
        >
          <div
            style={{
              fontWeight: '600',
              marginBottom: '8px',
              color: 'var(--text-secondary)',
            }}
          >
            {t.login?.demoCredentials || 'Demo Credentials:'}
          </div>
          <div style={{ color: 'var(--text-tertiary)' }}>
            <div>
              <strong>Username:</strong> admin
            </div>
            <div>
              <strong>Password:</strong> admin123
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
