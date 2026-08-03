/* eslint-disable @typescript-eslint/no-explicit-any */
import api from '@/lib/api';
import type { DentalStatusBulkCreate, DentalStatusResponse } from './types/dentalStatus';

export const dentalStatusService = {
  getByChart: async (chartId: string): Promise<DentalStatusResponse | null> => {
    try {
      const response = await api.get<DentalStatusResponse | null>(`/dental-charts/${chartId}/dental-status`);
      return response.data;
    } catch (error: any) {
      if (error?.response?.status === 404) return null;
      throw error;
    }
  },

  update: async (chartId: string, payload: DentalStatusBulkCreate): Promise<DentalStatusResponse> => {
    const response = await api.put<DentalStatusResponse>(`/dental-charts/${chartId}/dental-status`, payload);
    return response.data;
  },

  delete: async (chartId: string, statusId: string): Promise<void> => {
    await api.delete(`/dental-charts/${chartId}/dental-status`, { params: { status_id: statusId } });
  },
};
