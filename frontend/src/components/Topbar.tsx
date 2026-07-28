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
  ClockIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications, isUrgent } from '../hooks/useNotifications';
import { activityKey } from '../hooks/notificationRules';
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
  const {
    notifications, count, loading: notificationsLoading, reload, markAllSeen,
    isAdmin, activity, newActivityCount, markActivitySeen, seenActivityId,
  } = useNotifications();
  const [panelTab, setPanelTab] = useState<'alerts' | 'activity'>('alerts');
  // Frozen the moment the tab opens. Marking as seen happens immediately, so
  // without this snapshot the rows would be highlighted for exactly one render.
  const [activityMark, setActivityMark] = useState(0);
  // Reading the clock during render is impure and makes output depend on when
  // React happens to re-render. Sampled once per panel open instead.
  const [nowMs, setNowMs] = useState(0);
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

  /**
   * A passed date reads as elapsed time ("Yesterday"), while an outstanding
   * task reads as lateness ("3 days late") -- the same negative number, but a
   * missed hearing is history and an overdue task is a debt.
   */
  const relativeDay = (n: AppNotification) => {
    const { daysAway, kind } = n;
    if (daysAway === 0) return t.topbar.today;
    if (daysAway === 1) return t.topbar.tomorrow;
    if (daysAway > 1) return t.topbar.inDays.replace('{n}', String(daysAway));

    const ago = Math.abs(daysAway);
    if (kind === 'todoOverdue') return t.topbar.daysLate.replace('{n}', String(ago));
    return ago === 1 ? t.topbar.yesterday : t.topbar.daysAgo.replace('{n}', String(ago));
  };

  const notificationMeta = (kind: AppNotification['kind']) => {
    if (kind === 'court') {
      return { Icon: ScaleIcon, color: 'var(--primary-color)', label: t.topbar.courtHearing };
    }
    if (kind === 'courtPassed') {
      return { Icon: ClockIcon, color: 'var(--warning-color)', label: t.topbar.hearingPassed };
    }
    if (kind === 'todoOverdue') {
      return { Icon: ExclamationTriangleIcon, color: 'var(--danger-color)', label: t.topbar.taskOverdue };
    }
    return { Icon: CheckCircleIcon, color: 'var(--text-secondary)', label: t.topbar.taskDueToday };
  };

  const urgent = notifications.filter(isUrgent);
  const upcoming = notifications.filter((n) => !isUrgent(n));

  /** "Just now" / "12 min ago" / "3 h ago", then a plain date. */
  const timeAgo = (iso: string) => {
    const then = new Date(iso).getTime();
    if (Number.isNaN(then) || !nowMs) return '';
    const minutes = Math.floor((nowMs - then) / 60000);
    if (minutes < 1) return t.topbar.justNow;
    if (minutes < 60) return t.topbar.minutesAgo.replace('{n}', String(minutes));
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t.topbar.hoursAgo.replace('{n}', String(hours));
    return new Date(iso).toLocaleDateString();
  };

  /**
   * Audit rows are assembled from a per-action sentence rather than glued
   * together from verb and noun, so each language keeps its own word order.
   */
  const activityText = (entry: { action: string; entity_type: string; actor_name: string; entity_id: number | null }) => {
    const template = t.topbar[activityKey(entry.action, entry.entity_type) as keyof typeof t.topbar];
    if (typeof template !== 'string') {
      // An action added on the server before its translation exists must still
      // render something readable rather than a blank row.
      return `${entry.actor_name}: ${entry.action} ${entry.entity_type}`;
    }
    return template
      .replace('{actor}', entry.actor_name)
      .replace('{id}', String(entry.entity_id ?? ''));
  };

  const renderNotification = (n: AppNotification) => {
    const { Icon, color, label } = notificationMeta(n.kind);
    return (
      <button
        key={n.id}
        className={`notification-row${n.isNew ? ' is-new' : ''}`}
        onClick={() => {
          navigate(n.href);
          setOpenMenu(null);
        }}
      >
        <Icon style={{ width: '20px', height: '20px', color, flexShrink: 0, marginTop: '2px' }} />
        <span className="notification-body">
          <span className="notification-label" style={{ color }}>{label}</span>
          <span className="notification-title">{n.title}</span>
          <span className="notification-when">{relativeDay(n)}</span>
        </span>
        {n.isNew && <span className="notification-dot" title={t.topbar.newItem} />}
      </button>
    );
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
              if (openMenu !== 'notifications') {
                // Refresh on open so the list is not whatever was true at page
                // load, and treat opening as acknowledgement of what is there.
                reload();
                setPanelTab('alerts');
                setNowMs(Date.now());
                markAllSeen();
              }
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

          {/* Announced rather than drawn: the badge is a number with no label,
              so on its own a screen reader reports only "3". */}
          <span className="sr-only" role="status" aria-live="polite">
            {count > 0 ? t.topbar.unreadCount.replace('{n}', String(count)) : ''}
          </span>

          {openMenu === 'notifications' && (
            <div className="topbar-dropdown topbar-dropdown--notifications">
              <div className="topbar-dropdown-header">
                <h4>{t.topbar.notifications}</h4>
              </div>

              {/* Only admins have an audit feed to switch to, so everyone else
                  sees the alert list with no tab strip at all. */}
              {isAdmin && (
                <div className="notification-tabs" role="tablist">
                  <button
                    role="tab"
                    aria-selected={panelTab === 'alerts'}
                    className={`notification-tab${panelTab === 'alerts' ? ' is-active' : ''}`}
                    onClick={() => setPanelTab('alerts')}
                  >
                    {t.topbar.tabAlerts}
                    {count > 0 && <span className="notification-tab-count">{count}</span>}
                  </button>
                  <button
                    role="tab"
                    aria-selected={panelTab === 'activity'}
                    className={`notification-tab${panelTab === 'activity' ? ' is-active' : ''}`}
                    onClick={() => {
                      setActivityMark(seenActivityId);
                      setPanelTab('activity');
                      setNowMs(Date.now());
                      markActivitySeen();
                    }}
                  >
                    {t.topbar.tabActivity}
                    {newActivityCount > 0 && <span className="notification-tab-dot" />}
                  </button>
                </div>
              )}

              <div className="topbar-dropdown-body notification-list">
                {panelTab === 'activity' ? (
                  activity.length === 0 ? (
                    <div className="notification-empty">{t.topbar.noActivity}</div>
                  ) : (
                    activity.map((entry) => (
                      <div
                        key={entry.id}
                        className={`activity-row${entry.id > activityMark ? ' is-new' : ''}`}
                      >
                        <span className={`activity-dot activity-dot--${entry.action}`} />
                        <span className="notification-body">
                          <span className="notification-title activity-text">
                            {activityText(entry)}
                          </span>
                          <span className="notification-when">
                            {timeAgo(entry.created_at)}
                            {entry.summary ? ` · ${entry.summary}` : ''}
                          </span>
                        </span>
                      </div>
                    ))
                  )
                ) : notifications.length === 0 ? (
                  <div className="notification-empty">
                    {notificationsLoading ? t.common.loading : t.topbar.noNotifications}
                  </div>
                ) : (
                  <>
                    {urgent.length > 0 && (
                      <>
                        <p className="notification-group">{t.topbar.needsAttention}</p>
                        {urgent.map(renderNotification)}
                      </>
                    )}
                    {upcoming.length > 0 && (
                      <>
                        <p className="notification-group">{t.topbar.comingUp}</p>
                        {upcoming.map(renderNotification)}
                      </>
                    )}
                  </>
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
            <div className="topbar-dropdown topbar-dropdown--user">
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
