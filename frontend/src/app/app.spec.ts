import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';

describe('App Shell & Routing Foundation', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes), provideHttpClient()],
    }).compileComponents();
  });

  it('creates the root App component and initializes LanguageService', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
    expect(app.i18n.lang()).toBe('ar');
    expect(app.i18n.dir()).toBe('rtl');
  });
});
