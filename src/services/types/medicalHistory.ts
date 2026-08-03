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
  note?: string | null;
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
  note?: string | null;
}

export interface MedicalHistoryUpdate extends Partial<MedicalHistoryCreate> {}
