import api from '@/lib/api';

export interface UserProfile {
  id: string;
  full_name?: string | null;
  license_id?: string | null;
  phone?: string | null;
  role?: string | null;
}

export const profileService = {
  getMe: async (): Promise<UserProfile> => {
    const response = await api.get<UserProfile>('/profiles/me');
    return response.data;
  },

  update: async (
    id: string,
    payload: {
      full_name: string;
      license_id: string;
      phone: string;
    }
  ): Promise<UserProfile> => {
    const response = await api.put<UserProfile>(`/profiles/${id}`, payload);
    return response.data;
  },
};
