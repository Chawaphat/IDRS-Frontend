import api from '@/lib/api';

export interface EstheticEvaluationPayload {
  occlusal_plane?: string | null;
  midline_discrepancy?: string | null;
  lip_thickness?: string | null;
  lip_length?: string | null;
  upper_tooth_exposure?: number | null;
  lower_tooth_exposure?: number | null;
  midline_shift?: number | null;
  nasolabial_angle?: string | null;
  dentofacial_analysis?: Record<string, any> | null;
  fv_sound?: boolean | null;
  closest_speaking?: number | null;
  reference_teeth?: number[] | null;
  note?: string | null;
}

export interface EstheticEvaluation extends EstheticEvaluationPayload {
  id: string;
}

export const estheticEvaluationService = {
  get: async (chartId: string) => {
    const response = await api.get(`/dental-charts/${chartId}/esthetic-evaluation`);
    return response.data;
  },

  upsert: async (chartId: string, payload: EstheticEvaluationPayload) => {
    const response = await api.put(`/dental-charts/${chartId}/esthetic-evaluation`, payload);
    return response.data;
  },

  delete: async (chartId: string) => {
    const response = await api.delete(`/dental-charts/${chartId}/esthetic-evaluation`);
    return response.data;
  }
};
