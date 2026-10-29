import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageService } from '../../core/i18n/language.service';
import {
  BookingsApiService,
  NotificationItem,
} from '../../core/services/bookings-api.service';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-header">
      <span class="eyebrow">{{
        ar() ? 'التنبيهات والتحديثات' : 'IN-APP NOTIFICATIONS'
      }}</span>
      <div class="notif-header-row">
        <div>
          <h1>{{ ar() ? 'الإشعارات' : 'Notifications' }}</h1>
          <p>
            {{
              ar()
                ? 'تحديثات فورية لحجوزات المواعيد واعتماد الملفات والتقييمات.'
                : 'Updates on your appointment bookings, profile approvals, and reviews.'
            }}
          </p>
        </div>
        @if (unreadCount() > 0) {
          <button
            type="button"
            class="fm-link-button"
            (click)="markAllRead()"
          >
            {{
              ar()
                ? 'تعليم الكل كمقروء (' + unreadCount() + ')'
                : 'Mark all as read (' + unreadCount() + ')'
            }}
          </button>
        }
      </div>
    </header>

    @if (loading()) {
      <div class="skeleton" style="height: 220px" aria-busy="true"></div>
    } @else {
      <div class="requests-list">
        @for (n of notifications(); track n.id) {
          <article class="request-item" [class.unread-item]="!n.isRead">
            <div class="request-heading">
              <div>
                <span class="request-status">
                  {{
                    n.isRead
                      ? ar()
                        ? 'مقروء'
                        : 'Read'
                      : ar()
                        ? 'جديد'
                        : 'Unread'
                  }}
                </span>
                <h2>{{ n.title[i18n.lang()] }}</h2>
                <p>{{ n.body[i18n.lang()] }}</p>
              </div>
              <time>{{ formatDate(n.createdAt) }}</time>
            </div>
            <div class="notif-actions">
              @if (
                n.relatedResourceType === 'BOOKING' && n.relatedResourceId
              ) {
                <a
                  class="text-button"
                  [routerLink]="['/dashboard/bookings', n.relatedResourceId]"
                >
                  {{ ar() ? 'فتح الحجز ←' : 'View booking →' }}
                </a>
              }
              @if (!n.isRead) {
                <button
                  type="button"
                  class="text-button"
                  (click)="markRead(n.id)"
                >
                  {{ ar() ? 'تعليم كمقروء' : 'Mark as read' }}
                </button>
              }
            </div>
          </article>
        } @empty {
          <div class="request-empty">
            <h2>
              {{ ar() ? 'لا توجد إشعارات بعد' : 'No notifications yet' }}
            </h2>
            <p>
              {{
                ar()
                  ? 'ستظهر إشعارات الحجوزات والتقييمات هنا تلقائياً.'
                  : 'Booking and review notifications will appear here automatically.'
              }}
            </p>
          </div>
        }
      </div>
    }
  `,
  styles: [
    `
      .notif-header-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;
      }
      .unread-item {
        border-color: #436b39;
        background: #f9fbf7;
      }
      .notif-actions {
        margin-top: 12px;
        display: flex;
        gap: 16px;
        align-items: center;
      }
    `,
  ],
  styleUrl: '../requests/requests-page.scss',
})
export class NotificationsPageComponent implements OnInit {
  readonly i18n = inject(LanguageService);
  readonly ar = () => this.i18n.lang() === 'ar';
  private readonly bookingsApi = inject(BookingsApiService);

  readonly notifications = signal<NotificationItem[]>([]);
  readonly unreadCount = signal(0);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.bookingsApi.listMyNotifications(1, false).subscribe({
      next: (res) => {
        this.notifications.set(res.items);
        this.unreadCount.set(res.unreadCount);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  markRead(id: string): void {
    this.bookingsApi.markNotificationRead(id).subscribe({
      next: () => this.load(),
    });
  }

  markAllRead(): void {
    this.bookingsApi.markAllNotificationsRead().subscribe({
      next: () => this.load(),
    });
  }

  formatDate(iso?: string): string {
    if (!iso) return '';
    return new Intl.DateTimeFormat(this.ar() ? 'ar-JO' : 'en-JO', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Amman',
    }).format(new Date(iso));
  }
}
