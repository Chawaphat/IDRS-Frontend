import api from "@/lib/api";

export interface AIDetection {
  disease: string;
  confidence: number;
  bbox: [number, number, number, number];
  tooth_fdi: number | null;
}

export interface AITooth {
  tooth_fdi: number;
  bbox: [number, number, number, number];
  diseases: { disease: string; confidence: number }[];
  is_healthy: boolean;
}

export interface AIDetectionData {
  image: string;
  image_size: { width: number; height: number };
  detections: AIDetection[];
  teeth: AITooth[];
}

export interface AIDetectionAnalysis {
  analysis_id: string;
  image_id: string;
  model_name: string;
  model_version: string;
  created_at?: string;
  detection_data: AIDetectionData;
}

export const aiDetectionService = {
  /**
   * Run AI detection on a panoramic X-ray that was just uploaded (or re-run
   * on an existing one). Backend validates image_type === panoramic_xray.
   */
  create: async (chartId: string, imageId: string): Promise<AIDetectionAnalysis> => {
    const response = await api.post<AIDetectionAnalysis>(
      `/dental-charts/${chartId}/ai-detection-results`,
      { image_id: imageId },
    );
    return response.data;
  },

  /**
   * All AI detection analyses for every image on this chart.
   */
  getByChart: async (chartId: string): Promise<AIDetectionAnalysis[]> => {
    const response = await api.get<AIDetectionAnalysis[]>(
      `/dental-charts/${chartId}/ai-detection-results`,
    );
    return response.data;
  },
};
