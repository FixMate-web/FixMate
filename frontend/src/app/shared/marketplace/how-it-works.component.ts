import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageService } from '../../core/i18n/language.service';
import { ScrollRevealDirective } from '../ui/scroll-reveal.directive';
@Component({
  selector: 'app-how-it-works',
  standalone: true,
  imports: [RouterLink, ScrollRevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<section class="how-it-works" aria-labelledby="how-heading">
    <div class="fm-container">
      <header appReveal>
        <h2 id="how-heading">{{ ar() ? 'كيف يعمل FixMate؟' : 'How it works' }}</h2>
        <p>
          {{
            ar()
              ? 'من أول سؤال إلى الخطوة التالية لبيتك، ابدأ باختيار واضح.'
              : 'From the first question to your next home project, start with a clear choice.'
          }}
        </p>
      </header>
      <div class="steps">
        @for (step of steps; track step.number) {
          <article appReveal [revealDelay]="$index * 90">
            <div class="step-top">
              <span class="step-number">{{ step.number }}</span
              ><svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
                <path
                  [attr.d]="step.path"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
            <h3>{{ ar() ? step.ar : step.en }}</h3>
            <p>{{ ar() ? step.detailAr : step.detailEn }}</p>
          </article>
        }
      </div>
      <div class="how-cta" appReveal>
        <a routerLink="/providers"
          >{{ ar() ? 'ابحث عن محترف' : 'Find a professional' }}
          <span class="direction-arrow" aria-hidden="true">→</span></a
        >
      </div>
    </div>
  </section>`,
  styleUrl: './how-it-works.component.scss',
})
export class HowItWorksComponent {
  readonly i18n = inject(LanguageService);
  readonly ar = () => this.i18n.lang() === 'ar';
  readonly steps = [
    {
      number: '01',
      en: 'Find a service',
      ar: 'ابحث عن الخدمة',
      detailEn:
        'Search for the service you need, or describe the problem. Choose your governorate to carry your location into discovery.',
      detailAr:
        'ابحث عن الخدمة التي تحتاجها أو صف المشكلة. اختر محافظتك لتحديد موقع الخدمة أثناء البحث.',
      path: 'M14 3a11 11 0 1 0 0 22 11 11 0 0 0 0-22z M22 22l7 7',
    },
    {
      number: '02',
      en: 'Explore professionals',
      ar: 'تصفّح مقدّمي الخدمات',
      detailEn:
        'Explore available professional profiles, service offerings, areas covered, and customer reviews where available.',
      detailAr:
        'تصفّح ملفات مقدّمي الخدمات المتاحين وخدماتهم ومناطق تغطيتهم وتقييمات العملاء إن توفرت.',
      path: 'M11 4a5 5 0 1 0 0 10 5 5 0 0 0 0-10z M2 29v-5a9 9 0 0 1 18 0v5 M24 6a4 4 0 0 1 0 8 M24 20a6 6 0 0 1 6 6v3',
    },
    {
      number: '03',
      en: 'Request your service',
      ar: 'اطلب الخدمة',
      detailEn:
        'Sign in to send a project request or book an offered appointment. Agree the scope and price with the professional; bookings require their acceptance.',
      detailAr:
        'سجّل الدخول لإرسال طلب مشروع أو حجز موعد متاح ضمن خدمات المزود. اتفق معه على نطاق العمل والسعر؛ ويتطلب تثبيت الحجز قبوله.',
      path: 'M7 5h18v24H7z M12 5V2h8v5h-8 M12 17l3 3 6-6',
    },
  ];
}
