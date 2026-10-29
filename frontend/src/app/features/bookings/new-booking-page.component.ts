import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, forkJoin, of, switchMap } from 'rxjs';
import { LanguageService } from '../../core/i18n/language.service';
import {
  BookingsApiService,
  SavedAddress,
} from '../../core/services/bookings-api.service';
import {
  ProvidersApiService,
  PublicProviderDetail,
} from '../../core/services/providers-api.service';
import {
  governorateLabel,
  money,
  pricingLabel,
} from '../../shared/marketplace/marketplace.utils';

@Component({
  selector: 'app-new-booking-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="request-create">
      <header class="page-header">
        <span class="eyebrow">{{
          ar() ? 'حجز موعد خدمة منزلية' : 'SCHEDULE HOME MAINTENANCE'
        }}</span>
        <h1>
          {{ ar() ? 'احجز موعداً مع المزود' : 'Book an appointment' }}
        </h1>
        <p>
          {{
            ar()
              ? 'اختر الخدمة والموعد المناسب وعنوان المنزل. يُحجز الموعد رسمياً فور قبول المزود للطلب.'
              : 'Choose a service, a 30-minute aligned appointment time, and your service address. Capacity slots lock once the provider accepts.'
          }}
        </p>
      </header>

      @if (error()) {
        <div class="request-error" role="alert">{{ error() }}</div>
      }

      @if (loading()) {
        <div class="skeleton" style="height: 340px" aria-busy="true"></div>
      } @else if (provider(); as p) {
        <div class="request-form-layout">
          <form class="request-form" [formGroup]="form" (ngSubmit)="submit()">
            <div class="field">
              <label for="booking-service">{{
                ar() ? 'الخدمة المطلوبة' : 'Service offering'
              }}</label>
              <select id="booking-service" formControlName="serviceId">
                @for (off of p.offerings; track off.serviceId) {
                  <option [value]="off.serviceId">
                    {{ off.serviceTitle[i18n.lang()] }} —
                    {{ pricingLabel(off.pricingType, ar()) }}:
                    {{ money(off.priceAmountFils, i18n.lang()) }} ({{
                      off.estimatedDurationMinutes
                    }}
                    {{ ar() ? 'دقيقة' : 'min' }})
                  </option>
                }
              </select>
            </div>

            <div class="field-row-2">
              <div class="field">
                <label for="booking-date">{{
                  ar() ? 'تاريخ الموعد' : 'Preferred date'
                }}</label>
                <input
                  id="booking-date"
                  type="date"
                  formControlName="dateStr"
                  [min]="minDateStr"
                  dir="ltr"
                />
              </div>

              <div class="field">
                <label for="booking-time">{{
                  ar() ? 'وقت البدء (فواصل ٣٠ دقيقة UTC)' : 'Start time (30-min UTC slot)'
                }}</label>
                <select id="booking-time" formControlName="timeSlot" dir="ltr">
                  @for (slot of timeSlots; track slot) {
                    <option [value]="slot">{{ slot }} UTC</option>
                  }
                </select>
              </div>
            </div>

            @if (savedAddresses().length > 0) {
              <div class="field">
                <label for="booking-address-mode">{{
                  ar() ? 'عنوان الخدمة' : 'Service address'
                }}</label>
                <select
                  id="booking-address-mode"
                  formControlName="selectedAddressId"
                >
                  @for (addr of savedAddresses(); track addr.id) {
                    <option [value]="addr.id">
                      {{ addr.label || addr.cityOrDistrict }} —
                      {{ governorateLabel(addr.governorate, ar()) }},
                      {{ addr.street }} ({{ addr.building }})
                    </option>
                  }
                  <option value="NEW">
                    {{
                      ar() ? '+ إدخال عنوان جديد' : '+ Enter a new address'
                    }}
                  </option>
                </select>
              </div>
            }

            @if (useNewAddress()) {
              <div class="field-row-2">
                <div class="field">
                  <label for="addr-gov">{{
                    ar() ? 'المحافظة' : 'Governorate'
                  }}</label>
                  <select id="addr-gov" formControlName="governorate">
                    @for (g of p.coverageGovernorates; track g) {
                      <option [value]="g">
                        {{ governorateLabel(g, ar()) }}
                      </option>
                    }
                  </select>
                </div>

                <div class="field">
                  <label for="addr-city">{{
                    ar() ? 'المنطقة / الحي' : 'City or district'
                  }}</label>
                  <input
                    id="addr-city"
                    type="text"
                    formControlName="cityOrDistrict"
                    placeholder="Abdoun"
                  />
                </div>
              </div>

              <div class="field-row-2">
                <div class="field">
                  <label for="addr-street">{{
                    ar() ? 'الشارع' : 'Street'
                  }}</label>
                  <input
                    id="addr-street"
                    type="text"
                    formControlName="street"
                    placeholder="Princess Basma St"
                  />
                </div>

                <div class="field">
                  <label for="addr-building">{{
                    ar() ? 'رقم المبنى / المنزل' : 'Building / House'
                  }}</label>
                  <input
                    id="addr-building"
                    type="text"
                    formControlName="building"
                    placeholder="Building 12"
                  />
                </div>
              </div>

              <div class="field-row-2">
                <div class="field">
                  <label for="addr-phone">{{
                    ar() ? 'رقم هاتف التواصل' : 'Contact phone'
                  }}</label>
                  <input
                    id="addr-phone"
                    type="tel"
                    dir="ltr"
                    formControlName="contactPhone"
                    placeholder="+962790000000"
                  />
                </div>

                <div class="field">
                  <label for="addr-landmark">{{
                    ar() ? 'علامة مميزة (اختياري)' : 'Landmark (optional)'
                  }}</label>
                  <input
                    id="addr-landmark"
                    type="text"
                    formControlName="landmark"
                  />
                </div>
              </div>
            }

            <div class="field">
              <label for="booking-notes">{{
                ar() ? 'ملاحظات إضافية للمزود (اختياري)' : 'Notes for the professional (optional)'
              }}</label>
              <textarea
                id="booking-notes"
                rows="4"
                maxlength="1000"
                formControlName="customerNotes"
                [placeholder]="
                  ar()
                    ? 'اشرح تفاصيل العطل أو أي تعليمات للوصول...'
                    : 'Share any helpful details about the issue or building access...'
                "
              ></textarea>
            </div>

            <button class="fm-link-button" type="submit" [disabled]="saving()">
              {{
                saving()
                  ? ar()
                    ? 'جارٍ إرسال الحجز…'
                    : 'Submitting booking…'
                  : ar()
                    ? 'تأكيد إرسال طلب الحجز'
                    : 'Request appointment booking'
              }}
            </button>
          </form>

          <aside class="request-recipient">
            <span class="eyebrow">{{
              ar() ? 'ملخص المزود والسعر' : 'PROVIDER & PRICING SUMMARY'
            }}</span>
            <h2>{{ p.displayName }}</h2>
            <p>{{ p.bio[i18n.lang()] }}</p>
            <a [routerLink]="['/providers', p.id]">{{
              ar() ? 'راجع الملف المهني' : 'Review professional profile'
            }}</a>
            @if (selectedOffering(); as off) {
              <hr />
              <div>
                <strong>{{ off.serviceTitle[i18n.lang()] }}</strong>
                <p>
                  {{ pricingLabel(off.pricingType, ar()) }}:
                  <strong>{{
                    money(off.priceAmountFils, i18n.lang())
                  }}</strong>
                  · {{ off.estimatedDurationMinutes }}
                  {{ ar() ? 'دقيقة' : 'min' }}
                </p>
              </div>
            }
            <hr />
            <p>
              {{
                ar()
                  ? 'يُحفظ السعر والعنوان والخدمة كلقطة ثابتة في الحجز لضمان الشفافية.'
                  : 'Your quoted price, service scope, and address are snapshotted immutably on the booking.'
              }}
            </p>
          </aside>
        </div>
      }
    </section>
  `,
  styles: [
    `
      .field-row-2 {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
        gap: 16px;
      }
    `,
  ],
  styleUrl: '../requests/requests-page.scss',
})
export class NewBookingPageComponent {
  readonly i18n = inject(LanguageService);
  readonly ar = () => this.i18n.lang() === 'ar';
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly providersApi = inject(ProvidersApiService);
  private readonly bookingsApi = inject(BookingsApiService);

  readonly provider = signal<PublicProviderDetail | null>(null);
  readonly savedAddresses = signal<SavedAddress[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');

  readonly governorateLabel = governorateLabel;
  readonly money = money;
  readonly pricingLabel = pricingLabel;

  private clientRequestId = crypto.randomUUID();

  readonly minDateStr = (() => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return tomorrow.toISOString().slice(0, 10);
  })();

  readonly timeSlots = [
    '08:00',
    '08:30',
    '09:00',
    '09:30',
    '10:00',
    '10:30',
    '11:00',
    '11:30',
    '12:00',
    '12:30',
    '13:00',
    '13:30',
    '14:00',
    '14:30',
    '15:00',
    '15:30',
    '16:00',
    '16:30',
    '17:00',
    '17:30',
  ];

  readonly form = this.fb.nonNullable.group({
    serviceId: ['', Validators.required],
    dateStr: [this.minDateStr, Validators.required],
    timeSlot: ['10:00', Validators.required],
    selectedAddressId: ['NEW', Validators.required],
    governorate: ['Amman', Validators.required],
    cityOrDistrict: [''],
    street: [''],
    building: [''],
    contactPhone: [''],
    landmark: [''],
    customerNotes: [''],
  });

  readonly selectedOffering = computed(() => {
    const p = this.provider();
    const svcId = this.form.controls.serviceId.value;
    return p?.offerings.find((o) => o.serviceId === svcId) ?? p?.offerings[0];
  });

  constructor() {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const providerId = params.get('providerId') ?? '';
          return forkJoin({
            provider: this.providersApi.getPublicProviderById(providerId).pipe(
              catchError(() => {
                this.error.set(
                  this.ar()
                    ? 'تعذّر تحميل بيانات المزود.'
                    : 'Unable to load this professional.',
                );
                return of(null);
              }),
            ),
            addresses: this.bookingsApi
              .listMyAddresses()
              .pipe(catchError(() => of([] as SavedAddress[]))),
          });
        }),
        takeUntilDestroyed(),
      )
      .subscribe(({ provider, addresses }) => {
        this.provider.set(provider);
        this.savedAddresses.set(addresses);
        this.loading.set(false);
        this.clientRequestId = crypto.randomUUID();

        if (provider) {
          const defaultGov = provider.coverageGovernorates[0] ?? 'Amman';
          const matchingAddr = addresses.find((a) =>
            provider.coverageGovernorates.some(
              (g) => g.toLowerCase() === a.governorate.toLowerCase(),
            ),
          );
          this.form.patchValue({
            serviceId: provider.offerings[0]?.serviceId ?? '',
            governorate: defaultGov,
            selectedAddressId: matchingAddr ? matchingAddr.id : 'NEW',
          });
        }
      });
  }

  useNewAddress(): boolean {
    return (
      this.savedAddresses().length === 0 ||
      this.form.controls.selectedAddressId.value === 'NEW'
    );
  }

  submit(): void {
    if (this.saving()) return;
    const p = this.provider();
    if (!p) return;

    const v = this.form.getRawValue();
    if (!v.serviceId || !v.dateStr || !v.timeSlot) {
      this.error.set(
        this.ar()
          ? 'يرجى اختيار الخدمة والتاريخ والوقت.'
          : 'Please select a service, date, and time.',
      );
      return;
    }

    const requestedStartUtc = `${v.dateStr}T${v.timeSlot}:00.000Z`;
    const isNewAddr = this.useNewAddress();

    if (isNewAddr) {
      if (
        v.cityOrDistrict.trim().length < 2 ||
        v.street.trim().length < 2 ||
        v.building.trim().length < 1 ||
        v.contactPhone.trim().length < 7
      ) {
        this.error.set(
          this.ar()
            ? 'يرجى إكمال تفاصيل العنوان ورقم الهاتف.'
            : 'Please complete your district, street, building, and contact phone.',
        );
        return;
      }
    }

    this.error.set('');
    this.saving.set(true);

    this.bookingsApi
      .createBooking({
        providerProfileId: p.id,
        serviceId: v.serviceId,
        requestedStartUtc,
        ...(isNewAddr
          ? {
              address: {
                governorate: v.governorate,
                cityOrDistrict: v.cityOrDistrict.trim(),
                street: v.street.trim(),
                building: v.building.trim(),
                contactPhone: v.contactPhone.trim(),
                landmark: v.landmark.trim() || undefined,
              },
            }
          : { addressId: v.selectedAddressId }),
        customerNotes: v.customerNotes.trim() || undefined,
        clientRequestId: this.clientRequestId,
      })
      .subscribe({
        next: (created) => {
          this.saving.set(false);
          void this.router.navigate(['/dashboard/bookings', created.id]);
        },
        error: (err: HttpErrorResponse) => {
          this.saving.set(false);
          const msg = err.error?.message;
          this.error.set(
            Array.isArray(msg)
              ? msg.join(' · ')
              : msg ||
                  (this.ar()
                    ? 'تعذّر إرسال الحجز. تحقق من الموعد والعنوان.'
                    : 'Could not create booking. Please check your selected time and address.'),
          );
        },
      });
  }
}
