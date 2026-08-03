import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, Brain, CheckCircle2, Droplets, Focus, Layers, Loader2, Maximize } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { SelectCard } from './components/ChartUIComponents';
import { useToastStore } from '@/store/toastStore';
import {
  residualRidgeAssessmentService,
  type ResidualRidgeAssessment,
  type ResidualRidgeAssessmentPayload,
} from '@/services/residualRidgeAssessmentService';
import { useSectionSave } from '@/hooks/useSectionSave';
import { SectionNotes } from './components/SectionNotes';

interface ResidualRidgeAssessmentFormProps {
  chartId: string;
}

interface LocalResidualRidgeState {
  ridgeHeight: string;
  ridgeWidth: string;
  jawSize: string;
  ridgeShapeU: string;
  ridgeShapeL: string;
  ridgeRelation: string;
  ridgeParallelism: string;
  interridgeSpace: string;
  lowerArchForm: string;
  palatalVault: string;
  palatalThroatForm: string;
  torusPresent: string[];
  frenumU: string[];
  frenumL: string[];
  ridgeDeformity: string[];
  exostosisDetail: string;
  bonySpiculeDetail: string;
  tongueSize: string;
  tonguePosition: string;
  amountOfSaliva: string;
  salivaConsistency: string;
  lipMobility: string;
  facialMuscleTone: string;
  mentalAttitude: string;
  note: string;
}

const DEFAULT_STATE: LocalResidualRidgeState = {
  ridgeHeight: 'High',
  ridgeWidth: 'Round',
  jawSize: 'Medium',
  ridgeShapeU: 'U shape',
  ridgeShapeL: 'U shape',
  ridgeRelation: 'Class I',
  ridgeParallelism: 'Parallel',
  interridgeSpace: 'Sufficient',
  lowerArchForm: 'Square',
  palatalVault: 'Average',
  palatalThroatForm: 'class-i',
  torusPresent: [],
  frenumU: [],
  frenumL: [],
  ridgeDeformity: [],
  exostosisDetail: '',
  bonySpiculeDetail: '',
  tongueSize: 'Medium',
  tonguePosition: 'Normal',
  amountOfSaliva: 'Normal',
  salivaConsistency: 'Thick',
  lipMobility: 'Normal',
  facialMuscleTone: 'Average',
  mentalAttitude: 'Philosophical',
  note: '',
};

const enumFromLabel = (value: string, map: Record<string, string>) => map[value] ?? null;
const labelFromEnum = (value: unknown, map: Record<string, string>, fallback: string) => {
  if (typeof value !== 'string') return fallback;
  return map[value] ?? fallback;
};

