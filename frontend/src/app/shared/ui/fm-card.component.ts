import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-fm-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="fm-card" [class.fm-card--elevated]="elevated()">
      @if (title() || subtitle()) {
        <header class="fm-card__header">
          <div class="fm-card__headings">
            @if (title()) {
              <h3 class="fm-card__title">{{ title() }}</h3>
            }
            @if (subtitle()) {
              <p class="fm-card__subtitle">{{ subtitle() }}</p>
            }
          </div>
          <div class="fm-card__header-extra">
            <ng-content select="[cardHeaderExtra]" />
          </div>
        </header>
      }
      <div class="fm-card__body">
        <ng-content />
      </div>
    </article>
  `,
  styles: [
    `
      .fm-card {
        background-color: var(--fm-color-surface-white);
        border: 1px solid var(--fm-color-border);
        border-radius: var(--fm-radius-lg);
        box-shadow: var(--fm-shadow-sm);
        overflow: hidden;
        height: 100%;
        display: flex;
        flex-direction: column;
      }

      .fm-card--elevated {
        box-shadow: var(--fm-shadow-md);
      }

      .fm-card__header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: var(--fm-space-3);
        padding-block: var(--fm-space-4);
        padding-inline: var(--fm-space-5);
        border-block-end: 1px solid var(--fm-color-border);
        background-color: var(--fm-color-surface-light);
      }

      .fm-card__title {
        margin: 0;
        font-size: var(--fm-text-lg);
        color: var(--fm-color-deep-navy);
      }

      .fm-card__subtitle {
        margin-block-start: var(--fm-space-1);
        margin-block-end: 0;
        font-size: var(--fm-text-sm);
        color: var(--fm-color-text-secondary);
      }

      .fm-card__body {
        padding: var(--fm-space-5);
        flex: 1;
      }
    `,
  ],
})
export class FmCardComponent {
  readonly title = input<string>('');
  readonly subtitle = input<string>('');
  readonly elevated = input<boolean>(false);
}
