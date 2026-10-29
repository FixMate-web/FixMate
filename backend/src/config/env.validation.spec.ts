import { validateEnvironment } from './env.validation';

describe('validateEnvironment', () => {
  const validBaseEnv = {
    NODE_ENV: 'development',
    PORT: '3000',
    MONGODB_URI: 'mongodb://127.0.0.1:27017/fixmate',
    CORS_ORIGINS: 'http://localhost:4200',
    JWT_ACCESS_SECRET: 'dev-only-jwt-secret-key-at-least-16-chars',
  };

  it('validates a complete and valid configuration object', () => {
    const result = validateEnvironment(validBaseEnv);

    expect(result.NODE_ENV).toBe('development');
    expect(result.PORT).toBe(3000);
    expect(result.MONGODB_URI).toBe('mongodb://127.0.0.1:27017/fixmate');
    expect(result.CORS_ORIGINS).toBe('http://localhost:4200');
    expect(result.JWT_ACCESS_TTL_SECONDS).toBe(900);
    expect(result.REFRESH_SESSION_TTL_DAYS).toBe(7);
  });

  it('fails fast when MONGODB_URI or JWT_ACCESS_SECRET is missing without leaking sensitive values', () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'development',
        PORT: '3000',
        CORS_ORIGINS: 'http://localhost:4200',
      }),
    ).toThrow(/MONGODB_URI/);

    expect(() =>
      validateEnvironment({
        NODE_ENV: 'development',
        PORT: '3000',
        MONGODB_URI: 'mongodb://127.0.0.1:27017/fixmate',
        CORS_ORIGINS: 'http://localhost:4200',
      }),
    ).toThrow(/JWT_ACCESS_SECRET/);
  });

  it('fails when MONGODB_URI has an invalid protocol scheme', () => {
    const fakeSecretUri = 'postgres://secret-user:super-secret-pass@localhost:5432/db';
    try {
      validateEnvironment({
        ...validBaseEnv,
        MONGODB_URI: fakeSecretUri,
      });
      fail('Expected validateEnvironment to throw');
    } catch (error) {
      const message = (error as Error).message;
      expect(message).toContain('MONGODB_URI: must start with mongodb:// or mongodb+srv://');
      expect(message).not.toContain('super-secret-pass');
    }
  });

  it('fails when PORT is out of valid TCP range', () => {
    expect(() =>
      validateEnvironment({
        ...validBaseEnv,
        PORT: '99999',
      }),
    ).toThrow(/PORT/);
  });
});
