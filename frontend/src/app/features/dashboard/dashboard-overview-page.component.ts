import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, forkJoin, map, of } from 'rxjs';
import { LanguageService } from '../../core/i18n/language.service';
import {
  BookingItem,
  BookingsApiService,
  PublicReviewItem,
  SavedAddress,
} from '../../core/services/bookings-api.service';
import {
  GOVERNORATES,
  governorateLabel,
  money,
} from '../../shared/marketplace/marketplace.utils';
import {
  FmAlertComponent,
  FmBadgeComponent,
  FmButtonComponent,
  FmCardComponent,
} from '../../shared/ui';

export type WorkspaceRolePreview = 'CUSTOMER' | 'PROVIDER' | 'ADMIN';

@Component({
  selector: 'app-dashboard-overview-page',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    FmCardComponent,
    FmAlertComponent,
    FmBadgeComponent,
    FmButtonComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="dash-page">
      <header class="page-header">
        <span class="eyebrow">{{
          ar() ? 'مساحة العميل والمنزل' : 'CUSTOMER HOME WORKSPACE'
        }}</span>
        <h1>
          {{ ar() ? 'أهلاً بك في فيكس ميت' : 'Welcome to your home hub' }}
        </h1>
        <p>
          {{
            ar()
              ? 'إدارة حجوزات مواعيدك، عناوين المنزل المحفوظة، وتقييمات الخدمات المكتملة.'
              : 'Manage your scheduled appointments, saved home addresses, and completed job reviews.'
          }}
        </p>
      </header>

      @if (errorMessage()) {
        <app-fm-alert variant="danger" [title]="'Error'">
          {{ errorMessage() }}
        </app-fm-alert>
      }

      @if (successMessage()) {
        <app-fm-alert variant="success" [title]="'Saved'">
          {{ successMessage() }}
        </app-fm-alert>
      }

      <div class="dash-grid">
        <!-- Recent Bookings Card -->
        <app-fm-card
          [title]="ar() ? 'حجوزات المواعيد الأخيرة' : 'Recent Appointment Bookings'"
          [subtitle]="
            ar()
              ? 'تابع حالة طلباتك أو احجز موعداً جديداً مع مزود معتمد'
              : 'Track your scheduled jobs or book an approved professional'
          "
        >
          @if (bookings().length === 0) {
            <p class="muted-text">
              {{
                ar()
                  ? 'لا توجد حجوزات مواعيد حتى الآن. اختر مزود خدمة معتمداً لحجز موعد.'
                  : 'No appointment bookings yet. Browse approved professionals to book a time slot.'
              }}
            </p>
          } @else {
            <ul class="item-list">
              @for (b of bookings(); track b.id) {
                <li class="item-row">
                  <div>
                    <strong>{{
                      ar()
                        ? b.serviceSnapshot.titleAr
                        : b.serviceSnapshot.titleEn
                    }}</strong>
                    <span class="item-meta">
                      {{ b.providerDisplayName }} ·
                      {{
                        money(
                          b.pricingSnapshot.agreedAmountFils ??
                            b.pricingSnapshot.quotedAmountFils,
                          i18n.lang()
                        )
                      }}
                    </span>
                  </div>
                  <div class="row-actions">
                    <app-fm-badge
                      [variant]="
                        b.status === 'COMPLETED' || b.status === 'ACCEPTED'
                          ? 'success'
                          : 'info'
                      "
                    >
                      {{ b.status }}
                    </app-fm-badge>
                    <a
                      class="text-button"
                      [routerLink]="['/dashboard/bookings', b.id]"
                    >
                      {{ ar() ? 'عرض' : 'Open' }}
                    </a>
                  </div>
                </li>
              }
            </ul>
          }
          <div class="card-footer-links">
            <a class="fm-link-button" routerLink="/dashboard/bookings">
              {{ ar() ? 'جميع الحجوزات' : 'All bookings' }}
            </a>
            <a class="text-button" routerLink="/providers">
              {{ ar() ? 'تصفح المزودين المعتمدين →' : 'Browse professionals →' }}
            </a>
          </div>
        </app-fm-card>

        <!-- Saved Addresses Manager -->
        <app-fm-card
          [title]="ar() ? 'عناوين المنزل المحفوظة' : 'Saved Home Addresses'"
          [subtitle]="
            ar()
              ? 'استخدم عناوينك المحفوظة لإتمام الحجز بسرعة'
              : 'Save your home or office addresses for fast booking checkout'
          "
        >
          <form
            class="addr-form"
            [formGroup]="addressForm"
            (ngSubmit)="saveAddress()"
          >
            <div class="field-row">
              <div class="field">
                <label for="cust-addr-label">{{
                  ar() ? 'التسمية (مثل: المنزل)' : 'Label (e.g. Home)'
                }}</label>
                <input
                  id="cust-addr-label"
                  type="text"
                  formControlName="label"
                  placeholder="Home"
                />
              </div>
              <div class="field">
                <label for="cust-addr-gov">{{
                  ar() ? 'المحافظة' : 'Governorate'
                }}</label>
                <select id="cust-addr-gov" formControlName="governorate">
                  @for (g of governorates; track g[0]) {
                    <option [value]="g[0]">{{ g[ar() ? 1 : 0] }}</option>
                  }
                </select>
              </div>
            </div>

            <div class="field-row">
              <div class="field">
                <label for="cust-addr-city">{{
                  ar() ? 'المنطقة / الحي' : 'City or district'
                }}</label>
                <input
                  id="cust-addr-city"
                  type="text"
                  formControlName="cityOrDistrict"
                  placeholder="Abdoun"
                />
              </div>
              <div class="field">
                <label for="cust-addr-street">{{
                  ar() ? 'الشارع' : 'Street'
                }}</label>
                <input
                  id="cust-addr-street"
                  type="text"
                  formControlName="street"
                  placeholder="Princess Basma St"
                />
              </div>
            </div>

            <div class="field-row">
              <div class="field">
                <label for="cust-addr-building">{{
                  ar() ? 'رقم المبنى' : 'Building'
                }}</label>
                <input
                  id="cust-addr-building"
                  type="text"
                  formControlName="building"
                  placeholder="14"
                />
              </div>
              <div class="field">
                <label for="cust-addr-phone">{{
                  ar() ? 'هاتف التواصل' : 'Contact phone'
                }}</label>
                <input
                  id="cust-addr-phone"
                  type="tel"
                  dir="ltr"
                  formControlName="contactPhone"
                  placeholder="+962790000000"
                />
              </div>
            </div>

            <app-fm-button
              type="submit"
              variant="primary"
              size="sm"
              [loading]="savingAddress()"
              [disabled]="savingAddress()"
            >
              {{ ar() ? 'حفظ العنوان' : 'Add saved address' }}
            </app-fm-button>
          </form>

          @if (addresses().length > 0) {
            <ul class="item-list" style="margin-top: 16px">
              @for (addr of addresses(); track addr.id) {
                <li class="item-row">
                  <div>
                    <strong>{{ addr.label || addr.cityOrDistrict }}</strong>
                    <span class="item-meta">
                      {{ governorateLabel(addr.governorate, ar()) }} ·
                      {{ addr.cityOrDistrict }}, {{ addr.street }} ({{
                        addr.building
                      }})
                    </span>
                  </div>
                  <button
                    type="button"
                    class="text-button"
                    (click)="removeAddress(addr.id)"
                  >
                    {{ ar() ? 'حذف' : 'Delete' }}
                  </button>
                </li>
              }
            </ul>
          }
        </app-fm-card>
      </div>

      @if (reviews().length > 0) {
        <app-fm-card
          [title]="ar() ? 'تقييماتي المنشورة' : 'My Submitted Reviews'"
        >
          <ul class="item-list">
            @for (rev of reviews(); track rev.id) {
              <li class="item-row">
                <div>
                  <strong>
                    ★ {{ rev.rating }}/5 ·
                    {{
                      rev.serviceTitle
                        ? rev.serviceTitle[i18n.lang()]
                        : rev.bookingId
                    }}
                  </strong>
                  @if (rev.comment) {
                    <span class="item-meta">{{ rev.comment }}</span>
                  }
                </div>
              </li>
            }
          </ul>
        </app-fm-card>
      }
    </section>
  `,
  styles: [
    `
      .dash-page {
        display: flex;
        flex-direction: column;
        gap: var(--fm-space-6);
      }
      .dash-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(22rem, 1fr));
        gap: var(--fm-space-6);
      }
      .item-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .item-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 12px;
        border: 1px solid var(--fm-color-border);
        border-radius: var(--fm-radius-md);
      }
      .item-meta {
        display: block;
        font-size: 0.82rem;
        color: var(--fm-color-text-muted);
      }
      .row-actions {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .card-footer-links {
        margin-top: 16px;
        display: flex;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;
      }
      .addr-form {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .field-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
        gap: 10px;
      }
      .field {
        display: flex;
        flex-direction: column;
        gap: 4px;
        label {
          font-size: 0.82rem;
          font-weight: 600;
        }
        input,
        select {
          padding: 8px 10px;
          border: 1px solid var(--fm-color-border-strong);
          border-radius: var(--fm-radius-md);
          font: inherit;
        }
      }
      .muted-text {
        color: var(--fm-color-text-muted);
      }
    `,
  ],
})
export class DashboardOverviewPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly bookingsApi = inject(BookingsApiService);
  readonly i18n = inject(LanguageService);
  readonly ar = () => this.i18n.lang() === 'ar';

  readonly governorates = GOVERNORATES;
  readonly governorateLabel = governorateLabel;
  readonly money = money;

  readonly bookings = signal<BookingItem[]>([]);
  readonly addresses = signal<SavedAddress[]>([]);
  readonly reviews = signal<PublicReviewItem[]>([]);
  readonly savingAddress = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly addressForm = this.fb.nonNullable.group({
    label: ['Home'],
    governorate: ['Amman', Validators.required],
    cityOrDistrict: ['', [Validators.required, Validators.minLength(2)]],
    street: ['', [Validators.required, Validators.minLength(2)]],
    building: ['', [Validators.required, Validators.minLength(1)]],
    contactPhone: ['', [Validators.required, Validators.minLength(7)]],
  });

  readonly role = toSignal(
    this.route.data.pipe(
      map((data) => (data['role'] as WorkspaceRolePreview) ?? 'CUSTOMER'),
    ),
    { initialValue: 'CUSTOMER' as WorkspaceRolePreview },
  );

  readonly workspaceTitle = computed(() => {
    const dict = this.i18n.t().shells;
    switch (this.role()) {
      case 'PROVIDER':
        return dict.providerWorkspace;
      case 'ADMIN':
        return dict.adminWorkspace;
      default:
        return dict.customerWorkspace;
    }
  });

  ngOnInit(): void {
    this.reloadHub();
  }

  reloadHub(): void {
    forkJoin({
      bookings: this.bookingsApi
        .listBookings({ limit: 5 })
        .pipe(catchError(() => of({ items: [] as BookingItem[] }))),
      addresses: this.bookingsApi
        .listMyAddresses()
        .pipe(catchError(() => of([] as SavedAddress[]))),
      reviews: this.bookingsApi
        .listMyReviews()
        .pipe(catchError(() => of([] as PublicReviewItem[]))),
    }).subscribe(({ bookings, addresses, reviews }) => {
      this.bookings.set(bookings.items);
      this.addresses.set(addresses);
      this.reviews.set(reviews);
    });
  }

  saveAddress(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    if (this.addressForm.invalid) {
      this.addressForm.markAllAsTouched();
      return;
    }

    const v = this.addressForm.getRawValue();
    this.savingAddress.set(true);
    this.bookingsApi
      .createAddress({
        label: v.label.trim() || undefined,
        governorate: v.governorate,
        cityOrDistrict: v.cityOrDistrict.trim(),
        street: v.street.trim(),
        building: v.building.trim(),
        contactPhone: v.contactPhone.trim(),
      })
      .subscribe({
        next: () => {
          this.savingAddress.set(false);
          this.successMessage.set(
            this.ar() ? 'تم حفظ العنوان بنجاح.' : 'Address saved.',
          );
          this.addressForm.patchValue({
            cityOrDistrict: '',
            street: '',
            building: '',
          });
          this.reloadHub();
        },
        error: (err: HttpErrorResponse) => {
          this.savingAddress.set(false);
          const msg = err.error?.message;
          this.errorMessage.set(
            Array.isArray(msg) ? msg.join(' · ') : msg || 'Failed to save address.',
          );
        },
      });
  }

  removeAddress(id: string): void {
    this.bookingsApi.deleteAddress(id).subscribe({
      next: () => this.reloadHub(),
    });
  }
}
