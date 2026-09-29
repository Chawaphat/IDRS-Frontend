import { test, expect } from './support/fixtures';
import { validImage, validPanoramic, unsupportedFile, oversizedImage } from './support/files';
import type { MockBackend } from './support/mockBackend';

/**
 * STC-22 — Upload Image (UC-22)
 *
 * Verifies upload from the chart Image Gallery and the patient-level Upload
 * Image modal: type/size validation, the success toast + immediate thumbnail,
 * and panoramic-X-ray replacement (confirmation dialog on the gallery, inline
 * warning in the modal).
 */

const PATIENT_ID = 'pat-e2e';

function seedPatientWithChart(mock: MockBackend) {
  mock.addPatient({ patient_id: PATIENT_ID, name: 'Somchai Jaidee' });
  return mock.addChart(PATIENT_ID, { chart_id: 'chart-a', created_at: '2026-09-01T09:00:00Z' });
}

// Both the gallery upload area and the patient-level modal use this exact
// accept list; scoping to it avoids an unrelated hidden <input type=file>
// (the Dental Status status-import control) that also lives on the chart page.
const imgFileInput = 'input[accept=".jpg,.jpeg,.png,.webp"]';

const uploadModal = (page: import('@playwright/test').Page) =>
  page
    .getByRole('heading', { name: 'Upload Image' })
    .locator('xpath=ancestor::div[contains(@class,"max-w-lg")]');

