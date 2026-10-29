import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { LanguageService } from './language.service';

describe('LanguageService (Bilingual RTL/LTR Signal State)', () => {
  let service: LanguageService;
  let doc: Document;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    doc = TestBed.inject(DOCUMENT);
    doc.defaultView?.localStorage?.removeItem('fixmate_preferred_lang');
    service = TestBed.inject(LanguageService);
  });

  it('initializes with Arabic (ar) and RTL direction by default and updates <html> attributes', () => {
    expect(service.lang()).toBe('ar');
    expect(service.dir()).toBe('rtl');
    expect(service.isRtl()).toBe(true);
    expect(doc.documentElement.getAttribute('lang')).toBe('ar');
    expect(doc.documentElement.getAttribute('dir')).toBe('rtl');
  });

  it('switches to English (en) and LTR direction when toggleLanguage() is called', () => {
    service.toggleLanguage();

    expect(service.lang()).toBe('en');
    expect(service.dir()).toBe('ltr');
    expect(service.isRtl()).toBe(false);
    expect(doc.documentElement.getAttribute('lang')).toBe('en');
    expect(doc.documentElement.getAttribute('dir')).toBe('ltr');
    expect(service.t().nav.home).toBe('Home');
  });

  it('switches back to Arabic (ar) and RTL when setLanguage("ar") is called', () => {
    service.setLanguage('en');
    service.setLanguage('ar');

    expect(service.lang()).toBe('ar');
    expect(service.dir()).toBe('rtl');
    expect(doc.documentElement.getAttribute('lang')).toBe('ar');
    expect(doc.documentElement.getAttribute('dir')).toBe('rtl');
    expect(service.t().nav.home).toBe('الرئيسية');
  });
});
