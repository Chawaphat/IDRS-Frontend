import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const session = useAuthStore.getState().session;
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// On 401: try silent token refresh once, then retry original request.
// If refresh fails the user is signed out and redirected to login.
let isRefreshing = false;
let pendingRequests: Array<(token: string) => void> = [];

api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config;
    if (err.response?.status !== 401 || original._retried) {
      return Promise.reject(err);
    }
    original._retried = true;

    if (isRefreshing) {
      return new Promise(resolve => {
        pendingRequests.push((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          resolve(api.request(original));
        });
      });
    }

    isRefreshing = true;
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error || !data.session) throw error ?? new Error('No session');

      const newToken = data.session.access_token;
      useAuthStore.getState().setSession(data.session);
      pendingRequests.forEach(cb => cb(newToken));
      pendingRequests = [];
      original.headers.Authorization = `Bearer ${newToken}`;
      return api.request(original);
    } catch {
      pendingRequests = [];
      useAuthStore.getState().setSession(null);
      window.location.href = '/login';
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
