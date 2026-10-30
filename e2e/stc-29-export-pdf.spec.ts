import { readFile } from 'node:fs/promises';
import { test, expect } from './support/fixtures';

const EXPORT_BUTTON = { name: 'Download PDF' };

test.describe('STC-29 Export Dental Chart as PDF', () => {
  test('TC-01 exports a completed chart', async ({ page, mock }) => {
    const patient = mock.addPatient({ patient_id: 'pat-e2e', hn_number: 'HN-0001' });
    const chart = mock.addChart(patient.patient_id, { chart_id: 'pdf-chart' });
    const history = { chief_complaint: 'Pain', present_illness: 'History', allergy_status: 'no' };
    await page.route('**/dental-charts/pdf-chart/medical-history', (route) => route.fulfill({ json: history }));
    await page.route('**/dental-charts/pdf-chart/export-data', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 600));
      await route.fulfill({ json: { patient, chart, medical_history: history, images: [], occlusal_contacts: [] } });
    });
    await page.goto(`/patients/${patient.patient_id}/charts/${chart.chart_id}`);
    const downloaded = page.waitForEvent('download');
    await page.getByRole('button', EXPORT_BUTTON).click();
    await expect(page.getByText('Creating PDF...')).toBeVisible();
    await expect(page.getByText('Saving chart and preparing PDF...')).toBeVisible();
    const download = await downloaded;
    expect(download.suggestedFilename()).toBe('IDRS-Clinical-Chart-HN-0001.pdf');
    expect((await readFile((await download.path())!)).subarray(0, 4).toString()).toBe('%PDF');
    await expect(page.getByText('Clinical chart PDF downloaded.', { exact: true })).toBeVisible();
  });

  test('TC-02 saves unsaved edits before export', async ({ page, mock }) => {
    const patient = mock.addPatient({ patient_id: 'pat-e2e' });
    const chart = mock.addChart(patient.patient_id, { chart_id: 'pdf-chart' });
    let history: Record<string, unknown> = { chief_complaint: 'Original', present_illness: 'History', allergy_status: 'no' };
    let saved = false;
    await page.route('**/dental-charts/pdf-chart/medical-history', async (route) => {
      if (route.request().method() === 'PUT') { history = route.request().postDataJSON(); saved = true; }
      await route.fulfill({ json: history });
    });
    await page.route('**/dental-charts/pdf-chart/export-data', async (route) => {
      expect(saved).toBe(true);
      await route.fulfill({ json: { patient, chart, medical_history: history, images: [], occlusal_contacts: [] } });
    });
    await page.goto(`/patients/${patient.patient_id}/charts/${chart.chart_id}`);
    await page.locator('#chief_complaint').fill('Edited complaint');
    const downloaded = page.waitForEvent('download');
    await page.getByRole('button', EXPORT_BUTTON).click();
    await downloaded;
    expect(history.chief_complaint).toBe('Edited complaint');
  });

  test('TC-03 stops when saving fails', async ({ page, mock }) => {
    const patient = mock.addPatient({ patient_id: 'pat-e2e' });
    const chart = mock.addChart(patient.patient_id, { chart_id: 'pdf-chart' });
    let downloads = 0;
    page.on('download', () => { downloads++; });
    await page.route('**/dental-charts/pdf-chart/medical-history', (route) => route.request().method() === 'PUT'
      ? route.fulfill({ status: 500, json: { detail: 'Save failed' } })
      : route.fulfill({ json: { chief_complaint: 'Original', present_illness: 'History', allergy_status: 'no' } }));
    await page.goto(`/patients/${patient.patient_id}/charts/${chart.chart_id}`);
    await page.locator('#chief_complaint').fill('Unsaved change');
    await page.getByRole('button', EXPORT_BUTTON).click();
    await expect(page.getByText('Changes could not be saved. PDF export stopped. Please try again.', { exact: true })).toBeVisible();
    expect(downloads).toBe(0);
    await expect(page.getByRole('button', EXPORT_BUTTON)).toBeEnabled();
  });

  test('TC-04 handles unavailable images: Cancel, Retry and partial export', async ({ page, app, mock }) => {
    const patient = mock.addPatient({ patient_id: 'pat-e2e' });
    const chart = mock.addChart(patient.patient_id, { chart_id: 'pdf-chart' });
    let imageAvailable = false;
    let downloads = 0;
    page.on('download', () => { downloads++; });
    await page.route('**/dental-charts/pdf-chart/export-data', (route) => route.fulfill({
      json: { patient, chart, images: imageAvailable ? [] : [{ image_id: 'missing-photo', image_type: 'intraoral' }], occlusal_contacts: [] },
    }));
    await app.openChartImageGallery(chart.chart_id);
    const dialog = page.getByRole('dialog', { name: 'Some content could not be loaded' });
    await page.getByRole('button', EXPORT_BUTTON).click();
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Cancel', exact: true })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Retry', exact: true })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Export available content' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    expect(downloads).toBe(0);

    await page.getByRole('button', EXPORT_BUTTON).click();
    await expect(dialog).toBeVisible();
    imageAvailable = true;
    await dialog.getByRole('button', { name: 'Retry', exact: true }).click();
    await expect(page.getByText('Clinical chart PDF downloaded.', { exact: true })).toBeVisible();
    expect(downloads).toBe(1);

    imageAvailable = false;
    await page.getByRole('button', EXPORT_BUTTON).click();
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Export available content' }).click();
    await expect(page.getByText('Partial PDF downloaded. See Export limitations in the document.', { exact: true })).toBeVisible();
    expect(downloads).toBe(2);
  });

  test('TC-05 reports a retrieval failure without a success message', async ({ page, mock }) => {
    const patient = mock.addPatient({ patient_id: 'pat-e2e' });
    const chart = mock.addChart(patient.patient_id, { chart_id: 'pdf-chart' });
    let downloads = 0;
    page.on('download', () => { downloads++; });
    await page.route('**/dental-charts/pdf-chart/export-data', (route) => route.abort());
    await page.goto(`/patients/${patient.patient_id}/charts/${chart.chart_id}`);
    await page.getByRole('button', EXPORT_BUTTON).click();
    await expect(page.getByText('Could not create the PDF. Please try again.', { exact: true })).toBeVisible();
    await expect(page.getByText('Clinical chart PDF downloaded.')).toHaveCount(0);
    expect(downloads).toBe(0);
    await expect(page.getByRole('button', EXPORT_BUTTON)).toBeEnabled();
  });
});
