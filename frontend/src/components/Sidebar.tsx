import { Link, useLocation } from 'react-router-dom';
import {
  ChartBarIcon,
  FolderIcon,
  PlusCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  ScaleIcon,
  UserCircleIcon,
  ChevronLeftIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

function Sidebar({ isOpen, toggleSidebar, isCollapsed, toggleCollapse }: SidebarProps) {
  const location = useLocation();
  const { t } = useLanguage();
  const { isAdmin } = useAuth();

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''} ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ScaleIcon style={{ width: '28px', height: '28px', color: 'var(--primary-color)' }} />
            {!isCollapsed && <h2 className="sidebar-title">{t.system?.name || 'Cihan Attorney'}</h2>}
          </div>
          <button 
            className="sidebar-close"
            onClick={toggleSidebar}
          >
            ✕
          </button>
        </div>

        {/* Desktop Collapse Toggle */}
        <button 
          className="sidebar-collapse-btn"
          onClick={toggleCollapse}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeftIcon className={`sidebar-collapse-icon ${isCollapsed ? 'collapsed' : ''}`} />
        </button>

        <nav className="sidebar-nav">
          <div className="sidebar-section">
            {!isCollapsed && <h3 className="sidebar-section-title">Main Menu</h3>}
            <Link 
              to="/" 
              className={`sidebar-link ${isActive('/') && location.pathname === '/' ? 'sidebar-link-active' : ''}`}
              onClick={() => window.innerWidth < 768 && toggleSidebar()}
              title={isCollapsed ? t.nav.dashboard : ''}
            >
              <ChartBarIcon className="sidebar-icon" style={{ width: '20px', height: '20px' }} />
              {!isCollapsed && <span>{t.nav.dashboard}</span>}
            </Link>
            <Link 
              to="/cases" 
              className={`sidebar-link ${isActive('/cases') && location.pathname !== '/cases/new' ? 'sidebar-link-active' : ''}`}
              onClick={() => window.innerWidth < 768 && toggleSidebar()}
              title={isCollapsed ? t.nav.allCases : ''}
            >
              <FolderIcon className="sidebar-icon" style={{ width: '20px', height: '20px' }} />
              {!isCollapsed && <span>{t.nav.allCases}</span>}
            </Link>
            <Link 
              to="/cases/new" 
              className={`sidebar-link ${isActive('/cases/new') ? 'sidebar-link-active' : ''}`}
              onClick={() => window.innerWidth < 768 && toggleSidebar()}
              title={isCollapsed ? t.nav.newCase : ''}
            >
              <PlusCircleIcon className="sidebar-icon" style={{ width: '20px', height: '20px' }} />
              {!isCollapsed && <span>{t.nav.newCase}</span>}
            </Link>
          </div>

          <div className="sidebar-section">
            {!isCollapsed && <h3 className="sidebar-section-title">Quick Actions</h3>}
            <Link 
              to="/cases?status=active" 
              className="sidebar-link"
              onClick={() => window.innerWidth < 768 && toggleSidebar()}
              title={isCollapsed ? t.nav.activeCases : ''}
            >
              <CheckCircleIcon className="sidebar-icon" style={{ width: '20px', height: '20px', color: 'var(--secondary-color)' }} />
              {!isCollapsed && <span>{t.nav.activeCases}</span>}
            </Link>
            <Link 
              to="/cases?status=pending" 
              className="sidebar-link"
              onClick={() => window.innerWidth < 768 && toggleSidebar()}
              title={isCollapsed ? t.nav.pendingCases : ''}
            >
              <ClockIcon className="sidebar-icon" style={{ width: '20px', height: '20px', color: 'var(--warning-color)' }} />
              {!isCollapsed && <span>{t.nav.pendingCases}</span>}
            </Link>
            <Link 
              to="/cases?court=true" 
              className="sidebar-link"
              onClick={() => window.innerWidth < 768 && toggleSidebar()}
              title={isCollapsed ? t.nav.courtCases : ''}
            >
              <ScaleIcon className="sidebar-icon" style={{ width: '20px', height: '20px', color: 'var(--primary-color)' }} />
              {!isCollapsed && <span>{t.nav.courtCases}</span>}
            </Link>

            {/* Admin Only - User Management */}
            {isAdmin && (
              <Link 
                to="/users" 
                className={`sidebar-link ${isActive('/users') ? 'sidebar-link-active' : ''}`}
                onClick={() => window.innerWidth < 768 && toggleSidebar()}
                title={isCollapsed ? t.nav.users : ''}
              >
                <UsersIcon className="sidebar-icon" style={{ width: '20px', height: '20px', color: 'var(--primary-color)' }} />
                {!isCollapsed && <span>{t.nav.users}</span>}
              </Link>
            )}
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <UserCircleIcon 
              className="sidebar-user-avatar" 
              style={{ width: '40px', height: '40px', color: 'var(--primary-color)' }} 
              title={isCollapsed ? 'Law Office' : ''}
            />
            {!isCollapsed && (
              <div className="sidebar-user-info">
                <div className="sidebar-user-name">Law Office</div>
                <div className="sidebar-user-role">{t.topbar.admin}</div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
