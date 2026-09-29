import { test as base, expect, type Page } from '@playwright/test';
import { MockBackend } from './mockBackend';
import { seedAuthSession } from './auth';

interface Fixtures {
  mock: MockBackend;
  app: AppDriver;
}

/** Small navigation helper so specs read like the STC Test Scripts. */
class AppDriver {
  constructor(private page: Page) {}

  async openChartImageGallery(chartId: string, patientId = 'pat-e2e') {
    await this.page.goto(`/patients/${patientId}/charts/${chartId}`);
    await this.page
      .getByRole('complementary')
      .getByRole('button', { name: /Image Gallery/ })
      .click();
    await expect(this.page.getByRole('heading', { name: 'Image Gallery' })).toBeVisible();
  }

  async openAIAnalysisPage() {
    await this.page.goto('/ai-analysis');
    await expect(this.page.getByRole('heading', { name: 'AI Analysis' })).toBeVisible();
  }

  async openDentalStatus(chartId: string, patientId = 'pat-e2e') {
    await this.page.goto(`/patients/${patientId}/charts/${chartId}`);
    await this.page.getByRole('complementary').getByRole('button', { name: /Dental Status/ }).click();
  }

  /** Clicks a tooth tile on the odontogram chart (FDI number) — opens the wizard + AI Suggestion panel for it. */
  async selectTooth(fdi: number) {
    await this.page.locator(`[data-tooth="${fdi}"]`).first().click();
  }

  async openPatientProfile(patientId: string, menu: 'overview' | 'charts' | 'images' = 'overview') {
    await this.page.goto(`/patients/${patientId}`);
    const sidebar = this.page
      .getByRole('complementary')
      .filter({ has: this.page.getByRole('heading', { name: 'Repository Menu' }) });
    await expect(sidebar.getByRole('button', { name: 'Images', exact: true })).toBeVisible();
    if (menu !== 'overview') {
      const label = menu === 'charts' ? 'Clinical Charts' : 'Images';
      await sidebar.getByRole('button', { name: label, exact: true }).click();
    }
  }

  /** A toast with the given text (exact or regex). */
  toast(text: string | RegExp) {
    return this.page.getByText(text);
  }
}

export const test = base.extend<Fixtures>({
  mock: async ({ page }, use) => {
    const mock = new MockBackend();
    await seedAuthSession(page);
    await mock.install(page);
    await use(mock);
  },

  app: async ({ page, mock }, use) => {
    void mock; // ensure auth seed + network mocks are installed first
    await use(new AppDriver(page));
  },
});

export { expect };
