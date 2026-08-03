export type FacialConditionType =
  | 'nasolabial_fold'
  | 'prominent_chin'
  | 'drooping_commissure'
  | 'thin_lips';

export type BiteType =
  | 'normal_bite'
  | 'deep_bite'
  | 'edge_to_edge'
  | 'crossbite';

export interface VdoEvaluation {
  vdo_id: string;
  chart_id: string;
  facial_soft_tissue?: FacialConditionType[] | null;
  closest_speaking?: number | null;
  free_way_space?: number | null;
  bite_type?: BiteType | null;
  reference_teeth?: number[] | null;
  note?: string | null;
}

export interface VdoEvaluationCreate {
  facial_soft_tissue?: FacialConditionType[] | null;
  closest_speaking?: number | null;
  free_way_space?: number | null;
  bite_type?: BiteType | null;
  reference_teeth?: number[] | null;
  note?: string | null;
}

export interface VdoEvaluationUpdate extends Partial<VdoEvaluationCreate> {}
