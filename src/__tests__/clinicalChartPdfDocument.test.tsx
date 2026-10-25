// @vitest-environment node
/// <reference types="node" />

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { emptyChartPdfAssets } from '@/components/pdf/chartPdfAssets';
import { renderToBuffer } from '@react-pdf/renderer';
import { Children, isValidElement, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ClinicalChartPdfDocument } from '@/components/ClinicalChartPdfDocument';
import type { ChartPdfAssets } from '@/components/pdf/chartPdfAssets';
import type { ChartExportData } from '@/services/pdfExportService';

vi.mock('@fontsource/noto-sans-thai/files/noto-sans-thai-thai-400-normal.woff', () => ({
  default: `${process.cwd()}/node_modules/@fontsource/noto-sans-thai/files/noto-sans-thai-thai-400-normal.woff`,
}));
vi.mock('@fontsource/noto-sans-thai/files/noto-sans-thai-thai-700-normal.woff', () => ({
  default: `${process.cwd()}/node_modules/@fontsource/noto-sans-thai/files/noto-sans-thai-thai-700-normal.woff`,
}));
vi.mock('@fontsource/noto-sans-thai/files/noto-sans-thai-latin-400-normal.woff', () => ({
  default: `${process.cwd()}/node_modules/@fontsource/noto-sans-thai/files/noto-sans-thai-latin-400-normal.woff`,
}));
vi.mock('@fontsource/noto-sans-thai/files/noto-sans-thai-latin-700-normal.woff', () => ({
  default: `${process.cwd()}/node_modules/@fontsource/noto-sans-thai/files/noto-sans-thai-latin-700-normal.woff`,
}));

function saveQaPdf(name: string, buffer: Buffer) {
  if (!process.env.IDRS_PDF_QA_DIR) return;
  mkdirSync(process.env.IDRS_PDF_QA_DIR, { recursive: true });
  writeFileSync(join(process.env.IDRS_PDF_QA_DIR, name), buffer);
}

const PIXEL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

const fixture: ChartExportData = {
  patient: {
    patient_id: 'patient-1',
    hn_number: 'HN-0001',
    name: 'Clinical Test Patient',
    age: 62,
    sex: 'female',
    phone: '0800000000',
    allergy: 'Penicillin',
  },
  chart: {
    chart_id: 'chart-1',
    record_date: '2026-09-30',
    notes: 'Comprehensive clinical record',
  },
  medical_history: {
    chief_complaint: 'Difficulty chewing',
    present_illness: 'Progressive loss of posterior support',
    medical_history: 'Controlled hypertension',
    regular_doctor_visits: true,
    regular_doctor_months: 6,
    clinic_name: 'University Clinic',
    current_medication: [{ id: 'med-1', name: 'Amlodipine', dose: '5 mg', frequency: 'Once daily', timeOfDay: 'Morning' }],
    allergy_status: 'yes',
    allergy_detail: 'Penicillin',
    dental_history: 'Previous removable partial denture',
    patient_expectation: ['chewing', 'esthetic'],
    patient_self_evaluation: 'Denture is loose during function',
    patient_expected_outcome: 'Improved stability and mastication',
  },
  extraoral_exam: {
    facial_symmetry: 'symmetry',
    facial_profile: 'straight',
    muscle_pain: ['masseter_right'],
    joint_pain: ['function'],
    joint_sound: 'clicking',
    jaw_deviation: 'none',
    has_limited_opening: false,
    mouth_opening_mm: 42,
    parafunctional_habit: ['bruxism'],
    factors_affecting_tooth_wear: { hard_food: true, gerd: false },
  },
  esthetic_evaluation: {
    occlusal_plane: 'parallel',
    midline_discrepancy: 'right_shift',
    midline_shift: 1.5,
    lip_thickness: 'average',
    lip_length: 'average',
    upper_tooth_exposure: 2,
    lower_tooth_exposure: 1,
    nasolabial_angle: 'normal',
    dentofacial_analysis: { smile_line: 'average', buccal_corridor: 'moderate' },
    fv_sound: true,
    closest_speaking: 2,
    reference_teeth: [11, 21],
  },
  vdo_evaluation: {
    facial_soft_tissue: ['nasolabial_fold'],
    closest_speaking: 2,
    free_way_space: 3,
    bite_type: 'normal_bite',
    reference_teeth: [11, 41],
  },
  residual_ridge_assessment: {
    ridge_height: 'high',
    ridge_width: 'round',
    jaw_size: 'medium',
    ridge_shape_upper: 'u_shape',
    ridge_shape_lower: 'u_shape',
    ridge_relation: 'class_i',
    ridge_parallelism: 'parallel',
    interridge_space: 'sufficient',
    lower_arch_form: 'ovoid',
    palatal_vault: 'average',
    palatal_throat_form: 'class_i',
    freenum_attachment: { upper_labial: 'normal' },
    ridge_deformity: { exostosis: false },
    torus_palatinus: { present: false },
    tongue_size: 'medium',
    tongue_position: 'normal',
    saliva_amount: 'normal',
    saliva_consistency: 'thin',
    lip_mobility: 'normal',
    facial_muscle_tone: 'average',
    mental_attitude: 'philosophical',
  },
  occlusal_analysis: {
    right_molar: 'class_i',
    left_molar: 'class_i',
    canine_right: 'class_i',
    canine_left: 'class_i',
    overlap_horizontal: 2,
    overlap_vertical: 2,
    anterior_slide: 1,
    lateral_slide: 0.5,
    lateral_direction: 'right',
    note: 'Stable MIP contacts',
  },
  occlusal_contacts: [
    { contact_id: 'contact-1', contact_type: 'mip', upper_tooth: 16, lower_tooth: 46 },
    { contact_id: 'contact-2', contact_type: 'protrusive', upper_tooth: 11, lower_tooth: 41 },
    { contact_id: 'contact-3', contact_type: 'working', upper_tooth: 26, lower_tooth: 36 },
  ],
  dental_status: {
    status_id: 'status-1',
    teeth: [
      {
        tooth_number: 16,
        tooth_type: 'permanent',
        caries: [{ surface: 'O', depth: 'dentine', note: 'Active lesion' }],
        fillings: [{ surfaces: ['M', 'O'], material: 'composite', size_mm: 3 }],
        periodontal: { mobility_grade: 'M1', recession_mm: 1 },
        vitality: { pulp_status: 'vital', ept_result: 'positive', root_canal_treated: 'no' },
        restorations: { restoration_type: 'crown', material: 'zirconia' },
      },
      {
        tooth_number: 36,
        tooth_type: 'implant',
        implant: { component_type: 'crown', retention_type: 'screw_retained', brand: 'Test Implant' },
      },
      {
        tooth_number: 47,
        tooth_type: 'permanent',
        note: 'IDRS_ODONTOGRAM_STATE_V1:{"toothSelection":"tooth-base","bruxismWear":true,"contactMesial":true,"othersNote":"Review at next visit"}',
        fillings: [{ surfaces: ['O'], material: 'composite' }],
      },
      {
        tooth_number: 47,
        tooth_type: 'permanent',
        note: 'IDRS_ODONTOGRAM_STATE_V1:{"toothSelection":"tooth-base","bruxismWear":true,"contactMesial":true,"othersNote":"Review at next visit"}',
        fillings: [{ surfaces: ['O'], material: 'composite' }],
      },
      {
        tooth_number: 48,
        tooth_type: 'edentulous',
        note: 'IDRS_ODONTOGRAM_STATE_V1:{"toothSelection":"none","extractionPlan":false}',
        edentulous: { edentulous_type: 'missing' },
      },
    ],
  },
  images: [],
};

