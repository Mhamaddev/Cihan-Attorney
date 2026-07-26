import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createCase, getCaseById, updateCase } from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';
import type { CreateCaseData } from '../types';

/** Fields that must be filled before the case can be saved. */
type FieldName = 'request_type' | 'applicant_name' | 'wanted_name';
type Errors = Partial<Record<FieldName, string>>;

function CaseForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useLanguage();
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

  const [saving, setSaving] = useState(false);
  // Edit mode opens on an empty form while the case loads; without this the
  // fields visibly pop from blank to populated.
  const [loadingCase, setLoadingCase] = useState(isEditMode);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Errors>({});

  const fieldRefs = useRef<Partial<Record<FieldName, HTMLInputElement | null>>>({});

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
      setError(t.caseForm.loadFailed);
      console.error(err);
    } finally {
      setLoadingCase(false);
    }
  }, [id, t]);

  useEffect(() => {
    if (isEditMode) {
      loadCase();
    }
  }, [isEditMode, loadCase]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type, checked } = target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (name === 'request_type') clearError('request_type');
  };

  const handleNestedChange = (parent: 'applicant' | 'wanted', field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: {
        ...prev[parent]!,
        [field]: value
      }
    }));
    if (field === 'name') {
      clearError(parent === 'applicant' ? 'applicant_name' : 'wanted_name');
    }
  };

  /** Drop a field's error as soon as it is being corrected. */
  const clearError = (field: FieldName) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validate = (): Errors => {
    const found: Errors = {};
    if (!formData.request_type.trim()) found.request_type = t.caseForm.errRequestType;
    if (!formData.applicant?.name?.trim()) found.applicant_name = t.caseForm.errApplicantName;
    if (!formData.wanted?.name?.trim()) found.wanted_name = t.caseForm.errWantedName;
    return found;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      // Send focus to the first problem rather than making the user hunt for it.
      const first = (['request_type', 'applicant_name', 'wanted_name'] as FieldName[])
        .find((f) => found[f]);
      if (first) fieldRefs.current[first]?.focus();
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (isEditMode && id) {
        await updateCase(id, formData);
      } else {
        await createCase(formData);
      }
      navigate('/cases');
    } catch (err) {
      setError(t.caseForm.saveFailed);
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  /** Applicant and defendant take the same three fields, mirrored per side. */
  const renderParty = (party: 'applicant' | 'wanted') => {
    const isApplicant = party === 'applicant';
    const errorKey: FieldName = isApplicant ? 'applicant_name' : 'wanted_name';
    const values = formData[party];

    return (
      <section className={`party ${isApplicant ? 'party--applicant' : 'party--defendant'}`}>
        <span className="party-role">
          {isApplicant ? t.caseForm.applicantRole : t.caseForm.wantedRole}
        </span>

        <div className="form-group">
          <label htmlFor={`${party}-name`}>
            {isApplicant ? t.caseForm.applicantName : t.caseForm.wantedName}
            <span className="required-mark" aria-hidden="true">*</span>
          </label>
          <input
            id={`${party}-name`}
            ref={(el) => { fieldRefs.current[errorKey] = el; }}
            type="text"
            className={`form-control${errors[errorKey] ? ' is-invalid' : ''}`}
            placeholder={isApplicant
              ? t.caseForm.applicantNamePlaceholder
              : t.caseForm.wantedNamePlaceholder}
            value={values?.name || ''}
            onChange={(e) => handleNestedChange(party, 'name', e.target.value)}
            aria-invalid={Boolean(errors[errorKey])}
            aria-describedby={errors[errorKey] ? `${party}-name-error` : undefined}
          />
          {errors[errorKey] && (
            <p className="field-error" id={`${party}-name-error`}>{errors[errorKey]}</p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor={`${party}-phone`}>
            {t.caseForm.phoneNumber}
            <span className="label-optional">{t.caseForm.optional}</span>
          </label>
          <input
            id={`${party}-phone`}
            type="tel"
            // Phone numbers stay left-to-right even when the page is RTL,
            // otherwise the caret jumps around while typing a +964 number.
            dir="ltr"
            inputMode="tel"
            className="form-control"
            placeholder={t.caseForm.phonePlaceholder}
            value={values?.phone_number || ''}
            onChange={(e) => handleNestedChange(party, 'phone_number', e.target.value)}
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label htmlFor={`${party}-address`}>
            {t.caseForm.address}
            <span className="label-optional">{t.caseForm.optional}</span>
          </label>
          <textarea
            id={`${party}-address`}
            className="form-control"
            rows={3}
            placeholder={t.caseForm.addressPlaceholder}
            value={values?.address || ''}
            onChange={(e) => handleNestedChange(party, 'address', e.target.value)}
          />
        </div>
      </section>
    );
  };

  if (loadingCase) {
    return (
      <div className="card">
        <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '32px 0' }}>
          {t.caseForm.loading}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)' }}>
          {isEditMode ? t.caseForm.editCase : t.caseForm.newCase}
        </h2>
        <p style={{ margin: '8px 0 0 0', color: 'var(--text-tertiary)' }}>
          {isEditMode ? t.caseForm.subtitleEdit : t.caseForm.subtitleNew}
        </p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit} noValidate>
        <div className="card">
          <p className="form-section-title">{t.caseForm.caseInformation}</p>

          <div className="form-group">
            <label htmlFor="request_type">
              {t.caseForm.requestType}
              <span className="required-mark" aria-hidden="true">*</span>
            </label>
            <input
              id="request_type"
              ref={(el) => { fieldRefs.current.request_type = el; }}
              type="text"
              name="request_type"
              className={`form-control${errors.request_type ? ' is-invalid' : ''}`}
              placeholder={t.caseForm.requestTypePlaceholder}
              value={formData.request_type}
              onChange={handleInputChange}
              aria-invalid={Boolean(errors.request_type)}
              aria-describedby={errors.request_type ? 'request_type-error' : undefined}
            />
            {errors.request_type && (
              <p className="field-error" id="request_type-error">{errors.request_type}</p>
            )}
          </div>

          {/* Status only exists once a case does, so in create mode this row
              holds the checkbox alone rather than leaving an empty column.
              Aligning to the end keeps the checkbox box level with the select,
              which sits lower because it carries a label above it. */}
          <div
            className={isEditMode ? 'grid grid-cols-2' : ''}
            style={isEditMode ? { alignItems: 'end' } : undefined}
          >
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  name="is_called_for_court"
                  checked={formData.is_called_for_court}
                  onChange={handleInputChange}
                />
                {t.caseForm.calledForCourt}
              </label>
            </div>

            {isEditMode && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="status">{t.caseForm.status}</label>
                <select
                  id="status"
                  name="status"
                  className="form-control"
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  <option value="active">{t.caseForm.active}</option>
                  <option value="pending">{t.caseForm.pending}</option>
                  <option value="closed">{t.caseForm.closed}</option>
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="party-grid">
          {renderParty('applicant')}
          {renderParty('wanted')}
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-success" disabled={saving}>
            {saving
              ? (isEditMode ? t.caseForm.updating : t.caseForm.creating)
              : t.caseForm.save}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/cases')}
          >
            {t.caseForm.cancel}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CaseForm;
