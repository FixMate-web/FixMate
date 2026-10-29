import { ChangeDetectionStrategy, Component, input } from '@angular/core';
@Component({
  selector: 'app-fm-category-art',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="art" [attr.data-category]="slug()">
    <svg viewBox="0 0 48 48" aria-hidden="true"><path [attr.d]="path(slug())" /></svg>
  </div>`,
  styles: [
    `
      :host {
        display: block;
      }
      .art {
        height: 150px;
        display: grid;
        place-items: center;
        background: #edf1e7;
        border-radius: 10px;
      }
      .art[data-category='electrical-repairs'] {
        background: #f3eada;
      }
      .art[data-category='ac-maintenance'] {
        background: #e5edef;
      }
      .art[data-category='painting'] {
        background: #ebe7ee;
      }
      .art[data-category='carpentry'] {
        background: #eee5d9;
      }
      svg {
        width: 52px;
        height: 52px;
        fill: none;
        stroke: #446c55;
        stroke-width: 1.6;
        stroke-linejoin: round;
        stroke-linecap: round;
      }
    `,
  ],
})
export class FmCategoryArtComponent {
  readonly slug = input('');
  path(slug: string): string {
    return (
      (
        {
          plumbing: 'M28 8a11 11 0 0 0-13 14L6 33l8 8 11-10A11 11 0 0 0 39 18l-8 8-9-9Z',
          'electrical-repairs': 'm28 4-17 23h12l-3 17 17-24H25Z',
          'ac-maintenance':
            'M24 4v40M7 14l34 20M7 34l34-20M18 8l6 6 6-6M18 40l6-6 6 6M7 22l8-4-1-8M34 38l-1-8 8-4',
          cleaning: 'm24 6 5 13 13 5-13 5-5 13-5-13-13-5 13-5ZM39 4v10M34 9h10',
          painting: 'M7 7h29v14H7ZM36 12h6v16H23v15h-6V28',
          carpentry: 'm9 8 8-3 17 17-8 8ZM27 29 13 43l-7-7 14-14M33 17l8-8 4 4-8 8',
        } as Record<string, string>
      )[slug] ?? 'M6 22 24 6l18 16v20H6ZM19 42V27h10v15'
    );
  }
}
