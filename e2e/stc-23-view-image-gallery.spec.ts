import { test, expect } from './support/fixtures';
import { validImage } from './support/files';
import type { MockBackend } from './support/mockBackend';

/**
 * STC-23 — View Image Gallery (UC-23)
 *
 * Verifies that a chart's images are fetched and shown by category with a
 * per-category count, that category selection filters, that a thumbnail opens
 * full-size, that empty / fetch-error states are handled, and that the same
 * images are viewable read-only from the Dental Status "Image References" panel
 * (which stays in sync after an upload elsewhere).
 */

const PATIENT_ID = 'pat-e2e';
const CHART_ID = 'chart-a';
const imgFileInput = 'input[accept=".jpg,.jpeg,.png,.webp"]';

function seedGallery(mock: MockBackend) {
  mock.addPatient({ patient_id: PATIENT_ID });
  mock.addChart(PATIENT_ID, { chart_id: CHART_ID });
  mock.addImage(CHART_ID, { image_type: 'intraoral', description: 'Intraoral A' });
  mock.addImage(CHART_ID, { image_type: 'intraoral', description: 'Intraoral B' });
  mock.addImage(CHART_ID, { image_type: 'panoramic_xray', description: 'Pano X-ray' });
}

const referencesPanel = (page: import('@playwright/test').Page) =>
  page.locator('div.border-t:has(p:text-is("Image References"))');

test.describe('STC-23 View Image Gallery', () => {
  test('STC-23-TC-01 — view gallery with images and per-category counts', async ({ page, app, mock }) => {
    seedGallery(mock);
    await app.openChartImageGallery(CHART_ID, PATIENT_ID);

    // Default category = Intraoral, both intraoral images shown.
    await expect(page.getByRole('img', { name: 'Intraoral A' })).toBeVisible();
    await expect(page.getByRole('img', { name: 'Intraoral B' })).toBeVisible();

    // Counts on the category tabs.
    await expect(page.getByRole('button', { name: /^Intraoral/ })).toContainText('2');
    await expect(page.getByRole('button', { name: /^Panoramic X-ray/ })).toContainText('1');
    await expect(page.getByText('2 Intraoral', { exact: false })).toBeVisible();
  });

  test('STC-23-TC-02 — filter by category', async ({ page, app, mock }) => {
    seedGallery(mock);
    await app.openChartImageGallery(CHART_ID, PATIENT_ID);

    await page.getByRole('button', { name: /^Panoramic X-ray/ }).click();

    await expect(page.getByRole('img', { name: 'Pano X-ray' })).toBeVisible();
    await expect(page.getByRole('img', { name: 'Intraoral A' })).toBeHidden();
  });

  test('STC-23-TC-03 — open an image full-size and close it', async ({ page, app, mock }) => {
    seedGallery(mock);
    await app.openChartImageGallery(CHART_ID, PATIENT_ID);

    await page.getByRole('img', { name: 'Intraoral A' }).click();

    const preview = page.getByRole('img', { name: 'Preview' });
    await expect(preview).toBeVisible();

    // The Image Gallery zoom overlay closes only via its (icon-only) close button.
    await preview.locator('xpath=ancestor::div[1]').getByRole('button').first().click();
    await expect(preview).toBeHidden();
  });

  test('STC-23-TC-04 — empty category state', async ({ page, app, mock }) => {
    seedGallery(mock);
    await app.openChartImageGallery(CHART_ID, PATIENT_ID);

    await page.getByRole('button', { name: /^Other/ }).click();
    await expect(page.getByText('No Other images yet')).toBeVisible();
  });

  test('STC-23-TC-05 — image fetch fails on the Image Gallery tab', async ({ page, app, mock }) => {
    seedGallery(mock);
    mock.fail.imagesGet = true;
    await app.openChartImageGallery(CHART_ID, PATIENT_ID);

    await expect(app.toast(/Failed to load images:/)).toBeVisible();
    await expect(page.getByText('No Intraoral images yet')).toBeVisible();
  });

  test('STC-23-TC-06 — view the same images from the Image References panel', async ({ page, mock }) => {
    seedGallery(mock);
    await page.goto(`/patients/${PATIENT_ID}/charts/${CHART_ID}`);
    await page.getByRole('complementary').getByRole('button', { name: /Dental Status/ }).click();

    const panel = referencesPanel(page);
    await expect(panel.getByText('Image References')).toBeVisible();
    await expect(panel.getByRole('button', { name: /^All\s+\d+$/ })).toBeVisible();
    await expect(panel.getByRole('button', { name: /^Intraoral\s+\d+$/ })).toContainText('2');
    await expect(panel.getByRole('button', { name: /^Panoramic X-Ray\s+\d+$/ })).toContainText('1');
  });

  test('STC-23-TC-07 — image fetch fails on the Image References panel', async ({ page, mock }) => {
    seedGallery(mock);
    mock.fail.imagesGet = true;
    await page.goto(`/patients/${PATIENT_ID}/charts/${CHART_ID}`);
    await page.getByRole('complementary').getByRole('button', { name: /Dental Status/ }).click();

    await expect(
      referencesPanel(page).getByText("Couldn't load this chart's images — try switching tabs and back to retry."),
    ).toBeVisible();
  });

  test('STC-23-TC-08 — live sync after an upload elsewhere', async ({ page, app, mock }) => {
    mock.addPatient({ patient_id: PATIENT_ID });
    mock.addChart(PATIENT_ID, { chart_id: CHART_ID });
    mock.addImage(CHART_ID, { image_type: 'intraoral', description: 'Existing intraoral' });

    await app.openChartImageGallery(CHART_ID, PATIENT_ID);
    await page.locator(imgFileInput).setInputFiles(validImage());
    await expect(app.toast('Image uploaded successfully!')).toBeVisible();

    // Switch to Dental Status — the panel reflects the new image without a reload.
    await page.getByRole('complementary').getByRole('button', { name: /Dental Status/ }).click();
    await expect(referencesPanel(page).getByRole('button', { name: /^Intraoral\s+\d+$/ })).toContainText('2');
  });
});
