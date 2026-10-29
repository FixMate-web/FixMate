import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageService } from '../../core/i18n/language.service';
import { FmEmptyStateComponent } from '../../shared/ui';

@Component({
  selector: 'app-not-found-page',
  standalone: true,
  imports: [RouterLink, FmEmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fm-container" style="padding-block: 3rem;">
      <app-fm-empty-state
        icon="404"
        [title]="i18n.t().shells.notFoundTitle"
        [description]="i18n.t().shells.notFoundDesc"
      >
        <a routerLink="/">{{ i18n.t().shells.returnHome }}</a>
      </app-fm-empty-state>
    </div>
  `,
})
export class NotFoundPageComponent {
  readonly i18n = inject(LanguageService);
}
