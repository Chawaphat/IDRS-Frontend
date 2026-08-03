export interface Medication {
    id: string;
    name: string;
    dose: string;
    frequency: string;
    dosePerTime: string;
    timeOfDay: string;
}

export interface FormState {
    chiefComplaint: string; presentIllness: string;
    medicalHistory: string; medications: Medication[];
    seeDoctorRegularly: string;
    regularDoctorMonths: string;
    clinicName: string;
    allergyStatus: string;
    allergyDetails: string;
    dentalHistory: string;
    patientExpectation: string[];
    otherExpectation: string;
    selfEvaluation: string;
    expectedOutcomeDetail: string;
    edentulousTime: string;
    previousDentureCount: string;
    presentDentureAge: string;
    dentureComplaint: string;
    facialSymmetry: string; facialProfile: string;
    musclePain: string[];
    jointPain: string[];
    jointSound: string;
    jawDeviation: string;
    jawDeviationMm: string;
    limitedOpening: string;
    openingMm: string;
    limitedBorder: string;
    borderDetail: string;
    parafunctionalHabits: string[];
    habitOther: string;
    toothWearFactors: string[];
    wearHardFoodDetail: string;
    wearOtherDetail: string;
    occlusalPlane: string;
    facialMidline: string;
    facialMidlineMm: string;
    lipFullness: string;
    lipLength: string;
    toothExpUpper: string;
    toothExpLower: string;
    nasolabialAngle: string;
    smileLine: string;
    incisalCurve: string;
    lipPosition: string;
    teethExposed: string;
    midlinePhiltrum: string;
    midlineIncisors: string;
    buccalCorridor: string;
    fvSound: string;
    sSoundMm: string;
    sSoundRef: string;
    lipAtRest: string; midlineDiscrepancy: string; midlineShiftMm: string;
    vdoSoftTissueContour: string[];
    vdoSpeakingSpaceRef: string;
    vdoBiteType: string;
    vdoFreewaySpaceMm: string;
    ridgeWidth: string;
    jawSize: string;
    ridgeShapeU: string;
    ridgeShapeL: string;
    ridgeRelation: string;
    ridgeParallelism: string;
    interridgeSpace: string;
    lowerArchForm: string;
    palatalThroatForm: string;
    tonguePosition: string;
    salivaConsistency: string;
    lipMobility: string;
    facialMuscleTone: string;
    torusPresent: string[];
    frenumU: string[];
    frenumL: string[];
    ridgeDeformity: string[];
    exostosisDetail: string;
    bonySpiculeDetail: string;
    vdoNasolabialFold: string; vdoDroopingCommissure: string; vdoThinLips: string; closestSpeakingSpace: string; freewaySpace: string;
    ridgeHeight: string; ridgeShapeUpper: string; ridgeShapeLower: string; palatalVault: string;
    tongueSize: string; amountOfSaliva: string; mentalAttitude: string;
    sectionNotes: Record<string, string>;
}

export const DEFAULT_STATE: FormState = {
    chiefComplaint: '', presentIllness: '', medicalHistory: '', medications: [],
    seeDoctorRegularly: 'no', regularDoctorMonths: '', clinicName: '', allergyStatus: 'deny', allergyDetails: '',
    dentalHistory: '',
    patientExpectation: [],
    otherExpectation: '', selfEvaluation: '', expectedOutcomeDetail: '',
    edentulousTime: '', previousDentureCount: '', presentDentureAge: '', dentureComplaint: '',
    facialSymmetry: 'symmetry', facialProfile: 'straight', musclePain: [], jointPain: [], jointSound: 'no', jawDeviation: 'none', jawDeviationMm: '', limitedOpening: 'no', openingMm: '', limitedBorder: 'no', borderDetail: '', parafunctionalHabits: [], habitOther: '', toothWearFactors: [], wearHardFoodDetail: '', wearOtherDetail: '',
    occlusalPlane: 'parallel', facialMidline: 'symmetric', facialMidlineMm: '', lipFullness: 'average', lipLength: 'average', toothExpUpper: '', toothExpLower: '', nasolabialAngle: '90', smileLine: 'average', incisalCurve: 'convex', lipPosition: 'not-touching', teethExposed: '8', midlinePhiltrum: 'center', midlineIncisors: 'straight', buccalCorridor: 'normal', fvSound: 'yes', sSoundMm: '', sSoundRef: '', lipAtRest: '', midlineDiscrepancy: '', midlineShiftMm: '',
    vdoSoftTissueContour: [], vdoSpeakingSpaceRef: '', vdoBiteType: 'normal', vdoFreewaySpaceMm: '',
    ridgeWidth: 'Round', jawSize: 'Medium', ridgeShapeU: 'U shape', ridgeShapeL: 'U shape', ridgeRelation: 'Class I', ridgeParallelism: 'Parallel', interridgeSpace: 'Sufficient', lowerArchForm: 'Square', palatalThroatForm: 'class-i', tonguePosition: 'Normal', salivaConsistency: 'thick', lipMobility: 'Normal', facialMuscleTone: 'average', torusPresent: [], frenumU: [], frenumL: [], ridgeDeformity: [], exostosisDetail: '', bonySpiculeDetail: '',
    vdoNasolabialFold: 'Normal', vdoDroopingCommissure: 'No', vdoThinLips: 'No', closestSpeakingSpace: '', freewaySpace: '',
    ridgeHeight: '', ridgeShapeUpper: '', ridgeShapeLower: '', palatalVault: '', tongueSize: '', amountOfSaliva: '', mentalAttitude: '',
    sectionNotes: {}
};

export const sectionNames: Record<string, string> = {
    images: 'Images',
    patientHistory: 'Patient History',
    imageGallery: 'Image Gallery',
    extraoral: 'Extraoral Exam',
    esthetic: 'Esthetic Evaluation',
    vdo: 'VDO Evaluation',
    occlusal: 'Occlusal Analysis',
    residualRidge: 'Residual Ridge Area'
};
