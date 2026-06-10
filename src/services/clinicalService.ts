import { dentalChartService } from './dentalChartService';
import { dentalStatusService } from './dentalStatusService';
import { medicalHistoryService } from './medicalHistoryService';
import { extraoralExamService } from './extraoralExamService';
import { estheticEvaluationService } from './estheticEvaluationService';
import { vdoEvaluationService } from './vdoEvaluationService';

export type { DentalChart, DentalChartCreatePayload } from './types/dentalChart';
export type { DentalStatusBulkCreate, DentalStatusResponse, ToothData } from './types/dentalStatus';
export type {
  AllergyStatusType,
  MedicalHistory,
  MedicalHistoryCreate,
  MedicalHistoryUpdate,
  Medication,
  PatientExpectationsType,
} from './types/medicalHistory';
export type {
  ExtraoralExam,
  ExtraoralExamCreate,
  ExtraoralExamUpdate,
  FacialSymmetryType,
  FacialProfileType,
  JointPainType,
  JointSoundType,
  JawDeviationType,
  HabitType
} from './types/extraoralExam';
export type {
  VdoEvaluation,
  VdoEvaluationCreate,
  VdoEvaluationUpdate,
  BiteType,
  FacialConditionType
} from './types/vdoEvaluation';

// Backwards-compatible facade while section-specific services are adopted.
export const clinicalService = {
  getDentalCharts: dentalChartService.getByPatient,
  getDentalChartById: dentalChartService.getById,
  createDentalChart: dentalChartService.create,
  deleteDentalChart: dentalChartService.delete,

  getMedicalHistory: medicalHistoryService.getByChart,
  createMedicalHistory: medicalHistoryService.create,
  updateMedicalHistory: medicalHistoryService.update,
  deleteMedicalHistory: medicalHistoryService.delete,

  getDentalStatus: dentalStatusService.getByChart,
  updateDentalStatus: dentalStatusService.update,
  deleteDentalStatus: dentalStatusService.delete,

  getExtraoralExam: extraoralExamService.getByChart,
  createExtraoralExam: extraoralExamService.create,
  updateExtraoralExam: extraoralExamService.update,
  deleteExtraoralExam: extraoralExamService.delete,

  getEstheticEvaluation: estheticEvaluationService.get,
  createEstheticEvaluation: (chartId: string, payload: any) => estheticEvaluationService.upsert(chartId, payload),
  updateEstheticEvaluation: (chartId: string, payload: any) => estheticEvaluationService.upsert(chartId, payload),
  deleteEstheticEvaluation: estheticEvaluationService.delete,

  getVdoEvaluation: vdoEvaluationService.getByChart,
  createVdoEvaluation: vdoEvaluationService.create,
  updateVdoEvaluation: vdoEvaluationService.update,
  deleteVdoEvaluation: vdoEvaluationService.delete,
};