test.describe('STC-22 Upload Image', () => {
  test('STC-22-TC-01 — upload a valid image from the chart Image Gallery', async ({ page, app, mock }) => {
    seedPatientWithChart(mock);
    await app.openChartImageGallery('chart-a', PATIENT_ID);

    // Script 1: Intraoral tab is the default category and shows its empty upload area.
    await expect(page.getByText('No Intraoral images yet')).toBeVisible();

    // Script 2–3: choose the file + description, system validates and uploads.
    await page.getByPlaceholder('Add a description (optional)').fill('Upper arch');
    await page.locator(imgFileInput).setInputFiles(validImage());

    // Script 4: thumbnail appears immediately and the success toast is shown.
    await expect(app.toast('Image uploaded successfully!')).toBeVisible();
    await expect(page.getByText('No Intraoral images yet')).toBeHidden();
    await expect(page.getByRole('img', { name: 'Upper arch' })).toBeVisible();
    expect(mock.imageCount(['chart-a'], 'intraoral')).toBe(1);
  });

  test('STC-22-TC-02 — reject an unsupported file type', async ({ page, app, mock }) => {
    seedPatientWithChart(mock);
    await app.openChartImageGallery('chart-a', PATIENT_ID);

    await page.locator(imgFileInput).setInputFiles(unsupportedFile());

    await expect(app.toast('Invalid file type. Please upload JPG, PNG, or WebP images.')).toBeVisible();
    await expect(page.getByText('No Intraoral images yet')).toBeVisible();
    expect(mock.imageCount(['chart-a'])).toBe(0);
  });

  test('STC-22-TC-03 — reject a file larger than 10 MB', async ({ page, app, mock }) => {
    seedPatientWithChart(mock);
    await app.openChartImageGallery('chart-a', PATIENT_ID);

    await page.locator(imgFileInput).setInputFiles(oversizedImage());

    await expect(app.toast('File size exceeds 10MB limit.')).toBeVisible();
    expect(mock.imageCount(['chart-a'])).toBe(0);
  });

  test('STC-22-TC-04 — replace an existing panoramic X-ray (Image Gallery)', async ({ page, app, mock }) => {
    seedPatientWithChart(mock);
    const pano = mock.addImage('chart-a', { image_type: 'panoramic_xray', description: 'Old pano' });
    mock.addAnalysis(pano.image_id);
    await app.openChartImageGallery('chart-a', PATIENT_ID);

    await page.getByRole('button', { name: 'Panoramic X-ray' }).click();
    await expect(page.getByRole('img', { name: 'Old pano' })).toBeVisible();

    await page.locator(imgFileInput).setInputFiles(validPanoramic());

    // Script 6: replace-confirmation dialog.
    const dialog = page.getByText('Replace Panoramic X-ray?');
    await expect(dialog).toBeVisible();
    await expect(page.getByText(/This will delete the current X-ray and its AI detection result/)).toBeVisible();

    // Script 7: confirm — old X-ray + its analysis are gone, new one uploaded.
    await page.getByRole('button', { name: 'Replace', exact: true }).click();
    await expect(app.toast('Image uploaded successfully!')).toBeVisible();
    expect(mock.imageCount(['chart-a'], 'panoramic_xray')).toBe(1);
    expect(mock.analyses).toHaveLength(0);
    expect(mock.images.some((i) => i.description === 'Old pano')).toBe(false);
  });

  test('STC-22-TC-05 — cancel a panoramic X-ray replacement', async ({ page, app, mock }) => {
    seedPatientWithChart(mock);
    mock.addImage('chart-a', { image_type: 'panoramic_xray', description: 'Keep me' });
    await app.openChartImageGallery('chart-a', PATIENT_ID);

    await page.getByRole('button', { name: 'Panoramic X-ray' }).click();
    await page.locator(imgFileInput).setInputFiles(validPanoramic());

    await expect(page.getByText('Replace Panoramic X-ray?')).toBeVisible();
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();

    await expect(page.getByText('Replace Panoramic X-ray?')).toBeHidden();
    expect(mock.imageCount(['chart-a'], 'panoramic_xray')).toBe(1);
    expect(mock.images[0].description).toBe('Keep me');
  });

  test('STC-22-TC-06 — upload fails after validation passes', async ({ page, app, mock }) => {
    seedPatientWithChart(mock);
    mock.fail.storageUpload = true;
    await app.openChartImageGallery('chart-a', PATIENT_ID);

    await page.locator(imgFileInput).setInputFiles(validImage());

    await expect(app.toast(/Upload failed:/)).toBeVisible();
    await expect(page.getByText('No Intraoral images yet')).toBeVisible();
    expect(mock.imageCount(['chart-a'])).toBe(0);
  });

  test('STC-22-TC-07 — upload from the patient-level Upload Image modal', async ({ page, app, mock }) => {
    seedPatientWithChart(mock);
    await app.openPatientProfile(PATIENT_ID, 'images');

    await page.getByRole('button', { name: 'Upload', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Upload Image' })).toBeVisible();

    const modal = uploadModal(page);
    await modal.getByRole('button', { name: 'Intraoral' }).click();
    await modal.locator(imgFileInput).setInputFiles(validImage());
    await expect(modal.getByText('xray_001.jpg')).toBeVisible();
    await modal.getByRole('button', { name: /^Upload/ }).click();

    await expect(app.toast('Image uploaded successfully!')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Upload Image' })).toBeHidden();
    expect(mock.imageCount(['chart-a'], 'intraoral')).toBe(1);
  });

  test('STC-22-TC-08 — replace a panoramic X-ray from the modal', async ({ page, app, mock }) => {
    seedPatientWithChart(mock);
    const pano = mock.addImage('chart-a', { image_type: 'panoramic_xray', description: 'Old modal pano' });
    mock.addAnalysis(pano.image_id);
    await app.openPatientProfile(PATIENT_ID, 'images');

    await page.getByRole('button', { name: 'Upload', exact: true }).click();
    const modal = uploadModal(page);
    await modal.getByRole('button', { name: 'Panoramic X-ray' }).click();

    // Inline warning — not a separate confirmation dialog.
    await expect(
      modal.getByText('This visit already has a panoramic X-ray. Uploading a new one will replace it and its AI detection result.'),
    ).toBeVisible();

    await modal.locator(imgFileInput).setInputFiles(validPanoramic());
    await modal.getByRole('button', { name: /^Upload/ }).click();

    await expect(app.toast('Image uploaded successfully!')).toBeVisible();
    expect(mock.imageCount(['chart-a'], 'panoramic_xray')).toBe(1);
    expect(mock.analyses).toHaveLength(0);
  });
});
