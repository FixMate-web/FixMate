import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { LanguageService } from '../../core/i18n/language.service';
import {
  BookingDetail,
  BookingItem,
  BookingsApiService,
  BookingStatus,
} from '../../core/services/bookings-api.service';
import {
  governorateLabel,
  money,
  pricingLabel,
} from '../../shared/marketplace/marketplace.utils';

@Component({
  selector: 'app-bookings-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-header">
      <span class="eyebrow">{{
        ar() ? 'حجوزات المواعيد ودورة التنفيذ' : 'APPOINTMENTS & JOB LIFECYCLE'
      }}</span>
      <h1>
        {{
          selectedBooking()
            ? ar()
              ? 'تفاصيل الحجز وسجل الحالات'
              : 'Booking details & timeline'
            : ar()
              ? 'حجوزات المواعيد'
              : 'Appointment bookings'
        }}
      </h1>
      <p>
        {{
          ar()
            ? 'تابع حالة الحجز، فترات السعة المحجوزة (٣٠ دقيقة)، وتأكيد إتمام الخدمة.'
            : 'Track appointment status, reserved 30-minute capacity slots, and job completion.'
        }}
      </p>
    </header>

    @if (error()) {
      <div class="request-error" role="alert">{{ error() }}</div>
    }

    @if (success()) {
      <div class="booking-success" role="status">{{ success() }}</div>
    }

    @if (selectedBooking(); as b) {
      <div class="booking-detail-nav">
        <a routerLink="/dashboard/bookings" class="text-button">
          ← {{ ar() ? 'العودة إلى جميع الحجوزات' : 'Back to all bookings' }}
        </a>
      </div>

      <article class="request-item booking-detail-card">
        <div class="request-heading">
          <div>
            <span class="request-status" [attr.data-status]="b.status">{{
              statusLabel(b.status)
            }}</span>
            <h2>
              {{
                ar() ? b.serviceSnapshot.titleAr : b.serviceSnapshot.titleEn
              }}
            </h2>
            <p>
              <strong>{{
                auth.currentUser()?.role === 'PROVIDER'
                  ? b.customerName || 'Customer'
                  : b.providerDisplayName || 'Provider'
              }}</strong>
              · {{ governorateLabel(b.addressSnapshot.governorate, ar()) }} ·
              {{ b.addressSnapshot.cityOrDistrict }}
            </p>
          </div>
          <div class="booking-price-box">
            <small>{{
              pricingLabel(b.pricingSnapshot.pricingType, ar())
            }}</small>
            <strong>{{
              money(
                b.pricingSnapshot.agreedAmountFils ??
                  b.pricingSnapshot.quotedAmountFils,
                i18n.lang()
              )
            }}</strong>
          </div>
        </div>

        <div class="snapshot-grid">
          <div class="snapshot-card">
            <h3>{{ ar() ? 'الموعد المطلوب' : 'Scheduled window' }}</h3>
            <p dir="ltr">
              {{ formatDateTime(b.requestedStartUtc) }} →
              {{ formatDateTime(b.requestedEndUtc) }}
            </p>
            @if (b.reservedSlots.length > 0) {
              <small>
                {{
                  ar()
                    ? 'فترات ٣٠ دقيقة محجوزة ومؤكدة:'
                    : 'Locked 30-minute capacity slots:'
                }}
                {{ b.reservedSlots.length }}
              </small>
            }
          </div>

          <div class="snapshot-card">
            <h3>
              {{
                ar() ? 'عنوان الخدمة (لقطة ثابتة)' : 'Immutable address snapshot'
              }}
            </h3>
            <p>
              {{ governorateLabel(b.addressSnapshot.governorate, ar()) }} —
              {{ b.addressSnapshot.cityOrDistrict }},
              {{ b.addressSnapshot.street }}, {{ b.addressSnapshot.building }}
            </p>
            <small dir="ltr">{{ b.addressSnapshot.contactPhone }}</small>
          </div>
        </div>

        @if (b.customerNotes) {
          <div class="provider-response">
            <h3>{{ ar() ? 'ملاحظات العميل' : 'Customer notes' }}</h3>
            <p>{{ b.customerNotes }}</p>
          </div>
        }

        @if (b.providerNotes) {
          <div class="provider-response">
            <h3>{{ ar() ? 'ملاحظات المزود' : 'Professional notes' }}</h3>
            <p>{{ b.providerNotes }}</p>
          </div>
        }

        @if (b.rejectionReason) {
          <div class="request-error">
            <strong>{{ ar() ? 'سبب الاعتذار:' : 'Decline reason:' }}</strong>
            {{ b.rejectionReason }}
          </div>
        }

        @if (b.cancellationReason) {
          <div class="request-error">
            <strong>{{
              ar() ? 'سبب الإلغاء:' : 'Cancellation reason:'
            }}</strong>
            {{ b.cancellationReason }}
          </div>
        }

        <!-- Role-gated Lifecycle Actions -->
        <div class="lifecycle-actions">
          @if (auth.currentUser()?.role === 'PROVIDER') {
            @if (b.status === 'REQUESTED') {
              <div class="action-group">
                <input
                  type="text"
                  [(ngModel)]="actionNotes"
                  [placeholder]="
                    ar()
                      ? 'ملاحظة للموعد أو سبب الاعتذار...'
                      : 'Optional note or decline reason...'
                  "
                />
                <div class="button-row">
                  <button
                    type="button"
                    class="fm-link-button"
                    [disabled]="busy()"
                    (click)="accept(b.id)"
                  >
                    {{
                      ar()
                        ? 'قبول الحجز وقفل الموعد'
                        : 'Accept & reserve slots'
                    }}
                  </button>
                  <button
                    type="button"
                    class="text-button"
                    [disabled]="busy()"
                    (click)="reject(b.id)"
                  >
                    {{ ar() ? 'الاعتذار عن الموعد' : 'Decline request' }}
                  </button>
                </div>
              </div>
            }

            @if (b.status === 'ACCEPTED') {
              <div class="action-group">
                <input
                  type="text"
                  [(ngModel)]="actionNotes"
                  [placeholder]="
                    ar()
                      ? 'ملاحظات بدء العمل أو سبب الإلغاء...'
                      : 'Work start note or cancellation reason...'
                  "
                />
                <div class="button-row">
                  <button
                    type="button"
                    class="fm-link-button"
                    [disabled]="busy()"
                    (click)="startWork(b.id)"
                  >
                    {{
                      ar() ? 'بدء تنفيذ العمل (IN_PROGRESS)' : 'Start work on site'
                    }}
                  </button>
                  <button
                    type="button"
                    class="text-button"
                    [disabled]="busy()"
                    (click)="cancel(b.id)"
                  >
                    {{
                      ar()
                        ? 'إلغاء الموعد وتحرير الفترات'
                        : 'Cancel & release slots'
                    }}
                  </button>
                </div>
              </div>
            }

            @if (b.status === 'IN_PROGRESS') {
              <div class="action-group">
                <input
                  type="text"
                  [(ngModel)]="actionNotes"
                  [placeholder]="
                    ar()
                      ? 'ملخص العمل المنجز للعميل...'
                      : 'Summary of completed work for the customer...'
                  "
                />
                <button
                  type="button"
                  class="fm-link-button"
                  [disabled]="busy()"
                  (click)="markWorkDone(b.id)"
                >
                  {{
                    ar()
                      ? 'إشعار العميل بإتمام العمل (WORK_DONE)'
                      : 'Mark work done'
                  }}
                </button>
              </div>
            }
          }

          @if (auth.currentUser()?.role === 'CUSTOMER') {
            @if (b.status === 'WORK_DONE') {
              <div class="action-group">
                <button
                  type="button"
                  class="fm-link-button"
                  [disabled]="busy()"
                  (click)="complete(b.id)"
                >
                  {{
                    ar()
                      ? 'تأكيد استلام وإتمام الخدمة (COMPLETED)'
                      : 'Confirm job completion'
                  }}
                </button>
              </div>
            }

            @if (b.status === 'REQUESTED' || b.status === 'ACCEPTED') {
              <div class="action-group">
                <input
                  type="text"
                  [(ngModel)]="actionNotes"
                  [placeholder]="
                    ar()
                      ? 'سبب إلغاء الحجز (٣ أحرف على الأقل)...'
                      : 'Reason for cancelling (min 3 characters)...'
                  "
                />
                <button
                  type="button"
                  class="text-button"
                  [disabled]="busy()"
                  (click)="cancel(b.id)"
                >
                  {{ ar() ? 'إلغاء الحجز' : 'Cancel booking' }}
                </button>
              </div>
            }

            @if (b.status === 'COMPLETED' && !b.hasReview) {
              <form class="review-box" (ngSubmit)="submitReview(b.id)">
                <h3>
                  {{
                    ar()
                      ? 'أضف تقييمك الموثق لهذه الخدمة'
                      : 'Leave a verified review for this completed job'
                  }}
                </h3>
                <div class="field-row-review">
                  <div class="field">
                    <label for="rev-rating">{{
                      ar() ? 'التقييم (١ إلى ٥ نجوم)' : 'Rating (1 to 5 stars)'
                    }}</label>
                    <select
                      id="rev-rating"
                      name="reviewRating"
                      [(ngModel)]="reviewRating"
                    >
                      <option [ngValue]="5">★★★★★ (5/5)</option>
                      <option [ngValue]="4">★★★★☆ (4/5)</option>
                      <option [ngValue]="3">★★★☆☆ (3/5)</option>
                      <option [ngValue]="2">★★☆☆☆ (2/5)</option>
                      <option [ngValue]="1">★☆☆☆☆ (1/5)</option>
                    </select>
                  </div>
                  <div class="field">
                    <label for="rev-comment">{{
                      ar() ? 'تعليقك حول التجربة' : 'Your review comment'
                    }}</label>
                    <textarea
                      id="rev-comment"
                      name="reviewComment"
                      rows="3"
                      maxlength="1000"
                      [(ngModel)]="reviewComment"
                      [placeholder]="
                        ar()
                          ? 'كيف كانت دقة الموعد وجودة العمل؟'
                          : 'How was the punctuality and quality of work?'
                      "
                    ></textarea>
                  </div>
                </div>
                <button
                  type="submit"
                  class="fm-link-button"
                  [disabled]="busy()"
                >
                  {{ ar() ? 'نشر التقييم' : 'Submit verified review' }}
                </button>
              </form>
            }
          }
        </div>

        <!-- Audit Timeline -->
        <section class="timeline-section">
          <h3>
            {{
              ar()
                ? 'سجل أحداث الحجز غير القابل للتعديل'
                : 'Immutable booking audit timeline'
            }}
          </h3>
          <ol class="timeline-list">
            @for (ev of b.events; track ev.id) {
              <li>
                <strong>{{ ev.toStatus }}</strong>
                <span>({{ ev.actorRole }})</span>
                <time>{{ formatDateTime(ev.occurredAt) }}</time>
                @if (ev.reason) {
                  <p>{{ ev.reason }}</p>
                }
              </li>
            }
          </ol>
        </section>
      </article>
    } @else {
      <div class="filter-bar">
        <label for="booking-status-filter">{{
          ar() ? 'تصفية حسب الحالة:' : 'Filter by status:'
        }}</label>
        <select
          id="booking-status-filter"
          [ngModel]="statusFilter()"
          (ngModelChange)="onStatusFilter($event)"
        >
          <option value="">{{ ar() ? 'جميع الحجوزات' : 'All bookings' }}</option>
          <option value="REQUESTED">REQUESTED</option>
          <option value="ACCEPTED">ACCEPTED</option>
          <option value="IN_PROGRESS">IN_PROGRESS</option>
          <option value="WORK_DONE">WORK_DONE</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="CANCELLED">CANCELLED</option>
          <option value="REJECTED">REJECTED</option>
          <option value="EXPIRED">EXPIRED</option>
        </select>
      </div>

      @if (loading()) {
        <div class="skeleton" style="height: 280px" aria-busy="true"></div>
      } @else {
        <div class="requests-list">
          @for (item of bookings(); track item.id) {
            <article class="request-item">
              <div class="request-heading">
                <div>
                  <span class="request-status" [attr.data-status]="item.status">{{
                    statusLabel(item.status)
                  }}</span>
                  <h2>
                    {{
                      ar()
                        ? item.serviceSnapshot.titleAr
                        : item.serviceSnapshot.titleEn
                    }}
                  </h2>
                  <p>
                    {{
                      auth.currentUser()?.role === 'PROVIDER'
                        ? item.customerName || 'Customer'
                        : item.providerDisplayName || 'Provider'
                    }}
                    ·
                    {{
                      governorateLabel(item.addressSnapshot.governorate, ar())
                    }}
                    · {{ item.addressSnapshot.cityOrDistrict }}
                  </p>
                </div>
                <div class="booking-price-box">
                  <strong>{{
                    money(
                      item.pricingSnapshot.agreedAmountFils ??
                        item.pricingSnapshot.quotedAmountFils,
                      i18n.lang()
                    )
                  }}</strong>
                  <time dir="ltr">{{
                    formatDateTime(item.requestedStartUtc)
                  }}</time>
                </div>
              </div>

              <div class="booking-card-footer">
                <a
                  class="fm-link-button"
                  [routerLink]="['/dashboard/bookings', item.id]"
                >
                  {{
                    ar()
                      ? 'عرض التفاصيل وإدارة الحجز'
                      : 'View details & manage'
                  }}
                </a>
              </div>
            </article>
          } @empty {
            <div class="request-empty">
              <h2>
                {{ ar() ? 'لا توجد حجوزات مواعيد بعد' : 'No appointment bookings yet' }}
              </h2>
              <p>
                {{
                  ar()
                    ? 'اختر مزود خدمة معتمداً واحجز موعداً محدداً لمنزلك.'
                    : 'Choose an approved professional to schedule a home maintenance appointment.'
                }}
              </p>
              @if (auth.currentUser()?.role === 'CUSTOMER') {
                <a class="fm-link-button" routerLink="/providers">{{
                  ar() ? 'تصفح مزودي الخدمة' : 'Browse professionals'
                }}</a>
              }
            </div>
          }
        </div>
      }
    }
  `,
  styles: [
    `
      .booking-success {
        padding: 16px;
        background: #eaf2e6;
        color: #18372e;
        border-radius: 10px;
        margin-bottom: 20px;
      }
      .booking-detail-nav {
        margin-bottom: 16px;
      }
      .filter-bar {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 20px;
        select {
          width: auto;
        }
      }
      .booking-price-box {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 4px;
      }
      .snapshot-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
        gap: 16px;
        margin: 18px 0;
      }
      .snapshot-card {
        padding: 16px;
        background: #f6f8f3;
        border-radius: 10px;
        h3 {
          font-size: 13px;
          margin: 0 0 6px;
          color: #51664c;
        }
        p {
          margin: 0 0 4px;
          font-size: 14px;
        }
      }
      .lifecycle-actions {
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid #e2e9dc;
      }
      .action-group {
        display: grid;
        gap: 12px;
      }
      .button-row {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        align-items: center;
      }
      .review-box {
        margin-top: 16px;
        padding: 20px;
        background: #f6f8f3;
        border-radius: 12px;
        display: grid;
        gap: 14px;
      }
      .field-row-review {
        display: grid;
        gap: 12px;
      }
      .timeline-section {
        margin-top: 24px;
        padding-top: 20px;
        border-top: 1px solid #e2e9dc;
        h3 {
          font-size: 15px;
          margin-bottom: 12px;
        }
      }
      .timeline-list {
        margin: 0;
        padding-inline-start: 20px;
        display: grid;
        gap: 8px;
        font-size: 13px;
        span,
        time {
          margin-inline-start: 8px;
          color: #637268;
        }
        p {
          margin: 4px 0 0;
          color: #18372e;
        }
      }
      .booking-card-footer {
        margin-top: 16px;
        display: flex;
        justify-content: flex-end;
      }
    `,
  ],
  styleUrl: '../requests/requests-page.scss',
})
export class BookingsPageComponent {
  readonly i18n = inject(LanguageService);
  readonly auth = inject(AuthService);
  readonly ar = () => this.i18n.lang() === 'ar';
  private readonly route = inject(ActivatedRoute);
  private readonly bookingsApi = inject(BookingsApiService);

  readonly bookings = signal<BookingItem[]>([]);
  readonly selectedBooking = signal<BookingDetail | null>(null);
  readonly statusFilter = signal<BookingStatus | ''>('');
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly success = signal('');

  actionNotes = '';
  reviewRating = 5;
  reviewComment = '';

  readonly governorateLabel = governorateLabel;
  readonly money = money;
  readonly pricingLabel = pricingLabel;

  constructor() {
    this.route.paramMap
      .pipe(takeUntilDestroyed())
      .subscribe((params) => {
        const id = params.get('id');
        this.error.set('');
        this.success.set('');
        if (id) {
          this.loadDetail(id);
        } else {
          this.selectedBooking.set(null);
          this.loadList();
        }
      });
  }

  loadList(): void {
    this.loading.set(true);
    this.bookingsApi
      .listBookings({ status: this.statusFilter() })
      .subscribe({
        next: (res) => {
          this.bookings.set(res.items);
          this.loading.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.loading.set(false);
          this.handleError(err);
        },
      });
  }

  loadDetail(id: string): void {
    this.loading.set(true);
    this.bookingsApi.getBookingById(id).subscribe({
      next: (detail) => {
        this.selectedBooking.set(detail);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.handleError(err);
      },
    });
  }

  onStatusFilter(status: BookingStatus | ''): void {
    this.statusFilter.set(status);
    this.loadList();
  }

  statusLabel(status: BookingStatus): string {
    const labels: Record<BookingStatus, [string, string]> = {
      REQUESTED: ['Requested', 'بانتظار موافقة المزود'],
      ACCEPTED: ['Accepted · Slot Reserved', 'مؤكد ومحجوز'],
      IN_PROGRESS: ['In Progress', 'قيد التنفيذ'],
      WORK_DONE: ['Work Done · Awaiting Confirmation', 'تم إنجاز العمل'],
      COMPLETED: ['Completed', 'مكتمل'],
      REJECTED: ['Declined', 'معتذر عنه'],
      CANCELLED: ['Cancelled', 'ملغي'],
      EXPIRED: ['Expired', 'منتهي الصلاحية'],
    };
    return labels[status]?.[this.ar() ? 1 : 0] ?? status;
  }

  formatDateTime(iso?: string): string {
    if (!iso) return '';
    return new Intl.DateTimeFormat(this.ar() ? 'ar-JO' : 'en-JO', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Amman',
    }).format(new Date(iso));
  }

  accept(id: string): void {
    this.busy.set(true);
    this.error.set('');
    this.bookingsApi
      .acceptBooking(id, this.actionNotes.trim() || undefined)
      .subscribe({
        next: (updated) => {
          this.busy.set(false);
          this.actionNotes = '';
          this.selectedBooking.set(updated);
          this.success.set(
            this.ar()
              ? 'تم قبول الحجز وقفل فترات الموعد بنجاح.'
              : 'Booking accepted and 30-minute capacity slots reserved.',
          );
        },
        error: (err: HttpErrorResponse) => {
          this.busy.set(false);
          this.handleError(err);
        },
      });
  }

  reject(id: string): void {
    const reason = this.actionNotes.trim();
    if (reason.length < 3) {
      this.error.set(
        this.ar()
          ? 'يرجى كتابة سبب الاعتذار (٣ أحرف على الأقل).'
          : 'Please enter a decline reason (at least 3 characters).',
      );
      return;
    }
    this.busy.set(true);
    this.error.set('');
    this.bookingsApi.rejectBooking(id, reason).subscribe({
      next: (updated) => {
        this.busy.set(false);
        this.actionNotes = '';
        this.selectedBooking.set(updated);
      },
      error: (err: HttpErrorResponse) => {
        this.busy.set(false);
        this.handleError(err);
      },
    });
  }

  startWork(id: string): void {
    this.busy.set(true);
    this.error.set('');
    this.bookingsApi
      .startBooking(id, this.actionNotes.trim() || undefined)
      .subscribe({
        next: (updated) => {
          this.busy.set(false);
          this.actionNotes = '';
          this.selectedBooking.set(updated);
        },
        error: (err: HttpErrorResponse) => {
          this.busy.set(false);
          this.handleError(err);
        },
      });
  }

  markWorkDone(id: string): void {
    this.busy.set(true);
    this.error.set('');
    this.bookingsApi
      .markWorkDone(id, {
        providerNotes: this.actionNotes.trim() || undefined,
      })
      .subscribe({
        next: (updated) => {
          this.busy.set(false);
          this.actionNotes = '';
          this.selectedBooking.set(updated);
        },
        error: (err: HttpErrorResponse) => {
          this.busy.set(false);
          this.handleError(err);
        },
      });
  }

  complete(id: string): void {
    this.busy.set(true);
    this.error.set('');
    this.bookingsApi.completeBooking(id).subscribe({
      next: (updated) => {
        this.busy.set(false);
        this.selectedBooking.set(updated);
        this.success.set(
          this.ar()
            ? 'تم تأكيد اكتمال الخدمة! يمكنك الآن إضافة تقييمك.'
            : 'Job marked completed! You can now leave a verified review.',
        );
      },
      error: (err: HttpErrorResponse) => {
        this.busy.set(false);
        this.handleError(err);
      },
    });
  }

  cancel(id: string): void {
    const reason = this.actionNotes.trim() || 'Cancelled via workspace';
    if (reason.length < 3) {
      this.error.set(
        this.ar()
          ? 'يرجى إدخال سبب الإلغاء.'
          : 'Please provide a cancellation reason.',
      );
      return;
    }
    this.busy.set(true);
    this.error.set('');
    this.bookingsApi.cancelBooking(id, reason).subscribe({
      next: (updated) => {
        this.busy.set(false);
        this.actionNotes = '';
        this.selectedBooking.set(updated);
      },
      error: (err: HttpErrorResponse) => {
        this.busy.set(false);
        this.handleError(err);
      },
    });
  }

  submitReview(bookingId: string): void {
    this.busy.set(true);
    this.error.set('');
    this.bookingsApi
      .submitBookingReview(bookingId, {
        rating: Number(this.reviewRating),
        comment: this.reviewComment.trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.busy.set(false);
          this.reviewComment = '';
          this.success.set(
            this.ar()
              ? 'شكراً لك! تم نشر تقييمك الموثق وتحديث معدل المزود.'
              : 'Thank you! Your verified review has been published.',
          );
          this.loadDetail(bookingId);
        },
        error: (err: HttpErrorResponse) => {
          this.busy.set(false);
          this.handleError(err);
        },
      });
  }

  private handleError(err: HttpErrorResponse): void {
    const msg = err.error?.message;
    this.error.set(
      Array.isArray(msg)
        ? msg.join(' · ')
        : msg ||
            (this.ar()
              ? 'تعذّر إتمام العملية.'
              : 'Could not complete the operation.'),
    );
  }
}
