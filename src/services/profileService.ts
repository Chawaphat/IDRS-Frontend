import api from '@/lib/api';
export type { UserProfile } from '@/services/authService';

export const profileService = {
  getMe: async (): Promise<import('@/services/authService').UserProfile> => {
    const response = await api.get<import('@/services/authService').UserProfile>('/auth/me');
    return response.data;
  },

  update: async (
    id: string,
    payload: {
      full_name: string;
      license_id: string;
      phone: string;
    }
  ): Promise<import('@/services/authService').UserProfile> => {
    const response = await api.put<import('@/services/authService').UserProfile>(`/profiles/${id}`, payload);
    return response.data;
  },
};