const RIDGE_HEIGHT_TO_API = { High: 'high', 'Low (flat)': 'low_flat', 'Knife edge': 'knife_edge' };
const RIDGE_HEIGHT_FROM_API = { high: 'High', low_flat: 'Low (flat)', knife_edge: 'Knife edge' };
const RIDGE_WIDTH_TO_API = { Round: 'round', Narrow: 'narrow' };
const RIDGE_WIDTH_FROM_API = { round: 'Round', narrow: 'Narrow' };
const JAW_SIZE_TO_API = { Small: 'small', Medium: 'medium', Large: 'large' };
const JAW_SIZE_FROM_API = { small: 'Small', medium: 'Medium', large: 'Large' };
const RIDGE_SHAPE_TO_API = { 'U shape': 'u_shape', 'V shape': 'v_shape', Undercut: 'undercut', Flat: 'flat' };
const RIDGE_SHAPE_FROM_API = { u_shape: 'U shape', v_shape: 'V shape', undercut: 'Undercut', flat: 'Flat' };
const RIDGE_RELATION_TO_API = { 'Class I': 'class_i', 'Class II': 'class_ii', 'Class III': 'class_iii', Crossbite: 'crossbite' };
const RIDGE_RELATION_FROM_API = { class_i: 'Class I', class_ii: 'Class II', class_iii: 'Class III', crossbite: 'Crossbite' };
const PARALLELISM_TO_API = { Parallel: 'parallel', Divergent: 'divergent' };
const PARALLELISM_FROM_API = { parallel: 'Parallel', divergent: 'Divergent' };
const INTERRIDGE_SPACE_TO_API = { Sufficient: 'sufficient', Insufficient: 'insufficient' };
const INTERRIDGE_SPACE_FROM_API = { sufficient: 'Sufficient', insufficient: 'Insufficient' };
const ARCH_FORM_TO_API = { Square: 'square', Taper: 'taper', Ovoid: 'ovoid' };
const ARCH_FORM_FROM_API = { square: 'Square', taper: 'Taper', ovoid: 'Ovoid' };
const PALATAL_VAULT_TO_API = { Average: 'average', Steep: 'steep', 'V shape': 'v_shape', Shallow: 'shallow' };
const PALATAL_VAULT_FROM_API = { average: 'Average', steep: 'Steep', v_shape: 'V shape', shallow: 'Shallow' };
const PALATAL_THROAT_TO_API = { 'class-i': 'class_i', 'class-ii': 'class_ii', 'class-iii': 'class_iii' };
const PALATAL_THROAT_FROM_API = { class_i: 'class-i', class_ii: 'class-ii', class_iii: 'class-iii' };
const TONGUE_SIZE_TO_API = { Small: 'small', Medium: 'medium', Large: 'large' };
const TONGUE_SIZE_FROM_API = { small: 'Small', medium: 'Medium', large: 'Large' };
const TONGUE_POSITION_TO_API = { Normal: 'normal', Retracted: 'retracted' };
const TONGUE_POSITION_FROM_API = { normal: 'Normal', retracted: 'Retracted' };
const SALIVA_AMOUNT_TO_API = { Normal: 'normal', Xerostomia: 'xerostomia' };
const SALIVA_AMOUNT_FROM_API = { normal: 'Normal', xerostomia: 'Xerostomia' };
const LIP_MOBILITY_TO_API = { Normal: 'normal', 'Highly active': 'highly_active', 'Relatively inactive': 'relatively_inactive' };
const LIP_MOBILITY_FROM_API = { normal: 'Normal', highly_active: 'Highly active', relatively_inactive: 'Relatively inactive' };
const SALIVA_CONSISTENCY_TO_API = { Thick: 'thick', Thin: 'thin' };
const SALIVA_CONSISTENCY_FROM_API = { thick: 'Thick', thin: 'Thin' };
const FACIAL_MUSCLE_TONE_TO_API = { Tense: 'tense', Average: 'average', Flaccid: 'flaccid' };
const FACIAL_MUSCLE_TONE_FROM_API = { tense: 'Tense', average: 'Average', flaccid: 'Flaccid' };
const MENTAL_ATTITUDE_TO_API = { Philosophical: 'philosophical', Exacting: 'exacting', Hysterical: 'hysterical', Indifferent: 'indifferent' };
const MENTAL_ATTITUDE_FROM_API = { philosophical: 'Philosophical', exacting: 'Exacting', hysterical: 'Hysterical', indifferent: 'Indifferent' };

const arrayFromJson = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string');
  return [];
};

const objectFromJson = (value: unknown): Record<string, unknown> => {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>;
  return {};
};

