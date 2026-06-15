/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, ScanFace, Smile, Mic2, Loader2, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToggleButtonGroup } from '@/components/ui/ToggleButton';
import { VisualCard, TextCard } from './components/ChartUIComponents';
import { SectionNotes } from './components/SectionNotes';
import { estheticEvaluationService, type EstheticEvaluationPayload } from '@/services/estheticEvaluationService';
import { useToastStore } from '@/store/toastStore';
import { useSectionSave } from '@/hooks/useSectionSave';

interface EstheticEvaluationProps {
    chartId: string;
}

// Local form state representing the UI fields
interface LocalEstheticState {
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
    note: string;
}

const DEFAULT_STATE: LocalEstheticState = {
    occlusalPlane: 'parallel',
    facialMidline: 'symmetric',
    facialMidlineMm: '',
    lipFullness: 'average',
    lipLength: 'average',
    toothExpUpper: '',
    toothExpLower: '',
    nasolabialAngle: 'normal',
    smileLine: 'average',
    incisalCurve: 'convex',
    lipPosition: 'not-touching',
    teethExposed: '8',
    midlinePhiltrum: 'center',
    midlineIncisors: 'straight',
    buccalCorridor: 'normal',
    fvSound: 'yes',
    sSoundMm: '',
    sSoundRef: '',
    note: '',
};

