import api from '@/lib/api';
import type { MedicalHistory, MedicalHistoryCreate, MedicalHistoryUpdate } from './types/medicalHistory';

export const medicalHistoryService = {
  getByChart: async (chartId: string): Promise<MedicalHistory> => {
    const response = await api.get<MedicalHistory>(`/dental-charts/${chartId}/medical-history`);
    return response.data;
  },

  create: async (chartId: string, payload: MedicalHistoryCreate): Promise<MedicalHistory> => {
    const response = await api.post<MedicalHistory>(`/dental-charts/${chartId}/medical-history`, payload);
    return response.data;
  },

  update: async (
    chartId: string,
    payload: MedicalHistoryUpdate,
  ): Promise<{ history_id: string; chart_id: string } & Partial<MedicalHistory>> => {
    const response = await api.put<{ history_id: string; chart_id: string } & Partial<MedicalHistory>>(
      `/dental-charts/${chartId}/medical-history`,
      payload,
    );
    return response.data;
  },

  delete: async (chartId: string): Promise<void> => {
    await api.delete(`/dental-charts/${chartId}/medical-history`);
  },
};
