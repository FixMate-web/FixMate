import { AccountStatus, SupportedLanguage, UserRole } from '../domain';

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  status: AccountStatus;
  preferredLanguage: SupportedLanguage;
}

export interface JwtAccessPayload {
  sub: string;
  role: UserRole;
  tokenType: 'access';
  iss?: string;
  aud?: string;
  iat?: number;
  exp?: number;
}