describe('ClinicalChartPdfDocument', () => {
  it('renders a complete clinical payload to a PDF buffer', async () => {
    const buffer = await renderToBuffer(<ClinicalChartPdfDocument data={fixture} />);

    expect(buffer.byteLength).toBeGreaterThan(10_000);
    saveQaPdf('complete.pdf', buffer);
  }, 30_000);

  it('renders UI visuals and an unannotated X-ray with separate AI findings', async () => {
    const data: ChartExportData = {
      ...fixture,
      images: [
        { image_id: 'xray-1', image_type: 'panoramic_xray', image_file: 'xray.png', image_url: PIXEL, description: 'Pre-treatment panoramic', uploaded_at: '2026-09-30T08:00:00Z' },
        { image_id: 'photo-1', image_type: 'intraoral', image_file: 'photo.png', image_url: PIXEL, description: 'Occlusal view', uploaded_at: '2026-09-30T08:05:00Z' },
      ],
    };
    const assets: ChartPdfAssets = {
      pictures: { '/Plane/pararell.png': PIXEL, '/LipLenght.png': PIXEL, '/classification-malocclusion-angle-diagramme-orthodontie-sherbrooke.jpg': PIXEL },
      teeth: { side: { 16: PIXEL, 36: PIXEL, 47: PIXEL }, occl: { 16: PIXEL } },
      muscleViews: { right: PIXEL, front: PIXEL, left: PIXEL },
      clinicalImages: { 'xray-1': PIXEL },
      aiAnalyses: [{
        imageId: 'xray-1',
        modelName: 'DentexSegAndDet',
        modelVersion: 'v1.0',
        result: {
          image_size: { width: 2800, height: 1316 },
          detections: [
            { disease: 'Caries', confidence: 0.81, bbox: [400, 500, 520, 640], tooth_fdi: 16 },
            { disease: 'Impacted', confidence: 0.64, bbox: [2400, 700, 2600, 900], tooth_fdi: null },
          ],
          teeth: [],
        },
      }],
    };

    const buffer = await renderToBuffer(<ClinicalChartPdfDocument data={data} assets={assets} />);

    expect(buffer.byteLength).toBeGreaterThan(10_000);
  }, 30_000);

  it('separates the esthetic pages and excludes AI overlays from the panoramic image', () => {
    const text: string[] = [];
    const titles: string[] = [];
    const componentNames: string[] = [];
    function visit(node: ReactNode): void {
      Children.forEach(node, (child) => {
        if (typeof child === 'string') text.push(child);
        if (!isValidElement<{ children?: ReactNode; title?: string }>(child)) return;
        if (child.props.title) titles.push(child.props.title);
        if (typeof child.type === 'function') {
          componentNames.push(child.type.name);
          visit((child.type as (props: unknown) => ReactNode)(child.props));
        } else {
          visit(child.props.children);
        }
      });
    }

    visit(ClinicalChartPdfDocument({ data: {
      ...fixture,
      images: [{ image_id: 'xray-1', image_type: 'panoramic_xray', image_url: PIXEL }],
    } }));

    expect(titles.filter((title) => title.startsWith('Esthetic Evaluation /'))).toHaveLength(4);
    expect(componentNames).toContain('PanoramicHero');
    expect(componentNames).not.toContain('AiBoxes');
    expect(text.join(' ')).not.toContain('AI overlay:');
  });

  it('paginates gallery categories into four-image sheets without losing images', async () => {
    const data: ChartExportData = {
      ...fixture,
      images: [
        { image_id: 'xray', image_type: 'panoramic_xray', image_url: PIXEL },
        ...Array.from({ length: 9 }, (_, index) => ({ image_id: `photo-${index}`, image_type: 'intraoral', image_url: PIXEL, description: `Clinical view ${index + 1}` })),
        { image_id: 'reference', image_type: 'other', image_url: PIXEL },
      ],
    };
    const document = ClinicalChartPdfDocument({ data });
    const gallery = Children.toArray(document.props.children).find((child) => isValidElement(child) && typeof child.type === 'function' && child.type.name === 'ImageGalleryPage');
    expect(isValidElement(gallery)).toBe(true);
    if (!isValidElement(gallery) || typeof gallery.type !== 'function') throw new Error('Gallery component missing');
    const result = (gallery.type as (props: unknown) => ReactNode)(gallery.props);
    if (!isValidElement<{ children: ReactNode }>(result)) throw new Error('Gallery pages missing');
    const pages = Children.toArray(result.props.children).filter(isValidElement<{ title: string; subtitle: string }>);

    expect(pages.map((page) => page.props.title)).toEqual([
      'Image Gallery / Panoramic X-ray',
      'Image Gallery / Intraoral',
      'Image Gallery / Intraoral',
      'Image Gallery / Intraoral',
      'Image Gallery / Other',
    ]);
    expect(pages.map((page) => page.props.subtitle.split('  |')[0])).toEqual([
      '1-1 of 1 images', '1-4 of 9 images', '5-8 of 9 images', '9-9 of 9 images', '1-1 of 1 images',
    ]);
    const buffer = await renderToBuffer(document);
    expect(buffer.byteLength).toBeGreaterThan(10_000);
  }, 30_000);
  it('keeps missing answers unselected and prints partial export limitations', async () => {
    const selected: Record<string, unknown> = {};
    const text: string[] = [];
    const missing = { ...fixture, medical_history: null, extraoral_exam: null, vdo_evaluation: null };
    const assets = { ...emptyChartPdfAssets(), warnings: ['Saved AI findings: unavailable.', 'Clinical image photo-1: unavailable.'] };
    function visit(node: ReactNode): void {
      Children.forEach(node, (child) => {
        if (typeof child === 'string') text.push(child);
        if (!isValidElement<{ children?: ReactNode; group?: { title: string }; selected?: unknown }>(child)) return;
        if (typeof child.type === 'function') {
          if (child.type.name === 'OptionCards') selected[child.props.group!.title] = child.props.selected;
          visit((child.type as (props: unknown) => ReactNode)(child.props));
        } else visit(child.props.children);
      });
    }
    visit(ClinicalChartPdfDocument({ data: missing, assets }));
    expect(selected['Known Allergies']).toBeUndefined();
    expect(selected['Regular Doctor Visits?']).toBeUndefined();
    expect(text.join(' ')).toContain('Export limitations');
    expect(text.join(' ')).toContain('Saved AI findings: unavailable.');
    expect(text.join(' ')).toContain('Not recorded');
    const buffer = await renderToBuffer(<ClinicalChartPdfDocument data={missing} assets={assets} />);
    saveQaPdf('partial.pdf', buffer);
  });

  it('renders long Thai notes across pages without discarding the end of the note', async () => {
    const note = 'ข้อมูลการตรวจฟันและรายละเอียดการรักษา '.repeat(500) + ' END-OF-LONG-NOTE';
    const data = { ...fixture, medical_history: { ...fixture.medical_history, note } };
    const buffer = await renderToBuffer(<ClinicalChartPdfDocument data={data} />);
    expect(buffer.byteLength).toBeGreaterThan(10_000);
    saveQaPdf('long-notes.pdf', buffer);
  }, 30_000);

});