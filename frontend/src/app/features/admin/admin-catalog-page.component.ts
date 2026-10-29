import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LanguageService } from '../../core/i18n/language.service';
import {
  CatalogApiService,
  CatalogCategory,
  CatalogServiceItem,
  PricingType,
  formatFilsAsJod,
} from '../../core/services/catalog-api.service';
import {
  FmAlertComponent,
  FmBadgeComponent,
  FmButtonComponent,
  FmCardComponent,
  FmConfirmDialogComponent,
} from '../../shared/ui';

@Component({
  selector: 'app-admin-catalog-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FmCardComponent,
    FmAlertComponent,
    FmBadgeComponent,
    FmButtonComponent,
    FmConfirmDialogComponent,
  ],
  template: `
    <div class="admin-catalog-page">
      <header class="page-header">
        <span class="eyebrow">ADMIN · CATALOG MANAGEMENT</span>
        <h1>{{ i18n.t().catalog.adminCatalogTitle }}</h1>
        <p>{{ i18n.t().catalog.adminCatalogSubtitle }}</p>
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

      <div class="admin-grid">
        <!-- Create / Update Category -->
        <app-fm-card
          [title]="
            editingCategory()
              ? ar()
                ? 'تعديل التصنيف'
                : 'Edit category'
              : ar()
                ? 'إضافة تصنيف'
                : 'New category'
          "
          [subtitle]="
            ar() ? 'اسم ووصف واضحان باللغتين' : 'Clear names and descriptions in both languages'
          "
        >
          <form class="catalog-form" [formGroup]="categoryForm" (ngSubmit)="submitCategory()">
            <div class="field-row">
              <div class="field">
                <label for="cat-slug">{{
                  ar() ? 'معرّف الرابط بالإنجليزية' : 'Slug (kebab-case)'
                }}</label>
                <input
                  id="cat-slug"
                  type="text"
                  formControlName="slug"
                  dir="ltr"
                  placeholder="plumbing"
                />
              </div>
              <div class="field">
                <label for="cat-order">{{ ar() ? 'ترتيب العرض' : 'Display Order' }}</label>
                <input id="cat-order" type="number" formControlName="displayOrder" min="0" />
              </div>
            </div>

            <div class="field-row">
              <div class="field">
                <label for="cat-name-ar">{{ ar() ? 'الاسم بالعربية' : 'Name (Arabic)' }}</label>
                <input id="cat-name-ar" type="text" formControlName="nameAr" />
              </div>
              <div class="field">
                <label for="cat-name-en">{{ ar() ? 'الاسم بالإنجليزية' : 'Name (English)' }}</label>
                <input id="cat-name-en" type="text" formControlName="nameEn" dir="ltr" />
              </div>
            </div>

            <div class="field">
              <label for="cat-desc-ar">{{
                ar() ? 'الوصف بالعربية' : 'Description (Arabic)'
              }}</label>
              <textarea id="cat-desc-ar" rows="2" formControlName="descAr"></textarea>
            </div>

            <div class="field">
              <label for="cat-desc-en">{{
                ar() ? 'الوصف بالإنجليزية' : 'Description (English)'
              }}</label>
              <textarea id="cat-desc-en" rows="2" formControlName="descEn" dir="ltr"></textarea>
            </div>

            <div class="form-actions">
              <app-fm-button
                type="submit"
                variant="primary"
                [loading]="savingCategory()"
                [disabled]="savingCategory()"
              >
                {{
                  editingCategory()
                    ? ar()
                      ? 'حفظ التعديلات'
                      : 'Save changes'
                    : ar()
                      ? 'إنشاء التصنيف'
                      : 'Create category'
                }}
              </app-fm-button>
              @if (editingCategory()) {
                <button type="button" class="text-button" (click)="cancelEditCategory()">
                  {{ ar() ? 'إلغاء التعديل' : 'Cancel edit' }}
                </button>
              }
            </div>
          </form>
        </app-fm-card>

        <!-- Create / Edit Service -->
        <app-fm-card
          [title]="
            editingService()
              ? ar()
                ? 'تعديل الخدمة'
                : 'Edit service'
              : i18n.lang() === 'ar'
                ? 'إضافة خدمة جديدة للكتالوج'
                : 'Create Catalog Service'
          "
          [subtitle]="ar() ? 'نطاق الخدمة والسعر والمدة' : 'Service scope, price, and duration'"
        >
          <form class="catalog-form" [formGroup]="serviceForm" (ngSubmit)="submitService()">
            <div class="field-row">
              <div class="field">
                <label for="svc-category">{{ ar() ? 'التصنيف' : 'Category' }}</label>
                <select id="svc-category" formControlName="categoryId">
                  <option value="">{{ ar() ? 'اختر التصنيف' : '-- Select Category --' }}</option>
                  @for (cat of categories(); track cat.id) {
                    <option [value]="cat.id">
                      {{ i18n.lang() === 'ar' ? cat.name.ar : cat.name.en }} ({{ cat.slug }})
                    </option>
                  }
                </select>
              </div>
              <div class="field">
                <label for="svc-slug">{{
                  ar() ? 'معرّف الرابط بالإنجليزية' : 'Slug (kebab-case)'
                }}</label>
                <input
                  id="svc-slug"
                  type="text"
                  formControlName="slug"
                  dir="ltr"
                  placeholder="water-leak-repair"
                />
              </div>
            </div>

            <div class="field-row">
              <div class="field">
                <label for="svc-title-ar">{{ ar() ? 'العنوان بالعربية' : 'Title (Arabic)' }}</label>
                <input id="svc-title-ar" type="text" formControlName="titleAr" />
              </div>
              <div class="field">
                <label for="svc-title-en">{{
                  ar() ? 'العنوان بالإنجليزية' : 'Title (English)'
                }}</label>
                <input id="svc-title-en" type="text" formControlName="titleEn" dir="ltr" />
              </div>
            </div>

            <div class="field">
              <label for="svc-desc-ar">{{
                ar() ? 'الوصف بالعربية' : 'Description (Arabic)'
              }}</label>
              <textarea id="svc-desc-ar" rows="2" formControlName="descAr"></textarea>
            </div>

            <div class="field">
              <label for="svc-desc-en">{{
                ar() ? 'الوصف بالإنجليزية' : 'Description (English)'
              }}</label>
              <textarea id="svc-desc-en" rows="2" formControlName="descEn" dir="ltr"></textarea>
            </div>

            <div class="field-row">
              <label
                ><input
                  type="checkbox"
                  [checked]="quoteOnly()"
                  (change)="quoteOnly.set($any($event.target).checked)"
                />
                {{
                  ar() ? 'بدون سعر استرشادي — حسب عرض المزود' : 'Quote only — no indicative price'
                }}</label
              >
              @if (!quoteOnly()) {
                <div class="field">
                  <label for="svc-pricing-type">{{
                    ar() ? 'نوع التسعير' : 'Pricing Policy'
                  }}</label>
                  <select id="svc-pricing-type" formControlName="pricingType">
                    <option value="FIXED">{{ i18n.t().catalog.pricingFixed }}</option>
                    <option value="STARTING_AT">{{ i18n.t().catalog.pricingStartingAt }}</option>
                    <option value="INSPECTION_ONLY">
                      {{ i18n.t().catalog.pricingInspectionOnly }}
                    </option>
                  </select>
                </div>
                <div class="field">
                  <label for="svc-fils">{{
                    ar()
                      ? 'السعر الاسترشادي بالفلس (١ دينار = ١٠٠٠ فلس)'
                      : 'Indicative Amount (fils, 1 JOD = 1000 fils)'
                  }}</label>
                  <input
                    id="svc-fils"
                    type="number"
                    formControlName="indicativeAmountFils"
                    min="0"
                    step="500"
                    dir="ltr"
                  />
                </div>
              }
              <div class="field">
                <label for="svc-duration">{{
                  ar() ? 'المدة بالدقائق' : 'Duration (Minutes)'
                }}</label>
                <select id="svc-duration" formControlName="defaultDurationMinutes">
                  <option [ngValue]="60">60 min</option>
                  <option [ngValue]="90">90 min</option>
                  <option [ngValue]="120">120 min</option>
                  <option [ngValue]="180">180 min</option>
                  <option [ngValue]="240">240 min</option>
                </select>
              </div>
            </div>

            <div class="form-actions">
              <app-fm-button
                type="submit"
                variant="primary"
                [loading]="savingService()"
                [disabled]="savingService()"
              >
                {{
                  editingService()
                    ? ar()
                      ? 'حفظ التعديلات'
                      : 'Save changes'
                    : ar()
                      ? 'إنشاء الخدمة'
                      : 'Create service'
                }}
              </app-fm-button>
              @if (editingService()) {
                <button type="button" class="text-button" (click)="cancelEditService()">
                  {{ ar() ? 'إلغاء التعديل' : 'Cancel edit' }}
                </button>
              }
            </div>
          </form>
        </app-fm-card>
      </div>

      <!-- Existing Categories Table -->
      <app-fm-card
        [title]="i18n.lang() === 'ar' ? 'التصنيفات المسجلة' : 'All Categories'"
        [subtitle]="ar() ? 'التصنيفات النشطة والمؤرشفة' : 'Active and archived categories'"
      >
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>{{ ar() ? 'معرّف الرابط' : 'Slug' }}</th>
                <th>{{ ar() ? 'الاسم بالعربية والإنجليزية' : 'Name (AR / EN)' }}</th>
                <th>{{ ar() ? 'الترتيب' : 'Order' }}</th>
                <th>{{ ar() ? 'الحالة' : 'Status' }}</th>
                <th>{{ ar() ? 'الإجراءات' : 'Action' }}</th>
              </tr>
            </thead>
            <tbody>
              @for (cat of categories(); track cat.id) {
                <tr>
                  <td>
                    <code>{{ cat.slug }}</code>
                  </td>
                  <td>{{ cat.name.ar }} · {{ cat.name.en }}</td>
                  <td>{{ cat.displayOrder }}</td>
                  <td>
                    <app-fm-badge [variant]="cat.isActive ? 'success' : 'neutral'">
                      {{ cat.isActive ? (ar() ? 'نشط' : 'Active') : ar() ? 'مؤرشف' : 'Archived' }}
                    </app-fm-badge>
                  </td>
                  <td>
                    <button class="text-button" (click)="editCategory(cat)">
                      {{ ar() ? 'تعديل' : 'Edit' }}
                    </button>
                    <app-fm-button
                      variant="secondary"
                      size="sm"
                      (clicked)="promptToggleCategoryArchive(cat)"
                    >
                      {{
                        cat.isActive ? (ar() ? 'أرشفة' : 'Archive') : ar() ? 'استعادة' : 'Restore'
                      }}
                    </app-fm-button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </app-fm-card>

      <!-- Existing Services Table -->
      <app-fm-card
        [title]="i18n.lang() === 'ar' ? 'خدمات الكتالوج المسجلة' : 'All Catalog Services'"
        [subtitle]="ar() ? 'الخدمات النشطة والمؤرشفة' : 'Active and archived services'"
      >
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>{{ ar() ? 'معرّف الرابط' : 'Slug' }}</th>
                <th>{{ ar() ? 'العنوان بالعربية والإنجليزية' : 'Title (AR / EN)' }}</th>
                <th>{{ ar() ? 'التصنيف' : 'Category' }}</th>
                <th>{{ ar() ? 'نوع التسعير' : 'Pricing Policy' }}</th>
                <th>{{ ar() ? 'المدة' : 'Duration' }}</th>
                <th>{{ ar() ? 'الحالة' : 'Status' }}</th>
                <th>{{ ar() ? 'الإجراءات' : 'Action' }}</th>
              </tr>
            </thead>
            <tbody>
              @for (svc of services(); track svc.id) {
                <tr>
                  <td>
                    <code>{{ svc.slug }}</code>
                  </td>
                  <td>{{ svc.title.ar }} · {{ svc.title.en }}</td>
                  <td>{{ svc.category?.slug || svc.categoryId }}</td>
                  <td>
                    {{
                      svc.pricingPolicy?.pricingType || (ar() ? 'حسب عرض السعر' : 'Quote required')
                    }}
                    {{
                      svc.pricingPolicy ? formatFils(svc.pricingPolicy.indicativeAmountFils) : ''
                    }}
                  </td>
                  <td>{{ svc.defaultDurationMinutes }} min</td>
                  <td>
                    <app-fm-badge [variant]="svc.isActive ? 'success' : 'neutral'">
                      {{ svc.isActive ? (ar() ? 'نشط' : 'Active') : ar() ? 'مؤرشف' : 'Archived' }}
                    </app-fm-badge>
                  </td>
                  <td>
                    <button class="text-button" (click)="editService(svc)">
                      {{ ar() ? 'تعديل' : 'Edit' }}
                    </button>
                    <app-fm-button
                      variant="secondary"
                      size="sm"
                      (clicked)="promptToggleServiceArchive(svc)"
                    >
                      {{
                        svc.isActive ? (ar() ? 'أرشفة' : 'Archive') : ar() ? 'استعادة' : 'Restore'
                      }}
                    </app-fm-button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </app-fm-card>

      <app-fm-confirm-dialog
        [open]="confirmOpen()"
        [title]="confirmTitle()"
        [message]="confirmDescription()"
        [confirmLabel]="i18n.lang() === 'ar' ? 'تأكيد' : 'Confirm'"
        [cancelLabel]="i18n.lang() === 'ar' ? 'إلغاء' : 'Cancel'"
        [destructive]="true"
        (confirmed)="executePendingArchiveToggle()"
        (cancelled)="confirmOpen.set(false)"
      ></app-fm-confirm-dialog>
    </div>
  `,
  styles: [
    `
      @media (max-width: 900px) {
        .admin-grid {
          grid-template-columns: minmax(0, 1fr) !important;
        }
        .field-row {
          grid-template-columns: minmax(0, 1fr) !important;
        }
      }
      .data-table th {
        background: #f2f5ee;
        color: #51664c;
        font-size: 12px;
        white-space: nowrap;
      }
      .data-table td {
        font-size: 13px;
      }
      .table-wrap {
        max-width: 100%;
      }
      .catalog-form input,
      .catalog-form select,
      .catalog-form textarea {
        min-height: 44px;
      }
      .admin-catalog-page .page-header {
        gap: 6px;
      }
      .admin-catalog-page {
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
      .admin-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(22rem, 1fr));
        gap: var(--fm-space-6);
      }
      .catalog-form {
        display: flex;
        flex-direction: column;
        gap: var(--fm-space-3);
      }
      .form-actions {
        display: flex;
        align-items: center;
        gap: var(--fm-space-3);
        flex-wrap: wrap;
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
      .table-wrap {
        overflow-x: auto;
      }
      .data-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.9rem;

        th,
        td {
          padding: var(--fm-space-2) var(--fm-space-3);
          text-align: start;
          border-block-end: 1px solid var(--fm-color-border);
        }
        th {
          font-weight: 700;
          color: var(--fm-color-text-muted);
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminCatalogPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly catalogApi = inject(CatalogApiService);
  readonly i18n = inject(LanguageService);
  readonly ar = () => this.i18n.lang() === 'ar';
  readonly editingCategory = signal<string | null>(null);
  readonly editingService = signal<string | null>(null);
  readonly quoteOnly = signal(false);

  readonly categories = signal<CatalogCategory[]>([]);
  readonly services = signal<CatalogServiceItem[]>([]);
  readonly savingCategory = signal(false);
  readonly savingService = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly confirmOpen = signal(false);
  readonly confirmTitle = signal('');
  readonly confirmDescription = signal('');
  private pendingToggleAction: (() => void) | null = null;

  readonly categoryForm = this.fb.nonNullable.group({
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)]],
    displayOrder: [1, [Validators.required, Validators.min(0)]],
    nameAr: ['', [Validators.required]],
    nameEn: ['', [Validators.required]],
    descAr: ['', [Validators.required]],
    descEn: ['', [Validators.required]],
  });

  readonly serviceForm = this.fb.nonNullable.group({
    categoryId: ['', [Validators.required]],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)]],
    titleAr: ['', [Validators.required]],
    titleEn: ['', [Validators.required]],
    descAr: ['', [Validators.required]],
    descEn: ['', [Validators.required]],
    pricingType: ['STARTING_AT' as PricingType, [Validators.required]],
    indicativeAmountFils: [15000, [Validators.required, Validators.min(0)]],
    defaultDurationMinutes: [60, [Validators.required]],
  });

  editCategory(cat: CatalogCategory) {
    this.editingCategory.set(cat.id);
    this.categoryForm.setValue({
      slug: cat.slug,
      displayOrder: cat.displayOrder,
      nameAr: cat.name.ar,
      nameEn: cat.name.en,
      descAr: cat.description.ar,
      descEn: cat.description.en,
    });
    document.getElementById('cat-slug')?.focus();
  }
  cancelEditCategory() {
    this.editingCategory.set(null);
    this.categoryForm.reset({ displayOrder: this.categories().length + 1 });
  }
  editService(svc: CatalogServiceItem) {
    this.quoteOnly.set(!svc.pricingPolicy);
    this.editingService.set(svc.id);
    this.serviceForm.setValue({
      categoryId: svc.categoryId,
      slug: svc.slug,
      titleAr: svc.title.ar,
      titleEn: svc.title.en,
      descAr: svc.description.ar,
      descEn: svc.description.en,
      pricingType: svc.pricingPolicy?.pricingType || 'STARTING_AT',
      indicativeAmountFils: svc.pricingPolicy?.indicativeAmountFils ?? 0,
      defaultDurationMinutes: svc.defaultDurationMinutes,
    });
    document.getElementById('svc-slug')?.focus();
  }
  cancelEditService() {
    this.quoteOnly.set(false);
    this.editingService.set(null);
    this.serviceForm.reset({
      categoryId: '',
      slug: '',
      titleAr: '',
      titleEn: '',
      descAr: '',
      descEn: '',
      pricingType: 'STARTING_AT',
      indicativeAmountFils: 15000,
      defaultDurationMinutes: 60,
    });
  }
  ngOnInit(): void {
    this.reloadAll();
  }

  reloadAll(): void {
    this.catalogApi.getAdminCategories().subscribe({
      next: (cats) => this.categories.set(cats),
      error: (err: HttpErrorResponse) => this.handleError(err),
    });
    this.catalogApi.getAdminServices().subscribe({
      next: (svcs) => this.services.set(svcs),
      error: (err: HttpErrorResponse) => this.handleError(err),
    });
  }

  formatFils(fils: number): string {
    return formatFilsAsJod(fils, this.i18n.lang());
  }

  submitCategory(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    const v = this.categoryForm.getRawValue();
    this.savingCategory.set(true);
    (this.editingCategory()
      ? this.catalogApi.updateCategory.bind(this.catalogApi, this.editingCategory()!)
      : this.catalogApi.createCategory.bind(this.catalogApi))({
      slug: v.slug,
      displayOrder: Number(v.displayOrder),
      name: { ar: v.nameAr, en: v.nameEn },
      description: { ar: v.descAr, en: v.descEn },
    }).subscribe({
      next: () => {
        this.savingCategory.set(false);
        this.editingCategory.set(null);
        this.successMessage.set(this.ar() ? 'تم حفظ التصنيف.' : 'Category saved.');
        this.categoryForm.reset({ displayOrder: this.categories().length + 1 });
        this.reloadAll();
      },
      error: (err: HttpErrorResponse) => {
        this.savingCategory.set(false);
        this.handleError(err);
      },
    });
  }

  submitService(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    if (this.serviceForm.invalid) {
      this.serviceForm.markAllAsTouched();
      return;
    }

    const v = this.serviceForm.getRawValue();
    this.savingService.set(true);
    (this.editingService()
      ? this.catalogApi.updateService.bind(this.catalogApi, this.editingService()!)
      : this.catalogApi.createService.bind(this.catalogApi))({
      categoryId: v.categoryId,
      slug: v.slug,
      title: { ar: v.titleAr, en: v.titleEn },
      description: { ar: v.descAr, en: v.descEn },
      pricingPolicy: this.quoteOnly()
        ? null
        : {
            pricingType: v.pricingType,
            indicativeAmountFils: Math.round(Number(v.indicativeAmountFils)),
          },
      defaultDurationMinutes: Number(v.defaultDurationMinutes),
    }).subscribe({
      next: () => {
        this.savingService.set(false);
        this.editingService.set(null);
        this.successMessage.set(this.ar() ? 'تم حفظ الخدمة.' : 'Service saved.');
        this.serviceForm.patchValue({
          slug: '',
          titleAr: '',
          titleEn: '',
          descAr: '',
          descEn: '',
        });
        this.reloadAll();
      },
      error: (err: HttpErrorResponse) => {
        this.savingService.set(false);
        this.handleError(err);
      },
    });
  }

  promptToggleCategoryArchive(cat: CatalogCategory): void {
    const nextState = !cat.isActive;
    this.confirmTitle.set(nextState ? 'Restore Category' : 'Archive Category');
    this.confirmDescription.set(
      nextState
        ? `Restore category '${cat.slug}' so it is visible in public catalog discovery?`
        : `Soft-archive category '${cat.slug}'? Historical references remain intact, but it and its services will be hidden from public catalog browsing.`,
    );
    this.pendingToggleAction = () => {
      this.catalogApi.updateCategory(cat.id, { isActive: nextState }).subscribe({
        next: () => {
          this.confirmOpen.set(false);
          this.reloadAll();
        },
        error: (err: HttpErrorResponse) => {
          this.confirmOpen.set(false);
          this.handleError(err);
        },
      });
    };
    this.confirmOpen.set(true);
  }

  promptToggleServiceArchive(svc: CatalogServiceItem): void {
    const nextState = !svc.isActive;
    this.confirmTitle.set(nextState ? 'Restore Service' : 'Archive Service');
    this.confirmDescription.set(
      nextState
        ? `Restore service '${svc.slug}' to active public discovery?`
        : `Soft-archive service '${svc.slug}'? Historical references remain intact, and it will be hidden from public discovery.`,
    );
    this.pendingToggleAction = () => {
      this.catalogApi.updateService(svc.id, { isActive: nextState }).subscribe({
        next: () => {
          this.confirmOpen.set(false);
          this.reloadAll();
        },
        error: (err: HttpErrorResponse) => {
          this.confirmOpen.set(false);
          this.handleError(err);
        },
      });
    };
    this.confirmOpen.set(true);
  }

  executePendingArchiveToggle(): void {
    if (this.pendingToggleAction) {
      this.pendingToggleAction();
    }
  }

  private handleError(err: HttpErrorResponse): void {
    const msg = err.error?.message;
    this.errorMessage.set(Array.isArray(msg) ? msg.join(' · ') : msg || 'Operation failed.');
  }
}
