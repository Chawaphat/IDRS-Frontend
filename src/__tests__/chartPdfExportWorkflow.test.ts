import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSectionSaveStore } from '@/store/sectionSaveStore';
import { pdfExportService } from '@/services/pdfExportService';
import { prepareChartPdfAssets } from '@/components/pdf/chartPdfAssets';
import { prepareSavedChartPdf } from '@/components/pdf/chartPdfExportWorkflow';

vi.mock('@/services/pdfExportService', () => ({ pdfExportService: { getChartExportData: vi.fn() } }));
vi.mock('@/components/pdf/chartPdfAssets', () => ({ prepareChartPdfAssets: vi.fn() }));

beforeEach(() => {
  vi.clearAllMocks();
  useSectionSaveStore.setState({ sections: {} });
});

describe('saved PDF snapshot', () => {
  it('waits for changed sections before fetching the data and preparing assets', async () => {
    let finishSave!: () => void;
    let persisted = 'old value';
    const save = vi.fn(async () => {
      await new Promise<void>((resolve) => { finishSave = resolve; });
      persisted = 'new value';
    });
    const cleanSave = vi.fn();
    useSectionSaveStore.setState({ sections: { dirty: { isDirty: true, save }, clean: { isDirty: false, save: cleanSave } } });
    vi.mocked(pdfExportService.getChartExportData).mockImplementation(async () => ({ patient: { name: persisted } }) as never);
    vi.mocked(prepareChartPdfAssets).mockResolvedValue({ warnings: [] } as never);
    const pending = prepareSavedChartPdf('chart');
    expect(pdfExportService.getChartExportData).not.toHaveBeenCalled();
    finishSave();
    const result = await pending;
    expect(result.data.patient.name).toBe('new value');
    expect(cleanSave).not.toHaveBeenCalled();
    expect(prepareChartPdfAssets).toHaveBeenCalledWith(result.data, 'chart');
  });

  it('waits for other saves to settle and stops export if any save fails', async () => {
    let finishSave!: () => void;
    useSectionSaveStore.setState({ sections: {
      failed: { isDirty: true, save: vi.fn().mockRejectedValue(new Error('offline')) },
      slow: { isDirty: true, save: () => new Promise<void>((resolve) => { finishSave = resolve; }) },
    } });
    const pending = prepareSavedChartPdf('chart');
    const assertion = expect(pending).rejects.toThrow('Changes could not be saved');
    finishSave();
    await assertion;
    expect(pdfExportService.getChartExportData).not.toHaveBeenCalled();
    expect(prepareChartPdfAssets).not.toHaveBeenCalled();
  });
});
