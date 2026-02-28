import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createCase, getCaseById, updateCase } from '../services/api';
import type { CreateCaseData } from '../types';

function CaseForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState<CreateCaseData>({
    request_type: '',
    is_called_for_court: false,
    status: 'active',
    applicant: {
      name: '',
      phone_number: '',
      address: ''
    },
    wanted: {
      name: '',
      phone_number: '',
      address: ''
    },
    court_dates: [],
    expenses: []
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadCase = useCallback(async () => {
    if (!id) return;
    try {
      const data = await getCaseById(id);
      setFormData({
        request_type: data.request_type,
        is_called_for_court: data.is_called_for_court,
        status: data.status || 'active',
        applicant: data.applicants?.[0] || { name: '', phone_number: '', address: '' },
        wanted: data.wanted?.[0] || { name: '', phone_number: '', address: '' },
        court_dates: data.court_dates || [],
        expenses: data.expenses || []
      });
    } catch (err) {
      setError('Failed to load case');
      console.error(err);
    }
  }, [id]);

  useEffect(() => {
    if (isEditMode) {
      loadCase();
    }
  }, [isEditMode, loadCase]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type, checked } = target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleNestedChange = (parent: 'applicant' | 'wanted', field: string, value: string) => {
    setFormData({
      ...formData,
      [parent]: {
        ...formData[parent]!,
        [field]: value
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isEditMode && id) {
        await updateCase(id, formData);
      } else {
        await createCase(formData);
      }
      navigate('/');
    } catch (err) {
      setError('Failed to save case');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: 'var(--gray-900)' }}>
          {isEditMode ? 'Edit Case' : 'Add New Case'}
        </h2>
        <p style={{ margin: '8px 0 0 0', color: 'var(--gray-600)' }}>
          {isEditMode ? 'Update case information and details' : 'Create a new case with applicant and defendant information'}
        </p>
      </div>

      <div className="card">
        <div className="card-body">
          {error && <div className="alert alert-error">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            {/* Basic Info */}
            <div className="form-group">
              <label>Request Type *</label>
              <input
                type="text"
                name="request_type"
                className="form-control"
                value={formData.request_type}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="grid grid-cols-2">
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    name="is_called_for_court"
                    checked={formData.is_called_for_court}
                    onChange={handleInputChange}
                    style={{ marginRight: '8px' }}
                  />
                  Called for Court
                </label>
              </div>

              {isEditMode && (
                <div className="form-group">
                  <label>Status</label>
                  <select
                    name="status"
                    className="form-control"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              )}
            </div>

            {/* Applicant Info */}
            <div className="card" style={{ marginTop: '20px', background: '#f9fafb' }}>
              <h3 style={{ marginBottom: '15px', fontSize: '18px' }}>Applicant Information</h3>
              <div className="grid grid-cols-2">
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    className="form-control"
                  value={formData.applicant?.name || ''}
                    onChange={(e) => handleNestedChange('applicant', 'name', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    className="form-control"
                  value={formData.applicant?.phone_number || ''}
                    onChange={(e) => handleNestedChange('applicant', 'phone_number', e.target.value)}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Address</label>
                <textarea
                  className="form-control"
                  value={formData.applicant?.address || ''}
                  onChange={(e) => handleNestedChange('applicant', 'address', e.target.value)}
                />
              </div>
            </div>

            {/* Wanted Info */}
            <div className="card" style={{ marginTop: '20px', background: '#f9fafb' }}>
              <h3 style={{ marginBottom: '15px', fontSize: '18px' }}>Wanted/Defendant Information</h3>
              <div className="grid grid-cols-2">
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    className="form-control"
                  value={formData.wanted?.name || ''}
                    onChange={(e) => handleNestedChange('wanted', 'name', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    className="form-control"
                  value={formData.wanted?.phone_number || ''}
                    onChange={(e) => handleNestedChange('wanted', 'phone_number', e.target.value)}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Address</label>
                <textarea
                  className="form-control"
                  value={formData.wanted?.address || ''}
                  onChange={(e) => handleNestedChange('wanted', 'address', e.target.value)}
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-10 mt-20">
              <button type="submit" className="btn btn-success" disabled={loading}>
                {loading ? 'Saving...' : isEditMode ? 'Update Case' : 'Create Case'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/')}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CaseForm;
