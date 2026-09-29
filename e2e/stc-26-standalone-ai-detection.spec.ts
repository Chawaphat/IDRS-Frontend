import { test, expect } from './support/fixtures';
import {
  validPanoramicXray,
  differentPanoramicXray,
  unsupportedTextFile,
  oversizedPanoramic,
} from './support/files';
import { SAMPLE_STANDALONE_RESULT, SAMPLE_STANDALONE_RESULT_RERUN } from './support/mockBackend';

/**
 * STC-26 — Run Standalone AI Detection (UC-26)
 *
 * Verifies the standalone AI Analysis page: upload runs detection at the
 * default confidence threshold, the slider re-runs it, per-tooth crop +
 * zoom, "Start over" / "Change X-ray" clear/replace the result, invalid
 * files and model failures are handled, and nothing is persisted.
 */

const imgFileInput = 'input[accept=".jpg,.jpeg,.png,.webp"]';

/** Drags a native <input type=range> to a value the React-controlled way (fill() doesn't work on range inputs). */
async function setRange(locator: ReturnType<import('@playwright/test').Page['locator']>, value: string) {
  await locator.evaluate((el: HTMLInputElement, val: string) => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!;
    setter.call(el, val);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
}

test.describe('STC-26 Run Standalone AI Detection', () => {
  test('STC-26-TC-01 — run detection on a valid upload', async ({ page, app }) => {
    await app.openAIAnalysisPage();
    await page.locator(imgFileInput).setInputFiles(validPanoramicXray());

    await expect(app.toast(`Analysis complete — ${SAMPLE_STANDALONE_RESULT.detections.length} finding(s) detected`)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Detected Regions' })).toBeVisible();
    await expect(page.getByText('Findings')).toBeVisible();
    await expect(page.getByText('Tooth Chart')).toBeVisible();
  });

  test('STC-26-TC-02 — re-run at a new confidence threshold', async ({ page, app, mock }) => {
    mock.nextStandaloneResult = SAMPLE_STANDALONE_RESULT; // first run
    await app.openAIAnalysisPage();
    await page.locator(imgFileInput).setInputFiles(validPanoramicXray());
    await expect(app.toast(`Analysis complete — ${SAMPLE_STANDALONE_RESULT.detections.length} finding(s) detected`)).toBeVisible();

    mock.nextStandaloneResult = SAMPLE_STANDALONE_RESULT_RERUN; // what the re-run returns
    await page.getByRole('button', { name: 'Confidence threshold' }).click();
    await setRange(page.locator('input[type="range"]'), '0.4');

    await expect(
      app.toast(`Analysis complete — ${SAMPLE_STANDALONE_RESULT_RERUN.detections.length} finding(s) detected`),
    ).toBeVisible();
    expect(mock.standaloneDetectCalls).toBe(2);
  });

  test('STC-26-TC-03 — inspect a tooth crop and zoom it', async ({ page, app }) => {
    await app.openAIAnalysisPage();
    await page.locator(imgFileInput).setInputFiles(validPanoramicXray());
    await expect(app.toast(/Analysis complete/)).toBeVisible();

    // The diseased tooth (FDI 38) is auto-selected; its crop is shown in the detail viewer.
    await expect(page.locator('span.text-2xl', { hasText: 'FDI 38' })).toBeVisible();
    await page.getByRole('img', { name: 'Tooth FDI 38' }).click();

    const zoomed = page.getByRole('img', { name: 'Zoomed tooth crop' });
    await expect(zoomed).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(zoomed).toBeHidden();
  });

  test('STC-26-TC-04 — start over', async ({ page, app }) => {
    await app.openAIAnalysisPage();
    await page.locator(imgFileInput).setInputFiles(validPanoramicXray());
    await expect(app.toast(/Analysis complete/)).toBeVisible();

    await page.getByRole('button', { name: 'Start over' }).click();

    await expect(page.getByText(/Drag & drop a panoramic X-ray/)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Detected Regions' })).toBeHidden();
  });

  test('STC-26-TC-05 — change X-ray discards the previous result', async ({ page, app, mock }) => {
    mock.nextStandaloneResult = SAMPLE_STANDALONE_RESULT;
    await app.openAIAnalysisPage();
    await page.locator(imgFileInput).setInputFiles(validPanoramicXray());
    await expect(app.toast(`Analysis complete — ${SAMPLE_STANDALONE_RESULT.detections.length} finding(s) detected`)).toBeVisible();

    mock.nextStandaloneResult = SAMPLE_STANDALONE_RESULT_RERUN;
    await page.getByRole('button', { name: 'Change X-ray' }).click();
    await page.locator(imgFileInput).setInputFiles(differentPanoramicXray());

    await expect(
      app.toast(`Analysis complete — ${SAMPLE_STANDALONE_RESULT_RERUN.detections.length} finding(s) detected`),
    ).toBeVisible();
    expect(mock.standaloneDetectCalls).toBe(2);
  });

  test('STC-26-TC-06 — reject an unsupported file type', async ({ page, app, mock }) => {
    await app.openAIAnalysisPage();
    await page.locator(imgFileInput).setInputFiles(unsupportedTextFile());

    await expect(app.toast('Please upload a JPG, PNG, or WebP image.')).toBeVisible();
    expect(mock.standaloneDetectCalls).toBe(0);
  });

  test('STC-26-TC-07 — reject a file larger than 15 MB', async ({ page, app, mock }) => {
    await app.openAIAnalysisPage();
    await page.locator(imgFileInput).setInputFiles(oversizedPanoramic());

    await expect(app.toast('File size exceeds 15MB limit.')).toBeVisible();
    expect(mock.standaloneDetectCalls).toBe(0);
  });

  test('STC-26-TC-08 — detection fails', async ({ page, app, mock }) => {
    mock.fail.standaloneDetect = true;
    await app.openAIAnalysisPage();
    await page.locator(imgFileInput).setInputFiles(validPanoramicXray());

    await expect(app.toast(/Analysis failed:/)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Detected Regions' })).toBeHidden();
  });

  test('STC-26-TC-09 — nothing is persisted', async ({ page, app }) => {
    await app.openAIAnalysisPage();
    await page.locator(imgFileInput).setInputFiles(validPanoramicXray());
    await expect(app.toast(/Analysis complete/)).toBeVisible();

    await page.goto('/patients');
    await app.openAIAnalysisPage();

    await expect(page.getByText(/Drag & drop a panoramic X-ray/)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Detected Regions' })).toBeHidden();
  });
});
