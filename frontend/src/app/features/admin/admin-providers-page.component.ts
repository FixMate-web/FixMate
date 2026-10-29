import {FmConfirmDialogComponent} from '../../shared/ui/fm-confirm-dialog.component';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LanguageService } from '../../core/i18n/language.service';
import { formatFilsAsJod } from '../../core/services/catalog-api.service';
import {
  AdminProviderProfile,
  ProviderApprovalStatus,
  ProvidersApiService,
} from '../../core/services/providers-api.service';
import {
  FmAlertComponent,
  FmBadgeComponent,
  FmButtonComponent,
  FmCardComponent,
} from '../../shared/ui';

@Component({
  selector: 'app-admin-providers-page',
  standalone: true,
  imports: [FmConfirmDialogComponent, FormsModule, FmCardComponent, FmAlertComponent, FmBadgeComponent, FmButtonComponent],
  template: `
    <div class="admin-providers-page">
      <header class="page-header">
        <span class="eyebrow">ADMIN · PROVIDER APPROVAL QUEUE</span>
        <h1>{{ i18n.t().providers.adminApprovalQueueTitle }}</h1>
        <p>
          {{
            i18n.lang() === 'ar'
              ? 'مراجعة طلبات مزودي الخدمة واعتمادها أو رفضها أو تعليقها مع تسجيل أسباب القرار'
              : 'Review provider applications, inspect attached offerings, and approve, reject, or suspend listings'
          }}
        </p>
      </header>

      @if (errorMessage()) {
        <app-fm-alert variant="danger" [title]="'Error'">
          {{ errorMessage() }}
        </app-fm-alert>
      }

      @if (successMessage()) {
        <app-fm-alert variant="success" [title]="'Decision Recorded'">
          {{ successMessage() }}
        </app-fm-alert>
      }

      <div class="filter-bar">
        <label for="status-filter">{{ar()?'حالة الملف:':'Profile status:'}}</label>
        <select
          id="status-filter"
          [ngModel]="statusFilter()"
          (ngModelChange)="onStatusFilterChange($event)"
        >
          <option value="">{{ar()?'جميع الحالات':'All statuses'}}</option>
          <option value="PENDING_REVIEW">PENDING_REVIEW</option>
          <option value="APPROVED">APPROVED</option>
          <option value="REJECTED">REJECTED</option>
          <option value="SUSPENDED">SUSPENDED</option>
          <option value="DRAFT">DRAFT</option>
        </select>
      </div>

      @if (loading()) {<div class="skeleton" style="height:200px" aria-busy="true"></div>}
      @if (!loading() && !errorMessage() && providers().length === 0) {
        <app-fm-card
          [title]="i18n.lang() === 'ar' ? 'لا توجد طلبات مطابقة' : 'No Matching Provider Applications'"
          [subtitle]="'Try switching the status filter above'"
        ></app-fm-card>
      }

      <div class="providers-list">
        @for (p of providers(); track p.id) {
          <app-fm-card
            [title]="p.displayName"
            [subtitle]="(p.user?.email || p.userId) + ' · ' + p.yearsOfExperience + ' yrs exp'"
          >
            <div class="provider-review-card">
              <div class="meta-row">
                <app-fm-badge [variant]="badgeVariant(p.approvalStatus)">
                  {{ p.approvalStatus }}
                </app-fm-badge>
                <span>
                  <strong>{{ar()?'مناطق العمل:':'Coverage:'}}</strong> {{ p.coverageGovernorates.join(', ') }} ({{
                    p.coverageAreas.join(', ')
                  }})
                </span>
              </div>

              <div class="bio-box">
                <p><strong>AR:</strong> {{ p.bio.ar }}</p>
                <p dir="ltr"><strong>EN:</strong> {{ p.bio.en }}</p>
              </div>

              <div class="offerings-box">
                <strong>Attached Offerings ({{ p.offerings.length }}):</strong>
                @if (p.offerings.length === 0) {
                  <span> None</span>
                } @else {
                  <ul>
                    @for (off of p.offerings; track off.id) {
                      <li>
                        {{ off.service?.title?.en || off.serviceId }} —
                        {{ off.pricingType }} · {{ formatFils(off.priceAmountFils) }} ({{
                          off.estimatedDurationMinutes
                        }}
                        min)
                      </li>
                    }
                  </ul>
                }
              </div>

              <div class="moderation-controls">
                <div class="mod-inputs">
                  <input
                    type="text"
                    [attr.aria-label]="ar()?'ملاحظات المراجعة':'Moderation notes'"
                    [placeholder]="
                      i18n.lang() === 'ar'
                        ? 'سبب الرفض أو التعليق (إلزامي عند الرفض/التعليق)...'
                        : 'Rejection or suspension reason (required for Reject/Suspend)...'
                    "
                    [ngModel]="reasonInputFor(p.id)"
                    (ngModelChange)="setReasonInput(p.id, $event)"
                  />
                  <input
                    type="text"
                    [attr.aria-label]="ar()?'ملاحظات المراجعة':'Moderation notes'"
                    [placeholder]="
                      i18n.lang() === 'ar'
                        ? 'ملاحظات تدقيق داخلية للإدارة فقط...'
                        : 'Internal verification notes (Admin-only)...'
                    "
                    [ngModel]="notesInputFor(p.id, p.adminMetadata.verificationNotes)"
                    (ngModelChange)="setNotesInput(p.id, $event)"
                  />
                </div>

                <div class="mod-buttons">
                  <app-fm-button
                    [disabled]="!!busy()"
                    variant="primary"
                    size="sm"
                    (clicked)="confirmDecision(p.id, 'APPROVED')"
                  >
                    {{ar()?'اعتماد':'Approve'}}
                  </app-fm-button>
                  <app-fm-button
                    [disabled]="!!busy()"
                    variant="secondary"
                    size="sm"
                    (clicked)="confirmDecision(p.id, 'REJECTED')"
                  >
                    {{ar()?'رفض':'Reject'}}
                  </app-fm-button>
                  <app-fm-button
                    [disabled]="!!busy()"
                    variant="danger"
                    size="sm"
                    (clicked)="confirmDecision(p.id, 'SUSPENDED')"
                  >
                    {{ar()?'تعليق':'Suspend'}}
                  </app-fm-button>
                </div>
              </div>
            </div>
          </app-fm-card>
        }
      </div>
    @if(totalPages()>1){<div class="admin-pagination"><button class="text-button" [disabled]="page()<=1" (click)="changePage(-1)">{{ar()?'السابق':'Previous'}}</button><span>{{page()}} / {{totalPages()}}</span><button class="text-button" [disabled]="page()>=totalPages()" (click)="changePage(1)">{{ar()?'التالي':'Next'}}</button></div>}
    </div><app-fm-confirm-dialog [open]="!!pendingDecision()" [title]="ar()?'تأكيد قرار المراجعة؟':'Confirm moderation decision?'" [message]="ar()?'سيؤثر هذا القرار على ظهور المزود في دليل الخدمات.':'This decision affects the provider’s visibility in the marketplace.'" [confirmLabel]="ar()?'تأكيد القرار':'Confirm decision'" [cancelLabel]="ar()?'إلغاء':'Cancel'" [destructive]="pendingDecision()?.status!=='APPROVED'" (confirmed)="applyDecision()" (cancelled)="pendingDecision.set(null)"/>
  `,
  styles: [
    `
      .admin-pagination{display:flex;gap:20px;align-items:center;justify-content:center}@media(max-width:600px){.mod-inputs{grid-template-columns:minmax(0,1fr)!important}.filter-bar{flex-wrap:wrap}}
      .admin-providers-page {
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
      .filter-bar {
        display: flex;
        align-items: center;
        gap: var(--fm-space-3);

        select {
          padding: var(--fm-space-2) var(--fm-space-3);
          border: 1px solid var(--fm-color-border-strong);
          border-radius: var(--fm-radius-md);
          background: var(--fm-color-surface);
          color: var(--fm-color-text);
          font: inherit;
        }
      }
      .providers-list {
        display: flex;
        flex-direction: column;
        gap: var(--fm-space-4);
      }
      .provider-review-card {
        display: flex;
        flex-direction: column;
        gap: var(--fm-space-3);
      }
      .meta-row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--fm-space-3);
      }
      .bio-box {
        padding: var(--fm-space-3);
        background: var(--fm-color-surface-muted);
        border-radius: var(--fm-radius-md);
        font-size: 0.9rem;
        p {
          margin: var(--fm-space-1) 0;
        }
      }
      .moderation-controls {
        display: flex;
        flex-direction: column;
        gap: var(--fm-space-3);
        padding-block-start: var(--fm-space-3);
        border-block-start: 1px solid var(--fm-color-border);
      }
      .mod-inputs {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
        gap: var(--fm-space-3);

        input {
          padding: var(--fm-space-2) var(--fm-space-3);
          border: 1px solid var(--fm-color-border-strong);
          border-radius: var(--fm-radius-md);
          background: var(--fm-color-surface);
          color: var(--fm-color-text);
          font: inherit;
        }
      }
      .mod-buttons {
        display: flex;
        flex-wrap: wrap;
        gap: var(--fm-space-2);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminProvidersPageComponent implements OnInit {
  private readonly providersApi = inject(ProvidersApiService);
  readonly i18n = inject(LanguageService);readonly ar=()=>this.i18n.lang()==='ar';readonly loading=signal(true);readonly busy=signal('');readonly page=signal(1);readonly totalPages=signal(0);readonly pendingDecision=signal<{id:string,status:'APPROVED'|'REJECTED'|'SUSPENDED'}|null>(null);

  readonly statusFilter = signal<ProviderApprovalStatus | ''>('');
  readonly providers = signal<AdminProviderProfile[]>([]);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  private readonly reasonMap = new Map<string, string>();
  private readonly notesMap = new Map<string, string>();

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {this.loading.set(true);this.errorMessage.set(null);
    this.providersApi.listProvidersForAdmin(this.statusFilter(),this.page()).subscribe({
      next: (res) => {this.providers.set(res.items);this.totalPages.set(res.totalPages);this.loading.set(false);},
      error: (err: HttpErrorResponse) => {this.loading.set(false);this.handleError(err);},
    });
  }
  changePage(delta:number){this.page.update(v=>v+delta);this.reload();}
  confirmDecision(id:string,status:'APPROVED'|'REJECTED'|'SUSPENDED'){if(status!=='APPROVED'&&!this.reasonMap.get(id)?.trim()){this.errorMessage.set(this.ar()?'أدخل سبب الرفض أو التعليق أولاً.':'Enter a rejection or suspension reason first.');return;}this.pendingDecision.set({id,status});}
  applyDecision(){const choice=this.pendingDecision();this.pendingDecision.set(null);if(choice)this.decide(choice.id,choice.status);}

  onStatusFilterChange(status: ProviderApprovalStatus | ''): void {
    this.statusFilter.set(status);this.page.set(1);
    this.reload();
  }

  formatFils(fils: number): string {
    return formatFilsAsJod(fils, this.i18n.lang());
  }

  badgeVariant(status: string): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
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

  reasonInputFor(id: string): string {
    return this.reasonMap.get(id) ?? '';
  }

  setReasonInput(id: string, val: string): void {
    this.reasonMap.set(id, val);
  }

  notesInputFor(id: string, fallback?: string): string {
    return this.notesMap.get(id) ?? fallback ?? '';
  }

  setNotesInput(id: string, val: string): void {
    this.notesMap.set(id, val);
  }

  decide(id: string, status: 'APPROVED' | 'REJECTED' | 'SUSPENDED'): void {
    if(this.busy())return;this.busy.set(id);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const reason = this.reasonMap.get(id)?.trim();
    const verificationNotes = this.notesMap.get(id)?.trim();

    this.providersApi
      .updateProviderApproval(id, {
        status,
        reason: reason || undefined,
        verificationNotes: verificationNotes || undefined,
      })
      .subscribe({
        next: () => {
          this.busy.set('');this.successMessage.set(this.ar()?'تم حفظ قرار المراجعة.':'Moderation decision saved.');
          this.reload();
        },
        error: (err: HttpErrorResponse) => {this.busy.set('');this.handleError(err);},
      });
  }

  private handleError(err: HttpErrorResponse): void {
    const msg = err.error?.message;
    this.errorMessage.set(Array.isArray(msg) ? msg.join(' · ') : msg || 'Operation failed.');
  }
}
