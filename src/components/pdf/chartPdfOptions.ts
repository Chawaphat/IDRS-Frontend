import symmetryImg from '@/assets/facial/symmetry.png';
import asymmetryImg from '@/assets/facial/asymmetry.png';
import convexImg from '@/assets/facial/profile_convex.png';
import straightImg from '@/assets/facial/profile_stright.png';
import concaveImg from '@/assets/facial/profile_concave.png';

export interface PdfOption {
  value: string;
  label: string;
  sub?: string;
  image?: string;
}

export interface PdfOptionGroup {
  title: string;
  options: PdfOption[];
  imageFit?: 'cover' | 'contain';
}

const option = (value: string, label: string, image?: string, sub?: string): PdfOption => ({ value, label, image, sub });

export const EXTRAORAL_GROUPS = {
  facialSymmetry: {
    title: 'Facial symmetry',
    options: [option('symmetry', 'Symmetry', symmetryImg, 'Balanced facial proportions'), option('asymmetry', 'Asymmetry', asymmetryImg, 'Unequal facial proportions')],
  },
  facialProfile: {
    title: 'Facial profile',
    options: [option('straight', 'Straight', straightImg, 'Normal'), option('convex', 'Convex', convexImg, 'Protrusive'), option('concave', 'Concave', concaveImg, 'Retrusive')],
  },
  jointPain: { title: 'Present joint pain', options: [option('function', 'Function'), option('palpation', 'Palpation')] },
  jawDeviation: { title: 'Jaw deviation', options: [option('none', 'None'), option('to_left', 'Left'), option('to_right', 'Right')] },
  jointSound: { title: 'Joint sound', options: [option('no', 'No'), option('clicking', 'Clicking'), option('crepitus', 'Crepitus'), option('popping', 'Popping')] },
  limitedMovement: { title: 'Limited border movement?', options: [option('false', 'No'), option('true', 'Yes')] },
  habits: {
    title: 'Parafunctional habit',
    options: [option('nail_biting', 'Nail Biting'), option('bruxism', 'Bruxism'), option('clenching', 'Clenching'), option('tongue_thrust', 'Tongue Thrust'), option('other', 'Other')],
  },
  toothWear: {
    title: 'Factors affecting tooth wear',
    options: ['Hard food', 'Acid Beverage', 'Bulimia', 'Swimming', 'GERD', 'Other'].map((value) => option(value, value)),
  },
} satisfies Record<string, PdfOptionGroup>;

