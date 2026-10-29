import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs';
import { LanguageService } from '../../core/i18n/language.service';
import { CatalogApiService, CatalogServiceItem } from '../../core/services/catalog-api.service';
import { GOVERNORATES, money } from './marketplace.utils';

@Component({
  selector: 'app-discovery-search',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form
      class="discovery-search"
      [class.compact]="compact()"
      [formGroup]="form"
      (ngSubmit)="search()"
    >
      <!-- Top Row: Full-width Project Description Input (Reference Screenshot 1) -->
      <div
        class="search-top-row"
        (focusout)="onSearchFocusOut($event)"
        (keydown.escape)="suggestionsOpen.set(false)"
      >
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2" />
          <path
            d="M20 20L16.5 16.5"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
        <label class="sr-only" [for]="idPrefix() + '-service'">
          {{ ar() ? 'ما الخدمة التي تحتاجها؟' : 'What can we help with?' }}
        </label>
        <input
          [id]="idPrefix() + '-service'"
          formControlName="q"
          (focus)="suggestionsOpen.set(true)"
          type="search"
          [attr.aria-controls]="
            suggestions().length && suggestionsOpen() ? idPrefix() + '-suggestions' : null
          "
          autocomplete="off"
          [placeholder]="
            ar()
              ? 'صف مشروعك أو العطل بالتفصيل — مثلاً: تنظيف مكيف، تسريب مياه...'
              : 'Describe your project or problem — be as detailed as you’d like.'
          "
        />

        @if (suggestions().length > 0 && suggestionsOpen()) {
          <nav
            class="suggestions-popover"
            [id]="idPrefix() + '-suggestions'"
            [attr.aria-label]="ar() ? 'خدمات مقترحة' : 'Suggested services'"
          >
            @for (svc of suggestions(); track svc.id) {
              <a [routerLink]="['/services', svc.slug]" class="suggestion-item">
                <span class="suggestion-title">{{ svc.title[i18n.lang()] }}</span>
                <span class="suggestion-price">{{ formatPrice(svc) }}</span>
              </a>
            }
          </nav>
        }
      </div>

      <!-- Bottom Row: Governorate Location Pill + Deep Navy "Find a pro →" Pill Button -->
      <div class="search-bottom-row">
        <div class="location-pill">
          <svg class="pin-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 21C16 16.8 18 13.4 18 10A6 6 0 1 0 6 10C6 13.4 8 16.8 12 21Z"
              stroke="currentColor"
              stroke-width="1.8"
            />
            <circle cx="12" cy="10" r="2.2" stroke="currentColor" stroke-width="1.8" />
          </svg>
          <label class="sr-only" [for]="idPrefix() + '-location'">
            {{ ar() ? 'أين تحتاج الخدمة؟' : 'Where do you need it?' }}
          </label>
          <select [id]="idPrefix() + '-location'" formControlName="governorate">
            <option value="">{{ ar() ? 'المحافظة' : 'Location' }}</option>
            @for (g of governorates; track g[0]) {
              <option [value]="g[0]">{{ g[ar() ? 1 : 0] }}</option>
            }
          </select>
        </div>

        <button type="submit" class="find-pro-btn">
          <span>{{ ar() ? 'ابحث عن محترف' : 'Find a pro' }}</span>
          <span class="direction-arrow" aria-hidden="true">→</span>
        </button>
      </div>
    </form>
  `,
  styles: [
    `
      .discovery-search {
        display: flex;
        flex-direction: column;
        gap: 4px;
        background: #ffffff;
        border: 1px solid rgba(229, 231, 235, 0.95);
        border-radius: 16px;
        padding: 10px 16px 16px;
        box-shadow: 0 2px 5px rgba(7, 47, 64, 0.08);
        width: 100%;
      }

      .search-top-row {
        position: relative;
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
        padding: 0 0 4px;
      }

      .search-icon {
        width: 20px;
        height: 20px;
        color: #6b7280;
        flex-shrink: 0;
      }

      input {
        flex: 1;
        width: 0;
        min-width: 0;
        border: 0;
        background: transparent;
        color: #111827;
        font: inherit;
        font-size: 15px;
        font-weight: 500;
        min-height: 34px;

        &::placeholder {
          color: #6b7280;
        }

        &:focus {
          outline: none;
        }
      }

      .suggestions-popover {
        position: relative;
        flex-basis: 100%;
        max-height: 220px;
        overflow-y: auto;
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        box-shadow: 0 14px 32px rgba(7, 47, 64, 0.16);
        padding: 6px;
        z-index: 40;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .suggestion-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 9px 12px;
        border-radius: 8px;
        text-decoration: none;
        color: #111827;
        font-size: 14px;
        font-weight: 600;

        &:hover {
          background: #eef8fc;
          color: #009fd9;
        }

        .suggestion-price {
          font-size: 12px;
          font-weight: 700;
          color: #072f40;
          background: #f1f5f9;
          padding: 3px 9px;
          border-radius: 999px;
          white-space: nowrap;
        }
      }

      .search-bottom-row {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .location-pill {
        display: flex;
        align-items: center;
        gap: 8px;
        border: 1px solid #d1d5db;
        border-radius: 999px;
        padding: 0 10px;
        height: 40px;
        background: #ffffff;
        width: 160px;
        min-width: 0;
        flex-shrink: 0;
        transition: border-color 0.15s ease;

        &:focus-within {
          border-color: #009fd9;
        }
      }

      .pin-icon {
        width: 18px;
        height: 18px;
        color: #4b5563;
        flex-shrink: 0;
      }

      select {
        width: 100%;
        border: 0;
        background: transparent;
        color: #111827;
        font: inherit;
        font-size: 14px;
        font-weight: 600;
        height: 100%;
        cursor: pointer;

        &:focus {
          outline: none;
        }
      }

      .find-pro-btn {
        flex: 1;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        height: 40px;
        background: #072f40;
        color: #ffffff;
        border: 0;
        border-radius: 999px;
        padding: 0 24px;
        font: inherit;
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
        white-space: nowrap;
        transition:
          background-color 0.16s ease,
          transform 0.16s ease;

        &:hover {
          background: #052330;
          transform: translateY(-1px);
        }
      }

      .compact {
        flex-direction: row;
        align-items: center;
        border-radius: 999px;
        padding: 8px;
        gap: 8px;
        .search-top-row {
          flex: 1;
          min-width: 0;
          padding: 0 14px;
        }
        .search-icon {
          display: none;
        }
        .search-bottom-row {
          width: 324px;
          gap: 8px;
        }
        .location-pill {
          width: 136px;
          border: 0;
          border-inline-start: 1px solid #e5e7eb;
          border-radius: 0;
        }
        select {
          font-size: 12px;
          font-weight: 400;
        }
        .find-pro-btn {
          padding-inline: 20px;
        }
      }
      @media (max-width: 640px) {
        .search-bottom-row {
          align-items: stretch;
        }

        .location-pill {
          width: 44%;
        }
        .find-pro-btn {
          min-height: 44px;
          padding-inline: 12px;
        }
        .location-pill {
          height: 44px;
        }
        .discovery-search {
          padding: 12px;
        }
        input {
          font-size: 14px;
          min-width: 0;
        }
      }
    `,
  ],
})
export class DiscoverySearchComponent {
  readonly compact = input(false);
  readonly idPrefix = input('discover');
  readonly i18n = inject(LanguageService);
  readonly ar = () => this.i18n.lang() === 'ar';
  readonly governorates = GOVERNORATES;
  private readonly api = inject(CatalogApiService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly form = new FormGroup({
    q: new FormControl('', { nonNullable: true }),
    governorate: new FormControl('', { nonNullable: true }),
  });

  readonly suggestions = signal<CatalogServiceItem[]>([]);
  readonly suggestionsOpen = signal(false);

  constructor() {
    this.form.controls.q.valueChanges
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        switchMap((q) =>
          q.trim().length < 2
            ? of({ items: [] })
            : this.api
                .getServices({ q: q.trim(), limit: 6 })
                .pipe(catchError(() => of({ items: [] }))),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((res) => this.suggestions.set(res.items));
  }

  onSearchFocusOut(event: FocusEvent) {
    const row = event.currentTarget as HTMLElement;
    if (!(event.relatedTarget instanceof Node) || !row.contains(event.relatedTarget)) {
      this.suggestionsOpen.set(false);
    }
  }

  formatPrice(svc: CatalogServiceItem): string {
    return svc.pricingPolicy ? money(svc.pricingPolicy.indicativeAmountFils, this.i18n.lang()) : '';
  }

  search() {
    this.suggestionsOpen.set(false);
    const v = this.form.getRawValue();
    void this.router.navigate(['/services'], {
      queryParams: { q: v.q.trim() || null, governorate: v.governorate || null },
    });
  }
}
