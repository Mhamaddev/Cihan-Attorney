import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bars3Icon,
  LanguageIcon,
  SunIcon,
  MoonIcon,
  BellIcon,
  ScaleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import type { AppNotification } from '../hooks/useNotifications';

interface TopbarProps {
  toggleSidebar: () => void;
}

/** Only one header dropdown may be open at a time. */
type OpenMenu = 'language' | 'notifications' | 'user' | null;

function Topbar({ toggleSidebar }: TopbarProps) {
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { notifications, count, reload } = useNotifications();
  const navigate = useNavigate();
  const headerRef = useRef<HTMLElement>(null);

  const toggleMenu = (menu: Exclude<OpenMenu, null>) =>
    setOpenMenu((current) => (current === menu ? null : menu));

  // Dismiss on outside click and on Escape -- without this the dropdowns stay
  // open until their own button is pressed again.
  useEffect(() => {
    if (!openMenu) return;

    const onPointerDown = (e: MouseEvent) => {
      if (!headerRef.current?.contains(e.target as Node)) setOpenMenu(null);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenu(null);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [openMenu]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  /** "3 days late" / "Today" / "Tomorrow" / "In 4 days". */
  const relativeDay = (daysAway: number) => {
    if (daysAway < 0) return t.topbar.daysLate.replace('{n}', String(Math.abs(daysAway)));
    if (daysAway === 0) return t.topbar.today;
    if (daysAway === 1) return t.topbar.tomorrow;
    return t.topbar.inDays.replace('{n}', String(daysAway));
  };

  const notificationMeta = (kind: AppNotification['kind']) => {
    if (kind === 'court') {
      return { Icon: ScaleIcon, color: 'var(--primary-color)', label: t.topbar.courtHearing };
    }
    if (kind === 'todoOverdue') {
      return { Icon: ExclamationTriangleIcon, color: '#dc2626', label: t.topbar.taskOverdue };
    }
    return { Icon: CheckCircleIcon, color: 'var(--text-secondary)', label: t.topbar.taskDueToday };
  };

  const languages = [
    { code: 'en' as const, name: 'English', flag: '🇬🇧' },
    { code: 'ku' as const, name: 'کوردی', flag: '🇮🇶' },
    { code: 'ar' as const, name: 'العربية', flag: '🇸🇦' },
  ];

  return (
    <header className="topbar" ref={headerRef}>
      <button
        className="topbar-menu-btn"
        onClick={toggleSidebar}
        aria-label={t.topbar.toggleMenu}
      >
        <Bars3Icon className="hamburger-icon" style={{ width: '24px', height: '24px' }} />
      </button>

      <div className="topbar-title">
        <h1>{t.topbar.systemTitle}</h1>
      </div>

      <div className="topbar-actions">
        {/* Theme Toggle */}
        <button 
          className="topbar-btn"
          onClick={toggleTheme}
          aria-label={t.topbar.toggleTheme}
          title={theme === 'light' ? t.topbar.switchToDark : t.topbar.switchToLight}
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
            onClick={() => toggleMenu('language')}
            aria-label={t.topbar.changeLanguage}
            aria-expanded={openMenu === 'language'}
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <LanguageIcon style={{ width: '20px', height: '20px' }} />
            <span style={{ fontSize: '12px', fontWeight: '600' }}>
              {language.toUpperCase()}
            </span>
          </button>

          {openMenu === 'language' && (
            <div style={{
              position: 'absolute',
              top: '100%',
              insetInlineEnd: '0',
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
                    setOpenMenu(null);
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
                    <span style={{ marginInlineStart: 'auto', color: 'var(--primary-color)' }}>✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <button
            className="topbar-btn"
            onClick={() => {
              // Refresh on open so the list is not whatever was true at page load.
              if (openMenu !== 'notifications') reload();
              toggleMenu('notifications');
            }}
            aria-label={t.topbar.notifications}
            aria-expanded={openMenu === 'notifications'}
            title={t.topbar.notifications}
          >
            <BellIcon style={{ width: '20px', height: '20px' }} />
            {count > 0 && (
              <span className="topbar-badge">{count > 9 ? '9+' : count}</span>
            )}
          </button>

          {openMenu === 'notifications' && (
            <div className="topbar-dropdown" style={{ insetInlineEnd: 0, width: '340px' }}>
              <div className="topbar-dropdown-header">
                <h4>{t.topbar.notifications}</h4>
              </div>
              <div className="topbar-dropdown-body" style={{ maxHeight: '380px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{
                    padding: '24px 16px',
                    textAlign: 'center',
                    color: 'var(--text-tertiary)',
                    fontSize: '14px'
                  }}>
                    {t.topbar.noNotifications}
                  </div>
                ) : (
                  notifications.map((n) => {
                    const { Icon, color, label } = notificationMeta(n.kind);
                    return (
                      <button
                        key={n.id}
                        onClick={() => {
                          navigate(n.href);
                          setOpenMenu(null);
                        }}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: 'none',
                          borderBottom: '1px solid var(--border-color)',
                          background: 'transparent',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px',
                          cursor: 'pointer',
                          textAlign: 'start',
                          color: 'var(--text-primary)',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hover-bg)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <Icon style={{ width: '20px', height: '20px', color, flexShrink: 0, marginTop: '2px' }} />
                        <span style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                          <span style={{ fontSize: '12px', fontWeight: '600', color }}>
                            {label}
                          </span>
                          <span style={{
                            fontSize: '14px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {n.title}
                          </span>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {relativeDay(n.daysAway)}
                          </span>
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="topbar-icon-wrapper" style={{ position: 'relative' }}>
          <button
            className="topbar-icon"
            onClick={() => toggleMenu('user')}
            title={t.topbar.userMenu}
            aria-expanded={openMenu === 'user'}
          >
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary-color), var(--primary-dark))',
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

          {openMenu === 'user' && (
            <div className="topbar-dropdown" style={{ insetInlineEnd: 0, minWidth: '250px' }}>
              <div className="topbar-dropdown-header">
                <h4>{t.topbar.userProfile}</h4>
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
                  {t.topbar.logout}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Topbar;
