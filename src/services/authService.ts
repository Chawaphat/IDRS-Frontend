/**
 * authService.ts
 * Centralizes all authentication logic:
 *  - Supabase Auth (signIn, signUp, signOut, OAuth)
 *  - Backend profile sync (GET /auth/me, POST /auth/register-profile)
 */

import { supabase } from '@/lib/supabase';
import api from '@/lib/api';

export interface UserProfile {
  id: string;
  full_name: string;
  license_id: string | null;
  phone: string | null;
  role: 'dentist' | 'assistant' | 'admin' | null;
  created_at?: string;
}

export interface RegisterProfilePayload {
  full_name: string;
  license_id?: string | null;
  phone?: string | null;
  role?: 'dentist' | 'assistant' | 'admin';
}

// ─── Backend /auth endpoints ─────────────────────────────────────────────────

export const authService = {
  /**
   * Fetch the current user's profile from the backend.
   * Requires a valid JWT in the Authorization header (handled by api interceptor).
   */
  getMe: async (): Promise<UserProfile> => {
    const response = await api.get<UserProfile>('/auth/me');
    return response.data;
  },

  /**
   * Create a backend profile for the newly signed-up user.
   * Safe to call multiple times — backend returns existing profile if already created.
   */
  registerProfile: async (payload: RegisterProfilePayload): Promise<UserProfile> => {
    const response = await api.post<UserProfile>('/auth/register-profile', payload);
    return response.data;
  },

  /**
   * Update the current user's own profile.
   */
  updateMe: async (payload: Partial<RegisterProfilePayload>): Promise<UserProfile> => {
    const response = await api.put<UserProfile>('/auth/me', payload);
    return response.data;
  },

  // ─── Supabase Auth ─────────────────────────────────────────────────────────

  /**
   * Sign in with email + password via Supabase.
   */
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.includes('fetch') || error.message.includes('Network')) {
        throw new Error('Network connection error');
      }
      if (error.message.toLowerCase().includes('invalid login credentials')) {
        throw new Error('Invalid email or password');
      }
      throw error;
    }
    return data;
  },

  /**
   * Register a new user via Supabase, then immediately create a backend profile.
   */
  signUp: async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ) => {
    const fullName = `${firstName} ${lastName}`.trim();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: firstName, last_name: lastName, full_name: fullName },
      },
    });

    if (error) {
      if (error.message.includes('fetch') || error.message.includes('Network')) {
        throw new Error('Network connection error');
      }
      if (error.message.toLowerCase().includes('already registered') || error.status === 422) {
        throw new Error('Email is already registered');
      }
      throw error;
    }

    // If Supabase confirms the session immediately (no email verification),
    // create the backend profile then sign out so Auth.tsx can show
    // "Registered Successfully" and stay on the Login form (SRS-14/15).
    if (data.session) {
      try {
        await authService.registerProfile({ full_name: fullName });
      } catch {
        // Profile registration is best-effort here.
      }
      await supabase.auth.signOut();
    }

    return data;
  },

  /**
   * Sign in with Google OAuth via Supabase.
   */
  signInWithGoogle: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/auth/login',
      },
    });
    if (error) {
      if (error.message.includes('fetch') || error.message.includes('Network')) {
        throw new Error('Network connection error');
      }
      throw error;
    }
    return data;
  },

  /**
   * Sign out via Supabase. Clears the local session.
   */
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
};
