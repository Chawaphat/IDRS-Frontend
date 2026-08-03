import { create } from 'zustand';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { authService, type UserProfile } from '@/services/authService';

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  initialized: boolean;
  setSession: (session: Session | null) => void;
  fetchProfile: () => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  loading: true,
  initialized: false,

  setSession: (session) => {
    set({
      session,
      user: session?.user ?? null,
      loading: false,
    });
  },

  fetchProfile: async () => {
    try {
      const profile = await authService.getMe();
      set({ profile });
    } catch {
      // Profile may not exist yet (first login) — silently ignore
      set({ profile: null });
    }
  },

  signOut: async () => {
    set({ loading: true });
    try {
      await authService.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      set({ user: null, session: null, profile: null, loading: false });
      throw new Error('Network connection error. Cannot log out at this time.');
    } finally {
      set({ user: null, session: null, profile: null, loading: false });
    }
  },

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      set({
        session,
        user: session?.user ?? null,
        initialized: true,
        loading: false,
      });

      // Fetch profile if session exists
      if (session) {
        get().fetchProfile();
      }

      // Listen for auth state changes and sync profile automatically
      supabase.auth.onAuthStateChange((_event, session) => {
        set({
          session,
          user: session?.user ?? null,
          loading: false,
        });
        if (session) {
          get().fetchProfile();
        } else {
          set({ profile: null });
        }
      });

      // Proactively refresh when tab becomes visible after being idle
      document.addEventListener('visibilitychange', async () => {
        if (document.visibilityState === 'visible') {
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            const expiresAt = data.session.expires_at ?? 0;
            const nowSecs = Math.floor(Date.now() / 1000);
            if (expiresAt - nowSecs < 120) {
              await supabase.auth.refreshSession();
            }
          }
        }
      });
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({ initialized: true, loading: false });
    }
  },
}));
