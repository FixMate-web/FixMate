import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LocalizedText, PricingType } from './catalog-api.service';

export type ProviderApprovalStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'SUSPENDED';

export interface AvailabilityWindow {
  dayOfWeek: number;
  startMinuteOfDay: number;
  endMinuteOfDay: number;
}

export interface ProviderOfferingItem {
  id: string;
  serviceId: string;
  service?: {
    id: string;
    slug: string;
    title: LocalizedText;
    categoryId: string;
    isActive: boolean;
  };
  pricingType: PricingType;
  priceAmountFils: number;
  currency: 'JOD';
  estimatedDurationMinutes: number;
  isEnabled: boolean;
}

export interface OwnerProviderProfile {
  id: string;
  userId: string;
  displayName: string;
  bio: LocalizedText;
  yearsOfExperience: number;
  coverageGovernorates: string[];
  coverageAreas: string[];
  weeklyAvailability: AvailabilityWindow[];
  approvalStatus: ProviderApprovalStatus;
  approvalFeedback: {
    submittedAt?: string;
    reviewedAt?: string;
    rejectionOrSuspensionReason?: string;
  };
  averageRating: number;
  reviewCount: number;
  offerings: ProviderOfferingItem[];
}

export interface AdminProviderProfile extends OwnerProviderProfile {
  user?: {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
    role: string;
    status: string;
  };
  adminMetadata: {
    submittedAt?: string;
    reviewedAt?: string;
    reviewedByUserId?: string;
    rejectionOrSuspensionReason?: string;
    verificationNotes?: string;
  };
}

export interface PublicProviderOffering {
  serviceId: string;
  serviceSlug: string;
  serviceTitle: LocalizedText;
  pricingType: PricingType;
  priceAmountFils: number;
  currency: 'JOD';
  estimatedDurationMinutes: number;
}

export interface PublicProviderSummary {
  id: string;
  displayName: string;
  bio: LocalizedText;
  yearsOfExperience: number;
  coverageGovernorates: string[];
  coverageAreas: string[];
  approvalStatus: 'APPROVED';
  averageRating: number | null;
  reviewCount: number;
  offerings: PublicProviderOffering[];
}

export interface PublicProviderDetail extends PublicProviderSummary {
  weeklyAvailability: AvailabilityWindow[];
}

export interface PaginatedPublicProvidersResponse {
  items: PublicProviderSummary[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedAdminProvidersResponse {
  items: AdminProviderProfile[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PublicProvidersQueryParams {
  page?: number;
  limit?: number;
  q?: string;
  serviceSlug?: string;
  serviceId?: string;
  categorySlug?: string;
  governorate?: string;
  area?: string;
  sort?: 'newest' | 'name_asc' | 'experience_desc';
}

export function formatMinuteOfDay(minute: number): string {
  const safe = Math.max(0, Math.min(1440, Math.round(minute)));
  const hh = String(Math.floor(safe / 60)).padStart(2, '0');
  const mm = String(safe % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

@Injectable({ providedIn: 'root' })
export class ProvidersApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = environment.apiBaseUrl;

  getMyProfile(): Observable<OwnerProviderProfile> {
    return this.http.get<OwnerProviderProfile>(`${this.apiBase}/providers/me`);
  }

  updateMyProfile(payload: {
    displayName?: string;
    bio?: LocalizedText;
    yearsOfExperience?: number;
    coverageGovernorates?: string[];
    coverageAreas?: string[];
    weeklyAvailability?: AvailabilityWindow[];
  }): Observable<OwnerProviderProfile> {
    return this.http.patch<OwnerProviderProfile>(`${this.apiBase}/providers/me`, payload);
  }

  applyAsProvider(payload: {
    displayName: string;
    bio: LocalizedText;
    yearsOfExperience: number;
    coverageGovernorates: string[];
    coverageAreas: string[];
    weeklyAvailability?: AvailabilityWindow[];
  }): Observable<OwnerProviderProfile> {
    return this.http.post<OwnerProviderProfile>(`${this.apiBase}/providers/apply`, payload);
  }

  submitForReview(): Observable<OwnerProviderProfile> {
    return this.http.post<OwnerProviderProfile>(`${this.apiBase}/providers/me/submit`, {});
  }

  getMyServices(): Observable<ProviderOfferingItem[]> {
    return this.http.get<ProviderOfferingItem[]>(`${this.apiBase}/providers/me/services`);
  }

  upsertMyService(payload: {
    serviceId: string;
    pricingType: PricingType;
    priceAmountFils: number;
    estimatedDurationMinutes: number;
    isEnabled?: boolean;
  }): Observable<ProviderOfferingItem> {
    return this.http.put<ProviderOfferingItem>(`${this.apiBase}/providers/me/services`, payload);
  }

  removeMyService(serviceId: string): Observable<{ removed: boolean; serviceId: string }> {
    return this.http.delete<{ removed: boolean; serviceId: string }>(
      `${this.apiBase}/providers/me/services/${encodeURIComponent(serviceId)}`,
    );
  }

  listProvidersForAdmin(
    status?: ProviderApprovalStatus | '',
    page = 1,
    limit = 20,
  ): Observable<PaginatedAdminProvidersResponse> {
    let params = new HttpParams().set('page', String(page)).set('limit', String(limit));
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<PaginatedAdminProvidersResponse>(`${this.apiBase}/admin/providers`, {
      params,
    });
  }

  updateProviderApproval(
    providerProfileId: string,
    payload: {
      status: 'APPROVED' | 'REJECTED' | 'SUSPENDED';
      reason?: string;
      verificationNotes?: string;
    },
  ): Observable<AdminProviderProfile> {
    return this.http.patch<AdminProviderProfile>(
      `${this.apiBase}/admin/providers/${encodeURIComponent(providerProfileId)}/approval`,
      payload,
    );
  }

  listPublicProviders(
    query: PublicProvidersQueryParams = {},
  ): Observable<PaginatedPublicProvidersResponse> {
    let params = new HttpParams();
    if (query.page) params = params.set('page', String(query.page));
    if (query.limit) params = params.set('limit', String(query.limit));
    if (query.q && query.q.trim()) params = params.set('q', query.q.trim());
    if (query.serviceSlug) params = params.set('serviceSlug', query.serviceSlug);
    if (query.serviceId) params = params.set('serviceId', query.serviceId);
    if (query.categorySlug) params = params.set('categorySlug', query.categorySlug);
    if (query.governorate) params = params.set('governorate', query.governorate);
    if (query.area && query.area.trim()) params = params.set('area', query.area.trim());
    if (query.sort) params = params.set('sort', query.sort);

    return this.http.get<PaginatedPublicProvidersResponse>(`${this.apiBase}/providers`, { params });
  }

  getPublicProviderById(id: string): Observable<PublicProviderDetail> {
    return this.http.get<PublicProviderDetail>(
      `${this.apiBase}/providers/${encodeURIComponent(id)}`,
    );
  }
}
