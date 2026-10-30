export interface HeroSlide {
  id: string;
  categorySlug: string;
  src: string;
  small: string;
  position: string;
  mobilePosition: string;
}

// Generated illustrative service scenes, not photographs of FixMate professionals.
// Provenance and prompts: docs/hero-generation-provenance.json.
export const HERO_SLIDES: readonly HeroSlide[] = [
  {
    id: 'cleaning',
    categorySlug: 'cleaning',
    src: '/images/hero/hero-cleaning.webp',
    small: '/images/hero/hero-cleaning-960.webp',
    position: '88% 55%',
    mobilePosition: '70% 52%',
  },
  {
    id: 'plumbing',
    categorySlug: 'plumbing',
    src: '/images/hero/hero-plumbing.webp',
    small: '/images/hero/hero-plumbing-960.webp',
    position: '92% 57%',
    mobilePosition: '80% 58%',
  },
  {
    id: 'electrical',
    categorySlug: 'electrical-repairs',
    src: '/images/hero/hero-electrical.webp',
    small: '/images/hero/hero-electrical-960.webp',
    position: '94% 48%',
    mobilePosition: '80% 45%',
  },
  {
    id: 'air-conditioning',
    categorySlug: 'ac-maintenance',
    src: '/images/hero/hero-air-conditioning.webp',
    small: '/images/hero/hero-air-conditioning-960.webp',
    position: '96% 22%',
    mobilePosition: '85% 18%',
  },
  {
    id: 'furniture-moving',
    categorySlug: 'moving',
    src: '/images/hero/hero-furniture-moving.webp',
    small: '/images/hero/hero-furniture-moving-960.webp',
    position: '96% 55%',
    mobilePosition: '80% 55%',
  },
  {
    id: 'interior-painting',
    categorySlug: 'painting',
    src: '/images/hero/hero-interior-painting.webp',
    small: '/images/hero/hero-interior-painting-960.webp',
    position: '95% 44%',
    mobilePosition: '80% 42%',
  },
  {
    id: 'garden-maintenance',
    categorySlug: 'landscaping',
    src: '/images/hero/hero-garden-maintenance.webp',
    small: '/images/hero/hero-garden-maintenance-960.webp',
    position: '94% 50%',
    mobilePosition: '80% 48%',
  },
];
