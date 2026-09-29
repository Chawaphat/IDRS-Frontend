import { test, expect } from './support/fixtures';
import type { MockBackend } from './support/mockBackend';

const REDETECT_RESULT = {
  image_size: { width: 800, height: 400 },
  detections: [{ disease: 'Deep Caries', confidence: 0.7, bbox: [40, 40, 120, 160], tooth_fdi: 38 }],
  teeth: [{ tooth_fdi: 38, bbox: [40, 40, 120, 160], diseases: [{ disease: 'Deep Caries', confidence: 0.7 }], is_healthy: false }],
};

/**
 * STC-27 — Run AI Detection on Panoramic X-ray (UC-27)
 *
 * Verifies detection can be triggered from the Image Gallery's "Detect
 * X-ray" / "Re-detect" button (toast + inline expand) or from the AI
 * Suggestion panel while charting (silent update), and that a model
 * failure is handled per trigger.
 *
 * STC-27-TC-06 ("Detection rejected for a non-panoramic image") was
 * retired 2026-09-11 — neither trigger has a reachable UI path when a
 * chart has no panoramic X-ray at all; the rejection stays covered at
 * the unit level (UTC-42-TC-03). See idrs-test-record-f4-f5.md.
 */

const PATIENT_ID = 'pat-e2e';
const CHART_ID = 'chart-a';

function seedChartWithPanoramic(mock: MockBackend, withSavedAnalysis: boolean) {
  mock.addPatient({ patient_id: PATIENT_ID });
  mock.addChart(PATIENT_ID, { chart_id: CHART_ID });
  const pano = mock.addImage(CHART_ID, { image_type: 'panoramic_xray', description: 'Pano X-ray' });
  if (withSavedAnalysis) mock.addAnalysis(pano.image_id);
  return pano;
}

test.describe('STC-27 Run AI Detection on Panoramic X-ray', () => {
  test('STC-27-TC-01 — run detection from the Image Gallery', async ({ page, app, mock }) => {
    seedChartWithPanoramic(mock, false);
    await app.openChartImageGallery(CHART_ID, PATIENT_ID);
    await page.getByRole('button', { name: /^Panoramic X-ray/ }).click();

    await page.getByRole('button', { name: 'Detect X-ray' }).click();

    await expect(app.toast(/AI analysis complete — \d+ finding\(s\) detected/)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Detected Regions' })).toBeVisible();
    expect(mock.analyses).toHaveLength(1);
  });

  test('STC-27-TC-02 — re-detect overwrites the previous result', async ({ page, app, mock }) => {
    // Initial saved result is Impacted @ FDI 38 (SAMPLE_DETECTION_DATA default).
    seedChartWithPanoramic(mock, true);
    await app.openChartImageGallery(CHART_ID, PATIENT_ID);
    await page.getByRole('button', { name: /^Panoramic X-ray/ }).click();
    await expect(page.getByText(/Impacted/).first()).toBeVisible();

    // The backend appends a new AIDetectionAnalysis row rather than overwriting one in
    // place (no upsert — see UTC-42) — what "replaces" means at the UI level is that the
    // viewer shows only the *latest* result for that image, which this asserts.
    mock.nextAnalysisData = REDETECT_RESULT;
    await expect(page.getByRole('button', { name: 'Re-detect' })).toBeVisible();
    await page.getByRole('button', { name: 'Re-detect' }).click();

    await expect(app.toast('AI analysis complete — 1 finding(s) detected')).toBeVisible();
    await expect(page.getByText(/Deep Caries/).first()).toBeVisible();
    await expect(page.getByText(/Impacted/)).toHaveCount(0);
    expect(mock.analyses).toHaveLength(2);
  });

  test('STC-27-TC-03 — run detection from the AI Suggestion panel', async ({ page, app, mock }) => {
    seedChartWithPanoramic(mock, false);
    await app.openDentalStatus(CHART_ID, PATIENT_ID);
    await app.selectTooth(38);

    const runButton = page.getByRole('button', { name: 'Run AI Detection' });
    await expect(runButton).toBeVisible();
    await runButton.click();

    // Silent update: no toast, and the panel now shows the tooth's finding instead of the offer button.
    await expect(runButton).toBeHidden();
    await expect(page.getByText(/Impacted|No issues detected on this tooth/)).toBeVisible();
    expect(mock.analyses).toHaveLength(1);
  });

  test('STC-27-TC-04 — detection fails from the Image Gallery', async ({ page, app, mock }) => {
    seedChartWithPanoramic(mock, false);
    mock.fail.aiDetect = true;
    await app.openChartImageGallery(CHART_ID, PATIENT_ID);
    await page.getByRole('button', { name: /^Panoramic X-ray/ }).click();

    await page.getByRole('button', { name: 'Detect X-ray' }).click();

    await expect(app.toast(/AI detection failed:/)).toBeVisible();
    expect(mock.analyses).toHaveLength(0);
  });

  test('STC-27-TC-05 — detection fails from the AI Suggestion panel', async ({ page, app, mock }) => {
    seedChartWithPanoramic(mock, false);
    mock.fail.aiDetect = true;
    await app.openDentalStatus(CHART_ID, PATIENT_ID);
    await app.selectTooth(38);

    const runButton = page.getByRole('button', { name: 'Run AI Detection' });
    await runButton.click();

    await expect(page.getByText('AI detection failed. Please try again.')).toBeVisible();
    await expect(runButton).toBeEnabled();
    expect(mock.analyses).toHaveLength(0);
  });
});
