import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock authService ──────────────────────────────────────────────────────────
vi.mock('@/services/authService', () => ({
  authService: {
    signOut: vi.fn(),
    getMe: vi.fn(),
  },
}));

// ── Mock supabase (needed by authStore import) ────────────────────────────────
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  },
}));

import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';

const mockSignOut = vi.mocked(authService.signOut);

const mockUser = { id: 'user-1', email: 'test@test.com' } as never;
const mockSession = { access_token: 'token', user: mockUser } as never;
const mockProfile = { id: 'user-1', full_name: 'Test User', license_id: null, phone: null, role: null } as never;

function seedStore() {
  useAuthStore.setState({
    user: mockUser,
    session: mockSession,
    profile: mockProfile,
    loading: false,
    initialized: true,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// UTC-04 : Sign Out
// ─────────────────────────────────────────────────────────────────────────────
describe('UTC-04: useAuthStore.signOut', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    seedStore();
  });

  // UTC-04-TC-01
  it('TC-01: clears all auth state on successful sign out', async () => {
    mockSignOut.mockResolvedValueOnce(undefined);

    await useAuthStore.getState().signOut();

    expect(mockSignOut).toHaveBeenCalledTimes(1);

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.session).toBeNull();
    expect(state.profile).toBeNull();
    expect(state.loading).toBe(false);
  });

  // UTC-04-TC-02
  it('TC-02: clears state and throws on network error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockSignOut.mockRejectedValueOnce(new Error('fetch failed'));

    await expect(useAuthStore.getState().signOut()).rejects.toThrow(
      'Network connection error. Cannot log out at this time.',
    );

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.session).toBeNull();
    expect(state.profile).toBeNull();
  });
});
