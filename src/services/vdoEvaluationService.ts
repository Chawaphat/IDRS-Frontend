import api from '@/lib/api';
import type { VdoEvaluation, VdoEvaluationCreate, VdoEvaluationUpdate } from './types/vdoEvaluation';

export const vdoEvaluationService = {
  getByChart: async (chartId: string): Promise<VdoEvaluation> => {
    const response = await api.get<VdoEvaluation>(`/dental-charts/${chartId}/vdo-evaluation`);
    return response.data;
  },

  create: async (chartId: string, payload: VdoEvaluationCreate): Promise<VdoEvaluation> => {
    const response = await api.post<VdoEvaluation>(`/dental-charts/${chartId}/vdo-evaluation`, payload);
    return response.data;
  },

  update: async (
    chartId: string,
    payload: VdoEvaluationUpdate,
  ): Promise<{ vdo_id: string; chart_id: string } & Partial<VdoEvaluation>> => {
    const response = await api.put<{ vdo_id: string; chart_id: string } & Partial<VdoEvaluation>>(
      `/dental-charts/${chartId}/vdo-evaluation`,
      payload,
    );
    return response.data;
  },

  delete: async (chartId: string): Promise<void> => {
    await api.delete(`/dental-charts/${chartId}/vdo-evaluation`);
  },
};
