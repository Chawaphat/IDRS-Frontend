import type { Page } from '@playwright/test';
import { SUPABASE_AUTH_STORAGE_KEY } from './env';

export const TEST_USER = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'e2e.dentist@idrs.test',
};

export const TEST_PROFILE = {
  id: TEST_USER.id,
  full_name: 'Dr. E2E Tester',
  license_id: 'D-99999',
  phone: '0800000000',
  role: 'dentist' as const,
  created_at: '2026-01-01T00:00:00Z',
};

/**
 * Seeds a valid-looking Supabase session into localStorage *before* the app
 * boots. `supabase.auth.getSession()` validates only that the object has
 * `access_token` / `refresh_token` / `expires_at` and that it is not near
 * expiry — with a far-future `expires_at` it returns this session with no
 * network call, so `authStore.initialize()` lands the user as logged in.
 */
export async function seedAuthSession(page: Page): Promise<void> {
  const farFuture = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365; // +1 year

  const session = {
    access_token: 'e2e-fake-access-token',
    refresh_token: 'e2e-fake-refresh-token',
    token_type: 'bearer',
    expires_in: 60 * 60 * 24 * 365,
    expires_at: farFuture,
    user: {
      id: TEST_USER.id,
      aud: 'authenticated',
      role: 'authenticated',
      email: TEST_USER.email,
      app_metadata: { provider: 'email', providers: ['email'] },
      user_metadata: { full_name: TEST_PROFILE.full_name },
      created_at: '2026-01-01T00:00:00Z',
    },
  };

  await page.addInitScript(
    ([key, value]) => {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        /* private-mode / disabled storage — tests that need auth will surface it */
      }
    },
    [SUPABASE_AUTH_STORAGE_KEY, JSON.stringify(session)] as const,
  );
}
