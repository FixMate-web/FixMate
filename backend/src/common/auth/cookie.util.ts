import { Request, Response } from 'express';

export const REFRESH_COOKIE_NAME = 'fixmate_rt';
export const REFRESH_COOKIE_PATH = '/api/v1/auth';

export function extractCookieValue(req: Request, cookieName: string): string | null {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader || typeof cookieHeader !== 'string') {
    return null;
  }

  const pairs = cookieHeader.split(';');
  for (const pair of pairs) {
    const eqIdx = pair.indexOf('=');
    if (eqIdx === -1) continue;
    const key = pair.slice(0, eqIdx).trim();
    if (key === cookieName) {
      const rawValue = pair.slice(eqIdx + 1).trim();
      try {
        return decodeURIComponent(rawValue);
      } catch {
        return rawValue;
      }
    }
  }
  return null;
}

export function setRefreshSessionCookie(
  res: Response,
  cookieValue: string,
  maxAgeMs: number,
  isProduction: boolean,
): void {
  res.cookie(REFRESH_COOKIE_NAME, cookieValue, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: REFRESH_COOKIE_PATH,
    maxAge: maxAgeMs,
  });
}

export function clearRefreshSessionCookie(res: Response, isProduction: boolean): void {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: REFRESH_COOKIE_PATH,
  });
}
