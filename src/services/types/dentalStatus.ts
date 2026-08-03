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
