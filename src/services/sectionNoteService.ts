import api from '@/lib/api';
import type { SectionNote } from './types/sectionNote';

export const sectionNoteService = {
  getByChart: async (chartId: string): Promise<SectionNote[]> => {
    const response = await api.get<SectionNote[]>(`/dental-charts/${chartId}/section-notes`);
    return response.data;
  },

  upsert: async (chartId: string, sectionId: string, content: string): Promise<SectionNote> => {
    const response = await api.put<SectionNote>(`/dental-charts/${chartId}/section-notes/${sectionId}`, { content });
    return response.data;
  },

  delete: async (chartId: string, sectionId: string): Promise<void> => {
    await api.delete(`/dental-charts/${chartId}/section-notes/${sectionId}`);
  },
};
