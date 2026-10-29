import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ScrollRevealDirective } from './scroll-reveal.directive';
@Component({
  standalone: true,
  imports: [ScrollRevealDirective],
  template: '<p appReveal>Important content</p>',
})
class RevealHost {}

describe('Scroll reveal accessibility and lifetime', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.unstubAllGlobals();
  });
  it('reveals once and releases its observer', async () => {
    let callback: IntersectionObserverCallback = () => {};
    const disconnect = vi.fn();
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(cb: IntersectionObserverCallback) {
          callback = cb;
        }
        observe = vi.fn();
        disconnect = disconnect;
      },
    );
    TestBed.configureTestingModule({ imports: [RevealHost] });
    const f = TestBed.createComponent(RevealHost);
    f.detectChanges();
    await f.whenStable();
    f.detectChanges();
    expect(f.nativeElement.querySelector('p').classList.contains('fm-reveal-pending')).toBe(true);
    callback([{ isIntersecting: true }] as IntersectionObserverEntry[], {} as IntersectionObserver);
    f.detectChanges();
    expect(f.nativeElement.querySelector('p').classList.contains('fm-reveal-pending')).toBe(false);
    callback(
      [{ isIntersecting: false }] as IntersectionObserverEntry[],
      {} as IntersectionObserver,
    );
    f.detectChanges();
    expect(f.nativeElement.querySelector('p').classList.contains('fm-reveal-pending')).toBe(false);
    expect(disconnect).toHaveBeenCalled();
    f.destroy();
  });
  it('keeps content visible when IntersectionObserver is unavailable', async () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    TestBed.configureTestingModule({ imports: [RevealHost] });
    const f = TestBed.createComponent(RevealHost);
    f.detectChanges();
    await f.whenStable();
    f.detectChanges();
    expect(f.nativeElement.querySelector('p').classList.contains('fm-reveal-pending')).toBe(false);
  });
});
