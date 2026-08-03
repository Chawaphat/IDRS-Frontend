import api from '@/lib/api';

export interface ResidualRidgeAssessmentPayload {
  ridge_height?: string | null;
  ridge_width?: string | null;
  jaw_size?: string | null;
  ridge_shape_upper?: string | null;
  ridge_shape_lower?: string | null;
  ridge_relation?: string | null;
  ridge_parallelism?: string | null;
  interridge_space?: string | null;
  lower_arch_form?: string | null;
  palatal_vault?: string | null;
  palatal_throat_form?: string | null;
  freenum_attachment?: Record<string, unknown> | unknown[] | null;
  ridge_deformity?: Record<string, unknown> | unknown[] | null;
  torus_palatinus?: Record<string, unknown> | unknown[] | null;
  tongue_size?: string | null;
  tongue_position?: string | null;
  saliva_amount?: string | null;
  saliva_consistency?: string | null;
  lip_mobility?: string | null;
  facial_muscle_tone?: string | null;
  mental_attitude?: string | null;
  note?: string | null;
}

export interface ResidualRidgeAssessment extends ResidualRidgeAssessmentPayload {
  assessment_id: string;
  chart_id: string;
  created_at?: string;
  updated_at?: string;
}

export const residualRidgeAssessmentService = {
  get: async (chartId: string): Promise<ResidualRidgeAssessment | null> => {
    try {
      const response = await api.get<ResidualRidgeAssessment>(`/dental-charts/${chartId}/residual-ridge-assessment`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) return null;
      throw error;
    }
  },

  create: async (chartId: string, payload: ResidualRidgeAssessmentPayload): Promise<ResidualRidgeAssessment> => {
    const response = await api.post<ResidualRidgeAssessment>(`/dental-charts/${chartId}/residual-ridge-assessment`, payload);
    return response.data;
  },

  update: async (chartId: string, payload: ResidualRidgeAssessmentPayload): Promise<Partial<ResidualRidgeAssessment>> => {
    const response = await api.put<Partial<ResidualRidgeAssessment>>(
      `/dental-charts/${chartId}/residual-ridge-assessment`,
      payload,
    );
    return response.data;
  },

  upsert: async (
    chartId: string,
    payload: ResidualRidgeAssessmentPayload,
    _hasExistingRecord?: boolean,
  ): Promise<Partial<ResidualRidgeAssessment>> => {
    return residualRidgeAssessmentService.update(chartId, payload);
  },

  delete: async (chartId: string): Promise<void> => {
    await api.delete(`/dental-charts/${chartId}/residual-ridge-assessment`);
  },
};
