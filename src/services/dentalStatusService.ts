import api from '@/lib/api';
import type { DentalStatusBulkCreate, DentalStatusResponse } from './types/dentalStatus';

export const dentalStatusService = {
  getByChart: async (chartId: string): Promise<DentalStatusResponse> => {
    const response = await api.get<DentalStatusResponse>(`/dental-charts/${chartId}/dental-status`);
    return response.data;
  },

  update: async (chartId: string, payload: DentalStatusBulkCreate): Promise<DentalStatusResponse> => {
    const response = await api.put<DentalStatusResponse>(`/dental-charts/${chartId}/dental-status`, payload);
    return response.data;
  },

  delete: async (statusId: string): Promise<void> => {
    await api.delete('/dental-charts/dental-status', { params: { status_id: statusId } });
  },
};
