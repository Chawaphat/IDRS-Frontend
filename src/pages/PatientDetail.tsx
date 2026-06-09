
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Upload, Trash2, X, ChevronRight, AlertCircle, FileText, HeartPulse, Stethoscope, UserSquare2, Activity, Zap, Info, Sparkles, ScanFace, Smile, Mic2, Ruler, AlertTriangle, UserMinus, Focus, Layers, Droplets, Brain, Maximize, CalendarDays, Clock, PanelLeftClose, PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ToggleButtonGroup } from '@/components/ui/ToggleButton';
import { cn } from '@/lib/utils';
import { Image as ImageIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import OdontogramUI from '@/components/odontogram/OdontogramUI';
import OcclusalAnalysis from '@/components/OcclusalAnalysis';
import { FaceMuscleChart } from '@/components/FaceMuscleChart';
import { RankedExpectationSelector } from '@/components/RankedExpectationSelector';
import { FacialSymmetry } from '@/components/FacialSymmetry';
import { FacialProfile } from '@/components/FacialProfile';

import { patientService, type BackendPatient, type ImageManagement } from '@/services/patientService';
import { dentalChartService } from '@/services/dentalChartService';
import { sectionNoteService } from '@/services/sectionNoteService';
import type { DentalChart } from '@/services/types/dentalChart';
import { useToastStore } from '@/store/toastStore';
import MedicalHistoryForm from '@/components/chart/MedicalHistoryForm';
import ExtraoralExamForm from '@/components/chart/ExtraoralExamForm';

const MedicalIcon = ({ type, className }: { type: string; className?: string }) => {
    const base = "w-full h-16 sm:h-20 mb-2 rounded-lg border bg-slate-50 flex items-center justify-center p-2 transition-colors";

    const renderGraphic = () => {
        switch (type) {
            case 'smile-avg':
                return <svg viewBox="0 0 100 50" className="w-16 h-8"><path d="M10 25 Q50 45 90 25 Q50 35 10 25" fill="#fff" stroke="#94a3b8" strokeWidth="2" /><path d="M15 26 Q50 40 85 26" fill="none" stroke="#cbd5e1" strokeWidth="1" /></svg>;
            case 'smile-high':
                return <svg viewBox="0 0 100 50" className="w-16 h-8"><path d="M10 25 Q50 45 90 25 L90 15 Q50 35 10 15 Z" fill="#fbcfe8" stroke="#f9a8d4" strokeWidth="1" /><path d="M10 25 Q50 45 90 25 Q50 35 10 25" fill="#fff" stroke="#94a3b8" strokeWidth="2" /></svg>;
            case 'smile-low':
                return <svg viewBox="0 0 100 50" className="w-16 h-8"><path d="M10 15 Q50 35 90 15 Q50 25 10 15" fill="#fff" stroke="#94a3b8" strokeWidth="2" /></svg>;
            case 'curve-convex':
                return <svg viewBox="0 0 100 40" className="w-16 h-8"><path d="M20 10 Q50 35 80 10" fill="none" stroke="#0f766e" strokeWidth="3" strokeLinecap="round" /><rect x="42" y="5" width="16" height="20" rx="2" fill="#fff" stroke="#94a3b8" /><rect x="25" y="5" width="14" height="15" rx="2" fill="#fff" stroke="#94a3b8" /><rect x="61" y="5" width="14" height="15" rx="2" fill="#fff" stroke="#94a3b8" /></svg>;
            case 'curve-straight':
                return <svg viewBox="0 0 100 40" className="w-16 h-8"><path d="M20 25 L80 25" fill="none" stroke="#0f766e" strokeWidth="3" strokeLinecap="round" /><rect x="42" y="5" width="16" height="17" rx="2" fill="#fff" stroke="#94a3b8" /><rect x="25" y="5" width="14" height="17" rx="2" fill="#fff" stroke="#94a3b8" /><rect x="61" y="5" width="14" height="17" rx="2" fill="#fff" stroke="#94a3b8" /></svg>;
            case 'curve-reverse':
                return <svg viewBox="0 0 100 40" className="w-16 h-8"><path d="M20 30 Q50 10 80 30" fill="none" stroke="#0f766e" strokeWidth="3" strokeLinecap="round" /><rect x="42" y="5" width="16" height="12" rx="2" fill="#fff" stroke="#94a3b8" /><rect x="25" y="5" width="14" height="18" rx="2" fill="#fff" stroke="#94a3b8" /><rect x="61" y="5" width="14" height="18" rx="2" fill="#fff" stroke="#94a3b8" /></svg>;
            case 'mid-center':
                return <svg viewBox="0 0 100 40" className="w-16 h-8"><rect x="10" y="10" width="80" height="20" rx="4" fill="#fff" stroke="#94a3b8" /><line x1="50" y1="0" x2="50" y2="40" stroke="#ef4444" strokeWidth="2" strokeDasharray="4" /></svg>;
            case 'mid-left':
                return <svg viewBox="0 0 100 40" className="w-16 h-8"><rect x="10" y="10" width="80" height="20" rx="4" fill="#fff" stroke="#94a3b8" /><line x1="65" y1="0" x2="65" y2="40" stroke="#ef4444" strokeWidth="2" strokeDasharray="4" /></svg>;
            case 'mid-right':
                return <svg viewBox="0 0 100 40" className="w-16 h-8"><rect x="10" y="10" width="80" height="20" rx="4" fill="#fff" stroke="#94a3b8" /><line x1="35" y1="0" x2="35" y2="40" stroke="#ef4444" strokeWidth="2" strokeDasharray="4" /></svg>;
            case 'teeth-6':
                return <svg viewBox="0 0 100 30" className="w-16 h-6"><path d="M25 15 Q50 25 75 15" fill="none" stroke="#94a3b8" strokeWidth="8" strokeLinecap="round" strokeDasharray="2 10" /></svg>;
            case 'teeth-8':
                return <svg viewBox="0 0 100 30" className="w-16 h-6"><path d="M15 10 Q50 25 85 10" fill="none" stroke="#94a3b8" strokeWidth="8" strokeLinecap="round" strokeDasharray="2 10" /></svg>;
            case 'teeth-10':
                return <svg viewBox="0 0 100 30" className="w-16 h-6"><path d="M5 5 Q50 25 95 5" fill="none" stroke="#94a3b8" strokeWidth="8" strokeLinecap="round" strokeDasharray="2 10" /></svg>;
            case 'teeth-16':
                return <svg viewBox="0 0 100 30" className="w-16 h-6"><path d="M0 5 Q50 25 100 5 M0 25 Q50 5 100 25" fill="none" stroke="#94a3b8" strokeWidth="6" strokeLinecap="round" strokeDasharray="2 8" /></svg>;
            case 'lip-touching':
                return <svg viewBox="0 0 100 40" className="w-16 h-8"><path d="M15 10 Q50 35 85 10" fill="#fff" stroke="#94a3b8" strokeWidth="2" /><path d="M10 15 Q50 35 90 15" fill="none" stroke="#f43f5e" strokeWidth="3" strokeLinecap="round" /></svg>;
            case 'lip-not-touching':
                return <svg viewBox="0 0 100 40" className="w-16 h-8"><path d="M20 10 Q50 25 80 10" fill="#fff" stroke="#94a3b8" strokeWidth="2" /><path d="M10 20 Q50 40 90 20" fill="none" stroke="#f43f5e" strokeWidth="3" strokeLinecap="round" /></svg>;
            case 'lip-covered':
                return <svg viewBox="0 0 100 40" className="w-16 h-8"><path d="M15 10 Q50 45 85 10" fill="#fff" stroke="#94a3b8" strokeWidth="2" /><path d="M10 25 Q50 20 90 25 Q50 38 10 25" fill="#fbcfe8" stroke="#f43f5e" strokeWidth="1" /></svg>;
            case 'mid-ul-right':
                return <svg viewBox="0 0 100 40" className="w-16 h-8"><rect x="15" y="5" width="70" height="15" rx="2" fill="#fff" stroke="#94a3b8" /><rect x="25" y="20" width="50" height="15" rx="2" fill="#fff" stroke="#94a3b8" /><line x1="56" y1="2" x2="56" y2="20" stroke="#ef4444" strokeWidth="1.5" /><line x1="50" y1="20" x2="50" y2="38" stroke="#3b82f6" strokeWidth="1.5" /></svg>;
            case 'mid-ul-left':
                return <svg viewBox="0 0 100 40" className="w-16 h-8"><rect x="15" y="5" width="70" height="15" rx="2" fill="#fff" stroke="#94a3b8" /><rect x="25" y="20" width="50" height="15" rx="2" fill="#fff" stroke="#94a3b8" /><line x1="44" y1="2" x2="44" y2="20" stroke="#ef4444" strokeWidth="1.5" /><line x1="50" y1="20" x2="50" y2="38" stroke="#3b82f6" strokeWidth="1.5" /></svg>;
            case 'mid-ul-straight':
                return <svg viewBox="0 0 100 40" className="w-16 h-8"><rect x="15" y="5" width="70" height="15" rx="2" fill="#fff" stroke="#94a3b8" /><rect x="25" y="20" width="50" height="15" rx="2" fill="#fff" stroke="#94a3b8" /><line x1="50" y1="2" x2="50" y2="38" stroke="#10b981" strokeWidth="1.5" /></svg>;
            case 'buccal-normal':
                return <svg viewBox="0 0 100 40" className="w-16 h-8"><path d="M5 20 Q50 45 95 20 Q50 5 5 20" fill="#1e293b" /><path d="M12 20 Q50 38 88 20 Q50 10 12 20" fill="#fff" stroke="#94a3b8" strokeWidth="1" /></svg>;
            case 'buccal-increased':
                return <svg viewBox="0 0 100 40" className="w-16 h-8"><path d="M5 20 Q50 45 95 20 Q50 5 5 20" fill="#1e293b" /><path d="M28 20 Q50 35 72 20 Q50 12 28 20" fill="#fff" stroke="#94a3b8" strokeWidth="1" /></svg>;
            default:
                return <div className="w-8 h-8 rounded-full bg-slate-200" />;
        }
    };

    return <div className={cn(base, className)}>{renderGraphic()}</div>;
};

const TextCard = ({ label, isSelected, onClick }: { label: string; isSelected: boolean; onClick: () => void }) => (
    <div
        onClick={onClick}
        className={cn(
            "px-3 py-2.5 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-center text-sm font-bold text-center",
            isSelected ? "border-teal-500 bg-teal-50 text-teal-900 shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
        )}
    >
        {label}
    </div>
);



const sectionNames: Record<string, string> = {
    images: 'Images',
    patientHistory: 'Patient History',
    extraoral: 'Extraoral Exam',
    esthetic: 'Esthetic Evaluation',
    vdo: 'VDO Evaluation',
    occlusal: 'Occlusal Analysis',
    residualRidge: 'Residual Ridge Area'
};

const SectionNotes = ({ sectionId, formData, updateField }: { sectionId: string, formData: FormState, updateField: (k: keyof FormState, v: unknown) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showAttention, setShowAttention] = useState(true);
    const popoverRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const value = formData.sectionNotes?.[sectionId] || '';
    const sectionName = sectionNames[sectionId] || 'Section';

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowAttention(false);
        }, 6000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.focus();
                    textareaRef.current.setSelectionRange(
                        textareaRef.current.value.length,
                        textareaRef.current.value.length
                    );
                }
            }, 50);
        }
    }, [isOpen]);

    return (
        <div className="fixed right-6 md:right-8 bottom-6 md:bottom-8 z-40" ref={popoverRef}>
            {/* Attention Grabber Speech Bubble */}
            {showAttention && !value && !isOpen && (
                <div className="absolute right-0 bottom-14 md:bottom-16 z-50 flex flex-col items-end animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="bg-slate-900 text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-2xl flex items-center gap-2 whitespace-nowrap border border-slate-800">
                        <span className="flex h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse"></span>
                        <span>Add clinical notes for {sectionName}!</span>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowAttention(false);
                            }}
                            className="ml-1 rounded-full p-0.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                            title="Dismiss"
                        >
                            <X size={12} />
                        </button>
                    </div>
                    {/* Arrow pointing down into the button */}
                    <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-slate-900 mr-5 md:mr-6"></div>
                </div>
            )}

            <button
                type="button"
                onClick={() => {
                    setIsOpen(!isOpen);
                    setShowAttention(false);
                }}
                title={value ? `${sectionName} Note (Note exists)` : `Add ${sectionName} Note`}
                aria-label={value ? `${sectionName} Note (Note exists)` : `Add ${sectionName} Note`}
                className={cn(
                    "flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-full transition-all duration-300 shadow-xl border focus:outline-none focus:ring-4 focus:ring-teal-500/20 group relative hover:scale-105 active:scale-95",
                    value
                        ? "bg-gradient-to-br from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white border-teal-600 shadow-teal-500/20"
                        : "bg-gradient-to-br from-teal-50 to-white hover:from-teal-100 hover:to-teal-50 text-teal-600 border-teal-200 shadow-slate-200/50"
                )}
            >
                <FileText className="w-5 h-5 md:w-6 h-6" />
                
                {/* Glowing alert outer ring for attention */}
                {!value && !isOpen && (
                    <span className="absolute -inset-1 rounded-full bg-teal-400/10 animate-pulse pointer-events-none -z-10"></span>
                )}

                {value && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75"></span>
                        <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-teal-500 border border-white"></span>
                    </span>
                )}
                
                {/* Expand label on hover */}
                <span className="absolute right-14 md:right-16 bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap shadow-md">
                    {value ? `Edit ${sectionName} Note` : `Add ${sectionName} Note`}
                </span>
            </button>

            {isOpen && (
                <div className="absolute right-0 bottom-16 md:bottom-20 z-50 w-80 md:w-96 max-w-[calc(100vw-48px)] rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl transition-all duration-200 animate-in fade-in slide-in-from-bottom-4">
                    <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-teal-500" /> {sectionName} Note
                        </span>
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                            title="Close"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={(e) => updateField('sectionNotes', { ...formData.sectionNotes, [sectionId]: e.target.value })}
                        placeholder={`Type additional clinical notes for ${sectionName.toLowerCase()}...`}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-300 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 min-h-[140px] resize-y shadow-inner"
                    />
                    <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                        <span>Saved automatically</span>
                        {value && (
                            <button
                                type="button"
                                onClick={() => {
                                    updateField('sectionNotes', { ...formData.sectionNotes, [sectionId]: '' });
                                    setIsOpen(false);
                                }}
                                className="text-rose-500 hover:text-rose-600 hover:underline font-semibold"
                            >
                                Clear Note
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const VisualCard = ({ id, label, svgType, imagePath, isSelected, onClick, cardClassName, iconClassName }: { id: string; label: string; svgType?: string; imagePath?: string; isSelected: boolean; onClick: () => void; cardClassName?: string; iconClassName?: string }) => (
    <div
        data-id={id}
        onClick={onClick}
        className={cn(
            "p-3 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center justify-center text-sm font-bold text-center group",
            isSelected ? "border-teal-500 bg-teal-50 text-teal-900 shadow-md ring-2 ring-teal-100 ring-offset-1" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50",
            cardClassName
        )}
    >
        {imagePath ? (
            <img
                src={imagePath}
                alt={label}
                className={cn("mb-3 object-contain rounded-lg border-2 transition-colors", isSelected ? "border-teal-300" : "border-slate-100 group-hover:border-slate-200", iconClassName)}
            />
        ) : (
            <MedicalIcon type={svgType || ""} className={cn(isSelected ? "border-teal-200 bg-white" : "border-slate-100 group-hover:border-slate-200", iconClassName)} />
        )}
        <span>{label}</span>
    </div>
);

const SECTIONS = [
    { id: 'patientHistory', title: 'Patient History' },
    { id: 'extraoral', title: 'Extraoral Exam' },
];

interface Medication {
    id: string;
    name: string;
    dose: string;
    frequency: string;
    dosePerTime: string;
    timeOfDay: string;
}

interface FormState {
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

const DEFAULT_STATE: FormState = {
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

const MOCK_JANE_DOE_STATE: FormState = {
    ...DEFAULT_STATE,
    // Patient History
    chiefComplaint: 'Toothache in lower left quadrant for the past 3 days. Pain increases when drinking cold water.',
    presentIllness: 'Patient reports sharp pain on tooth #36 when exposed to cold or sweet foods. No spontaneous pain at night. Pain subsides after a few minutes.',
    medicalHistory: 'Generally healthy. No history of systemic diseases.',
    medications: [
        { id: 'm1', name: 'Ibuprofen', dose: '400mg', frequency: 'PRN', dosePerTime: '1 tablet', timeOfDay: 'When experiencing pain' }
    ],
    seeDoctorRegularly: 'yes',
    regularDoctorMonths: '6',
    clinicName: 'HealthPlus Clinic',
    allergyStatus: 'allergic',
    allergyDetails: 'Penicillin - Causes rash and swelling.',
    dentalHistory: 'Regular checkups every 6 months. Had orthodontic treatment in teens. Last cleaning was 1 year ago.',
    patientExpectation: ['function', 'esthetic', 'pain-relief'],
    otherExpectation: 'Wants the tooth colored filling to match perfectly.',
    selfEvaluation: 'Feels her oral hygiene could be better, admits to not flossing daily.',
    expectedOutcomeDetail: 'Wants to chew normally on the left side again without pain.',

    // Prosthodontic / Denture History
    edentulousTime: 'N/A',
    previousDentureCount: '0',
    presentDentureAge: 'N/A',
    dentureComplaint: 'No dentures present.',

    // Extraoral Exam
    facialSymmetry: 'symmetry',
    facialProfile: 'straight',
    musclePain: ['masseter'],
    jointPain: ['left'],
    jointSound: 'click',
    jawDeviation: 'left',
    jawDeviationMm: '2',
    limitedOpening: 'no',
    openingMm: '45',
    limitedBorder: 'yes',
    borderDetail: 'Slight limitation upon right lateral excursion.',
    parafunctionalHabits: ['clenching', 'bruxism'],
    habitOther: 'Occasional nail biting.',
    toothWearFactors: ['attrition', 'abrasion'],
    wearHardFoodDetail: 'Eats ice and hard nuts frequently.',
    wearOtherDetail: 'Uses hard bristle toothbrush.',

    // Esthetic Evaluation
    occlusalPlane: 'parallel',
    facialMidline: 'symmetric',
    facialMidlineMm: '0',
    lipFullness: 'average',
    lipLength: 'average',
    toothExpUpper: '3',
    toothExpLower: '1',
    nasolabialAngle: '95',
    smileLine: 'average',
    incisalCurve: 'convex',
    lipPosition: 'touching',
    teethExposed: '8',
    midlinePhiltrum: 'center',
    midlineIncisors: 'straight',
    buccalCorridor: 'normal',
    fvSound: 'yes',
    sSoundMm: '1',
    sSoundRef: 'Class I',
    lipAtRest: 'touching',
    midlineDiscrepancy: 'yes',
    midlineShiftMm: '1.5',

    // VDO Evaluation
    vdoSoftTissueContour: ['normal'],
    vdoSpeakingSpaceRef: 'S sound adequate',
    vdoBiteType: 'normal',
    vdoFreewaySpaceMm: '2.5',
    vdoNasolabialFold: 'Normal',
    vdoDroopingCommissure: 'No',
    vdoThinLips: 'No',
    closestSpeakingSpace: '1mm',
    freewaySpace: '2mm',

    // Intraoral / Ridge Evaluation
    ridgeWidth: 'Round',
    jawSize: 'Medium',
    ridgeShapeU: 'U shape',
    ridgeShapeL: 'U shape',
    ridgeRelation: 'Class I',
    ridgeParallelism: 'Parallel',
    interridgeSpace: 'Sufficient',
    lowerArchForm: 'Ovoid',
    palatalThroatForm: 'class-i',
    tonguePosition: 'Normal',
    salivaConsistency: 'normal',
    lipMobility: 'Normal',
    facialMuscleTone: 'average',
    torusPresent: ['palatinus'],
    frenumU: ['normal'],
    frenumL: ['normal'],
    ridgeDeformity: ['none'],
    exostosisDetail: 'Mild buccal exostosis in maxillary premolar region.',
    bonySpiculeDetail: 'None detected.',
    ridgeHeight: 'Adequate',
    ridgeShapeUpper: 'U-shaped',
    ridgeShapeLower: 'U-shaped',
    palatalVault: 'Medium depth',
    tongueSize: 'Normal',
    amountOfSaliva: 'Normal',
    mentalAttitude: 'Philosophical',

    // Notes
    sectionNotes: {
        'patientHistory': 'Patient is slightly anxious about dental procedures. Use topical anesthetic before injection.',
        'extraoral': 'Slight tenderness upon palpation of left masseter muscle. Likely related to clenching habit.',
        'intraoral': 'Gingiva appears slightly inflamed around #36. Deep carious lesion visible on occlusal surface of #36.',
        'esthetic': 'Patient expressed interest in minor teeth whitening after the current pain issue is resolved.'
    }
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const RadioCard = ({ label, value, currentValue, onChange, className }: { label: string, value: string, currentValue: string, onChange: (v: string) => void, className?: string }) => {
    const isSelected = currentValue === value;
    return (
        <button
            type="button"
            onClick={() => onChange(value)}
            className={cn(
                "flex items-center justify-center px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all duration-200",
                isSelected ? "border-teal-500 bg-teal-50 text-teal-800 shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50",
                className
            )}
        >
            {label}
        </button>
    );
};

const SelectCard = ({ label, subLabel, isSelected, onClick, type = 'radio' }: { label: string; subLabel?: string; isSelected: boolean; onClick: () => void; type?: 'radio' | 'checkbox' }) => (
    <div
        onClick={onClick}
        data-type={type}
        className={cn(
            "px-4 py-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center justify-center text-center select-none",
            isSelected
                ? "border-teal-500 bg-teal-50 shadow-sm"
                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
        )}
    >
        <span className={cn("text-sm font-bold", isSelected ? "text-teal-900" : "text-slate-700")}>{label}</span>
        {subLabel && <span className={cn("text-xs mt-0.5", isSelected ? "text-teal-600" : "text-slate-400")}>{subLabel}</span>}
    </div>
);

export default function SequentialPatientPage() {
    const { id: patientId, chartId } = useParams<{ id: string; chartId: string }>();
    const navigate = useNavigate();
    const { show: showToast } = useToastStore();

    const [patient, setPatient] = useState<BackendPatient | null>(null);
    const [chart, setChart] = useState<DentalChart | null>(null);
    const [images, setImages] = useState<ImageManagement[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

    const [activeSection, setActiveSection] = useState<string>('patientHistory');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [visitDate, setVisitDate] = useState<Date | undefined>(undefined);

    const [formData, setFormData] = useState<FormState>(DEFAULT_STATE);
    const [sectionNotesLoaded, setSectionNotesLoaded] = useState(false);
    const [medFormInput, setMedFormInput] = useState({
        name: '',
        dose: '',
        frequency: '',
        dosePerTime: '',
        timeOfDay: ''
    });
    const [hasMedications, setHasMedications] = useState<boolean | null>(null);

    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        const fetchChartDetails = async () => {
            if (!chartId || !patientId) return;
            try {
                setLoading(true);
                setError(null);
                
                // 1. Fetch patient details
                const patientData = await patientService.getById(patientId);
                setPatient(patientData);
                if (patientData.last_visit) {
                    setVisitDate(parseISO(patientData.last_visit));
                }

                // 2. Fetch dental chart details
                const chartData = await dentalChartService.getById(chartId);
                setChart(chartData);

                // 3. Fetch free notes attached to each chart section
                setSectionNotesLoaded(false);
                try {
                    const sectionNotes = await sectionNoteService.getByChart(chartId);
                    setFormData(prev => ({
                        ...prev,
                        sectionNotes: sectionNotes.reduce<Record<string, string>>((acc, note) => {
                            acc[note.section_id] = note.content || '';
                            return acc;
                        }, {})
                    }));
                } catch (noteErr) {
                    console.error("Failed to fetch section notes", noteErr);
                } finally {
                    setSectionNotesLoaded(true);
                }

                // 4. Fetch associated radiography images
                try {
                    const imagesData = await patientService.getChartImages(chartId);
                    setImages(imagesData);
                } catch (imgErr) {
                    console.error("Failed to fetch chart images", imgErr);
                }
            } catch (err: any) {
                console.error("Failed to retrieve chart details", err);
                const status = err?.response?.status;
                if (status === 404) {
                    showToast("Record not found. It may have been deleted.", "error");
                    setError("Record not found. It may have been deleted.");
                } else {
                    showToast("Database connection error. Cannot retrieve chart details.", "error");
                    setError("Database connection error. Cannot retrieve chart details.");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchChartDetails();
    }, [chartId, patientId, showToast]);

    useEffect(() => {
        if (!chartId || !sectionNotesLoaded) return;

        const timeoutId = window.setTimeout(() => {
            Object.entries(formData.sectionNotes).forEach(([sectionId, content]) => {
                sectionNoteService.upsert(chartId, sectionId, content).catch((err) => {
                    console.error(`Failed to save ${sectionId} note`, err);
                    showToast(`Failed to save ${sectionNames[sectionId] || 'section'} note.`, 'error');
                });
            });
        }, 700);

        return () => window.clearTimeout(timeoutId);
    }, [chartId, formData.sectionNotes, sectionNotesLoaded, showToast]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateField = (field: keyof FormState, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const toggleArrayField = (field: keyof FormState, value: string) => {
        setFormData(prev => {
            const arr = prev[field] as string[];
            if (arr.includes(value)) {
                return { ...prev, [field]: arr.filter(item => item !== value) };
            }
            return { ...prev, [field]: [...arr, value] };
        });
    };

    const isVdoLost = Number(formData.vdoFreewaySpaceMm) > 4;

    const handleSave = () => {
        showToast('Clinical charting session completed and saved.', 'success');
        navigate(`/patients/${patientId}`);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 min-h-[60vh]">
                <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-slate-500 font-semibold">Retrieving chart details...</p>
            </div>
        );
    }

    if (error || !chart || !patient) {
        return (
            <div className="flex flex-col items-center justify-center p-20 min-h-[60vh] text-center">
                <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Error Loading Chart</h2>
                <p className="text-slate-500 mb-6">{error || "Chart details could not be found."}</p>
                <button 
                    onClick={() => navigate(`/patients/${patientId}`)}
                    className="bg-slate-800 hover:bg-slate-900 text-white font-semibold py-2 px-6 rounded-xl transition-colors"
                >
                    Back to Patient Repository
                </button>
            </div>
        );
    }


    return (
        <div className="flex flex-col h-full bg-slate-50 relative">
            {/* Top Header */}
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0 shadow-sm z-10 relative">
                <div className="flex items-center gap-4 border-slate-200 pr-4">
                    <Button variant="ghost" className="p-2 h-auto text-slate-500 hover:bg-slate-100 rounded-full" onClick={() => navigate(`/patients/${patient.patient_id}`)}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex flex-col">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                            {patient.name} {chart ? `- Visit on ${format(parseISO(chart.record_date), 'PPP')}` : ''}
                        </h2>
                        <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                            <span>{patient.hn_number}</span>
                            <span>•</span>
                            <span>{patient.sex}, {patient.age}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button onClick={handleSave} className="bg-teal-600 hover:bg-teal-700 text-white shadow-md rounded-xl h-11 px-6">
                        <Save className="w-4 h-4 mr-2" />
                        Save Record
                    </Button>
                </div>
            </header>

            {/* Main Layout Area */}
            <div className="flex-1 flex overflow-hidden w-full">

                {/* Left Sidebar Menu */}
                <aside className={cn(
                    "bg-white border-r border-slate-200 flex flex-col pt-6 shrink-0 z-20 overflow-y-auto transition-all duration-300 ease-in-out",
                    isSidebarOpen ? "w-72" : "w-20 items-center"
                )}>
                    <div className={cn("flex items-center mb-4 px-4", isSidebarOpen ? "justify-between" : "justify-center")}>
                        {isSidebarOpen && <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Charting Syllabus</h3>}
                        <Button variant="ghost" size="sm" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1.5 h-auto text-slate-400 hover:text-slate-600 hover:bg-slate-100" title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}>
                            {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
                        </Button>
                    </div>
                    <div className="flex-1 px-3 space-y-1 w-full">
                        {SECTIONS.map((sec, idx) => {
                            const isActive = activeSection === sec.id;
                            return (
                                <button
                                    key={sec.id}
                                    onClick={() => setActiveSection(sec.id)}
                                    className={cn(
                                        "w-full flex items-center px-3 py-3 rounded-xl text-left text-sm font-medium transition-all group",
                                        isSidebarOpen ? "justify-between" : "justify-center",
                                        isActive
                                            ? "bg-teal-50 text-teal-700 shadow-sm border border-teal-100"
                                            : "text-slate-600 hover:bg-slate-100 border border-transparent"
                                    )}
                                    title={sec.title}
                                >
                                    <span className={cn("flex items-center", isSidebarOpen ? "gap-3" : "justify-center")}>
                                        <span className={cn(
                                            "flex items-center justify-center shrink-0 w-6 h-6 rounded-full text-xs font-bold font-mono transition-colors",
                                            isActive ? "bg-teal-600 text-white" : "bg-slate-200 text-slate-500 group-hover:bg-slate-300"
                                        )}>
                                            {idx + 1}
                                        </span>
                                        {isSidebarOpen && <span className="truncate">{sec.title}</span>}
                                    </span>
                                    {isSidebarOpen && isActive && <ChevronRight className="w-4 h-4 shrink-0" />}
                                </button>
                            )
                        })}
                    </div>
                </aside>

                {/* Dynamic Content Area */}
                <main className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-8 relative">
                    {/* 2. Patient History */}
                    {activeSection === "patientHistory" && chartId && (
                        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
                                <MedicalHistoryForm
                                    chartId={chartId}
                                    patient={patient}
                                    onEditPatient={() => navigate(`/patients/${patient.patient_id}`, { state: { openEditProfile: true } })}
                                />
                            <SectionNotes sectionId="patientHistory" formData={formData} updateField={updateField} />
                        </div>
                    )}

                    {/* 3. Extraoral Exam */}
                    {activeSection === "extraoral" && chartId && (
                        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
                            <ExtraoralExamForm chartId={chartId} />
                            <SectionNotes sectionId="extraoral" formData={formData} updateField={updateField} />
                        </div>
                    )}
                </main>
            </div>

            {selectedImageUrl && (
                <div className="fixed inset-0 z-50 bg-slate-900/95 flex items-center justify-center p-4 sm:p-8 backdrop-blur-md animate-in zoom-in-95 duration-200">
                    <Button variant="ghost" className="absolute top-4 right-4 text-white hover:bg-white/10 p-2 h-auto" onClick={() => setSelectedImageUrl(null)}>
                        <X className="w-6 h-6" />
                    </Button>
                    <img src={selectedImageUrl} alt="Preview" className="max-w-full max-h-full rounded-lg shadow-2xl object-contain" />
                </div>
            )}
        </div>
    );
}
