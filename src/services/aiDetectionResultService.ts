import api from "@/lib/api";
import type { AIDetectResult } from "@/lib/aiDetection";

export interface AIDetectionAnalysis {
  analysis_id: string;
  image_id: string;
  model_name: string;
  model_version: string;
  detection_data: AIDetectResult;
}

export const aiDetectionResultService = {
  /** All AI analyses run for panoramic X-rays in this chart (in practice: 0 or 1, since a chart holds one panoramic X-ray). */
  getByChart: async (chartId: string): Promise<AIDetectionAnalysis[]> => {
    const response = await api.get<AIDetectionAnalysis[]>(`/dental-charts/${chartId}/ai-detection-results`);
    return response.data;
  },

  /** Runs YOLOv8x + SEUNet on the given panoramic X-ray image and persists the result. */
  detect: async (chartId: string, imageId: string): Promise<AIDetectionAnalysis> => {
    const response = await api.post<AIDetectionAnalysis>(`/dental-charts/${chartId}/ai-detection-results`, {
      image_id: imageId,
    });
    return response.data;
  },
};
