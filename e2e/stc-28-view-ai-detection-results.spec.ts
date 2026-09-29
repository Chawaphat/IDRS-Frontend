import { test, expect } from './support/fixtures';
import { SAMPLE_DETECTION_DATA } from './support/mockBackend';
import type { MockBackend } from './support/mockBackend';

/**
 * STC-28 — View AI Detection Results (UC-28)
 *
 * Verifies the full interactive viewer in the Image Gallery (box overlay,
 * findings list, tap-through Tooth Chart with per-tooth crop + zoom), the
 * static toggleable box overlay in the Image References panel while
 * charting, the auto-following AI Suggestion panel, and that crop-generation
 * / load failures are handled.
 *
 * SAMPLE_DETECTION_DATA: FDI 38 diseased (Impacted), FDI 11 healthy
 * segmented. FDI 21 is deliberately absent from `teeth` — used as the
 * "model did not segment this tooth" case.
 */

const PATIENT_ID = 'pat-e2e';
const CHART_ID = 'chart-a';

const referencesPanel = (page: import('@playwright/test').Page) =>
  page.locator('div.border-t:has(p:text-is("Image References"))');

function seedChartWithResult(mock: MockBackend) {
  mock.addPatient({ patient_id: PATIENT_ID });
  mock.addChart(PATIENT_ID, { chart_id: CHART_ID });
  const pano = mock.addImage(CHART_ID, { image_type: 'panoramic_xray', description: 'Pano X-ray' });
  mock.addAnalysis(pano.image_id, { detection_data: SAMPLE_DETECTION_DATA });
  return pano;
}

