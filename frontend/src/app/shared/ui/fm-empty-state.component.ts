import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-fm-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="fm-empty" aria-live="polite">
      <div class="fm-empty__icon" aria-hidden="true">{{ icon() }}</div>
      <h3 class="fm-empty__title">{{ title() }}</h3>
      <p class="fm-empty__desc">{{ description() }}</p>
      <div class="fm-empty__actions">
        <ng-content />
      </div>
    </section>
  `,
  styles: [
    `
      .fm-empty {
        text-align: center;
        padding-block: var(--fm-space-8);
        padding-inline: var(--fm-space-6);
        background-color: var(--fm-color-surface-white);
        border: 1px dashed var(--fm-color-border-strong);
        border-radius: var(--fm-radius-lg);
      }

      .fm-empty__icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 3.25rem;
        height: 3.25rem;
        margin-block-end: var(--fm-space-3);
        border-radius: 50%;
        background-color: var(--fm-color-brand-teal-subtle);
        color: var(--fm-color-brand-teal);
        font-size: 1.5rem;
        font-weight: 700;
      }

      .fm-empty__title {
        margin-block-end: var(--fm-space-2);
        font-size: var(--fm-text-lg);
        color: var(--fm-color-deep-navy);
      }

      .fm-empty__desc {
        max-width: 38rem;
        margin-inline: auto;
        margin-block-end: var(--fm-space-4);
        font-size: var(--fm-text-sm);
        color: var(--fm-color-text-secondary);
      }

      .fm-empty__actions {
        display: flex;
        justify-content: center;
        gap: var(--fm-space-3);
        flex-wrap: wrap;
      }
    `,
  ],
})
export class FmEmptyStateComponent {
  readonly icon = input<string>('◈');
  readonly title = input.required<string>();
  readonly description = input.required<string>();
}
