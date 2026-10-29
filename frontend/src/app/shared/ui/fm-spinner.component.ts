import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-fm-spinner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fm-spinner" role="status" aria-live="polite">
      <span class="fm-spinner__circle" aria-hidden="true"></span>
      @if (label()) {
        <span class="fm-spinner__text">{{ label() }}</span>
      } @else {
        <span class="sr-only">Loading...</span>
      }
    </div>
  `,
  styles: [
    `
      .fm-spinner {
        display: inline-flex;
        align-items: center;
        gap: var(--fm-space-2);
        color: var(--fm-color-brand-teal);
        font-size: var(--fm-text-sm);
        font-weight: 600;
      }

      .fm-spinner__circle {
        width: 1.25rem;
        height: 1.25rem;
        border: 2.5px solid var(--fm-color-brand-teal-subtle);
        border-block-start-color: var(--fm-color-brand-teal);
        border-radius: 50%;
        animation: fm-spin 0.8s linear infinite;
      }

      @keyframes fm-spin {
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class FmSpinnerComponent {
  readonly label = input<string>('');
}
