import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PricingType } from './catalog-api.service';

export type BookingStatus =
  | 'REQUESTED'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'WORK_DONE'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'EXPIRED';

export interface SavedAddress {
  id: string;
  customerId: string;
  label?: string;
  governorate: string;
  cityOrDistrict: string;
  street: string;
  building: string;
  floorOrApartment?: string;
  landmark?: string;
  contactPhone: string;
  isDefault: boolean;
  createdAt?: string;
}

export interface CreateAddressPayload {
  label?: string;
  governorate: string;
  cityOrDistrict: string;
  street: string;
  building: string;
  floorOrApartment?: string;
  landmark?: string;
  contactPhone: string;
  isDefault?: boolean;
}

export interface BookingEventItem {
  id: string;
  bookingId: string;
  actorUserId?: string;
  actorRole: 'CUSTOMER' | 'PROVIDER' | 'ADMIN' | 'SYSTEM';
  eventKind: 'CREATED' | 'STATUS_CHANGED' | 'ADMIN_INTERVENTION';
  fromStatus?: BookingStatus;
  toStatus: BookingStatus;
  reason?: string;
  occurredAt: string;
}

export interface BookingItem {
  id: string;
  customerId: string;
  customerName?: string;
  providerProfileId: string;
  providerDisplayName?: string;
  serviceId: string;
  serviceSnapshot: {
    slug: string;
    titleAr: string;
    titleEn: string;
    categorySlug: string;
  };
  addressSnapshot: {
    label?: string;
    governorate: string;
    cityOrDistrict: string;
    street: string;
    building: string;
    floorOrApartment?: string;
    landmark?: string;
    contactPhone: string;
  };
  pricingSnapshot: {
    pricingType: PricingType;
    quotedAmountFils: number;
    agreedAmountFils?: number;
    currency: 'JOD';
  };
  requestedStartUtc: string;
  requestedEndUtc: string;
  confirmedStartUtc?: string;
  confirmedEndUtc?: string;
  status: BookingStatus;
  customerNotes?: string;
  providerNotes?: string;
  rejectionReason?: string;
  cancellationReason?: string;
  cancelledByRole?: 'CUSTOMER' | 'PROVIDER' | 'ADMIN' | 'SYSTEM';
  acceptedAt?: string;
  startedAt?: string;
  workDoneAt?: string;
  completedAt?: string;
  rejectedAt?: string;
  cancelledAt?: string;
  expiredAt?: string;
  createdAt?: string;
  hasReview?: boolean;
}

export interface BookingDetail extends BookingItem {
  events: BookingEventItem[];
  reservedSlots: Array<{ slotStartUtc: string; slotEndUtc: string }>;
}

export interface PaginatedBookingsResponse {
  items: BookingItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PublicReviewItem {
  id: string;
  bookingId: string;
  providerProfileId: string;
  customerName: string;
  serviceTitle?: { ar: string; en: string };
  rating: number;
  comment?: string;
  createdAt?: string;
}

export interface AdminReviewItem extends PublicReviewItem {
  customerId: string;
  providerDisplayName?: string;
  moderationStatus: 'VISIBLE' | 'HIDDEN';
  moderatedByUserId?: string;
  moderationReason?: string;
}

export interface NotificationItem {
  id: string;
  recipientUserId: string;
  type: string;
  title: { ar: string; en: string };
  body: { ar: string; en: string };
  relatedResourceType: 'BOOKING' | 'PROVIDER_PROFILE' | 'REVIEW';
  relatedResourceId?: string;
  isRead: boolean;
  readAt?: string;
  createdAt?: string;
}

export interface PaginatedNotificationsResponse {
  items: NotificationItem[];
  unreadCount: number;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AdminOverviewMetrics {
  users: {
    total: number;
    customers: number;
    providers: number;
    admins: number;
    active: number;
    suspended: number;
  };
  providers: {
    total: number;
    approved: number;
    pendingReview: number;
    rejected: number;
    suspended: number;
    draft: number;
  };
  bookings: {
    total: number;
    requested: number;
    accepted: number;
    inProgress: number;
    workDone: number;
    completed: number;
    cancelled: number;
    rejected: number;
    expired: number;
  };
  reviews: {
    total: number;
    visible: number;
    hidden: number;
  };
  catalog: {
    activeCategories: number;
    activeServices: number;
  };
}

export interface AdminUserItem {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: 'CUSTOMER' | 'PROVIDER' | 'ADMIN';
  status: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
  createdAt?: string;
}

@Injectable({
  providedIn: 'root',
})
export class BookingsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  // Addresses
  listMyAddresses(): Observable<SavedAddress[]> {
    return this.http.get<SavedAddress[]>(`${this.baseUrl}/addresses`);
  }

  createAddress(payload: CreateAddressPayload): Observable<SavedAddress> {
    return this.http.post<SavedAddress>(`${this.baseUrl}/addresses`, payload);
  }

  updateAddress(
    id: string,
    payload: Partial<CreateAddressPayload>,
  ): Observable<SavedAddress> {
    return this.http.patch<SavedAddress>(
      `${this.baseUrl}/addresses/${id}`,
      payload,
    );
  }

  deleteAddress(id: string): Observable<{ deleted: boolean; id: string }> {
    return this.http.delete<{ deleted: boolean; id: string }>(
      `${this.baseUrl}/addresses/${id}`,
    );
  }

  // Bookings
  createBooking(payload: {
    providerProfileId: string;
    serviceId: string;
    requestedStartUtc: string;
    addressId?: string;
    address?: CreateAddressPayload;
    customerNotes?: string;
    clientRequestId?: string;
  }): Observable<BookingDetail> {
    return this.http.post<BookingDetail>(`${this.baseUrl}/bookings`, payload);
  }

