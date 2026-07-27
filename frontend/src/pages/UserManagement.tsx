import React, { useState, useEffect, useCallback } from 'react';
import { 
  UserIcon, 
  PencilIcon, 
  TrashIcon, 
  PlusIcon, 
  XMarkIcon,
  KeyIcon
} from '@heroicons/react/24/outline';
import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword
} from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';
import '../styles/UserManagement.css';

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: 'admin' | 'lawyer' | 'staff';
  is_active: boolean;
  created_at: string;
}

interface UserFormData {
  username: string;
  email: string;
  fullName: string;
  role: 'admin' | 'lawyer' | 'staff';
  password?: string;
  isActive: boolean;
}

function UserManagement() {
  const { t } = useLanguage();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [userForPassword, setUserForPassword] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    email: '',
    fullName: '',
    role: 'staff',
    password: '',
    isActive: true
  });
  const [error, setError] = useState('');

  // Wrapped because it now reads `t` for its error message, which makes it
  // reactive -- without this the effect would close over a stale language.
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllUsers();
      setUsers(data);
    } catch (err) {
      setError(t.userManagement.loadError);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        isActive: user.is_active,
        password: ''
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        email: '',
        fullName: '',
        role: 'staff',
        password: '',
        isActive: true
      });
    }
    setShowModal(true);
    setError('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (editingUser) {
        await updateUser(editingUser.id, formData);
      } else {
        if (!formData.password || formData.password.length < 6) {
          setError(t.userManagement.passwordTooShort);
          return;
        }
        await createUser({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          role: formData.role
        });
      }
      await fetchUsers();
      handleCloseModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.userManagement.saveError);
    }
  };

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    try {
      await deleteUser(userToDelete.id);
      await fetchUsers();
      setShowDeleteConfirm(false);
      setUserToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.userManagement.deleteError);
    }
  };

  const handlePasswordResetClick = (user: User) => {
    setUserForPassword(user);
    setNewPassword('');
    setShowPasswordModal(true);
    setError('');
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForPassword) return;

    if (newPassword.length < 6) {
      setError(t.userManagement.passwordTooShort);
      return;
    }

    try {
      await resetUserPassword(userForPassword.id, newPassword);
      setShowPasswordModal(false);
      setUserForPassword(null);
      setNewPassword('');
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t.userManagement.resetError);
    }
  };

  /** Roles are stored as fixed keys; the label comes from the active language. */
  const roleLabel = (role: string) => {
    const map: Record<string, string> = {
      admin: t.userManagement.roleAdmin,
      lawyer: t.userManagement.roleLawyer,
      staff: t.userManagement.roleStaff,
    };
    return map[role] || role;
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'var(--primary-color)';
      case 'lawyer':
        return 'var(--secondary-color)';
      case 'staff':
        return 'var(--text-tertiary)';
      default:
        return 'var(--text-tertiary)';
    }
  };

  if (loading) {
    return (
      <div className="user-management">
        <div className="loading">{t.userManagement.loading}</div>
      </div>
    );
  }

  return (
    <div className="user-management">
      <div className="page-header">
        <div>
          <h1>{t.userManagement.title}</h1>
          <p className="page-subtitle">{t.userManagement.subtitle}</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <PlusIcon style={{ width: '20px', height: '20px' }} />
          {t.userManagement.addUser}
        </button>
      </div>

      {error && !showModal && !showPasswordModal && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>{t.userManagement.fullName}</th>
              <th>{t.userManagement.username}</th>
              <th>{t.userManagement.email}</th>
              <th>{t.userManagement.role}</th>
              <th>{t.userManagement.status}</th>
              <th>{t.userManagement.created}</th>
              <th>{t.userManagement.actions}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'var(--primary-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: '600',
                      fontSize: '14px'
                    }}>
                      {user.full_name.charAt(0).toUpperCase()}
                    </div>
                    <span>{user.full_name}</span>
                  </div>
                </td>
                <td dir="ltr">{user.username}</td>
                <td dir="ltr">{user.email}</td>
                <td>
                  <span 
                    className="role-badge" 
                    style={{ 
                      background: getRoleBadgeColor(user.role),
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}
                  >
                    {roleLabel(user.role)}
                  </span>
                </td>
                <td>
                  <span 
                    className="status-badge"
                    style={{
                      color: user.is_active ? '#10b981' : '#dc2626',
                      fontWeight: '500'
                    }}
                  >
                    {user.is_active ? t.userManagement.active : t.userManagement.inactive}
                  </span>
                </td>
                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn-icon btn-icon-edit"
                      onClick={() => handleOpenModal(user)}
                      title={t.userManagement.editUser}
                    >
                      <PencilIcon style={{ width: '18px', height: '18px' }} />
                    </button>
                    <button
                      className="btn-icon btn-icon-password"
                      onClick={() => handlePasswordResetClick(user)}
                      title={t.userManagement.resetPassword}
                    >
                      <KeyIcon style={{ width: '18px', height: '18px' }} />
                    </button>
                    <button
                      className="btn-icon btn-icon-delete"
                      onClick={() => handleDeleteClick(user)}
                      title={t.userManagement.deleteUser}
                    >
                      <TrashIcon style={{ width: '18px', height: '18px' }} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="empty-state">
            <UserIcon style={{ width: '64px', height: '64px', color: 'var(--text-secondary)' }} />
            <h3>{t.userManagement.emptyTitle}</h3>
            <p>{t.userManagement.emptyHint}</p>
          </div>
        )}
      </div>

      {/* Add/Edit User Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingUser ? t.userManagement.editUser : t.userManagement.addNewUser}</h2>
              <button className="modal-close" onClick={handleCloseModal}>
                <XMarkIcon style={{ width: '24px', height: '24px' }} />
              </button>
            </div>

            {error && (
              <div className="alert alert-error">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>{t.userManagement.fullName} <span className="required-mark" aria-hidden="true">*</span></label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                  placeholder={t.userManagement.fullNamePlaceholder}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>{t.userManagement.username} <span className="required-mark" aria-hidden="true">*</span></label>
                  <input
                    type="text"
                    dir="ltr"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                    disabled={!!editingUser}
                    placeholder={t.userManagement.usernamePlaceholder}
                  />
                </div>

                <div className="form-group">
                  <label>{t.userManagement.email} <span className="required-mark" aria-hidden="true">*</span></label>
                  <input
                    type="email"
                    dir="ltr"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    placeholder={t.userManagement.emailPlaceholder}
                  />
                </div>
              </div>

              {!editingUser && (
                <div className="form-group">
                  <label>{t.userManagement.password} <span className="required-mark" aria-hidden="true">*</span></label>
                  <input
                    type="password"
                    dir="ltr"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={6}
                    placeholder={t.userManagement.passwordPlaceholder}
                  />
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>{t.userManagement.role} <span className="required-mark" aria-hidden="true">*</span></label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'lawyer' | 'staff' })}
                    required
                  >
                    <option value="staff">{t.userManagement.roleStaff}</option>
                    <option value="lawyer">{t.userManagement.roleLawyer}</option>
                    <option value="admin">{t.userManagement.roleAdmin}</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>{t.userManagement.status}</label>
                  <select
                    value={formData.isActive ? 'active' : 'inactive'}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'active' })}
                  >
                    <option value="active">{t.userManagement.active}</option>
                    <option value="inactive">{t.userManagement.inactive}</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  {t.common.cancel}
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingUser ? t.userManagement.updateUser : t.userManagement.createUser}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t.userManagement.deleteUser}</h2>
              <button className="modal-close" onClick={() => setShowDeleteConfirm(false)}>
                <XMarkIcon style={{ width: '24px', height: '24px' }} />
              </button>
            </div>

            {/* Name on its own line rather than interpolated mid-sentence: the
                surrounding clause reorders between English, Kurdish and Arabic. */}
            <div style={{ padding: '20px', color: 'var(--text-secondary)' }}>
              <p style={{ marginBottom: '8px' }}>
                <strong style={{ color: 'var(--text-primary)' }}>{userToDelete?.full_name}</strong>
              </p>
              <p>{t.userManagement.deleteConfirm}</p>
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)}>
                {t.common.cancel}
              </button>
              <button className="btn btn-danger" onClick={handleDeleteConfirm}>
                {t.userManagement.deleteUser}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t.userManagement.resetPassword}</h2>
              <button className="modal-close" onClick={() => setShowPasswordModal(false)}>
                <XMarkIcon style={{ width: '24px', height: '24px' }} />
              </button>
            </div>

            {error && (
              <div className="alert alert-error">
                {error}
              </div>
            )}

            <form onSubmit={handlePasswordReset}>
              <div style={{ padding: '0 20px 20px', color: 'var(--text-secondary)' }}>
                <p>{t.userManagement.resetPasswordFor}</p>
                <p style={{ marginTop: '4px' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>{userForPassword?.full_name}</strong>
                </p>
              </div>

              <div className="form-group" style={{ padding: '0 20px' }}>
                <label>{t.userManagement.newPassword} <span className="required-mark" aria-hidden="true">*</span></label>
                <input
                  type="password"
                  dir="ltr"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder={t.userManagement.passwordPlaceholder}
                  autoFocus
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPasswordModal(false)}>
                  {t.common.cancel}
                </button>
                <button type="submit" className="btn btn-primary">
                  {t.userManagement.resetPassword}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagement;
