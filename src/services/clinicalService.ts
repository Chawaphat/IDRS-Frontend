import api from '@/lib/api';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES & ENUMS
// ─────────────────────────────────────────────────────────────────────────────

// 1. Dental Chart Types
export interface DentalChart {
  chart_id: string;
  patient_id: string;
  dentist_id: string;
  record_date: string;
  created_at: string;
  notes?: string;
}

export interface SectionNote {
  note_id: string;
  chart_id: string;
  section_id: string;
  content?: string | null;
  created_at: string;
  updated_at: string;
}

// 2. Medical History Enums & Types
export type AllergyStatusType = 'no' | 'yes' | 'dont_know';
export type PatientExpectationsType = 'chewing' | 'esthetic' | 'health' | 'phonetics' | 'others';

export interface Medication {
  id: string;
  name: string;
  dose: string;
  frequency: string;
  dosePerTime: string;
  timeOfDay: string;
}

export interface MedicalHistory {
  history_id: string;
  chart_id: string;
  chief_complaint?: string | null;
  present_illness?: string | null;
  medical_history?: string | null;
  regular_doctor_visits: boolean;
  regular_doctor_months?: number | null;
  clinic_name?: string | null;
  current_medication?: Medication[] | null;
  allergy_status: AllergyStatusType;
  allergy_detail?: string | null;
  dental_history?: string | null;
  patient_expectation?: PatientExpectationsType[] | null;
  patient_expectation_other?: string | null;
  patient_self_evaluation?: string | null;
  patient_expected_outcome?: string | null;
  edentulous_time?: string | null;
  previous_denture_count?: string | null;
  present_denture_age?: string | null;
  denture_complaint?: string | null;
  created_at?: string;
}

export interface MedicalHistoryCreate {
  chief_complaint?: string | null;
  present_illness?: string | null;
  medical_history?: string | null;
  regular_doctor_visits?: boolean;
  regular_doctor_months?: number | null;
  clinic_name?: string | null;
  current_medication?: Medication[] | null;
  allergy_status: AllergyStatusType;
  allergy_detail?: string | null;
  dental_history?: string | null;
  patient_expectation?: PatientExpectationsType[] | null;
  patient_expectation_other?: string | null;
  patient_self_evaluation?: string | null;
  patient_expected_outcome?: string | null;
  edentulous_time?: string | null;
  previous_denture_count?: string | null;
  present_denture_age?: string | null;
  denture_complaint?: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface MedicalHistoryUpdate extends Partial<MedicalHistoryCreate> {}

// 3. Dental Status (Odontogram) Enums & Types
export type ToothTypeEnum = 'edentulous' | 'primary' | 'permanent' | 'implant';
export type EdentulousTypeEnum = 'missing' | 'extraction' | 'embedded' | 'impacted';
export type CariesDepthEnum = 'enamel' | 'dentine' | 'pulp';
export type ToothSurfaceEnum = 'M' | 'D' | 'B' | 'L' | 'P' | 'O';
export type FillingMaterialEnum = 'composite' | 'amalgam' | 'gic' | 'temporary';
export type MobilityGradeEnum = 'normal' | 'M1' | 'M2' | 'M3';
export type EptResultEnum = 'positive' | 'negative';
export type RootCanalTreatedEnum = 'no' | 'medicated' | 'incomplete' | 'completed';
export type RestorationTypeEnum = 'crown' | 'bridge' | 'veneer' | 'onlay' | 'overlay' | 'post_and_core' | 'vonlay';
export type RestorationMaterialEnum = 'zirconia' | 'lithium_disilicate' | 'full_metal' | 'pfm' | 'pfz' | 'emax';
export type PostTypeEnum = 'metal_post' | 'fiber_post';
export type ImplantComponentEnum = 'crown' | 'bridge' | 'healing_abutment' | 'cover_screw';
export type RetentionTypeEnum = 'cement_retained' | 'screw_retained';

export interface EdentulousData {
  edentulous_id?: string;
  edentulous_type: EdentulousTypeEnum;
  note?: string | null;
}

export interface CariesData {
  caries_id?: string;
  surface: ToothSurfaceEnum;
  depth: CariesDepthEnum;
  note?: string | null;
}

export interface FillingData {
  filling_id?: string;
  surfaces: ToothSurfaceEnum[];
  material: FillingMaterialEnum;
  size_mm?: number | null;
  note?: string | null;
}

export interface PeriodontalData {
  periodontal_id?: string;
  mobility_grade?: MobilityGradeEnum | null;
  recession_mm?: number | null;
  note?: string | null;
}

export interface VitalityData {
  vitality_id?: string;
  pulp_status?: string | null;
  ept_result?: EptResultEnum | null;
  root_canal_treated?: RootCanalTreatedEnum | null;
  note?: string | null;
}

export interface RestorationData {
  restoration_id?: string;
  restoration_type: RestorationTypeEnum;
  material?: RestorationMaterialEnum | null;
  post_type?: PostTypeEnum | null;
  note?: string | null;
}

export interface ImplantData {
  implant_id?: string;
  component_type: ImplantComponentEnum;
  retention_type?: RetentionTypeEnum | null;
  material?: RestorationMaterialEnum | null;
  brand?: string | null;
  crown_brand?: string | null;
  note?: string | null;
}

export interface ToothData {
  tooth_id?: string;
  tooth_number: number;
  tooth_type: ToothTypeEnum;
  note?: string | null;
  
