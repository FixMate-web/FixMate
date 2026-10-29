import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageService } from '../../core/i18n/language.service';
@Component({
  selector: 'app-faq-page',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="fm-container faq-page">
    <header class="page-header">
      <span class="eyebrow">{{ ar() ? 'إجابات واضحة' : 'A LITTLE CLARITY' }}</span>
      <h1>{{ i18n.t().pages.faqTitle }}</h1>
      <p>
        {{
          ar()
            ? 'كل ما تحتاج معرفته قبل اختيار الخدمة المناسبة.'
            : 'Everything to know before finding the right help for your home.'
        }}
      </p>
    </header>
    @for (item of items; track item[0]) {
      <details>
        <summary>{{ ar() ? item[1] : item[0] }}</summary>
        <p>{{ ar() ? item[3] : item[2] }}</p>
      </details>
    }
    <a class="fm-link-button" routerLink="/services"
      >{{ ar() ? 'استكشف الخدمات' : 'Explore services' }} ↗</a
    >
  </div>`,
  styles: [
    `
      .faq-page {
        max-width: 900px;
      }
      details {
        background: white;
        border: 1px solid #dce4da;
        border-radius: 12px;
        margin-bottom: 14px;
        padding: 22px 26px;
      }
      summary {
        font-weight: 650;
        cursor: pointer;
      }
      details p {
        margin: 20px 0 0;
        color: #55665e;
        line-height: 1.85;
      }
      .fm-link-button {
        margin-top: 24px;
      }
    `,
  ],
})
export class FaqPageComponent {
  readonly i18n = inject(LanguageService);
  readonly ar = () => this.i18n.lang() === 'ar';
  readonly items = [
    [
      'Can I book a service now?',
      'هل يمكنني حجز خدمة الآن؟',
      'You can explore services and compare professional profiles today. Online booking is coming soon and is not available in this release.',
      'يمكنك استكشاف الخدمات ومقارنة الملفات الآن. الحجز الإلكتروني سيتوفر قريباً وغير متاح في هذا الإصدار.',
    ],
    [
      'What does an approved listing mean?',
      'ماذا يعني اعتماد ملف مزود الخدمة؟',
      'Our administration has reviewed the profile and service offerings for listing. This does not represent government licensing or a background certification.',
      'راجعت الإدارة الملف والخدمات لاعتماد إدراجه في الدليل. هذا لا يمثل ترخيصاً حكومياً أو شهادة فحص خلفية.',
    ],
    [
      'How do prices work?',
      'كيف تعمل الأسعار؟',
      'All prices are in Jordanian dinars. A fixed price applies to the described scope; a starting price may increase with the work required. An inspection fee covers assessment. Provider offerings may differ from catalog estimates.',
      'جميع الأسعار بالدينار الأردني. السعر الثابت يرتبط بالنطاق الموصوف، وقد يرتفع السعر الابتدائي حسب العمل المطلوب. رسوم المعاينة تغطي التقييم. قد تختلف عروض المزودين عن تقديرات الدليل.',
    ],
    [
      'How do I find someone in my area?',
      'كيف أجد مزود خدمة في منطقتي؟',
      'Filter the provider directory by service and governorate. Open a profile to see coverage areas, offerings, and weekly working hours.',
      'صفّ دليل المزودين حسب الخدمة والمحافظة. افتح الملف للاطلاع على مناطق التغطية والخدمات وساعات العمل الأسبوعية.',
    ],
    [
      'Can I offer my services on FixMate?',
      'هل يمكنني تقديم خدماتي على فيكس ميت؟',
      'Yes. Register as a service provider, complete your profile, add your services and weekly availability, and submit your application for review.',
      'نعم. سجل كمزود خدمة وأكمل ملفك وأضف خدماتك وأوقات عملك الأسبوعية ثم أرسل طلبك للمراجعة.',
    ],
  ];
}
