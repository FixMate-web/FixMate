export interface AppEnvironment {
  production: boolean;
  apiBaseUrl: string;
  defaultLanguage: 'ar' | 'en';
  marketTimezone: string;
  currencyCode: 'JOD';
  enableDevShowcase: boolean;
}

export const environment: AppEnvironment = {
  production: false,
  apiBaseUrl: 'http://localhost:3000/api/v1',
  defaultLanguage: 'ar',
  marketTimezone: 'Asia/Amman',
  currencyCode: 'JOD',
  enableDevShowcase: true,
};
