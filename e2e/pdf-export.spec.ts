import { join } from 'node:path';
import { readFile } from 'node:fs/promises';
import { test, expect } from './support/fixtures';

test.describe('PDF export', () => {
  test('saves the current edits before exporting a real PDF', async ({ page, mock }) => {
    const patient = mock.addPatient({ patient_id: 'pat-e2e', name: 'PDF Test Patient' });
    const chart = mock.addChart(patient.patient_id, { chart_id: 'pdf-chart' });
    let history = { chief_complaint: 'Original complaint', present_illness: 'Present illness', allergy_status: 'no' };
    let saved = false;
    await page.route('**/dental-charts/pdf-chart/medical-history', async (route) => {
      if (route.request().method() === 'PUT') { history = route.request().postDataJSON(); saved = true; }
      await route.fulfill({ json: history });
    });
    await page.route('**/dental-charts/pdf-chart/export-data', async (route) => {
      expect(saved).toBe(true);
      expect(history.chief_complaint).toBe('Latest saved complaint');
      await route.fulfill({ json: { patient, chart, medical_history: history, images: [], occlusal_contacts: [] } });
    });
    await page.goto(`/patients/${patient.patient_id}/charts/${chart.chart_id}`);
    await page.locator('#chief_complaint').fill('Latest saved complaint');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download PDF' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
    const file = await readFile((await download.path())!);
    expect(file.subarray(0, 4).toString()).toBe('%PDF');
    expect(file.byteLength).toBeGreaterThan(10_000);
    if (process.env.IDRS_PDF_QA_DIR) await download.saveAs(join(process.env.IDRS_PDF_QA_DIR, 'complete.pdf'));
    await expect(page.getByText('Clinical chart PDF downloaded.', { exact: true })).toBeVisible();
  });

  test('stops before fetching export data if saving fails', async ({ page, mock }) => {
    const patient = mock.addPatient({ patient_id: 'pat-e2e' });
    const chart = mock.addChart(patient.patient_id, { chart_id: 'pdf-chart' });
    let exportCalls = 0;
    await page.route('**/dental-charts/pdf-chart/medical-history', (route) => route.request().method() === 'PUT'
      ? route.fulfill({ status: 500, json: { detail: 'Save failed' } })
      : route.fulfill({ json: { chief_complaint: 'Original', present_illness: 'History', allergy_status: 'no' } }));
    await page.route('**/dental-charts/pdf-chart/export-data', (route) => { exportCalls++; return route.abort(); });
    await page.goto(`/patients/${patient.patient_id}/charts/${chart.chart_id}`);
    await page.locator('#chief_complaint').fill('Unsaved change');
    await page.getByRole('button', { name: 'Download PDF' }).click();
    await expect(page.getByText('Changes could not be saved. PDF export stopped. Please try again.', { exact: true })).toBeVisible();
    expect(exportCalls).toBe(0);
    await expect(page.getByRole('button', { name: 'Download PDF' })).toBeEnabled();
  });

  test('offers retry, cancellation and an explicitly partial download for missing content', async ({ page, app, mock }) => {
    const patient = mock.addPatient({ patient_id: 'pat-e2e' });
    const chart = mock.addChart(patient.patient_id, { chart_id: 'pdf-chart' });
    let fetches = 0;
    let downloads = 0;
    page.on('download', () => { downloads++; });
    await page.route('**/dental-charts/pdf-chart/export-data', (route) => {
      fetches++;
      return route.fulfill({ json: { patient, chart, images: [{ image_id: 'missing-photo', image_type: 'intraoral' }], occlusal_contacts: [] } });
    });
    await app.openChartImageGallery(chart.chart_id);
    await page.getByRole('button', { name: 'Download PDF' }).click();
    const dialog = page.getByRole('dialog', { name: 'Some content could not be loaded' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Clinical image missing-photo: image URL unavailable.')).toBeVisible();
    expect(downloads).toBe(0);
    await dialog.getByRole('button', { name: 'Retry', exact: true }).click();
    await expect(dialog).toBeVisible();
    expect(fetches).toBe(2);
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(dialog).toBeHidden();
    expect(downloads).toBe(0);
    await page.getByRole('button', { name: 'Download PDF' }).click();
    await expect(dialog).toBeVisible();
    const downloaded = page.waitForEvent('download');
    await dialog.getByRole('button', { name: 'Export available content' }).click();
    const file = await readFile((await (await downloaded).path())!);
    expect(file.subarray(0, 4).toString()).toBe('%PDF');
    expect(downloads).toBe(1);
    await expect(page.getByText('Partial PDF downloaded. See Export limitations in the document.', { exact: true })).toBeVisible();
  });
});
