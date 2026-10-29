import {
  AccountStatus,
  CurrencyCode,
  PricingType,
  ProviderApprovalStatus,
} from './enums';

/**
 * 1 Jordanian Dinar (JOD) = 1,000 fils (integer minor units).
 */
export const JOD_MINOR_UNIT_FACTOR = 1000;
export const DEFAULT_MARKET_TIMEZONE = 'Asia/Amman';

export interface LocalizedTextContract {
  ar: string;
  en: string;
}

export interface ServicePricingPolicyContract {
  pricingType: PricingType;
  indicativeAmountFils: number;
  currency: CurrencyCode.JOD;
}

export function isValidFilsAmount(amount: unknown): amount is number {
  return typeof amount === 'number' && Number.isInteger(amount) && amount >= 0;
}

/**
 * Public-safe provider summary projection.
 * Deliberately excludes user email, phone, passwordHash, and internal admin approval notes.
 */
export interface PublicProviderSummaryProjection {
  id: string;
  displayName: string;
  bio: LocalizedTextContract;
  yearsOfExperience: number;
  coverageGovernorates: string[];
  coverageAreas: string[];
  approvalStatus: ProviderApprovalStatus.APPROVED;
  averageRating: number;
  reviewCount: number;
}

/**
 * Administrative provider projection restricted to ADMIN endpoints.
 */
export interface AdminProviderProjection {
  id: string;
  userId: string;
  email: string;
  accountStatus: AccountStatus;
  displayName: string;
  bio: LocalizedTextContract;
  yearsOfExperience: number;
  coverageGovernorates: string[];
  coverageAreas: string[];
  approvalStatus: ProviderApprovalStatus;
  approvalMetadata: {
    submittedAt?: string;
    reviewedAt?: string;
    reviewedByUserId?: string;
    rejectionOrSuspensionReason?: string;
    verificationNotes?: string;
  };
  averageRating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}
