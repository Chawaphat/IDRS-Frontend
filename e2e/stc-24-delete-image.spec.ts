import { test, expect } from './support/fixtures';
import type { MockBackend } from './support/mockBackend';

/**
 * STC-24 — Delete Image (UC-24)
 *
 * Verifies the confirmation dialog, that the record + its storage file are
 * removed, that a linked AI detection result is cascade-deleted, that the
 * gallery refreshes with a success toast, and that cancellation / metadata
 * failure / storage-cleanup failure are each handled.
 */

const PATIENT_ID = 'pat-e2e';
const CHART_ID = 'chart-a';

function seedChartWithImages(mock: MockBackend) {
  mock.addPatient({ patient_id: PATIENT_ID });
  mock.addChart(PATIENT_ID, { chart_id: CHART_ID });
  const intraoral = mock.addImage(CHART_ID, { image_type: 'intraoral', description: 'Intraoral A' });
  const pano = mock.addImage(CHART_ID, { image_type: 'panoramic_xray', description: 'Pano X-ray' });
  mock.addAnalysis(pano.image_id);
  return { intraoral, pano };
}

const deleteDialog = (page: import('@playwright/test').Page) =>
  page.getByRole('heading', { name: 'Delete Image' }).locator('xpath=ancestor::div[contains(@class,"max-w-sm")]');

const intraoralTile = (page: import('@playwright/test').Page, name: string) =>
  page.getByRole('img', { name }).locator('xpath=ancestor::div[contains(@class,"group")]');

test.describe('STC-24 Delete Image', () => {
  test('STC-24-TC-01 — delete an image successfully', async ({ page, app, mock }) => {
    seedChartWithImages(mock);
    await app.openChartImageGallery(CHART_ID, PATIENT_ID);

    const tile = intraoralTile(page, 'Intraoral A');
    await tile.hover();
    await tile.getByRole('button', { name: 'Delete' }).click();

    await expect(deleteDialog(page)).toBeVisible();
    await deleteDialog(page).getByRole('button', { name: 'Delete' }).click();

    await expect(app.toast('Image deleted successfully.')).toBeVisible();
    await expect(page.getByRole('img', { name: 'Intraoral A' })).toBeHidden();
    expect(mock.imageCount([CHART_ID], 'intraoral')).toBe(0);
  });

  test('STC-24-TC-02 — delete the panoramic X-ray with a saved AI result', async ({ page, app, mock }) => {
    seedChartWithImages(mock);
    await app.openChartImageGallery(CHART_ID, PATIENT_ID);
    await page.getByRole('button', { name: /^Panoramic X-ray/ }).click();

    // The AI Detection Viewer is on screen while the analysed X-ray exists.
    await expect(page.getByText('AI Analyzed').first()).toBeVisible();

    await page.locator('button.border-rose-200').first().click();
    await deleteDialog(page).getByRole('button', { name: 'Delete' }).click();

    await expect(app.toast('Image deleted successfully.')).toBeVisible();
    await expect(page.getByText('No panoramic X-ray yet').first()).toBeVisible();
    await expect(page.getByText('AI Analyzed')).toHaveCount(0);
    expect(mock.imageCount([CHART_ID], 'panoramic_xray')).toBe(0);
    expect(mock.analyses).toHaveLength(0);
  });

  test('STC-24-TC-03 — cancel deletion', async ({ page, app, mock }) => {
    seedChartWithImages(mock);
    await app.openChartImageGallery(CHART_ID, PATIENT_ID);

    const tile = intraoralTile(page, 'Intraoral A');
    await tile.hover();
    await tile.getByRole('button', { name: 'Delete' }).click();

    await expect(deleteDialog(page)).toBeVisible();
    await deleteDialog(page).getByRole('button', { name: 'Cancel' }).click();

    await expect(deleteDialog(page)).toBeHidden();
    await expect(page.getByRole('img', { name: 'Intraoral A' })).toBeVisible();
    expect(mock.imageCount([CHART_ID], 'intraoral')).toBe(1);
  });

  test('STC-24-TC-04 — metadata deletion fails', async ({ page, app, mock }) => {
    seedChartWithImages(mock);
    mock.fail.imageDelete = true;
    await app.openChartImageGallery(CHART_ID, PATIENT_ID);

    const tile = intraoralTile(page, 'Intraoral A');
    await tile.hover();
    await tile.getByRole('button', { name: 'Delete' }).click();
    await deleteDialog(page).getByRole('button', { name: 'Delete' }).click();

    await expect(app.toast('Failed to delete image.')).toBeVisible();
    await expect(page.getByRole('img', { name: 'Intraoral A' })).toBeVisible();
    expect(mock.imageCount([CHART_ID], 'intraoral')).toBe(1);
  });

  test('STC-24-TC-05 — storage file cleanup fails', async ({ page, app, mock }) => {
    seedChartWithImages(mock);
    mock.fail.storageRemove = true;
    await app.openChartImageGallery(CHART_ID, PATIENT_ID);

    const tile = intraoralTile(page, 'Intraoral A');
    await tile.hover();
    await tile.getByRole('button', { name: 'Delete' }).click();
    await deleteDialog(page).getByRole('button', { name: 'Delete' }).click();

    await expect(app.toast("Image removed, but its file couldn't be fully deleted from storage.")).toBeVisible();
    await expect(page.getByRole('img', { name: 'Intraoral A' })).toBeHidden();
    expect(mock.imageCount([CHART_ID], 'intraoral')).toBe(0);
  });
});
