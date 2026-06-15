import api from '@/lib/api';
import type { VdoEvaluation, VdoEvaluationCreate, VdoEvaluationUpdate } from './types/vdoEvaluation';

export const vdoEvaluationService = {
  getByChart: async (chartId: string): Promise<VdoEvaluation | null> => {
    try {
      const response = await api.get<VdoEvaluation>(`/dental-charts/${chartId}/vdo-evaluation`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) return null;
      throw error;
    }
  },

  create: async (chartId: string, payload: VdoEvaluationCreate): Promise<VdoEvaluation> => {
    const response = await api.post<VdoEvaluation>(`/dental-charts/${chartId}/vdo-evaluation`, payload);
    return response.data;
  },

  // PUT now returns the saved record. Kept loosely typed because callers only
  // await it to confirm success — they re-read state from their own form, not the response.
  update: async (
    chartId: string,
    payload: VdoEvaluationUpdate,
  ): Promise<VdoEvaluation> => {
    const response = await api.put<VdoEvaluation>(
      `/dental-charts/${chartId}/vdo-evaluation`,
      payload,
    );
    return response.data;
  },

  delete: async (chartId: string): Promise<void> => {
    await api.delete(`/dental-charts/${chartId}/vdo-evaluation`);
  },
};