export const ESTHETIC_GROUPS = {
  occlusalPlane: {
    title: 'Occlusal plane to interpupillary line',
    imageFit: 'cover',
    options: [option('parallel', 'Parallel', '/Plane/pararell.png'), option('canted_right', 'Canted Right', '/Plane/right.png'), option('canted_left', 'Canted Left', '/Plane/left.png')],
  },
  nasolabialAngle: {
    title: 'Nasolabial angle',
    imageFit: 'cover',
    options: [
      option('normal', 'Normal (~90°)', '/Nasolabial Angle/90.png'),
      option('prominent_maxilla', 'Prominent (<90°)', '/Nasolabial Angle/70.png'),
      option('retruded_maxilla', 'Retruded (>90°)', '/Nasolabial Angle/100.png'),
    ],
  },
  midline: {
    title: 'Facial midline and dental midline discrepancy',
    options: [
      option('symmetric', 'Symmetric', '/Dentofacial Analysis/Midline Symmetric.png'),
      option('right_shift', 'Right Shift', '/Dentofacial Analysis/Midline Right Shift.png'),
      option('left_shift', 'Left Shift', '/Dentofacial Analysis/Midline Left Shift.png'),
    ],
  },
  lipFullness: {
    title: 'Lip fullness',
    options: [
      option('full', 'Full', '/Dentofacial Analysis/Lip Fullness Full.png'),
      option('average', 'Average', '/Dentofacial Analysis/Lip Fullness Average.png'),
      option('thin', 'Thin', '/Dentofacial Analysis/Lip Fullness Thin.jpeg'),
    ],
  },
  lipLength: { title: 'Lip length', options: [option('long', 'Long'), option('average', 'Average'), option('short', 'Short')] },
  smileLine: {
    title: 'Smile line',
    options: [option('average', 'Average', '/Dentofacial Analysis/avg.png'), option('high', 'High', '/Dentofacial Analysis/high.png'), option('low', 'Low', '/Dentofacial Analysis/Low.png')],
  },
  incisalCurve: {
    title: 'Incisal silhouette',
    options: [
      option('convex', 'Convex Curve', '/Dentofacial Analysis/ConvexCurve.jpeg'),
      option('straight', 'Straight', '/Dentofacial Analysis/Straight.jpeg'),
      option('reverse', 'Reverse', '/Dentofacial Analysis/Reverse.jpeg'),
    ],
  },
  midlinePhiltrum: {
    title: 'Midline (philtrum)',
    options: [
      option('center', 'Center', '/Dentofacial Analysis/center.jpeg'),
      option('right', 'Right', '/Dentofacial Analysis/Right of center.jpeg'),
      option('left', 'Left', '/Dentofacial Analysis/Left of center.jpeg'),
    ],
  },
  teethExposed: {
    title: 'Teeth exposed (full smile)',
    options: ['6', '8', '10', '12'].map((count) => option(count, `${count} Teeth`, `/Dentofacial Analysis/${count}.jpeg`)),
  },
  lipPosition: {
    title: 'Tooth-lower lip position',
    options: [
      option('touching', 'Touching', '/Dentofacial Analysis/Touching.jpeg'),
      option('not-touching', 'Not Touching', '/Dentofacial Analysis/Not touching.jpeg'),
      option('slightly-covered', 'Covered', '/Dentofacial Analysis/Slightly coverage.jpeg'),
    ],
  },
  midlineIncisors: {
    title: 'Upper & lower midline',
    options: [
      option('right', 'Right', '/Dentofacial Analysis/Right.jpeg'),
      option('left', 'Left', '/Dentofacial Analysis/Left.jpeg'),
      option('straight', 'Straight', '/Dentofacial Analysis/Stright midline.jpeg'),
    ],
  },
  buccalCorridor: {
    title: 'Buccal corridor',
    options: [option('normal', 'Normal', '/Dentofacial Analysis/Normal corridor.jpeg'), option('increased', 'Increased', '/Dentofacial Analysis/Increased.jpeg')],
  },
  fvSound: { title: 'F-V sound', options: [option('true', 'Yes'), option('false', 'No')] },
} satisfies Record<string, PdfOptionGroup>;

export const VDO_GROUPS = {
  softTissue: {
    title: 'Facial soft tissue contour',
    options: [option('nasolabial_fold', 'Nasolabial fold'), option('prominent_chin', 'Prominent chin'), option('drooping_commissure', 'Drooping commissure'), option('thin_lips', 'Thin lips')],
  },
  biteType: {
    title: 'Present bite type',
    options: [option('normal_bite', 'Normal bite'), option('deep_bite', 'Deep bite'), option('edge_to_edge', 'Edge to edge'), option('crossbite', 'Crossbite')],
  },
} satisfies Record<string, PdfOptionGroup>;

const enumOptions = (title: string, entries: Array<[string, string, string?]>): PdfOptionGroup => ({
  title,
  options: entries.map(([value, label, sub]) => option(value, label, undefined, sub)),
});