  edentulous?: EdentulousData | null;
  caries?: CariesData[];
  fillings?: FillingData[];
  periodontal?: PeriodontalData | null;
  vitality?: VitalityData | null;
  restorations?: RestorationData | null;
  implant?: ImplantData | null;
}

export interface DentalStatusBulkCreate {
  teeth: ToothData[];
}

export interface DentalStatusResponse {
  status_id: string;
  chart_id: string;
  created_at: string;
  teeth: ToothData[];
}

// ─────────────────────────────────────────────────────────────────────────────
// CLINICAL SERVICE ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

export const clinicalService = {
  // 1. Dental Charts APIs
  getDentalCharts: async (patientId: string): Promise<DentalChart[]> => {
    const response = await api.get<DentalChart[]>(`/patients/${patientId}/dental-charts`);
    return response.data;
  },

  getDentalChartById: async (chartId: string): Promise<DentalChart> => {
    const response = await api.get<DentalChart>(`/dental-charts/${chartId}`);
    return response.data;
  },

  createDentalChart: async (payload: {
    patient_id: string;
    dentist_id: string;
    record_date?: string;
  }): Promise<DentalChart> => {
    const response = await api.post<DentalChart>('/dental-charts', payload);
    return response.data;
  },

  deleteDentalChart: async (chartId: string): Promise<void> => {
    await api.delete(`/dental-charts/${chartId}`);
  },

  getSectionNotes: async (chartId: string): Promise<SectionNote[]> => {
    const response = await api.get<SectionNote[]>(`/dental-charts/${chartId}/section-notes`);
    return response.data;
  },

  upsertSectionNote: async (chartId: string, sectionId: string, content: string): Promise<SectionNote> => {
    const response = await api.put<SectionNote>(`/dental-charts/${chartId}/section-notes/${sectionId}`, { content });
    return response.data;
  },

  deleteSectionNote: async (chartId: string, sectionId: string): Promise<void> => {
    await api.delete(`/dental-charts/${chartId}/section-notes/${sectionId}`);
  },

  // 2. Medical History APIs
  getMedicalHistory: async (chartId: string): Promise<MedicalHistory> => {
    const response = await api.get<MedicalHistory>(`/dental-charts/${chartId}/medical-history`);
    return response.data;
  },

  createMedicalHistory: async (chartId: string, payload: MedicalHistoryCreate): Promise<MedicalHistory> => {
    const response = await api.post<MedicalHistory>(`/dental-charts/${chartId}/medical-history`, payload);
    return response.data;
  },

  updateMedicalHistory: async (chartId: string, payload: MedicalHistoryUpdate): Promise<{ history_id: string; chart_id: string } & Partial<MedicalHistory>> => {
    const response = await api.put<{ history_id: string; chart_id: string } & Partial<MedicalHistory>>(`/dental-charts/${chartId}/medical-history`, payload);
    return response.data;
  },

  deleteMedicalHistory: async (chartId: string): Promise<void> => {
    await api.delete(`/dental-charts/${chartId}/medical-history`);
  },

  // 3. Dental Status (Odontogram) APIs
  getDentalStatus: async (chartId: string): Promise<DentalStatusResponse> => {
    const response = await api.get<DentalStatusResponse>(`/dental-charts/${chartId}/dental-status`);
    return response.data;
  },

  updateDentalStatus: async (chartId: string, payload: DentalStatusBulkCreate): Promise<DentalStatusResponse> => {
    const response = await api.put<DentalStatusResponse>(`/dental-charts/${chartId}/dental-status`, payload);
    return response.data;
  },

  deleteDentalStatus: async (statusId: string): Promise<void> => {
    await api.delete(`/dental-charts/dental-status`, { params: { status_id: statusId } });
  },
};
