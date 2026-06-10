export type FacialSymmetryType = 'symmetry' | 'asymmetry';

export type FacialProfileType = 'convex' | 'straight' | 'concave';

export type JointPainType = 'function' | 'palpation';

export type JointSoundType = 'no' | 'clicking' | 'crepitus' | 'popping';

export type JawDeviationType = 'none' | 'to_left' | 'to_right';

export type HabitType = 'nail_biting' | 'bruxism' | 'clenching' | 'tongue_thrust';

export interface ExtraoralExam {
  exam_id: string;
  chart_id: string;
  facial_symmetry: FacialSymmetryType;
  facial_profile: FacialProfileType;
  muscle_pain?: string[] | null;
  joint_pain?: JointPainType[] | null;
  joint_sound?: JointSoundType | null;
  jaw_deviation?: JawDeviationType | null;
  has_limited_opening?: boolean | null;
  mouth_opening_mm?: number | null;
  has_limited_movement?: boolean | null;
  specify_movement_detail?: string | null;
  parafunctional_habit?: HabitType[] | null;
  parafunctional_habit_other?: string | null;
  factors_affecting_tooth_wear?: Record<string, any> | null;
  note?: string | null;
}

export interface ExtraoralExamCreate {
  facial_symmetry: FacialSymmetryType;
  facial_profile: FacialProfileType;
  muscle_pain?: string[] | null;
  joint_pain?: JointPainType[] | null;
  joint_sound?: JointSoundType | null;
  jaw_deviation?: JawDeviationType | null;
  has_limited_opening?: boolean | null;
  mouth_opening_mm?: number | null;
  has_limited_movement?: boolean | null;
  specify_movement_detail?: string | null;
  parafunctional_habit?: HabitType[] | null;
  parafunctional_habit_other?: string | null;
  factors_affecting_tooth_wear?: Record<string, any> | null;
  note?: string | null;
}

export interface ExtraoralExamUpdate extends Partial<ExtraoralExamCreate> {}
