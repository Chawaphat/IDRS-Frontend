import api from '@/lib/api';

export interface BackendPatient {
  patient_id: string;
  hn_number: string;
  name: string;
  age?: number | null;
  sex?: string | null;
  phone?: string | null;
  allergy?: string | null;
  chief_complaint?: string | null;
  last_visit?: string | null;
  status?: string | null;
  created_at?: string;
}

export const patientService = {
  getAll: async (skip = 0, limit = 100): Promise<BackendPatient[]> => {
    const response = await api.get<BackendPatient[]>('/patients', {
      params: { skip, limit },
    });
    return response.data;
  },

  search: async (query: string, skip = 0, limit = 100): Promise<BackendPatient[]> => {
    const response = await api.get<BackendPatient[]>('/patients/search', {
      params: { query, skip, limit }
    });
    return response.data;
  },

  getById: async (id: string): Promise<BackendPatient> => {
    const response = await api.get<BackendPatient>(`/patients/${id}`);
    return response.data;
  },

  create: async (payload: {
    name: string;
    age: number | null;
    sex: string;
    hn_number: string;
    phone: string | null;
    allergy?: string | null;
  }): Promise<BackendPatient> => {
    const response = await api.post<BackendPatient>('/patients', payload);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/patients/${id}`);
  },

  update: async (id: string, payload: {
    name: string;
    age: number | null;
    sex: string;
    hn_number: string;
    phone: string | null;
    allergy?: string | null;
  }): Promise<BackendPatient> => {
    const response = await api.put<BackendPatient>(`/patients/${id}`, payload);
    return response.data;
  },

  getChartImages: async (
    chartId: string,
    refreshUrls = false,
  ): Promise<ImageManagement[]> => {
    const response = await api.get<ImageManagement[]>(`/dental-charts/${chartId}/images`, {
      params: refreshUrls ? { refresh_urls: true } : undefined,
    });
    return response.data;
  },

  getPatientImages: async (
    patientId: string,
    refreshUrls = false,
  ): Promise<ImageManagement[]> => {
    const response = await api.get<ImageManagement[]>(`/patients/${patientId}/images`, {
      params: refreshUrls ? { refresh_urls: true } : undefined,
    });
    return response.data;
  },

  getImageById: async (chartId: string, imageId: string): Promise<ImageManagement> => {
    const response = await api.get<ImageManagement>(`/dental-charts/${chartId}/images/${imageId}`);
    return response.data;
  },
};

export interface ImageManagement {
  image_id: string;
  chart_id: string;
  image_type: 'intraoral' | 'panoramic_xray' | 'other';
  image_url?: string;
  image_file?: string;
  description?: string;
  uploaded_at: string;
}

