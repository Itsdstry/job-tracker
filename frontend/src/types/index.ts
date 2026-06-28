export type ApplicationStatus =
  | 'Applied'
  | 'Interview'
  | 'TechnicalTest'
  | 'Offer'
  | 'Rejected';

export interface User {
  id: string;
  name: string;
  email: string;
  emailReminders: boolean;
  createdAt: string;
  _count?: { applications: number };
}

export interface Application {
  id: string;
  company: string;
  position: string;
  salary: number | null;
  location: string | null;
  notes: string | null;
  url: string | null;
  applicationDate: string;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApplicationsResponse {
  applications: Application[];
  pagination: Pagination;
}

export interface DashboardStats {
  total: number;
  interviews: number;
  offers: number;
  rejected: number;
  technicalTests: number;
  interviewRate: number;
  offerRate: number;
}

export interface MonthlyData {
  month: string;
  count: number;
}

export interface StatusData {
  status: string;
  count: number;
}

export interface CompanyData {
  company: string;
  count: number;
}

export interface SalaryData {
  range: string;
  count: number;
}

export interface DashboardCharts {
  monthlyApplications: MonthlyData[];
  statusDistribution: StatusData[];
  topCompanies: CompanyData[];
  salaryDistribution: SalaryData[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface ApplicationFormData {
  company: string;
  position: string;
  salary: string;
  location: string;
  notes: string;
  url: string;
  applicationDate: string;
  status: ApplicationStatus;
}