export default function EstheticEvaluation({ chartId }: EstheticEvaluationProps) {
    const { show: showToast } = useToastStore();
    const [formData, setFormData] = useState<LocalEstheticState>(DEFAULT_STATE);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { markDirty, markClean, registerSave } = useSectionSave("esthetic");

    const formDataRef = useRef(formData);
    useEffect(() => { formDataRef.current = formData; }, [formData]);

    // Fetch initial data
    useEffect(() => {
        const fetchEval = async () => {
            if (!chartId) return;
            try {
                setLoading(true);
                const estheticData = await estheticEvaluationService.get(chartId);
                if (estheticData) {
                    const mapped = {
                        occlusalPlane: estheticData.occlusal_plane || 'parallel',
                        facialMidline: estheticData.midline_discrepancy || 'symmetric',
                        facialMidlineMm: estheticData.midline_shift?.toString() || '',
                        lipFullness: estheticData.lip_thickness || 'average',
                        lipLength: estheticData.lip_length || 'average',
                        toothExpUpper: estheticData.upper_tooth_exposure?.toString() || '',
                        toothExpLower: estheticData.lower_tooth_exposure?.toString() || '',
                        nasolabialAngle: estheticData.nasolabial_angle || 'normal',
                        smileLine: estheticData.dentofacial_analysis?.smile_line || 'average',
                        incisalCurve: estheticData.dentofacial_analysis?.incisal_curve || 'convex',
                        lipPosition: estheticData.dentofacial_analysis?.lip_position || 'not-touching',
                        teethExposed: estheticData.dentofacial_analysis?.teeth_exposed || '8',
                        midlinePhiltrum: estheticData.dentofacial_analysis?.midline_philtrum || 'center',
                        midlineIncisors: estheticData.dentofacial_analysis?.midline_incisors || 'straight',
                        buccalCorridor: estheticData.dentofacial_analysis?.buccal_corridor || 'normal',
                        fvSound: estheticData.fv_sound !== null ? (estheticData.fv_sound ? 'yes' : 'no') : 'yes',
                        sSoundMm: estheticData.closest_speaking?.toString() || '',
                        sSoundRef: estheticData.reference_teeth ? estheticData.reference_teeth.join(', ') : '',
                        note: estheticData.note || '',
                    };
                    setFormData(mapped);
                }
            } catch (err) {
                console.error("Failed to fetch esthetic evaluation", err);
                showToast("Failed to load esthetic evaluation.", "error");
            } finally {
                setLoading(false);
                registerSave(async () => {
                    const d = formDataRef.current;
                    setSaving(true);
                    try {
                        const payload: EstheticEvaluationPayload = {
                            occlusal_plane: d.occlusalPlane,
                            midline_discrepancy: d.facialMidline,
                            midline_shift: d.facialMidlineMm ? parseFloat(d.facialMidlineMm) : null,
                            lip_thickness: d.lipFullness,
                            lip_length: d.lipLength,
                            upper_tooth_exposure: d.toothExpUpper ? parseFloat(d.toothExpUpper) : null,
                            lower_tooth_exposure: d.toothExpLower ? parseFloat(d.toothExpLower) : null,
                            nasolabial_angle: d.nasolabialAngle,
                            fv_sound: d.fvSound === 'yes',
                            closest_speaking: d.sSoundMm ? parseFloat(d.sSoundMm) : null,
                            reference_teeth: d.sSoundRef ? d.sSoundRef.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n)) : null,
                            dentofacial_analysis: {
                                smile_line: d.smileLine,
                                incisal_curve: d.incisalCurve,
                                lip_position: d.lipPosition,
                                teeth_exposed: d.teethExposed,
                                midline_philtrum: d.midlinePhiltrum,
                                midline_incisors: d.midlineIncisors,
                                buccal_corridor: d.buccalCorridor,
                            },
                            note: d.note,
                        };
                        await estheticEvaluationService.upsert(chartId, payload);
                    } catch (err) {
                        showToast("Failed to save esthetic evaluation.", "error");
                        throw err;
                    } finally {
                        setSaving(false);
                    }
                });
                markClean();
            }
        };

        fetchEval();
    }, [chartId, showToast, registerSave, markClean]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateField = (field: keyof LocalEstheticState, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        markDirty();
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20 text-teal-600">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 relative">
            
            <div className="border-b border-slate-200 pb-4 flex items-start justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                        <Sparkles className="w-8 h-8 text-teal-600" />
                        Esthetic Evaluation
                    </h2>
                    <p className="text-slate-500 mt-1">Facial analysis, smile line, and phonetic assessment.</p>
                </div>
                {saving && <span className="text-sm text-slate-400 italic flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></div> Saving...</span>}
            </div>

            {/* --- Section 1: Facial Analysis --- */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center gap-2">
                    <ScanFace className="w-5 h-5 text-indigo-500" />
                    <h3 className="font-semibold text-slate-800">1. Facial Analysis</h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4 md:col-span-2">
                        <Label className="text-sm font-bold text-teal-400 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span> Occlusal plane to interpupillary line
                        </Label>
                        <div className="grid grid-cols-3 gap-4">
                            <VisualCard id="parallel" label="Parallel" imagePath="/Plane/pararell.png" isSelected={formData.occlusalPlane === 'parallel'} onClick={() => updateField('occlusalPlane', 'parallel')} iconClassName="w-full aspect-square object-cover" />
                            <VisualCard id="canted_right" label="Canted Right" imagePath="/Plane/right.png" isSelected={formData.occlusalPlane === 'canted_right'} onClick={() => updateField('occlusalPlane', 'canted_right')} iconClassName="w-full aspect-square object-cover" />
                            <VisualCard id="canted_left" label="Canted Left" imagePath="/Plane/left.png" isSelected={formData.occlusalPlane === 'canted_left'} onClick={() => updateField('occlusalPlane', 'canted_left')} iconClassName="w-full aspect-square object-cover" />
                        </div>
                    </div>

                    <div className="space-y-4 md:col-span-2">
                        <Label className="text-sm font-bold text-teal-400 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span> Nasolabial Angle
                        </Label>
                        <div className="grid grid-cols-3 gap-4">
                            <VisualCard id="normal" label="Normal (~90°)" imagePath="/Nasolabial Angle/90.png" isSelected={formData.nasolabialAngle === 'normal'} onClick={() => updateField('nasolabialAngle', 'normal')} iconClassName="w-full aspect-square object-cover" />
                            <VisualCard id="prominent_maxilla" label="Prominent (<90°)" imagePath="/Nasolabial Angle/70.png" isSelected={formData.nasolabialAngle === 'prominent_maxilla'} onClick={() => updateField('nasolabialAngle', 'prominent_maxilla')} iconClassName="w-full aspect-square object-cover" />
                            <VisualCard id="retruded_maxilla" label="Retruded (>90°)" imagePath="/Nasolabial Angle/100.png" isSelected={formData.nasolabialAngle === 'retruded_maxilla'} onClick={() => updateField('nasolabialAngle', 'retruded_maxilla')} iconClassName="w-full aspect-square object-cover" />
                        </div>
                    </div>

                    <div className="space-y-3 md:col-span-2 border-t border-slate-100 pt-6">
                        <Label className="text-sm font-bold text-slate-700">Facial midline and dental midline discrepancy</Label>
                        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                            <div className="grid grid-cols-3 gap-2 flex-1 w-full">
                                {[
                                    { id: 'symmetric', label: 'Symmetric' },
                                    { id: 'right_shift', label: 'Right Shift' },
                                    { id: 'left_shift', label: 'Left Shift' }
                                ].map(opt => (
                                    <TextCard
                                        key={opt.id}
                                        label={opt.label}
                                        isSelected={formData.facialMidline === opt.id}
                                        onClick={() => {
                                            updateField('facialMidline', opt.id);
                                            if (opt.id === 'symmetric') updateField('facialMidlineMm', '');
                                        }}
                                    />
                                ))}
                            </div>

                            {formData.facialMidline !== 'symmetric' && (
                                <div className="relative w-full mt-3 md:mt-0 md:w-32 animate-in fade-in zoom-in-95 duration-200">
                                    <Input
                                        type="number"
                                        value={formData.facialMidlineMm}
                                        onChange={(e) => updateField('facialMidlineMm', e.target.value)}
                                        className="w-full pr-10 border-slate-200"
                                        placeholder="e.g. 2"
                                        autoFocus
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-semibold">mm</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Section 2: Lip at Rest --- */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21c-4.4 0-8-3.6-8-8 0-2.8 1.5-5.3 3.8-6.7C8.5 5.5 10.2 5 12 5s3.5.5 4.2 1.3C18.5 7.7 20 10.2 20 13c0 4.4-3.6 8-8 8z" /><path d="M12 11c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" /></svg>
                    <h3 className="font-semibold text-slate-800">2. Lip at Rest</h3>
                </div>
                <div className="p-6 flex flex-col gap-8">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row items-center gap-6">
                        <div className="w-full sm:w-1/3 shrink-0">
                            <img
                                src="/LipLenght.png"
                                alt="Lip length measurement guide"
                                className="w-full h-auto rounded-lg object-contain bg-white border border-slate-100 shadow-sm"
                            />
                        </div>
                        <div className="flex-1 space-y-2 text-center sm:text-left">
                            <Label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Lip Measurement Guide</Label>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                Measure from <b>subnasale</b> (base of nose) to <b>stomion</b> (bottom edge of upper lip). Record in millimeters.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <Label className="text-sm font-bold text-slate-700">Lip Fullness</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['Full', 'Average', 'Thin'].map(opt => (
                                        <TextCard key={opt} label={opt} isSelected={formData.lipFullness === opt.toLowerCase()} onClick={() => updateField('lipFullness', opt.toLowerCase())} />
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-3">
                                <Label className="text-sm font-bold text-slate-700">Lip Length</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['Long', 'Average', 'Short'].map(opt => (
                                        <TextCard key={opt} label={opt} isSelected={formData.lipLength === opt.toLowerCase()} onClick={() => updateField('lipLength', opt.toLowerCase())} />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 md:border-l md:border-slate-100 md:pl-8">
                            <Label className="text-sm font-bold text-slate-700">Tooth Exposure at Rest</Label>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <span className="w-16 text-sm font-semibold text-slate-500">Upper</span>
                                    <div className="relative flex-1">
                                        <Input
                                            type="number"
                                            value={formData.toothExpUpper}
                                            onChange={(e) => updateField('toothExpUpper', e.target.value)}
                                            className="w-full border-slate-200 pr-10"
                                            placeholder="e.g. 2"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-semibold">mm</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="w-16 text-sm font-semibold text-slate-500">Lower</span>
                                    <div className="relative flex-1">
                                        <Input
                                            type="number"
                                            value={formData.toothExpLower}
                                            onChange={(e) => updateField('toothExpLower', e.target.value)}
                                            className="w-full border-slate-200 pr-10"
                                            placeholder="e.g. 2"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-semibold">mm</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Section 3: Dentofacial Analysis --- */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center gap-2">
                    <Smile className="w-5 h-5 text-teal-500" />
                    <h3 className="font-semibold text-slate-800">3. Dentofacial Analysis</h3>
                </div>

                <div className="p-6 lg:p-10 space-y-10">

                    {/* Smile Line */}
                    <div className="space-y-4">
                        <Label className="text-sm font-bold text-teal-400 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span> Smile Line
                        </Label>
                        <div className="grid grid-cols-3 gap-3">
                            <VisualCard id="average" label="Average" imagePath="/Dentofacial Analysis/avg.png" isSelected={formData.smileLine === 'average'} onClick={() => updateField('smileLine', 'average')} iconClassName="w-full h-24 sm:h-28 object-contain" />
                            <VisualCard id="high" label="High" imagePath="/Dentofacial Analysis/high.png" isSelected={formData.smileLine === 'high'} onClick={() => updateField('smileLine', 'high')} iconClassName="w-full h-24 sm:h-28 object-contain" />
                            <VisualCard id="low" label="Low" imagePath="/Dentofacial Analysis/Low.png" isSelected={formData.smileLine === 'low'} onClick={() => updateField('smileLine', 'low')} iconClassName="w-full h-24 sm:h-28 object-contain" />
                        </div>
                    </div>

                    {/* Incisal Silhouette */}
                    <div className="space-y-4 pt-10 border-t border-slate-100">
                        <Label className="text-sm font-bold text-teal-400 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span> Incisal Silhouette
                        </Label>
                        <div className="grid grid-cols-3 gap-3">
                            <VisualCard id="convex" label="Convex Curve" imagePath="/Dentofacial Analysis/ConvexCurve.jpeg" isSelected={formData.incisalCurve === 'convex'} onClick={() => updateField('incisalCurve', 'convex')} iconClassName="w-full h-24 sm:h-28 object-contain" />
                            <VisualCard id="straight" label="Straight" imagePath="/Dentofacial Analysis/Straight.jpeg" isSelected={formData.incisalCurve === 'straight'} onClick={() => updateField('incisalCurve', 'straight')} iconClassName="w-full h-24 sm:h-28 object-contain" />
                            <VisualCard id="reverse" label="Reverse" imagePath="/Dentofacial Analysis/Reverse.jpeg" isSelected={formData.incisalCurve === 'reverse'} onClick={() => updateField('incisalCurve', 'reverse')} iconClassName="w-full h-24 sm:h-28 object-contain" />
                        </div>
                    </div>

                    {/* Midline (Philtrum) */}
                    <div className="space-y-4 pt-10 border-t border-slate-100">
                        <Label className="text-sm font-bold text-teal-400 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span> Midline (Philtrum)
                        </Label>
                        <div className="grid grid-cols-3 gap-3">
                            <VisualCard id="center" label="Center" imagePath="/Dentofacial Analysis/center.jpeg" isSelected={formData.midlinePhiltrum === 'center'} onClick={() => updateField('midlinePhiltrum', 'center')} iconClassName="w-full h-24 sm:h-28 object-contain" />
                            <VisualCard id="right" label="Right" imagePath="/Dentofacial Analysis/Right of center.jpeg" isSelected={formData.midlinePhiltrum === 'right'} onClick={() => updateField('midlinePhiltrum', 'right')} iconClassName="w-full h-24 sm:h-28 object-contain" />
                            <VisualCard id="left" label="Left" imagePath="/Dentofacial Analysis/Left of center.jpeg" isSelected={formData.midlinePhiltrum === 'left'} onClick={() => updateField('midlinePhiltrum', 'left')} iconClassName="w-full h-24 sm:h-28 object-contain" />
                        </div>
                    </div>

                    {/* Teeth Exposed (Full Smile) */}
                    <div className="space-y-4 pt-10 border-t border-slate-100">
                        <Label className="text-sm font-bold text-teal-400 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span> Teeth Exposed (Full Smile)
                        </Label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <VisualCard id="6" label="6 Teeth" imagePath="/Dentofacial Analysis/6.jpeg" isSelected={formData.teethExposed === '6'} onClick={() => updateField('teethExposed', '6')} iconClassName="w-full h-24 sm:h-28 object-contain" />
                            <VisualCard id="8" label="8 Teeth" imagePath="/Dentofacial Analysis/8.jpeg" isSelected={formData.teethExposed === '8'} onClick={() => updateField('teethExposed', '8')} iconClassName="w-full h-24 sm:h-28 object-contain" />
                            <VisualCard id="10" label="10 Teeth" imagePath="/Dentofacial Analysis/10.jpeg" isSelected={formData.teethExposed === '10'} onClick={() => updateField('teethExposed', '10')} iconClassName="w-full h-24 sm:h-28 object-contain" />
                            <VisualCard id="16" label="16 Teeth" imagePath="/Dentofacial Analysis/16.jpeg" isSelected={formData.teethExposed === '16'} onClick={() => updateField('teethExposed', '16')} iconClassName="w-full h-24 sm:h-28 object-contain" />
                        </div>
                    </div>

                    {/* Tooth-Lower Lip Position */}
                    <div className="space-y-4 pt-10 border-t border-slate-100">
                        <Label className="text-sm font-bold text-teal-400 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span> Tooth-Lower Lip Position
                        </Label>
                        <div className="grid grid-cols-3 gap-3">
                            <VisualCard id="touching" label="Touching" imagePath="/Dentofacial Analysis/Touching.jpeg" isSelected={formData.lipPosition === 'touching'} onClick={() => updateField('lipPosition', 'touching')} iconClassName="w-full h-24 sm:h-28 object-contain" />
                            <VisualCard id="not-touching" label="Not Touching" imagePath="/Dentofacial Analysis/Not touching.jpeg" isSelected={formData.lipPosition === 'not-touching'} onClick={() => updateField('lipPosition', 'not-touching')} iconClassName="w-full h-24 sm:h-28 object-contain" />
                            <VisualCard id="slightly-covered" label="Covered" imagePath="/Dentofacial Analysis/Slightly coverage.jpeg" isSelected={formData.lipPosition === 'slightly-covered'} onClick={() => updateField('lipPosition', 'slightly-covered')} iconClassName="w-full h-24 sm:h-28 object-contain" />
                        </div>
                    </div>

                    {/* Upper & Lower Midline */}
                    <div className="space-y-4 pt-10 border-t border-slate-100">
                        <Label className="text-sm font-bold text-teal-400 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span> Upper & Lower Midline
                        </Label>
                        <div className="grid grid-cols-3 gap-3">
                            <VisualCard id="right" label="Right" imagePath="/Dentofacial Analysis/Right.jpeg" isSelected={formData.midlineIncisors === 'right'} onClick={() => updateField('midlineIncisors', 'right')} iconClassName="w-full h-24 sm:h-28 object-contain" />
                            <VisualCard id="left" label="Left" imagePath="/Dentofacial Analysis/Left.jpeg" isSelected={formData.midlineIncisors === 'left'} onClick={() => updateField('midlineIncisors', 'left')} iconClassName="w-full h-24 sm:h-28 object-contain" />
                            <VisualCard id="straight" label="Straight" imagePath="/Dentofacial Analysis/Stright midline.jpeg" isSelected={formData.midlineIncisors === 'straight'} onClick={() => updateField('midlineIncisors', 'straight')} iconClassName="w-full h-24 sm:h-28 object-contain" />
                        </div>
                    </div>

                    {/* Buccal Corridor */}
                    <div className="space-y-4 pt-10 border-t border-slate-100">
                        <Label className="text-sm font-bold text-teal-400 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span> Buccal Corridor
                        </Label>
                        <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
                            <VisualCard id="normal" label="Normal" imagePath="/Dentofacial Analysis/Normal corridor.jpeg" isSelected={formData.buccalCorridor === 'normal'} onClick={() => updateField('buccalCorridor', 'normal')} iconClassName="w-full h-32 sm:h-40 object-contain p-2" />
                            <VisualCard id="increased" label="Increased" imagePath="/Dentofacial Analysis/Increased.jpeg" isSelected={formData.buccalCorridor === 'increased'} onClick={() => updateField('buccalCorridor', 'increased')} iconClassName="w-full h-32 sm:h-40 object-contain p-2" />
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Section 4: Phonetics --- */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center gap-2">
                    <Mic2 className="w-5 h-5 text-amber-500" />
                    <h3 className="font-semibold text-slate-800">4. Phonetics</h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    <div className="space-y-4">
                        <div className="flex flex-col gap-2">
                            <Label className="text-base font-bold text-slate-800">F-V Sound</Label>
                            <span className="text-sm text-slate-500">Incisal edge of maxillary centrals on wet/dry line of lower lip?</span>
                        </div>
                        <ToggleButtonGroup
                            value={formData.fvSound}
                            onChange={(v) => updateField('fvSound', v)}
                            options={[
                                { value: 'yes', label: 'Yes' },
                                { value: 'no', label: 'No' }
                            ]}
                            name="fvSound"
                        />
                    </div>

                    <div className="space-y-4 md:border-l md:border-slate-100 md:pl-8">
                        <Label className="text-base font-bold text-slate-800">Closest speaking space (S Sound)</Label>
                        <div className="space-y-4 pt-1">
                            <div className="relative w-full">
                                <Input
                                    type="number"
                                    value={formData.sSoundMm}
                                    onChange={(e) => updateField('sSoundMm', e.target.value)}
                                    className="pr-10 border-slate-200 focus-visible:ring-amber-500"
                                    placeholder="e.g. 2"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-semibold">mm</span>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-400 uppercase">Reference Teeth</Label>
                                <Input value={formData.sSoundRef} onChange={e => updateField('sSoundRef', e.target.value)} className="bg-white focus-visible:ring-amber-500" placeholder="e.g., 11, 21, 31, 41" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <SectionNotes 
                sectionId="esthetic" 
                value={formData.note || ""} 
                onChange={(val) => updateField("note", val)} 
            />
        </div>
    );
}
