export interface AppEnvironment {
  production: boolean;
  apiBaseUrl: string;
  defaultLanguage: 'ar' | 'en';
  marketTimezone: string;
  currencyCode: 'JOD';
  enableDevShowcase: boolean;
}

export const environment: AppEnvironment = {
  production: true,
  apiBaseUrl: '/api/v1',
  defaultLanguage: 'ar',
  marketTimezone: 'Asia/Amman',
  currencyCode: 'JOD',
  enableDevShowcase: false,
};
