import { create } from "zustand";
import { aiDetectionService, type AIDetectionAnalysis } from "@/services/aiDetectionService";

// Shared across Image Gallery and Dental Status so a detection that finishes
// on one tab shows up on the other immediately — both components stay
// mounted (just hidden) when the user switches sections, so without a
// shared store the Dental Status copy would only ever see whatever existed
// at its own mount time and need a full page refresh to catch up.
interface AiDetectionState {
  analysesByChart: Record<string, AIDetectionAnalysis[]>;
  loadingCharts: Set<string>;
  fetchForChart: (chartId: string) => Promise<void>;
  addAnalysis: (chartId: string, analysis: AIDetectionAnalysis) => void;
}

export const useAiDetectionStore = create<AiDetectionState>((set, get) => ({
  analysesByChart: {},
  loadingCharts: new Set(),

  fetchForChart: async (chartId) => {
    if (get().loadingCharts.has(chartId)) return;
    set((state) => ({ loadingCharts: new Set(state.loadingCharts).add(chartId) }));
    try {
      const analyses = await aiDetectionService.getByChart(chartId);
      set((state) => ({
        analysesByChart: { ...state.analysesByChart, [chartId]: analyses },
      }));
    } finally {
      set((state) => {
        const next = new Set(state.loadingCharts);
        next.delete(chartId);
        return { loadingCharts: next };
      });
    }
  },

  addAnalysis: (chartId, analysis) =>
    set((state) => ({
      analysesByChart: {
        ...state.analysesByChart,
        [chartId]: [...(state.analysesByChart[chartId] ?? []), analysis],
      },
    })),
}));