const stateFromRecord = (record: ResidualRidgeAssessment | null): LocalResidualRidgeState => {
  if (!record) return DEFAULT_STATE;

  const frenum = objectFromJson(record.freenum_attachment);
  const ridgeDeformity = objectFromJson(record.ridge_deformity);

  return {
    ridgeHeight: labelFromEnum(record.ridge_height, RIDGE_HEIGHT_FROM_API, DEFAULT_STATE.ridgeHeight),
    ridgeWidth: labelFromEnum(record.ridge_width, RIDGE_WIDTH_FROM_API, DEFAULT_STATE.ridgeWidth),
    jawSize: labelFromEnum(record.jaw_size, JAW_SIZE_FROM_API, DEFAULT_STATE.jawSize),
    ridgeShapeU: labelFromEnum(record.ridge_shape_upper, RIDGE_SHAPE_FROM_API, DEFAULT_STATE.ridgeShapeU),
    ridgeShapeL: labelFromEnum(record.ridge_shape_lower, RIDGE_SHAPE_FROM_API, DEFAULT_STATE.ridgeShapeL),
    ridgeRelation: labelFromEnum(record.ridge_relation, RIDGE_RELATION_FROM_API, DEFAULT_STATE.ridgeRelation),
    ridgeParallelism: labelFromEnum(record.ridge_parallelism, PARALLELISM_FROM_API, DEFAULT_STATE.ridgeParallelism),
    interridgeSpace: labelFromEnum(record.interridge_space, INTERRIDGE_SPACE_FROM_API, DEFAULT_STATE.interridgeSpace),
    lowerArchForm: labelFromEnum(record.lower_arch_form, ARCH_FORM_FROM_API, DEFAULT_STATE.lowerArchForm),
    palatalVault: labelFromEnum(record.palatal_vault, PALATAL_VAULT_FROM_API, DEFAULT_STATE.palatalVault),
    palatalThroatForm: labelFromEnum(record.palatal_throat_form, PALATAL_THROAT_FROM_API, DEFAULT_STATE.palatalThroatForm),
    torusPresent: arrayFromJson(record.torus_palatinus),
    frenumU: arrayFromJson(frenum.upper),
    frenumL: arrayFromJson(frenum.lower),
    ridgeDeformity: Array.isArray(record.ridge_deformity) ? arrayFromJson(record.ridge_deformity) : arrayFromJson(ridgeDeformity.selected),
    exostosisDetail: typeof ridgeDeformity.exostosis_detail === 'string' ? ridgeDeformity.exostosis_detail : '',
    bonySpiculeDetail: typeof ridgeDeformity.bony_spicule_detail === 'string' ? ridgeDeformity.bony_spicule_detail : '',
    tongueSize: labelFromEnum(record.tongue_size, TONGUE_SIZE_FROM_API, DEFAULT_STATE.tongueSize),
    tonguePosition: labelFromEnum(record.tongue_position, TONGUE_POSITION_FROM_API, DEFAULT_STATE.tonguePosition),
    amountOfSaliva: labelFromEnum(record.saliva_amount, SALIVA_AMOUNT_FROM_API, DEFAULT_STATE.amountOfSaliva),
    salivaConsistency: labelFromEnum(record.saliva_consistency, SALIVA_CONSISTENCY_FROM_API, DEFAULT_STATE.salivaConsistency),
    lipMobility: labelFromEnum(record.lip_mobility, LIP_MOBILITY_FROM_API, DEFAULT_STATE.lipMobility),
    facialMuscleTone: labelFromEnum(record.facial_muscle_tone, FACIAL_MUSCLE_TONE_FROM_API, DEFAULT_STATE.facialMuscleTone),
    mentalAttitude: labelFromEnum(record.mental_attitude, MENTAL_ATTITUDE_FROM_API, DEFAULT_STATE.mentalAttitude),
    note: record.note || '',
  };
};

