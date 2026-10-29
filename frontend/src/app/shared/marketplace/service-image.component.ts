import { DISCOVERY_IMAGES } from './discovery-catalog.store';
import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
const CATEGORIES = new Set([
  'plumbing',
  'electrical-repairs',
  'ac-maintenance',
  'cleaning',
  'painting',
  'carpentry',
]);
@Component({
  selector: 'app-service-image',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<img
    [src]="discoveryImage() || source() + '-960.webp'"
    [srcset]="discoveryImage() ? '' : source() + '-480.webp 480w, ' + source() + '-960.webp 960w'"
    [sizes]="sizes()"
    [style.object-position]="focalPosition()"
    [alt]="alt()"
    width="960"
    height="640"
    [loading]="priority() ? 'eager' : 'lazy'"
    [attr.fetchpriority]="priority() ? 'high' : 'auto'"
    (error)="failed.set(true)"
  />`,
  styles: [
    `
      :host {
        display: block;
        overflow: hidden;
        background: #edf0ec;
      }
      img {
        display: block;
        width: 100%;
        height: 100%;
        aspect-ratio: 3/2;
        object-fit: cover;
        transition: transform 0.25s;
      }
      :host:hover img {
        transform: scale(1.025);
      }
    `,
  ],
})
export class ServiceImageComponent {
  readonly serviceSlug = input('');
  readonly discoveryImage = computed(() =>
    !this.failed() ? DISCOVERY_IMAGES.get(this.serviceSlug())?.image : undefined,
  );
  readonly focalPosition = computed(() => DISCOVERY_IMAGES.get(this.serviceSlug())?.position || 'center');
  readonly category = input('');
  readonly alt = input('');
  readonly priority = input(false);
  readonly sizes = input('(max-width:600px) 100vw, (max-width:1000px) 50vw, 33vw');
  readonly failed = signal(false);
  readonly source = computed(() =>
    !this.failed() && CATEGORIES.has(this.category())
      ? '/images/categories/' + this.category()
      : '/images/hero/home',
  );
}
