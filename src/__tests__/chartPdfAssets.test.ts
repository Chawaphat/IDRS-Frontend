import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { prepareChartPdfAssets } from '@/components/pdf/chartPdfAssets';
import { aiDetectionResultService } from '@/services/aiDetectionResultService';
import type { ChartExportData } from '@/services/pdfExportService';

vi.mock('@/components/chart/dentalStatusMapper', () => ({ dentalStatusToOdontogramSnapshot: () => null }));
vi.mock('@/components/odontogram/odontogram', () => ({ renderOdontogramTeethSvgs: async () => [] }));
vi.mock('@/components/pdf/chartPdfOptions', () => ({ PDF_OPTION_GROUPS: [], PDF_REFERENCE_IMAGES: [] }));
vi.mock('@/services/aiDetectionResultService', () => ({ aiDetectionResultService: { getByChart: vi.fn() } }));

let failImages = false;
class FakeImage {
  naturalWidth = 100;
  naturalHeight = 100;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  set src(_value: string) { queueMicrotask(() => failImages ? this.onerror?.() : this.onload?.()); }
}
const data = { extraoral_exam: null, dental_status: null, images: [{ image_id: 'photo-1', image_url: 'https://example.test/photo' }] } as unknown as ChartExportData;

beforeEach(() => {
  failImages = false;
  vi.stubGlobal('Image', FakeImage);
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ fillRect() {}, drawImage() {}, translate() {}, scale() {} } as never);
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,prepared');
  vi.mocked(aiDetectionResultService.getByChart).mockResolvedValue([]);
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('PDF asset completeness', () => {
  it('reports unavailable images and failed AI fetches instead of silently declaring success', async () => {
    failImages = true;
    vi.mocked(aiDetectionResultService.getByChart).mockRejectedValue(new Error('offline'));
    const result = await prepareChartPdfAssets(data, 'chart');
    expect(result.warnings).toEqual(expect.arrayContaining([
      expect.stringContaining('Clinical image photo-1'), expect.stringContaining('Saved AI findings'),
    ]));
    expect(result.clinicalImages).toEqual({});
  });

  it('returns prepared images with no warning when no AI analysis has been recorded', async () => {
    const result = await prepareChartPdfAssets(data, 'chart');
    expect(result.warnings).toEqual([]);
    expect(result.clinicalImages['photo-1']).toBe('data:image/png;base64,prepared');
  });

  it('reports an image with a missing URL', async () => {
    const result = await prepareChartPdfAssets({ ...data, images: [{ image_id: 'missing' }] }, 'chart');
    expect(result.warnings).toContain('Clinical image missing: image URL unavailable.');
  });
});
