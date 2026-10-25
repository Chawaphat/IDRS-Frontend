import { useSectionSaveStore } from '@/store/sectionSaveStore';
import { pdfExportService } from '@/services/pdfExportService';
import { prepareChartPdfAssets } from './chartPdfAssets';

/** Finish every pending save before reading the persisted chart snapshot. */
export async function prepareSavedChartPdf(chartId: string) {
  const dirty = Object.values(useSectionSaveStore.getState().sections).filter((section) => section.isDirty);
  const saved = await Promise.allSettled(dirty.map((section) => section.save()));
  if (saved.some((result) => result.status === 'rejected')) {
    throw new Error('Changes could not be saved. PDF export stopped. Please try again.');
  }
  const data = await pdfExportService.getChartExportData(chartId);
  const assets = await prepareChartPdfAssets(data, chartId);
  return { data, assets };
}

export type PreparedChartPdf = Awaited<ReturnType<typeof prepareSavedChartPdf>>;
