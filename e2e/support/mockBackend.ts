import type { Page, Route, Request } from '@playwright/test';
import { TEST_PROFILE } from './auth';

export type ImageType = 'intraoral' | 'panoramic_xray' | 'other';

export interface MockChart {
  chart_id: string;
  patient_id: string;
  record_date: string;
  created_at: string;
}

export interface MockImage {
  image_id: string;
  chart_id: string;
  image_type: ImageType;
  description: string | null;
  image_url: string;
  image_file: string;
  uploaded_at: string;
}

export interface MockAnalysis {
  analysis_id: string;
  image_id: string;
  model_name: string;
  model_version: string;
  detection_data: unknown;
}

export interface MockPatient {
  patient_id: string;
  hn_number: string;
  name: string;
  age: number;
  sex: string;
  phone: string;
  allergy: string | null;
  last_visit: string | null;
}

// 1x1 transparent PNG — keeps <img> tags from making real network requests.
const PIXEL_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

export const SAMPLE_DETECTION_DATA = {
  image_size: { width: 800, height: 400 },
  detections: [
    { disease: 'Impacted', confidence: 0.92, bbox: [40, 40, 120, 160], tooth_fdi: 38 },
  ],
  teeth: [
    { tooth_fdi: 38, bbox: [40, 40, 120, 160], diseases: [{ disease: 'Impacted', confidence: 0.92 }], is_healthy: false },
    { tooth_fdi: 11, bbox: [400, 40, 460, 180], diseases: [], is_healthy: true },
  ],
};

/** POST /ai-analysis/detect response — same shape, different values, so STC-26's
 * "re-run at a new confidence threshold" TC can assert the result actually changed. */
export const SAMPLE_STANDALONE_RESULT = {
  image_size: { width: 800, height: 400 },
  detections: [
    { disease: 'Caries', confidence: 0.81, bbox: [40, 40, 120, 160], tooth_fdi: 38 },
  ],
  teeth: [
    { tooth_fdi: 38, bbox: [40, 40, 120, 160], diseases: [{ disease: 'Caries', confidence: 0.81 }], is_healthy: false },
    { tooth_fdi: 11, bbox: [400, 40, 460, 180], diseases: [], is_healthy: true },
  ],
};

export const SAMPLE_STANDALONE_RESULT_RERUN = {
  image_size: { width: 800, height: 400 },
  detections: [
    { disease: 'Caries', confidence: 0.81, bbox: [40, 40, 120, 160], tooth_fdi: 38 },
    { disease: 'Deep Caries', confidence: 0.55, bbox: [400, 40, 460, 180], tooth_fdi: 11 },
  ],
  teeth: [
    { tooth_fdi: 38, bbox: [40, 40, 120, 160], diseases: [{ disease: 'Caries', confidence: 0.81 }], is_healthy: false },
    { tooth_fdi: 11, bbox: [400, 40, 460, 180], diseases: [{ disease: 'Deep Caries', confidence: 0.55 }], is_healthy: false },
  ],
};

const CORS_HEADERS: Record<string, string> = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'access-control-allow-headers': '*',
  'access-control-expose-headers': '*',
};