  listBookings(params?: {
    status?: BookingStatus | '';
    page?: number;
    limit?: number;
  }): Observable<PaginatedBookingsResponse> {
    let httpParams = new HttpParams();
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.page) httpParams = httpParams.set('page', String(params.page));
    if (params?.limit) httpParams = httpParams.set('limit', String(params.limit));

    return this.http.get<PaginatedBookingsResponse>(
      `${this.baseUrl}/bookings`,
      { params: httpParams },
    );
  }

  getBookingById(id: string): Observable<BookingDetail> {
    return this.http.get<BookingDetail>(`${this.baseUrl}/bookings/${id}`);
  }

  acceptBooking(id: string, providerNotes?: string): Observable<BookingDetail> {
    return this.http.patch<BookingDetail>(
      `${this.baseUrl}/bookings/${id}/accept`,
      providerNotes ? { providerNotes } : {},
    );
  }

  rejectBooking(id: string, reason: string): Observable<BookingDetail> {
    return this.http.patch<BookingDetail>(
      `${this.baseUrl}/bookings/${id}/reject`,
      { reason },
    );
  }

  startBooking(id: string, providerNotes?: string): Observable<BookingDetail> {
    return this.http.patch<BookingDetail>(
      `${this.baseUrl}/bookings/${id}/start`,
      providerNotes ? { providerNotes } : {},
    );
  }

  markWorkDone(
    id: string,
    payload: { agreedAmountFils?: number; providerNotes?: string },
  ): Observable<BookingDetail> {
    return this.http.patch<BookingDetail>(
      `${this.baseUrl}/bookings/${id}/work-done`,
      payload,
    );
  }

  completeBooking(id: string, reason?: string): Observable<BookingDetail> {
    return this.http.patch<BookingDetail>(
      `${this.baseUrl}/bookings/${id}/complete`,
      reason ? { reason } : {},
    );
  }

  cancelBooking(id: string, reason: string): Observable<BookingDetail> {
    return this.http.patch<BookingDetail>(
      `${this.baseUrl}/bookings/${id}/cancel`,
      { reason },
    );
  }

  // Reviews
  submitBookingReview(
    bookingId: string,
    payload: { rating: number; comment?: string },
  ): Observable<PublicReviewItem> {
    return this.http.post<PublicReviewItem>(
      `${this.baseUrl}/bookings/${bookingId}/review`,
      payload,
    );
  }

  listPublicProviderReviews(
    providerProfileId: string,
    page = 1,
    limit = 10,
  ): Observable<{
    items: PublicReviewItem[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('limit', String(limit));
    return this.http.get<{
      items: PublicReviewItem[];
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    }>(`${this.baseUrl}/providers/${providerProfileId}/reviews`, { params });
  }

  listMyReviews(): Observable<PublicReviewItem[]> {
    return this.http.get<PublicReviewItem[]>(`${this.baseUrl}/reviews/me`);
  }

  listAdminReviews(
    page = 1,
    moderationStatus?: 'VISIBLE' | 'HIDDEN' | '',
  ): Observable<{
    items: AdminReviewItem[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }> {
    let params = new HttpParams().set('page', String(page));
    if (moderationStatus) {
      params = params.set('moderationStatus', moderationStatus);
    }
    return this.http.get<{
      items: AdminReviewItem[];
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    }>(`${this.baseUrl}/admin/reviews`, { params });
  }

  moderateReviewVisibility(
    reviewId: string,
    payload: { moderationStatus: 'VISIBLE' | 'HIDDEN'; reason?: string },
  ): Observable<AdminReviewItem> {
    return this.http.patch<AdminReviewItem>(
      `${this.baseUrl}/admin/reviews/${reviewId}/visibility`,
      payload,
    );
  }

  // Notifications
  listMyNotifications(
    page = 1,
    unreadOnly = false,
  ): Observable<PaginatedNotificationsResponse> {
    let params = new HttpParams().set('page', String(page));
    if (unreadOnly) params = params.set('unreadOnly', 'true');
    return this.http.get<PaginatedNotificationsResponse>(
      `${this.baseUrl}/notifications`,
      { params },
    );
  }

  markNotificationRead(id: string): Observable<NotificationItem> {
    return this.http.patch<NotificationItem>(
      `${this.baseUrl}/notifications/${id}/read`,
      {},
    );
  }

  markAllNotificationsRead(): Observable<{ updatedCount: number }> {
    return this.http.post<{ updatedCount: number }>(
      `${this.baseUrl}/notifications/read-all`,
      {},
    );
  }

  // Admin Overview & Users
  getAdminOverview(): Observable<AdminOverviewMetrics> {
    return this.http.get<AdminOverviewMetrics>(
      `${this.baseUrl}/admin/overview`,
    );
  }

  listAdminUsers(params?: {
    role?: string;
    status?: string;
    q?: string;
    page?: number;
  }): Observable<{
    items: AdminUserItem[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }> {
    let httpParams = new HttpParams();
    if (params?.role) httpParams = httpParams.set('role', params.role);
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.q) httpParams = httpParams.set('q', params.q);
    if (params?.page) httpParams = httpParams.set('page', String(params.page));
    return this.http.get<{
      items: AdminUserItem[];
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    }>(`${this.baseUrl}/admin/users`, { params: httpParams });
  }

  updateAdminUserStatus(
    userId: string,
    status: 'ACTIVE' | 'SUSPENDED',
  ): Observable<AdminUserItem> {
    return this.http.patch<AdminUserItem>(
      `${this.baseUrl}/admin/users/${userId}/status`,
      { status },
    );
  }
}
