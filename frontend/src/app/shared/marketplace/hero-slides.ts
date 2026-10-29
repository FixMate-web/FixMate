export interface HeroSlide {
  id: string;
  categorySlug: string;
  src: string;
  small: string;
  position: string;
  mobilePosition: string;
  caption: { en: string; ar: string };
  description: { en: string; ar: string };
}

// Generated illustrative service scenes, not photographs of FixMate professionals.
// Provenance and prompts: artifacts/service-heroes/generation-provenance.json.
export const HERO_SLIDES: readonly HeroSlide[] = [
  {
    id: 'cleaning',
    categorySlug: 'cleaning',
    src: '/images/hero/hero-cleaning.webp',
    small: '/images/hero/hero-cleaning-960.webp',
    position: '88% 55%',
    mobilePosition: '70% 52%',
    caption: { en: 'Professional home cleaning', ar: 'تنظيف منزلي احترافي' },
    description: {
      en: 'A cleaner wiping a kitchen countertop.',
      ar: 'عاملة تنظيف تنظّف سطح المطبخ.',
    },
  },
  {
    id: 'plumbing',
    categorySlug: 'plumbing',
    src: '/images/hero/hero-plumbing.webp',
    small: '/images/hero/hero-plumbing-960.webp',
    position: '92% 57%',
    mobilePosition: '80% 58%',
    caption: { en: 'Plumbing repairs and leaks', ar: 'إصلاح السباكة والتسريبات' },
    description: {
      en: 'A plumber repairing the drain beneath a kitchen sink.',
      ar: 'فني سباكة يصلح أنبوب التصريف أسفل حوض المطبخ.',
    },
  },
  {
    id: 'electrical',
    categorySlug: 'electrical-repairs',
    src: '/images/hero/hero-electrical.webp',
    small: '/images/hero/hero-electrical-960.webp',
    position: '94% 48%',
    mobilePosition: '80% 45%',
    caption: { en: 'Electrical repair and maintenance', ar: 'صيانة وإصلاح الكهرباء' },
    description: {
      en: 'An electrician fitting a residential wall switch.',
      ar: 'فني كهرباء يركّب مفتاح إنارة منزلي.',
    },
  },
  {
    id: 'air-conditioning',
    categorySlug: 'ac-maintenance',
    src: '/images/hero/hero-air-conditioning.webp',
    small: '/images/hero/hero-air-conditioning-960.webp',
    position: '96% 22%',
    mobilePosition: '85% 18%',
    caption: { en: 'Air conditioner care and cleaning', ar: 'صيانة وتنظيف المكيفات' },
    description: {
      en: 'A technician servicing a split air conditioner filter.',
      ar: 'فني يصون فلتر مكيف سبليت منزلي.',
    },
  },
  {
    id: 'furniture-moving',
    categorySlug: 'moving',
    src: '/images/hero/hero-furniture-moving.webp',
    small: '/images/hero/hero-furniture-moving-960.webp',
    position: '96% 55%',
    mobilePosition: '80% 55%',
    caption: { en: 'Furniture moving and household help', ar: 'نقل الأثاث والمساعدة المنزلية' },
    description: {
      en: 'Two movers carrying a sofa together.',
      ar: 'عاملان يتعاونان على نقل أريكة.',
    },
  },
  {
    id: 'interior-painting',
    categorySlug: 'painting',
    src: '/images/hero/hero-interior-painting.webp',
    small: '/images/hero/hero-interior-painting-960.webp',
    position: '95% 44%',
    mobilePosition: '80% 42%',
    caption: { en: 'Interior painting and wall refreshes', ar: 'دهان وتجديد الجدران' },
    description: {
      en: 'A painter applying fresh paint with a roller.',
      ar: 'عاملة دهان تجدّد جدارًا باستخدام رول الدهان.',
    },
  },
  {
    id: 'garden-maintenance',
    categorySlug: 'landscaping',
    src: '/images/hero/hero-garden-maintenance.webp',
    small: '/images/hero/hero-garden-maintenance-960.webp',
    position: '94% 50%',
    mobilePosition: '80% 48%',
    caption: { en: 'Garden care and maintenance', ar: 'تنسيق وصيانة الحدائق' },
    description: {
      en: 'A gardener pruning a hedge in a residential courtyard.',
      ar: 'بستاني يقلّم شجيرات في حديقة منزلية.',
    },
  },
];