let seq = 0;
const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(seq++).toString(36)}`;

/**
 * In-memory stand-in for the IDRS API + Supabase Storage, wired into a page via
 * `page.route`. State is mutable so an upload/delete performed through the UI is
 * reflected on the next fetch, exactly like the real backend.
 */
export class MockBackend {
  patients: MockPatient[] = [];
  charts: MockChart[] = [];
  images: MockImage[] = [];
  analyses: MockAnalysis[] = [];

  /** GET /dental-charts/:id/images call count — used to assert "no re-fetch". */
  imagesGetCalls = 0;

  // Failure switches — flip these to exercise STC error paths.
  fail = {
    imagesGet: false as boolean | string, // true = all charts, string = that chart_id only
    imageCreate: false,
    imageDelete: false,
    storageUpload: false,
    storageRemove: false,
    aiDetect: false,
    standaloneDetect: false,
  };

  /** POST /ai-analysis/detect call count — used to assert re-run behaviour and "nothing persisted". */
  standaloneDetectCalls = 0;
  /** Result returned by the *next* POST /ai-analysis/detect call; falls back to SAMPLE_STANDALONE_RESULT. */
  nextStandaloneResult: unknown = null;
  /** detection_data for the *next* POST /dental-charts/:id/ai-detection-results call; falls back to SAMPLE_DETECTION_DATA. */
  nextAnalysisData: unknown = null;

  // ---- builders -----------------------------------------------------------

  addPatient(overrides: Partial<MockPatient> = {}): MockPatient {
    const p: MockPatient = {
      patient_id: overrides.patient_id ?? uid('pat'),
      hn_number: overrides.hn_number ?? 'HN-000123',
      name: overrides.name ?? 'Somchai Jaidee',
      age: overrides.age ?? 42,
      sex: overrides.sex ?? 'Male',
      phone: overrides.phone ?? '0812345678',
      allergy: overrides.allergy ?? null,
      last_visit: overrides.last_visit ?? '2026-09-01',
    };
    this.patients.push(p);
    return p;
  }

  addChart(patientId: string, overrides: Partial<MockChart> = {}): MockChart {
    const created = overrides.created_at ?? `2026-0${(this.charts.length % 9) + 1}-01T09:00:00Z`;
    const c: MockChart = {
      chart_id: overrides.chart_id ?? uid('chart'),
      patient_id: patientId,
      record_date: overrides.record_date ?? created.slice(0, 10),
      created_at: created,
    };
    this.charts.push(c);
    return c;
  }

  addImage(chartId: string, overrides: Partial<MockImage> = {}): MockImage {
    const img: MockImage = {
      image_id: overrides.image_id ?? uid('img'),
      chart_id: chartId,
      image_type: overrides.image_type ?? 'intraoral',
      description: overrides.description ?? null,
      image_url: overrides.image_url ?? PIXEL_PNG,
      image_file: overrides.image_file ?? `${uid('file')}.jpg`,
      uploaded_at: overrides.uploaded_at ?? '2026-09-01T10:00:00Z',
    };
    this.images.push(img);
    return img;
  }

  addAnalysis(imageId: string, overrides: Partial<MockAnalysis> = {}): MockAnalysis {
    const a: MockAnalysis = {
      analysis_id: overrides.analysis_id ?? uid('an'),
      image_id: imageId,
      model_name: overrides.model_name ?? 'DentexSegAndDet',
      model_version: overrides.model_version ?? 'v1.0',
      detection_data: overrides.detection_data ?? SAMPLE_DETECTION_DATA,
    };
    this.analyses.push(a);
    return a;
  }

  imageCount(chartIds: string[], type?: ImageType): number {
    return this.images.filter(
      (i) => chartIds.includes(i.chart_id) && (!type || i.image_type === type),
    ).length;
  }

  // ---- wiring -----------------------------------------------------------

  async install(page: Page): Promise<void> {
    // Safety net for any IDRS API path not explicitly modelled below. Registered
    // before the specific handlers so those take precedence (Playwright runs the
    // most-recently-registered matching route first).
    this.on(page, /\/(auth|profiles|patients|dental-charts|ai-analysis)(\/|\?|$)/, (route) =>
      this.json(route, {}),
    );

    // Order matters only where regexes overlap; these do not.
    this.on(page, /\/auth\/me(\?|$)/, (route) => this.json(route, TEST_PROFILE));

    this.on(page, /\/patients\/[^/?#]+\/dental-charts(\?|$)/, (route, req) => {
      const patientId = this.segment(req.url(), /\/patients\/([^/?#]+)\/dental-charts/);
      return this.json(route, this.charts.filter((c) => c.patient_id === patientId));
    });

    this.on(page, /\/patients\/[^/?#]+(\?|$)/, (route, req) => {
      const id = this.segment(req.url(), /\/patients\/([^/?#]+)(?:\?|$)/);
      const patient = this.patients.find((p) => p.patient_id === id) ?? this.patients[0];
      if (!patient) return this.fail_(route, 404, { detail: 'not found' });
      return this.json(route, patient);
    });

    this.on(page, /\/dental-charts\/[^/?#]+\/images\/[^/?#]+(\?|$)/, (route, req) => {
      const method = req.method();
      const imageId = this.segment(req.url(), /\/images\/([^/?#]+)(?:\?|$)/);
      if (method === 'DELETE') {
        if (this.fail.imageDelete) return this.fail_(route, 500, { detail: 'delete failed' });
        this.images = this.images.filter((i) => i.image_id !== imageId);
        this.analyses = this.analyses.filter((a) => a.image_id !== imageId); // cascade
        return route.fulfill({ status: 204, headers: CORS_HEADERS, body: '' });
      }
      if (method === 'PUT') {
        const body = this.body(req);
        const img = this.images.find((i) => i.image_id === imageId);
        if (!img) return this.fail_(route, 404, { detail: 'not found' });
        Object.assign(img, body);
        return this.json(route, img);
      }
      return route.fallback();
    });

    this.on(page, /\/dental-charts\/[^/?#]+\/images(\?|$)/, (route, req) => {
      const chartId = this.segment(req.url(), /\/dental-charts\/([^/?#]+)\/images/);
      const method = req.method();

      if (method === 'GET') {
        this.imagesGetCalls += 1;
        const failAll = this.fail.imagesGet === true;
        const failThis = this.fail.imagesGet === chartId;
        if (failAll || failThis) return this.fail_(route, 500, { detail: 'images fetch failed' });
        return this.json(route, this.images.filter((i) => i.chart_id === chartId));
      }

      if (method === 'POST') {
        if (this.fail.imageCreate) return this.fail_(route, 400, { detail: 'create failed' });
        const body = this.body(req) as Partial<MockImage>;
        const created = this.addImage(chartId, {
          image_type: (body.image_type as ImageType) ?? 'intraoral',
          image_file: body.image_file ?? `${uid('file')}.jpg`,
          description: body.description ?? null,
          uploaded_at: new Date().toISOString(),
        });
        return this.json(route, created, 201);
      }

      return route.fallback();
    });

    this.on(page, /\/dental-charts\/[^/?#]+\/ai-detection-results(\?|$)/, (route, req) => {
      const chartId = this.segment(req.url(), /\/dental-charts\/([^/?#]+)\/ai-detection-results/);
      const chartImageIds = this.images.filter((i) => i.chart_id === chartId).map((i) => i.image_id);
      const method = req.method();

      if (method === 'GET') {
        return this.json(route, this.analyses.filter((a) => chartImageIds.includes(a.image_id)));
      }
      if (method === 'POST') {
        if (this.fail.aiDetect) return this.fail_(route, 500, { detail: 'AI detection failed: model error' });
        const body = this.body(req) as { image_id?: string };
        const imageId = body.image_id ?? chartImageIds[0];
        const overrides = this.nextAnalysisData ? { detection_data: this.nextAnalysisData } : {};
        this.nextAnalysisData = null;
        const created = this.addAnalysis(imageId, overrides);
        return this.json(route, created, 201);
      }
      return route.fallback();
    });

    this.on(page, /\/dental-charts\/[^/?#]+(\?|$)/, (route, req) => {
      const id = this.segment(req.url(), /\/dental-charts\/([^/?#]+)(?:\?|$)/);
      const chart = this.charts.find((c) => c.chart_id === id) ?? this.charts[0];
      if (!chart) return this.fail_(route, 404, { detail: 'not found' });
      return this.json(route, chart);
    });

    // Standalone AI Analysis page — POST /ai-analysis/detect. Ephemeral: never
    // reads or writes `this.images`/`this.analyses`, just like the real endpoint.
    this.on(page, /\/ai-analysis\/detect(\?|$)/, (route, req) => {
      if (req.method() !== 'POST') return route.fallback();
      this.standaloneDetectCalls += 1;
      if (this.fail.standaloneDetect) {
        return this.fail_(route, 500, { detail: 'AI detection failed: model unavailable' });
      }
      const result = this.nextStandaloneResult ?? SAMPLE_STANDALONE_RESULT;
      return this.json(route, result);
    });

    // Supabase Storage — upload (POST) and remove (DELETE).
    this.on(page, /\/storage\/v1\/object\//, (route, req) => {
      const method = req.method();
      if (method === 'DELETE' || method === 'POST') {
        const shouldFail =
          (method === 'POST' && this.fail.storageUpload) ||
          (method === 'DELETE' && this.fail.storageRemove);
        if (shouldFail) {
          return this.fail_(route, 500, { statusCode: '500', error: 'InternalError', message: 'storage unavailable' });
        }
        return this.json(route, method === 'DELETE' ? [] : { Id: uid('obj'), Key: 'Image/mock', path: 'mock' });
      }
      return route.fallback();
    });
  }

  // ---- helpers ---------------------------------------------------------

  /**
   * Registers an API route that only ever consumes XHR/fetch traffic. CORS
   * preflight is answered here; document / script / stylesheet / image requests
   * (e.g. the Vite dev server serving index.html for a deep link) fall straight
   * through untouched.
   */
  private on(
    page: Page,
    matcher: RegExp,
    handler: (route: Route, req: Request) => unknown,
  ): Promise<void> {
    return page.route(matcher, (route, req) => {
      if (req.method() === 'OPTIONS') {
        return route.fulfill({ status: 204, headers: CORS_HEADERS, body: '' });
      }
      if (!['fetch', 'xhr'].includes(req.resourceType())) {
        return route.fallback();
      }
      return handler(route, req);
    });
  }

  private async json(route: Route, data: unknown, status = 200) {
    await route.fulfill({
      status,
      contentType: 'application/json',
      headers: CORS_HEADERS,
      body: JSON.stringify(data),
    });
  }

  private async fail_(route: Route, status: number, body: unknown) {
    await route.fulfill({
      status,
      contentType: 'application/json',
      headers: CORS_HEADERS,
      body: typeof body === 'string' ? body : JSON.stringify(body),
    });
  }

  private segment(url: string, re: RegExp): string {
    const m = url.match(re);
    return m ? decodeURIComponent(m[1]) : '';
  }

  private body(req: Request): Record<string, unknown> {
    try {
      return JSON.parse(req.postData() || '{}');
    } catch {
      return {};
    }
  }
}
