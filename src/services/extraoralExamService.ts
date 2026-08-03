import api from '@/lib/api';
import type { ExtraoralExam, ExtraoralExamCreate, ExtraoralExamUpdate } from './types/extraoralExam';

export const extraoralExamService = {
  getByChart: async (chartId: string): Promise<ExtraoralExam | null> => {
    try {
      const response = await api.get<ExtraoralExam>(`/dental-charts/${chartId}/extraoral-exams`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) return null;
      throw error;
    }
  },

  create: async (chartId: string, data: ExtraoralExamCreate): Promise<ExtraoralExam> => {
    const response = await api.post<ExtraoralExam>(`/dental-charts/${chartId}/extraoral-exams`, data);
    return response.data;
  },

  update: async (chartId: string, data: ExtraoralExamUpdate): Promise<ExtraoralExam> => {
    const response = await api.put<ExtraoralExam>(`/dental-charts/${chartId}/extraoral-exams`, data);
    return response.data;
  },

  delete: async (chartId: string): Promise<void> => {
    await api.delete(`/dental-charts/${chartId}/extraoral-exams`);
  }
};
