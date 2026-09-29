import { test, expect } from './support/fixtures';
import type { MockBackend } from './support/mockBackend';

/**
 * STC-25 — View Patient's Images (UC-25)
 *
 * Verifies that a patient's images across every dental chart are viewable as a
 * compact Overview preview widget or as a full filterable Images tab, with a
 * per-category count, that "View all" switches views without re-fetching, and
 * that empty / partial-failure states are handled.
 */

const PATIENT_ID = 'pat-e2e';
const EMPTY_PATIENT_ID = 'pat-empty';

function seedThreeCharts(mock: MockBackend) {
  mock.addPatient({ patient_id: PATIENT_ID, name: 'Somchai Jaidee' });
  mock.addChart(PATIENT_ID, { chart_id: 'chart-a', created_at: '2026-07-01T09:00:00Z' });
  mock.addChart(PATIENT_ID, { chart_id: 'chart-b', created_at: '2026-08-01T09:00:00Z' });
  mock.addChart(PATIENT_ID, { chart_id: 'chart-c', created_at: '2026-09-01T09:00:00Z' });
  mock.addImage('chart-a', { image_type: 'intraoral', description: 'A-intra-1' });
  mock.addImage('chart-a', { image_type: 'intraoral', description: 'A-intra-2' });
  mock.addImage('chart-b', { image_type: 'panoramic_xray', description: 'B-pano' });
  mock.addImage('chart-c', { image_type: 'other', description: 'C-other' });
}

const imagesTab = (page: import('@playwright/test').Page) =>
  page.locator('div.rounded-2xl:has(h3:text-is("X-ray & Photos"))');

const overviewWidget = (page: import('@playwright/test').Page) =>
  page.locator('div.rounded-2xl:has(h3:text-is("Images Overview"))');

const zoomOverlay = (page: import('@playwright/test').Page) => page.locator('div.fixed.inset-0.z-50');

test.describe('STC-25 View Patient’s Images', () => {
  test('STC-25-TC-01 — Overview images preview widget', async ({ page, app, mock }) => {
    seedThreeCharts(mock);
    await app.openPatientProfile(PATIENT_ID, 'overview');

    const widget = overviewWidget(page);
    await expect(widget).toBeVisible();
    await expect(widget.getByRole('button', { name: /^All\s+\d+$/ })).toContainText('4');
    await expect(widget.getByRole('button', { name: /^Intraoral\s+\d+$/ })).toContainText('2');
    await expect(widget.getByRole('button', { name: 'View all' })).toBeVisible();
    await expect(widget.getByRole('img', { name: 'B-pano' })).toBeVisible();
  });

  test('STC-25-TC-02 — view all of a patient’s images with per-category counts', async ({ page, app, mock }) => {
    seedThreeCharts(mock);
    await app.openPatientProfile(PATIENT_ID, 'images');

    const tab = imagesTab(page);
    await expect(tab.getByRole('button', { name: /^All\s+\d+$/ })).toContainText('4');
    await expect(tab.getByRole('button', { name: /^Intraoral\s+\d+$/ })).toContainText('2');
    await expect(tab.getByRole('button', { name: /^Panoramic X-ray\s+\d+$/ })).toContainText('1');
    await expect(tab.getByRole('button', { name: /^Other\s+\d+$/ })).toContainText('1');
    await expect(tab.getByRole('img', { name: 'A-intra-1' })).toBeVisible();
    await expect(tab.getByRole('img', { name: 'B-pano' })).toBeVisible();
    await expect(tab.getByRole('img', { name: 'C-other' })).toBeVisible();
  });

  test('STC-25-TC-03 — filter by category', async ({ page, app, mock }) => {
    seedThreeCharts(mock);
    await app.openPatientProfile(PATIENT_ID, 'images');

    const tab = imagesTab(page);
    await tab.getByRole('button', { name: /^Panoramic X-ray\s+\d+$/ }).click();

    await expect(tab.getByRole('img', { name: 'B-pano' })).toBeVisible();
    await expect(tab.getByRole('img', { name: 'A-intra-1' })).toBeHidden();
    await expect(tab.getByRole('img', { name: 'C-other' })).toBeHidden();
  });

  test('STC-25-TC-04 — "View all" from the Overview widget does not re-fetch', async ({ page, app, mock }) => {
    seedThreeCharts(mock);
    await app.openPatientProfile(PATIENT_ID, 'overview');
    await expect(overviewWidget(page)).toBeVisible();

    const callsBefore = mock.imagesGetCalls;
    await overviewWidget(page).getByRole('button', { name: 'View all' }).click();

    await expect(imagesTab(page)).toBeVisible();
    await expect(page.locator('.animate-pulse')).toHaveCount(0);
    expect(mock.imagesGetCalls).toBe(callsBefore);
  });

  test('STC-25-TC-05 — open an image full-size', async ({ page, app, mock }) => {
    seedThreeCharts(mock);
    await app.openPatientProfile(PATIENT_ID, 'images');

    await imagesTab(page).getByRole('img', { name: 'A-intra-1' }).click();

    const overlay = zoomOverlay(page);
    await expect(overlay.getByRole('img', { name: 'A-intra-1' })).toBeVisible();
    await overlay.getByRole('button').first().click();
    await expect(overlay).toBeHidden();
  });

  test('STC-25-TC-06 — patient has no images', async ({ page, app, mock }) => {
    seedThreeCharts(mock);
    mock.addPatient({ patient_id: EMPTY_PATIENT_ID, name: 'No Images Patient' });
    mock.addChart(EMPTY_PATIENT_ID, { chart_id: 'empty-chart' });

    await app.openPatientProfile(EMPTY_PATIENT_ID, 'images');
    await expect(imagesTab(page).getByText('No images yet')).toBeVisible();
  });

  test('STC-25-TC-07 — one chart’s images fail to load', async ({ page, app, mock }) => {
    seedThreeCharts(mock);
    mock.fail.imagesGet = 'chart-b';
    await app.openPatientProfile(PATIENT_ID, 'images');

    const tab = imagesTab(page);
    await expect(tab.getByText(/Images from 1 visit could not be loaded/)).toBeVisible();
    await expect(tab.getByRole('img', { name: 'A-intra-1' })).toBeVisible();
    await expect(tab.getByRole('img', { name: 'C-other' })).toBeVisible();
    await expect(tab.getByRole('img', { name: 'B-pano' })).toBeHidden();
  });
});
