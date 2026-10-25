import api from "@/lib/api";
import type { AIDetectResult } from "@/lib/aiDetection";

const AI_ANALYSES_CHANGED_EVENT = "idrs:chart-ai-analyses-changed";
const analysisRequests = new Map<string, Promise<AIDetectionAnalysis[]>>();

export interface AIDetectionAnalysis {
  analysis_id: string;
  image_id: string;
  model_name: string;
  model_version: string;
  detection_data: AIDetectResult;
}

function notifyAiAnalysesChanged(
  chartId: string,
  analysis: AIDetectionAnalysis,
) {
  analysisRequests.delete(chartId);
  window.dispatchEvent(
    new CustomEvent(AI_ANALYSES_CHANGED_EVENT, {
      detail: { chartId, analysis },
    }),
  );
}

export function onChartAiAnalysesChanged(
  chartId: string,
  callback: (analysis: AIDetectionAnalysis) => void,
): () => void {
  const handler = (event: Event) => {
    const detail = (
      event as CustomEvent<{
        chartId: string;
        analysis: AIDetectionAnalysis;
      }>
    ).detail;
    if (detail?.chartId === chartId && detail.analysis) callback(detail.analysis);
  };
  window.addEventListener(AI_ANALYSES_CHANGED_EVENT, handler);
  return () => window.removeEventListener(AI_ANALYSES_CHANGED_EVENT, handler);
}

export const aiDetectionResultService = {
  /** All AI analyses run for panoramic X-rays in this chart (in practice: 0 or 1, since a chart holds one panoramic X-ray). */
  getByChart: (chartId: string, options?: { fresh?: boolean; timeout?: number }): Promise<AIDetectionAnalysis[]> => {
    // Exports need the current persisted result rather than a prior gallery snapshot.
    if (options?.fresh) {
      return api.get<AIDetectionAnalysis[]>(`/dental-charts/${chartId}/ai-detection-results`, { timeout: options.timeout })
        .then((response) => response.data);
    }
    const cached = analysisRequests.get(chartId);
    if (cached) return cached;

    const request = api
      .get<AIDetectionAnalysis[]>(`/dental-charts/${chartId}/ai-detection-results`)
      .then((response) => response.data)
      .catch((error) => {
        analysisRequests.delete(chartId);
        throw error;
      });
    analysisRequests.set(chartId, request);
    return request;
  },

  /** Runs YOLOv8x + SEUNet on the given panoramic X-ray image and persists the result. */
  detect: async (chartId: string, imageId: string): Promise<AIDetectionAnalysis> => {
    const response = await api.post<AIDetectionAnalysis>(`/dental-charts/${chartId}/ai-detection-results`, {
      image_id: imageId,
    });
    notifyAiAnalysesChanged(chartId, response.data);
    return response.data;
  },
};
