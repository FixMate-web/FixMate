import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { LanguageService } from '../../core/i18n/language.service';
import {
  AdminOverviewMetrics,
  AdminReviewItem,
  AdminUserItem,
  BookingsApiService,
} from '../../core/services/bookings-api.service';
import {
  FmBadgeComponent,
  FmButtonComponent,
  FmCardComponent,
} from '../../shared/ui';

@Component({
  selector: 'app-admin-overview-page',
  standalone: true,
  imports: [RouterLink, FmCardComponent, FmBadgeComponent, FmButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="admin-overview-page">
      <header class="page-header">
        <span class="eyebrow">ADMIN · PLATFORM OPERATIONS & MODERATION</span>
        <h1>
          {{
            ar()
              ? 'لوحة العمليات والإشراف العام'
              : 'Platform Operations & Moderation'
          }}
        </h1>
        <p>
          {{
            ar()
              ? 'إحصائيات المنصة الحقيقية، إدارة حالة الحسابات، ومراجعة التقييمات المنشورة.'
              : 'Real-time bounded database metrics, user status moderation, and review visibility controls.'
          }}
        </p>
      </header>

      @if (metrics(); as m) {
        <div class="metrics-grid">
          <app-fm-card [title]="ar() ? 'المستخدمون' : 'Users'">
            <p class="metric-big">{{ m.users.total }}</p>
            <p class="metric-sub">
              {{ ar() ? 'عملاء:' : 'Customers:' }} {{ m.users.customers }} ·
              {{ ar() ? 'مزودون:' : 'Providers:' }} {{ m.users.providers }} ·
              {{ ar() ? 'موقوف:' : 'Suspended:' }} {{ m.users.suspended }}
            </p>
          </app-fm-card>

          <app-fm-card [title]="ar() ? 'مزودو الخدمة' : 'Provider Profiles'">
            <p class="metric-big">{{ m.providers.approved }}</p>
            <p class="metric-sub">
              {{ ar() ? 'بانتظار المراجعة:' : 'Pending:' }}
              {{ m.providers.pendingReview }} ·
              {{ ar() ? 'الإجمالي:' : 'Total:' }} {{ m.providers.total }}
            </p>
            <a class="text-button" routerLink="/dashboard/admin/providers">
              {{ ar() ? 'طابور الاعتماد ←' : 'Approval queue →' }}
            </a>
          </app-fm-card>

          <app-fm-card [title]="ar() ? 'حجوزات المواعيد' : 'Bookings'">
            <p class="metric-big">{{ m.bookings.total }}</p>
            <p class="metric-sub">
              {{ ar() ? 'مكتمل:' : 'Completed:' }} {{ m.bookings.completed }} ·
              {{ ar() ? 'مؤكد/نشط:' : 'Active:' }}
              {{
                m.bookings.accepted +
                  m.bookings.inProgress +
                  m.bookings.workDone
              }}
            </p>
            <a class="text-button" routerLink="/dashboard/bookings">
              {{ ar() ? 'سجل الحجوزات ←' : 'Inspect bookings →' }}
            </a>
          </app-fm-card>

          <app-fm-card [title]="ar() ? 'التقييمات والكتالوج' : 'Reviews & Catalog'">
            <p class="metric-big">{{ m.reviews.visible }}</p>
            <p class="metric-sub">
              {{ ar() ? 'مخفي:' : 'Hidden:' }} {{ m.reviews.hidden }} ·
              {{ ar() ? 'خدمات نشطة:' : 'Active services:' }}
              {{ m.catalog.activeServices }}
            </p>
            <a class="text-button" routerLink="/dashboard/admin/catalog">
              {{ ar() ? 'إدارة الكتالوج ←' : 'Manage catalog →' }}
            </a>
          </app-fm-card>
        </div>
      }

      <!-- User Status Moderation -->
      <app-fm-card
        [title]="ar() ? 'إدارة حسابات المستخدمين' : 'User Accounts Moderation'"
      >
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>{{ ar() ? 'الاسم' : 'Full Name' }}</th>
                <th>{{ ar() ? 'البريد الإلكتروني' : 'Email' }}</th>
                <th>{{ ar() ? 'الدور' : 'Role' }}</th>
                <th>{{ ar() ? 'الحالة' : 'Status' }}</th>
                <th>{{ ar() ? 'الإجراء' : 'Action' }}</th>
              </tr>
            </thead>
            <tbody>
              @for (u of users(); track u.id) {
                <tr>
                  <td>{{ u.fullName }}</td>
                  <td dir="ltr">{{ u.email }}</td>
                  <td>{{ u.role }}</td>
                  <td>
                    <app-fm-badge
                      [variant]="u.status === 'ACTIVE' ? 'success' : 'danger'"
                    >
                      {{ u.status }}
                    </app-fm-badge>
                  </td>
                  <td>
                    @if (u.role !== 'ADMIN') {
                      <app-fm-button
                        variant="secondary"
                        size="sm"
                        (clicked)="toggleUserStatus(u)"
                      >
                        {{
                          u.status === 'ACTIVE'
                            ? ar()
                              ? 'تعليق الحساب'
                              : 'Suspend'
                            : ar()
                              ? 'تفعيل الحساب'
                              : 'Activate'
                        }}
                      </app-fm-button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </app-fm-card>

      <!-- Reviews Moderation -->
      <app-fm-card
        [title]="ar() ? 'الإشراف على التقييمات' : 'Verified Reviews Moderation'"
      >
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>{{ ar() ? 'العميل' : 'Customer' }}</th>
                <th>{{ ar() ? 'المزود' : 'Provider' }}</th>
                <th>{{ ar() ? 'التقييم' : 'Rating' }}</th>
                <th>{{ ar() ? 'التعليق' : 'Comment' }}</th>
                <th>{{ ar() ? 'الحالة' : 'Status' }}</th>
                <th>{{ ar() ? 'الإجراء' : 'Action' }}</th>
              </tr>
            </thead>
            <tbody>
              @for (rev of reviews(); track rev.id) {
                <tr>
                  <td>{{ rev.customerName }}</td>
                  <td>{{ rev.providerDisplayName || rev.providerProfileId }}</td>
                  <td>★ {{ rev.rating }}/5</td>
                  <td>{{ rev.comment || '—' }}</td>
                  <td>
                    <app-fm-badge
                      [variant]="
                        rev.moderationStatus === 'VISIBLE'
                          ? 'success'
                          : 'neutral'
                      "
                    >
                      {{ rev.moderationStatus }}
                    </app-fm-badge>
                  </td>
                  <td>
                    <app-fm-button
                      variant="secondary"
                      size="sm"
                      (clicked)="toggleReviewVisibility(rev)"
                    >
                      {{
                        rev.moderationStatus === 'VISIBLE'
                          ? ar()
                            ? 'إخفاء'
                            : 'Hide'
                          : ar()
                            ? 'إظهار'
                            : 'Restore'
                      }}
                    </app-fm-button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </app-fm-card>
    </div>
  `,
  styles: [
    `
      .admin-overview-page {
        display: flex;
        flex-direction: column;
        gap: var(--fm-space-6);
      }
      .metrics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
        gap: var(--fm-space-4);
      }
      .metric-big {
        font-size: 2rem;
        font-weight: 800;
        margin: 0;
        color: var(--fm-color-primary);
      }
      .metric-sub {
        font-size: 0.85rem;
        color: var(--fm-color-text-muted);
        margin: 4px 0 10px;
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
          padding: 10px 12px;
          text-align: start;
          border-bottom: 1px solid var(--fm-color-border);
        }
      }
    `,
  ],
})
export class AdminOverviewPageComponent implements OnInit {
  private readonly bookingsApi = inject(BookingsApiService);
  readonly i18n = inject(LanguageService);
  readonly ar = () => this.i18n.lang() === 'ar';

  readonly metrics = signal<AdminOverviewMetrics | null>(null);
  readonly users = signal<AdminUserItem[]>([]);
  readonly reviews = signal<AdminReviewItem[]>([]);

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    forkJoin({
      overview: this.bookingsApi
        .getAdminOverview()
        .pipe(catchError(() => of(null))),
      users: this.bookingsApi
        .listAdminUsers({ page: 1 })
        .pipe(catchError(() => of({ items: [] as AdminUserItem[] }))),
      reviews: this.bookingsApi
        .listAdminReviews(1)
        .pipe(catchError(() => of({ items: [] as AdminReviewItem[] }))),
    }).subscribe(({ overview, users, reviews }) => {
      this.metrics.set(overview);
      this.users.set(users.items);
      this.reviews.set(reviews.items);
    });
  }

  toggleUserStatus(u: AdminUserItem): void {
    const next = u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    this.bookingsApi.updateAdminUserStatus(u.id, next).subscribe({
      next: () => this.reload(),
    });
  }

  toggleReviewVisibility(rev: AdminReviewItem): void {
    const next = rev.moderationStatus === 'VISIBLE' ? 'HIDDEN' : 'VISIBLE';
    this.bookingsApi
      .moderateReviewVisibility(rev.id, {
        moderationStatus: next,
        reason: 'Moderated via admin dashboard',
      })
      .subscribe({
        next: () => this.reload(),
      });
  }
}
