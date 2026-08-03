import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '@/services/authService';

// ── Mock supabase ────────────────────────────────────────────────────────────
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}));

// ── Mock api ─────────────────────────────────────────────────────────────────
vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

import { supabase } from '@/lib/supabase';
import api from '@/lib/api';

const mockSignInWithPassword = vi.mocked(supabase.auth.signInWithPassword);
const mockSignUp = vi.mocked(supabase.auth.signUp);
const mockSignInWithOAuth = vi.mocked(supabase.auth.signInWithOAuth);
const mockSignOut = vi.mocked(supabase.auth.signOut);
const mockApiPost = vi.mocked(api.post);

// ─────────────────────────────────────────────────────────────────────────────
// UTC-01 : Sign In with Email & Password
// ─────────────────────────────────────────────────────────────────────────────
describe('UTC-01: authService.signIn', () => {
  const mockUser = { id: 'user-1', email: 'test@test.com' };
  const mockSession = { access_token: 'token', user: mockUser };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // UTC-01-TC-01
  it('TC-01: returns session data on valid credentials', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { user: mockUser, session: mockSession },
      error: null,
    } as never);

    const result = await authService.signIn('test@test.com', 'password123');

    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'test@test.com',
      password: 'password123',
    });
    expect(result).toEqual({ user: mockUser, session: mockSession });
  });

  // UTC-01-TC-02
  it('TC-02: throws "Invalid email or password" on invalid credentials', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials' },
    } as never);

    await expect(authService.signIn('wrong@test.com', 'wrongpass')).rejects.toThrow(
      'Invalid email or password',
    );
  });

  // UTC-01-TC-03
  it('TC-03: throws "Network connection error" on fetch failure', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: 'fetch failed' },
    } as never);

    await expect(authService.signIn('test@test.com', 'pass123')).rejects.toThrow(
      'Network connection error',
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UTC-02 : Sign Up (Register)
// ─────────────────────────────────────────────────────────────────────────────
describe('UTC-02: authService.signUp', () => {
  const mockUser = { id: 'user-2', email: 'new@test.com' };
  const mockSession = { access_token: 'token', user: mockUser };
  const mockProfile = { id: 'user-2', full_name: 'John Doe', license_id: null, phone: null, role: null };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // UTC-02-TC-01
  it('TC-01: registers profile immediately when session is available', async () => {
    mockSignUp.mockResolvedValueOnce({
      data: { user: mockUser, session: mockSession },
      error: null,
    } as never);
    mockApiPost.mockResolvedValueOnce({ data: mockProfile } as never);

    const result = await authService.signUp('new@test.com', 'pass123', 'John', 'Doe');

    expect(mockSignUp).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'new@test.com',
        options: expect.objectContaining({
          data: expect.objectContaining({ full_name: 'John Doe' }),
        }),
      }),
    );
    expect(mockApiPost).toHaveBeenCalledWith('/auth/register-profile', { full_name: 'John Doe' });
    expect(mockSignOut).toHaveBeenCalledOnce();
    expect(result).toEqual({ user: mockUser, session: mockSession });
  });

  // UTC-02-TC-02
  it('TC-02: does NOT register profile when session is null', async () => {
    mockSignUp.mockResolvedValueOnce({
      data: { user: mockUser, session: null },
      error: null,
    } as never);

    const result = await authService.signUp('new@test.com', 'pass123', 'John', 'Doe');

    expect(mockSignUp).toHaveBeenCalled();
    expect(mockApiPost).not.toHaveBeenCalled();
    expect(result).toEqual({ user: mockUser, session: null });
  });

  // UTC-02-TC-03
  it('TC-03: throws "Email is already registered" on duplicate email', async () => {
    mockSignUp.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { status: 422, message: 'already registered' },
    } as never);

    await expect(
      authService.signUp('exists@test.com', 'pass123', 'Jane', 'Smith'),
    ).rejects.toThrow('Email is already registered');
  });

  // UTC-02-TC-04
  it('TC-04: throws "Network connection error" on network failure', async () => {
    mockSignUp.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: 'Network request failed' },
    } as never);

    await expect(
      authService.signUp('test@test.com', 'pass123', 'Test', 'User'),
    ).rejects.toThrow('Network connection error');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UTC-03 : Sign In with Google (OAuth)
// ─────────────────────────────────────────────────────────────────────────────
describe('UTC-03: authService.signInWithGoogle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // jsdom sets window.location.origin to 'http://localhost:3000' by default
    Object.defineProperty(window, 'location', {
      value: { origin: 'http://localhost:5173' },
      writable: true,
    });
  });

  // UTC-03-TC-01
  it('TC-01: initiates OAuth redirect with correct redirectTo URL', async () => {
    const mockData = { provider: 'google', url: 'https://accounts.google.com/...' };
    mockSignInWithOAuth.mockResolvedValueOnce({
      data: mockData,
      error: null,
    } as never);

    const result = await authService.signInWithGoogle();

    expect(mockSignInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:5173/auth/login',
      },
    });
    expect(result).toEqual(mockData);
  });

  // UTC-03-TC-02
  it('TC-02: throws "Network connection error" on fetch failure', async () => {
    mockSignInWithOAuth.mockResolvedValueOnce({
      data: null,
      error: { message: 'fetch failed' },
    } as never);

    await expect(authService.signInWithGoogle()).rejects.toThrow('Network connection error');
  });

  // UTC-03-TC-03
  it('TC-03: re-throws original Supabase error on non-network OAuth failure', async () => {
    const originalError = new Error('OAuth provider unavailable');
    mockSignInWithOAuth.mockResolvedValueOnce({
      data: null,
      error: originalError,
    } as never);

    await expect(authService.signInWithGoogle()).rejects.toThrow('OAuth provider unavailable');
    await expect(authService.signInWithGoogle()).rejects.not.toThrow('Network connection error');
  });

  // UTC-03-TC-03b
  it('TC-03b: does NOT wrap non-network errors as "Network connection error"', async () => {
    const originalError = new Error('OAuth provider unavailable');
    mockSignInWithOAuth.mockResolvedValueOnce({
      data: null,
      error: originalError,
    } as never);

    const err = await authService.signInWithGoogle().catch((e: Error) => e);
    expect(err).toBeInstanceOf(Error);
    expect((err as Error).message).toBe('OAuth provider unavailable');
    expect((err as Error).message).not.toBe('Network connection error');
  });
});
