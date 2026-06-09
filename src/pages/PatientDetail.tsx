/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

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
import { SectionNotes } from '@/components/chart/components/SectionNotes';
import { DEFAULT_STATE, sectionNames } from '@/components/chart/types';
import type { FormState } from '@/components/chart/types';

// Extracted UI Components and SectionNotes are now in src/components/chart/components

const SECTIONS = [
    { id: 'patientHistory', title: 'Patient History' },
    { id: 'extraoral', title: 'Extraoral Exam' },
];

// Types and DEFAULT_STATE extracted to src/components/chart/types.ts

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
            <div className="flex flex-col h-screen items-center justify-center bg-slate-50">
                <div className="bg-white p-8 rounded-3xl shadow-xl border border-teal-100 flex flex-col items-center animate-in zoom-in-95 duration-300">
                    <div className="w-16 h-16 border-4 border-teal-100 border-t-teal-500 rounded-full animate-spin mb-6 shadow-sm" />
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Loading Chart</h3>
                    <p className="text-slate-500 font-medium">Retrieving patient clinical data...</p>
                </div>
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
                    <Button onClick={handleSave} className="bg-teal-500 hover:bg-teal-600 text-white shadow-md rounded-xl h-11 px-6">
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
                                            isActive ? "bg-teal-500 text-white" : "bg-slate-200 text-slate-500 group-hover:bg-slate-300"
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
                    {chartId && patient && (
                        <div className={cn("max-w-4xl mx-auto space-y-8 pb-12", activeSection === "patientHistory" ? "block" : "hidden")}>
                            <MedicalHistoryForm
                                chartId={chartId}
                                patient={patient}
                                onEditPatient={() => navigate(`/patients/${patient.patient_id}`, { state: { openEditProfile: true } })}
                            />
                            <SectionNotes sectionId="patientHistory" formData={formData} updateField={updateField} />
                        </div>
                    )}

                    {/* 3. Extraoral Exam */}
                    {chartId && (
                        <div className={cn("max-w-4xl mx-auto space-y-8 pb-12", activeSection === "extraoral" ? "block" : "hidden")}>
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
