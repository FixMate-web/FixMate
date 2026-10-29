import {
  afterNextRender,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  input,
  signal,
} from '@angular/core';

@Directive({
  selector: '[appReveal]',
  standalone: true,
  host: {
    '[class.fm-reveal]': 'enabled()',
    '[class.fm-reveal-pending]': 'pending()',
    '[style.--fm-reveal-delay]': 'revealDelay() + "ms"',
  },
})
export class ScrollRevealDirective {
  readonly revealDelay = input(0);
  readonly enabled = signal(false);
  readonly pending = signal(false);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  constructor() {
    // Content defaults to visible. Only a successfully configured observer can hide it.
    afterNextRender(() => {
      if (typeof IntersectionObserver === 'undefined' || typeof window.matchMedia !== 'function')
        return;
      const media = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (media.matches) return;
      let observer: IntersectionObserver | undefined;
      const finish = () => {
        this.pending.set(false);
        observer?.disconnect();
      };
      const motionChange = () => {
        if (media.matches) finish();
      };
      try {
        observer = new IntersectionObserver(
          (entries) => {
            if (entries.some((entry) => entry.isIntersecting)) finish();
          },
          { threshold: 0.06, rootMargin: '0px 0px -32px 0px' },
        );
        observer.observe(this.element.nativeElement);
        media.addEventListener('change', motionChange);
        this.enabled.set(true);
        this.pending.set(true);
      } catch {
        finish();
      }
      this.destroyRef.onDestroy(() => {
        observer?.disconnect();
        media.removeEventListener('change', motionChange);
      });
    });
  }
}
