import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllCases } from '../services/api';
import type { Case } from '../types';
import {
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { useLanguage } from '../i18n/LanguageContext';

function Dashboard() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    try {
      const data = await getAllCases();
      setCases(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: cases.length,
    active: cases.filter(c => c.status === 'active').length,
    pending: cases.filter(c => c.status === 'pending').length,
    closed: cases.filter(c => c.status === 'closed').length,
    court: cases.filter(c => c.is_called_for_court).length,
    totalExpenses: cases.reduce((sum, c) => {
      const caseExpenses = c.expenses?.reduce((s, e) => s + parseFloat(String(e.amount || 0)), 0) || 0;
      return sum + caseExpenses;
    }, 0)
  };

  const recentCases = cases.slice(0, 5);

  if (loading) return <div className="loading">{t.common.loading}</div>;

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)' }}>{t.dashboard.title}</h2>
        <p style={{ margin: '8px 0 0 0', color: 'var(--text-tertiary)' }}>{t.dashboard.subtitle}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3" style={{ marginBottom: '32px' }}>
        <div className="card" style={{ background: 'linear-gradient(135deg, #4c5c30 0%, #3d4926 100%)', color: 'white', border: 'none', boxShadow: '0 4px 15px rgba(76, 92, 48, 0.3)' }}>
          <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>{t.dashboard.totalCases}</div>
          <div style={{ fontSize: '36px', fontWeight: '700' }}>{stats.total}</div>
          <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '8px' }}>All registered cases</div>
        </div>

        <div className="card" style={{ background: 'linear-gradient(135deg, #4c5c30 0%, #3d4926 100%)', color: 'white', border: 'none', boxShadow: '0 4px 15px rgba(76, 92, 48, 0.3)' }}>
          <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>{t.dashboard.activeStatus}</div>
          <div style={{ fontSize: '36px', fontWeight: '700' }}>{stats.active}</div>
          <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '8px' }}>Currently in progress</div>
        </div>

        <div className="card" style={{ background: 'linear-gradient(135deg, #4c5c30 0%, #3d4926 100%)', color: 'white', border: 'none', boxShadow: '0 4px 15px rgba(76, 92, 48, 0.3)' }}>
          <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Court Cases</div>
          <div style={{ fontSize: '36px', fontWeight: '700' }}>{stats.court}</div>
          <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '8px' }}>Called for court</div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-3" style={{ marginBottom: '32px' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--secondary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircleIcon style={{ width: '28px', height: '28px' }} />
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }}>{stats.active}</div>
              <div style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>{t.casesList.active}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--warning-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ClockIcon style={{ width: '28px', height: '28px' }} />
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }}>{stats.pending}</div>
              <div style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>{t.casesList.pending}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--danger-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <XCircleIcon style={{ width: '28px', height: '28px' }} />
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }}>{stats.closed}</div>
              <div style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>{t.casesList.closed}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Cases & Quick Stats */}
      <div className="grid grid-cols-2" style={{ gap: '24px' }}>
        {/* Recent Cases */}
        <div className="card">
          <div className="card-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>{t.dashboard.recentCases}</h3>
              <Link to="/cases" className="btn btn-sm btn-secondary">{t.dashboard.viewAll}</Link>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentCases.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '20px' }}>{t.dashboard.noCases}</p>
            ) : (
              recentCases.map(caseItem => (
                <Link 
                  key={caseItem.id} 
                  to={`/cases/${caseItem.id}`}
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    textDecoration: 'none',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                >
                  <div>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
                      Case #{caseItem.id}
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>
                      {caseItem.request_type}
                    </div>
                  </div>
                  <span className={`badge ${
                    caseItem.status === 'active' ? 'badge-success' :
                    caseItem.status === 'closed' ? 'badge-danger' : 'badge-warning'
                  }`}>
                    {caseItem.status || 'active'}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="card">
          <div className="card-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>{t.dashboard.financialSummary}</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <div style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>{t.dashboard.totalExpenses}</div>
              <div style={{ fontSize: '32px', fontWeight: '700', color: 'var(--primary-color)' }}>
                ${stats.totalExpenses.toFixed(2)}
              </div>
            </div>
            <div style={{ padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
              <div style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>{t.dashboard.avgPerCase}</div>
              <div style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)' }}>
                ${stats.total > 0 ? (stats.totalExpenses / stats.total).toFixed(2) : '0.00'}
              </div>
            </div>
            <Link to="/cases/new" className="btn btn-primary" style={{ marginTop: '12px' }}>
              + Create New Case
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
