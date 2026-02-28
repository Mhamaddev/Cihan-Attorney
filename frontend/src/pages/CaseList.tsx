import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getAllCases, deleteCase } from '../services/api';
import type { Case } from '../types';
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../i18n/LanguageContext';

function CaseList() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { t } = useLanguage();
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [courtFilter, setCourtFilter] = useState<string>('all');
  const [requestTypeFilter, setRequestTypeFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    try {
      setLoading(true);
      const data = await getAllCases();
      setCases(data);
    } catch (err) {
      setError('Failed to load cases');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this case?')) {
      try {
        await deleteCase(id);
        loadCases();
      } catch (err) {
        alert('Failed to delete case');
        console.error(err);
      }
    }
  };

  // Get unique request types for filter dropdown
  const requestTypes = useMemo(() => {
    const types = new Set(cases.map(c => c.request_type).filter(Boolean));
    return Array.from(types);
  }, [cases]);

  // Filter and search cases
  const filteredCases = useMemo(() => {
    return cases.filter(caseItem => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        caseItem.id?.toString().includes(searchLower) ||
        caseItem.request_type?.toLowerCase().includes(searchLower) ||
        caseItem.applicants?.[0]?.name?.toLowerCase().includes(searchLower) ||
        caseItem.applicants?.[0]?.phone_number?.toLowerCase().includes(searchLower) ||
        caseItem.wanted?.[0]?.name?.toLowerCase().includes(searchLower) ||
        caseItem.wanted?.[0]?.phone_number?.toLowerCase().includes(searchLower);

      // Status filter
      const matchesStatus = statusFilter === 'all' || 
        (caseItem.status || 'active') === statusFilter;

      // Court filter
      const matchesCourt = courtFilter === 'all' ||
        (courtFilter === 'yes' && caseItem.is_called_for_court) ||
        (courtFilter === 'no' && !caseItem.is_called_for_court);

      // Request type filter
      const matchesRequestType = requestTypeFilter === 'all' || 
        caseItem.request_type === requestTypeFilter;

      return matchesSearch && matchesStatus && matchesCourt && matchesRequestType;
    });
  }, [cases, searchQuery, statusFilter, courtFilter, requestTypeFilter]);

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setCourtFilter('all');
    setRequestTypeFilter('all');
  };

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || 
    courtFilter !== 'all' || requestTypeFilter !== 'all';

  if (loading) return <div className="loading">{t.common.loading}</div>;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)' }}>{t.casesList.title}</h2>
          <p style={{ margin: '8px 0 0 0', color: 'var(--text-tertiary)' }}>{t.casesList.subtitle}</p>
        </div>
        <Link to="/cases/new" className="btn btn-primary">{t.casesList.addNew}</Link>
      </div>

      {/* Search and Filter Bar */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {/* Search Input */}
          <div style={{ flex: '1', minWidth: '250px', position: 'relative' }}>
            <MagnifyingGlassIcon style={{ 
              position: 'absolute', 
              left: '12px', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              width: '20px', 
              height: '20px', 
              color: 'var(--text-tertiary)' 
            }} />
            <input
              type="text"
              placeholder={t.casesList.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 40px',
                border: '1px solid var(--gray-300)',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </div>

          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <FunnelIcon style={{ width: '18px', height: '18px' }} />
            {t.casesList.filters}
            {hasActiveFilters && (
              <span style={{ 
                background: 'var(--primary-color)', 
                color: 'white', 
                borderRadius: '10px', 
                padding: '2px 6px', 
                fontSize: '11px',
                fontWeight: '600'
              }}>
                {[searchQuery, statusFilter !== 'all', courtFilter !== 'all', requestTypeFilter !== 'all']
                  .filter(Boolean).length}
              </span>
            )}
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="btn"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-tertiary)' }}
            >
              <XMarkIcon style={{ width: '16px', height: '16px' }} />
              {t.casesList.clear}
            </button>
          )}
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div style={{ 
            marginTop: '16px', 
            paddingTop: '16px', 
            borderTop: '1px solid var(--border-color)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            {/* Status Filter */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                {t.casesList.statusLabel}
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)'
                }}
              >
                <option value="all">{t.casesList.allStatuses}</option>
                <option value="active">{t.casesList.active}</option>
                <option value="pending">{t.casesList.pending}</option>
                <option value="closed">{t.casesList.closed}</option>
              </select>
            </div>

            {/* Court Status Filter */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                {t.casesList.courtLabel}
              </label>
              <select
                value={courtFilter}
                onChange={(e) => setCourtFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)'
                }}
              >
                <option value="all">{t.casesList.allCases}</option>
                <option value="yes">{t.casesList.calledYes}</option>
                <option value="no">{t.casesList.calledNo}</option>
              </select>
            </div>

            {/* Request Type Filter */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                {t.casesList.typeLabel}
              </label>
              <select
                value={requestTypeFilter}
                onChange={(e) => setRequestTypeFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)'
                }}
              >
                <option value="all">{t.casesList.allTypes}</option>
                {requestTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Results Count */}
        <div style={{ marginTop: '12px', fontSize: '14px', color: 'var(--text-tertiary)' }}>
          {t.casesList.showing} <strong>{filteredCases.length}</strong> {t.casesList.of} <strong>{cases.length}</strong> {t.casesList.cases}
        </div>
      </div>

      <div className="card">
        {cases.length === 0 ? (
            <div className="text-center" style={{ padding: '40px' }}>
              <p style={{ color: '#6b7280', marginBottom: '20px' }}>{t.casesList.noCases}</p>
              <Link to="/cases/new" className="btn btn-primary">{t.casesList.addNew}</Link>
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="text-center" style={{ padding: '40px' }}>
              <p style={{ color: '#6b7280', marginBottom: '20px' }}>{t.casesList.noMatch}</p>
              <button onClick={clearFilters} className="btn btn-secondary">{t.casesList.clearFilters}</button>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>{t.casesList.id}</th>
                  <th>{t.casesList.requestType}</th>
                  <th>{t.casesList.applicant}</th>
                  <th>{t.casesList.wanted}</th>
                  <th>{t.casesList.status}</th>
                  <th>{t.casesList.calledForCourt}</th>
                  <th>{t.casesList.created}</th>
                  <th>{t.casesList.actions}</th>
                </tr>
              </thead>
              <tbody>
                {filteredCases.map((caseItem) => (
                  <tr key={caseItem.id}>
                    <td>#{caseItem.id}</td>
                    <td>{caseItem.request_type}</td>
                    <td>{caseItem.applicants?.[0]?.name || 'N/A'}</td>
                    <td>{caseItem.wanted?.[0]?.name || 'N/A'}</td>
                    <td>
                      <span className={`badge ${
                        caseItem.status === 'active' ? 'badge-success' :
                        caseItem.status === 'closed' ? 'badge-danger' : 'badge-warning'
                      }`}>
                        {caseItem.status || 'active'}
                      </span>
                    </td>
                    <td>
                      {caseItem.is_called_for_court ? (
                        <span className="badge badge-info">{t.casesList.yes}</span>
                      ) : (
                        <span className="badge badge-warning">{t.casesList.no}</span>
                      )}
                    </td>
                    <td>{caseItem.created_at ? new Date(caseItem.created_at).toLocaleDateString() : 'N/A'}</td>
                    <td>
                      <div className="flex gap-10">
                        <Link to={`/cases/${caseItem.id}`} className="btn btn-sm btn-primary">
                          {t.casesList.view}
                        </Link>
                        <Link to={`/cases/${caseItem.id}/edit`} className="btn btn-sm btn-secondary">
                          {t.casesList.edit}
                        </Link>
                        <button
                          onClick={() => caseItem.id && handleDelete(caseItem.id)}
                          className="btn btn-sm btn-danger"
                        >
                          {t.casesList.delete}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>
    </div>
  );
}

export default CaseList;
