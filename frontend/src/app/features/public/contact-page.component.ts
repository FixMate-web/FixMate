import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageService } from '../../core/i18n/language.service';
@Component({
  selector: 'app-contact-page',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="fm-container editorial-page">
    <header class="page-header">
      <span class="eyebrow">FIXMATE · JORDAN</span>
      <h1>{{ ar() ? titleAr : title }}</h1>
      <p>{{ ar() ? descAr : desc }}</p>
    </header>
    <div class="editorial-grid">
      @for (card of cards; track card[0]; let n = $index) {
        <article>
          <span class="eyebrow">0{{ n + 1 }}</span>
          <h2>{{ ar() ? card[1] : card[0] }}</h2>
          <p>{{ ar() ? card[3] : card[2] }}</p>
        </article>
      }
    </div>
    <div class="editorial-actions">
      <a class="fm-link-button" routerLink="/services"
        >{{ ar() ? 'استكشف الخدمات' : 'Explore services' }} ↗</a
      ><a routerLink="/faq">{{ ar() ? 'الأسئلة الشائعة' : 'Visit our FAQs' }}</a>
    </div>
  </div>`,
  styleUrl: './editorial-page.scss',
})
export class ContactPageComponent {
  readonly i18n = inject(LanguageService);
  readonly ar = () => this.i18n.lang() === 'ar';
  readonly title = 'A little guidance goes a long way.';
  readonly titleAr =
    '\u0646\u062d\u0646 \u0647\u0646\u0627 \u0644\u0625\u0631\u0634\u0627\u062f\u0643.';
  readonly desc =
    'Find the right next step for your question. Direct support contact details have not been published yet.';
  readonly descAr =
    '\u0627\u0639\u062b\u0631 \u0639\u0644\u0649 \u0627\u0644\u062e\u0637\u0648\u0629 \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629 \u0644\u0627\u0633\u062a\u0641\u0633\u0627\u0631\u0643. \u0644\u0645 \u062a\u064f\u0646\u0634\u0631 \u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u062a\u0648\u0627\u0635\u0644 \u0627\u0644\u0645\u0628\u0627\u0634\u0631 \u0645\u0639 \u0627\u0644\u062f\u0639\u0645 \u0628\u0639\u062f.';
  readonly cards = [
    [
      'Questions about services?',
      '\u0644\u062f\u064a\u0643 \u0633\u0624\u0627\u0644 \u0639\u0646 \u0627\u0644\u062e\u062f\u0645\u0627\u062a\u061f',
      'Explore the catalog for descriptions, indicative prices, and estimated durations.',
      '\u062a\u0635\u0641\u062d \u0627\u0644\u062f\u0644\u064a\u0644 \u0644\u0644\u0627\u0637\u0644\u0627\u0639 \u0639\u0644\u0649 \u0627\u0644\u062a\u0641\u0627\u0635\u064a\u0644 \u0648\u0627\u0644\u0623\u0633\u0639\u0627\u0631 \u0627\u0644\u0627\u0633\u062a\u0631\u0634\u0627\u062f\u064a\u0629 \u0648\u0627\u0644\u0645\u062f\u0629 \u0627\u0644\u062a\u0642\u062f\u064a\u0631\u064a\u0629.',
    ],
    [
      'Building your professional profile?',
      '\u062a\u062c\u0647\u0651\u0632 \u0645\u0644\u0641\u0643 \u0627\u0644\u0645\u0647\u0646\u064a\u061f',
      'Create a provider account, add your experience and service area, then submit your profile for review.',
      '\u0623\u0646\u0634\u0626 \u062d\u0633\u0627\u0628 \u0645\u0632\u0648\u062f \u062e\u062f\u0645\u0629 \u0648\u0623\u0636\u0641 \u062e\u0628\u0631\u062a\u0643 \u0648\u0645\u0646\u0627\u0637\u0642 \u0639\u0645\u0644\u0643 \u062b\u0645 \u0623\u0631\u0633\u0644 \u0645\u0644\u0641\u0643 \u0644\u0644\u0645\u0631\u0627\u062c\u0639\u0629.',
    ],
    [
      'Need to update your account?',
      '\u062a\u0631\u064a\u062f \u062a\u062d\u062f\u064a\u062b \u062d\u0633\u0627\u0628\u0643\u061f',
      'Sign in to manage your name, phone number, and preferred language from your profile.',
      '\u0633\u062c\u0644 \u0627\u0644\u062f\u062e\u0648\u0644 \u0644\u062a\u062d\u062f\u064a\u062b \u0627\u0633\u0645\u0643 \u0648\u0631\u0642\u0645 \u0647\u0627\u062a\u0641\u0643 \u0648\u0644\u063a\u062a\u0643 \u0627\u0644\u0645\u0641\u0636\u0644\u0629 \u0645\u0646 \u0645\u0644\u0641\u0643 \u0627\u0644\u0634\u062e\u0635\u064a.',
    ],
  ];
}
