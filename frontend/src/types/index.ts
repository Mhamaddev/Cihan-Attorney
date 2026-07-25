export interface Applicant {
  id?: number;
  case_id?: number;
  name: string;
  phone_number: string;
  address: string;
  created_at?: string;
}

export interface Wanted {
  id?: number;
  case_id?: number;
  name: string;
  phone_number: string;
  address: string;
  created_at?: string;
}

export interface CourtDate {
  id?: number;
  case_id?: number;
  interview_date: string;
  notes: string;
  created_at?: string;
}

export interface Expense {
  id?: number;
  case_id?: number;
  expense_name: string;
  amount: string | number;
  expense_date: string;
  note: string;
  created_at?: string;
}

export interface CaseFile {
  id?: number;
  case_id?: number;
  file_name: string;
  file_path: string;
  file_type: string;
  category: string;
  uploaded_at?: string;
}

export interface Case {
  id?: number;
  request_type: string;
  is_called_for_court: boolean;
  status?: string;
  created_at?: string;
  updated_at?: string;
  applicants?: Applicant[];
  wanted?: Wanted[];
  court_dates?: CourtDate[];
  expenses?: Expense[];
  files?: CaseFile[];
}

export interface CreateCaseData {
  request_type: string;
  is_called_for_court: boolean;
  status?: string;
  applicant?: Applicant;
  wanted?: Wanted;
  court_dates?: CourtDate[];
  expenses?: Expense[];
}

export interface Todo {
  id: number;
  user_id: number;
  case_id: number | null;
  title: string;
  due_date: string | null;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
  // Present only on list responses, which join the case for display.
  case_request_type?: string | null;
}

export interface CreateTodoData {
  title: string;
  due_date?: string | null;
  case_id?: number | null;
}

export interface UpdateTodoData {
  title?: string;
  due_date?: string | null;
  case_id?: number | null;
  is_completed?: boolean;
}
