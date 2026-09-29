import api from '@/lib/api';

export type PdfExportRecord = Record<string, unknown>;

export interface ChartExportData {
  patient: PdfExportRecord;
  chart: PdfExportRecord;
  medical_history: PdfExportRecord | null;
  extraoral_exam: PdfExportRecord | null;
  esthetic_evaluation: PdfExportRecord | null;
  vdo_evaluation: PdfExportRecord | null;
  residual_ridge_assessment: PdfExportRecord | null;
  occlusal_analysis: PdfExportRecord | null;
  occlusal_contacts: PdfExportRecord[];
  images: PdfExportRecord[];
  dental_status: PdfExportRecord | null;
}

export const pdfExportService = {
  getChartExportData: async (chartId: string): Promise<ChartExportData> => {
    const response = await api.get<ChartExportData>(`/dental-charts/${chartId}/export-data`);
    return response.data;
  },
};