export const RIDGE_GROUPS = {
  ridgeHeight: enumOptions('Ridge height', [['high', 'High'], ['low_flat', 'Low (flat)'], ['knife_edge', 'Knife edge']]),
  ridgeWidth: enumOptions('Ridge width', [['round', 'Round'], ['narrow', 'Narrow']]),
  jawSize: enumOptions('Size of jaw', [['small', 'Small'], ['medium', 'Medium'], ['large', 'Large']]),
  ridgeShapeUpper: enumOptions('Upper arch (U)', [['u_shape', 'U shape'], ['v_shape', 'V shape'], ['undercut', 'Undercut'], ['flat', 'Flat']]),
  ridgeShapeLower: enumOptions('Lower arch (L)', [['u_shape', 'U shape'], ['v_shape', 'V shape'], ['undercut', 'Undercut'], ['flat', 'Flat']]),
  ridgeRelation: enumOptions('Ridge relation', [['class_i', 'Class I'], ['class_ii', 'Class II'], ['class_iii', 'Class III'], ['crossbite', 'Crossbite']]),
  ridgeParallelism: enumOptions('Ridge parallelism', [['parallel', 'Parallel'], ['divergent', 'Divergent']]),
  interridgeSpace: enumOptions('Interridge space', [['sufficient', 'Sufficient'], ['insufficient', 'Insufficient']]),
  lowerArchForm: enumOptions('Lower arch form', [['square', 'Square'], ['taper', 'Taper'], ['ovoid', 'Ovoid']]),
  palatalVault: enumOptions('Palatal vault', [['average', 'Average'], ['steep', 'Steep'], ['v_shape', 'V shape'], ['shallow', 'Shallow']]),
  palatalThroat: enumOptions('Palatal throat form', [['class_i', 'Class I', '5-13mm of PSS band'], ['class_ii', 'Class II', '3-5mm of PSS band'], ['class_iii', 'Class III', '<3mm of PSS band']]),
  torus: enumOptions('Torus present', [['Palatinus', 'Palatinus'], ['Mandibularis', 'Mandibularis']]),
  ridgeDeformity: enumOptions('Ridge deformity', [['Exostosis', 'Exostosis'], ['Bony spicule', 'Bony spicule'], ['Flabby tissue', 'Flabby tissue'], ['Knife edge', 'Knife edge']]),
  frenumUpper: enumOptions('High frenum attachment — upper', [['Labial', 'Labial'], ['Buccal L/R', 'Buccal L/R']]),
  frenumLower: enumOptions('High frenum attachment — lower', [['Labial', 'Labial'], ['Buccal L/R', 'Buccal L/R']]),
  tongueSize: enumOptions('Tongue size', [['small', 'Small'], ['medium', 'Medium'], ['large', 'Large']]),
  tonguePosition: enumOptions('Tongue position', [['normal', 'Normal'], ['retracted', 'Retracted']]),
  lipMobility: enumOptions('Lip mobility', [['normal', 'Normal'], ['highly_active', 'Highly active'], ['relatively_inactive', 'Relatively inactive']]),
  facialMuscleTone: enumOptions('Facial muscle tone', [['tense', 'Tense'], ['average', 'Average'], ['flaccid', 'Flaccid']]),
  salivaAmount: enumOptions('Saliva amount', [['normal', 'Normal Vol.'], ['xerostomia', 'Xerostomia']]),
  salivaConsistency: enumOptions('Saliva consistency', [['thick', 'Thick'], ['thin', 'Thin']]),
  mentalAttitude: enumOptions('M.M. House classification', [
    ['philosophical', 'Philosophical', 'Rational & cooperative'],
    ['exacting', 'Exacting', 'Demanding & precise'],
    ['hysterical', 'Hysterical', 'Anxious & pessimistic'],
    ['indifferent', 'Indifferent', 'Unmotivated & apathetic'],
  ]),
} satisfies Record<string, PdfOptionGroup>;

export const ANGLE_CLASS_OPTIONS = enumOptions('Angle classification', [['class_i', 'Class I'], ['class_ii', 'Class II'], ['class_iii', 'Class III']]);

export const EXPECTATION_OPTIONS: PdfOption[] = [
  option('chewing', 'Chewing', undefined, 'Masticatory function'),
  option('esthetic', 'Esthetic', undefined, 'Appearance & aesthetics'),
  option('health', 'Health', undefined, 'Oral health maintenance'),
  option('phonetics', 'Phonetics', undefined, 'Speech & phonation'),
  option('others', 'Others', undefined, 'Please specify below'),
];

export const LIP_GUIDE_IMAGE = '/LipLenght.png';

export const PDF_OPTION_GROUPS: PdfOptionGroup[] = [
  ...Object.values(EXTRAORAL_GROUPS),
  ...Object.values(ESTHETIC_GROUPS),
];

export const PDF_REFERENCE_IMAGES = [LIP_GUIDE_IMAGE];
