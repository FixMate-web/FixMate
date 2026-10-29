import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  output,
  signal,
} from '@angular/core';

import { HERO_SLIDES as SLIDES, HeroSlide } from './hero-slides';

@Component({
  selector: 'app-hero-slideshow',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@for (layer of layers(); track layer.slot) {
      @if (layer.slide; as slide) {
        <img
          class="hero-slide"
          [attr.data-slot]="layer.slot"
          [attr.data-slide]="slide.id"
          [class.active]="activeSlot() === layer.slot"
          [class.motion]="!reduced()"
          [class.zoom-a]="layer.animationName === 'hero-zoom-a'"
          [class.zoom-b]="layer.animationName === 'hero-zoom-b'"
          [src]="slide.src"
          [srcset]="slide.small + ' 960w, ' + slide.src + ' 1672w'"
          sizes="100vw"
          width="1672"
          height="941"
          alt=""
          aria-hidden="true"
          [style.--hero-position]="slide.position"
          [style.--hero-mobile-position]="slide.mobilePosition"
          [attr.fetchpriority]="slide.id === 'cleaning' ? 'high' : 'auto'"
          [style.animation-play-state]="running() ? 'running' : 'paused'"
        />
      }
    }
    <div class="shade"></div>`,
  styles: [
    `
      :host {
        display: block;
        position: absolute;
        inset: 0;
        overflow: hidden;
        background: #344746;
      }
      .hero-slide {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: var(--hero-position);
        opacity: 0;
        transition: opacity 1100ms ease-in-out;
        transform: scale(1);
        will-change: opacity, transform;
      }
      .hero-slide.active {
        opacity: 1;
      }
      .hero-slide.motion {
        animation: hero-zoom-a 8200ms ease-in-out forwards;
      }
      .hero-slide.motion.zoom-b {
        animation-name: hero-zoom-b;
      }
      :host-context([dir='rtl']) .hero-slide {
        scale: -1 1;
      }
      .shade {
        position: absolute;
        inset: 0;
        background: linear-gradient(90deg, #091b2166, #091b214d);
      }
      @keyframes hero-zoom-a {
        from {
          transform: scale(1);
        }
        to {
          transform: scale(1.075);
        }
      }
      @keyframes hero-zoom-b {
        from {
          transform: scale(1);
        }
        to {
          transform: scale(1.075);
        }
      }
      @media (max-width: 767px) {
        :host {
          position: relative;
          height: 200px;
        }
        .hero-slide {
          object-position: var(--hero-mobile-position);
        }
        .shade {
          display: none;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .hero-slide {
          transition: none;
          animation: none !important;
        }
      }
    `,
  ],
})
export class HeroSlideshowComponent {
  readonly activeSlideChange = output<HeroSlide>();
  // Slots never reorder. A reused image can restart only while its layer is fully hidden.
  readonly active = signal(SLIDES[0].id);
  readonly activeSlot = signal(0);
  readonly layers = signal<
    { slot: number; slide: (typeof SLIDES)[number] | null; animationName: string }[]
  >([
    { slot: 0, slide: SLIDES[0], animationName: 'hero-zoom-a' },
    { slot: 1, slide: null, animationName: 'hero-zoom-a' },
  ]);
  readonly mounted = () => this.layers().flatMap((layer) => (layer.slide ? [layer.slide] : []));
  readonly reduced = signal(false);
  readonly running = signal(true);
  private readonly destroyRef = inject(DestroyRef);
  private timer: ReturnType<typeof setTimeout> | undefined;
  private preloadTimer: ReturnType<typeof setTimeout> | undefined;
  private index = 0;
  private frame: number | undefined;
  private frameAfterPaint: number | undefined;
  private destroyed = false;
  private pending: HTMLImageElement | undefined;
  constructor() {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const visibility = () => {
      this.running.set(!document.hidden && !media.matches);
      this.schedule();
    };
    const motion = () => {
      this.reduced.set(media.matches);
      visibility();
    };
    document.addEventListener('visibilitychange', visibility);
    media.addEventListener('change', motion);
    motion();
    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
      if (this.frame !== undefined) cancelAnimationFrame(this.frame);
      if (this.frameAfterPaint !== undefined) cancelAnimationFrame(this.frameAfterPaint);
      clearTimeout(this.timer);
      clearTimeout(this.preloadTimer);
      document.removeEventListener('visibilitychange', visibility);
      media.removeEventListener('change', motion);
      if (this.pending) this.pending.onload = null;
    });
  }
  private preloadNext() {
    const slide = SLIDES[(this.index + 1) % SLIDES.length];
    const image = new Image();
    // Match the displayed img's responsive selection, including high-DPR screens.
    image.sizes = '100vw';
    image.srcset = `${slide.small} 960w, ${slide.src} 1672w`;
    image.src = slide.src;
    return image;
  }
  private schedule() {
    clearTimeout(this.timer);
    clearTimeout(this.preloadTimer);
    if (this.destroyed || !this.running()) return;
    this.preloadTimer = setTimeout(() => {
      this.pending = this.preloadNext();
    }, 4800);
    this.timer = setTimeout(() => void this.advance(), 7000);
  }
  private async advance() {
    const next = (this.index + 1) % SLIDES.length;
    const image = this.pending || this.preloadNext();
    try {
      await image.decode();
    } catch {
      this.schedule();
      return;
    }
    if (this.destroyed || !this.running()) return;
    const nextSlot = 1 - this.activeSlot();
    this.layers.update((layers) =>
      layers.map((layer) =>
        layer.slot === nextSlot
          ? {
              ...layer,
              slide: SLIDES[next],
              animationName: layer.animationName === 'hero-zoom-a' ? 'hero-zoom-b' : 'hero-zoom-a',
            }
          : layer,
      ),
    );
    // Paint the decoded incoming image in the hidden slot before fading. The outgoing
    // slot retains its DOM node, animation name, timeline and forwards-filled transform.
    this.frame = requestAnimationFrame(() => {
      this.frameAfterPaint = requestAnimationFrame(() => {
        if (this.destroyed || !this.running()) return;
        this.index = next;
        this.activeSlot.set(nextSlot);
        this.active.set(SLIDES[next].id);
        this.activeSlideChange.emit(SLIDES[next]);
        this.pending = undefined;
        this.schedule();
      });
    });
  }
}