test.describe('STC-28 View AI Detection Results', () => {
  test('STC-28-TC-01 — viewer auto-expands with the saved result', async ({ page, app, mock }) => {
    seedChartWithResult(mock);
    await app.openChartImageGallery(CHART_ID, PATIENT_ID);
    await page.getByRole('button', { name: /^Panoramic X-ray/ }).click();

    await expect(page.getByRole('heading', { name: 'Detected Regions' })).toBeVisible();
    await expect(page.getByText('Findings')).toBeVisible();
    await expect(page.getByText('Tooth Chart')).toBeVisible();
    // Auto-selects the first diseased tooth (FDI 38), not the healthy one.
    await expect(page.locator('span.text-2xl', { hasText: 'FDI 38' })).toBeVisible();
    await expect(page.getByRole('img', { name: 'Tooth FDI 38' })).toBeVisible();
  });

  test('STC-28-TC-02 — select a tooth from any control', async ({ page, app, mock }) => {
    seedChartWithResult(mock);
    await app.openChartImageGallery(CHART_ID, PATIENT_ID);
    await page.getByRole('button', { name: /^Panoramic X-ray/ }).click();

    // Tooth Chart chip for the healthy tooth (FDI 11).
    await page.getByRole('button', { name: '11', exact: true }).click();
    await expect(page.locator('span.text-2xl', { hasText: 'FDI 11' })).toBeVisible();
    await expect(page.getByText('Healthy')).toBeVisible();

    // Findings-list row switches selection back to the diseased tooth (FDI 38).
    await page.getByRole('button', { name: /Impacted/ }).click();
    await expect(page.locator('span.text-2xl', { hasText: 'FDI 38' })).toBeVisible();
  });

  test('STC-28-TC-03 — zoom a tooth crop', async ({ page, app, mock }) => {
    seedChartWithResult(mock);
    await app.openChartImageGallery(CHART_ID, PATIENT_ID);
    await page.getByRole('button', { name: /^Panoramic X-ray/ }).click();

    await page.getByRole('img', { name: 'Tooth FDI 38' }).click();
    const zoomed = page.getByRole('img', { name: 'Zoomed tooth crop' });
    await expect(zoomed).toBeVisible();

    // Close via Escape.
    await page.keyboard.press('Escape');
    await expect(zoomed).toBeHidden();

    // Re-open, close via clicking outside the image.
    await page.getByRole('img', { name: 'Tooth FDI 38' }).click();
    await expect(zoomed).toBeVisible();
    await page.mouse.click(5, 5);
    await expect(zoomed).toBeHidden();

    // Re-open, close via the close button.
    await page.getByRole('img', { name: 'Tooth FDI 38' }).click();
    await expect(zoomed).toBeVisible();
    await zoomed.locator('xpath=preceding-sibling::button[1]').click();
    await expect(zoomed).toBeHidden();
  });

  test('STC-28-TC-04 — crop generation fails', async ({ page, app, mock }) => {
    seedChartWithResult(mock);
    // Force cropToothImage()'s canvas.toDataURL() to throw, simulating a real
    // crop-generation failure (e.g. a tainted canvas) without depending on real
    // image pixels. Scoped to toDataURL (not getContext) so it doesn't also
    // break the Lottie loading animation, which keeps a canvas alive via
    // getContext on every frame.
    await page.addInitScript(() => {
      window.HTMLCanvasElement.prototype.toDataURL = () => {
        throw new Error('mock: canvas.toDataURL failure (crop generation)');
      };
    });

    await app.openChartImageGallery(CHART_ID, PATIENT_ID);
    await page.getByRole('button', { name: /^Panoramic X-ray/ }).click();

    await expect(page.getByText("Couldn't generate this crop")).toBeVisible();

    // Selecting a different tooth continues normally (still shows the same failure state,
    // proving the component didn't get stuck — not a permanent error screen).
    await page.getByRole('button', { name: '11', exact: true }).click();
    await expect(page.locator('span.text-2xl', { hasText: 'FDI 11' })).toBeVisible();
    await expect(page.getByText("Couldn't generate this crop")).toBeVisible();
  });

  test('STC-28-TC-05 — static box overlay in the Image References panel', async ({ page, app, mock }) => {
    seedChartWithResult(mock);
    await app.openDentalStatus(CHART_ID, PATIENT_ID);

    const panel = referencesPanel(page);
    const toggle = panel.getByRole('button', { name: /Hide boxes|Show boxes/ });
    // Boxes are shown by default (showAIBoxes defaults to true in code).
    await expect(toggle).toHaveText(/Hide boxes/);
    await expect(panel.getByText('38', { exact: true })).toBeVisible();
    // No crop / selection / findings list in this read-only panel.
    await expect(panel.getByText('Findings')).toHaveCount(0);

    await toggle.click();
    await expect(toggle).toHaveText(/Show boxes/);
    await expect(panel.getByText('38', { exact: true })).toBeHidden();

    await toggle.click();
    await expect(toggle).toHaveText(/Hide boxes/);
    await expect(panel.getByText('38', { exact: true })).toBeVisible();
  });

  test('STC-28-TC-06 — auto-following AI Suggestion panel', async ({ page, app, mock }) => {
    seedChartWithResult(mock);
    await app.openDentalStatus(CHART_ID, PATIENT_ID);

    // Diseased tooth.
    await app.selectTooth(38);
    await expect(page.getByText('Impacted')).toBeVisible();

    // Healthy segmented tooth.
    await app.selectTooth(11);
    await expect(page.getByText('No issues detected on this tooth')).toBeVisible();

    // A tooth the model did not segment at all (absent from SAMPLE_DETECTION_DATA.teeth).
    await app.selectTooth(21);
    await expect(page.getByText('Possibly missing')).toBeVisible();
  });

  test('STC-28-TC-07 — AI Suggestion panel load failure', async ({ page, app, mock }) => {
    seedChartWithResult(mock);
    mock.fail.imagesGet = true;
    await app.openDentalStatus(CHART_ID, PATIENT_ID);
    await app.selectTooth(38);

    await expect(page.getByText("Couldn't load the AI suggestion")).toBeVisible();
    await expect(page.getByText('No panoramic X-ray uploaded yet')).toBeHidden();
  });
});
