import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bars3Icon,
  BellIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  ScaleIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  LanguageIcon,
  SunIcon,
  MoonIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

interface TopbarProps {
  toggleSidebar: () => void;
}

function Topbar({ toggleSidebar }: TopbarProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const languages = [
    { code: 'en' as const, name: 'English', flag: '🇬🇧' },
    { code: 'ku' as const, name: 'کوردی', flag: '🇮🇶' },
    { code: 'ar' as const, name: 'العربية', flag: '🇸🇦' },
  ];

  return (
    <header className="topbar">
      <button 
        className="topbar-menu-btn"
        onClick={toggleSidebar}
        aria-label="Toggle menu"
      >
        <Bars3Icon className="hamburger-icon" style={{ width: '24px', height: '24px' }} />
      </button>

      <div className="topbar-title">
        <h1>Case Management System</h1>
      </div>

      <div className="topbar-actions">
        {/* Theme Toggle */}
        <button 
          className="topbar-btn"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {theme === 'light' ? (
            <MoonIcon style={{ width: '20px', height: '20px' }} />
          ) : (
            <SunIcon style={{ width: '20px', height: '20px' }} />
          )}
        </button>

        {/* Language Switcher */}
        <div style={{ position: 'relative' }}>
          <button 
            className="topbar-btn"
            onClick={() => setShowLanguageMenu(!showLanguageMenu)}
            aria-label="Change language"
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <LanguageIcon style={{ width: '20px', height: '20px' }} />
            <span style={{ fontSize: '12px', fontWeight: '600' }}>
              {language.toUpperCase()}
            </span>
          </button>

          {showLanguageMenu && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: '0',
              marginTop: '8px',
              background: 'var(--bg-primary)',
              borderRadius: '12px',
              boxShadow: '0 4px 12px var(--shadow-color)',
              border: '1px solid var(--border-color)',
              minWidth: '180px',
              zIndex: 1000,
              overflow: 'hidden'
            }}>
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    setShowLanguageMenu(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: 'none',
                    background: language === lang.code ? 'var(--bg-tertiary)' : 'var(--bg-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: language === lang.code ? '600' : '400',
                    color: 'var(--text-primary)',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = language === lang.code ? 'var(--bg-tertiary)' : 'var(--bg-primary)'}
                >
                  <span style={{ fontSize: '20px' }}>{lang.flag}</span>
                  <span>{lang.name}</span>
                  {language === lang.code && (
                    <span style={{ marginLeft: 'auto', color: 'var(--primary-color)' }}>✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <button 
          className="topbar-btn"
          onClick={() => setShowNotifications(!showNotifications)}
          aria-label="Notifications"
        >
          <BellIcon style={{ width: '20px', height: '20px' }} />
          <span className="topbar-badge">3</span>
        </button>

        <button className="topbar-btn" aria-label="Settings">
          <Cog6ToothIcon style={{ width: '20px', height: '20px' }} />
        </button>

        <div className="topbar-user">
          <UserCircleIcon className="topbar-user-avatar" style={{ width: '36px', height: '36px', color: 'var(--gray-600)' }} />
        </div>
      </div>

      {showNotifications && (
        <div className="topbar-dropdown">
          <div className="topbar-dropdown-header">
            <h3>{t.topbar.notifications}</h3>
            <button onClick={() => setShowNotifications(false)}>✕</button>
          </div>
          <div className="topbar-dropdown-body">
            <div className="notification-item">
              <div className="notification-icon">
                <ScaleIcon style={{ width: '20px', height: '20px', color: 'var(--primary-color)' }} />
              </div>
              <div className="notification-content">
                <p>{t.topbar.notification1}</p>
                <span className="notification-time">2 hours ago</span>
              </div>
            </div>
            <div className="notification-item">
              <div className="notification-icon">
                <DocumentTextIcon style={{ width: '20px', height: '20px', color: 'var(--primary-color)' }} />
              </div>
              <div className="notification-content">
                <p>{t.topbar.notification2}</p>
                <span className="notification-time">5 hours ago</span>
              </div>
            </div>
            <div className="notification-item">
              <div className="notification-icon">
                <CurrencyDollarIcon style={{ width: '20px', height: '20px', color: 'var(--primary-color)' }} />
              </div>
              <div className="notification-content">
                <p>{t.topbar.notification3}</p>
                <span className="notification-time">1 day ago</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Menu */}
      <div className="topbar-icon-wrapper" style={{ position: 'relative' }}>
        <button
          className="topbar-icon"
          onClick={() => setShowUserMenu(!showUserMenu)}
          title="User Menu"
        >
          <div style={{ 
            width: '40px', 
            height: '40px', 
            borderRadius: '50%', 
            background: 'var(--primary-color)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'white',
            fontWeight: '600',
            fontSize: '16px'
          }}>
            {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
          </div>
        </button>

        {showUserMenu && (
          <div className="topbar-dropdown" style={{ right: 0, minWidth: '250px' }}>
            <div className="topbar-dropdown-header">
              <h4>User Profile</h4>
            </div>
            <div className="topbar-dropdown-body">
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                  {user?.fullName || 'User'}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {user?.email}
                </div>
                <div style={{ 
                  display: 'inline-block', 
                  marginTop: '8px',
                  padding: '2px 8px', 
                  borderRadius: '4px', 
                  fontSize: '11px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  background: user?.role === 'admin' ? 'var(--primary-color)' : 'var(--border-color)',
                  color: user?.role === 'admin' ? 'white' : 'var(--text-primary)'
                }}>
                  {user?.role}
                </div>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: 'none',
                  background: 'transparent',
                  color: '#dc2626',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hover-bg)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <ArrowRightOnRectangleIcon style={{ width: '20px', height: '20px' }} />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default Topbar;
