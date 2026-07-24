import type { Case, CreateCaseData, CourtDate, Expense, CaseFile } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Auth APIs
export interface LoginResponse {
  token: string;
  user: {
    id: number;
    username: string;
    email: string;
    fullName: string;
    role: string;
    isActive: boolean;
  };
}

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: 'admin' | 'lawyer' | 'staff';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const login = async (username: string, password: string): Promise<LoginResponse> => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Login failed');
  }
  return response.json();
};

// User Management APIs
export const getAllUsers = async (): Promise<User[]> => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/users`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) throw new Error('Failed to fetch users');
  return response.json();
};

export const getUserById = async (id: number): Promise<User> => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/users/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) throw new Error('Failed to fetch user');
  return response.json();
};

export const createUser = async (userData: {
  username: string;
  email: string;
  password: string;
  fullName: string;
  role: string;
}): Promise<User> => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(userData),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create user');
  }
  return response.json();
};

export const updateUser = async (id: number, userData: Partial<User>): Promise<User> => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/users/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(userData),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update user');
  }
  return response.json();
};

export const deleteUser = async (id: number): Promise<void> => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/users/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete user');
  }
  return response.json();
};

export const resetUserPassword = async (id: number, newPassword: string): Promise<void> => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/users/${id}/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ newPassword }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to reset password');
  }
  return response.json();
};

export const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to change password');
  }
  return response.json();
};

// Cases
export const getAllCases = async (): Promise<Case[]> => {
  const response = await fetch(`${API_URL}/cases`);
  if (!response.ok) throw new Error('Failed to fetch cases');
  return response.json();
};

export const getCaseById = async (id: string | number): Promise<Case> => {
  const response = await fetch(`${API_URL}/cases/${id}`);
  if (!response.ok) throw new Error('Failed to fetch case');
  return response.json();
};

export const createCase = async (caseData: CreateCaseData): Promise<Case> => {
  const response = await fetch(`${API_URL}/cases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(caseData),
  });
  if (!response.ok) throw new Error('Failed to create case');
  return response.json();
};

export const updateCase = async (id: string | number, caseData: Partial<CreateCaseData>): Promise<Case> => {
  const response = await fetch(`${API_URL}/cases/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(caseData),
  });
  if (!response.ok) throw new Error('Failed to update case');
  return response.json();
};

export const deleteCase = async (id: string | number): Promise<void> => {
  const response = await fetch(`${API_URL}/cases/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete case');
  return response.json();
};

// Court Dates
export const addCourtDate = async (caseId: string | number, courtDate: Omit<CourtDate, 'id' | 'case_id' | 'created_at'>): Promise<CourtDate> => {
  const response = await fetch(`${API_URL}/cases/${caseId}/court-dates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(courtDate),
  });
  if (!response.ok) throw new Error('Failed to add court date');
  return response.json();
};

export const deleteCourtDate = async (caseId: string | number, courtDateId: string | number): Promise<void> => {
  const response = await fetch(`${API_URL}/cases/${caseId}/court-dates/${courtDateId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete court date');
  return response.json();
};

// Expenses
export const addExpense = async (caseId: string | number, expense: Omit<Expense, 'id' | 'case_id' | 'created_at'>): Promise<Expense> => {
  const response = await fetch(`${API_URL}/cases/${caseId}/expenses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(expense),
  });
  if (!response.ok) throw new Error('Failed to add expense');
  return response.json();
};

export const deleteExpense = async (caseId: string | number, expenseId: string | number): Promise<void> => {
  const response = await fetch(`${API_URL}/cases/${caseId}/expenses/${expenseId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete expense');
  return response.json();
};

// Files
export const uploadFile = async (caseId: string | number, file: File, category: string): Promise<CaseFile> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', category);

  const response = await fetch(`${API_URL}/cases/${caseId}/files`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) throw new Error('Failed to upload file');
  return response.json();
};

export const deleteFile = async (caseId: string | number, fileId: string | number): Promise<void> => {
  const response = await fetch(`${API_URL}/cases/${caseId}/files/${fileId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete file');
  return response.json();
};
