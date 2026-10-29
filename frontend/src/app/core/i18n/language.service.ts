import { DOCUMENT } from '@angular/common';
import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AppLanguage, TextDirection, TRANSLATIONS, UiDictionary } from './translations';

const STORAGE_KEY = 'fixmate_preferred_lang';

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  private readonly document = inject(DOCUMENT);

  private readonly activeLanguage = signal<AppLanguage>(this.resolveInitialLanguage());

  /** Current active language ('ar' | 'en') */
  readonly lang = this.activeLanguage.asReadonly();

  /** Current layout direction ('rtl' for Arabic, 'ltr' for English) */
  readonly dir = computed<TextDirection>(() => (this.activeLanguage() === 'ar' ? 'rtl' : 'ltr'));

  /** Convenience boolean signal for RTL checks */
  readonly isRtl = computed<boolean>(() => this.dir() === 'rtl');

  /** Active localized UI dictionary */
  readonly t = computed<UiDictionary>(() => TRANSLATIONS[this.activeLanguage()]);

  constructor() {
    this.applyDocumentAttributes(this.activeLanguage(), this.dir());

    effect(() => {
      const currentLang = this.activeLanguage();
      const currentDir = this.dir();
      this.applyDocumentAttributes(currentLang, currentDir);
    });
  }

  setLanguage(lang: AppLanguage): void {
    this.activeLanguage.set(lang);
    this.persistLanguage(lang);
    this.applyDocumentAttributes(lang, lang === 'ar' ? 'rtl' : 'ltr');
  }

  toggleLanguage(): void {
    const next: AppLanguage = this.activeLanguage() === 'ar' ? 'en' : 'ar';
    this.setLanguage(next);
  }

  private resolveInitialLanguage(): AppLanguage {
    try {
      const win = this.document.defaultView;
      const stored = win?.localStorage?.getItem(STORAGE_KEY);
      if (stored === 'ar' || stored === 'en') {
        return stored;
      }
    } catch {
      // Ignore storage access errors in restricted/headless environments
    }
    return environment.defaultLanguage;
  }

  private persistLanguage(lang: AppLanguage): void {
    try {
      this.document.defaultView?.localStorage?.setItem(STORAGE_KEY, lang);
    } catch {
      // Ignore storage errors
    }
  }

  private applyDocumentAttributes(lang: AppLanguage, dir: TextDirection): void {
    const htmlElement = this.document.documentElement;
    if (htmlElement) {
      htmlElement.setAttribute('lang', lang);
      htmlElement.setAttribute('dir', dir);
    }
  }
}
