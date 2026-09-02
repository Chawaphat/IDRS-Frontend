import api from "@/lib/api";
import type { AIDetectResult } from "@/lib/aiDetection";

export const aiAnalysisService = {
  /**
   * Standalone detection — no chart/patient association, nothing persisted.
   * Used by the AI Analysis tab in the main menu.
   */
  detect: async (file: File, conf = 0.25): Promise<AIDetectResult> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("conf", String(conf));

    const response = await api.post<AIDetectResult>("/ai-analysis/detect", formData, {
      // Let the browser set the multipart boundary itself — override the
      // instance's default 'application/json' by clearing it explicitly.
      headers: { "Content-Type": undefined },
    });
    return response.data;
  },
};
