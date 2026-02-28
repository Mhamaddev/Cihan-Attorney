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
import type { Case } from '../types';

function CaseDetail() {
  const { id } = useParams<{ id: string }>();
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
      setError('Failed to load case');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

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
      alert('Failed to add court date');
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
      alert('Failed to add expense');
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
      alert('Failed to upload file');
    }
  };

  const handleDeleteCourtDate = async (courtDateId: number) => {
    if (!id) return;
    if (window.confirm('Delete this court date?')) {
      try {
        await deleteCourtDate(id, courtDateId);
        loadCase();
      } catch {
        alert('Failed to delete court date');
      }
    }
  };

  const handleDeleteExpense = async (expenseId: number) => {
    if (!id) return;
    if (window.confirm('Delete this expense?')) {
      try {
        await deleteExpense(id, expenseId);
        loadCase();
      } catch {
        alert('Failed to delete expense');
      }
    }
  };

  const handleDeleteFile = async (fileId: number) => {
    if (!id) return;
    if (window.confirm('Delete this file?')) {
      try {
        await deleteFile(id, fileId);
        loadCase();
      } catch {
        alert('Failed to delete file');
      }
    }
  };

  if (loading) return <div className="loading">Loading case details...</div>;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!caseData) return <div className="alert alert-error">Case not found</div>;

  const totalExpenses = caseData?.expenses?.reduce((sum: number, exp) => sum + parseFloat(String(exp.amount || 0)), 0) || 0;

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: 'var(--gray-900)' }}>
              Case #{caseData.id} - {caseData.request_type}
            </h2>
            <p style={{ margin: '8px 0 0 0', color: 'var(--gray-600)' }}>
              Created: {caseData.created_at ? new Date(caseData.created_at).toLocaleString() : 'N/A'}
            </p>
          </div>
          <div className="flex gap-10">
            <Link to={`/cases/${id}/edit`} className="btn btn-primary">
              Edit Case
            </Link>
            <Link to="/" className="btn btn-secondary">
              Back to List
            </Link>
          </div>
        </div>
      </div>

      {/* Case Info */}
      <div className="grid grid-cols-2">
        <div className="card">
          <h3 style={{ marginBottom: '15px', fontSize: '18px', fontWeight: '600' }}>Case Information</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <strong>Status:</strong>{' '}
              <span className={`badge ${
                caseData.status === 'active' ? 'badge-success' :
                caseData.status === 'closed' ? 'badge-danger' : 'badge-warning'
              }`}>
                {caseData.status || 'active'}
              </span>
            </div>
            <div>
              <strong>Called for Court:</strong>{' '}
              {caseData.is_called_for_court ? (
                <span className="badge badge-info">Yes</span>
              ) : (
                <span className="badge badge-warning">No</span>
              )}
            </div>
            <div>
              <strong>Total Expenses:</strong> ${totalExpenses.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '15px', fontSize: '18px', fontWeight: '600' }}>Quick Stats</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div><strong>Court Dates:</strong> {caseData.court_dates?.length || 0}</div>
            <div><strong>Expenses:</strong> {caseData.expenses?.length || 0}</div>
            <div><strong>Files:</strong> {caseData.files?.length || 0}</div>
          </div>
        </div>
      </div>

      {/* Applicant & Wanted */}
      <div className="grid grid-cols-2">
        <div className="card">
          <h3 style={{ marginBottom: '15px', fontSize: '18px', fontWeight: '600' }}>Applicant</h3>
          {caseData.applicants?.[0] ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div><strong>Name:</strong> {caseData.applicants[0].name}</div>
              <div><strong>Phone:</strong> {caseData.applicants[0].phone_number || 'N/A'}</div>
              <div><strong>Address:</strong> {caseData.applicants[0].address || 'N/A'}</div>
            </div>
          ) : (
            <p style={{ color: '#6b7280' }}>No applicant information</p>
          )}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '15px', fontSize: '18px', fontWeight: '600' }}>Wanted/Defendant</h3>
          {caseData.wanted?.[0] ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div><strong>Name:</strong> {caseData.wanted[0].name}</div>
              <div><strong>Phone:</strong> {caseData.wanted[0].phone_number || 'N/A'}</div>
              <div><strong>Address:</strong> {caseData.wanted[0].address || 'N/A'}</div>
            </div>
          ) : (
            <p style={{ color: '#6b7280' }}>No wanted information</p>
          )}
        </div>
      </div>

      {/* Court Dates */}
      <div className="card">
        <div className="flex justify-between align-center mb-20">
          <h3 style={{ fontSize: '18px', fontWeight: '600' }}>Court Dates</h3>
          <button
            onClick={() => setShowCourtDateForm(!showCourtDateForm)}
            className="btn btn-sm btn-primary"
          >
            + Add Court Date
          </button>
        </div>

        {showCourtDateForm && (
          <form onSubmit={handleAddCourtDate} className="card" style={{ background: '#f9fafb', marginBottom: '20px' }}>
            <div className="grid grid-cols-2">
              <div className="form-group">
                <label>Interview Date *</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={courtDate.interview_date}
                  onChange={(e) => setCourtDate({ ...courtDate, interview_date: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Notes</label>
                <input
                  type="text"
                  className="form-control"
                  value={courtDate.notes}
                  onChange={(e) => setCourtDate({ ...courtDate, notes: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-10">
              <button type="submit" className="btn btn-sm btn-success">Add</button>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => setShowCourtDateForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {caseData.court_dates && caseData.court_dates.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {caseData.court_dates.map((date) => (
                <tr key={date.id}>
                  <td>{new Date(date.interview_date).toLocaleString()}</td>
                  <td>{date.notes || 'N/A'}</td>
                  <td>
                    <button
                      onClick={() => date.id && handleDeleteCourtDate(date.id)}
                      className="btn btn-sm btn-danger"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '20px' }}>No court dates scheduled</p>
        )}
      </div>

      {/* Expenses */}
      <div className="card">
        <div className="flex justify-between align-center mb-20">
          <h3 style={{ fontSize: '18px', fontWeight: '600' }}>Expenses (Total: ${totalExpenses.toFixed(2)})</h3>
          <button
            onClick={() => setShowExpenseForm(!showExpenseForm)}
            className="btn btn-sm btn-primary"
          >
            + Add Expense
          </button>
        </div>

        {showExpenseForm && (
          <form onSubmit={handleAddExpense} className="card" style={{ background: '#f9fafb', marginBottom: '20px' }}>
            <div className="grid grid-cols-2">
              <div className="form-group">
                <label>Expense Name *</label>
                <input
                  type="text"
                  className="form-control"
                  value={expense.expense_name}
                  onChange={(e) => setExpense({ ...expense, expense_name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  value={expense.amount}
                  onChange={(e) => setExpense({ ...expense, amount: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  className="form-control"
                  value={expense.expense_date}
                  onChange={(e) => setExpense({ ...expense, expense_date: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Note</label>
                <input
                  type="text"
                  className="form-control"
                  value={expense.note}
                  onChange={(e) => setExpense({ ...expense, note: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-10">
              <button type="submit" className="btn btn-sm btn-success">Add</button>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => setShowExpenseForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {caseData.expenses && caseData.expenses.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Note</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {caseData.expenses.map((exp) => (
                <tr key={exp.id}>
                  <td>{exp.expense_name}</td>
                  <td>${parseFloat(String(exp.amount)).toFixed(2)}</td>
                  <td>{new Date(exp.expense_date).toLocaleDateString()}</td>
                  <td>{exp.note || 'N/A'}</td>
                  <td>
                    <button
                      onClick={() => exp.id && handleDeleteExpense(exp.id)}
                      className="btn btn-sm btn-danger"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '20px' }}>No expenses recorded</p>
        )}
      </div>

      {/* Files */}
      <div className="card">
        <div className="flex justify-between align-center mb-20">
          <h3 style={{ fontSize: '18px', fontWeight: '600' }}>Files & Attachments</h3>
          <button
            onClick={() => setShowFileUpload(!showFileUpload)}
            className="btn btn-sm btn-primary"
          >
            + Upload File
          </button>
        </div>

        {showFileUpload && (
          <form onSubmit={handleFileUpload} className="card" style={{ background: '#f9fafb', marginBottom: '20px' }}>
            <div className="grid grid-cols-2">
              <div className="form-group">
                <label>File *</label>
                <input
                  type="file"
                  className="form-control"
                  onChange={(e) => e.target.files && setFile(e.target.files[0])}
                  required
                />
              </div>
              <div className="form-group">
                <label>Category *</label>
                <select
                  className="form-control"
                  value={fileCategory}
                  onChange={(e) => setFileCategory(e.target.value)}
                  required
                >
                  <option value="evidence">Evidence</option>
                  <option value="court_call">Court Call for Wanted</option>
                  <option value="decision">Decision</option>
                  <option value="personal_info">Personal Information</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div className="flex gap-10">
              <button type="submit" className="btn btn-sm btn-success">Upload</button>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => setShowFileUpload(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {caseData.files && caseData.files.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>File Name</th>
                <th>Category</th>
                <th>Type</th>
                <th>Uploaded</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {caseData.files.map((file) => (
                <tr key={file.id}>
                  <td>{file.file_name}</td>
                  <td>
                    <span className="badge badge-info">
                      {file.category.replace('_', ' ')}
                    </span>
                  </td>
                  <td>{file.file_type}</td>
                  <td>{file.uploaded_at ? new Date(file.uploaded_at).toLocaleDateString() : 'N/A'}</td>
                  <td>
                    <div className="flex gap-10">
                      <a
                        href={`http://localhost:5000${file.file_path}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-sm btn-secondary"
                      >
                        Download
                      </a>
                      <button
                        onClick={() => file.id && handleDeleteFile(file.id)}
                        className="btn btn-sm btn-danger"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '20px' }}>No files uploaded</p>
        )}
      </div>
    </div>
  );
}

export default CaseDetail;
