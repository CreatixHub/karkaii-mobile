export type UserRole =
  | 'superadmin'
  | 'admin'
  | 'teacher'
  | 'student'
  | 'parent'
  | 'accountant'
  | 'librarian'
  | 'receptionist'
  | 'warden'
  | 'transport_manager'
  | 'nurse'
  | 'security'
  | 'staff'
  | string;

export interface OrganizationInfo {
  id: string | number;
  slug: string;
  name: string;
  roles?: string[];
  status?: string;
}

export interface AuthUser {
  id: string | number;
  username: string | null;
  name: string;
  email: string | null;
  role: UserRole | null;
  userType?: string;
  status?: string;
  permissions: string[];
  avatar: string | null;
  avatarUrl?: string | null;
  phone: string | null;
  organization: OrganizationInfo | null;
  organizations?: OrganizationInfo[];
}

export interface LoginCredentials {
  email: string;
  password: string;
  organization?: string;
  rememberMe?: boolean;
}

export interface AuthSession {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number | string;
  user: AuthUser;
  organizations?: OrganizationInfo[];
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
}
