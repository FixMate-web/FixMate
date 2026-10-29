import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { BookingsApiService } from './bookings-api.service';

describe('BookingsApiService (Phases 3–5)', () => {
  let service: BookingsApiService;
  let httpMock: HttpTestingController;
  const baseUrl = environment.apiBaseUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        BookingsApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(BookingsApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('creates a booking and maps the response', () => {
    let createdId = '';
    service
      .createBooking({
        providerProfileId: 'prov-1',
        serviceId: 'svc-1',
        requestedStartUtc: '2026-11-10T10:00:00.000Z',
        addressId: 'addr-1',
      })
      .subscribe((res) => {
        createdId = res.id;
      });

    const req = httpMock.expectOne(`${baseUrl}/bookings`);
    expect(req.request.method).toBe('POST');
    req.flush({
      id: 'booking-123',
      status: 'REQUESTED',
      events: [],
      reservedSlots: [],
    });

    expect(createdId).toBe('booking-123');
  });

  it('submits a verified review for a completed booking', () => {
    let rating = 0;
    service
      .submitBookingReview('booking-123', {
        rating: 5,
        comment: 'Great service',
      })
      .subscribe((res) => {
        rating = res.rating;
      });

    const req = httpMock.expectOne(`${baseUrl}/bookings/booking-123/review`);
    expect(req.request.method).toBe('POST');
    req.flush({
      id: 'rev-1',
      bookingId: 'booking-123',
      providerProfileId: 'prov-1',
      customerName: 'Ahmad',
      rating: 5,
      comment: 'Great service',
    });

    expect(rating).toBe(5);
  });

  it('fetches notifications and marks all read', () => {
    let unread = -1;
    service.listMyNotifications(1, true).subscribe((res) => {
      unread = res.unreadCount;
    });

    const listReq = httpMock.expectOne(
      `${baseUrl}/notifications?page=1&unreadOnly=true`,
    );
    expect(listReq.request.method).toBe('GET');
    listReq.flush({
      items: [],
      unreadCount: 3,
      page: 1,
      limit: 20,
      total: 3,
      totalPages: 1,
    });
    expect(unread).toBe(3);

    let updatedCount = 0;
    service.markAllNotificationsRead().subscribe((res) => {
      updatedCount = res.updatedCount;
    });
    const markAllReq = httpMock.expectOne(`${baseUrl}/notifications/read-all`);
    expect(markAllReq.request.method).toBe('POST');
    markAllReq.flush({ updatedCount: 3 });
    expect(updatedCount).toBe(3);
  });
});
