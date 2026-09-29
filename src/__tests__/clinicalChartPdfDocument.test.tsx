import { pdf } from '@react-pdf/renderer';
import { describe, expect, it, vi } from 'vitest';
import { ClinicalChartPdfDocument } from '@/components/ClinicalChartPdfDocument';
import type { ChartExportData } from '@/services/pdfExportService';

vi.mock('@fontsource/noto-sans-thai/files/noto-sans-thai-thai-400-normal.woff', () => ({
  default: `${process.cwd()}/node_modules/@fontsource/noto-sans-thai/files/noto-sans-thai-thai-400-normal.woff`,
}));
vi.mock('@fontsource/noto-sans-thai/files/noto-sans-thai-thai-700-normal.woff', () => ({
  default: `${process.cwd()}/node_modules/@fontsource/noto-sans-thai/files/noto-sans-thai-thai-700-normal.woff`,
}));

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
    ],
  },
  images: [],
};

describe('ClinicalChartPdfDocument', () => {
  it('renders a complete clinical payload to a PDF blob', async () => {
    const blob = await pdf(<ClinicalChartPdfDocument data={fixture} />).toBlob();

    expect(blob.type).toBe('application/pdf');
    expect(blob.size).toBeGreaterThan(10_000);
  }, 30_000);
});