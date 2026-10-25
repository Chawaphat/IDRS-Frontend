export interface MuscleArea {
  id: string;
  src: string;
  left: string;
  top: string;
  width: string;
  height: string;
}

export const FACE_FRONT_IMAGE = '/face-svgs/Image pure.svg';
export const FACE_SIDE_IMAGE = '/face-svgs/Sideview pure.png';

export const MUSCLE_AREAS: MuscleArea[] = [
  // Screen Left (Patient Right)
  { id: 'temporalis-R', src: '/face-svgs/l-temporalis.svg', left: '13.699%', top: '16.416%', width: '11.495%', height: '26.666%' },
  { id: 'masseter-R', src: '/face-svgs/l-masseter.png', left: '17.494%', top: '48.708%', width: '11.941%', height: '21.291%' },

  // Screen Right (Patient Left)
  { id: 'temporalis-L', src: '/face-svgs/r-temporalis.svg', left: '74.442%', top: '16.416%', width: '11.495%', height: '26.666%' },
  { id: 'masseter-L', src: '/face-svgs/r-masseter.png', left: '70.758%', top: '48.708%', width: '11.941%', height: '21.291%' },
];

export const SIDEVIEW_MUSCLE_AREAS: MuscleArea[] = [
  { id: 'temporalis', src: '/face-svgs/Temporalis Sideview.svg', left: '19.604%', top: '20.435%', width: '43.750%', height: '30.029%' },
  { id: 'lat-pterygoid', src: '/face-svgs/Lateral Pterygoid Sideview.svg', left: '38.867%', top: '48.413%', width: '20.557%', height: '17.334%' },
  { id: 'med-pterygoid', src: '/face-svgs/Medial Pterygoid Sideview.svg', left: '42.847%', top: '56.641%', width: '15.967%', height: '22.266%' },
];

const MUSCLE_NAMES: Record<string, string> = {
  temporalis: 'Temporalis',
  masseter: 'Masseter',
  'lat-pterygoid': 'Lateral Pterygoid',
  'med-pterygoid': 'Medial Pterygoid',
};

export const formatMuscleName = (id: string) => {
  const baseId = id.replace('-R', '').replace('-L', '');
  return MUSCLE_NAMES[baseId] || baseId;
};
