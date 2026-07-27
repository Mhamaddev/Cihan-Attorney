import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getCaseById,
  addCourtDate,
  addExpense,
  uploadFile,
  deleteCourtDate,
  deleteExpense,
  deleteFile
} from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';
import type { Case } from '../types';

// Uploaded files are stored as root-relative paths ("/uploads/<name>") and are
// served by the same host as the API, so the download origin is the API URL
// minus its /api suffix. Hardcoding it broke downloads in production.
const FILE_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api')
  .replace(/\/api\/?$/, '');

function CaseDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form states
  const [showCourtDateForm, setShowCourtDateForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);

  const [courtDate, setCourtDate] = useState({ interview_date: '', notes: '' });
  const [expense, setExpense] = useState({ expense_name: '', amount: '', expense_date: '', note: '' });
  const [file, setFile] = useState<File | null>(null);
  const [fileCategory, setFileCategory] = useState('evidence');

  const loadCase = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await getCaseById(id);
      setCaseData(data);
    } catch (err) {
      setError(t.caseDetail.loadError);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    loadCase();
  }, [loadCase]);

  const handleAddCourtDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      await addCourtDate(id, courtDate);
      setCourtDate({ interview_date: '', notes: '' });
      setShowCourtDateForm(false);
      loadCase();
    } catch {
      alert(t.caseDetail.addCourtDateError);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      await addExpense(id, expense);
      setExpense({ expense_name: '', amount: '', expense_date: '', note: '' });
      setShowExpenseForm(false);
      loadCase();
    } catch {
      alert(t.caseDetail.addExpenseError);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !id) return;

    try {
      await uploadFile(id, file, fileCategory);
      setFile(null);
      setFileCategory('evidence');
      setShowFileUpload(false);
      loadCase();
    } catch {
      alert(t.caseDetail.uploadError);
    }
  };

  const handleDeleteCourtDate = async (courtDateId: number) => {
    if (!id) return;
    if (window.confirm(t.caseDetail.confirmDeleteCourtDate)) {
      try {
        await deleteCourtDate(id, courtDateId);
        loadCase();
      } catch {
        alert(t.caseDetail.deleteCourtDateError);
      }
    }
  };

  const handleDeleteExpense = async (expenseId: number) => {
    if (!id) return;
    if (window.confirm(t.caseDetail.confirmDeleteExpense)) {
      try {
        await deleteExpense(id, expenseId);
        loadCase();
      } catch {
        alert(t.caseDetail.deleteExpenseError);
      }
    }
  };

  const handleDeleteFile = async (fileId: number) => {
    if (!id) return;
    if (window.confirm(t.caseDetail.confirmDeleteFile)) {
      try {
        await deleteFile(id, fileId);
        loadCase();
      } catch {
        alert(t.caseDetail.deleteFileError);
      }
    }
  };

  /**
   * File categories are stored as snake_case values but displayed from the
   * translation table. Anything unrecognised falls back to a readable form of
   * the stored value rather than disappearing.
   */
  const categoryLabel = (value: string) => {
    const map: Record<string, string> = {
      evidence: t.caseDetail.categories.evidence,
      court_call: t.caseDetail.categories.courtCall,
      decision: t.caseDetail.categories.decisions,
      personal_info: t.caseDetail.categories.personalInfo,
      other: t.caseDetail.categories.other,
    };
    return map[value] || value.replace(/_/g, ' ');
  };

  /** Status badges read from the case form's shared status vocabulary. */
  const statusLabel = (value?: string) => {
    const map: Record<string, string> = {
      active: t.caseForm.active,
      pending: t.caseForm.pending,
      closed: t.caseForm.closed,
    };
    return map[value || 'active'] || value || '';
  };

  const money = (value: number) => `${t.caseDetail.currency}${value.toFixed(2)}`;

  if (loading) return <div className="loading">{t.caseDetail.loading}</div>;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!caseData) return <div className="alert alert-error">{t.caseDetail.notFound}</div>;

  const totalExpenses = caseData?.expenses?.reduce((sum: number, exp) => sum + parseFloat(String(exp.amount || 0)), 0) || 0;

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)' }}>
              {t.caseDetail.caseLabel} #{caseData.id} — {caseData.request_type}
            </h2>
            <p style={{ margin: '8px 0 0 0', color: 'var(--text-tertiary)' }}>
              {t.caseDetail.created}: {caseData.created_at
                ? new Date(caseData.created_at).toLocaleString()
                : t.caseDetail.na}
            </p>
          </div>
          <div className="flex gap-10">
            <Link to={`/cases/${id}/edit`} className="btn btn-primary">
              {t.caseDetail.edit}
            </Link>
            <Link to="/cases" className="btn btn-secondary">
              {t.caseDetail.backToList}
            </Link>
          </div>
        </div>
      </div>

      {/* Case Info */}
      <div className="grid grid-cols-2">
        <div className="card">
          <h3 style={{ marginBottom: '15px', fontSize: '18px', fontWeight: '600' }}>{t.caseDetail.overview}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <strong>{t.caseDetail.status}:</strong>{' '}
              <span className={`badge ${
                caseData.status === 'active' ? 'badge-success' :
                caseData.status === 'closed' ? 'badge-danger' : 'badge-warning'
              }`}>
                {statusLabel(caseData.status)}
              </span>
            </div>
            <div>
              <strong>{t.caseDetail.calledForCourt}:</strong>{' '}
              {caseData.is_called_for_court ? (
                <span className="badge badge-info">{t.caseDetail.yes}</span>
              ) : (
                <span className="badge badge-warning">{t.caseDetail.no}</span>
              )}
            </div>
            <div>
              <strong>{t.caseDetail.totalExpenses}:</strong> {money(totalExpenses)}
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '15px', fontSize: '18px', fontWeight: '600' }}>{t.caseDetail.quickStats}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div><strong>{t.caseDetail.courtDates}:</strong> {caseData.court_dates?.length || 0}</div>
            <div><strong>{t.caseDetail.expenses}:</strong> {caseData.expenses?.length || 0}</div>
            <div><strong>{t.caseDetail.files}:</strong> {caseData.files?.length || 0}</div>
          </div>
        </div>
      </div>

      {/* Applicant & Wanted */}
      <div className="grid grid-cols-2">
        <div className="card">
          <h3 style={{ marginBottom: '15px', fontSize: '18px', fontWeight: '600' }}>{t.caseDetail.applicant}</h3>
          {caseData.applicants?.[0] ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div><strong>{t.caseDetail.name}:</strong> {caseData.applicants[0].name}</div>
              <div><strong>{t.caseDetail.phone}:</strong> <span dir="ltr">{caseData.applicants[0].phone_number || t.caseDetail.na}</span></div>
              <div><strong>{t.caseDetail.address}:</strong> {caseData.applicants[0].address || t.caseDetail.na}</div>
            </div>
          ) : (
            <p style={{ color: 'var(--text-tertiary)' }}>{t.caseDetail.noApplicant}</p>
          )}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '15px', fontSize: '18px', fontWeight: '600' }}>{t.caseDetail.wanted}</h3>
          {caseData.wanted?.[0] ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div><strong>{t.caseDetail.name}:</strong> {caseData.wanted[0].name}</div>
              <div><strong>{t.caseDetail.phone}:</strong> <span dir="ltr">{caseData.wanted[0].phone_number || t.caseDetail.na}</span></div>
              <div><strong>{t.caseDetail.address}:</strong> {caseData.wanted[0].address || t.caseDetail.na}</div>
            </div>
          ) : (
            <p style={{ color: 'var(--text-tertiary)' }}>{t.caseDetail.noWanted}</p>
          )}
        </div>
      </div>

      {/* Court Dates */}
      <div className="card">
        <div className="flex justify-between align-center mb-20">
          <h3 style={{ fontSize: '18px', fontWeight: '600' }}>{t.caseDetail.courtDates}</h3>
          <button
            onClick={() => setShowCourtDateForm(!showCourtDateForm)}
            className="btn btn-sm btn-primary"
          >
            + {t.caseDetail.addCourtDate}
          </button>
        </div>

        {showCourtDateForm && (
          <form onSubmit={handleAddCourtDate} className="card" style={{ background: 'var(--bg-tertiary)', marginBottom: '20px' }}>
            <div className="grid grid-cols-2">
              <div className="form-group">
                <label>{t.caseDetail.interviewDate} <span className="required-mark" aria-hidden="true">*</span></label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={courtDate.interview_date}
                  onChange={(e) => setCourtDate({ ...courtDate, interview_date: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>{t.caseDetail.notes}</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder={t.caseDetail.notesPlaceholder}
                  value={courtDate.notes}
                  onChange={(e) => setCourtDate({ ...courtDate, notes: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-10">
              <button type="submit" className="btn btn-sm btn-success">{t.caseDetail.add}</button>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => setShowCourtDateForm(false)}
              >
                {t.common.cancel}
              </button>
            </div>
          </form>
        )}

        {caseData.court_dates && caseData.court_dates.length > 0 ? (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>{t.caseDetail.dateTime}</th>
                  <th>{t.caseDetail.notes}</th>
                  <th>{t.caseDetail.actions}</th>
                </tr>
              </thead>
              <tbody>
                {caseData.court_dates.map((date) => (
                  <tr key={date.id}>
                    <td>{new Date(date.interview_date).toLocaleString()}</td>
                    <td>{date.notes || t.caseDetail.na}</td>
                    <td>
                      <button
                        onClick={() => date.id && handleDeleteCourtDate(date.id)}
                        className="btn btn-sm btn-danger"
                      >
                        {t.caseDetail.delete}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '20px' }}>{t.caseDetail.noCourtDates}</p>
        )}
      </div>

      {/* Expenses */}
      <div className="card">
        <div className="flex justify-between align-center mb-20">
          <h3 style={{ fontSize: '18px', fontWeight: '600' }}>
            {t.caseDetail.expenses} ({t.caseDetail.total}: {money(totalExpenses)})
          </h3>
          <button
            onClick={() => setShowExpenseForm(!showExpenseForm)}
            className="btn btn-sm btn-primary"
          >
            + {t.caseDetail.addExpense}
          </button>
        </div>

        {showExpenseForm && (
          <form onSubmit={handleAddExpense} className="card" style={{ background: 'var(--bg-tertiary)', marginBottom: '20px' }}>
            <div className="grid grid-cols-2">
              <div className="form-group">
                <label>{t.caseDetail.expenseName} <span className="required-mark" aria-hidden="true">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  placeholder={t.caseDetail.expenseNamePlaceholder}
                  value={expense.expense_name}
                  onChange={(e) => setExpense({ ...expense, expense_name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>{t.caseDetail.amount} <span className="required-mark" aria-hidden="true">*</span></label>
                <input
                  type="number"
                  step="0.01"
                  dir="ltr"
                  className="form-control"
                  placeholder={t.caseDetail.amountPlaceholder}
                  value={expense.amount}
                  onChange={(e) => setExpense({ ...expense, amount: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>{t.caseDetail.expenseDate} <span className="required-mark" aria-hidden="true">*</span></label>
                <input
                  type="date"
                  className="form-control"
                  value={expense.expense_date}
                  onChange={(e) => setExpense({ ...expense, expense_date: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>{t.caseDetail.note}</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder={t.caseDetail.notePlaceholder}
                  value={expense.note}
                  onChange={(e) => setExpense({ ...expense, note: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-10">
              <button type="submit" className="btn btn-sm btn-success">{t.caseDetail.add}</button>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => setShowExpenseForm(false)}
              >
                {t.common.cancel}
              </button>
            </div>
          </form>
        )}

        {caseData.expenses && caseData.expenses.length > 0 ? (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>{t.caseDetail.name}</th>
                  <th>{t.caseDetail.amount}</th>
                  <th>{t.caseDetail.expenseDate}</th>
                  <th>{t.caseDetail.note}</th>
                  <th>{t.caseDetail.actions}</th>
                </tr>
              </thead>
              <tbody>
                {caseData.expenses.map((exp) => (
                  <tr key={exp.id}>
                    <td>{exp.expense_name}</td>
                    <td dir="ltr">{money(parseFloat(String(exp.amount)))}</td>
                    <td>{new Date(exp.expense_date).toLocaleDateString()}</td>
                    <td>{exp.note || t.caseDetail.na}</td>
                    <td>
                      <button
                        onClick={() => exp.id && handleDeleteExpense(exp.id)}
                        className="btn btn-sm btn-danger"
                      >
                        {t.caseDetail.delete}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '20px' }}>{t.caseDetail.noExpenses}</p>
        )}
      </div>

      {/* Files */}
      <div className="card">
        <div className="flex justify-between align-center mb-20">
          <h3 style={{ fontSize: '18px', fontWeight: '600' }}>{t.caseDetail.files}</h3>
          <button
            onClick={() => setShowFileUpload(!showFileUpload)}
            className="btn btn-sm btn-primary"
          >
            + {t.caseDetail.uploadFile}
          </button>
        </div>

        {showFileUpload && (
          <form onSubmit={handleFileUpload} className="card" style={{ background: 'var(--bg-tertiary)', marginBottom: '20px' }}>
            <div className="grid grid-cols-2">
              <div className="form-group">
                <label>{t.caseDetail.fileLabel} <span className="required-mark" aria-hidden="true">*</span></label>
                <input
                  type="file"
                  className="form-control"
                  onChange={(e) => e.target.files && setFile(e.target.files[0])}
                  required
                />
              </div>
              <div className="form-group">
                <label>{t.caseDetail.category} <span className="required-mark" aria-hidden="true">*</span></label>
                <select
                  className="form-control"
                  value={fileCategory}
                  onChange={(e) => setFileCategory(e.target.value)}
                  required
                >
                  <option value="evidence">{t.caseDetail.categories.evidence}</option>
                  <option value="court_call">{t.caseDetail.categories.courtCall}</option>
                  <option value="decision">{t.caseDetail.categories.decisions}</option>
                  <option value="personal_info">{t.caseDetail.categories.personalInfo}</option>
                  <option value="other">{t.caseDetail.categories.other}</option>
                </select>
              </div>
            </div>
            <div className="flex gap-10">
              <button type="submit" className="btn btn-sm btn-success">{t.caseDetail.upload}</button>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => setShowFileUpload(false)}
              >
                {t.common.cancel}
              </button>
            </div>
          </form>
        )}

        {caseData.files && caseData.files.length > 0 ? (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>{t.caseDetail.fileName}</th>
                  <th>{t.caseDetail.category}</th>
                  <th>{t.caseDetail.fileType}</th>
                  <th>{t.caseDetail.uploadedAt}</th>
                  <th>{t.caseDetail.actions}</th>
                </tr>
              </thead>
              <tbody>
                {caseData.files.map((file) => (
                  <tr key={file.id}>
                    <td>{file.file_name}</td>
                    <td>
                      <span className="badge badge-info">
                        {categoryLabel(file.category)}
                      </span>
                    </td>
                    <td>{file.file_type}</td>
                    <td>{file.uploaded_at
                      ? new Date(file.uploaded_at).toLocaleDateString()
                      : t.caseDetail.na}</td>
                    <td>
                      <div className="flex gap-10">
                        <a
                          href={`${FILE_BASE}${file.file_path}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-sm btn-secondary"
                        >
                          {t.caseDetail.download}
                        </a>
                        <button
                          onClick={() => file.id && handleDeleteFile(file.id)}
                          className="btn btn-sm btn-danger"
                        >
                          {t.caseDetail.delete}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '20px' }}>{t.caseDetail.noFiles}</p>
        )}
      </div>
    </div>
  );
}

export default CaseDetail;