const payloadFromState = (state: LocalResidualRidgeState): ResidualRidgeAssessmentPayload => ({
  ridge_height: enumFromLabel(state.ridgeHeight, RIDGE_HEIGHT_TO_API),
  ridge_width: enumFromLabel(state.ridgeWidth, RIDGE_WIDTH_TO_API),
  jaw_size: enumFromLabel(state.jawSize, JAW_SIZE_TO_API),
  ridge_shape_upper: enumFromLabel(state.ridgeShapeU, RIDGE_SHAPE_TO_API),
  ridge_shape_lower: enumFromLabel(state.ridgeShapeL, RIDGE_SHAPE_TO_API),
  ridge_relation: enumFromLabel(state.ridgeRelation, RIDGE_RELATION_TO_API),
  ridge_parallelism: enumFromLabel(state.ridgeParallelism, PARALLELISM_TO_API),
  interridge_space: enumFromLabel(state.interridgeSpace, INTERRIDGE_SPACE_TO_API),
  lower_arch_form: enumFromLabel(state.lowerArchForm, ARCH_FORM_TO_API),
  palatal_vault: enumFromLabel(state.palatalVault, PALATAL_VAULT_TO_API),
  palatal_throat_form: enumFromLabel(state.palatalThroatForm, PALATAL_THROAT_TO_API),
  torus_palatinus: state.torusPresent,
  freenum_attachment: {
    upper: state.frenumU,
    lower: state.frenumL,
  },
  ridge_deformity: {
    selected: state.ridgeDeformity,
    exostosis_detail: state.exostosisDetail || null,
    bony_spicule_detail: state.bonySpiculeDetail || null,
  },
  tongue_size: enumFromLabel(state.tongueSize, TONGUE_SIZE_TO_API),
  tongue_position: enumFromLabel(state.tonguePosition, TONGUE_POSITION_TO_API),
  saliva_amount: enumFromLabel(state.amountOfSaliva, SALIVA_AMOUNT_TO_API),
  saliva_consistency: enumFromLabel(state.salivaConsistency, SALIVA_CONSISTENCY_TO_API),
  lip_mobility: enumFromLabel(state.lipMobility, LIP_MOBILITY_TO_API),
  facial_muscle_tone: enumFromLabel(state.facialMuscleTone, FACIAL_MUSCLE_TONE_TO_API),
  mental_attitude: enumFromLabel(state.mentalAttitude, MENTAL_ATTITUDE_TO_API),
  note: state.note || null,
});

