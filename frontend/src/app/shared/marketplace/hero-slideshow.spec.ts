import { TestBed } from '@angular/core/testing';
import { HeroSlideshowComponent } from './hero-slideshow.component';
import { HERO_SLIDES } from './hero-slides';
import { DISCOVERY_TAXONOMY } from './discovery-catalog.store';

describe('Hero slideshow lifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
      setTimeout(() => callback(0), 16),
    );
    vi.stubGlobal('cancelAnimationFrame', (id: number) => clearTimeout(id));
    vi.stubGlobal(
      'Image',
      class {
        src = '';
        decode() {
          return Promise.resolve();
        }
      },
    );
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
  });
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });
  function create(reduced: boolean) {
    vi.stubGlobal('matchMedia', () => ({
      matches: reduced,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    TestBed.configureTestingModule({ imports: [HeroSlideshowComponent] });
    const fixture = TestBed.createComponent(HeroSlideshowComponent);
    fixture.detectChanges();
    return fixture;
  }
  it('loads the first image immediately, changes twice, and pauses when hidden', async () => {
    const fixture = create(false);
    const component = fixture.componentInstance;
    expect(fixture.nativeElement.querySelectorAll('img').length).toBe(1);
    expect(fixture.nativeElement.querySelector('img').getAttribute('fetchpriority')).toBe('high');
    await vi.advanceTimersByTimeAsync(7100);
    expect(component.active()).toBe('plumbing');
    await vi.advanceTimersByTimeAsync(7100);
    expect(component.active()).toBe('electrical');
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
    await vi.advanceTimersByTimeAsync(21000);
    expect(component.active()).toBe('electrical');
    expect(component.running()).toBe(false);
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    document.dispatchEvent(new Event('visibilitychange'));
    await vi.advanceTimersByTimeAsync(7100);
    expect(component.active()).toBe('air-conditioning');
    fixture.destroy();
    await vi.advanceTimersByTimeAsync(21000);
    expect(component.active()).toBe('air-conditioning');
  });
  it('keeps two fixed DOM slots and does not restart the outgoing animation', async () => {
    const fixture = create(false);
    const first = fixture.nativeElement.querySelector('[data-slot="0"]');
    await vi.advanceTimersByTimeAsync(7100);
    fixture.detectChanges();
    const second = fixture.nativeElement.querySelector('[data-slot="1"]');
    const outgoingName = first.classList.contains('zoom-a');
    expect(fixture.nativeElement.querySelector('[data-slot="0"]')).toBe(first);
    await vi.advanceTimersByTimeAsync(500);
    fixture.detectChanges();
    expect(first.classList.contains('zoom-a')).toBe(outgoingName);
    await vi.advanceTimersByTimeAsync(6600);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-slot="0"]')).toBe(first);
    expect(fixture.nativeElement.querySelector('[data-slot="1"]')).toBe(second);
    expect(second.classList.contains('active')).toBe(false);
  });

  it('keeps a static photograph and does not preload when reduced motion is requested', async () => {
    const fixture = create(true);
    await vi.advanceTimersByTimeAsync(30000);
    expect(fixture.componentInstance.active()).toBe('cleaning');
    expect(fixture.componentInstance.mounted().length).toBe(1);
    expect(fixture.componentInstance.running()).toBe(false);
  });
  it('represents seven distinct existing categories with bilingual service metadata', () => {
    expect(HERO_SLIDES).toHaveLength(7);
    expect(new Set(HERO_SLIDES.map((s) => s.src)).size).toBe(7);
    expect(new Set(HERO_SLIDES.map((s) => s.categorySlug)).size).toBe(7);
    for (const slide of HERO_SLIDES) {
      expect(DISCOVERY_TAXONOMY.some((c) => c.slug === slide.categorySlug)).toBe(true);
      expect(slide.caption.en).toBeTruthy();
      expect(slide.caption.ar).toBeTruthy();
      expect(slide.description.en).toBeTruthy();
      expect(slide.description.ar).toBeTruthy();
    }
  });
  it('cycles through all seven scenes, emits their captions, and wraps to the first with two slots', async () => {
    const fixture = create(false);
    const component = fixture.componentInstance;
    const emitted: string[] = [];
    component.activeSlideChange.subscribe((slide) => emitted.push(slide.id));
    for (let n = 1; n <= 7; n++) {
      await vi.advanceTimersByTimeAsync(7100);
      fixture.detectChanges();
      expect(component.active()).toBe(HERO_SLIDES[n % 7].id);
      expect(fixture.nativeElement.querySelectorAll('img')).toHaveLength(2);
      expect(fixture.nativeElement.querySelectorAll('.active')).toHaveLength(1);
    }
    expect(emitted).toEqual([...HERO_SLIDES.slice(1), HERO_SLIDES[0]].map((s) => s.id));
  });
  it('preloads only the upcoming image with the same responsive candidates as the displayed layer', async () => {
    const fixture = create(false);
    const image = vi.spyOn(window, 'Image');
    expect(image).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(4800);
    expect(image).toHaveBeenCalledTimes(1);
    const preload = image.mock.results[0].value;
    expect(preload.src).toBe(HERO_SLIDES[1].src);
    expect(preload.srcset).toBe(`${HERO_SLIDES[1].small} 960w, ${HERO_SLIDES[1].src} 1672w`);
    expect(preload.sizes).toBe('100vw');
    fixture.destroy();
    image.mockRestore();
  });
});
