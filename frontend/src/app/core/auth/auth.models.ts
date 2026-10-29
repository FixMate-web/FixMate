export type UserRole = 'CUSTOMER' | 'PROVIDER' | 'ADMIN';
export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
export type SupportedLanguage = 'ar' | 'en';

export interface AuthUserProfile {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: AccountStatus;
  preferredLanguage: SupportedLanguage;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthSessionResponse {
  user: AuthUserProfile;
  accessToken: string;
  expiresInSeconds: number;
}

export interface RegisterRequestPayload {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  role: 'CUSTOMER' | 'PROVIDER';
  preferredLanguage?: SupportedLanguage;
}

export interface LoginRequestPayload {
  email: string;
  password: string;
}

export interface UpdateProfilePayload {
  fullName?: string;
  phone?: string;
  preferredLanguage?: SupportedLanguage;
}