export default function ResidualRidgeAssessmentForm({ chartId }: ResidualRidgeAssessmentFormProps) {
  const { show: showToast } = useToastStore();
  const [formData, setFormData] = useState<LocalResidualRidgeState>(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasExistingRecord, setHasExistingRecord] = useState(false);
  const { markDirty, markClean, registerSave } = useSectionSave("residualRidge");
  const formDataRef = useRef(formData);
  const hasExistingRecordRef = useRef(hasExistingRecord);
  useEffect(() => { formDataRef.current = formData; }, [formData]);
  useEffect(() => { hasExistingRecordRef.current = hasExistingRecord; }, [hasExistingRecord]);

  useEffect(() => {
    const fetchAssessment = async () => {
      if (!chartId) return;

      try {
        setLoading(true);
        const record = await residualRidgeAssessmentService.get(chartId);
        setHasExistingRecord(!!record);
        hasExistingRecordRef.current = !!record;
        setFormData(stateFromRecord(record));
      } catch (err) {
        console.error('Failed to fetch residual ridge assessment', err);
        showToast('Failed to load residual ridge assessment.', 'error');
      } finally {
        setLoading(false);
        registerSave(async () => {
          setSaving(true);
          try {
            await residualRidgeAssessmentService.upsert(chartId, payloadFromState(formDataRef.current), hasExistingRecordRef.current);
            setHasExistingRecord(true);
            hasExistingRecordRef.current = true;
          } catch (err) {
            showToast('Failed to save residual ridge assessment.', 'error');
            throw err;
          } finally {
            setSaving(false);
          }
        });
        markClean();
      }
    };

    fetchAssessment();
  }, [chartId, showToast, registerSave, markClean]);

  const updateField = <K extends keyof LocalResidualRidgeState>(field: K, value: LocalResidualRidgeState[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    markDirty();
  };

  const toggleArrayField = (field: 'torusPresent' | 'frenumU' | 'frenumL' | 'ridgeDeformity', value: string) => {
    setFormData(prev => {
      const current = prev[field];
      return {
        ...prev,
        [field]: current.includes(value) ? current.filter(item => item !== value) : [...current, value],
      };
    });
    markDirty();
  };

  const applySmartDefaults = () => {
    markDirty();
    setFormData(prev => ({
      ...prev,
      ridgeHeight: 'High',
      ridgeWidth: 'Round',
      jawSize: 'Medium',
      ridgeShapeU: 'U shape',
      ridgeShapeL: 'U shape',
      ridgeRelation: 'Class I',
      ridgeParallelism: 'Parallel',
      interridgeSpace: 'Sufficient',
      lowerArchForm: 'Square',
      palatalVault: 'Average',
      palatalThroatForm: 'class-i',
      tongueSize: 'Medium',
      tonguePosition: 'Normal',
      amountOfSaliva: 'Normal',
      salivaConsistency: 'Thick',
      lipMobility: 'Normal',
      facialMuscleTone: 'Average',
      mentalAttitude: 'Philosophical',
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 text-teal-600">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Layers className="w-8 h-8 text-emerald-600" />
            Residual Ridge Area
          </h2>
          <p className="text-slate-500 mt-1">Comprehensive evaluation of the edentulous ridge, soft tissues, and patient attitude.</p>
        </div>
        <div className="flex items-center gap-3">
          {saving && (
            <span className="text-sm text-slate-400 italic flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
              Saving...
            </span>
          )}
          <Button variant="secondary" onClick={applySmartDefaults} className="gap-2 bg-teal-50 text-teal-700 hover:bg-teal-100">
            <CheckCircle2 className="w-4 h-4" />
            Smart Defaults
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center gap-2">
          <Maximize className="w-5 h-5 text-indigo-500" />
          <h3 className="font-semibold text-slate-800">1. Arch & Ridge Morphology</h3>
        </div>

        <div className="p-6 md:p-8 space-y-8">
          <div className="grid grid-cols-1 gap-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
              <Label className="text-sm font-bold text-slate-700">Ridge Height</Label>
              <div className="grid grid-cols-3 gap-2 md:col-span-3">
                {['High', 'Low (flat)', 'Knife edge'].map(opt => (
                  <SelectCard key={opt} label={opt} isSelected={formData.ridgeHeight === opt} onClick={() => updateField('ridgeHeight', opt)} />
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center border-t border-slate-100 pt-6">
              <Label className="text-sm font-bold text-slate-700">Ridge Width</Label>
              <div className="grid grid-cols-2 gap-2 md:col-span-3">
                {['Round', 'Narrow'].map(opt => (
                  <SelectCard key={opt} label={opt} isSelected={formData.ridgeWidth === opt} onClick={() => updateField('ridgeWidth', opt)} />
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center border-t border-slate-100 pt-6">
              <Label className="text-sm font-bold text-slate-700">Size of Jaw</Label>
              <div className="grid grid-cols-3 gap-2 md:col-span-3">
                {['Small', 'Medium', 'Large'].map(opt => (
                  <SelectCard key={opt} label={opt} isSelected={formData.jawSize === opt} onClick={() => updateField('jawSize', opt)} />
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4 border-t border-slate-100 pt-6">
            <Label className="text-sm font-bold text-slate-700">Ridge Shape</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">Upper Arch (U)</span>
                <div className="grid grid-cols-2 gap-2">
                  {['U shape', 'V shape', 'Undercut', 'Flat'].map(opt => (
                    <SelectCard key={`u-${opt}`} label={opt} isSelected={formData.ridgeShapeU === opt} onClick={() => updateField('ridgeShapeU', opt)} />
                  ))}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">Lower Arch (L)</span>
                <div className="grid grid-cols-2 gap-2">
                  {['U shape', 'V shape', 'Undercut', 'Flat'].map(opt => (
                    <SelectCard key={`l-${opt}`} label={opt} isSelected={formData.ridgeShapeL === opt} onClick={() => updateField('ridgeShapeL', opt)} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-100 pt-6">
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-sm font-bold text-slate-700">Ridge Relation</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['Class I', 'Class II', 'Class III', 'Crossbite'].map(opt => (
                    <SelectCard key={opt} label={opt} isSelected={formData.ridgeRelation === opt} onClick={() => updateField('ridgeRelation', opt)} />
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-sm font-bold text-slate-700">Ridge Parallelism</Label>
                <div className="grid grid-cols-2 gap-2">
                  {['Parallel', 'Divergent'].map(opt => (
                    <SelectCard key={opt} label={opt} isSelected={formData.ridgeParallelism === opt} onClick={() => updateField('ridgeParallelism', opt)} />
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-sm font-bold text-slate-700">Interridge Space</Label>
                <div className="grid grid-cols-2 gap-2">
                  {['Sufficient', 'Insufficient'].map(opt => (
                    <SelectCard key={opt} label={opt} isSelected={formData.interridgeSpace === opt} onClick={() => updateField('interridgeSpace', opt)} />
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-sm font-bold text-slate-700">Lower Arch Form</Label>
                <div className="grid grid-cols-3 gap-2">
                  {['Square', 'Taper', 'Ovoid'].map(opt => (
                    <SelectCard key={opt} label={opt} isSelected={formData.lowerArchForm === opt} onClick={() => updateField('lowerArchForm', opt)} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center gap-2">
          <Focus className="w-5 h-5 text-indigo-500" />
          <h3 className="font-semibold text-slate-800">2. Palatal & Throat Morphology</h3>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <Label className="text-sm font-bold text-slate-700">Palatal Vault</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:col-span-3">
              {['Average', 'Steep', 'V shape', 'Shallow'].map(opt => (
                <SelectCard key={opt} label={opt} isSelected={formData.palatalVault === opt} onClick={() => updateField('palatalVault', opt)} />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center border-t border-slate-100 pt-6">
            <Label className="text-sm font-bold text-slate-700">Palatal Throat Form</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:col-span-3">
              {[
                { id: 'class-i', label: 'Class I', subLabel: '5-13mm of PSS band' },
                { id: 'class-ii', label: 'Class II', subLabel: '3-5mm of PSS band' },
                { id: 'class-iii', label: 'Class III', subLabel: '<3mm of PSS band' },
              ].map(opt => (
                <SelectCard key={opt.id} label={opt.label} subLabel={opt.subLabel} isSelected={formData.palatalThroatForm === opt.id} onClick={() => updateField('palatalThroatForm', opt.id)} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden border-l-4 border-l-rose-500">
        <div className="bg-rose-50/50 border-b border-rose-100 px-6 py-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-500" />
          <h3 className="font-semibold text-rose-900">3. Anomalies & Attachments</h3>
        </div>

        <div className="p-6 md:p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-sm font-bold text-slate-700">Torus Present <span className="text-slate-400 font-normal ml-1">(Multi-select)</span></Label>
                <div className="grid grid-cols-2 gap-2">
                  {['Palatinus', 'Mandibularis'].map(opt => (
                    <SelectCard key={opt} label={opt} type="checkbox" isSelected={formData.torusPresent.includes(opt)} onClick={() => toggleArrayField('torusPresent', opt)} />
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-bold text-slate-700">Ridge Deformity <span className="text-slate-400 font-normal ml-1">(Multi-select)</span></Label>
                <div className="grid grid-cols-2 gap-2">
                  {['Exostosis', 'Bony spicule', 'Flabby tissue', 'Knife edge'].map(opt => (
                    <SelectCard key={opt} label={opt} type="checkbox" isSelected={formData.ridgeDeformity.includes(opt)} onClick={() => toggleArrayField('ridgeDeformity', opt)} />
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-bold text-slate-700">High Frenum Attachment <span className="text-slate-400 font-normal ml-1">(Multi-select)</span></Label>
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 h-[calc(100%-2rem)]">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Upper (U)</span>
                  {['Labial', 'Buccal L/R'].map(opt => (
                    <SelectCard key={`u-${opt}`} label={opt} type="checkbox" isSelected={formData.frenumU.includes(opt)} onClick={() => toggleArrayField('frenumU', opt)} />
                  ))}
                </div>
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Lower (L)</span>
                  {['Labial', 'Buccal L/R'].map(opt => (
                    <SelectCard key={`l-${opt}`} label={opt} type="checkbox" isSelected={formData.frenumL.includes(opt)} onClick={() => toggleArrayField('frenumL', opt)} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {(formData.ridgeDeformity.includes('Exostosis') || formData.ridgeDeformity.includes('Bony spicule')) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-slate-100 animate-in fade-in slide-in-from-top-2">
              {formData.ridgeDeformity.includes('Exostosis') && (
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-rose-500 uppercase tracking-wider">Exostosis Details</Label>
                  <Input
                    value={formData.exostosisDetail}
                    onChange={e => updateField('exostosisDetail', e.target.value)}
                    className="border-rose-200 focus-visible:ring-rose-500"
                    placeholder="Specify location/details..."
                  />
                </div>
              )}
              {formData.ridgeDeformity.includes('Bony spicule') && (
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-rose-500 uppercase tracking-wider">Bony Spicule Details</Label>
                  <Input
                    value={formData.bonySpiculeDetail}
                    onChange={e => updateField('bonySpiculeDetail', e.target.value)}
                    className="border-rose-200 focus-visible:ring-rose-500"
                    placeholder="Specify location..."
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center gap-2">
          <Droplets className="w-5 h-5 text-sky-500" />
          <h3 className="font-semibold text-slate-800">4. Soft Tissue & Environment</h3>
        </div>

        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-sm font-bold text-slate-700">Tongue Size</Label>
              <div className="grid grid-cols-3 gap-2">
                {['Small', 'Medium', 'Large'].map(opt => (
                  <SelectCard key={opt} label={opt} isSelected={formData.tongueSize === opt} onClick={() => updateField('tongueSize', opt)} />
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-bold text-slate-700">Tongue Position</Label>
              <div className="grid grid-cols-2 gap-2">
                {['Normal', 'Retracted'].map(opt => (
                  <SelectCard key={opt} label={opt} isSelected={formData.tonguePosition === opt} onClick={() => updateField('tonguePosition', opt)} />
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-bold text-slate-700">Lip Mobility</Label>
              <div className="grid grid-cols-3 gap-2">
                {['Normal', 'Highly active', 'Relatively inactive'].map(opt => (
                  <SelectCard key={opt} label={opt} isSelected={formData.lipMobility === opt} onClick={() => updateField('lipMobility', opt)} />
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-sm font-bold text-slate-700">Facial Muscle Tone</Label>
              <div className="grid grid-cols-3 gap-2">
                {['Tense', 'Average', 'Flaccid'].map(opt => (
                  <SelectCard key={opt} label={opt} isSelected={formData.facialMuscleTone === opt} onClick={() => updateField('facialMuscleTone', opt)} />
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-bold text-slate-700">Saliva Assessment</Label>
              <div className="grid grid-cols-2 gap-2">
                <SelectCard label="Normal Vol." isSelected={formData.amountOfSaliva === 'Normal'} onClick={() => updateField('amountOfSaliva', 'Normal')} />
                <SelectCard label="Xerostomia" isSelected={formData.amountOfSaliva === 'Xerostomia'} onClick={() => updateField('amountOfSaliva', 'Xerostomia')} />
                <SelectCard label="Thick" isSelected={formData.salivaConsistency === 'Thick'} onClick={() => updateField('salivaConsistency', 'Thick')} />
                <SelectCard label="Thin" isSelected={formData.salivaConsistency === 'Thin'} onClick={() => updateField('salivaConsistency', 'Thin')} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center gap-2">
          <Brain className="w-5 h-5 text-teal-600" />
          <h3 className="font-semibold text-slate-800">5. Mental Attitude</h3>
        </div>

        <div className="p-6 md:p-8 flex flex-col md:flex-row items-center gap-8">
          <div className="w-full md:w-1/3 space-y-1">
            <h4 className="font-bold text-slate-800">M.M. House Classification</h4>
            <p className="text-xs text-slate-500">Evaluation of the patient's psychological state and cooperation readiness.</p>
          </div>

          <div className="w-full md:w-2/3 grid grid-cols-2 gap-3">
            {[
              { label: 'Philosophical', desc: 'Rational & cooperative' },
              { label: 'Exacting', desc: 'Demanding & precise' },
              { label: 'Hysterical', desc: 'Anxious & pessimistic' },
              { label: 'Indifferent', desc: 'Unmotivated & apathetic' },
            ].map(opt => (
              <SelectCard
                key={opt.label}
                label={opt.label}
                subLabel={opt.desc}
                isSelected={formData.mentalAttitude === opt.label}
                onClick={() => updateField('mentalAttitude', opt.label)}
              />
            ))}
          </div>
        </div>
      </div>

      <SectionNotes
        sectionId="residualRidge"
        value={formData.note || ''}
        onChange={(val) => updateField('note', val)}
      />
    </div>
  );
}
