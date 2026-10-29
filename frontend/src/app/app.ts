import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth/auth.service';
import { LanguageService } from './core/i18n/language.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  // Eagerly initialize LanguageService so <html lang="..." dir="..."> is set immediately.
  readonly i18n = inject(LanguageService);
  readonly auth = inject(AuthService);

  ngOnInit(): void {
    this.auth.ensureInitialized().subscribe();
  }
}
