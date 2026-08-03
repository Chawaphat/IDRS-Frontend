export interface DentalChart {
  chart_id: string;
  patient_id: string;
  dentist_id: string;
  record_date: string;
  created_at: string;
  notes?: string;
}

export interface DentalChartCreatePayload {
  patient_id: string;
  dentist_id: string;
  record_date?: string;
}
