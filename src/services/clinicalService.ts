import { dentalChartService } from './dentalChartService';
import { dentalStatusService } from './dentalStatusService';
import { medicalHistoryService } from './medicalHistoryService';
import { sectionNoteService } from './sectionNoteService';
import { extraoralExamService } from './extraoralExamService';

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
export type { SectionNote } from './types/sectionNote';
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

// Backwards-compatible facade while section-specific services are adopted.
export const clinicalService = {
  getDentalCharts: dentalChartService.getByPatient,
  getDentalChartById: dentalChartService.getById,
  createDentalChart: dentalChartService.create,
  deleteDentalChart: dentalChartService.delete,

  getSectionNotes: sectionNoteService.getByChart,
  upsertSectionNote: sectionNoteService.upsert,
  deleteSectionNote: sectionNoteService.delete,

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
};
