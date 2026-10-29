import {GOVERNORATES,DAYS} from '../../shared/marketplace/marketplace.utils';
import {FmConfirmDialogComponent} from '../../shared/ui/fm-confirm-dialog.component';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LanguageService } from '../../core/i18n/language.service';
import {
  CatalogApiService,
  CatalogServiceItem,
  PricingType,
  formatFilsAsJod,
} from '../../core/services/catalog-api.service';
import {
  OwnerProviderProfile,
  ProvidersApiService,
  formatMinuteOfDay,
} from '../../core/services/providers-api.service';
import {
  FmAlertComponent,
  FmBadgeComponent,
  FmButtonComponent,
  FmCardComponent,
} from '../../shared/ui';

@Component({
  selector: 'app-provider-onboarding-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FmConfirmDialogComponent,
    FmCardComponent,
    FmAlertComponent,
    FmBadgeComponent,
    FmButtonComponent,
  ],
  template: `
    <div class="provider-onboarding-page">
      <header class="page-header">
        <span class="eyebrow">{{ar() ? 'مساحة العمل المهنية' : 'YOUR PROFESSIONAL WORKSPACE'}}</span>
        <h1>{{ i18n.t().providers.onboardingTitle }}</h1>
        <p>{{ i18n.t().providers.onboardingSubtitle }}</p>
      </header>

      @if (errorMessage()) {
        <app-fm-alert variant="danger" [title]="'Error'">
          {{ errorMessage() }}
        </app-fm-alert>
      }

      @if (successMessage()) {
        <app-fm-alert variant="success" [title]="'Updated'">
          {{ successMessage() }}
        </app-fm-alert>
      }

      @if (profile(); as p) {
        <!-- Status & Submission Banner -->
        <app-fm-card
          [title]="i18n.lang() === 'ar' ? 'حالة طلب الإدراج والاعتماد' : 'Marketplace Approval Status'"
          [subtitle]="ar() ? 'أكمل بياناتك وخدماتك وساعات عملك، ثم أرسل الملف للمراجعة.' : 'Complete your profile, services, and working hours, then submit for review.'"
        >
          <div class="status-row">
            <div class="status-meta">
              <app-fm-badge [variant]="badgeVariantFor(p.approvalStatus)">
                {{ p.approvalStatus }}
              </app-fm-badge>
              @if (p.approvalFeedback.rejectionOrSuspensionReason) {
                <p class="reason-text">
                  <strong>{{ i18n.lang() === 'ar' ? 'ملاحظات المراجعة:' : 'Review Reason:' }}</strong>
                  {{ p.approvalFeedback.rejectionOrSuspensionReason }}
                </p>
              }
            </div>

            @if (p.approvalStatus === 'DRAFT' || p.approvalStatus === 'REJECTED') {
              <app-fm-button
                variant="primary"
                [loading]="submitting()"
                [disabled]="submitting()"
                (clicked)="submitProfileForReview()"
              >
                {{
                  i18n.lang() === 'ar'
                    ? 'إرسال الملف للمراجعة (Submit for Review)'
                    : 'Submit Profile for Admin Review'
                }}
              </app-fm-button>
            }
          </div>
        </app-fm-card>

        <div class="onboarding-grid">
          <!-- Profile & Coverage Form -->
          <app-fm-card
            [title]="i18n.lang() === 'ar' ? 'البيانات المهنية ومناطق التغطية' : 'Professional Profile & Coverage'"
            id="professional-profile"
          >
            <form class="provider-form" [formGroup]="profileForm" (ngSubmit)="saveProfile()">
              <div class="field">
                <label for="prov-display-name">
                  {{ i18n.lang() === 'ar' ? 'الاسم المهني المعروض' : 'Public Display Name' }}
                </label>
                <input id="prov-display-name" type="text" formControlName="displayName" />
              </div>

              <div class="field">
                <label for="prov-exp">
                  {{ i18n.t().providers.yearsExperienceLabel }} (0 - 60)
                </label>
                <input
                  id="prov-exp"
                  type="number"
                  formControlName="yearsOfExperience"
                  min="0"
                  max="60"
                />
              </div>

              <div class="field">
                <label for="prov-bio-ar">
                  {{ i18n.lang() === 'ar' ? 'النبذة المهنية (بالعربية - ١٠ أحرف على الأقل)' : 'Biography (Arabic, min 10 chars)' }}
                </label>
                <textarea id="prov-bio-ar" rows="3" formControlName="bioAr"></textarea>
              </div>

              <div class="field">
                <label for="prov-bio-en">
                  {{ i18n.lang() === 'ar' ? 'النبذة المهنية (بالإنجليزية - ١٠ أحرف على الأقل)' : 'Biography (English, min 10 chars)' }}
                </label>
                <textarea id="prov-bio-en" rows="3" formControlName="bioEn" dir="ltr"></textarea>
              </div>

              <fieldset class="region-picker"><legend>{{ar()?'محافظات تقديم الخدمة':'Service governorates'}}</legend><div>@for(g of governorates;track g[0]){<label><input type="checkbox" [checked]="selectedGovernorate(g[0])" (change)="toggleGovernorate(g[0])">{{g[ar()?1:0]}}</label>}</div></fieldset>
              <div class="field">
                <label for="prov-areas">
                  {{ i18n.lang() === 'ar' ? 'المناطق / الأحياء المغطاة (مفصولة بفاصلة)' : 'Coverage Areas / Neighborhoods (comma-separated)' }}
                </label>
                <input
                  id="prov-areas"
                  type="text"
                  formControlName="areasCsv"
                  placeholder="Abdoun, Sweifieh, Khalda, Dabouq"
                />
              </div>

              <app-fm-button
                type="submit"
                variant="primary"
                [loading]="savingProfile()"
                [disabled]="savingProfile()"
              >
                {{ i18n.lang() === 'ar' ? 'حفظ البيانات المهنية' : 'Save Profile Details' }}
              </app-fm-button>
            </form>
          </app-fm-card>

          <!-- Attach / Upsert Service Offering -->
          <app-fm-card
            [title]="i18n.lang() === 'ar' ? 'إضافة أو تحديث خدمة مقدمة' : 'Attach Catalog Service Offering'"
            id="professional-offerings"
          >
            <form class="provider-form" [formGroup]="offeringForm" (ngSubmit)="saveOffering()">
              <div class="field">
                <label for="off-service">
                  {{ i18n.lang() === 'ar' ? 'اختر الخدمة من الكتالوج' : 'Select Active Catalog Service' }}
                </label>
                <select id="off-service" formControlName="serviceId">
                  <option value="">{{ar()?'اختر خدمة':'Select a service'}}</option>
                  @for (svc of catalogServices(); track svc.id) {
                    <option [value]="svc.id">
                      {{ i18n.lang() === 'ar' ? svc.title.ar : svc.title.en }} ({{
                        formatFils(svc.pricingPolicy.indicativeAmountFils)
                      }})
                    </option>
                  }
                </select>
              </div>

              <div class="field-row">
                <div class="field">
                  <label for="off-pricing-type">{{ar()?'نوع التسعير':'Pricing type'}}</label>
                  <select id="off-pricing-type" formControlName="pricingType">
                    <option value="FIXED">{{i18n.t().catalog.pricingFixed}}</option>
                    <option value="STARTING_AT">{{i18n.t().catalog.pricingStartingAt}}</option>
                    <option value="INSPECTION_ONLY">{{i18n.t().catalog.pricingInspectionOnly}}</option>
                  </select>
                </div>

                <div class="field">
                  <label for="off-price-fils">{{ar()?'السعر بالدينار الأردني':'Price in Jordanian dinars'}}</label>
                  <input
                    id="off-price-fils"
                    type="number"
                    formControlName="priceJod"
                    min="0"
                    step="0.001"
                    dir="ltr"
                  />
                </div>
              </div>

              <div class="field">
                <label for="off-duration">{{ar()?'المدة التقديرية':'Estimated duration'}}</label>
                <select id="off-duration" formControlName="estimatedDurationMinutes">
                  <option [ngValue]="60">60 min</option>
                  <option [ngValue]="90">90 min</option>
                  <option [ngValue]="120">120 min</option>
                  <option [ngValue]="180">180 min</option>
                  <option [ngValue]="240">240 min</option>
                </select>
              </div>

              <app-fm-button
                type="submit"
                variant="primary"
                [loading]="savingOffering()"
                [disabled]="savingOffering()"
              >
                {{ i18n.lang() === 'ar' ? 'إضافة / تحديث الخدمة' : 'Attach / Update Offering' }}
              </app-fm-button>
            </form>

            <!-- Attached Offerings List -->
            <div class="offerings-section">
              <h3>
                {{ i18n.lang() === 'ar' ? 'الخدمات المربوطة بملفك' : 'Your Attached Service Offerings' }}
              </h3>
              @if (p.offerings.length === 0) {
                <p class="muted-note">
                  {{
                    i18n.lang() === 'ar'
                      ? 'لم تقم بربط أي خدمة بعد. يجب ربط خدمة نشطة واحدة على الأقل قبل إرسال الطلب للمراجعة.'
                      : 'No services attached yet. Attach at least one active service before submitting for review.'
                  }}
                </p>
              } @else {
                <ul class="offerings-list">
                  @for (off of p.offerings; track off.id) {
                    <li class="offering-row">
                      <div>
                        <strong>
                          {{
                            off.service
                              ? i18n.lang() === 'ar'
                                ? off.service.title.ar
                                : off.service.title.en
                              : off.serviceId
                          }}
                        </strong>
                        <span class="offering-meta">
                          {{ off.pricingType }} · {{ formatFils(off.priceAmountFils) }} ·
                          {{ off.estimatedDurationMinutes }} min
                        </span>
                      </div>
                      <app-fm-button
                        variant="danger"
                        size="sm"
                        (clicked)="pendingRemoval.set(off.serviceId)"
                      >
                        {{ i18n.lang() === 'ar' ? 'حذف' : 'Remove' }}
                      </app-fm-button>
                    </li>
                  }
                </ul>
              }
            </div>
          </app-fm-card>
        </div>

        <app-fm-card id="professional-availability" [title]="ar()?'ساعات العمل الأسبوعية':'Weekly working hours'" [subtitle]="ar()?'بتوقيت عمّان، بفواصل نصف ساعة. احفظ التعديلات لتحديث ملفك.':'Amman time, in 30-minute steps. Save changes to update your profile.'">
          <form [formGroup]="scheduleForm" (ngSubmit)="saveSchedule()"><div formArrayName="windows" class="schedule-editor">@for(window of windows.controls;track window;let n=$index){<div class="schedule-row" [formGroupName]="n"><div class="field"><label [for]="'day-'+n">{{ar()?'اليوم':'Day'}}</label><select [id]="'day-'+n" formControlName="dayOfWeek">@for(day of days;track day[0];let d=$index){<option [ngValue]="d">{{day[ar()?1:0]}}</option>}</select></div><div class="field"><label [for]="'start-'+n">{{ar()?'من':'From'}}</label><select [id]="'start-'+n" formControlName="startMinuteOfDay">@for(time of startTimes;track time){<option [ngValue]="time">{{formatMin(time)}}</option>}</select></div><div class="field"><label [for]="'end-'+n">{{ar()?'إلى':'To'}}</label><select [id]="'end-'+n" formControlName="endMinuteOfDay">@for(time of endTimes;track time){<option [ngValue]="time">{{formatMin(time)}}</option>}</select></div><button type="button" class="text-button" (click)="windows.removeAt(n)" [attr.aria-label]="(ar()?'حذف الفترة ':'Remove window ')+(n+1)">{{ar()?'حذف':'Remove'}}</button></div>} @empty {<p>{{ar()?'لم تحدد ساعات عمل بعد. أضف فترة واحدة على الأقل قبل تقديم الملف.':'No working hours yet. Add at least one window before submitting your profile.'}}</p>}</div><div class="schedule-actions"><button type="button" class="text-button" [disabled]="windows.length>=28" (click)="addWindow()">+ {{ar()?'إضافة فترة عمل':'Add working hours'}}</button><app-fm-button type="submit" [loading]="savingSchedule()" [disabled]="savingSchedule()">{{ar()?'حفظ ساعات العمل':'Save working hours'}}</app-fm-button></div></form>
        </app-fm-card>
      }
    </div>
    <app-fm-confirm-dialog [open]="!!pendingRemoval()" [title]="ar()?'حذف الخدمة من ملفك؟':'Remove this offering?'" [message]="ar()?'لن تظهر هذه الخدمة ضمن عروضك بعد حذفها. يمكنك إضافتها مجدداً.':'This service will no longer appear in your offerings. You can add it again later.'" [confirmLabel]="ar()?'حذف':'Remove'" [cancelLabel]="ar()?'إلغاء':'Cancel'" [destructive]="true" (confirmed)="confirmRemoval()" (cancelled)="pendingRemoval.set(null)"/>
  `,
  styles: [
    `
      .region-picker{border:1px solid var(--fm-color-border);border-radius:10px;padding:16px;legend{font-size:13px;font-weight:600}div{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}label{display:flex;gap:8px;align-items:center;font-size:13px}input{accent-color:var(--fm-color-brand-teal)}}
      .schedule-editor{display:grid;gap:16px}.schedule-row{display:grid;grid-template-columns:1.5fr 1fr 1fr auto;align-items:end;gap:16px;border-bottom:1px solid var(--fm-color-border);padding-bottom:16px}.schedule-actions{display:flex;gap:20px;align-items:center;justify-content:space-between;margin-top:24px;flex-wrap:wrap}@media(max-width:650px){.schedule-row{grid-template-columns:1fr 1fr}.region-picker div{grid-template-columns:1fr 1fr}.onboarding-grid{grid-template-columns:minmax(0,1fr)!important}.offering-row{flex-wrap:wrap}}
      .provider-onboarding-page {
        display: flex;
        flex-direction: column;
        gap: var(--fm-space-6);
      }
      .page-header {
        display: flex;
        flex-direction: column;
        gap: var(--fm-space-1);
      }
      .eyebrow {
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.06em;
        color: var(--fm-color-primary);
      }
      .status-row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: var(--fm-space-4);
      }
      .reason-text {
        margin-block-start: var(--fm-space-2);
        color: var(--fm-color-danger, #b91c1c);
      }
      .onboarding-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(22rem, 1fr));
        gap: var(--fm-space-6);
      }
      .provider-form {
        display: flex;
        flex-direction: column;
        gap: var(--fm-space-3);
      }
      .field-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
        gap: var(--fm-space-3);
      }
      .field {
        display: flex;
        flex-direction: column;
        gap: var(--fm-space-1);

        label {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--fm-color-text);
        }
        input,
        select,
        textarea {
          padding: var(--fm-space-2) var(--fm-space-3);
          border: 1px solid var(--fm-color-border-strong);
          border-radius: var(--fm-radius-md);
          background: var(--fm-color-surface);
          color: var(--fm-color-text);
          font: inherit;
        }
      }
      .offerings-section {
        margin-block-start: var(--fm-space-5);
        padding-block-start: var(--fm-space-4);
        border-block-start: 1px solid var(--fm-color-border);
      }
      .offerings-list {
        list-style: none;
        padding: 0;
        margin: var(--fm-space-3) 0 0;
        display: flex;
        flex-direction: column;
        gap: var(--fm-space-2);
      }
      .offering-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--fm-space-3);
        padding: var(--fm-space-2) var(--fm-space-3);
        border: 1px solid var(--fm-color-border);
        border-radius: var(--fm-radius-md);
      }
      .offering-meta {
        display: block;
        font-size: 0.82rem;
        color: var(--fm-color-text-muted);
      }
      .windows-list {
        display: flex;
        flex-wrap: wrap;
        gap: var(--fm-space-2);
      }
      .window-chip {
        padding: var(--fm-space-1) var(--fm-space-3);
        border-radius: var(--fm-radius-full);
        background: var(--fm-color-surface-muted);
        font-size: 0.85rem;
      }
      .muted-note {
        color: var(--fm-color-text-muted);
        font-size: 0.9rem;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProviderOnboardingPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly providersApi = inject(ProvidersApiService);
  private readonly catalogApi = inject(CatalogApiService);
  readonly i18n = inject(LanguageService);readonly ar=()=>this.i18n.lang()==='ar';readonly governorates=GOVERNORATES;readonly days=DAYS;readonly startTimes=Array.from({length:48},(_,i)=>i*30);readonly endTimes=Array.from({length:48},(_,i)=>(i+1)*30);readonly savingSchedule=signal(false);readonly pendingRemoval=signal<string|null>(null);readonly scheduleForm=this.fb.group({windows:this.fb.array<ReturnType<typeof this.windowGroup>>([])});get windows(){return this.scheduleForm.controls.windows;}

  readonly profile = signal<OwnerProviderProfile | null>(null);
  readonly catalogServices = signal<CatalogServiceItem[]>([]);
  readonly savingProfile = signal(false);
  readonly savingOffering = signal(false);
  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly profileForm = this.fb.nonNullable.group({
    displayName: ['', [Validators.required, Validators.minLength(2)]],
    yearsOfExperience: [1, [Validators.required, Validators.min(0), Validators.max(60)]],
    bioAr: ['', [Validators.required, Validators.minLength(10)]],
    bioEn: ['', [Validators.required, Validators.minLength(10)]],
    governoratesCsv: ['Amman', [Validators.required]],
    areasCsv: ['', [Validators.required]],
  });

  readonly offeringForm = this.fb.nonNullable.group({
    serviceId: ['', [Validators.required]],
    pricingType: ['STARTING_AT' as PricingType, [Validators.required]],
    priceJod: [15, [Validators.required, Validators.min(0)]],
    estimatedDurationMinutes: [60, [Validators.required]],
  });

  private windowGroup(day=0,start=540,end=1020){return this.fb.nonNullable.group({dayOfWeek:[day,Validators.required],startMinuteOfDay:[start,Validators.required],endMinuteOfDay:[end,Validators.required]});}
  addWindow(){this.windows.push(this.windowGroup());}
  selectedGovernorate(g:string){return this.profileForm.controls.governoratesCsv.value.split(',').map(v=>v.trim()).includes(g);}
  toggleGovernorate(g:string){const values=this.profileForm.controls.governoratesCsv.value.split(',').map(v=>v.trim()).filter(Boolean);this.profileForm.controls.governoratesCsv.setValue((values.includes(g)?values.filter(v=>v!==g):[...values,g]).join(', '));}
  confirmRemoval(){const id=this.pendingRemoval();this.pendingRemoval.set(null);if(id)this.removeOffering(id);}
  saveSchedule(){const values=this.windows.getRawValue();this.errorMessage.set(null);this.successMessage.set(null);const invalid=values.some((w,i)=>w.startMinuteOfDay>=w.endMinuteOfDay||values.some((other,j)=>j!==i&&other.dayOfWeek===w.dayOfWeek&&w.startMinuteOfDay<other.endMinuteOfDay&&other.startMinuteOfDay<w.endMinuteOfDay));if(invalid){this.errorMessage.set(this.ar()?'يجب أن تكون النهاية بعد البداية، وأن لا تتداخل فترات اليوم نفسه.':'End time must follow start time, and windows on the same day must not overlap.');return;}this.savingSchedule.set(true);this.providersApi.updateMyProfile({weeklyAvailability:values}).subscribe({next:p=>{this.profile.set(p);this.savingSchedule.set(false);this.successMessage.set(this.ar()?'تم حفظ ساعات العمل.':'Working hours saved.');},error:(e:HttpErrorResponse)=>{this.savingSchedule.set(false);this.handleError(e);}});}
  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.catalogApi.getServices({ limit: 50 }).subscribe({
      next: (res) => this.catalogServices.set(res.items),
    });

    this.providersApi.getMyProfile().subscribe({
      next: (prof) => this.applyProfileToState(prof),
      error: (err: HttpErrorResponse) => this.handleError(err),
    });
  }

  formatFils(fils: number): string {
    return formatFilsAsJod(fils, this.i18n.lang());
  }

  formatMin(minute: number): string {
    return formatMinuteOfDay(minute);
  }

  badgeVariantFor(
    status: string,
  ): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
    switch (status) {
      case 'APPROVED':
        return 'success';
      case 'PENDING_REVIEW':
        return 'info';
      case 'REJECTED':
      case 'SUSPENDED':
        return 'danger';
      default:
        return 'warning';
    }
  }

  saveProfile(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();this.errorMessage.set(this.ar()?'يرجى إكمال البيانات المطلوبة والنبذة باللغتين.':'Please complete the required fields and both biographies.');
      return;
    }

    const v = this.profileForm.getRawValue();
    const governorates = v.governoratesCsv
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const areas = v.areasCsv
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    this.savingProfile.set(true);
    this.providersApi
      .updateMyProfile({
        displayName: v.displayName,
        yearsOfExperience: Number(v.yearsOfExperience),
        bio: { ar: v.bioAr, en: v.bioEn },
        coverageGovernorates: governorates,
        coverageAreas: areas,
      })
      .subscribe({
        next: (updated) => {
          this.savingProfile.set(false);
          this.successMessage.set('Provider profile saved.');
          this.applyProfileToState(updated);
        },
        error: (err: HttpErrorResponse) => {
          this.savingProfile.set(false);
          this.handleError(err);
        },
      });
  }

  saveOffering(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    if (this.offeringForm.invalid) {
      this.offeringForm.markAllAsTouched();this.errorMessage.set(this.ar()?'يرجى اختيار الخدمة وإدخال سعر صحيح.':'Please select a service and enter a valid price.');
      return;
    }

    const v = this.offeringForm.getRawValue();
    this.savingOffering.set(true);
    this.providersApi
      .upsertMyService({
        serviceId: v.serviceId,
        pricingType: v.pricingType,
        priceAmountFils: Math.round(Number(v.priceJod)*1000),
        estimatedDurationMinutes: Number(v.estimatedDurationMinutes),
        isEnabled: true,
      })
      .subscribe({
        next: () => {
          this.savingOffering.set(false);
          this.successMessage.set('Service offering attached.');
          this.loadData();
        },
        error: (err: HttpErrorResponse) => {
          this.savingOffering.set(false);
          this.handleError(err);
        },
      });
  }

  removeOffering(serviceId: string): void {
    this.errorMessage.set(null);
    this.providersApi.removeMyService(serviceId).subscribe({
      next: () => {
        this.successMessage.set('Offering removed.');
        this.loadData();
      },
      error: (err: HttpErrorResponse) => this.handleError(err),
    });
  }

  submitProfileForReview(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.submitting.set(true);
    this.providersApi.submitForReview().subscribe({
      next: (updated) => {
        this.submitting.set(false);
        this.successMessage.set('Your provider profile has been submitted for admin review.');
        this.applyProfileToState(updated);
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        this.handleError(err);
      },
    });
  }

  private applyProfileToState(prof: OwnerProviderProfile): void {
    this.profile.set(prof);this.windows.clear();for(const w of prof.weeklyAvailability)this.windows.push(this.windowGroup(w.dayOfWeek,w.startMinuteOfDay,w.endMinuteOfDay));
    this.profileForm.patchValue({
      displayName: prof.displayName,
      yearsOfExperience: prof.yearsOfExperience,
      bioAr: prof.bio.ar,
      bioEn: prof.bio.en,
      governoratesCsv: prof.coverageGovernorates.join(', '),
      areasCsv: prof.coverageAreas.join(', '),
    });
  }

  private handleError(err: HttpErrorResponse): void {
    const msg = err.error?.message;
    this.errorMessage.set(Array.isArray(msg) ? msg.join(' · ') : msg || 'Request failed.');
  }
}
