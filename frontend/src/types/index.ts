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
