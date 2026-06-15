import api from '@/lib/api';

export type OcclusalContactType = 'mip' | 'premature' | 'protrusive' | 'working' | 'non_working';
export type MolarClassType = 'class_i' | 'class_ii' | 'class_iii';
export type LateralDirectionType = 'right' | 'left';

export interface OcclusalContactPayload {
  contact_type: OcclusalContactType;
  upper_tooth: number;
  lower_tooth: number;
}

export interface OcclusalContact extends OcclusalContactPayload {
  contact_id: string;
  occlusal_id: string;
}

export interface OcclusalAnalysisPayload {
  right_molar?: MolarClassType | null;
  left_molar?: MolarClassType | null;
  overlap_horizontal?: number | null;
  overlap_vertical?: number | null;
  anterior_slide?: number | null;
  lateral_slide?: number | null;
  canine_right?: MolarClassType | null;
  canine_left?: MolarClassType | null;
  lateral_direction?: LateralDirectionType | null;
  note?: string | null;
}

export interface OcclusalAnalysisRecord extends OcclusalAnalysisPayload {
  occlusal_id: string;
  chart_id: string;
  contacts: Record<OcclusalContactType, Array<{
    contact_id: string;
    upper_tooth: number;
    lower_tooth: number;
  }>>;
}

export const occlusalAnalysisService = {
  get: async (chartId: string): Promise<OcclusalAnalysisRecord | null> => {
    try {
      const response = await api.get<OcclusalAnalysisRecord>(`/dental-charts/${chartId}/occlusal-analysis`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) return null;
      throw error;
    }
  },

  upsert: async (chartId: string, payload: OcclusalAnalysisPayload) => {
    const response = await api.put(`/dental-charts/${chartId}/occlusal-analysis`, payload);
    return response.data;
  },

  replaceContacts: async (chartId: string, contacts: OcclusalContactPayload[]): Promise<OcclusalContact[]> => {
    const response = await api.put<OcclusalContact[]>(`/dental-charts/${chartId}/occlusal-contacts`, { contacts });
    return response.data;
  },

  delete: async (chartId: string): Promise<void> => {
    await api.delete(`/dental-charts/${chartId}/occlusal-analysis`);
  },
};
