import api from '@/lib/api';
import type { DentalChart, DentalChartCreatePayload } from './types/dentalChart';

export const dentalChartService = {
  getByPatient: async (patientId: string): Promise<DentalChart[]> => {
    const response = await api.get<DentalChart[]>(`/patients/${patientId}/dental-charts`);
    return response.data;
  },

  getById: async (chartId: string): Promise<DentalChart> => {
    const response = await api.get<DentalChart>(`/dental-charts/${chartId}`);
    return response.data;
  },

  create: async (payload: DentalChartCreatePayload): Promise<DentalChart> => {
    const response = await api.post<DentalChart>('/dental-charts', payload);
    return response.data;
  },

  delete: async (chartId: string): Promise<void> => {
    await api.delete(`/dental-charts/${chartId}`);
  },
};
