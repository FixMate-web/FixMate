import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageService } from '../../core/i18n/language.service';
@Component({
  selector: 'app-about-page',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="fm-container editorial-page">
    <header class="page-header">
      <span class="eyebrow">FIXMATE · JORDAN</span>
      <h1>{{ ar() ? titleAr : title }}</h1>
      <p>{{ ar() ? descAr : desc }}</p>
    </header>
    <img
      class="editorial-image"
      src="/images/editorial/living.webp"
      alt=""
      width="1920"
      height="1440"
      loading="lazy"
    />
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
export class AboutPageComponent {
  readonly i18n = inject(LanguageService);
  readonly ar = () => this.i18n.lang() === 'ar';
  readonly title = 'Good care starts with a good connection.';
  readonly titleAr =
    '\u0627\u0644\u0639\u0646\u0627\u064a\u0629 \u0627\u0644\u062c\u064a\u062f\u0629 \u062a\u0628\u062f\u0623 \u0628\u0627\u0644\u0634\u062e\u0635 \u0627\u0644\u0645\u0646\u0627\u0633\u0628.';
  readonly desc =
    'FixMate brings home services in Jordan into one clear, approachable place. Discover what your home needs, understand indicative prices, and explore professionals before making your choice.';
  readonly descAr =
    '\u064a\u062c\u0645\u0639 \u0641\u064a\u0643\u0633 \u0645\u064a\u062a \u062e\u062f\u0645\u0627\u062a \u0627\u0644\u0645\u0646\u0627\u0632\u0644 \u0641\u064a \u0627\u0644\u0623\u0631\u062f\u0646 \u0641\u064a \u0645\u0643\u0627\u0646 \u0648\u0627\u0636\u062d \u0648\u0633\u0647\u0644. \u0627\u0643\u062a\u0634\u0641 \u0645\u0627 \u064a\u062d\u062a\u0627\u062c\u0647 \u0628\u064a\u062a\u0643\u060c \u0648\u062a\u0639\u0631\u0651\u0641 \u0639\u0644\u0649 \u0627\u0644\u0623\u0633\u0639\u0627\u0631 \u0627\u0644\u0627\u0633\u062a\u0631\u0634\u0627\u062f\u064a\u0629\u060c \u0648\u0642\u0627\u0631\u0646 \u0645\u0632\u0648\u062f\u064a \u0627\u0644\u062e\u062f\u0645\u0629 \u0642\u0628\u0644 \u0627\u0644\u0627\u062e\u062a\u064a\u0627\u0631.';
  readonly cards = [
    [
      'Built around your home',
      '\u0645\u0635\u0645\u0645 \u062d\u0648\u0644 \u0627\u062d\u062a\u064a\u0627\u062c\u0627\u062a \u0628\u064a\u062a\u0643',
      'From plumbing and electrical repairs to cleaning and carpentry, explore services from our active catalog.',
      '\u0645\u0646 \u0627\u0644\u0633\u0628\u0627\u0643\u0629 \u0648\u0627\u0644\u0643\u0647\u0631\u0628\u0627\u0621 \u0625\u0644\u0649 \u0627\u0644\u062a\u0646\u0638\u064a\u0641 \u0648\u0627\u0644\u0646\u062c\u0627\u0631\u0629\u060c \u0627\u0633\u062a\u0643\u0634\u0641 \u0627\u0644\u062e\u062f\u0645\u0627\u062a \u0641\u064a \u062f\u0644\u064a\u0644\u0646\u0627.',
    ],
    [
      'Know who you\u2019re choosing',
      '\u062a\u0639\u0631\u0651\u0641 \u0639\u0644\u0649 \u0645\u0646 \u062a\u062e\u062a\u0627\u0631',
      'Public listings are reviewed by our administration. Compare experience, coverage, and service offerings. Listing approval is not a professional licence or background certification.',
      '\u062a\u0631\u0627\u062c\u0639 \u0627\u0644\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0645\u0644\u0641\u0627\u062a \u0642\u0628\u0644 \u0646\u0634\u0631\u0647\u0627. \u0642\u0627\u0631\u0646 \u0627\u0644\u062e\u0628\u0631\u0629 \u0648\u0627\u0644\u062a\u063a\u0637\u064a\u0629 \u0648\u0627\u0644\u062e\u062f\u0645\u0627\u062a. \u0627\u0639\u062a\u0645\u0627\u062f \u0627\u0644\u0625\u062f\u0631\u0627\u062c \u0644\u0627 \u064a\u0645\u062b\u0644 \u062a\u0631\u062e\u064a\u0635\u0627\u064b \u0645\u0647\u0646\u064a\u0627\u064b \u0623\u0648 \u0634\u0647\u0627\u062f\u0629 \u0641\u062d\u0635 \u062e\u0644\u0641\u064a\u0629.',
    ],
    [
      'Clear from the start',
      '\u0648\u0636\u0648\u062d \u0645\u0646 \u0627\u0644\u0628\u062f\u0627\u064a\u0629',
      'Prices are shown in Jordanian dinars. Fixed prices, starting prices, and inspection fees are identified so you can understand the scope.',
      '\u0627\u0644\u0623\u0633\u0639\u0627\u0631 \u0628\u0627\u0644\u062f\u064a\u0646\u0627\u0631 \u0627\u0644\u0623\u0631\u062f\u0646\u064a\u060c \u0645\u0639 \u062a\u0648\u0636\u064a\u062d \u0627\u0644\u0633\u0639\u0631 \u0627\u0644\u062b\u0627\u0628\u062a \u0648\u0627\u0644\u0633\u0639\u0631 \u0627\u0644\u0627\u0628\u062a\u062f\u0627\u0626\u064a \u0648\u0631\u0633\u0648\u0645 \u0627\u0644\u0645\u0639\u0627\u064a\u0646\u0629.',
    ],
  ];
}
